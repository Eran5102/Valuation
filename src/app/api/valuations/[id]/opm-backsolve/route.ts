import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  OPMCalculator,
  BlackScholesParams,
  BreakpointData,
} from '@/lib/services/opmBacksolve/opmCalculator'

// OPM Backsolve API endpoints
// POST /api/valuations/[id]/opm-backsolve - Calculate OPM backsolve
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const { id: idParam } = resolvedParams
    const body = await request.json()
    const supabase = await createClient()

    // Get valuation data with assumptions
    const { data: valuation, error: valuationError } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', idParam)
      .single()

    if (valuationError || !valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 })
    }

    // Get breakpoints data
    const breakpointsResponse = await fetch(
      `${request.nextUrl.origin}/api/valuations/${idParam}/breakpoints`,
      {
        method: 'GET',
        headers: request.headers,
      }
    )

    if (!breakpointsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch breakpoints data' }, { status: 500 })
    }

    const breakpointsData = await breakpointsResponse.json()

    // Extract assumptions from valuation
    const assumptions = valuation.assumptions || []

    // Find the required assumptions - searching through all categories
    let volatility = 0.6 // Default 60%
    let riskFreeRate = 0.045 // Default 4.5%
    let timeToLiquidity = 3 // Default 3 years

    if (Array.isArray(assumptions)) {
      assumptions.forEach((category: any) => {
        if (category.assumptions && Array.isArray(category.assumptions)) {
          category.assumptions.forEach((assumption: any) => {
            if (assumption.id === 'equity_volatility' && assumption.value) {
              volatility = parseFloat(assumption.value) / 100
            } else if (assumption.id === 'risk_free_rate' && assumption.value) {
              riskFreeRate = parseFloat(assumption.value) / 100
            } else if (assumption.id === 'time_to_liquidity' && assumption.value) {
              timeToLiquidity = parseFloat(assumption.value)
            }
          })
        }
      })
    }

    // Get parameters from request body (can override defaults)
    const params: BlackScholesParams = {
      companyValue: body.companyValue || 0,
      volatility: body.volatility !== undefined ? body.volatility : volatility,
      riskFreeRate: body.riskFreeRate !== undefined ? body.riskFreeRate : riskFreeRate,
      timeToLiquidity: body.timeToLiquidity !== undefined ? body.timeToLiquidity : timeToLiquidity,
      dividendYield: body.dividendYield || 0,
    }

    // Transform breakpoints data for OPM calculator
    const breakpoints: BreakpointData[] = breakpointsData.data.sortedBreakpoints.map(
      (bp: any, index: number) => {
        // Parse participating securities from the breakpoint data
        const participatingSecurities: any[] = []
        const securitiesMap = new Map<string, { shares: number; percentage: number }>()

        // Extract securities and their participation from affectedSecurities
        bp.affectedSecurities.forEach((security: string) => {
          // Parse security string format: "Series A (100.00%)" or "Options @ $1.25 (13.64%)"
          const match = security.match(/^(.+?)\s*\((\d+\.?\d*)\%\)$/)
          if (match) {
            const name = match[1].trim()
            const percentage = parseFloat(match[2])

            // Get shares from cap table or use placeholder
            let shares = 0
            if (valuation.cap_table && valuation.cap_table.shareClasses) {
              const shareClass = valuation.cap_table.shareClasses.find(
                (sc: any) => sc.name === name || sc.name.includes(name)
              )
              if (shareClass) {
                shares = shareClass.sharesOutstanding || 0
              }
            }

            // For options, try to extract from name
            if (name.includes('Options @')) {
              if (valuation.cap_table && valuation.cap_table.options) {
                const exercisePrice = parseFloat(name.split('@')[1].split('$')[1])
                const option = valuation.cap_table.options.find(
                  (opt: any) => Math.abs(opt.exercisePrice - exercisePrice) < 0.01
                )
                if (option) {
                  shares = option.numOptions || 0
                }
              }
            }

            securitiesMap.set(name, { shares, percentage })
          }
        })

        // Convert map to array
        securitiesMap.forEach((value, name) => {
          participatingSecurities.push({
            name,
            sharesOutstanding: value.shares,
            participationPercentage: value.percentage,
          })
        })

        return {
          id: index + 1,
          breakpointType: bp.breakpointType,
          fromValue: bp.exitValue.toNumber ? bp.exitValue.toNumber() : bp.exitValue,
          toValue:
            index < breakpointsData.data.sortedBreakpoints.length - 1
              ? breakpointsData.data.sortedBreakpoints[index + 1].exitValue.toNumber
                ? breakpointsData.data.sortedBreakpoints[index + 1].exitValue.toNumber()
                : breakpointsData.data.sortedBreakpoints[index + 1].exitValue
              : bp.exitValue.toNumber
                ? bp.exitValue.toNumber() * 10
                : bp.exitValue * 10, // Use 10x for last breakpoint
          participatingSecurities,
        }
      }
    )

    // Calculate OPM backsolve
    const calculator = new OPMCalculator(params, breakpoints)
    const result = calculator.analyze()

    // Store or update OPM parameters in valuation
    if (body.saveParameters) {
      await supabase
        .from('valuations')
        .update({
          opm_parameters: params,
          updated_at: new Date().toISOString(),
        })
        .eq('id', idParam)
    }

    return NextResponse.json({
      success: true,
      data: result,
      valuation_id: valuation.id,
      analysis_timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform OPM backsolve analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/valuations/[id]/opm-backsolve - Get saved OPM parameters
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params
    const { id: idParam } = resolvedParams
    const supabase = await createClient()

    // Get valuation with assumptions
    const { data: valuation, error: valuationError } = await supabase
      .from('valuations')
      .select('assumptions, opm_parameters')
      .eq('id', idParam)
      .single()

    // Default values
    let volatility = 0.6 // Default 60%
    let riskFreeRate = 0.045 // Default 4.5%
    let timeToLiquidity = 3 // Default 3 years

    // Extract from assumptions if valuation exists
    if (valuation && valuation.assumptions) {
      const assumptions = valuation.assumptions || []

      if (Array.isArray(assumptions)) {
        assumptions.forEach((category: any) => {
          if (category.assumptions && Array.isArray(category.assumptions)) {
            category.assumptions.forEach((assumption: any) => {
              if (assumption.id === 'equity_volatility' && assumption.value) {
                volatility = parseFloat(assumption.value) / 100
              } else if (assumption.id === 'risk_free_rate' && assumption.value) {
                riskFreeRate = parseFloat(assumption.value) / 100
              } else if (assumption.id === 'time_to_liquidity' && assumption.value) {
                timeToLiquidity = parseFloat(assumption.value)
              }
            })
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        savedParameters: valuation?.opm_parameters || null,
        defaults: {
          volatility,
          riskFreeRate,
          timeToLiquidity,
        },
        valuation_id: idParam,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch OPM parameters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
