/**
 * Participation Calculator
 *
 * Determines which securities participate in pro-rata distribution and their percentages.
 *
 * Participation Rules:
 * 1. Common Stock → Always participates
 * 2. Participating Preferred → Always participates (as-if-converted)
 * 3. Non-Participating Preferred → Only participates if voluntarily converted
 * 4. Options → Participates if exercised (when cumulative RVPS ≥ strike price)
 *
 * @module ParticipationCalculator
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot, PreferredShareClass, OptionGrant } from '../types/CapTableTypes'
import { ParticipationRules, ParticipationCalculationResult } from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * Conversion decisions map
 * Maps series name → has converted
 */
export type ConversionDecisions = Map<string, boolean>

/**
 * Exercise decisions map
 * Maps strike price → has exercised
 */
export type ExerciseDecisions = Map<string, boolean>

/**
 * ParticipationCalculator
 *
 * Calculates who participates in pro-rata distribution
 */
export class ParticipationCalculator {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Determine participants in pro-rata distribution
   */
  determineParticipants(
    capTable: CapTableSnapshot,
    conversionDecisions: ConversionDecisions = new Map(),
    exerciseDecisions: ExerciseDecisions = new Map()
  ): ParticipationCalculationResult {
    this.auditLogger.debug('Participation', 'Determining pro-rata participants')

    const participants: ParticipationCalculationResult['participants'] = []
    let totalShares = DecimalHelpers.toDecimal(0)

    // 1. Common stock (always participates)
    const commonShares = CapTableHelpers.getTotalCommonShares(capTable)
    if (DecimalHelpers.isPositive(commonShares)) {
      participants.push({
        securityName: 'Common Stock',
        securityType: 'common',
        shares: commonShares,
        percentage: DecimalHelpers.toDecimal(0), // Calculated after total known
        reason: 'Common stock always participates in pro-rata distribution',
      })
      totalShares = totalShares.plus(commonShares)
    }

    // 2. Participating preferred (always participates as-if-converted)
    const participatingPreferred = CapTableHelpers.getParticipatingPreferred(capTable)
    for (const series of participatingPreferred) {
      const convertedShares = CapTableHelpers.getConvertedShares(series)
      participants.push({
        securityName: series.name,
        securityType: 'preferred_series',
        shares: convertedShares,
        percentage: DecimalHelpers.toDecimal(0),
        reason: `Participating preferred (${series.preferenceType}) always participates as-if-converted`,
      })
      totalShares = totalShares.plus(convertedShares)
    }

    // 3. Non-participating preferred (only if voluntarily converted)
    const nonParticipatingPreferred = CapTableHelpers.getNonParticipatingPreferred(capTable)
    for (const series of nonParticipatingPreferred) {
      const hasConverted = conversionDecisions.get(series.name) || false

      if (hasConverted) {
        const convertedShares = CapTableHelpers.getConvertedShares(series)
        participants.push({
          securityName: series.name,
          securityType: 'preferred_series',
          shares: convertedShares,
          percentage: DecimalHelpers.toDecimal(0),
          reason: `Non-participating preferred voluntarily converted to common`,
        })
        totalShares = totalShares.plus(convertedShares)
      }
    }

    // 4. Options (only if exercised)
    const optionGroups = CapTableHelpers.groupOptionsByStrike(capTable)
    for (const [strikeKey, options] of optionGroups) {
      const hasExercised = exerciseDecisions.get(strikeKey) || false

      if (hasExercised) {
        const totalOptionsAtStrike = DecimalHelpers.sum(options.map((o) => o.numOptions))
        const poolNames = options.map((o) => o.poolName).join(', ')

        participants.push({
          securityName: `Options @ ${DecimalHelpers.formatCurrency(new Decimal(strikeKey))}`,
          securityType: 'option_pool',
          shares: totalOptionsAtStrike,
          percentage: DecimalHelpers.toDecimal(0),
          reason: `Options exercised (cumulative RVPS ≥ strike price)`,
        })
        totalShares = totalShares.plus(totalOptionsAtStrike)
      }
    }

    // Calculate percentages
    for (const participant of participants) {
      participant.percentage = DecimalHelpers.toDecimalPercentage(participant.shares, totalShares)
    }

    const logicApplied = this.generateLogicApplied(
      participants,
      conversionDecisions,
      exerciseDecisions
    )

    // Log participants
    this.auditLogger.debug(
      'Participation',
      `Total participating shares: ${DecimalHelpers.formatNumber(totalShares)}`,
      { participants: participants.length }
    )

    return {
      totalParticipatingShares: totalShares,
      participants,
      logicApplied,
    }
  }

  /**
   * Get participation rules for cap table
   */
  getParticipationRules(capTable: CapTableSnapshot): ParticipationRules {
    const alwaysParticipate: string[] = []
    const neverParticipate: string[] = []
    const conditionalParticipation: ParticipationRules['conditionalParticipation'] = []

    // Common stock always participates
    alwaysParticipate.push('Common Stock')

    // Participating preferred always participates
    const participatingPreferred = CapTableHelpers.getParticipatingPreferred(capTable)
    for (const series of participatingPreferred) {
      alwaysParticipate.push(series.name)
    }

    // Non-participating preferred conditionally participates
    const nonParticipatingPreferred = CapTableHelpers.getNonParticipatingPreferred(capTable)
    for (const series of nonParticipatingPreferred) {
      conditionalParticipation.push({
        security: series.name,
        condition: 'Voluntary conversion',
        trigger: `Exit value exceeds voluntary conversion indifference point`,
      })
    }

    // Options conditionally participate
    const uniqueStrikes = CapTableHelpers.getUniqueStrikePrices(capTable)
    for (const strike of uniqueStrikes) {
      conditionalParticipation.push({
        security: `Options @ ${DecimalHelpers.formatCurrency(strike)}`,
        condition: 'Option exercise',
        trigger: `Cumulative RVPS for common stock ≥ ${DecimalHelpers.formatCurrency(strike)}`,
      })
    }

    const rulesSummary = this.generateRulesSummary(alwaysParticipate, conditionalParticipation)

    return {
      alwaysParticipate,
      neverParticipate,
      conditionalParticipation,
      rulesSummary,
    }
  }

  /**
   * Calculate pro-rata share for a participant
   */
  calculateProRataShare(
    totalAmount: Decimal,
    participantShares: Decimal,
    totalParticipatingShares: Decimal
  ): Decimal {
    return DecimalHelpers.calculateProRataShare(
      totalAmount,
      participantShares,
      totalParticipatingShares
    )
  }

  /**
   * Check if a security participates
   */
  doesParticipate(
    securityName: string,
    capTable: CapTableSnapshot,
    conversionDecisions: ConversionDecisions = new Map(),
    exerciseDecisions: ExerciseDecisions = new Map()
  ): boolean {
    // Common stock always participates
    if (securityName === 'Common Stock') {
      return true
    }

    // Check preferred series
    const series = CapTableHelpers.getSeriesByName(capTable, securityName)
    if (series) {
      // Participating preferred always participates
      if (
        series.preferenceType === 'participating' ||
        series.preferenceType === 'participating-with-cap'
      ) {
        return true
      }

      // Non-participating only if converted
      return conversionDecisions.get(series.name) || false
    }

    // Check if it's an option pool
    if (securityName.startsWith('Options @ ')) {
      const strike = this.extractStrikeFromOptionName(securityName)
      return exerciseDecisions.get(strike.toString()) || false
    }

    return false
  }

  /**
   * Calculate total participating shares at a given state
   */
  calculateTotalParticipatingShares(
    capTable: CapTableSnapshot,
    conversionDecisions: ConversionDecisions = new Map(),
    exerciseDecisions: ExerciseDecisions = new Map()
  ): Decimal {
    const result = this.determineParticipants(capTable, conversionDecisions, exerciseDecisions)
    return result.totalParticipatingShares
  }

  /**
   * Get participating securities list
   */
  getParticipatingSecurities(
    capTable: CapTableSnapshot,
    conversionDecisions: ConversionDecisions = new Map(),
    exerciseDecisions: ExerciseDecisions = new Map()
  ): string[] {
    const result = this.determineParticipants(capTable, conversionDecisions, exerciseDecisions)
    return result.participants.map((p) => p.securityName)
  }

  /**
   * Calculate participation cap threshold
   */
  calculateCapThreshold(
    series: PreferredShareClass,
    totalParticipatingShares: Decimal,
    totalLP: Decimal
  ): Decimal | null {
    return CapTableHelpers.calculateCapThreshold(series, totalParticipatingShares, totalLP)
  }

  /**
   * Generate logic applied explanation
   */
  private generateLogicApplied(
    participants: ParticipationCalculationResult['participants'],
    conversionDecisions: ConversionDecisions,
    exerciseDecisions: ExerciseDecisions
  ): string {
    const parts: string[] = []

    parts.push('Pro-rata participation determined by:')

    const common = participants.filter((p) => p.securityType === 'common')
    if (common.length > 0) {
      parts.push('- Common stock: Always participates')
    }

    const participatingPreferred = participants.filter(
      (p) => p.securityType === 'preferred_series' && p.reason.includes('Participating preferred')
    )
    if (participatingPreferred.length > 0) {
      parts.push(
        `- Participating preferred: Always participates (as-if-converted) - ${participatingPreferred.map((p) => p.securityName).join(', ')}`
      )
    }

    const convertedNonParticipating = participants.filter(
      (p) => p.securityType === 'preferred_series' && p.reason.includes('voluntarily converted')
    )
    if (convertedNonParticipating.length > 0) {
      parts.push(
        `- Non-participating preferred (converted): ${convertedNonParticipating.map((p) => p.securityName).join(', ')}`
      )
    }

    const exercisedOptions = participants.filter((p) => p.securityType === 'option_pool')
    if (exercisedOptions.length > 0) {
      parts.push(`- Options (exercised): ${exercisedOptions.map((p) => p.securityName).join(', ')}`)
    }

    return parts.join('\n')
  }

  /**
   * Generate rules summary
   */
  private generateRulesSummary(
    alwaysParticipate: string[],
    conditionalParticipation: ParticipationRules['conditionalParticipation']
  ): string {
    const parts: string[] = []

    if (alwaysParticipate.length > 0) {
      parts.push(`Always participate: ${alwaysParticipate.join(', ')}`)
    }

    if (conditionalParticipation.length > 0) {
      parts.push('')
      parts.push('Conditional participation:')
      for (const rule of conditionalParticipation) {
        parts.push(`- ${rule.security}: ${rule.trigger}`)
      }
    }

    return parts.join('\n')
  }

  /**
   * Extract strike price from option security name
   */
  private extractStrikeFromOptionName(optionName: string): Decimal {
    // Format: "Options @ $1.25"
    const match = optionName.match(/\$([0-9,.]+)/)
    if (match) {
      return DecimalHelpers.parseCurrency(match[1])
    }
    return DecimalHelpers.toDecimal(0)
  }
}
