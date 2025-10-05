import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AssumptionsExtractor } from '@/lib/services/shared/AssumptionsExtractor'
import { ScenarioOrchestrator } from '@/lib/services/opm/ScenarioOrchestrator'
import { AuditTrailLogger } from '@/lib/services/comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import type { HybridPWERMAPIRequest, HybridPWERMAPIResponse } from '@/types/opm'

/**
 * POST /api/valuations/[id]/opm-hybrid
 *
 * Execute Hybrid Scenario PWERM analysis
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const { id: valuationId } = resolvedParams
    const body: HybridPWERMAPIRequest = await request.json()
    const supabase = await createClient()

    // Validate request
    if (!body.scenarios || body.scenarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one scenario is required' },
        { status: 400 }
      )
    }

    if (!body.securityClassId) {
      return NextResponse.json(
        { success: false, error: 'Security class ID is required' },
        { status: 400 }
      )
    }

    // Get valuation with assumptions
    const { data: valuation, error: valuationError } = await supabase
      .from('valuations')
      .select('*, cap_table_snapshot')
      .eq('id', valuationId)
      .single()

    if (valuationError || !valuation) {
      return NextResponse.json({ success: false, error: 'Valuation not found' }, { status: 404 })
    }

    // Get breakpoints data
    const breakpointsResponse = await fetch(
      `${request.nextUrl.origin}/api/valuations/${valuationId}/breakpoints`,
      {
        method: 'GET',
        headers: request.headers,
      }
    )

    if (!breakpointsResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch breakpoints data' },
        { status: 500 }
      )
    }

    const breakpointsData = await breakpointsResponse.json()

    // Extract assumptions (use provided params or extract from assumptions)
    const extractedParams = AssumptionsExtractor.extractBlackScholesParams(valuation.assumptions)

    // Merge global params with extracted params
    const globalBlackScholesParams = {
      companyValue: 0, // Not used in hybrid mode
      strikePrice: 0, // Not used in hybrid mode
      timeToLiquidity:
        body.globalBlackScholesParams?.timeToLiquidity ?? extractedParams.timeToLiquidity,
      volatility: body.globalBlackScholesParams?.volatility ?? extractedParams.volatility,
      riskFreeRate: body.globalBlackScholesParams?.riskFreeRate ?? extractedParams.riskFreeRate,
      dividendYield: body.globalBlackScholesParams?.dividendYield ?? extractedParams.dividendYield,
    }

    // Transform breakpoints data for OPM
    const globalBreakpoints = breakpointsData.data.sortedBreakpoints.map(
      (bp: any, index: number) => {
        // V3 breakpoints have 'participants' array with securityName, participationPercentage
        const allocation =
          bp.participants?.map((participant: any) => ({
            securityClass: participant.securityName,
            sharesReceived: parseFloat(participant.participatingShares) || 0,
            participationPercentage: parseFloat(participant.participationPercentage) || 0,
          })) || []

        return {
          id: `bp_${index}`,
          value: bp.exitValue?.toNumber
            ? bp.exitValue.toNumber()
            : parseFloat(bp.rangeFrom || bp.exitValue || '0'),
          type: bp.breakpointType,
          securityClass: bp.securityClass || 'unknown',
          description: bp.description || `${bp.breakpointType} at ${bp.exitValue || bp.rangeFrom}`,
          allocation,
        }
      }
    )

    // Calculate total shares
    const capTable = valuation.cap_table_snapshot || valuation.cap_table
    let totalShares = 0
    if (capTable?.shareClasses) {
      totalShares = capTable.shareClasses.reduce(
        (sum: number, sc: any) => sum + (sc.sharesOutstanding || 0),
        0
      )
    }

    if (totalShares === 0) {
      return NextResponse.json(
        { success: false, error: 'No shares found in cap table' },
        { status: 400 }
      )
    }

    // Create audit logger
    const auditLogger = new AuditTrailLogger()
    auditLogger.start('Hybrid PWERM API')

    // Create orchestrator
    const orchestrator = new ScenarioOrchestrator(auditLogger)

    // Build request
    const hybridRequest = {
      securityClassId: body.securityClassId,
      scenarios: body.scenarios,
      globalBlackScholesParams,
      globalBreakpoints,
      totalShares,
      probabilityFormat: body.probabilityFormat,
      targetWeightedFMV: body.targetWeightedFMV,
    }

    // Execute hybrid analysis
    const result = await orchestrator.executeHybrid(hybridRequest)

    // Log audit trail
    const auditTrail = auditLogger.getFullLog()
    console.log('Hybrid PWERM Audit Trail:', auditTrail)

    // Store result in database (optional)
    if (body.saveResults !== false) {
      await supabase
        .from('valuations')
        .update({
          opm_hybrid_result: result,
          updated_at: new Date().toISOString(),
        })
        .eq('id', valuationId)
    }

    const response: HybridPWERMAPIResponse = {
      success: true,
      data: result,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Hybrid PWERM API Error:', error)

    const response: HybridPWERMAPIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }

    return NextResponse.json(response, { status: 500 })
  }
}

/**
 * GET /api/valuations/[id]/opm-hybrid
 *
 * Get saved hybrid PWERM result
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const { id: valuationId } = resolvedParams
    const supabase = await createClient()

    // Get valuation with saved hybrid result
    const { data: valuation, error: valuationError } = await supabase
      .from('valuations')
      .select('opm_hybrid_result')
      .eq('id', valuationId)
      .single()

    if (valuationError || !valuation) {
      return NextResponse.json({ success: false, error: 'Valuation not found' }, { status: 404 })
    }

    const response: HybridPWERMAPIResponse = {
      success: true,
      data: valuation.opm_hybrid_result || null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get Hybrid PWERM Error:', error)

    const response: HybridPWERMAPIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }

    return NextResponse.json(response, { status: 500 })
  }
}
