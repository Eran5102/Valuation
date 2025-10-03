/**
 * Cap Table Helper Utilities
 *
 * Provides utility functions for working with cap table data structures.
 * Used by analyzers and calculators to extract and manipulate cap table information.
 *
 * @module CapTableHelpers
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import {
  CapTableSnapshot,
  PreferredShareClass,
  OptionGrant,
  SeniorityGroup,
  PreferenceType,
} from '../types/CapTableTypes'
import { DecimalHelpers } from './DecimalHelpers'

/**
 * CapTableHelpers class
 *
 * Provides static utility methods for cap table analysis
 */
export class CapTableHelpers {
  /**
   * Group preferred share classes by seniority rank
   * Returns seniority groups sorted from most senior (0) to most junior
   */
  static groupBySeniority(capTable: CapTableSnapshot): SeniorityGroup[] {
    const groupMap = new Map<number, PreferredShareClass[]>()

    // Group by seniority
    for (const series of capTable.preferredSeries) {
      const existing = groupMap.get(series.seniority) || []
      existing.push(series)
      groupMap.set(series.seniority, existing)
    }

    // Convert to SeniorityGroup array, sorted by seniority (0 first)
    const groups: SeniorityGroup[] = []
    const sortedRanks = Array.from(groupMap.keys()).sort((a, b) => a - b)

    for (const rank of sortedRanks) {
      const classes = groupMap.get(rank)!
      const totalLP = DecimalHelpers.sum(classes.map((c) => c.totalLiquidationPreference))
      const totalShares = DecimalHelpers.sum(classes.map((c) => c.sharesOutstanding))

      groups.push({
        rank,
        classes,
        totalLiquidationPreference: totalLP,
        totalShares,
        isPariPassu: classes.length > 1,
      })
    }

    return groups
  }

  /**
   * Calculate cumulative liquidation preference up to and including a seniority rank
   */
  static calculateCumulativeLP(capTable: CapTableSnapshot, upToSeniority: number): Decimal {
    return DecimalHelpers.sum(
      capTable.preferredSeries
        .filter((s) => s.seniority <= upToSeniority)
        .map((s) => s.totalLiquidationPreference)
    )
  }

  /**
   * Calculate total liquidation preference across all preferred series
   */
  static calculateTotalLP(capTable: CapTableSnapshot): Decimal {
    return DecimalHelpers.sum(capTable.preferredSeries.map((s) => s.totalLiquidationPreference))
  }

  /**
   * Get total common shares (including converted preferred if applicable)
   */
  static getTotalCommonShares(capTable: CapTableSnapshot): Decimal {
    return capTable.commonStock.sharesOutstanding
  }

  /**
   * Get total preferred shares
   */
  static getTotalPreferredShares(capTable: CapTableSnapshot): Decimal {
    return DecimalHelpers.sum(capTable.preferredSeries.map((s) => s.sharesOutstanding))
  }

  /**
   * Get total option shares
   */
  static getTotalOptionShares(capTable: CapTableSnapshot): Decimal {
    return DecimalHelpers.sum(capTable.options.map((o) => o.numOptions))
  }

  /**
   * Calculate total fully diluted shares (common + preferred + options)
   */
  static getTotalFullyDilutedShares(capTable: CapTableSnapshot): Decimal {
    return this.getTotalCommonShares(capTable)
      .plus(this.getTotalPreferredShares(capTable))
      .plus(this.getTotalOptionShares(capTable))
  }

  /**
   * Get participating preferred series (participating or participating-with-cap)
   */
  static getParticipatingPreferred(capTable: CapTableSnapshot): PreferredShareClass[] {
    return capTable.preferredSeries.filter(
      (s) => s.preferenceType === 'participating' || s.preferenceType === 'participating-with-cap'
    )
  }

  /**
   * Get non-participating preferred series
   */
  static getNonParticipatingPreferred(capTable: CapTableSnapshot): PreferredShareClass[] {
    return capTable.preferredSeries.filter((s) => s.preferenceType === 'non-participating')
  }

  /**
   * Get preferred series with participation caps
   */
  static getPreferredWithCaps(capTable: CapTableSnapshot): PreferredShareClass[] {
    return capTable.preferredSeries.filter(
      (s) => s.preferenceType === 'participating-with-cap' && s.participationCap
    )
  }

  /**
   * Group options by strike price
   */
  static groupOptionsByStrike(capTable: CapTableSnapshot): Map<string, OptionGrant[]> {
    const groupMap = new Map<string, OptionGrant[]>()

    for (const option of capTable.options) {
      const strikeKey = option.exercisePrice.toString()
      const existing = groupMap.get(strikeKey) || []
      existing.push(option)
      groupMap.set(strikeKey, existing)
    }

    return groupMap
  }

  /**
   * Get unique option strike prices, sorted ascending
   */
  static getUniqueStrikePrices(capTable: CapTableSnapshot): Decimal[] {
    const strikes = new Set<string>()

    for (const option of capTable.options) {
      strikes.add(option.exercisePrice.toString())
    }

    return Array.from(strikes)
      .map((s) => new Decimal(s))
      .sort((a, b) => DecimalHelpers.compare(a, b))
  }

  /**
   * Get total options at a specific strike price
   */
  static getTotalOptionsAtStrike(capTable: CapTableSnapshot, strikePrice: Decimal): Decimal {
    return DecimalHelpers.sum(
      capTable.options
        .filter((o) => DecimalHelpers.equals(o.exercisePrice, strikePrice))
        .map((o) => o.numOptions)
    )
  }

  /**
   * Calculate total shares participating in pro-rata distribution
   * Includes: common + participating preferred (as-if-converted)
   */
  static getTotalParticipatingShares(
    capTable: CapTableSnapshot,
    includeExercisedOptions: boolean = false,
    exercisedOptionShares: Decimal = DecimalHelpers.toDecimal(0)
  ): Decimal {
    let totalShares = this.getTotalCommonShares(capTable)

    // Add participating preferred (as-if-converted)
    const participatingPreferred = this.getParticipatingPreferred(capTable)
    for (const series of participatingPreferred) {
      totalShares = totalShares.plus(series.sharesOutstanding.times(series.conversionRatio))
    }

    // Add exercised options if applicable
    if (includeExercisedOptions) {
      totalShares = totalShares.plus(exercisedOptionShares)
    }

    return totalShares
  }

  /**
   * Get preferred series by name
   */
  static getSeriesByName(capTable: CapTableSnapshot, name: string): PreferredShareClass | null {
    return capTable.preferredSeries.find((s) => s.name === name) || null
  }

  /**
   * Get preferred series by seniority rank
   */
  static getSeriesBySeniority(
    capTable: CapTableSnapshot,
    seniority: number
  ): PreferredShareClass[] {
    return capTable.preferredSeries.filter((s) => s.seniority === seniority)
  }

  /**
   * Get most senior preferred series (seniority = 0)
   */
  static getMostSeniorSeries(capTable: CapTableSnapshot): PreferredShareClass[] {
    const minSeniority = Math.min(...capTable.preferredSeries.map((s) => s.seniority))
    return this.getSeriesBySeniority(capTable, minSeniority)
  }

  /**
   * Get most junior preferred series (highest seniority number)
   */
  static getMostJuniorSeries(capTable: CapTableSnapshot): PreferredShareClass[] {
    const maxSeniority = Math.max(...capTable.preferredSeries.map((s) => s.seniority))
    return this.getSeriesBySeniority(capTable, maxSeniority)
  }

  /**
   * Calculate class-specific RVPS (Redemption Value Per Share)
   * RVPS = Class LP ÷ Class Shares
   */
  static calculateClassRVPS(series: PreferredShareClass): Decimal {
    return DecimalHelpers.calculateRVPS(series.totalLiquidationPreference, series.sharesOutstanding)
  }

  /**
   * Calculate conversion ratio adjusted shares
   * (shares × conversion ratio = common-equivalent shares)
   */
  static getConvertedShares(series: PreferredShareClass): Decimal {
    return series.sharesOutstanding.times(series.conversionRatio)
  }

  /**
   * Check if cap table has any participating preferred
   */
  static hasParticipatingPreferred(capTable: CapTableSnapshot): boolean {
    return this.getParticipatingPreferred(capTable).length > 0
  }

  /**
   * Check if cap table has any non-participating preferred
   */
  static hasNonParticipatingPreferred(capTable: CapTableSnapshot): boolean {
    return this.getNonParticipatingPreferred(capTable).length > 0
  }

  /**
   * Check if cap table has any options
   */
  static hasOptions(capTable: CapTableSnapshot): boolean {
    return capTable.options.length > 0
  }

  /**
   * Check if cap table has any participation caps
   */
  static hasParticipationCaps(capTable: CapTableSnapshot): boolean {
    return this.getPreferredWithCaps(capTable).length > 0
  }

  /**
   * Get distinct seniority ranks
   */
  static getDistinctSeniorityRanks(capTable: CapTableSnapshot): number[] {
    const ranks = new Set(capTable.preferredSeries.map((s) => s.seniority))
    return Array.from(ranks).sort((a, b) => a - b)
  }

  /**
   * Count distinct seniority ranks (used for LP breakpoint count validation)
   */
  static countDistinctSeniorityRanks(capTable: CapTableSnapshot): number {
    return this.getDistinctSeniorityRanks(capTable).length
  }

  /**
   * Calculate participation cap threshold for a series
   * Returns the exit value where participation cap is reached
   */
  static calculateCapThreshold(
    series: PreferredShareClass,
    totalParticipatingShares: Decimal,
    totalLP: Decimal
  ): Decimal | null {
    if (series.preferenceType !== 'participating-with-cap' || !series.participationCap) {
      return null
    }

    // Cap threshold = Total LP + (Cap - LP) × (Total Shares ÷ Series Shares)
    // This is the exit value where series reaches its participation cap
    const capValue = series.participationCap
    const lpValue = series.totalLiquidationPreference
    const capExcess = capValue.minus(lpValue)

    if (DecimalHelpers.isZero(capExcess) || capExcess.isNegative()) {
      return null // Cap already reached or invalid
    }

    const seriesConvertedShares = this.getConvertedShares(series)
    const proRataPercentage = DecimalHelpers.safeDivide(
      seriesConvertedShares,
      totalParticipatingShares
    )

    if (DecimalHelpers.isZero(proRataPercentage)) {
      return null
    }

    // Exit value where cap is reached:
    // Series Pro-rata Value = Cap - LP
    // (Exit - Total LP) × Pro-rata % = Cap - LP
    // Exit = Total LP + (Cap - LP) / Pro-rata %
    const threshold = totalLP.plus(capExcess.dividedBy(proRataPercentage))

    return threshold
  }

  /**
   * Validate cap table structure
   * Returns array of validation issues (empty if valid)
   */
  static validateStructure(capTable: CapTableSnapshot): string[] {
    const issues: string[] = []

    // Check for duplicate series names
    const names = new Set<string>()
    for (const series of capTable.preferredSeries) {
      if (names.has(series.name)) {
        issues.push(`Duplicate series name: ${series.name}`)
      }
      names.add(series.name)
    }

    // Check seniority is sequential (no gaps)
    const seniorityRanks = this.getDistinctSeniorityRanks(capTable)
    for (let i = 0; i < seniorityRanks.length; i++) {
      if (seniorityRanks[i] !== i) {
        issues.push(`Seniority gap detected: expected ${i}, found ${seniorityRanks[i]}`)
      }
    }

    // Check for negative values
    for (const series of capTable.preferredSeries) {
      if (series.sharesOutstanding.isNegative()) {
        issues.push(`${series.name}: Negative shares outstanding`)
      }
      if (series.pricePerShare.isNegative()) {
        issues.push(`${series.name}: Negative price per share`)
      }
      if (series.liquidationMultiple.isNegative()) {
        issues.push(`${series.name}: Negative liquidation multiple`)
      }
    }

    // Check common stock
    if (capTable.commonStock.sharesOutstanding.isNegative()) {
      issues.push('Common stock: Negative shares outstanding')
    }

    // Check options
    for (const option of capTable.options) {
      if (option.numOptions.isNegative()) {
        issues.push(`${option.poolName}: Negative option count`)
      }
      if (option.exercisePrice.isNegative()) {
        issues.push(`${option.poolName}: Negative exercise price`)
      }
      if (option.vested.gt(option.numOptions)) {
        issues.push(`${option.poolName}: Vested exceeds total options`)
      }
    }

    return issues
  }

  /**
   * Clone cap table snapshot (deep copy)
   */
  static clone(capTable: CapTableSnapshot): CapTableSnapshot {
    return JSON.parse(
      JSON.stringify(capTable, (key, value) => {
        // Handle Decimal serialization
        if (value && value.constructor && value.constructor.name === 'Decimal') {
          return value.toString()
        }
        return value
      })
    )
  }

  /**
   * Get summary statistics for cap table
   */
  static getSummaryStats(capTable: CapTableSnapshot): {
    totalLP: Decimal
    totalCommonShares: Decimal
    totalPreferredShares: Decimal
    totalOptionShares: Decimal
    totalFullyDilutedShares: Decimal
    seniorityRanks: number
    participatingSeriesCount: number
    nonParticipatingSeriesCount: number
    optionPoolsCount: number
    uniqueStrikePrices: number
  } {
    return {
      totalLP: this.calculateTotalLP(capTable),
      totalCommonShares: this.getTotalCommonShares(capTable),
      totalPreferredShares: this.getTotalPreferredShares(capTable),
      totalOptionShares: this.getTotalOptionShares(capTable),
      totalFullyDilutedShares: this.getTotalFullyDilutedShares(capTable),
      seniorityRanks: this.countDistinctSeniorityRanks(capTable),
      participatingSeriesCount: this.getParticipatingPreferred(capTable).length,
      nonParticipatingSeriesCount: this.getNonParticipatingPreferred(capTable).length,
      optionPoolsCount: capTable.options.length,
      uniqueStrikePrices: this.getUniqueStrikePrices(capTable).length,
    }
  }
}
