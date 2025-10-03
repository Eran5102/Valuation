/**
 * Participation Cap Analyzer
 *
 * Analyzes when participating preferred reaches their participation cap.
 * Creates one breakpoint per participating-with-cap series at their cap threshold.
 *
 * Key Concept:
 * - Participating-with-cap receives: LP + pro-rata share, UP TO cap
 * - Cap threshold = exit value where total received = cap amount
 * - After cap, series stops receiving value (capped)
 *
 * @module ParticipationCapAnalyzer
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot, PreferredShareClass } from '../types/CapTableTypes'
import { RangeBasedBreakpoint, BreakpointType } from '../types/BreakpointTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { MathematicalProofs } from '../utilities/MathematicalProofs'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * ParticipationCapAnalyzer
 *
 * Identifies participation cap breakpoints
 */
export class ParticipationCapAnalyzer {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Analyze participation cap breakpoints
   */
  analyze(
    capTable: CapTableSnapshot,
    priorBreakpoints: RangeBasedBreakpoint[]
  ): RangeBasedBreakpoint[] {
    this.auditLogger.step('Analyzing participation cap breakpoints')

    const breakpoints: RangeBasedBreakpoint[] = []

    // Get series with participation caps
    const seriesWithCaps = CapTableHelpers.getPreferredWithCaps(capTable)

    if (seriesWithCaps.length === 0) {
      this.auditLogger.info('Participation Cap Analysis', 'No series with participation caps')
      return []
    }

    const totalLP = CapTableHelpers.calculateTotalLP(capTable)
    const totalParticipatingShares = CapTableHelpers.getTotalParticipatingShares(capTable)

    let breakpointOrder = priorBreakpoints.length + 1

    // Analyze each series with cap
    for (const series of seriesWithCaps) {
      if (!series.participationCap) continue

      // Calculate cap threshold
      const capThreshold = CapTableHelpers.calculateCapThreshold(
        series,
        totalParticipatingShares,
        totalLP
      )

      if (!capThreshold) {
        this.auditLogger.warning(
          'Participation Cap',
          `Could not calculate cap threshold for ${series.name}`,
          {
            seriesName: series.name,
            cap: series.participationCap.toString(),
          }
        )
        continue
      }

      // Create breakpoint
      const breakpoint = this.createCapBreakpoint(
        series,
        capThreshold,
        totalLP,
        totalParticipatingShares,
        breakpointOrder
      )

      breakpoints.push(breakpoint)

      // Log
      this.auditLogger.logBreakpoint(breakpoint)
      this.auditLogger.logCapReached(series.name, series.participationCap, capThreshold)

      // Generate and log mathematical proof
      const convertedShares = CapTableHelpers.getConvertedShares(series)
      const proRataPercentage = DecimalHelpers.safeDivide(convertedShares, totalParticipatingShares)

      const proof = MathematicalProofs.generateParticipationCapProof(
        series.name,
        series.participationCap,
        series.totalLiquidationPreference,
        proRataPercentage,
        totalLP,
        capThreshold
      )
      this.auditLogger.logMathematicalProof(`Participation Cap: ${series.name}`, proof)

      breakpointOrder++
    }

    this.auditLogger.info(
      'Participation Cap Analysis',
      `Identified ${breakpoints.length} participation cap breakpoints`,
      { seriesCount: seriesWithCaps.length }
    )

    return breakpoints
  }

  /**
   * Create participation cap breakpoint
   */
  private createCapBreakpoint(
    series: PreferredShareClass,
    capThreshold: Decimal,
    totalLP: Decimal,
    totalParticipatingShares: Decimal,
    breakpointOrder: number
  ): RangeBasedBreakpoint {
    const convertedShares = CapTableHelpers.getConvertedShares(series)
    const proRataPercentage = DecimalHelpers.safeDivide(convertedShares, totalParticipatingShares)

    // Participant: series reaches cap and stops receiving value
    const participant = {
      securityName: series.name,
      securityType: 'preferred_series' as const,
      participatingShares: convertedShares,
      participationPercentage: proRataPercentage,
      rvpsAtBreakpoint: DecimalHelpers.toDecimal(0),
      cumulativeRVPS: DecimalHelpers.toDecimal(0),
      sectionValue: DecimalHelpers.toDecimal(0),
      cumulativeValue: series.participationCap!,
      participationStatus: 'capped' as const,
      participationNotes: `Reaches participation cap of ${DecimalHelpers.formatCurrency(series.participationCap!)}`,
    }

    const breakpoint: RangeBasedBreakpoint = {
      breakpointType: BreakpointType.PARTICIPATION_CAP,
      breakpointOrder,
      rangeFrom: capThreshold,
      rangeTo: null, // Open-ended (but series stops receiving value)
      isOpenEnded: true,
      participants: [participant],
      totalParticipatingShares: convertedShares,
      redemptionValuePerShare: DecimalHelpers.toDecimal(0),
      sectionRVPS: DecimalHelpers.toDecimal(0),
      calculationMethod: 'participation_cap_threshold',
      explanation: this.generateExplanation(series, capThreshold, totalLP, proRataPercentage),
      mathematicalDerivation: this.generateMathematicalDerivation(
        series,
        capThreshold,
        totalLP,
        proRataPercentage
      ),
      dependencies: ['Pro-rata distribution started'],
      affectedSecurities: [series.name],
      priorityOrder: 4000 + breakpointOrder, // Caps: 4000-4999
      metadata: {
        capAmount: series.participationCap!.toString(),
        lpAmount: series.totalLiquidationPreference.toString(),
        proRataPercentage: proRataPercentage.toString(),
      },
    }

    return breakpoint
  }

  /**
   * Generate explanation
   */
  private generateExplanation(
    series: PreferredShareClass,
    capThreshold: Decimal,
    totalLP: Decimal,
    proRataPercentage: Decimal
  ): string {
    return [
      `${series.name} reaches participation cap`,
      `Cap Amount: ${DecimalHelpers.formatCurrency(series.participationCap!)}`,
      `Cap Threshold: ${DecimalHelpers.formatCurrency(capThreshold)}`,
      `LP: ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)}`,
      `Pro-rata %: ${DecimalHelpers.formatPercentage(proRataPercentage.times(100), 2)}`,
      'After cap, series stops receiving additional value',
    ].join('; ')
  }

  /**
   * Generate mathematical derivation
   */
  private generateMathematicalDerivation(
    series: PreferredShareClass,
    capThreshold: Decimal,
    totalLP: Decimal,
    proRataPercentage: Decimal
  ): string {
    const lines: string[] = []

    lines.push(`Participation Cap: ${series.name}`)
    lines.push('')
    lines.push('Given:')
    lines.push(`- Participation Cap: ${DecimalHelpers.formatCurrency(series.participationCap!)}`)
    lines.push(
      `- Liquidation Preference: ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)}`
    )
    lines.push(
      `- Pro-rata Percentage: ${DecimalHelpers.formatPercentage(proRataPercentage.times(100), 2)}`
    )
    lines.push(`- Total LP: ${DecimalHelpers.formatCurrency(totalLP)}`)
    lines.push('')
    lines.push('Cap Calculation:')
    lines.push('Total Value Received = LP + Pro-rata Share')
    lines.push(
      `Total Value = ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)} + (Exit - ${DecimalHelpers.formatCurrency(totalLP)}) × ${proRataPercentage.toFixed(4)}`
    )
    lines.push('')
    lines.push('At cap:')
    lines.push(
      `${DecimalHelpers.formatCurrency(series.participationCap!)} = ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)} + (Exit - ${DecimalHelpers.formatCurrency(totalLP)}) × ${proRataPercentage.toFixed(4)}`
    )
    lines.push('')

    const capExcess = series.participationCap!.minus(series.totalLiquidationPreference)
    const divided = capExcess.dividedBy(proRataPercentage)

    lines.push('Solving for Exit:')
    lines.push(
      `${DecimalHelpers.formatCurrency(capExcess)} = (Exit - ${DecimalHelpers.formatCurrency(totalLP)}) × ${proRataPercentage.toFixed(4)}`
    )
    lines.push(
      `${DecimalHelpers.formatCurrency(divided)} = Exit - ${DecimalHelpers.formatCurrency(totalLP)}`
    )
    lines.push(
      `Exit = ${DecimalHelpers.formatCurrency(divided)} + ${DecimalHelpers.formatCurrency(totalLP)}`
    )
    lines.push(`Exit = ${DecimalHelpers.formatCurrency(capThreshold)}`)
    lines.push('')
    lines.push('Result:')
    lines.push(
      `At exit value ${DecimalHelpers.formatCurrency(capThreshold)}, ${series.name} reaches participation cap`
    )
    lines.push('Series stops receiving additional value beyond this point')

    return lines.join('\n')
  }

  /**
   * Get expected participation cap breakpoint count
   */
  getExpectedBreakpointCount(capTable: CapTableSnapshot): number {
    return CapTableHelpers.getPreferredWithCaps(capTable).length
  }
}
