/**
 * OPM Calculation Engine
 *
 * Core calculation engine for Option Pricing Model (OPM) valuations.
 * Orchestrates:
 * - Black-Scholes calculations across breakpoints
 * - Allocation calculations by security class
 * - FMV per share calculations
 * - Result aggregation and validation
 *
 * Used by both Single OPM and Hybrid Scenario modes.
 *
 * @module OPMCalculationEngine
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'
import { BlackScholesCalculator, BlackScholesParams } from '../shared/math/BlackScholesCalculator'
import { DecimalHelpers } from '../comprehensiveBreakpoints/v3/utilities/DecimalHelpers'
import { AuditTrailLogger } from '../comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import type { OPMBlackScholesParams, OPMBreakpoint, OPMAllocationResult } from '@/types/opm'

// Configure Decimal for high precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Breakpoint calculation result (internal)
 */
interface BreakpointCalculationResult {
  breakpointId: string
  breakpointValue: number
  breakpointType: string
  active: boolean // Whether this breakpoint is active at current EV
  blackScholes: {
    d1: number
    d2: number
    Nd1: number
    Nd2: number
    callValue: number
  }
  incrementalValue: number // Value added by this breakpoint
}

/**
 * Security class allocation (internal)
 */
interface SecurityClassAllocation {
  securityClass: string
  totalShares: number
  totalValue: number
  valuePerShare: number
  percentOfTotal: number
}

/**
 * OPM calculation context
 */
export interface OPMCalculationContext {
  enterpriseValue: number
  blackScholesParams: OPMBlackScholesParams
  breakpoints: OPMBreakpoint[]
  totalShares: number // Total shares outstanding across all classes
}

/**
 * OPM calculation result (internal, before packaging)
 */
interface OPMCalculationRawResult {
  enterpriseValue: number
  breakpointResults: BreakpointCalculationResult[]
  securityAllocations: SecurityClassAllocation[]
  totalValueDistributed: number
  valid: boolean
  validationErrors: string[]
}

/**
 * OPMCalculationEngine
 *
 * Core engine for OPM calculations
 */
export class OPMCalculationEngine {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Calculate OPM allocation for a given enterprise value
   *
   * @param context - Calculation context (EV, params, breakpoints)
   * @returns Allocation result
   *
   * @example
   * ```typescript
   * const context = {
   *   enterpriseValue: 10000000,
   *   blackScholesParams: { ... },
   *   breakpoints: [ ... ],
   *   totalShares: 10000000,
   * }
   * const result = engine.calculate(context)
   * ```
   */
  calculate(context: OPMCalculationContext): OPMAllocationResult {
    this.auditLogger.step('Starting OPM calculation')
    this.auditLogger.debug('OPM Calculation', 'Enterprise Value', {
      enterpriseValue: context.enterpriseValue,
    })

    // Step 1: Validate context
    this.validateContext(context)

    // Step 2: Sort breakpoints by value
    const sortedBreakpoints = this.sortBreakpoints(context.breakpoints)

    // Step 3: Calculate Black-Scholes for each breakpoint
    const breakpointResults = this.calculateBreakpoints(
      context.enterpriseValue,
      sortedBreakpoints,
      context.blackScholesParams
    )

    // Step 4: Calculate security class allocations
    const securityAllocations = this.calculateSecurityAllocations(
      context.enterpriseValue,
      breakpointResults,
      sortedBreakpoints
    )

    // Step 5: Calculate total value distributed
    const totalValueDistributed = securityAllocations.reduce(
      (sum, alloc) => sum + alloc.totalValue,
      0
    )

    // Step 6: Validate result
    const validationErrors = this.validateResult(
      context.enterpriseValue,
      totalValueDistributed,
      securityAllocations
    )

    // Step 7: Package result
    const result: OPMAllocationResult = {
      enterpriseValue: context.enterpriseValue,
      allocationsByClass: securityAllocations.map((alloc) => ({
        securityClass: alloc.securityClass,
        totalShares: alloc.totalShares,
        totalValue: alloc.totalValue,
        valuePerShare: alloc.valuePerShare,
        percentOfTotal: alloc.percentOfTotal,
      })),
      breakpointAllocations: breakpointResults.map((br, idx) => ({
        breakpointId: br.breakpointId,
        breakpointValue: br.breakpointValue,
        breakpointType: br.breakpointType,
        active: br.active,
        allocationChanges: this.getBreakpointAllocationChanges(br.breakpointId, sortedBreakpoints),
      })),
      totalValueDistributed,
      valid: validationErrors.length === 0,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    }

    this.auditLogger.info('OPM Calculation', 'Calculation complete', {
      enterpriseValue: context.enterpriseValue,
      totalValueDistributed,
      securityClasses: securityAllocations.length,
      valid: result.valid,
    })

    return result
  }

  /**
   * Calculate FMV per share for a specific security class
   *
   * @param allocationResult - OPM allocation result
   * @param securityClassId - Security class to get FMV for
   * @returns FMV per share, or 0 if not found
   */
  getFMVPerShare(allocationResult: OPMAllocationResult, securityClassId: string): number {
    const allocation = allocationResult.allocationsByClass.find(
      (a) => a.securityClass === securityClassId
    )
    return allocation ? allocation.valuePerShare : 0
  }

  /**
   * Validate calculation context
   */
  private validateContext(context: OPMCalculationContext): void {
    if (context.enterpriseValue <= 0) {
      throw new Error(`Enterprise value must be positive, got ${context.enterpriseValue}`)
    }

    if (!context.breakpoints || context.breakpoints.length === 0) {
      throw new Error('At least one breakpoint is required')
    }

    if (context.totalShares <= 0) {
      throw new Error(`Total shares must be positive, got ${context.totalShares}`)
    }

    // Validate Black-Scholes parameters
    const { volatility, riskFreeRate, timeToLiquidity } = context.blackScholesParams

    if (volatility <= 0 || volatility > 5) {
      throw new Error(`Volatility out of range: ${volatility} (expected 0-5)`)
    }

    if (riskFreeRate < 0 || riskFreeRate > 1) {
      throw new Error(`Risk-free rate out of range: ${riskFreeRate} (expected 0-1)`)
    }

    if (timeToLiquidity <= 0 || timeToLiquidity > 20) {
      throw new Error(`Time to liquidity out of range: ${timeToLiquidity} (expected 0-20 years)`)
    }
  }

  /**
   * Sort breakpoints by value (ascending)
   */
  private sortBreakpoints(breakpoints: OPMBreakpoint[]): OPMBreakpoint[] {
    return [...breakpoints].sort((a, b) => a.value - b.value)
  }

  /**
   * Calculate Black-Scholes for each breakpoint
   */
  private calculateBreakpoints(
    enterpriseValue: number,
    breakpoints: OPMBreakpoint[],
    bsParams: OPMBlackScholesParams
  ): BreakpointCalculationResult[] {
    const results: BreakpointCalculationResult[] = []
    let previousCallValue = enterpriseValue // Start with full EV

    this.auditLogger.debug('OPM Breakpoints', 'Calculating breakpoints', {
      count: breakpoints.length,
      enterpriseValue,
    })

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]
      const isActive = enterpriseValue >= bp.value

      this.auditLogger.debug('OPM Breakpoint', `Breakpoint ${i + 1}`, {
        id: bp.id,
        value: bp.value,
        type: bp.type,
        active: isActive,
      })

      if (!isActive) {
        // Breakpoint not reached, no option value
        results.push({
          breakpointId: bp.id,
          breakpointValue: bp.value,
          breakpointType: bp.type,
          active: false,
          blackScholes: {
            d1: 0,
            d2: 0,
            Nd1: 0,
            Nd2: 0,
            callValue: 0,
          },
          incrementalValue: 0,
        })
        previousCallValue = 0
        continue
      }

      // Calculate Black-Scholes call option value
      const blackScholesResult = BlackScholesCalculator.calculateCall({
        companyValue: enterpriseValue,
        strikePrice: bp.value,
        timeToExpiration: bsParams.timeToLiquidity,
        volatility: bsParams.volatility,
        riskFreeRate: bsParams.riskFreeRate,
        dividendYield: bsParams.dividendYield,
      })

      // Incremental value = current call value - previous call value
      const incrementalValue = Math.max(0, previousCallValue - blackScholesResult.callValue)

      results.push({
        breakpointId: bp.id,
        breakpointValue: bp.value,
        breakpointType: bp.type,
        active: true,
        blackScholes: {
          d1: blackScholesResult.d1,
          d2: blackScholesResult.d2,
          Nd1: blackScholesResult.Nd1,
          Nd2: blackScholesResult.Nd2,
          callValue: blackScholesResult.callValue,
        },
        incrementalValue,
      })

      this.auditLogger.debug('OPM Breakpoint Result', `Breakpoint ${i + 1}`, {
        callValue: blackScholesResult.callValue,
        incrementalValue,
        d1: blackScholesResult.d1,
        d2: blackScholesResult.d2,
      })

      previousCallValue = blackScholesResult.callValue
    }

    return results
  }

  /**
   * Calculate security class allocations based on breakpoint results
   */
  private calculateSecurityAllocations(
    enterpriseValue: number,
    breakpointResults: BreakpointCalculationResult[],
    breakpoints: OPMBreakpoint[]
  ): SecurityClassAllocation[] {
    // Build map of security class -> total value
    const allocationMap = new Map<string, { value: number; shares: number }>()

    // Process each breakpoint's allocation
    for (let i = 0; i < breakpointResults.length; i++) {
      const result = breakpointResults[i]
      const breakpoint = breakpoints[i]

      if (!result.active || result.incrementalValue <= 0) {
        continue
      }

      // Distribute incremental value according to breakpoint allocation
      for (const allocation of breakpoint.allocation) {
        const current = allocationMap.get(allocation.securityClass) || { value: 0, shares: 0 }
        allocationMap.set(allocation.securityClass, {
          value: current.value + allocation.valueReceived,
          shares: Math.max(current.shares, allocation.sharesReceived), // Use max shares
        })
      }
    }

    // Calculate total value distributed
    let totalValue = 0
    for (const alloc of allocationMap.values()) {
      totalValue += alloc.value
    }

    // Convert map to array with percentages
    const allocations: SecurityClassAllocation[] = []
    for (const [securityClass, alloc] of allocationMap.entries()) {
      allocations.push({
        securityClass,
        totalShares: alloc.shares,
        totalValue: alloc.value,
        valuePerShare: alloc.shares > 0 ? alloc.value / alloc.shares : 0,
        percentOfTotal: totalValue > 0 ? (alloc.value / totalValue) * 100 : 0,
      })
    }

    // Sort by total value descending
    allocations.sort((a, b) => b.totalValue - a.totalValue)

    return allocations
  }

  /**
   * Get allocation changes for a specific breakpoint
   */
  private getBreakpointAllocationChanges(
    breakpointId: string,
    breakpoints: OPMBreakpoint[]
  ): Array<{ securityClass: string; sharesReceived: number; valueReceived: number }> {
    const breakpoint = breakpoints.find((bp) => bp.id === breakpointId)
    if (!breakpoint) {
      return []
    }

    return breakpoint.allocation.map((alloc) => ({
      securityClass: alloc.securityClass,
      sharesReceived: alloc.sharesReceived,
      valueReceived: alloc.valueReceived,
    }))
  }

  /**
   * Validate calculation result
   */
  private validateResult(
    enterpriseValue: number,
    totalValueDistributed: number,
    securityAllocations: SecurityClassAllocation[]
  ): string[] {
    const errors: string[] = []

    // Check that total value distributed doesn't exceed enterprise value
    if (totalValueDistributed > enterpriseValue * 1.01) {
      // Allow 1% tolerance
      errors.push(
        `Total value distributed (${totalValueDistributed.toFixed(2)}) exceeds enterprise value (${enterpriseValue.toFixed(2)})`
      )
    }

    // Check for negative values
    for (const alloc of securityAllocations) {
      if (alloc.totalValue < 0) {
        errors.push(`Negative allocation for ${alloc.securityClass}: ${alloc.totalValue}`)
      }
      if (alloc.valuePerShare < 0) {
        errors.push(`Negative per-share value for ${alloc.securityClass}: ${alloc.valuePerShare}`)
      }
    }

    // Check for NaN values
    if (isNaN(totalValueDistributed)) {
      errors.push('Total value distributed is NaN')
    }

    for (const alloc of securityAllocations) {
      if (isNaN(alloc.totalValue)) {
        errors.push(`Allocation value is NaN for ${alloc.securityClass}`)
      }
      if (isNaN(alloc.valuePerShare)) {
        errors.push(`Per-share value is NaN for ${alloc.securityClass}`)
      }
    }

    return errors
  }

  /**
   * Format allocation result for display
   */
  static formatAllocationResult(result: OPMAllocationResult): string {
    const lines: string[] = []

    lines.push(
      `Enterprise Value: ${DecimalHelpers.formatCurrency(new Decimal(result.enterpriseValue))}`
    )
    lines.push(
      `Total Value Distributed: ${DecimalHelpers.formatCurrency(new Decimal(result.totalValueDistributed))}`
    )
    lines.push(`Validation: ${result.valid ? 'PASS ✓' : 'FAIL ✗'}`)
    lines.push('')

    lines.push('Allocations by Security Class:')
    lines.push('-'.repeat(80))
    for (const alloc of result.allocationsByClass) {
      lines.push(
        `${alloc.securityClass.padEnd(30)} | ` +
          `Value: ${DecimalHelpers.formatCurrency(new Decimal(alloc.totalValue)).padStart(15)} | ` +
          `Per Share: $${alloc.valuePerShare.toFixed(4).padStart(10)} | ` +
          `${alloc.percentOfTotal.toFixed(2)}%`
      )
    }

    lines.push('')
    lines.push(
      `Active Breakpoints: ${result.breakpointAllocations.filter((bp) => bp.active).length} / ${result.breakpointAllocations.length}`
    )

    return lines.join('\n')
  }
}
