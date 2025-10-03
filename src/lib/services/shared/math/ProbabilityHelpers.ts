/**
 * Probability Helpers
 *
 * Utility functions for probability-weighted calculations used in hybrid OPM scenarios.
 * Provides validation, normalization, and weighted average calculations.
 *
 * @module ProbabilityHelpers
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'
import { DecimalHelpers } from '../../comprehensiveBreakpoints/v3/utilities/DecimalHelpers'

// Configure Decimal for high precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Weighted value for probability calculations
 */
export interface WeightedValue {
  /** Value to be weighted */
  value: number

  /** Weight/probability (0-100 or 0-1) */
  weight: number

  /** Optional label for the value */
  label?: string
}

/**
 * Probability validation result
 */
export interface ProbabilityValidationResult {
  /** Whether probabilities are valid */
  valid: boolean

  /** Total probability (should be ~100 or ~1) */
  total: number

  /** Error messages */
  errors: string[]

  /** Warning messages */
  warnings: string[]

  /** Normalized probabilities (sum to 1) */
  normalized: number[]
}

/**
 * ProbabilityHelpers
 *
 * Utilities for probability-weighted calculations
 */
export class ProbabilityHelpers {
  /**
   * Calculate weighted average
   *
   * @param values - Array of weighted values
   * @param format - Probability format ('percentage' = 0-100, 'decimal' = 0-1)
   * @returns Weighted average
   *
   * @example
   * ```typescript
   * const result = ProbabilityHelpers.calculateWeightedAverage([
   *   { value: 1000000, weight: 30 },  // IPO scenario: 30%
   *   { value: 500000, weight: 50 },   // Acquisition: 50%
   *   { value: 100000, weight: 20 },   // Down round: 20%
   * ], 'percentage')
   * // result = 580000
   * ```
   */
  static calculateWeightedAverage(
    values: WeightedValue[],
    format: 'percentage' | 'decimal' = 'percentage'
  ): number {
    if (values.length === 0) {
      return 0
    }

    // Convert to decimal format (0-1) if needed
    const normalizedWeights = values.map((v) =>
      format === 'percentage' ? v.weight / 100 : v.weight
    )

    // Calculate total weight
    const totalWeight = normalizedWeights.reduce((sum, w) => sum + w, 0)

    if (totalWeight === 0) {
      throw new Error('Total weight cannot be zero')
    }

    // Calculate weighted sum
    const weightedSum = values.reduce((sum, v, i) => {
      return sum + v.value * normalizedWeights[i]
    }, 0)

    return weightedSum / totalWeight
  }

  /**
   * Calculate weighted average using Decimal for high precision
   *
   * @param values - Array of weighted values (Decimal)
   * @param weights - Array of weights (probabilities)
   * @returns Weighted average as Decimal
   */
  static calculateWeightedAverageDecimal(values: Decimal[], weights: Decimal[]): Decimal {
    if (values.length !== weights.length) {
      throw new Error('Values and weights arrays must have the same length')
    }

    if (values.length === 0) {
      return DecimalHelpers.toDecimal(0)
    }

    // Calculate total weight
    const totalWeight = DecimalHelpers.sum(weights)

    if (DecimalHelpers.isZero(totalWeight)) {
      throw new Error('Total weight cannot be zero')
    }

    // Calculate weighted sum: Σ(value_i * weight_i)
    const weightedSum = values.reduce((sum, value, i) => {
      return sum.plus(value.times(weights[i]))
    }, DecimalHelpers.toDecimal(0))

    // Divide by total weight to get weighted average
    return weightedSum.dividedBy(totalWeight)
  }

  /**
   * Validate probabilities
   *
   * @param probabilities - Array of probabilities
   * @param format - Probability format ('percentage' = 0-100, 'decimal' = 0-1)
   * @param tolerance - Tolerance for sum check
   * @returns Validation result
   */
  static validateProbabilities(
    probabilities: number[],
    format: 'percentage' | 'decimal' = 'percentage',
    tolerance: number = 0.01
  ): ProbabilityValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for empty array
    if (probabilities.length === 0) {
      errors.push('No probabilities provided')
      return { valid: false, total: 0, errors, warnings, normalized: [] }
    }

    // Check for negative probabilities
    probabilities.forEach((p, i) => {
      if (p < 0) {
        errors.push(`Probability ${i + 1} is negative: ${p}`)
      }
    })

    // Calculate total
    const total = probabilities.reduce((sum, p) => sum + p, 0)

    // Check if total is within expected range
    const expectedTotal = format === 'percentage' ? 100 : 1
    const diff = Math.abs(total - expectedTotal)

    if (diff > tolerance * expectedTotal) {
      if (total === 0) {
        errors.push('Total probability is zero')
      } else if (diff > 0.1 * expectedTotal) {
        // More than 10% off
        errors.push(
          `Total probability is ${format === 'percentage' ? total.toFixed(1) + '%' : total.toFixed(3)}, expected ${expectedTotal}${format === 'percentage' ? '%' : ''}`
        )
      } else {
        warnings.push(
          `Total probability is slightly off: ${format === 'percentage' ? total.toFixed(1) + '%' : total.toFixed(3)}, expected ${expectedTotal}${format === 'percentage' ? '%' : ''}`
        )
      }
    }

    // Check for probabilities that are too high
    const maxAllowed = format === 'percentage' ? 100 : 1
    probabilities.forEach((p, i) => {
      if (p > maxAllowed) {
        errors.push(
          `Probability ${i + 1} exceeds maximum: ${p}${format === 'percentage' ? '%' : ''}`
        )
      }
    })

    // Normalize probabilities (scale to sum to 1)
    const normalized =
      total > 0
        ? probabilities.map((p) => (format === 'percentage' ? p / total / 100 : p / total))
        : []

    return {
      valid: errors.length === 0,
      total,
      errors,
      warnings,
      normalized,
    }
  }

  /**
   * Normalize probabilities to sum to 100% (or 1)
   *
   * @param probabilities - Array of probabilities
   * @param format - Target format
   * @returns Normalized probabilities
   */
  static normalizeProbabilities(
    probabilities: number[],
    format: 'percentage' | 'decimal' = 'percentage'
  ): number[] {
    const total = probabilities.reduce((sum, p) => sum + p, 0)

    if (total === 0) {
      // If all are zero, distribute equally
      const equal = format === 'percentage' ? 100 / probabilities.length : 1 / probabilities.length
      return probabilities.map(() => equal)
    }

    // Scale to sum to expected total
    const targetSum = format === 'percentage' ? 100 : 1
    return probabilities.map((p) => (p / total) * targetSum)
  }

  /**
   * Convert between percentage and decimal formats
   *
   * @param probabilities - Array of probabilities
   * @param from - Source format
   * @param to - Target format
   * @returns Converted probabilities
   */
  static convertFormat(
    probabilities: number[],
    from: 'percentage' | 'decimal',
    to: 'percentage' | 'decimal'
  ): number[] {
    if (from === to) {
      return probabilities
    }

    if (from === 'percentage' && to === 'decimal') {
      return probabilities.map((p) => p / 100)
    }

    // from === 'decimal' && to === 'percentage'
    return probabilities.map((p) => p * 100)
  }

  /**
   * Calculate expected value (mean) from probability distribution
   *
   * @param values - Possible values
   * @param probabilities - Associated probabilities (must sum to 1)
   * @returns Expected value
   */
  static calculateExpectedValue(values: number[], probabilities: number[]): number {
    if (values.length !== probabilities.length) {
      throw new Error('Values and probabilities must have the same length')
    }

    return values.reduce((sum, value, i) => sum + value * probabilities[i], 0)
  }

  /**
   * Calculate variance from probability distribution
   *
   * @param values - Possible values
   * @param probabilities - Associated probabilities (must sum to 1)
   * @returns Variance
   */
  static calculateVariance(values: number[], probabilities: number[]): number {
    if (values.length !== probabilities.length) {
      throw new Error('Values and probabilities must have the same length')
    }

    const mean = this.calculateExpectedValue(values, probabilities)

    return values.reduce((sum, value, i) => {
      const deviation = value - mean
      return sum + deviation * deviation * probabilities[i]
    }, 0)
  }

  /**
   * Calculate standard deviation from probability distribution
   *
   * @param values - Possible values
   * @param probabilities - Associated probabilities (must sum to 1)
   * @returns Standard deviation
   */
  static calculateStandardDeviation(values: number[], probabilities: number[]): number {
    return Math.sqrt(this.calculateVariance(values, probabilities))
  }

  /**
   * Calculate coefficient of variation (CV = σ / μ)
   *
   * Measures relative variability - useful for comparing distributions
   *
   * @param values - Possible values
   * @param probabilities - Associated probabilities (must sum to 1)
   * @returns Coefficient of variation
   */
  static calculateCoefficientOfVariation(values: number[], probabilities: number[]): number {
    const mean = this.calculateExpectedValue(values, probabilities)
    const stdDev = this.calculateStandardDeviation(values, probabilities)

    if (mean === 0) {
      throw new Error('Cannot calculate coefficient of variation when mean is zero')
    }

    return stdDev / mean
  }

  /**
   * Calculate percentile from probability distribution
   *
   * @param values - Possible values (must be sorted)
   * @param probabilities - Associated probabilities (must sum to 1)
   * @param percentile - Percentile to calculate (0-100)
   * @returns Value at the specified percentile
   */
  static calculatePercentile(
    values: number[],
    probabilities: number[],
    percentile: number
  ): number {
    if (values.length !== probabilities.length) {
      throw new Error('Values and probabilities must have the same length')
    }

    if (percentile < 0 || percentile > 100) {
      throw new Error('Percentile must be between 0 and 100')
    }

    // Calculate cumulative probabilities
    let cumulative = 0
    const target = percentile / 100

    for (let i = 0; i < values.length; i++) {
      cumulative += probabilities[i]
      if (cumulative >= target) {
        return values[i]
      }
    }

    // Shouldn't reach here if probabilities sum to 1
    return values[values.length - 1]
  }

  /**
   * Format probabilities for display
   *
   * @param probabilities - Array of probabilities
   * @param format - Display format
   * @param decimals - Number of decimal places
   * @returns Formatted string
   */
  static formatForDisplay(
    probabilities: number[],
    format: 'percentage' | 'decimal' = 'percentage',
    decimals: number = 1
  ): string[] {
    return probabilities.map((p) => {
      if (format === 'percentage') {
        return `${p.toFixed(decimals)}%`
      } else {
        return p.toFixed(decimals + 2)
      }
    })
  }

  /**
   * Auto-adjust probabilities when one changes
   *
   * Distributes the difference proportionally among the others
   *
   * @param probabilities - Current probabilities
   * @param changedIndex - Index of the changed probability
   * @param newValue - New value for the changed probability
   * @param format - Probability format
   * @returns Adjusted probabilities
   */
  static autoAdjustProbabilities(
    probabilities: number[],
    changedIndex: number,
    newValue: number,
    format: 'percentage' | 'decimal' = 'percentage'
  ): number[] {
    const targetSum = format === 'percentage' ? 100 : 1
    const result = [...probabilities]

    // Set the changed value
    result[changedIndex] = newValue

    // Calculate remaining sum
    const remaining = targetSum - newValue

    if (remaining < 0) {
      // New value exceeds target, set others to 0
      return result.map((_, i) => (i === changedIndex ? newValue : 0))
    }

    // Calculate current sum of others
    const othersSum = probabilities.reduce((sum, p, i) => {
      return i === changedIndex ? sum : sum + p
    }, 0)

    if (othersSum === 0) {
      // Distribute remaining equally among others
      const equalShare = remaining / (probabilities.length - 1)
      return result.map((_, i) => (i === changedIndex ? newValue : equalShare))
    }

    // Distribute proportionally
    return result.map((p, i) => {
      if (i === changedIndex) {
        return newValue
      }
      return (p / othersSum) * remaining
    })
  }
}
