/**
 * Weighted Backsolve Optimizer
 *
 * For Hybrid PWERM: Given multiple scenarios where some have fixed enterprise values
 * and one needs to be backsolve, find the enterprise value for the backsolve scenario
 * such that the probability-weighted average FMV equals the target FMV.
 *
 * Mathematical Constraint:
 * Σ(probability_i × FMV_i) = target_FMV
 *
 * Where one scenario's CV is unknown and needs to be solved.
 *
 * @module WeightedBacksolveOptimizer
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'
import { OPMCalculationEngine, OPMCalculationContext } from './OPMCalculationEngine'
import {
  OptimizerEngine,
  OptimizationParams,
  OptimizationResult,
} from '../shared/optimization/OptimizerEngine'
import { DecimalHelpers } from '../comprehensiveBreakpoints/v3/utilities/DecimalHelpers'
import { AuditTrailLogger } from '../comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import type { OPMBlackScholesParams, OPMBreakpoint, OPMAllocationResult } from '@/types/opm'

// Configure Decimal for high precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Scenario definition for weighted backsolve
 */
export interface WeightedScenario {
  /** Scenario name */
  name: string

  /** Probability (0-1 or 0-100 depending on format) */
  probability: number

  /** Black-Scholes parameters for this scenario */
  blackScholesParams: OPMBlackScholesParams

  /** Enterprise value (fixed scenarios only) */
  enterpriseValue?: number

  /** Whether this is the backsolve scenario */
  isBacksolve: boolean
}

/**
 * Weighted backsolve request
 */
export interface WeightedBacksolveRequest {
  /** Target FMV per share to achieve (from cap table) */
  targetFMV: number

  /** Security class to optimize for */
  securityClassId: string

  /** All scenarios (fixed + backsolve) */
  scenarios: WeightedScenario[]

  /** Breakpoints to use (same for all scenarios) */
  breakpoints: OPMBreakpoint[]

  /** Total shares outstanding */
  totalShares: number

  /** Map of security class name -> total shares for that class */
  shareClassTotals: Map<string, number>

  /** Probability format */
  probabilityFormat: 'percentage' | 'decimal'

  /** Optimization parameters (optional) */
  optimizationParams?: Partial<OptimizationParams>
}

/**
 * Scenario result
 */
export interface WeightedScenarioResult {
  name: string
  probability: number
  enterpriseValue: number
  fmvPerShare: number
  weightedContribution: number
  allocation: OPMAllocationResult
  isBacksolve: boolean
}

/**
 * Weighted backsolve result
 */
export interface WeightedBacksolveResult {
  /** Whether backsolve succeeded */
  success: boolean

  /** Target FMV that was aimed for */
  targetFMV: number

  /** Actual weighted average FMV achieved */
  actualWeightedFMV: number

  /** Error between target and actual */
  error: number

  /** Whether optimization converged */
  converged: boolean

  /** Results for each scenario */
  scenarioResults: WeightedScenarioResult[]

  /** Index of the backsolve scenario */
  backsolveScenarioIndex: number

  /** Optimization metadata */
  metadata: {
    executionTimeMs: number
    iterations: number
    method: string
  }

  /** Errors (if any) */
  errors?: string[]

  /** Warnings (if any) */
  warnings?: string[]
}

/**
 * WeightedBacksolveOptimizer
 *
 * Orchestrates weighted backsolve for hybrid PWERM scenarios
 */
export class WeightedBacksolveOptimizer {
  private optimizerEngine: OptimizerEngine
  private calculationEngine: OPMCalculationEngine

  constructor(private auditLogger: AuditTrailLogger) {
    this.optimizerEngine = new OptimizerEngine(auditLogger)
    this.calculationEngine = new OPMCalculationEngine(auditLogger)
  }

  /**
   * Perform weighted backsolve
   *
   * @param request - Weighted backsolve request
   * @returns Weighted backsolve result
   */
  async backsolve(request: WeightedBacksolveRequest): Promise<WeightedBacksolveResult> {
    const startTime = Date.now()

    this.auditLogger.step('Starting Weighted Backsolve')
    this.auditLogger.info('Weighted Backsolve Request', 'Parameters', {
      targetFMV: request.targetFMV,
      securityClass: request.securityClassId,
      scenarioCount: request.scenarios.length,
    })

    // Validate request
    this.validateRequest(request)

    // Normalize probabilities to decimal format
    const normalizedScenarios = this.normalizeScenarios(
      request.scenarios,
      request.probabilityFormat
    )

    // Find backsolve scenario
    const backsolveScenarioIndex = normalizedScenarios.findIndex((s) => s.isBacksolve)
    if (backsolveScenarioIndex === -1) {
      throw new Error('No backsolve scenario found')
    }

    const backsolveScenario = normalizedScenarios[backsolveScenarioIndex]

    // Calculate fixed scenarios' weighted contributions
    const fixedScenarios = normalizedScenarios.filter((s) => !s.isBacksolve)
    const fixedWeightedSum = this.calculateFixedWeightedSum(fixedScenarios, request)

    this.auditLogger.info('Fixed Scenarios', 'Weighted sum', {
      fixedWeightedSum,
      backsolveScenarioProbability: backsolveScenario.probability,
    })

    // Calculate required FMV for backsolve scenario
    // target = fixedSum + (backsolveProb × backsolveFMV)
    // backsolveFMV = (target - fixedSum) / backsolveProb
    const requiredFMV = (request.targetFMV - fixedWeightedSum) / backsolveScenario.probability

    this.auditLogger.info('Backsolve Target', 'Required FMV', {
      requiredFMV,
      calculation: `(${request.targetFMV} - ${fixedWeightedSum}) / ${backsolveScenario.probability}`,
    })

    if (requiredFMV <= 0) {
      throw new Error(
        `Required FMV for backsolve scenario is negative or zero (${requiredFMV}). ` +
          `This means the fixed scenarios already exceed the target weighted FMV.`
      )
    }

    // Define target function: f(EV) = calculated_FMV - required_FMV
    const targetFunction = (enterpriseValue: Decimal): Decimal => {
      const ev = enterpriseValue.toNumber()

      // Calculate OPM allocation at this enterprise value
      const context: OPMCalculationContext = {
        enterpriseValue: ev,
        blackScholesParams: backsolveScenario.blackScholesParams,
        breakpoints: request.breakpoints,
        totalShares: request.totalShares,
        shareClassTotals: request.shareClassTotals,
      }

      try {
        const allocationResult = this.calculationEngine.calculate(context)

        // Get FMV for target security class
        const calculatedFMV = this.calculationEngine.getFMVPerShare(
          allocationResult,
          request.securityClassId
        )

        this.auditLogger.debug('Weighted Backsolve Iteration', 'FMV calculation', {
          enterpriseValue: ev,
          calculatedFMV,
          requiredFMV,
          error: Math.abs(calculatedFMV - requiredFMV),
        })

        // Return difference: calculated - required
        return DecimalHelpers.toDecimal(calculatedFMV - requiredFMV)
      } catch (error) {
        this.auditLogger.error('Weighted Backsolve Iteration', 'Calculation failed', {
          error,
          enterpriseValue: ev,
        })
        throw error
      }
    }

    // Build optimization parameters
    const optimizationParams = this.buildOptimizationParams(request, requiredFMV)

    this.auditLogger.info('Weighted Backsolve Optimization', 'Starting', {
      method: optimizationParams.method,
      initialGuess: optimizationParams.initialGuess?.toString(),
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

      this.auditLogger.error('Weighted Backsolve Optimization', 'Failed', { error })

      return {
        success: false,
        targetFMV: request.targetFMV,
        actualWeightedFMV: 0,
        error: Infinity,
        converged: false,
        scenarioResults: [],
        backsolveScenarioIndex,
        metadata: {
          executionTimeMs,
          iterations: 0,
          method: 'failed',
        },
        errors: [error instanceof Error ? error.message : String(error)],
      }
    }

    const executionTimeMs = Date.now() - startTime

    // Calculate all scenario results with backsolve scenario EV
    const backsolveEV = optimizationResult.solution.toNumber()
    const scenarioResults = await this.calculateAllScenarios(
      normalizedScenarios,
      backsolveScenarioIndex,
      backsolveEV,
      request
    )

    // Calculate weighted average FMV
    const actualWeightedFMV = scenarioResults.reduce(
      (sum, result) => sum + result.weightedContribution,
      0
    )

    const errors: string[] = []
    const warnings: string[] = []

    if (!optimizationResult.converged) {
      warnings.push('Optimization did not fully converge')
    }

    // Check if any scenario allocation is invalid
    scenarioResults.forEach((result) => {
      if (!result.allocation.valid) {
        errors.push(`Scenario '${result.name}' allocation validation failed`)
        if (result.allocation.validationErrors) {
          errors.push(...result.allocation.validationErrors)
        }
      }
    })

    const result: WeightedBacksolveResult = {
      success: optimizationResult.converged && errors.length === 0,
      targetFMV: request.targetFMV,
      actualWeightedFMV,
      error: Math.abs(actualWeightedFMV - request.targetFMV),
      converged: optimizationResult.converged,
      scenarioResults,
      backsolveScenarioIndex,
      metadata: {
        executionTimeMs,
        iterations: optimizationResult.iterations,
        method: optimizationResult.method,
      },
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    this.auditLogger.info('Weighted Backsolve Complete', 'Result', {
      success: result.success,
      backsolveEV,
      actualWeightedFMV,
      error: result.error,
    })

    return result
  }

  /**
   * Validate request
   */
  private validateRequest(request: WeightedBacksolveRequest): void {
    if (request.targetFMV <= 0) {
      throw new Error(`Target FMV must be positive, got ${request.targetFMV}`)
    }

    if (!request.scenarios || request.scenarios.length < 2) {
      throw new Error('At least 2 scenarios required (1 fixed + 1 backsolve)')
    }

    const backsolveScenarios = request.scenarios.filter((s) => s.isBacksolve)
    if (backsolveScenarios.length !== 1) {
      throw new Error(`Exactly 1 backsolve scenario required, got ${backsolveScenarios.length}`)
    }

    const fixedScenarios = request.scenarios.filter((s) => !s.isBacksolve)
    if (fixedScenarios.some((s) => !s.enterpriseValue || s.enterpriseValue <= 0)) {
      throw new Error('All fixed scenarios must have valid enterprise values')
    }

    // Validate probabilities sum to 1 or 100
    const totalProb = request.scenarios.reduce((sum, s) => sum + s.probability, 0)
    const expectedTotal = request.probabilityFormat === 'percentage' ? 100 : 1
    if (Math.abs(totalProb - expectedTotal) > 0.01) {
      throw new Error(`Probabilities must sum to ${expectedTotal}, got ${totalProb.toFixed(2)}`)
    }
  }

  /**
   * Normalize scenarios to decimal probability format
   */
  private normalizeScenarios(
    scenarios: WeightedScenario[],
    format: 'percentage' | 'decimal'
  ): WeightedScenario[] {
    if (format === 'decimal') {
      return scenarios
    }

    return scenarios.map((s) => ({
      ...s,
      probability: s.probability / 100,
    }))
  }

  /**
   * Calculate weighted sum of fixed scenarios
   */
  private calculateFixedWeightedSum(
    fixedScenarios: WeightedScenario[],
    request: WeightedBacksolveRequest
  ): number {
    let sum = 0

    for (const scenario of fixedScenarios) {
      const context: OPMCalculationContext = {
        enterpriseValue: scenario.enterpriseValue!,
        blackScholesParams: scenario.blackScholesParams,
        breakpoints: request.breakpoints,
        totalShares: request.totalShares,
        shareClassTotals: request.shareClassTotals,
      }

      const allocation = this.calculationEngine.calculate(context)
      const fmv = this.calculationEngine.getFMVPerShare(allocation, request.securityClassId)

      sum += scenario.probability * fmv

      this.auditLogger.debug('Fixed Scenario', scenario.name, {
        enterpriseValue: scenario.enterpriseValue,
        fmv,
        probability: scenario.probability,
        weightedContribution: scenario.probability * fmv,
      })
    }

    return sum
  }

  /**
   * Calculate results for all scenarios
   */
  private async calculateAllScenarios(
    scenarios: WeightedScenario[],
    backsolveIndex: number,
    backsolveEV: number,
    request: WeightedBacksolveRequest
  ): Promise<WeightedScenarioResult[]> {
    const results: WeightedScenarioResult[] = []

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i]
      const isBacksolve = i === backsolveIndex
      const enterpriseValue = isBacksolve ? backsolveEV : scenario.enterpriseValue!

      const context: OPMCalculationContext = {
        enterpriseValue,
        blackScholesParams: scenario.blackScholesParams,
        breakpoints: request.breakpoints,
        totalShares: request.totalShares,
        shareClassTotals: request.shareClassTotals,
      }

      const allocation = this.calculationEngine.calculate(context)
      const fmvPerShare = this.calculationEngine.getFMVPerShare(allocation, request.securityClassId)
      const weightedContribution = scenario.probability * fmvPerShare

      results.push({
        name: scenario.name,
        probability: scenario.probability,
        enterpriseValue,
        fmvPerShare,
        weightedContribution,
        allocation,
        isBacksolve,
      })
    }

    return results
  }

  /**
   * Build optimization parameters
   */
  private buildOptimizationParams(
    request: WeightedBacksolveRequest,
    requiredFMV: number
  ): OptimizationParams {
    const recommended = OptimizerEngine.getRecommendedParams('opm_backsolve')

    // Estimate initial guess based on required FMV
    const estimatedEV = requiredFMV * request.totalShares * 1.5

    // Search bounds
    const minBreakpoint = Math.min(...request.breakpoints.map((bp) => bp.value))
    const searchBounds = {
      min: DecimalHelpers.toDecimal(Math.max(minBreakpoint, estimatedEV * 0.1)),
      max: DecimalHelpers.toDecimal(estimatedEV * 10),
    }

    const params: OptimizationParams = {
      ...recommended,
      ...request.optimizationParams,
      initialGuess: DecimalHelpers.toDecimal(estimatedEV),
      searchBounds,
    }

    return params
  }
}
