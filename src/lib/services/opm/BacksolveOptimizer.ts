/**
 * Backsolve Optimizer
 *
 * Finds the enterprise value that produces a target FMV per share for a given security class.
 * Uses the V3 optimization solvers (Newton-Raphson and Binary Search) via OptimizerEngine.
 *
 * Core Algorithm:
 * 1. Define target function: f(EV) = calculated_FMV(EV) - target_FMV
 * 2. Use OptimizerEngine to find EV where f(EV) = 0
 * 3. Verify solution and return result
 *
 * @module BacksolveOptimizer
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'
import {
  OptimizerEngine,
  OptimizationParams,
  OptimizationResult,
} from '../shared/optimization/OptimizerEngine'
import { OPMCalculationEngine, OPMCalculationContext } from './OPMCalculationEngine'
import { DecimalHelpers } from '../comprehensiveBreakpoints/v3/utilities/DecimalHelpers'
import { AuditTrailLogger } from '../comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import type { OPMBlackScholesParams, OPMBreakpoint, OPMAllocationResult } from '@/types/opm'

// Configure Decimal for high precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Backsolve request parameters
 */
export interface BacksolveRequest {
  /** Target FMV per share to achieve */
  targetFMV: number

  /** Security class to optimize for */
  securityClassId: string

  /** Black-Scholes parameters */
  blackScholesParams: OPMBlackScholesParams

  /** Breakpoints to use in calculation */
  breakpoints: OPMBreakpoint[]

  /** Total shares outstanding (for validation) */
  totalShares: number

  /** Optimization parameters (optional) */
  optimizationParams?: Partial<OptimizationParams>
}

/**
 * Backsolve result
 */
export interface BacksolveResult {
  /** Whether backsolve succeeded */
  success: boolean

  /** Calculated enterprise value that achieves target FMV */
  enterpriseValue: number

  /** Actual FMV achieved */
  actualFMV: number

  /** Error between target and actual FMV */
  error: number

  /** Whether optimization converged */
  converged: boolean

  /** Number of iterations required */
  iterations: number

  /** Optimization method used */
  method: string

  /** Complete allocation at solution */
  allocation: OPMAllocationResult

  /** Execution metadata */
  metadata: {
    executionTimeMs: number
    methodsAttempted: string[]
    initialGuess?: number
    searchBounds?: { min: number; max: number }
  }

  /** Errors (if any) */
  errors?: string[]

  /** Warnings (if any) */
  warnings?: string[]
}

/**
 * BacksolveOptimizer
 *
 * Orchestrates OPM backsolve optimization
 */
export class BacksolveOptimizer {
  private optimizerEngine: OptimizerEngine
  private calculationEngine: OPMCalculationEngine

  constructor(private auditLogger: AuditTrailLogger) {
    this.optimizerEngine = new OptimizerEngine(auditLogger)
    this.calculationEngine = new OPMCalculationEngine(auditLogger)
  }

  /**
   * Perform OPM backsolve to find enterprise value that achieves target FMV
   *
   * @param request - Backsolve request parameters
   * @returns Backsolve result with solution
   *
   * @example
   * ```typescript
   * const request = {
   *   targetFMV: 5.25,
   *   securityClassId: 'common',
   *   blackScholesParams: { ... },
   *   breakpoints: [ ... ],
   *   totalShares: 10000000,
   * }
   * const result = await optimizer.backsolve(request)
   * // result.enterpriseValue = solution that achieves target FMV
   * ```
   */
  async backsolve(request: BacksolveRequest): Promise<BacksolveResult> {
    const startTime = Date.now()

    this.auditLogger.step('Starting OPM backsolve')
    this.auditLogger.info('Backsolve Request', 'Target parameters', {
      targetFMV: request.targetFMV,
      securityClass: request.securityClassId,
    })

    // Validate request
    this.validateRequest(request)

    // Define target function: f(EV) = calculated_FMV - target_FMV
    const targetFunction = (enterpriseValue: Decimal): Decimal => {
      const ev = enterpriseValue.toNumber()

      // Calculate OPM allocation at this enterprise value
      const context: OPMCalculationContext = {
        enterpriseValue: ev,
        blackScholesParams: request.blackScholesParams,
        breakpoints: request.breakpoints,
        totalShares: request.totalShares,
      }

      try {
        const allocationResult = this.calculationEngine.calculate(context)

        // Get FMV for target security class
        const calculatedFMV = this.calculationEngine.getFMVPerShare(
          allocationResult,
          request.securityClassId
        )

        this.auditLogger.debug('Backsolve Iteration', 'FMV calculation', {
          enterpriseValue: ev,
          calculatedFMV,
          targetFMV: request.targetFMV,
          error: Math.abs(calculatedFMV - request.targetFMV),
        })

        // Return difference: calculated - target
        return DecimalHelpers.toDecimal(calculatedFMV - request.targetFMV)
      } catch (error) {
        this.auditLogger.error('Backsolve Iteration', 'Calculation failed', {
          error,
          enterpriseValue: ev,
        })
        throw error
      }
    }

    // Build optimization parameters
    const optimizationParams = this.buildOptimizationParams(request)

    this.auditLogger.info('Backsolve Optimization', 'Starting optimization', {
      method: optimizationParams.method,
      initialGuess: optimizationParams.initialGuess?.toString(),
      searchBounds: optimizationParams.searchBounds,
    })

    // Run optimization
    let optimizationResult: OptimizationResult
    try {
      optimizationResult = await this.optimizerEngine.optimize(
        targetFunction,
        DecimalHelpers.toDecimal(0), // Target: f(EV) = 0
        optimizationParams
      )
    } catch (error) {
      const executionTimeMs = Date.now() - startTime

      this.auditLogger.error('Backsolve Optimization', 'Optimization failed', { error })

      return {
        success: false,
        enterpriseValue: 0,
        actualFMV: 0,
        error: Infinity,
        converged: false,
        iterations: 0,
        method: 'failed',
        allocation: this.getEmptyAllocation(),
        metadata: {
          executionTimeMs,
          methodsAttempted: [],
        },
        errors: [error instanceof Error ? error.message : String(error)],
      }
    }

    const executionTimeMs = Date.now() - startTime

    this.auditLogger.info('Backsolve Optimization', 'Optimization complete', {
      converged: optimizationResult.converged,
      iterations: optimizationResult.iterations,
      solution: optimizationResult.solution.toString(),
      executionTimeMs,
    })

    // Calculate final allocation at solution
    const solutionEV = optimizationResult.solution.toNumber()
    const finalContext: OPMCalculationContext = {
      enterpriseValue: solutionEV,
      blackScholesParams: request.blackScholesParams,
      breakpoints: request.breakpoints,
      totalShares: request.totalShares,
    }

    const finalAllocation = this.calculationEngine.calculate(finalContext)
    const actualFMV = this.calculationEngine.getFMVPerShare(
      finalAllocation,
      request.securityClassId
    )

    // Verify solution
    const verification = this.optimizerEngine.verifySolution(
      targetFunction,
      optimizationResult.solution,
      DecimalHelpers.toDecimal(0),
      DecimalHelpers.toDecimal(0.01) // 1 cent tolerance
    )

    const errors: string[] = []
    const warnings: string[] = []

    if (!verification.verified) {
      warnings.push(
        `Solution verification warning: Error ${verification.error.toFixed(4)} exceeds tolerance`
      )
    }

    if (!optimizationResult.converged) {
      warnings.push('Optimization did not fully converge')
    }

    if (!finalAllocation.valid) {
      errors.push('Final allocation validation failed')
      if (finalAllocation.validationErrors) {
        errors.push(...finalAllocation.validationErrors)
      }
    }

    const result: BacksolveResult = {
      success: optimizationResult.converged && finalAllocation.valid && errors.length === 0,
      enterpriseValue: solutionEV,
      actualFMV,
      error: Math.abs(actualFMV - request.targetFMV),
      converged: optimizationResult.converged,
      iterations: optimizationResult.iterations,
      method: optimizationResult.method,
      allocation: finalAllocation,
      metadata: {
        executionTimeMs,
        methodsAttempted: optimizationResult.performance.methodsAttempted,
        initialGuess: optimizationParams.initialGuess?.toNumber(),
        searchBounds: optimizationParams.searchBounds
          ? {
              min: optimizationParams.searchBounds.min.toNumber(),
              max: optimizationParams.searchBounds.max.toNumber(),
            }
          : undefined,
      },
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    this.auditLogger.info('Backsolve Complete', 'Final result', {
      success: result.success,
      enterpriseValue: result.enterpriseValue,
      actualFMV: result.actualFMV,
      error: result.error,
    })

    return result
  }

  /**
   * Validate backsolve request
   */
  private validateRequest(request: BacksolveRequest): void {
    if (request.targetFMV <= 0) {
      throw new Error(`Target FMV must be positive, got ${request.targetFMV}`)
    }

    if (!request.securityClassId || request.securityClassId.trim() === '') {
      throw new Error('Security class ID is required')
    }

    if (!request.breakpoints || request.breakpoints.length === 0) {
      throw new Error('At least one breakpoint is required')
    }

    if (request.totalShares <= 0) {
      throw new Error(`Total shares must be positive, got ${request.totalShares}`)
    }

    // Check that target security class exists in breakpoints
    const securityExists = request.breakpoints.some((bp) =>
      bp.allocation.some((alloc) => alloc.securityClass === request.securityClassId)
    )

    if (!securityExists) {
      throw new Error(
        `Security class '${request.securityClassId}' not found in any breakpoint allocations`
      )
    }
  }

  /**
   * Build optimization parameters
   */
  private buildOptimizationParams(request: BacksolveRequest): OptimizationParams {
    // Use provided params or get recommended defaults for OPM backsolve
    const recommended = OptimizerEngine.getRecommendedParams('opm_backsolve')

    // Estimate initial guess based on target FMV
    // Rough estimate: EV ≈ target_FMV * total_shares * safety_factor
    const estimatedEV = request.targetFMV * request.totalShares * 1.5

    // Search bounds: [min_breakpoint, 10x estimated EV]
    const minBreakpoint = Math.min(...request.breakpoints.map((bp) => bp.value))
    const searchBounds = {
      min: DecimalHelpers.toDecimal(Math.max(minBreakpoint, estimatedEV * 0.1)),
      max: DecimalHelpers.toDecimal(estimatedEV * 10),
    }

    const params: OptimizationParams = {
      ...recommended,
      ...request.optimizationParams,
      initialGuess: request.optimizationParams?.initialGuess
        ? DecimalHelpers.toDecimal(request.optimizationParams.initialGuess)
        : DecimalHelpers.toDecimal(estimatedEV),
      searchBounds: request.optimizationParams?.searchBounds
        ? {
            min: DecimalHelpers.toDecimal(request.optimizationParams.searchBounds.min),
            max: DecimalHelpers.toDecimal(request.optimizationParams.searchBounds.max),
          }
        : searchBounds,
    }

    return params
  }

  /**
   * Get empty allocation (for error cases)
   */
  private getEmptyAllocation(): OPMAllocationResult {
    return {
      enterpriseValue: 0,
      allocationsByClass: [],
      breakpointAllocations: [],
      totalValueDistributed: 0,
      valid: false,
      validationErrors: ['No allocation calculated'],
    }
  }

  /**
   * Format backsolve result for display
   */
  static formatResult(result: BacksolveResult): string {
    const lines: string[] = []

    lines.push('OPM Backsolve Result')
    lines.push('='.repeat(80))
    lines.push('')

    lines.push(`Status: ${result.success ? 'SUCCESS ✓' : 'FAILED ✗'}`)
    lines.push(`Converged: ${result.converged ? 'Yes ✓' : 'No ✗'}`)
    lines.push('')

    lines.push(
      `Enterprise Value: ${DecimalHelpers.formatCurrency(new Decimal(result.enterpriseValue))}`
    )
    lines.push(`Actual FMV: $${result.actualFMV.toFixed(4)}`)
    lines.push(`Error: $${result.error.toFixed(4)}`)
    lines.push('')

    lines.push(`Method: ${result.method}`)
    lines.push(`Iterations: ${result.iterations}`)
    lines.push(`Execution Time: ${result.metadata.executionTimeMs}ms`)
    lines.push(`Methods Attempted: ${result.metadata.methodsAttempted.join(', ')}`)
    lines.push('')

    if (result.errors && result.errors.length > 0) {
      lines.push('ERRORS:')
      result.errors.forEach((err) => lines.push(`  ✗ ${err}`))
      lines.push('')
    }

    if (result.warnings && result.warnings.length > 0) {
      lines.push('WARNINGS:')
      result.warnings.forEach((warn) => lines.push(`  ⚠ ${warn}`))
      lines.push('')
    }

    lines.push('Allocation Summary:')
    lines.push('-'.repeat(80))
    for (const alloc of result.allocation.allocationsByClass) {
      lines.push(
        `${alloc.securityClass.padEnd(30)} | ` +
          `$${alloc.valuePerShare.toFixed(4).padStart(10)} | ` +
          `${alloc.percentOfTotal.toFixed(2)}%`
      )
    }

    return lines.join('\n')
  }
}
