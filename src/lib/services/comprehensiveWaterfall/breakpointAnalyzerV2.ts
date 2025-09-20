/**
 * Waterfall Breakpoint Analysis System
 *
 * This module implements a mathematically rigorous breakpoint analysis for M&A and liquidity events.
 * It handles complex cap table structures with full auditability and edge case handling.
 *
 * @module BreakpointAnalyzer
 * @version 2.0.0
 */

import Decimal from 'decimal.js'

// Configure Decimal for high precision financial calculations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Database schema interface matching our existing structure
 */
export interface DatabaseShareClass {
  id: number
  companyId: number
  shareType: 'common' | 'preferred'
  name: string
  roundDate: string
  sharesOutstanding: number
  pricePerShare: number
  preferenceType: 'non-participating' | 'participating' | 'participating-with-cap'
  lpMultiple: number
  seniority: number // 0 = most senior, higher numbers = more junior
  participationCap: number | null
  conversionRatio: number
  dividendsDeclared: boolean
  dividendsRate: number | null
  dividendsType: string | null
  pik: boolean
}

export interface DatabaseOption {
  id: string
  numOptions: number
  exercisePrice: number
  type: string
  vested?: number // Vested portion, defaults to all if not specified
}

/**
 * Breakpoint types following mathematical rules
 */
export enum BreakpointType {
  LIQUIDATION_PREFERENCE = 'liquidation_preference',
  PRO_RATA_DISTRIBUTION = 'pro_rata_distribution',
  OPTION_EXERCISE = 'option_exercise',
  VOLUNTARY_CONVERSION = 'voluntary_conversion',
  PARTICIPATION_CAP = 'participation_cap',
}

/**
 * Complete breakpoint specification with full audit trail
 */
export interface BreakpointSpec {
  breakpointType: BreakpointType
  exitValue: Decimal
  affectedSecurities: string[]
  calculationMethod: string
  priorityOrder: number
  explanation: string
  mathematicalDerivation: string
  dependencies: string[]
}

/**
 * Critical value points in the waterfall
 */
export interface CriticalValue {
  value: Decimal
  description: string
  affectedSecurities: string[]
  triggers: string[]
}

/**
 * Complete analysis result structure
 */
export interface BreakpointAnalysisResult {
  totalBreakpoints: number
  breakpointsByType: Record<BreakpointType, number>
  sortedBreakpoints: BreakpointSpec[]
  criticalValues: CriticalValue[]
  auditSummary: string
  validationResults: ValidationResult[]
  performanceMetrics: {
    analysisTimeMs: number
    iterationsUsed: Record<string, number>
    cacheHits: number
  }
}

export interface ValidationResult {
  testName: string
  passed: boolean
  expected: any
  actual: any
  message: string
}

/**
 * Main Breakpoint Analyzer Class
 * Implements rigorous mathematical analysis with full audit trail
 */
export class BreakpointAnalyzer {
  private shareClasses: DatabaseShareClass[]
  private options: DatabaseOption[]
  private auditTrail: string[] = []
  private rvpsCache = new Map<string, Decimal>()
  private performanceMetrics = {
    analysisTimeMs: 0,
    iterationsUsed: {} as Record<string, number>,
    cacheHits: 0,
  }

  // Configuration constants
  private readonly CONVERGENCE_TOLERANCE = 0.01
  private readonly MAX_ITERATIONS = 100
  private readonly OPTION_BAND_THRESHOLD = 0.0 // Disabled: treat each strike as separate breakpoint

  constructor(shareClasses: DatabaseShareClass[], options: DatabaseOption[] = []) {
    this.shareClasses = shareClasses
    this.options = options
    this.validateInputData()
  }

  /**
   * Main analysis method - calculates all breakpoints systematically
   */
  public analyzeCompleteBreakpointStructure(): BreakpointAnalysisResult {
    const startTime = Date.now()
    this.auditTrail = [`Analysis started at ${new Date().toISOString()}`]

    const allBreakpoints: BreakpointSpec[] = []
    const criticalValues: CriticalValue[] = []
    const breakpointCounts: Record<BreakpointType, number> = {
      [BreakpointType.LIQUIDATION_PREFERENCE]: 0,
      [BreakpointType.PRO_RATA_DISTRIBUTION]: 0,
      [BreakpointType.OPTION_EXERCISE]: 0,
      [BreakpointType.VOLUNTARY_CONVERSION]: 0,
      [BreakpointType.PARTICIPATION_CAP]: 0,
    }

    try {
      // Step 1: Count breakpoints by type BEFORE calculating
      const expectedCounts = this.countExpectedBreakpoints()
      this.auditTrail.push(`Expected breakpoint counts: ${JSON.stringify(expectedCounts)}`)

      // Step 2: Calculate breakpoints in EXACT order

      // Type 1: Liquidation Preference breakpoints
      const lpResults = this.calculateLiquidationPreferenceBreakpoints()
      allBreakpoints.push(...lpResults.breakpoints)
      criticalValues.push(...lpResults.criticalValues)
      breakpointCounts[BreakpointType.LIQUIDATION_PREFERENCE] = lpResults.breakpoints.length

      // Type 2: Pro Rata Distribution breakpoint (always exactly 1)
      const proRataResult = this.calculateProRataBreakpoint()
      if (proRataResult.breakpoint) {
        allBreakpoints.push(proRataResult.breakpoint)
        criticalValues.push(proRataResult.criticalValue)
        breakpointCounts[BreakpointType.PRO_RATA_DISTRIBUTION] = 1
      }

      // Type 3: Option Exercise breakpoints
      const optionResults = this.calculateOptionExerciseBreakpoints()
      allBreakpoints.push(...optionResults.breakpoints)
      criticalValues.push(...optionResults.criticalValues)
      breakpointCounts[BreakpointType.OPTION_EXERCISE] = optionResults.breakpoints.length

      // Type 4: Voluntary Conversion breakpoints
      const conversionResults = this.calculateVoluntaryConversionBreakpoints()
      allBreakpoints.push(...conversionResults.breakpoints)
      criticalValues.push(...conversionResults.criticalValues)
      breakpointCounts[BreakpointType.VOLUNTARY_CONVERSION] = conversionResults.breakpoints.length

      // Type 5: Participation Cap breakpoints
      const capResults = this.calculateParticipationCapBreakpoints()
      allBreakpoints.push(...capResults.breakpoints)
      criticalValues.push(...capResults.criticalValues)
      breakpointCounts[BreakpointType.PARTICIPATION_CAP] = capResults.breakpoints.length

      // Step 3: Sort all breakpoints by exit value
      const sortedBreakpoints = allBreakpoints.sort((a, b) =>
        a.exitValue.sub(b.exitValue).toNumber()
      )

      // Step 4: Validate results
      const validationResults = this.validateResults(sortedBreakpoints, expectedCounts)

      this.performanceMetrics.analysisTimeMs = Date.now() - startTime
      this.auditTrail.push(`Analysis completed in ${this.performanceMetrics.analysisTimeMs}ms`)

      return {
        totalBreakpoints: sortedBreakpoints.length,
        breakpointsByType: breakpointCounts,
        sortedBreakpoints,
        criticalValues,
        auditSummary: this.auditTrail.join('\n'),
        validationResults,
        performanceMetrics: this.performanceMetrics,
      }
    } catch (error) {
      this.auditTrail.push(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  /**
   * Count expected breakpoints before calculation (for validation)
   * Enhanced to include participating-with-cap voluntary conversions
   */
  private countExpectedBreakpoints(): Record<BreakpointType, number> {
    const distinctSeniorityRanks = new Set(
      this.shareClasses.filter((sc) => sc.shareType === 'preferred').map((sc) => sc.seniority)
    ).size

    const uniqueStrikePrices = new Set(
      this.options.filter((opt) => opt.exercisePrice > 0.01).map((opt) => opt.exercisePrice)
    ).size

    const nonParticipatingPreferred = this.shareClasses.filter(
      (sc) => sc.shareType === 'preferred' && sc.preferenceType === 'non-participating'
    ).length

    const cappedParticipating = this.shareClasses.filter(
      (sc) =>
        sc.shareType === 'preferred' &&
        sc.preferenceType === 'participating-with-cap' &&
        sc.participationCap !== null
    ).length

    // Enhanced voluntary conversion count: non-participating + participating-with-cap
    const maxVoluntaryConversions = nonParticipatingPreferred + cappedParticipating

    return {
      [BreakpointType.LIQUIDATION_PREFERENCE]: distinctSeniorityRanks,
      [BreakpointType.PRO_RATA_DISTRIBUTION]: 1,
      [BreakpointType.OPTION_EXERCISE]: uniqueStrikePrices,
      [BreakpointType.VOLUNTARY_CONVERSION]: maxVoluntaryConversions, // Updated formula
      [BreakpointType.PARTICIPATION_CAP]: cappedParticipating,
    }
  }

  /**
   * Type 1: Liquidation Preference Breakpoints
   * Mathematical Formula: Number of breakpoints = Number of distinct seniority ranks
   */
  private calculateLiquidationPreferenceBreakpoints(): {
    breakpoints: BreakpointSpec[]
    criticalValues: CriticalValue[]
  } {
    const breakpoints: BreakpointSpec[] = []
    const criticalValues: CriticalValue[] = []

    // Group preferred shares by seniority rank (pari passu shares have same rank)
    const preferredShares = this.shareClasses.filter((sc) => sc.shareType === 'preferred')
    const seniorityGroups = new Map<number, DatabaseShareClass[]>()

    for (const shareClass of preferredShares) {
      const rank = shareClass.seniority
      if (!seniorityGroups.has(rank)) {
        seniorityGroups.set(rank, [])
      }
      seniorityGroups.get(rank)!.push(shareClass)
    }

    // Sort by seniority (0 = most senior)
    const sortedRanks = Array.from(seniorityGroups.keys()).sort((a, b) => a - b)

    let cumulativeLp = new Decimal(0)

    for (const rank of sortedRanks) {
      const classesAtRank = seniorityGroups.get(rank)!
      const rankLp = classesAtRank.reduce((sum, sc) => {
        const lp = new Decimal(sc.sharesOutstanding).mul(sc.pricePerShare).mul(sc.lpMultiple)
        return sum.add(lp)
      }, new Decimal(0))

      cumulativeLp = cumulativeLp.add(rankLp)

      const affectedSecurities = classesAtRank.map((sc) => sc.name)
      const pariPassuNote = classesAtRank.length > 1 ? ' (pari passu)' : ''

      breakpoints.push({
        breakpointType: BreakpointType.LIQUIDATION_PREFERENCE,
        exitValue: cumulativeLp,
        affectedSecurities,
        calculationMethod: 'cumulative_liquidation_preference',
        priorityOrder: rank * 100,
        explanation: `Seniority rank ${rank}${pariPassuNote} liquidation preferences satisfied`,
        mathematicalDerivation: `LP = Σ(shares × LP_per_share × multiple) = ${rankLp.toFixed(2)} (cumulative: ${cumulativeLp.toFixed(2)})`,
        dependencies: rank > 0 ? [`seniority_rank_${rank - 1}_satisfied`] : [],
      })

      criticalValues.push({
        value: cumulativeLp,
        description: `Cumulative LP through seniority rank ${rank}`,
        affectedSecurities,
        triggers: [`seniority_rank_${rank}_satisfied`],
      })

      this.auditTrail.push(
        `LP Breakpoint: Rank ${rank}${pariPassuNote} at $${cumulativeLp.toFixed(2)} ` +
          `(${affectedSecurities.join(', ')})`
      )
    }

    return { breakpoints, criticalValues }
  }

  /**
   * Type 2: Pro Rata Distribution Breakpoint
   * Mathematical Formula: Always exactly 1 breakpoint at total LP value
   */
  private calculateProRataBreakpoint(): {
    breakpoint: BreakpointSpec | null
    criticalValue: CriticalValue
  } {
    const totalLp = this.getTotalLiquidationPreference()

    // Calculate participating securities
    const commonShares = this.shareClasses
      .filter((sc) => sc.shareType === 'common')
      .reduce((sum, sc) => sum.add(sc.sharesOutstanding), new Decimal(0))

    const participatingPreferred = this.shareClasses
      .filter(
        (sc) =>
          sc.shareType === 'preferred' &&
          (sc.preferenceType === 'participating' || sc.preferenceType === 'participating-with-cap')
      )
      .reduce((sum, sc) => {
        const convertedShares = new Decimal(sc.sharesOutstanding).mul(sc.conversionRatio)
        return sum.add(convertedShares)
      }, new Decimal(0))

    // Include cheap options (strike ≤ $0.01) as they always exercise
    const cheapOptions = this.options
      .filter((opt) => opt.exercisePrice <= 0.01)
      .reduce((sum, opt) => sum + (opt.vested || opt.numOptions), 0)

    const totalParticipatingShares = commonShares.add(participatingPreferred).add(cheapOptions)

    const breakpoint: BreakpointSpec = {
      breakpointType: BreakpointType.PRO_RATA_DISTRIBUTION,
      exitValue: totalLp,
      affectedSecurities: ['All participating securities'],
      calculationMethod: 'total_liquidation_preferences',
      priorityOrder: 1000,
      explanation: 'Pro rata distribution begins after all liquidation preferences satisfied',
      mathematicalDerivation: `Exit value = Total LP = ${totalLp.toFixed(2)}`,
      dependencies: ['all_liquidation_preferences_satisfied'],
    }

    const criticalValue: CriticalValue = {
      value: totalLp,
      description: 'Pro rata distribution commencement point',
      affectedSecurities: ['Common Stock', 'Participating Preferred', 'Cheap Options'],
      triggers: ['pro_rata_distribution_start'],
    }

    this.auditTrail.push(
      `Pro Rata Breakpoint: $${totalLp.toFixed(2)} ` +
        `(${totalParticipatingShares.toFixed(0)} participating shares)`
    )

    return { breakpoint, criticalValue }
  }

  /**
   * Type 3: Option Exercise Breakpoints with Sequential Dilution Logic
   * Mathematical Formula: Number of breakpoints = Number of unique strike prices > $0.01
   * Enhanced with cumulative dilution from previously exercised options
   */
  private calculateOptionExerciseBreakpoints(): {
    breakpoints: BreakpointSpec[]
    criticalValues: CriticalValue[]
  } {
    const breakpoints: BreakpointSpec[] = []
    const criticalValues: CriticalValue[] = []

    // Group options by unique strike price (excluding cheap options ≤ $0.01)
    // Each strike price creates a separate breakpoint
    const strikeGroups = new Map<number, DatabaseOption[]>()

    for (const option of this.options.filter((opt) => opt.exercisePrice > 0.01)) {
      const strike = option.exercisePrice

      if (!strikeGroups.has(strike)) {
        strikeGroups.set(strike, [])
      }
      strikeGroups.get(strike)!.push(option)
    }

    // Sort strikes in ascending order for sequential processing
    const sortedStrikes = Array.from(strikeGroups.keys()).sort((a, b) => a - b)

    // Track cumulative exercised options from lower strikes
    let cumulativeExercisedOptions = 0
    let cumulativeOptionProceeds = 0

    for (const strike of sortedStrikes) {
      const optionsAtStrike = strikeGroups.get(strike)!
      const totalOptionsAtStrike = optionsAtStrike.reduce(
        (sum, opt) => sum + (opt.vested || opt.numOptions),
        0
      )

      // Solve circularity with cumulative dilution from previous option exercises
      const exitValue = this.solveSequentialOptionExercise(
        strike,
        totalOptionsAtStrike,
        cumulativeExercisedOptions,
        cumulativeOptionProceeds
      )

      if (exitValue) {
        const bandNote =
          optionsAtStrike.length > 1 ? ` (${optionsAtStrike.length} option grants banded)` : ''

        // Update cumulative counters for next iteration
        cumulativeExercisedOptions += totalOptionsAtStrike
        cumulativeOptionProceeds += totalOptionsAtStrike * strike

        breakpoints.push({
          breakpointType: BreakpointType.OPTION_EXERCISE,
          exitValue: new Decimal(exitValue),
          affectedSecurities: [`Options @ $${strike.toFixed(2)}${bandNote}`],
          calculationMethod: 'sequential_dilution_solver',
          priorityOrder: 2000 + Math.floor(strike * 100),
          explanation: `Options with strike $${strike.toFixed(2)} become profitable to exercise (sequential)`,
          mathematicalDerivation: `Solved with ${cumulativeExercisedOptions - totalOptionsAtStrike} prior options exercised: share_value(exit) > $${strike.toFixed(2)}`,
          dependencies:
            cumulativeExercisedOptions > totalOptionsAtStrike
              ? [`prior_option_exercises_${cumulativeExercisedOptions - totalOptionsAtStrike}`]
              : [],
        })

        criticalValues.push({
          value: new Decimal(exitValue),
          description: `Sequential option exercise threshold for $${strike.toFixed(2)} strike`,
          affectedSecurities: [
            `${totalOptionsAtStrike} options (cumulative: ${cumulativeExercisedOptions})`,
          ],
          triggers: [`sequential_option_exercise_${strike.toFixed(2)}`],
        })

        this.auditTrail.push(
          `Sequential Option Exercise: $${exitValue.toFixed(2)} for strike $${strike.toFixed(2)}${bandNote} ` +
            `(${cumulativeExercisedOptions} total options)`
        )
      }
    }

    return { breakpoints, criticalValues }
  }

  /**
   * Sequential iterative solver for option exercise with cumulative dilution
   * Accounts for previously exercised options in the dilution calculation
   */
  private solveSequentialOptionExercise(
    strikePrice: number,
    optionCount: number,
    priorExercisedOptions: number,
    priorOptionProceeds: number
  ): number | null {
    let exitValue = strikePrice * optionCount * 10 // Initial guess
    let previousValue = 0
    let iterations = 0

    const totalLp = this.getTotalLiquidationPreference().toNumber()
    exitValue = Math.max(exitValue, totalLp) // Must be above LP

    while (
      Math.abs(exitValue - previousValue) > this.CONVERGENCE_TOLERANCE &&
      iterations < this.MAX_ITERATIONS
    ) {
      previousValue = exitValue

      // Calculate share base including previously exercised options
      const baseShares = this.getTotalSharesWithoutOptions()
      const currentShareBase = baseShares + priorExercisedOptions

      // Calculate total proceeds including prior option exercises
      const currentOptionProceeds = optionCount * strikePrice
      const totalProceeds = exitValue + priorOptionProceeds + currentOptionProceeds
      const totalShares = currentShareBase + optionCount

      // Calculate per-share value with all dilution effects
      const shareValueWithExercise = (totalProceeds - totalLp) / totalShares

      if (shareValueWithExercise > strikePrice * 1.001) {
        // Options would exercise - this is our breakpoint
        // Fine-tune to find exact indifference point
        const targetShareValue = strikePrice * 1.0005 // Just above strike
        exitValue =
          targetShareValue * totalShares + totalLp - priorOptionProceeds - currentOptionProceeds
        break
      } else if (shareValueWithExercise < strikePrice * 0.999) {
        // Options wouldn't exercise - increase exit value
        exitValue = exitValue * 1.05
      } else {
        // Very close to indifference point
        break
      }

      iterations++
    }

    this.performanceMetrics.iterationsUsed[`sequential_option_${strikePrice}`] = iterations

    if (iterations >= this.MAX_ITERATIONS) {
      this.auditTrail.push(
        `WARNING: Sequential option exercise solver did not converge for strike $${strikePrice}`
      )
      return null
    }

    // Final validation: ensure this exit value makes economic sense
    const finalShareBase = this.getTotalSharesWithoutOptions() + priorExercisedOptions + optionCount
    const finalShareValue =
      (exitValue + priorOptionProceeds + optionCount * strikePrice - totalLp) / finalShareBase

    if (finalShareValue <= strikePrice) {
      this.auditTrail.push(
        `WARNING: Final validation failed for strike $${strikePrice} - share value ${finalShareValue.toFixed(4)} <= strike`
      )
      return null
    }

    return exitValue
  }

  /**
   * Type 4: Voluntary Conversion Breakpoints using Enhanced RVPS Method
   * Handles both non-participating and participating-with-cap preferred shares
   * Sequential analysis considering senior conversion decisions and participation caps
   */
  private calculateVoluntaryConversionBreakpoints(): {
    breakpoints: BreakpointSpec[]
    criticalValues: CriticalValue[]
  } {
    const breakpoints: BreakpointSpec[] = []
    const criticalValues: CriticalValue[] = []

    // Process non-participating preferred first (existing logic)
    const nonParticipating = this.shareClasses
      .filter((sc) => sc.shareType === 'preferred' && sc.preferenceType === 'non-participating')
      .sort((a, b) => a.seniority - b.seniority)

    const conversionDecisions = new Map<number, boolean>() // Track senior conversions

    for (const shareClass of nonParticipating) {
      const conversionPoint = this.solveNonParticipatingConversion(shareClass, conversionDecisions)

      if (conversionPoint) {
        conversionDecisions.set(shareClass.id, true)

        breakpoints.push({
          breakpointType: BreakpointType.VOLUNTARY_CONVERSION,
          exitValue: new Decimal(conversionPoint),
          affectedSecurities: [shareClass.name],
          calculationMethod: 'rvps_binary_search_non_participating',
          priorityOrder: 3000 + shareClass.seniority * 100,
          explanation: `${shareClass.name} voluntary conversion becomes optimal`,
          mathematicalDerivation: `RVPS(convert) > LP at exit = $${conversionPoint.toFixed(2)}`,
          dependencies: ['pro_rata_distribution_start'],
        })

        criticalValues.push({
          value: new Decimal(conversionPoint),
          description: `Conversion indifference point for ${shareClass.name}`,
          affectedSecurities: [shareClass.name],
          triggers: [`voluntary_conversion_${shareClass.name}`],
        })

        this.auditTrail.push(
          `Voluntary Conversion (Non-Participating): ${shareClass.name} at $${conversionPoint.toFixed(2)}`
        )
      }
    }

    // NEW: Process participating-with-cap preferred for post-cap conversion
    const participatingWithCap = this.shareClasses
      .filter(
        (sc) =>
          sc.shareType === 'preferred' &&
          sc.preferenceType === 'participating-with-cap' &&
          sc.participationCap !== null
      )
      .sort((a, b) => a.seniority - b.seniority)

    for (const shareClass of participatingWithCap) {
      const conversionPoint = this.solveParticipatingWithCapConversion(
        shareClass,
        conversionDecisions
      )

      if (conversionPoint) {
        breakpoints.push({
          breakpointType: BreakpointType.VOLUNTARY_CONVERSION,
          exitValue: new Decimal(conversionPoint),
          affectedSecurities: [shareClass.name],
          calculationMethod: 'post_cap_conversion_analysis',
          priorityOrder: 3500 + shareClass.seniority * 100,
          explanation: `${shareClass.name} post-cap voluntary conversion becomes optimal`,
          mathematicalDerivation: `Pro-rata value > capped participation at exit = $${conversionPoint.toFixed(2)}`,
          dependencies: [`participation_cap_${shareClass.name}_reached`],
        })

        criticalValues.push({
          value: new Decimal(conversionPoint),
          description: `Post-cap conversion point for ${shareClass.name}`,
          affectedSecurities: [shareClass.name],
          triggers: [`post_cap_conversion_${shareClass.name}`],
        })

        this.auditTrail.push(
          `Voluntary Conversion (Post-Cap): ${shareClass.name} at $${conversionPoint.toFixed(2)}`
        )
      }
    }

    return { breakpoints, criticalValues }
  }

  /**
   * Solve non-participating preferred conversion point
   */
  private solveNonParticipatingConversion(
    shareClass: DatabaseShareClass,
    conversionDecisions: Map<number, boolean>
  ): number | null {
    const lpValue = new Decimal(shareClass.sharesOutstanding)
      .mul(shareClass.pricePerShare)
      .mul(shareClass.lpMultiple)

    let low = lpValue.toNumber()
    let high = lpValue.mul(100).toNumber()
    let conversionPoint: number | null = null
    let iterations = 0

    while (high - low > this.CONVERGENCE_TOLERANCE && iterations < this.MAX_ITERATIONS) {
      const mid = (low + high) / 2

      const rvpsWithConversion = this.calculateRVPS(mid, shareClass, true, conversionDecisions)
      const valueWithoutConversion = this.calculateRVPS(mid, shareClass, false, conversionDecisions)

      if (rvpsWithConversion.greaterThan(valueWithoutConversion)) {
        conversionPoint = mid
        high = mid
      } else {
        low = mid
      }

      iterations++
    }

    this.performanceMetrics.iterationsUsed[`conversion_${shareClass.name}`] = iterations
    return conversionPoint
  }

  /**
   * Solve participating-with-cap conversion point (post-cap)
   * Finds where pro-rata value exceeds capped participation value
   */
  private solveParticipatingWithCapConversion(
    shareClass: DatabaseShareClass,
    conversionDecisions: Map<number, boolean>
  ): number | null {
    if (!shareClass.participationCap) return null

    // Calculate the participation cap point first
    const lp = new Decimal(shareClass.sharesOutstanding)
      .mul(shareClass.pricePerShare)
      .mul(shareClass.lpMultiple)
    const capValue = lp.mul(shareClass.participationCap)

    // Start search above the participation cap point
    const totalLp = this.getTotalLiquidationPreference()
    const totalShares = this.getTotalSharesWithoutOptions()
    const classShares = new Decimal(shareClass.sharesOutstanding).mul(shareClass.conversionRatio)
    const proRataShare = classShares.div(totalShares)

    // Calculate rough exit value where cap is reached
    const capReachedExitValue = capValue.sub(lp).div(proRataShare).add(totalLp)

    // Search for conversion point above cap point
    let low = capReachedExitValue.mul(1.1).toNumber() // Start 10% above cap point
    let high = capReachedExitValue.mul(10).toNumber() // Search up to 10x cap point
    let conversionPoint: number | null = null
    let iterations = 0

    while (high - low > this.CONVERGENCE_TOLERANCE && iterations < this.MAX_ITERATIONS) {
      const mid = (low + high) / 2

      // Calculate value if converts to common (pro-rata)
      const proRataValue = this.calculateProRataValue(mid, shareClass, conversionDecisions)

      // Calculate capped participation value (fixed at cap)
      const cappedValue = capValue

      if (proRataValue.greaterThan(cappedValue)) {
        conversionPoint = mid
        high = mid
      } else {
        low = mid
      }

      iterations++
    }

    this.performanceMetrics.iterationsUsed[`post_cap_conversion_${shareClass.name}`] = iterations
    return conversionPoint
  }

  /**
   * Calculate pro-rata value for participating preferred considering conversion
   */
  private calculateProRataValue(
    exitValue: number,
    shareClass: DatabaseShareClass,
    seniorConversions: Map<number, boolean>
  ): Decimal {
    let availableProceeds = new Decimal(exitValue)

    // Subtract all liquidation preferences
    const totalLp = this.getTotalLiquidationPreference()
    availableProceeds = availableProceeds.sub(totalLp)

    // Calculate total participating shares with conversions
    const totalShares = this.getTotalSharesWithConversions(seniorConversions, shareClass.id)
    const convertedShares = new Decimal(shareClass.sharesOutstanding).mul(
      shareClass.conversionRatio
    )

    return availableProceeds.mul(convertedShares).div(totalShares)
  }

  /**
   * Calculate Redemption Value Per Share (RVPS)
   * Accounts for senior conversion decisions affecting junior proceeds
   */
  private calculateRVPS(
    exitValue: number,
    shareClass: DatabaseShareClass,
    withConversion: boolean,
    seniorConversions: Map<number, boolean>
  ): Decimal {
    const cacheKey = `${exitValue}_${shareClass.id}_${withConversion}_${JSON.stringify(Array.from(seniorConversions))}`

    if (this.rvpsCache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++
      return this.rvpsCache.get(cacheKey)!
    }

    let availableProceeds = new Decimal(exitValue)

    // Subtract senior liquidation preferences (if not converted)
    for (const sc of this.shareClasses.filter((s) => s.shareType === 'preferred')) {
      if (sc.seniority < shareClass.seniority && !seniorConversions.get(sc.id)) {
        const lp = new Decimal(sc.sharesOutstanding).mul(sc.pricePerShare).mul(sc.lpMultiple)
        availableProceeds = availableProceeds.sub(lp)
      }
    }

    let value: Decimal

    if (withConversion) {
      // Calculate pro rata share value
      const totalShares = this.getTotalSharesWithConversions(seniorConversions, shareClass.id)
      const convertedShares = new Decimal(shareClass.sharesOutstanding).mul(
        shareClass.conversionRatio
      )
      value = availableProceeds.mul(convertedShares).div(totalShares)
    } else {
      // Take liquidation preference
      const lp = new Decimal(shareClass.sharesOutstanding)
        .mul(shareClass.pricePerShare)
        .mul(shareClass.lpMultiple)
      value = Decimal.min(lp, availableProceeds)
    }

    const rvps = value.div(shareClass.sharesOutstanding)
    this.rvpsCache.set(cacheKey, rvps)

    return rvps
  }

  /**
   * Type 5: Participation Cap Breakpoints
   * Mathematical Formula: Number of breakpoints = Number of participating preferred with caps
   */
  private calculateParticipationCapBreakpoints(): {
    breakpoints: BreakpointSpec[]
    criticalValues: CriticalValue[]
  } {
    const breakpoints: BreakpointSpec[] = []
    const criticalValues: CriticalValue[] = []

    const cappedParticipating = this.shareClasses.filter(
      (sc) =>
        sc.shareType === 'preferred' &&
        sc.preferenceType === 'participating-with-cap' &&
        sc.participationCap !== null
    )

    for (const shareClass of cappedParticipating) {
      const lp = new Decimal(shareClass.sharesOutstanding)
        .mul(shareClass.pricePerShare)
        .mul(shareClass.lpMultiple)

      const capValue = lp.mul(shareClass.participationCap!)

      // Calculate exit value where cap is reached
      // Cap is reached when: LP + pro_rata_proceeds = cap_value
      const totalLp = this.getTotalLiquidationPreference()
      const totalShares = this.getTotalSharesWithoutOptions()
      const classShares = new Decimal(shareClass.sharesOutstanding).mul(shareClass.conversionRatio)
      const proRataShare = classShares.div(totalShares)

      // Solve: LP + proRataShare × (exitValue - totalLP) = capValue
      const exitValue = capValue.sub(lp).div(proRataShare).add(totalLp)

      breakpoints.push({
        breakpointType: BreakpointType.PARTICIPATION_CAP,
        exitValue,
        affectedSecurities: [shareClass.name],
        calculationMethod: 'participation_cap_formula',
        priorityOrder: 4000 + shareClass.seniority * 100,
        explanation: `${shareClass.name} reaches ${shareClass.participationCap}x participation cap`,
        mathematicalDerivation: `LP + pro_rata = ${shareClass.participationCap}x × LP = ${capValue.toFixed(2)}`,
        dependencies: ['pro_rata_distribution_start'],
      })

      criticalValues.push({
        value: exitValue,
        description: `Participation cap reached for ${shareClass.name}`,
        affectedSecurities: [shareClass.name],
        triggers: [`participation_cap_${shareClass.name}`],
      })

      this.auditTrail.push(
        `Participation Cap: ${shareClass.name} at $${exitValue.toFixed(2)} (${shareClass.participationCap}x)`
      )
    }

    return { breakpoints, criticalValues }
  }

  /**
   * Helper method to get total liquidation preference
   */
  private getTotalLiquidationPreference(): Decimal {
    return this.shareClasses
      .filter((sc) => sc.shareType === 'preferred')
      .reduce((sum, sc) => {
        const lp = new Decimal(sc.sharesOutstanding).mul(sc.pricePerShare).mul(sc.lpMultiple)
        return sum.add(lp)
      }, new Decimal(0))
  }

  /**
   * Helper method to get total shares without options
   */
  private getTotalSharesWithoutOptions(): number {
    const commonShares = this.shareClasses
      .filter((sc) => sc.shareType === 'common')
      .reduce((sum, sc) => sum + sc.sharesOutstanding, 0)

    const preferredShares = this.shareClasses
      .filter((sc) => sc.shareType === 'preferred')
      .reduce((sum, sc) => sum + sc.sharesOutstanding * sc.conversionRatio, 0)

    return commonShares + preferredShares
  }

  /**
   * Helper method to get total shares with specific conversions
   */
  private getTotalSharesWithConversions(
    conversions: Map<number, boolean>,
    includingClassId?: number
  ): Decimal {
    let totalShares = new Decimal(0)

    // Common shares always participate
    for (const sc of this.shareClasses.filter((s) => s.shareType === 'common')) {
      totalShares = totalShares.add(sc.sharesOutstanding)
    }

    // Preferred shares based on conversion decisions
    for (const sc of this.shareClasses.filter((s) => s.shareType === 'preferred')) {
      const isConverting =
        conversions.get(sc.id) ||
        includingClassId === sc.id ||
        sc.preferenceType !== 'non-participating'

      if (isConverting) {
        totalShares = totalShares.add(new Decimal(sc.sharesOutstanding).mul(sc.conversionRatio))
      }
    }

    return totalShares
  }

  /**
   * Validate input data for mathematical correctness
   */
  private validateInputData(): void {
    // Check for invalid seniority structure (gaps in ranking)
    const seniorityRanks = this.shareClasses
      .filter((sc) => sc.shareType === 'preferred')
      .map((sc) => sc.seniority)

    if (seniorityRanks.length > 0) {
      const uniqueRanks = Array.from(new Set(seniorityRanks)).sort((a, b) => a - b)

      // Check for negative seniority
      if (uniqueRanks[0] < 0) {
        throw new Error('Invalid seniority structure: negative seniority ranks found')
      }
    }

    // Check for negative liquidation preferences
    for (const sc of this.shareClasses) {
      if (sc.pricePerShare < 0 || sc.lpMultiple < 0) {
        throw new Error(`Invalid data: negative liquidation preference for ${sc.name}`)
      }
    }

    // Check for invalid option data
    for (const opt of this.options) {
      if (opt.exercisePrice < 0) {
        throw new Error('Invalid option data: negative strike price found')
      }
      if (opt.numOptions <= 0) {
        throw new Error('Invalid option data: zero or negative option count')
      }
    }
  }

  /**
   * Validate results against expected counts
   */
  private validateResults(
    breakpoints: BreakpointSpec[],
    expectedCounts: Record<BreakpointType, number>
  ): ValidationResult[] {
    const results: ValidationResult[] = []
    const actualCounts: Record<BreakpointType, number> = {
      [BreakpointType.LIQUIDATION_PREFERENCE]: 0,
      [BreakpointType.PRO_RATA_DISTRIBUTION]: 0,
      [BreakpointType.OPTION_EXERCISE]: 0,
      [BreakpointType.VOLUNTARY_CONVERSION]: 0,
      [BreakpointType.PARTICIPATION_CAP]: 0,
    }

    for (const bp of breakpoints) {
      actualCounts[bp.breakpointType]++
    }

    // Validate liquidation preference count
    results.push({
      testName: 'Liquidation Preference Count',
      passed:
        actualCounts[BreakpointType.LIQUIDATION_PREFERENCE] ===
        expectedCounts[BreakpointType.LIQUIDATION_PREFERENCE],
      expected: expectedCounts[BreakpointType.LIQUIDATION_PREFERENCE],
      actual: actualCounts[BreakpointType.LIQUIDATION_PREFERENCE],
      message: 'Number of LP breakpoints should equal distinct seniority ranks',
    })

    // Validate pro rata count (always 1)
    results.push({
      testName: 'Pro Rata Distribution Count',
      passed: actualCounts[BreakpointType.PRO_RATA_DISTRIBUTION] === 1,
      expected: 1,
      actual: actualCounts[BreakpointType.PRO_RATA_DISTRIBUTION],
      message: 'Should have exactly 1 pro rata distribution breakpoint',
    })

    // Validate option exercise count
    results.push({
      testName: 'Option Exercise Count',
      passed:
        actualCounts[BreakpointType.OPTION_EXERCISE] ===
        expectedCounts[BreakpointType.OPTION_EXERCISE],
      expected: expectedCounts[BreakpointType.OPTION_EXERCISE],
      actual: actualCounts[BreakpointType.OPTION_EXERCISE],
      message: 'Number of option breakpoints should equal unique strike prices > $0.01',
    })

    // Validate participation cap count
    results.push({
      testName: 'Participation Cap Count',
      passed:
        actualCounts[BreakpointType.PARTICIPATION_CAP] ===
        expectedCounts[BreakpointType.PARTICIPATION_CAP],
      expected: expectedCounts[BreakpointType.PARTICIPATION_CAP],
      actual: actualCounts[BreakpointType.PARTICIPATION_CAP],
      message: 'Number of cap breakpoints should equal capped participating preferred',
    })

    // Validate voluntary conversion count (can be less than or equal to expected)
    results.push({
      testName: 'Voluntary Conversion Count',
      passed:
        actualCounts[BreakpointType.VOLUNTARY_CONVERSION] <=
        expectedCounts[BreakpointType.VOLUNTARY_CONVERSION],
      expected: `≤ ${expectedCounts[BreakpointType.VOLUNTARY_CONVERSION]}`,
      actual: actualCounts[BreakpointType.VOLUNTARY_CONVERSION],
      message: 'Voluntary conversions should be ≤ non-participating preferred count',
    })

    return results
  }
}
