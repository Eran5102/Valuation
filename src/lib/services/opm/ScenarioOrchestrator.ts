/**
 * Scenario Orchestrator
 *
 * Orchestrates Hybrid Scenario PWERM (Probability-Weighted Expected Return Method) calculations.
 *
 * Process:
 * 1. Validate scenarios and probabilities
 * 2. Normalize probabilities to sum to 100%
 * 3. For each scenario:
 *    - Apply scenario-specific or global parameters
 *    - Run backsolve to find EV that achieves scenario's target FMV
 * 4. Calculate probability-weighted FMV across all scenarios
 * 5. Calculate statistical metrics (mean, variance, percentiles)
 * 6. Package and return complete hybrid result
 *
 * @module ScenarioOrchestrator
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'
import { BacksolveOptimizer, BacksolveRequest, BacksolveResult } from './BacksolveOptimizer'
import { ProbabilityHelpers, WeightedValue } from '../shared/math/ProbabilityHelpers'
import { DecimalHelpers } from '../comprehensiveBreakpoints/v3/utilities/DecimalHelpers'
import { AuditTrailLogger } from '../comprehensiveBreakpoints/v3/utilities/AuditTrailLogger'
import type {
  HybridScenario,
  HybridScenarioResult,
  HybridPWERMResult,
  OPMBlackScholesParams,
  OPMBreakpoint,
} from '@/types/opm'

// Configure Decimal for high precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Hybrid PWERM request
 */
export interface HybridPWERMRequest {
  /** Security class to optimize for */
  securityClassId: string

  /** Scenarios to analyze */
  scenarios: HybridScenario[]

  /** Global Black-Scholes parameters (used unless scenario overrides) */
  globalBlackScholesParams: OPMBlackScholesParams

  /** Global breakpoints (used unless scenario overrides) */
  globalBreakpoints: OPMBreakpoint[]

  /** Total shares outstanding */
  totalShares: number

  /** Probability format */
  probabilityFormat: 'percentage' | 'decimal'

  /** Target probability-weighted FMV to achieve (optional - for backsolve mode) */
  targetWeightedFMV?: number
}

/**
 * ScenarioOrchestrator
 *
 * Orchestrates hybrid scenario PWERM calculations
 */
export class ScenarioOrchestrator {
  private backsolveOptimizer: BacksolveOptimizer

  constructor(private auditLogger: AuditTrailLogger) {
    this.backsolveOptimizer = new BacksolveOptimizer(auditLogger)
  }

  /**
   * Execute hybrid PWERM analysis
   *
   * @param request - Hybrid PWERM request
   * @returns Complete hybrid result with probability-weighted FMV
   *
   * @example
   * ```typescript
   * const request = {
   *   securityClassId: 'common',
   *   scenarios: [
   *     { id: '1', name: 'IPO', probability: 30, targetFMV: 10.50 },
   *     { id: '2', name: 'Acquisition', probability: 50, targetFMV: 7.25 },
   *     { id: '3', name: 'Down Round', probability: 20, targetFMV: 2.00 },
   *   ],
   *   globalBlackScholesParams: { ... },
   *   globalBreakpoints: [ ... ],
   *   totalShares: 10000000,
   *   probabilityFormat: 'percentage',
   * }
   * const result = await orchestrator.executeHybrid(request)
   * // result.weightedFMV = probability-weighted FMV across scenarios
   * ```
   */
  async executeHybrid(request: HybridPWERMRequest): Promise<HybridPWERMResult> {
    const startTime = Date.now()

    this.auditLogger.step('Starting Hybrid PWERM orchestration')
    this.auditLogger.info('Hybrid PWERM', 'Request parameters', {
      securityClass: request.securityClassId,
      scenarioCount: request.scenarios.length,
      probabilityFormat: request.probabilityFormat,
    })

    // Step 1: Validate scenarios and probabilities
    const probabilityValidation = this.validateProbabilities(
      request.scenarios,
      request.probabilityFormat
    )

    if (!probabilityValidation.valid) {
      return this.buildErrorResult(request, probabilityValidation.errors, startTime)
    }

    // Step 2: Normalize probabilities (to decimal format 0-1)
    const normalizedProbabilities = probabilityValidation.normalizedProbabilities

    this.auditLogger.info('Hybrid PWERM', 'Probabilities validated', {
      totalProbability: probabilityValidation.totalProbability,
      normalized: normalizedProbabilities,
    })

    // Step 3: Execute backsolve for each scenario
    const scenarioResults: HybridScenarioResult[] = []
    const errors: string[] = []
    const warnings: string[] = [...probabilityValidation.warnings]

    for (let i = 0; i < request.scenarios.length; i++) {
      const scenario = request.scenarios[i]
      const normalizedProbability = normalizedProbabilities[i]

      this.auditLogger.info('Hybrid Scenario', `Processing scenario ${i + 1}`, {
        id: scenario.id,
        name: scenario.name,
        probability: normalizedProbability,
        targetFMV: scenario.targetFMV,
      })

      try {
        // Build backsolve request for this scenario
        const backsolveRequest = this.buildBacksolveRequest(
          scenario,
          normalizedProbability,
          request
        )

        // Execute backsolve
        const backsolveResult = await this.backsolveOptimizer.backsolve(backsolveRequest)

        if (!backsolveResult.success) {
          errors.push(`Scenario '${scenario.name}' failed: ${backsolveResult.errors?.join(', ')}`)
        }

        if (backsolveResult.warnings) {
          warnings.push(...backsolveResult.warnings.map((w) => `[${scenario.name}] ${w}`))
        }

        // Package scenario result
        const scenarioResult: HybridScenarioResult = {
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          probability: normalizedProbability,
          targetFMV: scenario.targetFMV,
          calculatedFMV: backsolveResult.actualFMV,
          blackScholesParams: backsolveRequest.blackScholesParams,
          breakpoints: backsolveRequest.breakpoints,
          allocation: backsolveResult.allocation,
          weightedContribution: 0, // Will calculate below
          percentOfWeightedValue: 0, // Will calculate below
        }

        scenarioResults.push(scenarioResult)

        this.auditLogger.info('Hybrid Scenario', `Scenario ${i + 1} complete`, {
          success: backsolveResult.success,
          enterpriseValue: backsolveResult.enterpriseValue,
          actualFMV: backsolveResult.actualFMV,
        })
      } catch (error) {
        const errorMsg = `Scenario '${scenario.name}' threw exception: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMsg)
        this.auditLogger.error('Hybrid Scenario', `Scenario ${i + 1} failed`, { error })

        // Add placeholder scenario result
        scenarioResults.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          probability: normalizedProbability,
          targetFMV: scenario.targetFMV,
          calculatedFMV: 0,
          blackScholesParams: request.globalBlackScholesParams,
          breakpoints: request.globalBreakpoints,
          allocation: {
            enterpriseValue: 0,
            allocationsByClass: [],
            breakpointAllocations: [],
            totalValueDistributed: 0,
            valid: false,
          },
          weightedContribution: 0,
          percentOfWeightedValue: 0,
        })
      }
    }

    // Step 4: Calculate probability-weighted FMV
    const weightedFMV = this.calculateWeightedFMV(scenarioResults)

    // Step 5: Calculate weighted contributions and percentages
    for (const result of scenarioResults) {
      result.weightedContribution = result.calculatedFMV * result.probability
      result.percentOfWeightedValue =
        weightedFMV > 0 ? (result.weightedContribution / weightedFMV) * 100 : 0
    }

    // Step 6: Calculate statistical metrics
    const statistics = this.calculateStatistics(scenarioResults)

    // Step 7: Determine if we have a solution
    const allScenariosSucceeded = scenarioResults.every((sr) => sr.allocation.valid)
    const converged = allScenariosSucceeded && errors.length === 0

    // For backsolve mode: Calculate enterprise value that achieves target weighted FMV
    // (This would require iterating on EV across all scenarios - simplified for now)
    let enterpriseValue = 0
    if (scenarioResults.length > 0) {
      // Use weighted average of scenario EVs as approximation
      const weightedEV = scenarioResults.reduce(
        (sum, sr) => sum + sr.allocation.enterpriseValue * sr.probability,
        0
      )
      enterpriseValue = weightedEV
    }

    // Step 8: Calculate error if target provided
    let error = 0
    if (request.targetWeightedFMV) {
      error = Math.abs(weightedFMV - request.targetWeightedFMV)
    }

    const executionTimeMs = Date.now() - startTime

    const result: HybridPWERMResult = {
      success: converged,
      enterpriseValue,
      weightedFMV,
      error,
      converged,
      iterations: scenarioResults.reduce((sum, sr) => sum + (sr.allocation.valid ? 1 : 0), 0),
      scenarioResults,
      probabilityValidation: {
        valid: probabilityValidation.valid,
        totalProbability: probabilityValidation.totalProbability,
        normalizedProbabilities,
        errors: probabilityValidation.errors,
        warnings: probabilityValidation.warnings,
      },
      statistics,
      metadata: {
        method: 'hybrid_pwerm',
        executionTimeMs,
        iterationHistory: undefined, // Could add if needed
      },
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    this.auditLogger.info('Hybrid PWERM', 'Orchestration complete', {
      success: result.success,
      weightedFMV: result.weightedFMV,
      scenariosProcessed: scenarioResults.length,
      executionTimeMs,
    })

    return result
  }

  /**
   * Validate probabilities
   */
  private validateProbabilities(
    scenarios: HybridScenario[],
    format: 'percentage' | 'decimal'
  ): {
    valid: boolean
    totalProbability: number
    normalizedProbabilities: number[]
    errors: string[]
    warnings: string[]
  } {
    if (scenarios.length === 0) {
      return {
        valid: false,
        totalProbability: 0,
        normalizedProbabilities: [],
        errors: ['No scenarios provided'],
        warnings: [],
      }
    }

    const probabilities = scenarios.map((s) => s.probability)

    // Use ProbabilityHelpers for validation
    const validation = ProbabilityHelpers.validateProbabilities(probabilities, format, 0.01)

    return {
      valid: validation.valid,
      totalProbability: validation.total,
      normalizedProbabilities: validation.normalized,
      errors: validation.errors,
      warnings: validation.warnings,
    }
  }

  /**
   * Build backsolve request for a scenario
   */
  private buildBacksolveRequest(
    scenario: HybridScenario,
    normalizedProbability: number,
    request: HybridPWERMRequest
  ): BacksolveRequest {
    // Use scenario-specific params if provided, otherwise use global
    const blackScholesParams: OPMBlackScholesParams = {
      ...request.globalBlackScholesParams,
      ...scenario.blackScholesParams,
    }

    const breakpoints = scenario.breakpoints || request.globalBreakpoints

    return {
      targetFMV: scenario.targetFMV,
      securityClassId: request.securityClassId,
      blackScholesParams,
      breakpoints,
      totalShares: request.totalShares,
    }
  }

  /**
   * Calculate probability-weighted FMV across scenarios
   */
  private calculateWeightedFMV(scenarioResults: HybridScenarioResult[]): number {
    const values: WeightedValue[] = scenarioResults.map((sr) => ({
      value: sr.calculatedFMV,
      weight: sr.probability, // Already normalized to 0-1
    }))

    return ProbabilityHelpers.calculateWeightedAverage(values, 'decimal')
  }

  /**
   * Calculate statistical metrics
   */
  private calculateStatistics(scenarioResults: HybridScenarioResult[]): {
    weightedMean: number
    weightedVariance: number
    weightedStdDev: number
    coefficientOfVariation: number
    percentile25: number
    percentile50: number
    percentile75: number
  } {
    const values = scenarioResults.map((sr) => sr.calculatedFMV)
    const probabilities = scenarioResults.map((sr) => sr.probability)

    const weightedMean = ProbabilityHelpers.calculateExpectedValue(values, probabilities)
    const weightedVariance = ProbabilityHelpers.calculateVariance(values, probabilities)
    const weightedStdDev = ProbabilityHelpers.calculateStandardDeviation(values, probabilities)
    const coefficientOfVariation = weightedMean > 0 ? weightedStdDev / weightedMean : 0

    // Sort for percentile calculation
    const sortedIndices = values.map((_, i) => i).sort((a, b) => values[a] - values[b])
    const sortedValues = sortedIndices.map((i) => values[i])
    const sortedProbs = sortedIndices.map((i) => probabilities[i])

    const percentile25 = ProbabilityHelpers.calculatePercentile(sortedValues, sortedProbs, 25)
    const percentile50 = ProbabilityHelpers.calculatePercentile(sortedValues, sortedProbs, 50)
    const percentile75 = ProbabilityHelpers.calculatePercentile(sortedValues, sortedProbs, 75)

    return {
      weightedMean,
      weightedVariance,
      weightedStdDev,
      coefficientOfVariation,
      percentile25,
      percentile50,
      percentile75,
    }
  }

  /**
   * Build error result (for validation failures)
   */
  private buildErrorResult(
    request: HybridPWERMRequest,
    errors: string[],
    startTime: number
  ): HybridPWERMResult {
    const executionTimeMs = Date.now() - startTime

    return {
      success: false,
      enterpriseValue: 0,
      weightedFMV: 0,
      error: Infinity,
      converged: false,
      iterations: 0,
      scenarioResults: [],
      probabilityValidation: {
        valid: false,
        totalProbability: 0,
        normalizedProbabilities: [],
        errors,
        warnings: [],
      },
      statistics: {
        weightedMean: 0,
        weightedVariance: 0,
        weightedStdDev: 0,
        coefficientOfVariation: 0,
        percentile25: 0,
        percentile50: 0,
        percentile75: 0,
      },
      metadata: {
        method: 'hybrid_pwerm',
        executionTimeMs,
      },
      errors,
    }
  }

  /**
   * Format hybrid result for display
   */
  static formatResult(result: HybridPWERMResult): string {
    const lines: string[] = []

    lines.push('Hybrid PWERM Result')
    lines.push('='.repeat(80))
    lines.push('')

    lines.push(`Status: ${result.success ? 'SUCCESS ✓' : 'FAILED ✗'}`)
    lines.push(`Converged: ${result.converged ? 'Yes ✓' : 'No ✗'}`)
    lines.push('')

    lines.push(`Weighted FMV: $${result.weightedFMV.toFixed(4)}`)
    lines.push(`Weighted Mean: $${result.statistics.weightedMean.toFixed(4)}`)
    lines.push(`Standard Deviation: $${result.statistics.weightedStdDev.toFixed(4)}`)
    lines.push(
      `Coefficient of Variation: ${(result.statistics.coefficientOfVariation * 100).toFixed(2)}%`
    )
    lines.push('')

    lines.push('Percentiles:')
    lines.push(`  25th: $${result.statistics.percentile25.toFixed(4)}`)
    lines.push(`  50th: $${result.statistics.percentile50.toFixed(4)}`)
    lines.push(`  75th: $${result.statistics.percentile75.toFixed(4)}`)
    lines.push('')

    lines.push('Scenario Results:')
    lines.push('-'.repeat(80))
    for (const sr of result.scenarioResults) {
      lines.push(
        `${sr.scenarioName.padEnd(20)} | ` +
          `Prob: ${(sr.probability * 100).toFixed(1)}% | ` +
          `FMV: $${sr.calculatedFMV.toFixed(4)} | ` +
          `Weighted: $${sr.weightedContribution.toFixed(4)} | ` +
          `${sr.percentOfWeightedValue.toFixed(2)}%`
      )
    }
    lines.push('')

    lines.push(`Execution Time: ${result.metadata.executionTimeMs}ms`)

    if (result.errors && result.errors.length > 0) {
      lines.push('')
      lines.push('ERRORS:')
      result.errors.forEach((err) => lines.push(`  ✗ ${err}`))
    }

    if (result.warnings && result.warnings.length > 0) {
      lines.push('')
      lines.push('WARNINGS:')
      result.warnings.forEach((warn) => lines.push(`  ⚠ ${warn}`))
    }

    return lines.join('\n')
  }
}
