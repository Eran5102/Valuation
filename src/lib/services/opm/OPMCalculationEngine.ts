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
  shareClassTotals: Map<string, number> // Map of security class name -> total shares for that class
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
      sortedBreakpoints,
      context.shareClassTotals
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
   * Calculate Black-Scholes for each breakpoint (SIMPLIFIED - using incremental values)
   *
   * OPM distributes the INCREMENTAL option value between consecutive breakpoints.
   * Strike price = breakpoint value (rangeFrom).
   * We use 0.00001 instead of 0 for the first breakpoint to avoid mathematical issues.
   */
  private calculateBreakpoints(
    enterpriseValue: number,
    breakpoints: OPMBreakpoint[],
    bsParams: OPMBlackScholesParams
  ): BreakpointCalculationResult[] {
    const results: BreakpointCalculationResult[] = []
    let previousCallValue = enterpriseValue // Start with full enterprise value

    this.auditLogger.debug('OPM Breakpoints', 'Calculating breakpoints (simplified)', {
      count: breakpoints.length,
      enterpriseValue,
    })

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]

      // Strike price is the breakpoint value (rangeFrom)
      // Use 0.00001 if value is 0 to avoid division by zero
      const strikePrice = bp.value === 0 ? 0.00001 : bp.value

      // Calculate Black-Scholes call option value
      const blackScholesResult = BlackScholesCalculator.calculateCall({
        companyValue: enterpriseValue,
        strikePrice: strikePrice,
        timeToExpiration: bsParams.timeToLiquidity,
        volatility: bsParams.volatility,
        riskFreeRate: bsParams.riskFreeRate,
        dividendYield: bsParams.dividendYield,
      })

      // INCREMENTAL value = previous call value - current call value
      // This represents the value in THIS specific breakpoint range
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
        strikePrice,
        callValue: blackScholesResult.callValue,
        previousCallValue,
        incrementalValue,
        d1: blackScholesResult.d1,
        d2: blackScholesResult.d2,
      })

      // DIAGNOSTIC: Log to console for debugging
      console.log(
        `[OPM Engine] BP${i + 1}: strike=${strikePrice.toFixed(2)}, callValue=${blackScholesResult.callValue.toFixed(2)}, prevCall=${previousCallValue.toFixed(2)}, incremental=${incrementalValue.toFixed(2)}`
      )

      previousCallValue = blackScholesResult.callValue
    }

    return results
  }

  /**
   * Calculate security class allocations based on breakpoint results (SIMPLIFIED)
   *
   * Takes share class totals from context to calculate proper PPS.
   */
  private calculateSecurityAllocations(
    enterpriseValue: number,
    breakpointResults: BreakpointCalculationResult[],
    breakpoints: OPMBreakpoint[],
    shareClassTotals: Map<string, number>
  ): SecurityClassAllocation[] {
    // Build map of security class -> total value
    const allocationMap = new Map<string, number>()

    // Process each breakpoint's allocation
    for (let i = 0; i < breakpointResults.length; i++) {
      const result = breakpointResults[i]
      const breakpoint = breakpoints[i]

      if (!result.active || result.incrementalValue <= 0) {
        continue
      }

      // Distribute Black-Scholes option value using V3 participation percentages
      for (const allocation of breakpoint.allocation) {
        // participationPercentage from V3 is ALREADY in decimal format (0-1), NOT percentage (0-100)
        // So we use it directly without dividing by 100
        const participationRatio = allocation.participationPercentage
        const distributedValue = result.incrementalValue * participationRatio

        const current = allocationMap.get(allocation.securityClass) || 0
        allocationMap.set(allocation.securityClass, current + distributedValue)

        // DIAGNOSTIC: Log distribution
        console.log(
          `[OPM Engine] Distributing BP${i + 1}: ${allocation.securityClass} gets ${distributedValue.toFixed(2)} (${(participationRatio * 100).toFixed(2)}% of ${result.incrementalValue.toFixed(2)})`
        )
      }
    }

    // Calculate total value distributed
    let totalValue = 0
    for (const value of allocationMap.values()) {
      totalValue += value
    }

    // Convert map to array with actual shares from shareClassTotals
    const allocations: SecurityClassAllocation[] = []
    for (const [securityClass, value] of allocationMap.entries()) {
      const totalShares = shareClassTotals.get(securityClass) || 0
      const pps = totalShares > 0 ? value / totalShares : 0

      allocations.push({
        securityClass,
        totalShares,
        totalValue: value,
        valuePerShare: pps,
        percentOfTotal: totalValue > 0 ? (value / totalValue) * 100 : 0,
      })

      // DIAGNOSTIC: Log final PPS
      console.log(
        `[OPM Engine] Final ${securityClass}: totalValue=${value.toFixed(2)}, shares=${totalShares}, PPS=${pps.toFixed(4)}`
      )
    }

    // Sort by total value descending
    allocations.sort((a, b) => b.totalValue - a.totalValue)

    this.auditLogger.debug('OPM Security Allocations', 'Calculated allocations', {
      totalValue,
      securityCount: allocations.length,
      allocations: allocations.map((a) => ({
        class: a.securityClass,
        value: a.totalValue,
        shares: a.totalShares,
        pps: a.valuePerShare,
      })),
    })

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
