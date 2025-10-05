import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AssumptionsExtractor } from '@/lib/services/shared/AssumptionsExtractor'
import { BacksolveOptimizer, BacksolveRequest } from '@/lib/services/opm/BacksolveOptimizer'
import { AuditTrailLogger } from '@/lib/services/comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import type { OPMBlackScholesParams } from '@/types/opm'

/**
 * POST /api/valuations/[id]/opm-reverse-backsolve
 *
 * Reverse backsolve: Given a security and its price from cap table,
 * find the enterprise value that produces that price using OPM
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
      console.error('[opm-reverse-backsolve] JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    console.log('[opm-reverse-backsolve] Request:', {
      valuationId,
      securityClassId: body.securityClassId,
      hasOverrides: !!(
        body.volatility ||
        body.riskFreeRate ||
        body.timeToLiquidity ||
        body.dividendYield
      ),
    })

    // Validate required fields
    if (!body.securityClassId || body.securityClassId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Security class ID is required' },
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
      console.error('[opm-reverse-backsolve] Valuation not found:', valuationError)
      return NextResponse.json({ success: false, error: 'Valuation not found' }, { status: 404 })
    }

    // Get share classes from database
    const { data: shareClasses, error: shareClassesError } = await supabase
      .from('share_classes')
      .select('*')
      .eq('valuation_id', valuationId)

    if (shareClassesError || !shareClasses || shareClasses.length === 0) {
      console.error('[opm-reverse-backsolve] Share classes not found:', shareClassesError)
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

    console.log('[opm-reverse-backsolve] Target:', {
      security: selectedSecurity.class_name,
      targetFMV,
    })

    // Get breakpoints data
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
        console.error('[opm-reverse-backsolve] Breakpoints fetch failed:', {
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
        console.error('[opm-reverse-backsolve] Invalid breakpoints response:', breakpointsData)
        return NextResponse.json(
          { success: false, error: 'Invalid breakpoints data structure' },
          { status: 500 }
        )
      }
    } catch (fetchError) {
      console.error('[opm-reverse-backsolve] Breakpoints fetch exception:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch breakpoints data',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 500 }
      )
    }

    // Get assumptions from valuation_assumptions table first
    const { data: newAssumptions } = await supabase
      .from('valuation_assumptions')
      .select('*')
      .eq('valuation_id', valuationId)
      .single()

    // Remove metadata fields if found in new table
    let assumptionsData = valuation.assumptions
    if (newAssumptions) {
      const { id, valuation_id, created_at, updated_at, ...flatAssumptions } = newAssumptions
      assumptionsData = flatAssumptions
    }

    // Extract Black-Scholes parameters (supports both old and new formats)
    const extractedParams = AssumptionsExtractor.extractBlackScholesParams(assumptionsData)

    // Merge with any overrides from request
    const blackScholesParams: OPMBlackScholesParams = {
      companyValue: 0, // Will be backsolved
      strikePrice: 0, // Not used in backsolve
      timeToLiquidity: body.timeToLiquidity ?? extractedParams.timeToLiquidity,
      volatility: body.volatility ?? extractedParams.volatility,
      riskFreeRate: body.riskFreeRate ?? extractedParams.riskFreeRate,
      dividendYield: body.dividendYield ?? extractedParams.dividendYield,
    }

    console.log('[opm-reverse-backsolve] Black-Scholes params:', blackScholesParams)

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

    console.log(
      '[opm-reverse-backsolve] Transformed breakpoints:',
      JSON.stringify(opmBreakpoints, null, 2)
    )

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

    console.log('[opm-reverse-backsolve] Share class totals:', Object.fromEntries(shareClassTotals))

    // Create audit logger
    const auditLogger = new AuditTrailLogger()
    auditLogger.start('OPM Reverse Backsolve API')

    // Build backsolve request
    const backsolveRequest: BacksolveRequest = {
      targetFMV,
      securityClassId: selectedSecurity.class_name, // Use class_name for matching
      blackScholesParams,
      breakpoints: opmBreakpoints,
      totalShares,
      shareClassTotals,
    }

    // Execute backsolve
    const optimizer = new BacksolveOptimizer(auditLogger)
    const result = await optimizer.backsolve(backsolveRequest)

    // Log audit trail
    const auditTrail = auditLogger.getFullLog()
    console.log('[opm-reverse-backsolve] Audit trail:', auditTrail)

    if (!result.success) {
      const executionTimeMs = Date.now() - startTime
      console.error('[opm-reverse-backsolve] Backsolve failed:', {
        executionTimeMs,
        errors: result.errors,
        warnings: result.warnings,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Backsolve optimization failed to converge',
          details: result.errors?.join(', '),
          warnings: result.warnings,
          metadata: {
            executionTimeMs,
            iterations: result.iterations,
          },
        },
        { status: 500 }
      )
    }

    const executionTimeMs = Date.now() - startTime
    console.log('[opm-reverse-backsolve] Success:', {
      enterpriseValue: result.enterpriseValue,
      targetFMV,
      actualFMV: result.actualFMV,
      error: result.error,
      converged: result.converged,
      executionTimeMs,
    })

    return NextResponse.json({
      success: true,
      data: {
        enterpriseValue: result.enterpriseValue,
        targetFMV,
        actualFMV: result.actualFMV,
        error: result.error,
        converged: result.converged,
        iterations: result.iterations,
        method: result.method,
        allocation: result.allocation,
        metadata: {
          ...result.metadata,
          apiExecutionTimeMs: executionTimeMs,
        },
        security: {
          id: selectedSecurity.id,
          name: selectedSecurity.class_name,
          pricePerShare: targetFMV,
        },
      },
    })
  } catch (error) {
    const executionTimeMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[opm-reverse-backsolve] Unhandled exception:', {
      valuationId,
      error: errorMessage,
      stack: errorStack,
      executionTimeMs,
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: 'An unexpected error occurred during OPM reverse backsolve calculation',
        metadata: {
          valuationId,
          executionTimeMs,
        },
      },
      { status: 500 }
    )
  }
}
