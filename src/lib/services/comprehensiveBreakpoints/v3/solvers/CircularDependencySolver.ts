/**
 * Circular Dependency Solver
 *
 * High-level solver that orchestrates Newton-Raphson and Binary Search methods.
 * Automatically selects best method and falls back if needed.
 *
 * Strategy:
 * 1. Try Newton-Raphson first (fast quadratic convergence)
 * 2. If fails, fallback to Binary Search (slower but robust)
 * 3. Log all attempts for debugging
 *
 * Primary Use Case: Option Exercise
 * - Options exercise when cumulative RVPS ≥ strike price
 * - But RVPS = Exit ÷ Total Shares
 * - And Total Shares = Base + Exercised Options
 * - And Exercised = f(RVPS ≥ Strike)
 * - CIRCULAR DEPENDENCY!
 *
 * @module CircularDependencySolver
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CircularSolutionResult } from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import {
  NewtonRaphsonSolver,
  TargetFunction,
  DerivativeFunction,
  NewtonRaphsonOptions,
} from './NewtonRaphsonSolver'
import { BinarySearchSolver, ValueFunction, BinarySearchOptions } from './BinarySearchSolver'

/**
 * Solver strategy
 */
export type SolverStrategy = 'newton_raphson' | 'binary_search' | 'auto'

/**
 * Circular solver options
 */
export interface CircularSolverOptions {
  /** Solver strategy to use */
  strategy?: SolverStrategy

  /** Initial guess (for Newton-Raphson) */
  initialGuess?: Decimal

  /** Search bounds (for Binary Search) */
  searchBounds?: { min: Decimal; max: Decimal }

  /** Maximum iterations */
  maxIterations?: number

  /** Convergence tolerance */
  tolerance?: Decimal
}

/**
 * CircularDependencySolver
 *
 * Orchestrates solving circular dependencies
 */
export class CircularDependencySolver {
  private newtonRaphsonSolver: NewtonRaphsonSolver
  private binarySearchSolver: BinarySearchSolver

  constructor(private auditLogger: AuditTrailLogger) {
    this.newtonRaphsonSolver = new NewtonRaphsonSolver(auditLogger)
    this.binarySearchSolver = new BinarySearchSolver(auditLogger)
  }

  /**
   * Solve circular dependency
   * Auto-selects best method and falls back if needed
   */
  solve(
    targetFn: TargetFunction,
    derivativeFn: DerivativeFunction | null,
    valueFn: ValueFunction,
    target: Decimal,
    options: CircularSolverOptions = {}
  ): CircularSolutionResult {
    const strategy = options.strategy ?? 'auto'

    this.auditLogger.step('Solving circular dependency', {
      strategy,
      target: target.toString(),
    })

    // Strategy: Newton-Raphson
    if (strategy === 'newton_raphson' && derivativeFn) {
      return this.solveWithNewtonRaphson(targetFn, derivativeFn, target, options)
    }

    // Strategy: Binary Search
    if (strategy === 'binary_search') {
      return this.solveWithBinarySearch(valueFn, target, options)
    }

    // Strategy: Auto (try Newton-Raphson first, fallback to Binary Search)
    if (strategy === 'auto') {
      // Try Newton-Raphson if derivative available
      if (derivativeFn) {
        this.auditLogger.debug('Circular Solver', 'Attempting Newton-Raphson method')

        const nrResult = this.solveWithNewtonRaphson(targetFn, derivativeFn, target, options)

        if (nrResult.converged) {
          this.auditLogger.info('Circular Solver', 'Newton-Raphson succeeded', {
            iterations: nrResult.iterations,
            tolerance: nrResult.tolerance.toString(),
          })
          return nrResult
        }

        // Newton-Raphson failed, try binary search
        this.auditLogger.warning(
          'Circular Solver',
          'Newton-Raphson failed, falling back to Binary Search'
        )
      }

      // Use Binary Search
      this.auditLogger.debug('Circular Solver', 'Attempting Binary Search method')

      const bsResult = this.solveWithBinarySearch(valueFn, target, options)

      if (bsResult.converged) {
        this.auditLogger.info('Circular Solver', 'Binary Search succeeded', {
          iterations: bsResult.iterations,
          tolerance: bsResult.tolerance.toString(),
        })
      } else {
        this.auditLogger.error('Circular Solver', 'Both methods failed to converge', {
          nrConverged: false,
          bsConverged: false,
        })
      }

      return bsResult
    }

    throw new Error(`Unknown solver strategy: ${strategy}`)
  }

  /**
   * Solve using Newton-Raphson method
   */
  private solveWithNewtonRaphson(
    targetFn: TargetFunction,
    derivativeFn: DerivativeFunction,
    target: Decimal,
    options: CircularSolverOptions
  ): CircularSolutionResult {
    const nrOptions: NewtonRaphsonOptions = {
      initialGuess: options.initialGuess ?? DecimalHelpers.toDecimal(10_000_000),
      maxIterations: options.maxIterations,
      tolerance: options.tolerance,
    }

    return this.newtonRaphsonSolver.solveForTarget(targetFn, derivativeFn, target, nrOptions)
  }

  /**
   * Solve using Binary Search method
   */
  private solveWithBinarySearch(
    valueFn: ValueFunction,
    target: Decimal,
    options: CircularSolverOptions
  ): CircularSolutionResult {
    // Get search bounds
    let min: Decimal
    let max: Decimal

    if (options.searchBounds) {
      min = options.searchBounds.min
      max = options.searchBounds.max
    } else {
      // Default bounds: [0, target × 100]
      min = DecimalHelpers.toDecimal(0)
      max = target.times(100)
    }

    const bsOptions: BinarySearchOptions = {
      min,
      max,
      maxIterations: options.maxIterations,
      tolerance: options.tolerance,
      direction: 'increasing',
    }

    return this.binarySearchSolver.solveForTarget(valueFn, target, bsOptions)
  }

  /**
   * Solve option exercise circular dependency
   * Specialized method for option exercise logic
   *
   * Find exit value where: Cumulative RVPS(exit) ≥ strike price
   * But: Cumulative RVPS = exit ÷ totalShares(exercised)
   *      totalShares(exercised) = baseShares + optionShares (if exercised)
   *      exercised = cumRVPS ≥ strike
   *      → CIRCULAR!
   */
  solveOptionExercise(
    rvpsFn: (exitValue: Decimal, totalShares: Decimal) => Decimal,
    strikePrice: Decimal,
    baseShares: Decimal,
    optionShares: Decimal,
    totalLP: Decimal,
    options: CircularSolverOptions = {}
  ): CircularSolutionResult {
    this.auditLogger.debug(
      'Option Exercise Solver',
      `Solving for strike price ${DecimalHelpers.formatCurrency(strikePrice)}`,
      {
        strikePrice: strikePrice.toString(),
        baseShares: baseShares.toString(),
        optionShares: optionShares.toString(),
        totalLP: totalLP.toString(),
      }
    )

    // Target function: f(exitValue) = RVPS(exitValue) - strikePrice = 0
    const targetFn: TargetFunction = (exitValue: Decimal) => {
      const totalSharesAfterExercise = baseShares.plus(optionShares)
      const rvps = rvpsFn(exitValue, totalSharesAfterExercise)
      return rvps.minus(strikePrice)
    }

    // Value function for binary search
    const valueFn: ValueFunction = (exitValue: Decimal) => {
      const totalSharesAfterExercise = baseShares.plus(optionShares)
      return rvpsFn(exitValue, totalSharesAfterExercise)
    }

    // Numerical derivative (finite difference)
    const h = new Decimal(1000) // Small step
    const derivativeFn: DerivativeFunction = (exitValue: Decimal) => {
      const fx = targetFn(exitValue)
      const fxPlusH = targetFn(exitValue.plus(h))
      return fxPlusH.minus(fx).dividedBy(h)
    }

    // Initial guess: totalLP + (strike × optionShares)
    const initialGuess = this.newtonRaphsonSolver.getOptionExerciseInitialGuess(
      totalLP,
      strikePrice,
      optionShares
    )

    // Search bounds for binary search fallback
    const searchBounds = this.binarySearchSolver.getOptionExerciseBounds(totalLP)

    const solverOptions: CircularSolverOptions = {
      strategy: 'auto',
      initialGuess,
      searchBounds,
      maxIterations: options.maxIterations ?? 50,
      tolerance: options.tolerance ?? new Decimal(0.01),
    }

    const result = this.solve(targetFn, derivativeFn, valueFn, strikePrice, solverOptions)

    // Log circular resolution
    this.auditLogger.logCircularResolution(
      `Option exercise @ ${DecimalHelpers.formatCurrency(strikePrice)}`,
      initialGuess,
      result.exitValue,
      result.iterations,
      result.tolerance,
      result.converged
    )

    return result
  }

  /**
   * Verify circular dependency solution
   * Checks that solution actually satisfies the circular condition
   */
  verifySolution(
    targetFn: TargetFunction,
    solution: Decimal,
    tolerance: Decimal = new Decimal(0.01)
  ): { verified: boolean; error: Decimal } {
    return this.newtonRaphsonSolver.verifySolution(targetFn, solution, tolerance)
  }

  /**
   * Get recommended solver strategy based on problem characteristics
   */
  getRecommendedStrategy(
    hasDerivative: boolean,
    hasBounds: boolean,
    expectedSmoothness: 'smooth' | 'rough'
  ): SolverStrategy {
    // If function is rough, use binary search
    if (expectedSmoothness === 'rough') {
      return 'binary_search'
    }

    // If no derivative, must use binary search
    if (!hasDerivative) {
      return 'binary_search'
    }

    // If has derivative and smooth, Newton-Raphson is best
    if (hasDerivative && expectedSmoothness === 'smooth') {
      return 'newton_raphson'
    }

    // Default: auto (try Newton-Raphson, fallback to binary search)
    return 'auto'
  }
}
