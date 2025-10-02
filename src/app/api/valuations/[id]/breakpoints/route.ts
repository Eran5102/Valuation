import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  BreakpointAnalyzer,
  DatabaseShareClass,
  DatabaseOption,
  BreakpointAnalysisResult,
} from '@/lib/services/comprehensiveWaterfall/breakpointAnalyzerV2'

// GET /api/valuations/[id]/breakpoints - Get breakpoint analysis for valuation
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('id, company_id')
      .eq('id', idParam)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Get cap table data from separate tables (not JSON column)
    const { data: dbShareClasses, error: shareError } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', idParam)
      .order('seniority', { ascending: false })

    if (shareError) {
      console.error('Error fetching share classes for breakpoints:', shareError)
      return NextResponse.json({ error: 'Failed to fetch share classes' }, { status: 500 })
    }

    const { data: dbOptions, error: optionsError } = await supabase
      .from('options_warrants')
      .select('*')
      .eq('valuation_id', idParam)

    if (optionsError) {
      console.error('Error fetching options for breakpoints:', optionsError)
      return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
    }

    // Transform database format to analyzer format
    const shareClasses: DatabaseShareClass[] = (dbShareClasses || []).map((sc) => ({
      id: sc.id,
      companyId: valuation.company_id,
      shareType: sc.type?.toLowerCase() === 'common' ? 'common' : 'preferred',
      name: sc.class_name,
      roundDate: sc.round_date,
      sharesOutstanding: sc.shares || 0,
      pricePerShare: sc.price_per_share || 0,
      preferenceType:
        sc.preference_type === 'Non-Participating'
          ? 'non-participating'
          : sc.preference_type === 'Participating'
            ? 'participating'
            : 'participating-with-cap',
      lpMultiple: sc.liquidation_multiple || 1,
      seniority: sc.seniority || 0,
      participationCap: sc.participation_cap || 0,
      conversionRatio: sc.conversion_ratio || 1,
      dividendsDeclared: sc.dividends_declared || false,
      dividendsRate: sc.div_rate || 0,
      dividendsType: sc.dividends_type === 'Cumulative' ? 'cumulative' : 'non-cumulative',
      pik: sc.pik || false,
    }))

    const options: DatabaseOption[] = (dbOptions || []).map((opt) => ({
      id: opt.id,
      numOptions: opt.num_options || 0,
      exercisePrice: opt.exercise_price || 0,
      type: opt.type || 'Options',
    }))

    // Perform breakpoint analysis using V2 analyzer
    const analyzer = new BreakpointAnalyzer(shareClasses, options)
    const analysisResult: BreakpointAnalysisResult = analyzer.analyzeCompleteBreakpointStructure()

    // Convert Decimal objects to numbers for JSON serialization
    const serializedResult = {
      totalBreakpoints: analysisResult.totalBreakpoints,
      breakpointsByType: analysisResult.breakpointsByType,
      sortedBreakpoints: analysisResult.sortedBreakpoints.map((bp) => ({
        breakpointType: bp.breakpointType,
        exitValue: bp.exitValue.toNumber(),
        affectedSecurities: bp.affectedSecurities,
        calculationMethod: bp.calculationMethod,
        priorityOrder: bp.priorityOrder,
        explanation: bp.explanation,
        mathematicalDerivation: bp.mathematicalDerivation,
        dependencies: bp.dependencies,
      })),
      criticalValues: analysisResult.criticalValues.map((cv) => ({
        value: cv.value.toNumber(),
        description: cv.description,
        affectedSecurities: cv.affectedSecurities,
        triggers: cv.triggers,
      })),
      auditSummary: analysisResult.auditSummary,
      validationResults: analysisResult.validationResults,
      performanceMetrics: analysisResult.performanceMetrics,
    }

    return NextResponse.json({
      success: true,
      data: serializedResult,
      valuation_id: valuation.id,
      company_id: valuation.company_id,
      analysis_timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform breakpoint analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/valuations/[id]/breakpoints - Force refresh breakpoint analysis
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('id, company_id')
      .eq('id', idParam)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Optional: Accept custom parameters for analysis
    const { includeOptions = true, customExitValues = [], analysisType = 'comprehensive' } = body

    // Get the most current cap table data from separate tables
    const { data: dbShareClasses, error: shareError } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', idParam)
      .order('seniority', { ascending: false })

    if (shareError) {
      console.error('Error fetching share classes for breakpoints:', shareError)
      return NextResponse.json({ error: 'Failed to fetch share classes' }, { status: 500 })
    }

    const { data: dbOptions, error: optionsError } = await supabase
      .from('options_warrants')
      .select('*')
      .eq('valuation_id', idParam)

    if (optionsError) {
      console.error('Error fetching options for breakpoints:', optionsError)
      return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
    }

    // Transform database format to analyzer format
    const shareClasses: DatabaseShareClass[] = (dbShareClasses || []).map((sc) => ({
      id: sc.id,
      companyId: valuation.company_id,
      shareType: sc.type?.toLowerCase() === 'common' ? 'common' : 'preferred',
      name: sc.class_name,
      roundDate: sc.round_date,
      sharesOutstanding: sc.shares || 0,
      pricePerShare: sc.price_per_share || 0,
      preferenceType:
        sc.preference_type === 'Non-Participating'
          ? 'non-participating'
          : sc.preference_type === 'Participating'
            ? 'participating'
            : 'participating-with-cap',
      lpMultiple: sc.liquidation_multiple || 1,
      seniority: sc.seniority || 0,
      participationCap: sc.participation_cap || 0,
      conversionRatio: sc.conversion_ratio || 1,
      dividendsDeclared: sc.dividends_declared || false,
      dividendsRate: sc.div_rate || 0,
      dividendsType: sc.dividends_type === 'Cumulative' ? 'cumulative' : 'non-cumulative',
      pik: sc.pik || false,
    }))

    let options: DatabaseOption[] = []
    if (includeOptions) {
      options = (dbOptions || []).map((opt) => ({
        id: opt.id,
        numOptions: opt.num_options || 0,
        exercisePrice: opt.exercise_price || 0,
        type: opt.type || 'Options',
      }))
    }

    // Perform fresh analysis using V2 analyzer
    const analyzer = new BreakpointAnalyzer(shareClasses, options)
    const analysisResult: BreakpointAnalysisResult = analyzer.analyzeCompleteBreakpointStructure()

    // Convert Decimal objects to numbers for JSON serialization
    const serializedResult = {
      totalBreakpoints: analysisResult.totalBreakpoints,
      breakpointsByType: analysisResult.breakpointsByType,
      sortedBreakpoints: analysisResult.sortedBreakpoints.map((bp) => ({
        breakpointType: bp.breakpointType,
        exitValue: bp.exitValue.toNumber(),
        affectedSecurities: bp.affectedSecurities,
        calculationMethod: bp.calculationMethod,
        priorityOrder: bp.priorityOrder,
        explanation: bp.explanation,
        mathematicalDerivation: bp.mathematicalDerivation,
        dependencies: bp.dependencies,
      })),
      criticalValues: analysisResult.criticalValues.map((cv) => ({
        value: cv.value.toNumber(),
        description: cv.description,
        affectedSecurities: cv.affectedSecurities,
        triggers: cv.triggers,
      })),
      auditSummary: analysisResult.auditSummary,
      validationResults: analysisResult.validationResults,
      performanceMetrics: analysisResult.performanceMetrics,
    }

    return NextResponse.json({
      success: true,
      data: serializedResult,
      valuation_id: valuation.id,
      company_id: valuation.company_id,
      analysis_timestamp: new Date().toISOString(),
      analysis_parameters: {
        includeOptions,
        customExitValues,
        analysisType,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform breakpoint analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
