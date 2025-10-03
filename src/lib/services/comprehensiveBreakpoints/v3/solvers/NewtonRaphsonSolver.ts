/**
 * Newton-Raphson Solver
 *
 * Implements Newton-Raphson method for solving equations iteratively.
 * Used primarily for option exercise circular dependency resolution.
 *
 * Method:
 * x_(n+1) = x_n - f(x_n) / f'(x_n)
 *
 * Where:
 * - f(x) is the target function we want to find the root of
 * - f'(x) is the derivative of f(x)
 * - Iterates until |f(x)| < tolerance or max iterations reached
 *
 * Convergence:
 * - Quadratic convergence near the solution (very fast)
 * - Typically converges in < 10 iterations for smooth functions
 *
 * @module NewtonRaphsonSolver
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CircularSolutionResult, IterationStep } from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * Target function type
 * Returns f(x) where we want to find x such that f(x) = 0
 */
export type TargetFunction = (x: Decimal) => Decimal

/**
 * Derivative function type
 * Returns f'(x), the derivative of the target function
 */
export type DerivativeFunction = (x: Decimal) => Decimal

/**
 * Newton-Raphson solver options
 */
export interface NewtonRaphsonOptions {
  /** Initial guess for the solution */
  initialGuess: Decimal

  /** Maximum number of iterations */
  maxIterations?: number

  /** Convergence tolerance */
  tolerance?: Decimal

  /** Minimum step size (prevents tiny steps) */
  minStepSize?: Decimal

  /** Maximum step size (prevents huge jumps) */
  maxStepSize?: Decimal
}

/**
 * NewtonRaphsonSolver
 *
 * Solves f(x) = 0 using Newton-Raphson iteration
 */
export class NewtonRaphsonSolver {
  private readonly defaultMaxIterations = 50
  private readonly defaultTolerance = new Decimal(0.01)
  private readonly defaultMinStepSize = new Decimal(0.001)
  private readonly defaultMaxStepSize = new Decimal(1e9)

  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Solve f(x) = 0 using Newton-Raphson method
   *
   * @param targetFn Function f(x) where we want to find x such that f(x) = 0
   * @param derivativeFn Function f'(x), derivative of targetFn
   * @param options Solver options
   */
  solve(
    targetFn: TargetFunction,
    derivativeFn: DerivativeFunction,
    options: NewtonRaphsonOptions
  ): CircularSolutionResult {
    const maxIterations = options.maxIterations ?? this.defaultMaxIterations
    const tolerance = options.tolerance ?? this.defaultTolerance
    const minStepSize = options.minStepSize ?? this.defaultMinStepSize
    const maxStepSize = options.maxStepSize ?? this.defaultMaxStepSize

    let x = options.initialGuess
    const iterationHistory: IterationStep[] = []

    this.auditLogger.debug(
      'Newton-Raphson',
      `Starting with initial guess: ${DecimalHelpers.formatCurrency(x)}`,
      {
        initialGuess: x.toString(),
        maxIterations,
        tolerance: tolerance.toString(),
      }
    )

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Evaluate function at current x
      const fx = targetFn(x)
      const error = fx.abs()

      // Record iteration
      const satisfied = error.lte(tolerance)
      iterationHistory.push({
        iteration: iteration + 1,
        exitValue: x,
        error,
        satisfied,
      })

      this.auditLogger.debug(
        'Newton-Raphson',
        `Iteration ${iteration + 1}: x=${DecimalHelpers.formatCurrency(x)}, f(x)=${fx.toFixed(4)}, error=${error.toFixed(4)}`,
        {
          iteration: iteration + 1,
          x: x.toString(),
          fx: fx.toString(),
          error: error.toString(),
          satisfied,
        }
      )

      // Check convergence
      if (satisfied) {
        this.auditLogger.info('Newton-Raphson', `Converged after ${iteration + 1} iterations`, {
          solution: x.toString(),
          error: error.toString(),
          iterations: iteration + 1,
        })

        return {
          exitValue: x,
          iterations: iteration + 1,
          tolerance: error,
          converged: true,
          method: 'newton_raphson',
          explanation: `Newton-Raphson method converged in ${iteration + 1} iterations with error ${error.toFixed(4)}`,
          iterationHistory,
        }
      }

      // Calculate derivative at current x
      const fpx = derivativeFn(x)

      // Check for zero derivative (would cause division by zero)
      if (DecimalHelpers.isZero(fpx)) {
        this.auditLogger.warning(
          'Newton-Raphson',
          `Zero derivative at iteration ${iteration + 1}`,
          {
            x: x.toString(),
            fpx: fpx.toString(),
          }
        )

        // Try small perturbation
        x = x.plus(minStepSize)
        continue
      }

      // Calculate step: Δx = -f(x) / f'(x)
      let step = fx.dividedBy(fpx).neg()

      // Clamp step size to prevent huge jumps or tiny steps
      if (step.abs().lt(minStepSize)) {
        step = step.isNegative() ? minStepSize.neg() : minStepSize
      } else if (step.abs().gt(maxStepSize)) {
        step = step.isNegative() ? maxStepSize.neg() : maxStepSize
      }

      // Update x
      const nextX = x.plus(step)

      // Ensure x stays positive (for exit values)
      if (nextX.isNegative() || DecimalHelpers.isZero(nextX)) {
        this.auditLogger.warning(
          'Newton-Raphson',
          `Negative or zero x detected at iteration ${iteration + 1}, adjusting`,
          {
            x: x.toString(),
            nextX: nextX.toString(),
            step: step.toString(),
          }
        )

        x = x.dividedBy(2) // Halve the current value instead
        continue
      }

      x = nextX
    }

    // Failed to converge
    const finalError = targetFn(x).abs()

    this.auditLogger.warning(
      'Newton-Raphson',
      `Failed to converge after ${maxIterations} iterations`,
      {
        finalX: x.toString(),
        finalError: finalError.toString(),
        tolerance: tolerance.toString(),
      }
    )

    return {
      exitValue: x,
      iterations: maxIterations,
      tolerance: finalError,
      converged: false,
      method: 'newton_raphson',
      explanation: `Newton-Raphson failed to converge after ${maxIterations} iterations. Final error: ${finalError.toFixed(4)}`,
      iterationHistory,
    }
  }

  /**
   * Solve using numerical derivative (finite difference)
   * Use when analytical derivative is not available
   *
   * f'(x) ≈ [f(x + h) - f(x)] / h
   */
  solveWithNumericalDerivative(
    targetFn: TargetFunction,
    options: NewtonRaphsonOptions,
    h: Decimal = new Decimal(0.001)
  ): CircularSolutionResult {
    // Create numerical derivative function
    const derivativeFn: DerivativeFunction = (x: Decimal) => {
      const fx = targetFn(x)
      const fxPlusH = targetFn(x.plus(h))
      return fxPlusH.minus(fx).dividedBy(h)
    }

    return this.solve(targetFn, derivativeFn, options)
  }

  /**
   * Solve f(x) = target (not just f(x) = 0)
   * Transforms to g(x) = f(x) - target = 0
   */
  solveForTarget(
    targetFn: (x: Decimal) => Decimal,
    derivativeFn: (x: Decimal) => Decimal,
    target: Decimal,
    options: NewtonRaphsonOptions
  ): CircularSolutionResult {
    // Transform to g(x) = f(x) - target = 0
    const transformedFn: TargetFunction = (x: Decimal) => {
      return targetFn(x).minus(target)
    }

    // Derivative of g(x) = f'(x) (constant target doesn't affect derivative)
    const transformedDerivative: DerivativeFunction = derivativeFn

    return this.solve(transformedFn, transformedDerivative, options)
  }

  /**
   * Find x where f(x) ≥ threshold
   * Used for option exercise: find exit value where RVPS ≥ strike price
   */
  findThresholdCrossing(
    fn: (x: Decimal) => Decimal,
    threshold: Decimal,
    options: NewtonRaphsonOptions
  ): CircularSolutionResult {
    // Transform to f(x) - threshold = 0
    const targetFn: TargetFunction = (x: Decimal) => {
      return fn(x).minus(threshold)
    }

    // Use numerical derivative
    return this.solveWithNumericalDerivative(targetFn, options)
  }

  /**
   * Verify solution
   * Checks if f(solution) is within tolerance of 0
   */
  verifySolution(
    targetFn: TargetFunction,
    solution: Decimal,
    tolerance: Decimal = this.defaultTolerance
  ): { verified: boolean; error: Decimal } {
    const fx = targetFn(solution)
    const error = fx.abs()
    const verified = error.lte(tolerance)

    return { verified, error }
  }

  /**
   * Get recommended initial guess for option exercise
   * Based on heuristic: exit ≈ total LP + (strike × option shares)
   */
  getOptionExerciseInitialGuess(
    totalLP: Decimal,
    strikePrice: Decimal,
    optionShares: Decimal
  ): Decimal {
    return totalLP.plus(strikePrice.times(optionShares))
  }
}
