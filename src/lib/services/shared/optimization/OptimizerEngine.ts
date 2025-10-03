/**
 * Optimizer Engine
 *
 * Unified optimization interface that wraps the proven V3 solvers:
 * - NewtonRaphsonSolver (fast, quadratic convergence)
 * - BinarySearchSolver (robust, linear convergence)
 *
 * Provides automatic solver selection and fallback for optimal performance.
 * Used for OPM backsolve and any other optimization needs.
 *
 * @module OptimizerEngine
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'
import {
  NewtonRaphsonSolver,
  TargetFunction,
  DerivativeFunction,
} from '../../comprehensiveBreakpoints/v3/solvers/NewtonRaphsonSolver'
import {
  BinarySearchSolver,
  ValueFunction,
} from '../../comprehensiveBreakpoints/v3/solvers/BinarySearchSolver'
import { CircularSolutionResult } from '../../comprehensiveBreakpoints/v3/types/FormulaTypes'
import { AuditTrailLogger } from '../../comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import { DecimalHelpers } from '../../comprehensiveBreakpoints/v3/utilities/DecimalHelpers'

/**
 * Optimization method
 */
export enum OptimizationMethod {
  /** Newton-Raphson method (fast, requires derivative) */
  NEWTON_RAPHSON = 'newton_raphson',

  /** Binary search method (robust, no derivative needed) */
  BINARY_SEARCH = 'binary_search',

  /** Hybrid: Try Newton-Raphson first, fallback to Binary Search */
  HYBRID = 'hybrid',

  /** Auto-select best method based on problem characteristics */
  AUTO = 'auto',
}

/**
 * Optimization parameters
 */
export interface OptimizationParams {
  /** Optimization method */
  method?: OptimizationMethod

  /** Initial guess (required for Newton-Raphson) */
  initialGuess?: Decimal

  /** Search bounds (required for Binary Search) */
  searchBounds?: {
    min: Decimal
    max: Decimal
  }

  /** Maximum iterations */
  maxIterations?: number

  /** Convergence tolerance */
  tolerance?: Decimal

  /** Minimum step size (Newton-Raphson) */
  minStepSize?: Decimal

  /** Maximum step size (Newton-Raphson) */
  maxStepSize?: Decimal

  /** Direction for Binary Search */
  direction?: 'increasing' | 'decreasing'
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Solution value */
  solution: Decimal

  /** Number of iterations */
  iterations: number

  /** Final error/tolerance */
  error: Decimal

  /** Whether optimization converged */
  converged: boolean

  /** Method used */
  method: OptimizationMethod

  /** Explanation of the result */
  explanation: string

  /** Iteration history */
  iterationHistory?: Array<{
    iteration: number
    value: Decimal
    error: Decimal
    satisfied: boolean
  }>

  /** Performance metrics */
  performance: {
    executionTimeMs: number
    methodsAttempted: string[]
  }
}

/**
 * OptimizerEngine
 *
 * Unified interface for optimization using V3 solvers
 */
export class OptimizerEngine {
  private newtonRaphsonSolver: NewtonRaphsonSolver
  private binarySearchSolver: BinarySearchSolver

  constructor(private auditLogger: AuditTrailLogger) {
    this.newtonRaphsonSolver = new NewtonRaphsonSolver(auditLogger)
    this.binarySearchSolver = new BinarySearchSolver(auditLogger)
  }

  /**
   * Optimize a function to find f(x) = target
   *
   * @param targetFn - Function to optimize
   * @param target - Target value (default: 0)
   * @param params - Optimization parameters
   * @param derivativeFn - Optional derivative function (improves Newton-Raphson)
   * @returns Optimization result
   *
   * @example
   * ```typescript
   * // Find enterprise value where calculated FMV = target FMV
   * const result = optimizer.optimize(
   *   (ev) => calculateFMV(ev),
   *   targetFMV,
   *   {
   *     method: OptimizationMethod.HYBRID,
   *     initialGuess: new Decimal(10000000),
   *     searchBounds: { min: new Decimal(1000000), max: new Decimal(100000000) },
   *   }
   * )
   * ```
   */
  async optimize(
    targetFn: (x: Decimal) => Decimal,
    target: Decimal = DecimalHelpers.toDecimal(0),
    params: OptimizationParams,
    derivativeFn?: (x: Decimal) => Decimal
  ): Promise<OptimizationResult> {
    const startTime = Date.now()
    const methodsAttempted: string[] = []

    // Determine which method to use
    const method = params.method || OptimizationMethod.AUTO

    this.auditLogger.step(`Starting optimization with method: ${method}`)

    let result: CircularSolutionResult | null = null
    let finalMethod: OptimizationMethod

    // Transform targetFn to return (f(x) - target)
    const transformedFn: TargetFunction = (x: Decimal) => {
      return targetFn(x).minus(target)
    }

    try {
      switch (method) {
        case OptimizationMethod.NEWTON_RAPHSON:
          result = await this.tryNewtonRaphson(transformedFn, params, derivativeFn)
          finalMethod = OptimizationMethod.NEWTON_RAPHSON
          methodsAttempted.push('Newton-Raphson')
          break

        case OptimizationMethod.BINARY_SEARCH:
          result = await this.tryBinarySearch(targetFn, target, params)
          finalMethod = OptimizationMethod.BINARY_SEARCH
          methodsAttempted.push('Binary Search')
          break

        case OptimizationMethod.HYBRID:
          // Try Newton-Raphson first
          if (params.initialGuess) {
            methodsAttempted.push('Newton-Raphson')
            result = await this.tryNewtonRaphson(transformedFn, params, derivativeFn)

            if (result.converged) {
              finalMethod = OptimizationMethod.NEWTON_RAPHSON
            } else {
              // Fallback to Binary Search
              this.auditLogger.info(
                'Optimizer',
                'Newton-Raphson did not converge, falling back to Binary Search'
              )
              methodsAttempted.push('Binary Search (fallback)')
              result = await this.tryBinarySearch(targetFn, target, params)
              finalMethod = OptimizationMethod.BINARY_SEARCH
            }
          } else {
            // No initial guess, use Binary Search
            methodsAttempted.push('Binary Search')
            result = await this.tryBinarySearch(targetFn, target, params)
            finalMethod = OptimizationMethod.BINARY_SEARCH
          }
          break

        case OptimizationMethod.AUTO:
        default:
          // Auto-select based on available parameters
          if (params.initialGuess && derivativeFn) {
            // Have both guess and derivative, use Newton-Raphson
            methodsAttempted.push('Newton-Raphson (auto)')
            result = await this.tryNewtonRaphson(transformedFn, params, derivativeFn)
            finalMethod = OptimizationMethod.NEWTON_RAPHSON
          } else if (params.searchBounds) {
            // Have bounds, use Binary Search
            methodsAttempted.push('Binary Search (auto)')
            result = await this.tryBinarySearch(targetFn, target, params)
            finalMethod = OptimizationMethod.BINARY_SEARCH
          } else if (params.initialGuess) {
            // Have guess but no derivative, use numerical derivative
            methodsAttempted.push('Newton-Raphson with numerical derivative (auto)')
            result = this.newtonRaphsonSolver.solveWithNumericalDerivative(transformedFn, {
              initialGuess: params.initialGuess,
              maxIterations: params.maxIterations,
              tolerance: params.tolerance,
              minStepSize: params.minStepSize,
              maxStepSize: params.maxStepSize,
            })
            finalMethod = OptimizationMethod.NEWTON_RAPHSON
          } else {
            throw new Error(
              'Insufficient parameters for optimization. Provide either initialGuess or searchBounds.'
            )
          }
          break
      }
    } catch (error) {
      throw new Error(
        `Optimization failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    const executionTimeMs = Date.now() - startTime

    // Convert CircularSolutionResult to OptimizationResult
    return {
      solution: result.exitValue,
      iterations: result.iterations,
      error: result.tolerance,
      converged: result.converged,
      method: finalMethod,
      explanation: result.explanation,
      iterationHistory: result.iterationHistory?.map((step) => ({
        iteration: step.iteration,
        value: step.exitValue,
        error: step.error,
        satisfied: step.satisfied,
      })),
      performance: {
        executionTimeMs,
        methodsAttempted,
      },
    }
  }

  /**
   * Try Newton-Raphson optimization
   */
  private async tryNewtonRaphson(
    targetFn: TargetFunction,
    params: OptimizationParams,
    derivativeFn?: DerivativeFunction
  ): Promise<CircularSolutionResult> {
    if (!params.initialGuess) {
      throw new Error('Initial guess required for Newton-Raphson method')
    }

    if (derivativeFn) {
      // Use provided derivative
      return this.newtonRaphsonSolver.solve(targetFn, derivativeFn, {
        initialGuess: params.initialGuess,
        maxIterations: params.maxIterations,
        tolerance: params.tolerance,
        minStepSize: params.minStepSize,
        maxStepSize: params.maxStepSize,
      })
    } else {
      // Use numerical derivative
      return this.newtonRaphsonSolver.solveWithNumericalDerivative(targetFn, {
        initialGuess: params.initialGuess,
        maxIterations: params.maxIterations,
        tolerance: params.tolerance,
        minStepSize: params.minStepSize,
        maxStepSize: params.maxStepSize,
      })
    }
  }

  /**
   * Try Binary Search optimization
   */
  private async tryBinarySearch(
    targetFn: (x: Decimal) => Decimal,
    target: Decimal,
    params: OptimizationParams
  ): Promise<CircularSolutionResult> {
    if (!params.searchBounds) {
      throw new Error('Search bounds required for Binary Search method')
    }

    return this.binarySearchSolver.solveForTarget(targetFn, target, {
      min: params.searchBounds.min,
      max: params.searchBounds.max,
      maxIterations: params.maxIterations,
      tolerance: params.tolerance,
      direction: params.direction,
    })
  }

  /**
   * Find x where f(x) ≥ threshold
   *
   * Convenience method for threshold-crossing problems
   */
  async findThreshold(
    fn: (x: Decimal) => Decimal,
    threshold: Decimal,
    params: OptimizationParams
  ): Promise<OptimizationResult> {
    // Use Newton-Raphson if we have an initial guess
    if (params.initialGuess) {
      const result = this.newtonRaphsonSolver.findThresholdCrossing(fn, threshold, {
        initialGuess: params.initialGuess,
        maxIterations: params.maxIterations,
        tolerance: params.tolerance,
      })

      return this.convertToOptimizationResult(result, OptimizationMethod.NEWTON_RAPHSON, Date.now())
    }

    // Use Binary Search if we have bounds
    if (params.searchBounds) {
      const result = this.binarySearchSolver.findThresholdCrossing(fn, threshold, {
        min: params.searchBounds.min,
        max: params.searchBounds.max,
        maxIterations: params.maxIterations,
        tolerance: params.tolerance,
      })

      return this.convertToOptimizationResult(result, OptimizationMethod.BINARY_SEARCH, Date.now())
    }

    throw new Error('Either initialGuess or searchBounds required for threshold finding')
  }

  /**
   * Verify an optimization solution
   *
   * @param targetFn - Target function
   * @param solution - Solution to verify
   * @param target - Target value
   * @param tolerance - Verification tolerance
   * @returns Verification result
   */
  verifySolution(
    targetFn: (x: Decimal) => Decimal,
    solution: Decimal,
    target: Decimal,
    tolerance: Decimal = new Decimal(0.01)
  ): { verified: boolean; error: Decimal; actualValue: Decimal } {
    const actualValue = targetFn(solution)
    const error = actualValue.minus(target).abs()
    const verified = error.lte(tolerance)

    this.auditLogger.debug(
      'Optimizer Verification',
      verified ? 'Solution verified' : 'Solution verification failed',
      {
        solution: solution.toString(),
        target: target.toString(),
        actualValue: actualValue.toString(),
        error: error.toString(),
        verified,
      }
    )

    return { verified, error, actualValue }
  }

  /**
   * Get recommended parameters for common optimization scenarios
   */
  static getRecommendedParams(
    scenario: 'opm_backsolve' | 'option_exercise' | 'conversion_point'
  ): OptimizationParams {
    switch (scenario) {
      case 'opm_backsolve':
        return {
          method: OptimizationMethod.HYBRID,
          maxIterations: 50,
          tolerance: new Decimal(0.01),
          minStepSize: new Decimal(1000), // $1,000
          maxStepSize: new Decimal(10000000), // $10M
          direction: 'increasing',
        }

      case 'option_exercise':
        return {
          method: OptimizationMethod.NEWTON_RAPHSON,
          maxIterations: 30,
          tolerance: new Decimal(0.01),
          minStepSize: new Decimal(100),
          maxStepSize: new Decimal(1000000),
        }

      case 'conversion_point':
        return {
          method: OptimizationMethod.HYBRID,
          maxIterations: 40,
          tolerance: new Decimal(0.01),
          minStepSize: new Decimal(1000),
          maxStepSize: new Decimal(5000000),
          direction: 'increasing',
        }

      default:
        return {
          method: OptimizationMethod.AUTO,
          maxIterations: 50,
          tolerance: new Decimal(0.01),
        }
    }
  }

  /**
   * Convert CircularSolutionResult to OptimizationResult
   */
  private convertToOptimizationResult(
    result: CircularSolutionResult,
    method: OptimizationMethod,
    startTime: number
  ): OptimizationResult {
    return {
      solution: result.exitValue,
      iterations: result.iterations,
      error: result.tolerance,
      converged: result.converged,
      method,
      explanation: result.explanation,
      iterationHistory: result.iterationHistory?.map((step) => ({
        iteration: step.iteration,
        value: step.exitValue,
        error: step.error,
        satisfied: step.satisfied,
      })),
      performance: {
        executionTimeMs: Date.now() - startTime,
        methodsAttempted: [method],
      },
    }
  }

  /**
   * Format optimization result for logging/display
   */
  static formatResult(result: OptimizationResult): string {
    return `${result.converged ? 'Converged' : 'Failed'} using ${result.method} in ${result.iterations} iterations (${result.performance.executionTimeMs}ms). Solution: ${DecimalHelpers.formatCurrency(result.solution)}, Error: ${result.error.toFixed(4)}`
  }
}
