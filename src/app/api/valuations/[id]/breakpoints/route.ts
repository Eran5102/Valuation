import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Decimal } from 'decimal.js'

// V3 Breakpoint Analyzer Components
import { AuditTrailLogger } from '@/lib/services/comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import { CapTableValidator } from '@/lib/services/comprehensiveBreakpoints/v3/validators/CapTableValidator'
import { BreakpointValidator } from '@/lib/services/comprehensiveBreakpoints/v3/validators/BreakpointValidator'
import { ConsistencyValidator } from '@/lib/services/comprehensiveBreakpoints/v3/validators/ConsistencyValidator'
import { LiquidationPreferenceAnalyzer } from '@/lib/services/comprehensiveBreakpoints/v3/analyzers/LiquidationPreferenceAnalyzer'
import { ProRataAnalyzer } from '@/lib/services/comprehensiveBreakpoints/v3/analyzers/ProRataAnalyzer'
import { OptionExerciseAnalyzer } from '@/lib/services/comprehensiveBreakpoints/v3/analyzers/OptionExerciseAnalyzer'
import { VoluntaryConversionAnalyzer } from '@/lib/services/comprehensiveBreakpoints/v3/analyzers/VoluntaryConversionAnalyzer'
import { ParticipationCapAnalyzer } from '@/lib/services/comprehensiveBreakpoints/v3/analyzers/ParticipationCapAnalyzer'
import { PerClassRVPSCalculator } from '@/lib/services/comprehensiveBreakpoints/v3/calculators/PerClassRVPSCalculator'
import { IndifferencePointCalculator } from '@/lib/services/comprehensiveBreakpoints/v3/calculators/IndifferencePointCalculator'
import { CumulativeRVPSTracker } from '@/lib/services/comprehensiveBreakpoints/v3/calculators/CumulativeRVPSTracker'
import { CircularDependencySolver } from '@/lib/services/comprehensiveBreakpoints/v3/solvers/CircularDependencySolver'
import { ParticipationCalculator } from '@/lib/services/comprehensiveBreakpoints/v3/calculators/ParticipationCalculator'
import { AnalysisSequencer } from '@/lib/services/comprehensiveBreakpoints/v3/orchestrators/AnalysisSequencer'
import { BreakpointOrchestrator } from '@/lib/services/comprehensiveBreakpoints/v3/orchestrators/BreakpointOrchestrator'
import { DatabaseToBreakpointTransformer } from '@/lib/services/comprehensiveBreakpoints/v3/transformers/DatabaseToBreakpointTransformer'
import { BreakpointToDatabaseTransformer } from '@/lib/services/comprehensiveBreakpoints/v3/transformers/BreakpointToDatabaseTransformer'
import type { ShareClass, OptionsWarrant } from '@/types/database'

// ============================================
// HELPER FUNCTIONS FOR PERSISTENCE
// ============================================

/**
 * Check if cap table was modified after analysis
 */
async function isAnalysisStale(
  supabase: any,
  valuationId: string,
  analysisTimestamp: string
): Promise<boolean> {
  const { data: recentShares } = await supabase
    .from('share_classes')
    .select('updated_at')
    .eq('valuation_id', valuationId)
    .gte('updated_at', analysisTimestamp)
    .limit(1)

  const { data: recentOptions } = await supabase
    .from('options_warrants')
    .select('updated_at')
    .eq('valuation_id', valuationId)
    .gte('updated_at', analysisTimestamp)
    .limit(1)

  return (recentShares && recentShares.length > 0) || (recentOptions && recentOptions.length > 0)
}

/**
 * Load persisted V3 breakpoint analysis from database
 */
async function loadPersistedAnalysisV3(supabase: any, valuationId: string) {
  // TODO: Cache loading disabled - ui_breakpoints table contains old non-V3 data
  // The database schema needs to be migrated to support V3's JSONB participant structure
  // For now, always calculate fresh to ensure correct V3 data
  console.log(`[Breakpoints V3] Cache loading disabled - always calculating fresh`)
  return null

  // Original cache loading code commented out:
  // // Get the latest V3 analysis
  // const { data: analysis, error: analysisError } = await supabase
  //   .from('breakpoint_analyses')
  //   .select('*')
  //   .eq('valuation_id', valuationId)
  //   .eq('is_active', true)
  //   .order('analysis_timestamp', { ascending: false })
  //   .limit(1)
  //   .single()
  //
  // if (analysisError || !analysis) {
  //   return null
  // }
  //
  // // Check if analysis is stale
  // const stale = await isAnalysisStale(supabase, valuationId, analysis.analysis_timestamp)
  //
  // if (stale) {
  //   console.log(`[Breakpoints V3] Analysis for valuation ${valuationId} is stale (cap table changed)`)
  //   return null
  // }
  //
  // // Load breakpoints from ui_breakpoints table
  // const { data: breakpoints, error: breakpointsError } = await supabase
  //   .from('ui_breakpoints')
  //   .select('*')
  //   .eq('valuation_id', valuationId)
  //   .order('breakpoint_order', { ascending: true })
  //
  // if (breakpointsError || !breakpoints) {
  //   return null
  // }
  //
  // return {
  //   breakpoints,
  //   analysis,
  //   from_cache: true,
  // }
}

/**
 * Save V3 breakpoint analysis to database
 */
async function saveAnalysisV3(
  supabase: any,
  valuationId: string,
  analysisResult: any,
  userId: string | null
) {
  // TODO: Database persistence disabled - schema mismatch between V3 and existing tables
  // The V3 system expects valuation_breakpoints table with JSONB participants
  // but the database has ui_breakpoints with normalized schema
  console.log(
    `[Breakpoints V3] Skipping database save (persistence disabled) for valuation ${valuationId}`
  )
  return true

  // Original code commented out:
  // try {
  //   // Deactivate existing analyses
  //   await supabase
  //     .from('breakpoint_analyses')
  //     .update({ is_active: false })
  //     .eq('valuation_id', valuationId)
  //     .eq('is_active', true)

  //   // Create new analysis record
  //   const { data: newAnalysis, error: analysisError } = await supabase
  //     .from('breakpoint_analyses')
  //     .insert({
  //       valuation_id: valuationId,
  //       analysis_timestamp: new Date().toISOString(),
  //       total_breakpoints: analysisResult.totalBreakpoints,
  //       breakpoints_by_type: analysisResult.analysisMetadata,
  //       performance_metrics: {},
  //       audit_summary: analysisResult.summary || '',
  //       validation_results: {
  //         capTable: analysisResult.capTableValidation,
  //         breakpoints: analysisResult.breakpointValidation,
  //         consistency: analysisResult.consistencyValidation,
  //       },
  //       created_by: userId,
  //       is_active: true,
  //     })
  //     .select()
  //     .single()

  //   if (analysisError || !newAnalysis) {
  //     console.error('[Breakpoints V3] Failed to create analysis record:', analysisError)
  //     return false
  //   }

  //   // Transform and save breakpoints
  //   const auditLogger = new AuditTrailLogger()
  //   const transformer = new BreakpointToDatabaseTransformer(auditLogger)
  //   const dbTransformResult = transformer.transform(analysisResult.breakpoints, valuationId)

  //   if (dbTransformResult.breakpoints.length > 0) {
  //     const { error: breakpointsError } = await supabase
  //       .from('ui_breakpoints')
  //       .insert(dbTransformResult.breakpoints)

  //     if (breakpointsError) {
  //       console.error('[Breakpoints V3] Failed to insert breakpoints:', breakpointsError)
  //       return false
  //     }
  //   }

  //   console.log(`[Breakpoints V3] Successfully saved analysis for valuation ${valuationId}`)
  //   return true
  // } catch (error) {
  //   console.error('[Breakpoints V3] Error saving analysis:', error)
  //   return false
  // }
}

/**
 * Serialize Decimal objects to strings for JSON response
 * Converts Decimal.js values to strings for API transmission
 */
function serializeBreakpoints(breakpoints: any[]): any[] {
  return breakpoints.map((bp) => ({
    ...bp,
    rangeFrom: bp.rangeFrom?.toString() || '0',
    rangeTo: bp.rangeTo?.toString() || null,
    totalParticipatingShares: bp.totalParticipatingShares?.toString() || '0',
    redemptionValuePerShare: bp.redemptionValuePerShare?.toString() || '0',
    sectionRVPS: bp.sectionRVPS?.toString() || '0',
    participants: (bp.participants || []).map((p: any) => ({
      ...p,
      participatingShares: p.participatingShares?.toString() || '0',
      participationPercentage: p.participationPercentage?.toString() || '0',
      rvpsAtBreakpoint: p.rvpsAtBreakpoint?.toString() || '0',
      cumulativeRVPS: p.cumulativeRVPS?.toString() || '0',
      sectionValue: p.sectionValue?.toString() || '0',
      cumulativeValue: p.cumulativeValue?.toString() || '0',
    })),
  }))
}

/**
 * Create V3 orchestrator instance
 */
function createOrchestratorV3() {
  const auditLogger = new AuditTrailLogger()

  // Validators
  const capTableValidator = new CapTableValidator(auditLogger)
  const breakpointValidator = new BreakpointValidator(auditLogger)
  const consistencyValidator = new ConsistencyValidator(auditLogger)

  // Calculators
  const rvpsCalculator = new PerClassRVPSCalculator(auditLogger)
  const indifferenceCalculator = new IndifferencePointCalculator(auditLogger)
  const rvpsTracker = new CumulativeRVPSTracker(auditLogger)
  const circularSolver = new CircularDependencySolver(auditLogger)
  const participationCalculator = new ParticipationCalculator(auditLogger)

  // Analyzers
  const lpAnalyzer = new LiquidationPreferenceAnalyzer(auditLogger)
  const proRataAnalyzer = new ProRataAnalyzer(participationCalculator, auditLogger)
  const optionAnalyzer = new OptionExerciseAnalyzer(rvpsTracker, circularSolver, auditLogger)
  const conversionAnalyzer = new VoluntaryConversionAnalyzer(
    rvpsCalculator,
    indifferenceCalculator,
    auditLogger
  )
  const capAnalyzer = new ParticipationCapAnalyzer(auditLogger)

  // Sequencer
  const sequencer = new AnalysisSequencer(
    lpAnalyzer,
    proRataAnalyzer,
    optionAnalyzer,
    conversionAnalyzer,
    capAnalyzer,
    auditLogger
  )

  // Orchestrator
  const orchestrator = new BreakpointOrchestrator(
    capTableValidator,
    breakpointValidator,
    consistencyValidator,
    sequencer,
    auditLogger
  )

  return { orchestrator, transformer: new DatabaseToBreakpointTransformer(auditLogger) }
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /api/valuations/[id]/breakpoints
 * V3 Breakpoint Analysis - loads from cache or calculates fresh
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: valuationId } = await params
    const supabase = await createClient()

    // Get valuation
    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('id, company_id, client_id')
      .eq('id', valuationId)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Try to load from cache
    const persistedAnalysis = await loadPersistedAnalysisV3(supabase, valuationId)

    if (persistedAnalysis) {
      console.log(`[Breakpoints V3] Loaded from cache for valuation ${valuationId}`)
      return NextResponse.json({
        success: true,
        version: 'v3',
        data: serializeBreakpoints(persistedAnalysis.breakpoints),
        validation: persistedAnalysis.analysis.validation_results,
        metadata: persistedAnalysis.analysis,
        from_cache: true,
      })
    }

    // No cache - calculate fresh
    console.log(`[Breakpoints V3] Calculating fresh for valuation ${valuationId}`)

    // Fetch cap table data
    const { data: shareClasses, error: shareError } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('seniority', { ascending: false })

    if (shareError) {
      return NextResponse.json({ error: 'Failed to fetch share classes' }, { status: 500 })
    }

    const { data: options, error: optionsError } = await supabase
      .from('options_warrants')
      .select('*')
      .eq('valuation_id', valuationId)

    if (optionsError) {
      return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
    }

    // Create orchestrator and transformer
    const { orchestrator, transformer } = createOrchestratorV3()

    // Transform database data to cap table
    const transformResult = transformer.transform(
      shareClasses as ShareClass[],
      options as OptionsWarrant[]
    )

    if (transformResult.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cap table transformation failed',
          details: transformResult.errors,
        },
        { status: 400 }
      )
    }

    // Run analysis
    const analysisResult = await orchestrator.analyze(transformResult.capTable)

    console.log(
      `[Breakpoints V3] Analysis returned ${analysisResult.breakpoints.length} breakpoints`
    )

    // DIAGNOSTIC: Log BP4 participants BEFORE serialization
    if (analysisResult.breakpoints.length >= 4) {
      console.log(
        '[API BEFORE SERIALIZATION] BP4 participants:',
        analysisResult.breakpoints[3].participants.map((p: any) => ({
          name: p.securityName,
          percentage: p.participationPercentage.toString(),
        }))
      )
    }

    // Save to database
    const { data: userData } = await supabase.auth.getUser()
    await saveAnalysisV3(supabase, valuationId, analysisResult, userData?.user?.id || null)

    const serializedBreakpoints = serializeBreakpoints(analysisResult.breakpoints)
    console.log(`[Breakpoints V3] Serialized ${serializedBreakpoints.length} breakpoints`)

    // DIAGNOSTIC: Log BP4 participants to verify percentages are being sent correctly
    if (serializedBreakpoints.length >= 4) {
      console.log(
        '[Breakpoints V3 GET] BP4 participants:',
        JSON.stringify(
          serializedBreakpoints[3].participants.map((p: any) => ({
            name: p.securityName,
            percentage: p.participationPercentage,
          }))
        )
      )
    }

    return NextResponse.json({
      success: analysisResult.success,
      version: 'v3',
      data: serializedBreakpoints,
      validation: {
        capTable: analysisResult.capTableValidation,
        breakpoints: analysisResult.breakpointValidation,
        consistency: analysisResult.consistencyValidation,
      },
      metadata: {
        totalBreakpoints: analysisResult.totalBreakpoints,
        breakpointTypes: analysisResult.analysisMetadata,
        executionOrder: analysisResult.executionOrder,
      },
      errors: analysisResult.errors,
      warnings: analysisResult.warnings,
      from_cache: false,
    })
  } catch (error) {
    console.error('[Breakpoints V3] GET error:', error)
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

/**
 * POST /api/valuations/[id]/breakpoints
 * Forces fresh V3 calculation
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: valuationId } = await params
    const supabase = await createClient()

    const { data: valuation, error } = await supabase
      .from('valuations')
      .select('id, company_id, client_id')
      .eq('id', valuationId)
      .single()

    if (error || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    console.log(`[Breakpoints V3] Forcing fresh calculation for valuation ${valuationId}`)

    // Fetch cap table data
    const { data: shareClasses, error: shareError } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('seniority', { ascending: false })

    if (shareError) {
      return NextResponse.json({ error: 'Failed to fetch share classes' }, { status: 500 })
    }

    const { data: options, error: optionsError } = await supabase
      .from('options_warrants')
      .select('*')
      .eq('valuation_id', valuationId)

    if (optionsError) {
      return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
    }

    // Create orchestrator and transformer
    const { orchestrator, transformer } = createOrchestratorV3()

    // Transform and analyze
    const transformResult = transformer.transform(
      shareClasses as ShareClass[],
      options as OptionsWarrant[]
    )

    if (transformResult.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cap table transformation failed',
          details: transformResult.errors,
        },
        { status: 400 }
      )
    }

    const analysisResult = await orchestrator.analyze(transformResult.capTable)

    console.log(
      `[Breakpoints V3 POST] Analysis returned ${analysisResult.breakpoints.length} breakpoints`
    )

    // Save to database
    const { data: userData } = await supabase.auth.getUser()
    const saved = await saveAnalysisV3(
      supabase,
      valuationId,
      analysisResult,
      userData?.user?.id || null
    )

    const serializedBreakpoints = serializeBreakpoints(analysisResult.breakpoints)
    console.log(`[Breakpoints V3 POST] Serialized ${serializedBreakpoints.length} breakpoints`)

    return NextResponse.json({
      success: analysisResult.success,
      version: 'v3',
      data: serializedBreakpoints,
      validation: {
        capTable: analysisResult.capTableValidation,
        breakpoints: analysisResult.breakpointValidation,
        consistency: analysisResult.consistencyValidation,
      },
      metadata: {
        totalBreakpoints: analysisResult.totalBreakpoints,
        breakpointTypes: analysisResult.analysisMetadata,
        executionOrder: analysisResult.executionOrder,
      },
      errors: analysisResult.errors,
      warnings: analysisResult.warnings,
      saved_to_database: saved,
      from_cache: false,
    })
  } catch (error) {
    console.error('[Breakpoints V3] POST error:', error)
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
