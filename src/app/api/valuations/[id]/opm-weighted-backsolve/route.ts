import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AssumptionsExtractor } from '@/lib/services/shared/AssumptionsExtractor'
import {
  WeightedBacksolveOptimizer,
  WeightedBacksolveRequest,
  WeightedScenario,
} from '@/lib/services/opm/WeightedBacksolveOptimizer'
import { AuditTrailLogger } from '@/lib/services/comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import type { OPMBlackScholesParams } from '@/types/opm'

/**
 * POST /api/valuations/[id]/opm-weighted-backsolve
 *
 * Weighted backsolve for Hybrid PWERM:
 * - Multiple scenarios with different BS params
 * - Some scenarios have fixed enterprise values
 * - One scenario backsolves to achieve weighted target FMV
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  let valuationId: string = ''

  try {
    // Parse and validate request parameters
    const resolvedParams = await context.params
    valuationId = resolvedParams.id

    if (!valuationId || valuationId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Valuation ID is required' },
        { status: 400 }
      )
    }

    // Parse request body with error handling
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[opm-weighted-backsolve] JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    console.log('[opm-weighted-backsolve] Request:', {
      valuationId,
      scenarioCount: body.scenarios?.length,
      securityClassId: body.securityClassId,
      probabilityFormat: body.probabilityFormat,
    })

    // Comprehensive request validation
    if (!body.scenarios || !Array.isArray(body.scenarios)) {
      return NextResponse.json(
        { success: false, error: 'Scenarios array is required' },
        { status: 400 }
      )
    }

    if (body.scenarios.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 scenarios required (1 fixed + 1 backsolve minimum)' },
        { status: 400 }
      )
    }

    if (!body.securityClassId || body.securityClassId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Security class ID is required' },
        { status: 400 }
      )
    }

    // Validate backsolve scenarios
    const backsolveScenarios = body.scenarios.filter((s: any) => s.isBacksolve)
    if (backsolveScenarios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one backsolve scenario is required' },
        { status: 400 }
      )
    }

    if (backsolveScenarios.length > 1) {
      return NextResponse.json(
        { success: false, error: 'Only one backsolve scenario is allowed' },
        { status: 400 }
      )
    }

    // Validate fixed scenarios have enterprise values
    const fixedScenarios = body.scenarios.filter((s: any) => !s.isBacksolve)
    const invalidFixed = fixedScenarios.filter(
      (s: any) => !s.enterpriseValue || s.enterpriseValue <= 0
    )
    if (invalidFixed.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Fixed scenarios must have positive enterprise values. Invalid scenarios: ${invalidFixed.map((s: any) => s.name).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Get valuation
    const { data: valuation, error: valuationError } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', valuationId)
      .single()

    if (valuationError || !valuation) {
      console.error('[opm-weighted-backsolve] Valuation not found:', valuationError)
      return NextResponse.json({ success: false, error: 'Valuation not found' }, { status: 404 })
    }

    // Get share classes from database
    const { data: shareClasses, error: shareClassesError } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', valuationId)

    if (shareClassesError || !shareClasses || shareClasses.length === 0) {
      console.error('[opm-weighted-backsolve] Share classes not found:', shareClassesError)
      return NextResponse.json(
        { success: false, error: 'No share classes found for this valuation' },
        { status: 400 }
      )
    }

    // Find the selected security
    const selectedSecurity = shareClasses.find(
      (sc: any) => sc.id === body.securityClassId || sc.class_name === body.securityClassId
    )

    if (!selectedSecurity) {
      return NextResponse.json(
        { success: false, error: `Security '${body.securityClassId}' not found` },
        { status: 400 }
      )
    }

    const targetFMV = parseFloat(selectedSecurity.price_per_share) || 0

    if (targetFMV <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Security '${selectedSecurity.class_name}' has no valid price per share (${targetFMV})`,
        },
        { status: 400 }
      )
    }

    console.log('[opm-weighted-backsolve] Target:', {
      security: selectedSecurity.class_name,
      targetFMV,
    })

    // Get breakpoints data (same for all scenarios)
    let breakpointsData: any
    try {
      const breakpointsResponse = await fetch(
        `${request.nextUrl.origin}/api/valuations/${valuationId}/breakpoints`,
        {
          method: 'GET',
          headers: request.headers,
        }
      )

      if (!breakpointsResponse.ok) {
        const errorText = await breakpointsResponse.text()
        console.error('[opm-weighted-backsolve] Breakpoints fetch failed:', {
          status: breakpointsResponse.status,
          error: errorText,
        })
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch breakpoints data: ${breakpointsResponse.status} ${breakpointsResponse.statusText}`,
            details: errorText,
          },
          { status: 500 }
        )
      }

      breakpointsData = await breakpointsResponse.json()

      if (!breakpointsData.data || !Array.isArray(breakpointsData.data)) {
        console.error('[opm-weighted-backsolve] Invalid breakpoints response:', breakpointsData)
        return NextResponse.json(
          { success: false, error: 'Invalid breakpoints data structure' },
          { status: 500 }
        )
      }
    } catch (fetchError) {
      console.error('[opm-weighted-backsolve] Breakpoints fetch exception:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch breakpoints data',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 500 }
      )
    }

    // Transform breakpoints data
    const opmBreakpoints = breakpointsData.data.map((bp: any, index: number) => {
      // V3 breakpoints use 'rangeFrom' instead of 'exitValue'
      const breakpointValue = parseFloat(bp.rangeFrom || bp.exitValue || '0')

      // V3 breakpoints have 'participants' array with securityName, participationPercentage
      const allocation =
        bp.participants?.map((participant: any) => ({
          securityClass: participant.securityName,
          sharesReceived: parseFloat(participant.participatingShares) || 0,
          participationPercentage: parseFloat(participant.participationPercentage) || 0,
        })) || []

      return {
        id: `bp_${index}`,
        value: breakpointValue,
        type: bp.breakpointType || bp.type || 'unknown',
        securityClass: bp.securityClass || 'unknown',
        description:
          bp.description || `${bp.breakpointType || bp.type || 'breakpoint'} at ${breakpointValue}`,
        allocation,
      }
    })

    // Calculate total shares
    const totalShares = shareClasses.reduce(
      (sum: number, sc: any) => sum + (parseFloat(sc.shares) || 0),
      0
    )

    if (totalShares === 0) {
      return NextResponse.json(
        { success: false, error: 'No shares found in cap table' },
        { status: 400 }
      )
    }

    // Build share class totals map
    const shareClassTotals = new Map<string, number>()
    for (const sc of shareClasses) {
      shareClassTotals.set(sc.class_name, parseFloat(sc.shares) || 0)
    }

    console.log(
      '[opm-weighted-backsolve] Share class totals:',
      Object.fromEntries(shareClassTotals)
    )

    // Get assumptions from valuation_assumptions table first
    const { data: newAssumptions } = await supabase
      .from('valuation_assumptions')
      .select('*')
      .eq('valuation_id', valuationId)
      .single()

    // Prepare assumptions data
    let assumptionsData = valuation.assumptions
    if (newAssumptions) {
      const { id, valuation_id, created_at, updated_at, ...flatAssumptions } = newAssumptions
      assumptionsData = flatAssumptions
    }

    // Extract default Black-Scholes parameters
    const defaultParams = AssumptionsExtractor.extractBlackScholesParams(assumptionsData)

    // Build scenarios with their specific BS params
    const scenarios: WeightedScenario[] = body.scenarios.map((scenario: any) => {
      const blackScholesParams: OPMBlackScholesParams = {
        companyValue: 0, // Not used
        strikePrice: 0, // Not used
        timeToLiquidity: scenario.timeToLiquidity ?? defaultParams.timeToLiquidity,
        volatility: scenario.volatility ?? defaultParams.volatility,
        riskFreeRate: scenario.riskFreeRate ?? defaultParams.riskFreeRate,
        dividendYield: scenario.dividendYield ?? defaultParams.dividendYield,
      }

      return {
        name: scenario.name,
        probability: scenario.probability,
        blackScholesParams,
        enterpriseValue: scenario.enterpriseValue,
        isBacksolve: scenario.isBacksolve || false,
      }
    })

    console.log('[opm-weighted-backsolve] Scenarios:', scenarios)

    // Create audit logger
    const auditLogger = new AuditTrailLogger()
    auditLogger.start('OPM Weighted Backsolve API')

    // Build weighted backsolve request
    const weightedRequest: WeightedBacksolveRequest = {
      targetFMV,
      securityClassId: selectedSecurity.class_name,
      scenarios,
      breakpoints: opmBreakpoints,
      totalShares,
      shareClassTotals,
      probabilityFormat: body.probabilityFormat || 'percentage',
    }

    // Execute weighted backsolve
    const optimizer = new WeightedBacksolveOptimizer(auditLogger)
    const result = await optimizer.backsolve(weightedRequest)

    // Log audit trail
    const auditTrail = auditLogger.getFullLog()
    console.log('[opm-weighted-backsolve] Audit trail:', auditTrail)

    if (!result.success) {
      const executionTimeMs = Date.now() - startTime
      console.error('[opm-weighted-backsolve] Weighted backsolve failed:', {
        executionTimeMs,
        errors: result.errors,
        warnings: result.warnings,
        targetFMV: result.targetFMV,
        actualWeightedFMV: result.actualWeightedFMV,
        error: result.error,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Weighted backsolve optimization failed to converge',
          details: result.errors?.join(', '),
          warnings: result.warnings,
          metadata: {
            executionTimeMs,
            iterations: result.metadata?.iterations,
            scenarioCount: scenarios.length,
          },
        },
        { status: 500 }
      )
    }

    const executionTimeMs = Date.now() - startTime
    console.log('[opm-weighted-backsolve] Success:', {
      targetFMV: result.targetFMV,
      actualWeightedFMV: result.actualWeightedFMV,
      error: result.error,
      converged: result.converged,
      backsolveScenarioIndex: result.backsolveScenarioIndex,
      executionTimeMs,
    })

    return NextResponse.json({
      success: true,
      data: {
        targetFMV: result.targetFMV,
        actualWeightedFMV: result.actualWeightedFMV,
        error: result.error,
        converged: result.converged,
        scenarioResults: result.scenarioResults,
        backsolveScenarioIndex: result.backsolveScenarioIndex,
        metadata: {
          ...result.metadata,
          apiExecutionTimeMs: executionTimeMs,
        },
        security: {
          id: selectedSecurity.id,
          name: selectedSecurity.class_name,
          pricePerShare: targetFMV,
        },
        warnings: result.warnings,
      },
    })
  } catch (error) {
    const executionTimeMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[opm-weighted-backsolve] Unhandled exception:', {
      valuationId,
      error: errorMessage,
      stack: errorStack,
      executionTimeMs,
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: 'An unexpected error occurred during weighted backsolve calculation',
        metadata: {
          valuationId,
          executionTimeMs,
        },
      },
      { status: 500 }
    )
  }
}
