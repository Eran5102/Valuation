/**
 * Binary Search Solver
 *
 * Implements binary search for finding values that satisfy conditions.
 * More robust than Newton-Raphson but slower (linear convergence).
 *
 * Method:
 * 1. Start with min and max bounds
 * 2. Test midpoint
 * 3. Narrow search range based on result
 * 4. Repeat until within tolerance
 *
 * Use Cases:
 * - Fallback when Newton-Raphson fails
 * - When derivative is difficult to calculate
 * - When function is not smooth
 *
 * @module BinarySearchSolver
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CircularSolutionResult, IterationStep } from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * Condition function type
 * Returns true when condition is satisfied
 */
export type ConditionFunction = (x: Decimal) => boolean

/**
 * Value function type
 * Returns a value to compare against target
 */
export type ValueFunction = (x: Decimal) => Decimal

/**
 * Binary search solver options
 */
export interface BinarySearchOptions {
  /** Minimum search bound */
  min: Decimal

  /** Maximum search bound */
  max: Decimal

  /** Maximum number of iterations */
  maxIterations?: number

  /** Convergence tolerance */
  tolerance?: Decimal

  /** Direction: 'increasing' or 'decreasing' */
  direction?: 'increasing' | 'decreasing'
}

/**
 * BinarySearchSolver
 *
 * Finds x where condition becomes true using binary search
 */
export class BinarySearchSolver {
  private readonly defaultMaxIterations = 100
  private readonly defaultTolerance = new Decimal(0.01)

  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Find x where value(x) = target using binary search
   *
   * @param valueFn Function that returns value at x
   * @param target Target value to find
   * @param options Search options
   */
  solveForTarget(
    valueFn: ValueFunction,
    target: Decimal,
    options: BinarySearchOptions
  ): CircularSolutionResult {
    const maxIterations = options.maxIterations ?? this.defaultMaxIterations
    const tolerance = options.tolerance ?? this.defaultTolerance
    const direction = options.direction ?? 'increasing'

    let min = options.min
    let max = options.max
    const iterationHistory: IterationStep[] = []

    this.auditLogger.debug(
      'Binary Search',
      `Searching for value ${DecimalHelpers.formatCurrency(target)} in range [${DecimalHelpers.formatCurrency(min)}, ${DecimalHelpers.formatCurrency(max)}]`,
      {
        target: target.toString(),
        min: min.toString(),
        max: max.toString(),
        direction,
      }
    )

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Calculate midpoint
      const mid = min.plus(max).dividedBy(2)

      // Evaluate function at midpoint
      const value = valueFn(mid)
      const error = value.minus(target).abs()

      // Record iteration
      const satisfied = error.lte(tolerance)
      iterationHistory.push({
        iteration: iteration + 1,
        exitValue: mid,
        error,
        satisfied,
      })

      this.auditLogger.debug(
        'Binary Search',
        `Iteration ${iteration + 1}: mid=${DecimalHelpers.formatCurrency(mid)}, value=${DecimalHelpers.formatCurrency(value)}, error=${error.toFixed(4)}`,
        {
          iteration: iteration + 1,
          mid: mid.toString(),
          value: value.toString(),
          target: target.toString(),
          error: error.toString(),
          satisfied,
        }
      )

      // Check convergence
      if (satisfied) {
        this.auditLogger.info('Binary Search', `Converged after ${iteration + 1} iterations`, {
          solution: mid.toString(),
          error: error.toString(),
          iterations: iteration + 1,
        })

        return {
          exitValue: mid,
          iterations: iteration + 1,
          tolerance: error,
          converged: true,
          method: 'binary_search',
          explanation: `Binary search converged in ${iteration + 1} iterations with error ${error.toFixed(4)}`,
          iterationHistory,
        }
      }

      // Narrow search range
      if (direction === 'increasing') {
        if (value.lt(target)) {
          min = mid // Value too low, search higher
        } else {
          max = mid // Value too high, search lower
        }
      } else {
        // direction === 'decreasing'
        if (value.lt(target)) {
          max = mid // Value too low (in decreasing direction), search lower
        } else {
          min = mid // Value too high (in decreasing direction), search higher
        }
      }

      // Check if range collapsed
      if (max.minus(min).abs().lte(tolerance)) {
        const finalMid = min.plus(max).dividedBy(2)
        const finalValue = valueFn(finalMid)
        const finalError = finalValue.minus(target).abs()

        this.auditLogger.info(
          'Binary Search',
          `Range collapsed after ${iteration + 1} iterations`,
          {
            solution: finalMid.toString(),
            error: finalError.toString(),
            iterations: iteration + 1,
          }
        )

        return {
          exitValue: finalMid,
          iterations: iteration + 1,
          tolerance: finalError,
          converged: finalError.lte(tolerance),
          method: 'binary_search',
          explanation: `Binary search range collapsed in ${iteration + 1} iterations`,
          iterationHistory,
        }
      }
    }

    // Failed to converge
    const finalMid = min.plus(max).dividedBy(2)
    const finalValue = valueFn(finalMid)
    const finalError = finalValue.minus(target).abs()

    this.auditLogger.warning(
      'Binary Search',
      `Failed to converge after ${maxIterations} iterations`,
      {
        finalMid: finalMid.toString(),
        finalValue: finalValue.toString(),
        finalError: finalError.toString(),
      }
    )

    return {
      exitValue: finalMid,
      iterations: maxIterations,
      tolerance: finalError,
      converged: false,
      method: 'binary_search',
      explanation: `Binary search failed to converge after ${maxIterations} iterations. Final error: ${finalError.toFixed(4)}`,
      iterationHistory,
    }
  }

  /**
   * Find x where condition becomes true
   *
   * @param conditionFn Function that returns true when condition is met
   * @param options Search options
   */
  findConditionCrossing(
    conditionFn: ConditionFunction,
    options: BinarySearchOptions
  ): CircularSolutionResult {
    const maxIterations = options.maxIterations ?? this.defaultMaxIterations
    const tolerance = options.tolerance ?? this.defaultTolerance

    let min = options.min
    let max = options.max
    const iterationHistory: IterationStep[] = []

    // Check bounds
    const minSatisfied = conditionFn(min)
    const maxSatisfied = conditionFn(max)

    this.auditLogger.debug(
      'Binary Search (Condition)',
      `Searching for condition crossing in range [${DecimalHelpers.formatCurrency(min)}, ${DecimalHelpers.formatCurrency(max)}]`,
      {
        min: min.toString(),
        max: max.toString(),
        minSatisfied,
        maxSatisfied,
      }
    )

    // If condition not satisfied at max, no crossing in range
    if (!maxSatisfied) {
      this.auditLogger.warning(
        'Binary Search (Condition)',
        'Condition not satisfied at max bound',
        { max: max.toString() }
      )

      return {
        exitValue: max,
        iterations: 0,
        tolerance: DecimalHelpers.toDecimal(Infinity),
        converged: false,
        method: 'binary_search',
        explanation: 'Condition not satisfied within search range',
        iterationHistory,
      }
    }

    // If condition already satisfied at min, return min
    if (minSatisfied) {
      this.auditLogger.info(
        'Binary Search (Condition)',
        'Condition already satisfied at min bound',
        { min: min.toString() }
      )

      return {
        exitValue: min,
        iterations: 0,
        tolerance: DecimalHelpers.toDecimal(0),
        converged: true,
        method: 'binary_search',
        explanation: 'Condition satisfied at minimum bound',
        iterationHistory,
      }
    }

    // Binary search for crossing point
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const mid = min.plus(max).dividedBy(2)
      const midSatisfied = conditionFn(mid)

      iterationHistory.push({
        iteration: iteration + 1,
        exitValue: mid,
        error: max.minus(min),
        satisfied: midSatisfied,
      })

      this.auditLogger.debug(
        'Binary Search (Condition)',
        `Iteration ${iteration + 1}: mid=${DecimalHelpers.formatCurrency(mid)}, satisfied=${midSatisfied}`,
        {
          iteration: iteration + 1,
          mid: mid.toString(),
          satisfied: midSatisfied,
          rangeSize: max.minus(min).toString(),
        }
      )

      if (midSatisfied) {
        max = mid // Condition satisfied, search lower
      } else {
        min = mid // Condition not satisfied, search higher
      }

      // Check if range small enough
      if (max.minus(min).lte(tolerance)) {
        // Return the point where condition just becomes true
        const crossing = max

        this.auditLogger.info(
          'Binary Search (Condition)',
          `Found crossing at ${DecimalHelpers.formatCurrency(crossing)} after ${iteration + 1} iterations`,
          {
            crossing: crossing.toString(),
            iterations: iteration + 1,
          }
        )

        return {
          exitValue: crossing,
          iterations: iteration + 1,
          tolerance: max.minus(min),
          converged: true,
          method: 'binary_search',
          explanation: `Found condition crossing in ${iteration + 1} iterations`,
          iterationHistory,
        }
      }
    }

    // Return best approximation
    const crossing = max
    this.auditLogger.warning(
      'Binary Search (Condition)',
      `Maximum iterations reached, returning approximation`,
      {
        crossing: crossing.toString(),
        rangeSize: max.minus(min).toString(),
      }
    )

    return {
      exitValue: crossing,
      iterations: maxIterations,
      tolerance: max.minus(min),
      converged: false,
      method: 'binary_search',
      explanation: `Approximated crossing after ${maxIterations} iterations`,
      iterationHistory,
    }
  }

  /**
   * Find x where value(x) ≥ threshold
   *
   * @param valueFn Function that returns value at x
   * @param threshold Threshold value
   * @param options Search options
   */
  findThresholdCrossing(
    valueFn: ValueFunction,
    threshold: Decimal,
    options: BinarySearchOptions
  ): CircularSolutionResult {
    const conditionFn: ConditionFunction = (x: Decimal) => {
      return valueFn(x).gte(threshold)
    }

    return this.findConditionCrossing(conditionFn, options)
  }

  /**
   * Verify solution
   */
  verifySolution(
    valueFn: ValueFunction,
    solution: Decimal,
    target: Decimal,
    tolerance: Decimal = this.defaultTolerance
  ): { verified: boolean; error: Decimal } {
    const value = valueFn(solution)
    const error = value.minus(target).abs()
    const verified = error.lte(tolerance)

    return { verified, error }
  }

  /**
   * Get recommended search bounds for option exercise
   * Based on heuristic: [total LP, total LP × 10]
   */
  getOptionExerciseBounds(totalLP: Decimal): { min: Decimal; max: Decimal } {
    return {
      min: totalLP,
      max: totalLP.times(10),
    }
  }
}
