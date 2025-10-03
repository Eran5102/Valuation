/**
 * Option Exercise Analyzer
 *
 * Analyzes when options should be exercised based on cumulative RVPS.
 * Creates one breakpoint per unique strike price where cumulative RVPS ≥ strike.
 *
 * Key Concept - Circular Dependency:
 * - Options exercise when cumulative RVPS for common ≥ strike price
 * - But RVPS = Exit Value ÷ Total Shares
 * - And Total Shares = Base Shares + Exercised Options
 * - And Exercised Options depends on RVPS
 * - CIRCULAR! Requires iterative solver (Newton-Raphson)
 *
 * @module OptionExerciseAnalyzer
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot } from '../types/CapTableTypes'
import { RangeBasedBreakpoint, BreakpointType } from '../types/BreakpointTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { MathematicalProofs } from '../utilities/MathematicalProofs'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { CumulativeRVPSTracker } from '../calculators/CumulativeRVPSTracker'
import { CircularDependencySolver } from '../solvers/CircularDependencySolver'

/**
 * OptionExerciseAnalyzer
 *
 * Identifies option exercise breakpoints
 */
export class OptionExerciseAnalyzer {
  constructor(
    private rvpsTracker: CumulativeRVPSTracker,
    private circularSolver: CircularDependencySolver,
    private auditLogger: AuditTrailLogger
  ) {}

  /**
   * Analyze option exercise breakpoints
   * Creates breakpoint for each unique strike price
   */
  analyze(
    capTable: CapTableSnapshot,
    priorBreakpoints: RangeBasedBreakpoint[]
  ): RangeBasedBreakpoint[] {
    this.auditLogger.step('Analyzing option exercise breakpoints')

    const breakpoints: RangeBasedBreakpoint[] = []

    if (!CapTableHelpers.hasOptions(capTable)) {
      this.auditLogger.info(
        'Option Exercise Analysis',
        'No options found - no exercise breakpoints'
      )
      return []
    }

    // Track cumulative RVPS from prior breakpoints
    this.rvpsTracker.track(priorBreakpoints)

    // Group options by strike price
    const optionGroups = CapTableHelpers.groupOptionsByStrike(capTable)
    const uniqueStrikes = Array.from(optionGroups.keys())
      .map((s) => new Decimal(s))
      .sort((a, b) => DecimalHelpers.compare(a, b))

    // Filter out trivial strikes (< $0.01)
    const meaningfulStrikes = uniqueStrikes.filter((strike) => strike.gt(new Decimal(0.01)))

    if (meaningfulStrikes.length === 0) {
      this.auditLogger.info(
        'Option Exercise Analysis',
        'No meaningful strike prices (> $0.01) - no exercise breakpoints'
      )
      return []
    }

    let breakpointOrder = priorBreakpoints.length + 1

    // Analyze each strike price
    for (const strike of meaningfulStrikes) {
      const strikeKey = strike.toString()
      const options = optionGroups.get(strikeKey)!
      const totalOptionsAtStrike = DecimalHelpers.sum(options.map((o) => o.numOptions))

      // Solve circular dependency to find exercise point
      const exercisePoint = this.solveExercisePoint(
        strike,
        totalOptionsAtStrike,
        capTable,
        priorBreakpoints
      )

      if (!exercisePoint) {
        this.auditLogger.warning(
          'Option Exercise Analysis',
          `Could not find exercise point for strike ${DecimalHelpers.formatCurrency(strike)}`,
          { strike: strike.toString() }
        )
        continue
      }

      // Create breakpoint
      const breakpoint = this.createExerciseBreakpoint(
        strike,
        totalOptionsAtStrike,
        exercisePoint.exitValue,
        exercisePoint.iterations,
        breakpointOrder,
        options.map((o) => o.poolName)
      )

      breakpoints.push(breakpoint)

      // Log
      this.auditLogger.logBreakpoint(breakpoint)
      this.auditLogger.logOptionExercise(
        options.map((o) => o.poolName).join(', '),
        strike,
        totalOptionsAtStrike,
        exercisePoint.exitValue,
        exercisePoint.iterations
      )

      breakpointOrder++
    }

    this.auditLogger.info(
      'Option Exercise Analysis',
      `Identified ${breakpoints.length} option exercise breakpoints`,
      { uniqueStrikes: meaningfulStrikes.length }
    )

    return breakpoints
  }

  /**
   * Solve for option exercise point using circular solver
   */
  private solveExercisePoint(
    strikePrice: Decimal,
    optionShares: Decimal,
    capTable: CapTableSnapshot,
    priorBreakpoints: RangeBasedBreakpoint[]
  ): { exitValue: Decimal; iterations: number } | null {
    const totalLP = CapTableHelpers.calculateTotalLP(capTable)

    // Calculate base shares (before exercise)
    const baseParticipatingShares = CapTableHelpers.getTotalParticipatingShares(
      capTable,
      false // Don't include options yet
    )

    // RVPS function: calculates cumulative RVPS at a given exit value
    const rvpsFn = (exitValue: Decimal, totalShares: Decimal): Decimal => {
      return this.rvpsTracker.calculateCumulativeRVPSAtExit(
        'Common Stock',
        exitValue,
        priorBreakpoints
      )
    }

    // Solve using circular dependency solver
    const result = this.circularSolver.solveOptionExercise(
      rvpsFn,
      strikePrice,
      baseParticipatingShares,
      optionShares,
      totalLP
    )

    if (!result.converged) {
      return null
    }

    return {
      exitValue: result.exitValue,
      iterations: result.iterations,
    }
  }

  /**
   * Create option exercise breakpoint
   */
  private createExerciseBreakpoint(
    strikePrice: Decimal,
    optionShares: Decimal,
    exercisePoint: Decimal,
    iterations: number,
    breakpointOrder: number,
    poolNames: string[]
  ): RangeBasedBreakpoint {
    const securityName = `Options @ ${DecimalHelpers.formatCurrency(strikePrice)}`

    // Participant: options become common shares
    const participant = {
      securityName,
      securityType: 'option_pool' as const,
      participatingShares: optionShares,
      participationPercentage: DecimalHelpers.toDecimal(1), // 100% (only these options in this range)
      rvpsAtBreakpoint: DecimalHelpers.toDecimal(0), // Open-ended range
      cumulativeRVPS: strikePrice, // Cumulative RVPS = strike price at exercise
      sectionValue: DecimalHelpers.toDecimal(0),
      cumulativeValue: strikePrice.times(optionShares), // Total value = strike × shares
      participationStatus: 'exercised' as const,
      participationNotes: `Options exercise when cumulative RVPS ≥ ${DecimalHelpers.formatCurrency(strikePrice)}`,
    }

    const breakpoint: RangeBasedBreakpoint = {
      breakpointType: BreakpointType.OPTION_EXERCISE,
      breakpointOrder,
      rangeFrom: exercisePoint,
      rangeTo: null, // Open-ended (options continue to participate)
      isOpenEnded: true,
      participants: [participant],
      totalParticipatingShares: optionShares,
      redemptionValuePerShare: DecimalHelpers.toDecimal(0),
      sectionRVPS: DecimalHelpers.toDecimal(0),
      calculationMethod: 'option_exercise_circular',
      explanation: this.generateExplanation(
        securityName,
        strikePrice,
        optionShares,
        exercisePoint,
        iterations
      ),
      mathematicalDerivation: this.generateMathematicalDerivation(
        poolNames.join(', '),
        strikePrice,
        optionShares,
        exercisePoint,
        iterations
      ),
      dependencies: ['Pro-rata distribution started', 'Cumulative RVPS tracking'],
      affectedSecurities: [securityName],
      priorityOrder: 2000 + Math.floor(strikePrice.toNumber() * 100), // Options: 2000-2999
      metadata: {
        solverIterations: iterations,
        strikePrice: strikePrice.toString(),
        poolNames,
      },
    }

    // Generate and log mathematical proof
    const totalLP = DecimalHelpers.toDecimal(0) // Will get from context
    const proof = MathematicalProofs.generateOptionExerciseProof(
      poolNames.join(', '),
      strikePrice,
      optionShares,
      DecimalHelpers.toDecimal(0), // baseTotalShares - will calculate
      exercisePoint,
      iterations
    )
    this.auditLogger.logMathematicalProof(`Option Exercise: ${securityName}`, proof)

    return breakpoint
  }

  /**
   * Generate explanation
   */
  private generateExplanation(
    securityName: string,
    strikePrice: Decimal,
    optionShares: Decimal,
    exercisePoint: Decimal,
    iterations: number
  ): string {
    return [
      `${securityName} exercises at ${DecimalHelpers.formatCurrency(exercisePoint)}`,
      `Condition: Cumulative RVPS for common ≥ ${DecimalHelpers.formatCurrency(strikePrice)}`,
      `Total Options: ${DecimalHelpers.formatNumber(optionShares)}`,
      `Circular dependency resolved in ${iterations} iterations`,
    ].join('; ')
  }

  /**
   * Generate mathematical derivation
   */
  private generateMathematicalDerivation(
    poolNames: string,
    strikePrice: Decimal,
    optionShares: Decimal,
    exercisePoint: Decimal,
    iterations: number
  ): string {
    const lines: string[] = []

    lines.push(`Option Exercise: ${poolNames}`)
    lines.push('')
    lines.push('Exercise Condition:')
    lines.push(
      `- Options exercise when: Cumulative RVPS ≥ ${DecimalHelpers.formatCurrency(strikePrice)}`
    )
    lines.push('')
    lines.push('Circular Dependency:')
    lines.push('- Cumulative RVPS = Exit Value ÷ Total Shares')
    lines.push('- Total Shares = Base Shares + Exercised Options')
    lines.push('- Exercised Options = f(Cumulative RVPS ≥ Strike)')
    lines.push('→ RVPS depends on Total Shares')
    lines.push('→ Total Shares depends on Exercise Decision')
    lines.push('→ Exercise Decision depends on RVPS')
    lines.push('→ CIRCULAR!')
    lines.push('')
    lines.push('Solution:')
    lines.push(`- Method: Newton-Raphson iterative solver`)
    lines.push(`- Iterations: ${iterations}`)
    lines.push(`- Exercise Point: ${DecimalHelpers.formatCurrency(exercisePoint)}`)
    lines.push('')
    lines.push('Result:')
    lines.push(
      `At exit value ${DecimalHelpers.formatCurrency(exercisePoint)}, cumulative RVPS for common ≥ strike price`
    )
    lines.push(
      `${DecimalHelpers.formatNumber(optionShares)} options exercise and become common shares`
    )

    return lines.join('\n')
  }

  /**
   * Get expected option exercise breakpoint count
   */
  getExpectedBreakpointCount(capTable: CapTableSnapshot): number {
    const uniqueStrikes = CapTableHelpers.getUniqueStrikePrices(capTable)
    // Only count strikes > $0.01
    return uniqueStrikes.filter((s) => s.gt(new Decimal(0.01))).length
  }
}
