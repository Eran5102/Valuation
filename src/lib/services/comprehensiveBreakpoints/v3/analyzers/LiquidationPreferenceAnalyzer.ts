/**
 * Liquidation Preference Analyzer
 *
 * Analyzes liquidation preference breakpoints based on seniority.
 * Creates one breakpoint per seniority rank (pari passu groups treated as single rank).
 *
 * Key Concept:
 * - Most senior (seniority 0) gets paid first
 * - Next seniority rank gets paid after prior ranks satisfied
 * - Multiple classes at same rank share pro-rata (pari passu)
 *
 * @module LiquidationPreferenceAnalyzer
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot, SeniorityGroup } from '../types/CapTableTypes'
import { RangeBasedBreakpoint, BreakpointType } from '../types/BreakpointTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { MathematicalProofs } from '../utilities/MathematicalProofs'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * LiquidationPreferenceAnalyzer
 *
 * Identifies LP breakpoints by seniority
 */
export class LiquidationPreferenceAnalyzer {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Analyze liquidation preference breakpoints
   */
  analyze(capTable: CapTableSnapshot): RangeBasedBreakpoint[] {
    this.auditLogger.step('Analyzing liquidation preference breakpoints')

    const breakpoints: RangeBasedBreakpoint[] = []

    // Group by seniority
    const seniorityGroups = CapTableHelpers.groupBySeniority(capTable)

    if (seniorityGroups.length === 0) {
      this.auditLogger.warning('LP Analysis', 'No preferred series found - no LP breakpoints')
      return []
    }

    let cumulativeLP = DecimalHelpers.toDecimal(0)
    let breakpointOrder = 1

    // Process each seniority rank
    for (const group of seniorityGroups) {
      const rangeFrom = cumulativeLP
      const rangeTo = cumulativeLP.plus(group.totalLiquidationPreference)

      // Create participants for this LP range
      const participants = group.classes.map((series) => {
        // In LP range, only this series participates
        const sharesParticipating = series.sharesOutstanding
        const sectionRVPS = DecimalHelpers.safeDivide(
          series.totalLiquidationPreference,
          series.sharesOutstanding
        )

        return {
          securityName: series.name,
          securityType: 'preferred_series' as const,
          participatingShares: sharesParticipating,
          participationPercentage: DecimalHelpers.toDecimal(1), // 100% (only this series)
          rvpsAtBreakpoint: sectionRVPS,
          cumulativeRVPS: sectionRVPS, // First RVPS for this security
          sectionValue: series.totalLiquidationPreference,
          cumulativeValue: series.totalLiquidationPreference,
          participationStatus: 'active' as const,
          participationNotes: `Receives liquidation preference at seniority ${group.rank}`,
        }
      })

      // Calculate section RVPS (range size ÷ total participating shares)
      const sectionRVPS = DecimalHelpers.safeDivide(
        group.totalLiquidationPreference,
        group.totalShares
      )

      // Create breakpoint
      const breakpoint: RangeBasedBreakpoint = {
        breakpointType: BreakpointType.LIQUIDATION_PREFERENCE,
        breakpointOrder,
        rangeFrom,
        rangeTo,
        isOpenEnded: false,
        participants,
        totalParticipatingShares: group.totalShares,
        redemptionValuePerShare: sectionRVPS,
        sectionRVPS,
        calculationMethod: 'cumulative_liquidation_preference',
        explanation: this.generateExplanation(group, rangeFrom, rangeTo),
        mathematicalDerivation: this.generateMathematicalDerivation(group, rangeFrom, rangeTo),
        dependencies: this.getDependencies(group.rank),
        affectedSecurities: group.classes.map((c) => c.name),
        priorityOrder: 100 + group.rank, // LP breakpoints: 100-199
      }

      breakpoints.push(breakpoint)

      // Log breakpoint
      this.auditLogger.logBreakpoint(breakpoint)
      this.auditLogger.logLPBreakpoint(
        group.rank,
        group.classes.map((c) => c.name),
        group.totalLiquidationPreference,
        rangeTo
      )

      // Generate and log mathematical proof
      const proof = MathematicalProofs.generateLPBreakpointProof(
        group.rank,
        group.classes.map((c) => c.name),
        group.totalLiquidationPreference,
        cumulativeLP,
        rangeTo
      )
      this.auditLogger.logMathematicalProof(`LP Breakpoint: Seniority ${group.rank}`, proof)

      // Update cumulative LP for next iteration
      cumulativeLP = rangeTo
      breakpointOrder++
    }

    this.auditLogger.info(
      'LP Analysis',
      `Identified ${breakpoints.length} liquidation preference breakpoints`,
      { totalLP: cumulativeLP.toString() }
    )

    return breakpoints
  }

  /**
   * Generate explanation for LP breakpoint
   */
  private generateExplanation(group: SeniorityGroup, rangeFrom: Decimal, rangeTo: Decimal): string {
    const seriesNames = group.classes.map((c) => c.name).join(', ')
    const isPariPassu = group.isPariPassu ? ' (pari passu)' : ''

    return [
      `Seniority ${group.rank}${isPariPassu}: ${seriesNames}`,
      `Range: ${DecimalHelpers.formatCurrency(rangeFrom)} → ${DecimalHelpers.formatCurrency(rangeTo)}`,
      `Total LP: ${DecimalHelpers.formatCurrency(group.totalLiquidationPreference)}`,
      group.isPariPassu
        ? `Multiple classes at same seniority share pro-rata`
        : `Single class receives full LP`,
    ].join('; ')
  }

  /**
   * Generate mathematical derivation
   */
  private generateMathematicalDerivation(
    group: SeniorityGroup,
    rangeFrom: Decimal,
    rangeTo: Decimal
  ): string {
    const lines: string[] = []

    lines.push(`Liquidation Preference: Seniority ${group.rank}`)
    lines.push('')

    if (group.isPariPassu) {
      lines.push('Pari Passu Group (multiple classes at same seniority):')
      group.classes.forEach((series) => {
        lines.push(
          `- ${series.name}: ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)}`
        )
      })
      lines.push(`- Total LP: ${DecimalHelpers.formatCurrency(group.totalLiquidationPreference)}`)
    } else {
      const series = group.classes[0]
      lines.push(`Series: ${series.name}`)
      lines.push(
        `LP = ${DecimalHelpers.formatNumber(series.sharesOutstanding)} shares × ${DecimalHelpers.formatCurrency(series.pricePerShare)} × ${series.liquidationMultiple}x`
      )
      lines.push(`LP = ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)}`)
    }

    lines.push('')
    lines.push('Range Calculation:')
    lines.push(
      `- Range Start: ${DecimalHelpers.formatCurrency(rangeFrom)} (cumulative LP from prior seniority)`
    )
    lines.push(`- Range End: ${DecimalHelpers.formatCurrency(rangeTo)} (start + this seniority LP)`)
    lines.push('')
    lines.push(
      `In this range, ${group.classes.map((c) => c.name).join(', ')} receives liquidation preference`
    )

    return lines.join('\n')
  }

  /**
   * Get dependencies for LP breakpoint
   */
  private getDependencies(seniorityRank: number): string[] {
    if (seniorityRank === 0) {
      return [] // Most senior has no dependencies
    }

    return [`Seniority ${seniorityRank - 1} LP satisfied`]
  }

  /**
   * Get expected LP breakpoint count
   */
  getExpectedBreakpointCount(capTable: CapTableSnapshot): number {
    return CapTableHelpers.countDistinctSeniorityRanks(capTable)
  }

  /**
   * Validate LP breakpoints
   */
  validate(
    breakpoints: RangeBasedBreakpoint[],
    capTable: CapTableSnapshot
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check count matches expected
    const expectedCount = this.getExpectedBreakpointCount(capTable)
    if (breakpoints.length !== expectedCount) {
      errors.push(`Expected ${expectedCount} LP breakpoints, found ${breakpoints.length}`)
    }

    // Check ranges are continuous
    for (let i = 1; i < breakpoints.length; i++) {
      const prev = breakpoints[i - 1]
      const curr = breakpoints[i]

      if (!DecimalHelpers.equals(prev.rangeTo!, curr.rangeFrom)) {
        errors.push(
          `Gap in LP ranges: ${DecimalHelpers.formatCurrency(prev.rangeTo!)} → ${DecimalHelpers.formatCurrency(curr.rangeFrom)}`
        )
      }
    }

    // Check total LP matches
    const totalLP = CapTableHelpers.calculateTotalLP(capTable)
    const lastBreakpoint = breakpoints[breakpoints.length - 1]
    if (lastBreakpoint && !DecimalHelpers.equals(lastBreakpoint.rangeTo!, totalLP)) {
      errors.push(
        `Final LP breakpoint ${DecimalHelpers.formatCurrency(lastBreakpoint.rangeTo!)} does not match total LP ${DecimalHelpers.formatCurrency(totalLP)}`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
