/**
 * Pro-Rata Distribution Analyzer
 *
 * Analyzes the pro-rata distribution breakpoint.
 * Always creates exactly ONE breakpoint where pro-rata distribution begins.
 *
 * Conditions:
 * - All liquidation preferences satisfied
 * - Remaining value distributed pro-rata among:
 *   * Common stock (always)
 *   * Participating preferred (always, as-if-converted)
 *   * Non-participating preferred (only if voluntarily converted)
 *   * Options (only if exercised)
 *
 * @module ProRataAnalyzer
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot } from '../types/CapTableTypes'
import { RangeBasedBreakpoint, BreakpointType } from '../types/BreakpointTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { MathematicalProofs } from '../utilities/MathematicalProofs'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { ParticipationCalculator } from '../calculators/ParticipationCalculator'

/**
 * ProRataAnalyzer
 *
 * Identifies the single pro-rata distribution start point
 */
export class ProRataAnalyzer {
  constructor(
    private participationCalculator: ParticipationCalculator,
    private auditLogger: AuditTrailLogger
  ) {}

  /**
   * Analyze pro-rata distribution breakpoint
   * Creates a single open-ended breakpoint starting where all LP is satisfied
   */
  analyze(capTable: CapTableSnapshot, lpBreakpoints: RangeBasedBreakpoint[]): RangeBasedBreakpoint {
    this.auditLogger.step('Analyzing pro-rata distribution start point')

    // Calculate total LP (start point for pro-rata)
    const totalLP = CapTableHelpers.calculateTotalLP(capTable)

    // Determine initial participants (common + participating preferred)
    // Note: Options and converted non-participating added in later breakpoints
    const participationResult = this.participationCalculator.determineParticipants(
      capTable,
      new Map(), // No conversions yet
      new Map() // No exercises yet
    )

    // Create participants with cumulative RVPS = 0 initially
    // (RVPS will accumulate in subsequent ranges)
    const participants = participationResult.participants.map((p) => ({
      securityName: p.securityName,
      securityType: p.securityType,
      participatingShares: p.shares,
      participationPercentage: p.percentage,
      rvpsAtBreakpoint: DecimalHelpers.toDecimal(0), // Open-ended range, RVPS calculated at specific exit
      cumulativeRVPS: DecimalHelpers.toDecimal(0), // Will accumulate in waterfall calculation
      sectionValue: DecimalHelpers.toDecimal(0), // Open-ended
      cumulativeValue: DecimalHelpers.toDecimal(0),
      participationStatus: 'active' as const,
      participationNotes: p.reason,
    }))

    // Determine breakpoint order (after all LP breakpoints)
    const breakpointOrder = lpBreakpoints.length + 1

    // Create pro-rata breakpoint
    const breakpoint: RangeBasedBreakpoint = {
      breakpointType: BreakpointType.PRO_RATA_DISTRIBUTION,
      breakpointOrder,
      rangeFrom: totalLP,
      rangeTo: null, // Open-ended
      isOpenEnded: true,
      participants,
      totalParticipatingShares: participationResult.totalParticipatingShares,
      redemptionValuePerShare: DecimalHelpers.toDecimal(0), // Calculated at specific exit values
      sectionRVPS: DecimalHelpers.toDecimal(0), // Open-ended
      calculationMethod: 'pro_rata_distribution',
      explanation: this.generateExplanation(
        totalLP,
        participationResult.totalParticipatingShares,
        participants.map((p) => p.securityName)
      ),
      mathematicalDerivation: this.generateMathematicalDerivation(
        totalLP,
        CapTableHelpers.getTotalCommonShares(capTable),
        CapTableHelpers.getParticipatingPreferred(capTable).reduce(
          (sum, s) => sum.plus(CapTableHelpers.getConvertedShares(s)),
          DecimalHelpers.toDecimal(0)
        ),
        participationResult.totalParticipatingShares
      ),
      dependencies: this.getDependencies(lpBreakpoints),
      affectedSecurities: participants.map((p) => p.securityName),
      priorityOrder: 1000, // Pro-rata breakpoints: 1000-1999
    }

    // Log breakpoint
    this.auditLogger.logBreakpoint(breakpoint)
    this.auditLogger.logProRataStart(
      totalLP,
      participationResult.totalParticipatingShares,
      participants.map((p) => p.securityName)
    )

    // Generate and log mathematical proof
    const proof = MathematicalProofs.generateProRataProof(
      totalLP,
      CapTableHelpers.getTotalCommonShares(capTable),
      CapTableHelpers.getParticipatingPreferred(capTable).reduce(
        (sum, s) => sum.plus(CapTableHelpers.getConvertedShares(s)),
        DecimalHelpers.toDecimal(0)
      ),
      participationResult.totalParticipatingShares
    )
    this.auditLogger.logMathematicalProof('Pro-Rata Distribution', proof)

    this.auditLogger.info(
      'Pro-Rata Analysis',
      `Pro-rata distribution begins at ${DecimalHelpers.formatCurrency(totalLP)}`,
      {
        totalParticipatingShares: participationResult.totalParticipatingShares.toString(),
        participants: participants.length,
      }
    )

    return breakpoint
  }

  /**
   * Generate explanation for pro-rata breakpoint
   */
  private generateExplanation(
    totalLP: Decimal,
    totalParticipatingShares: Decimal,
    participantNames: string[]
  ): string {
    return [
      'Pro-rata distribution begins',
      `Start Point: ${DecimalHelpers.formatCurrency(totalLP)} (all liquidation preferences satisfied)`,
      `Total Participating Shares: ${DecimalHelpers.formatNumber(totalParticipatingShares)}`,
      `Participants: ${participantNames.join(', ')}`,
      'Remaining value distributed pro-rata based on share ownership',
    ].join('; ')
  }

  /**
   * Generate mathematical derivation
   */
  private generateMathematicalDerivation(
    totalLP: Decimal,
    commonShares: Decimal,
    participatingPreferredShares: Decimal,
    totalParticipatingShares: Decimal
  ): string {
    const lines: string[] = []

    lines.push('Pro-Rata Distribution Start Point')
    lines.push('')
    lines.push('Condition: All liquidation preferences satisfied')
    lines.push('')
    lines.push('Start Point Calculation:')
    lines.push(`- Total LP = ${DecimalHelpers.formatCurrency(totalLP)}`)
    lines.push(
      `- Pro-rata begins at exit value = Total LP = ${DecimalHelpers.formatCurrency(totalLP)}`
    )
    lines.push('')
    lines.push('Participating Securities:')
    lines.push(`- Common Stock: ${DecimalHelpers.formatNumber(commonShares)} shares`)
    lines.push(
      `- Participating Preferred (as-if-converted): ${DecimalHelpers.formatNumber(participatingPreferredShares)} shares`
    )
    lines.push(`- Total: ${DecimalHelpers.formatNumber(totalParticipatingShares)} shares`)
    lines.push('')
    lines.push('Distribution Formula (for Exit > Total LP):')
    lines.push('- Pro-rata Value = (Exit - Total LP) × (Participant Shares ÷ Total Shares)')
    lines.push('')

    const commonPct = DecimalHelpers.toPercentage(commonShares, totalParticipatingShares)
    const participatingPct = DecimalHelpers.toPercentage(
      participatingPreferredShares,
      totalParticipatingShares
    )

    lines.push('Example pro-rata percentages:')
    if (DecimalHelpers.isPositive(commonShares)) {
      lines.push(`- Common: ${DecimalHelpers.formatPercentage(commonPct, 2)}`)
    }
    if (DecimalHelpers.isPositive(participatingPreferredShares)) {
      lines.push(
        `- Participating Preferred: ${DecimalHelpers.formatPercentage(participatingPct, 2)}`
      )
    }

    return lines.join('\n')
  }

  /**
   * Get dependencies for pro-rata breakpoint
   */
  private getDependencies(lpBreakpoints: RangeBasedBreakpoint[]): string[] {
    if (lpBreakpoints.length === 0) {
      return []
    }

    return ['All liquidation preferences satisfied']
  }

  /**
   * Get expected pro-rata breakpoint count (always 1)
   */
  getExpectedBreakpointCount(): number {
    return 1
  }

  /**
   * Validate pro-rata breakpoint
   */
  validate(
    breakpoint: RangeBasedBreakpoint,
    capTable: CapTableSnapshot,
    lpBreakpoints: RangeBasedBreakpoint[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check type
    if (breakpoint.breakpointType !== BreakpointType.PRO_RATA_DISTRIBUTION) {
      errors.push('Breakpoint type must be pro_rata_distribution')
    }

    // Check open-ended
    if (!breakpoint.isOpenEnded || breakpoint.rangeTo !== null) {
      errors.push('Pro-rata breakpoint must be open-ended (rangeTo = null)')
    }

    // Check start point matches total LP
    const totalLP = CapTableHelpers.calculateTotalLP(capTable)
    if (!DecimalHelpers.equals(breakpoint.rangeFrom, totalLP)) {
      errors.push(
        `Pro-rata start point ${DecimalHelpers.formatCurrency(breakpoint.rangeFrom)} does not match total LP ${DecimalHelpers.formatCurrency(totalLP)}`
      )
    }

    // Check has participants
    if (breakpoint.participants.length === 0) {
      errors.push('Pro-rata breakpoint must have participants')
    }

    // Check common stock always participates
    const hasCommon = breakpoint.participants.some((p) => p.securityType === 'common')
    if (!hasCommon) {
      errors.push('Common stock must participate in pro-rata distribution')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
