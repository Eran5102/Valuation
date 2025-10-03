/**
 * Decimal Helper Utilities
 *
 * Provides high-precision decimal operations using decimal.js for financial calculations.
 * All monetary and share calculations use 28-digit precision to avoid floating-point errors.
 *
 * @module DecimalHelpers
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'

// Configure Decimal.js for high precision
Decimal.set({
  precision: 28, // 28 significant digits
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15, // Negative exponent limit
  toExpPos: 9e15, // Positive exponent limit
  maxE: 9e15,
  minE: -9e15,
})

/**
 * Decimal constants for common values
 */
export const DECIMAL_ZERO = new Decimal(0)
export const DECIMAL_ONE = new Decimal(1)
export const DECIMAL_HUNDRED = new Decimal(100)

/**
 * Tolerance for decimal comparisons (0.01 cents)
 */
export const DECIMAL_TOLERANCE = new Decimal(0.01)

/**
 * DecimalHelpers class
 *
 * Provides utility functions for decimal operations
 */
export class DecimalHelpers {
  /**
   * Safely converts a value to Decimal
   */
  static toDecimal(value: Decimal | number | string | null | undefined): Decimal {
    if (value === null || value === undefined) {
      return DECIMAL_ZERO
    }

    if (Decimal.isDecimal(value)) {
      return value
    }

    try {
      return new Decimal(value)
    } catch (error) {
      console.error(`Failed to convert ${value} to Decimal:`, error)
      return DECIMAL_ZERO
    }
  }

  /**
   * Checks if two decimals are equal within tolerance
   */
  static equals(a: Decimal, b: Decimal, tolerance: Decimal = DECIMAL_TOLERANCE): boolean {
    return a.minus(b).abs().lte(tolerance)
  }

  /**
   * Checks if decimal is effectively zero (within tolerance)
   */
  static isZero(value: Decimal, tolerance: Decimal = DECIMAL_TOLERANCE): boolean {
    return value.abs().lte(tolerance)
  }

  /**
   * Checks if decimal is positive (> tolerance)
   */
  static isPositive(value: Decimal, tolerance: Decimal = DECIMAL_TOLERANCE): boolean {
    return value.gt(tolerance)
  }

  /**
   * Checks if decimal is negative (< -tolerance)
   */
  static isNegative(value: Decimal, tolerance: Decimal = DECIMAL_TOLERANCE): boolean {
    return value.lt(tolerance.neg())
  }

  /**
   * Safely divides two decimals, returning zero if divisor is zero
   */
  static safeDivide(
    numerator: Decimal,
    denominator: Decimal,
    defaultValue: Decimal = DECIMAL_ZERO
  ): Decimal {
    if (this.isZero(denominator)) {
      return defaultValue
    }
    return numerator.dividedBy(denominator)
  }

  /**
   * Calculates percentage (value / total * 100)
   */
  static toPercentage(value: Decimal, total: Decimal): Decimal {
    if (this.isZero(total)) {
      return DECIMAL_ZERO
    }
    return value.dividedBy(total).times(DECIMAL_HUNDRED)
  }

  /**
   * Calculates decimal percentage (value / total, not multiplied by 100)
   */
  static toDecimalPercentage(value: Decimal, total: Decimal): Decimal {
    if (this.isZero(total)) {
      return DECIMAL_ZERO
    }
    return value.dividedBy(total)
  }

  /**
   * Rounds decimal to specified decimal places
   */
  static round(value: Decimal, decimalPlaces: number = 2): Decimal {
    return value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
  }

  /**
   * Clamps value between min and max
   */
  static clamp(value: Decimal, min: Decimal, max: Decimal): Decimal {
    if (value.lt(min)) return min
    if (value.gt(max)) return max
    return value
  }

  /**
   * Returns the minimum of multiple decimals
   */
  static min(...values: Decimal[]): Decimal {
    if (values.length === 0) return DECIMAL_ZERO
    return values.reduce((min, val) => (val.lt(min) ? val : min))
  }

  /**
   * Returns the maximum of multiple decimals
   */
  static max(...values: Decimal[]): Decimal {
    if (values.length === 0) return DECIMAL_ZERO
    return values.reduce((max, val) => (val.gt(max) ? val : max))
  }

  /**
   * Sums an array of decimals
   */
  static sum(values: Decimal[]): Decimal {
    return values.reduce((sum, val) => sum.plus(val), DECIMAL_ZERO)
  }

  /**
   * Calculates weighted average
   */
  static weightedAverage(values: Decimal[], weights: Decimal[]): Decimal {
    if (values.length !== weights.length) {
      throw new Error('Values and weights arrays must have same length')
    }

    if (values.length === 0) {
      return DECIMAL_ZERO
    }

    const totalWeight = this.sum(weights)
    if (this.isZero(totalWeight)) {
      return DECIMAL_ZERO
    }

    const weightedSum = values.reduce(
      (sum, val, idx) => sum.plus(val.times(weights[idx])),
      DECIMAL_ZERO
    )

    return weightedSum.dividedBy(totalWeight)
  }

  /**
   * Validates that decimal is valid and not NaN or Infinity
   */
  static isValid(value: Decimal): boolean {
    return value.isFinite() && !value.isNaN()
  }

  /**
   * Validates that decimal is non-negative
   */
  static isNonNegative(value: Decimal): boolean {
    return this.isValid(value) && value.gte(DECIMAL_ZERO)
  }

  /**
   * Formats decimal as currency string
   */
  static formatCurrency(value: Decimal, decimals: number = 2): string {
    return `$${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  /**
   * Formats decimal as number with commas
   */
  static formatNumber(value: Decimal, decimals: number = 0): string {
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  /**
   * Formats decimal as percentage
   */
  static formatPercentage(value: Decimal, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`
  }

  /**
   * Parses currency string to Decimal
   */
  static parseCurrency(value: string): Decimal {
    // Remove $, commas, and whitespace
    const cleaned = value.replace(/[$,\s]/g, '')
    return this.toDecimal(cleaned)
  }

  /**
   * Interpolate between two decimals
   * @param from Starting value
   * @param to Ending value
   * @param t Interpolation factor (0 to 1)
   */
  static lerp(from: Decimal, to: Decimal, t: Decimal): Decimal {
    // from + (to - from) * t
    return from.plus(to.minus(from).times(t))
  }

  /**
   * Calculate pro-rata share
   * @param totalAmount Total amount to distribute
   * @param participantShares Shares held by participant
   * @param totalShares Total shares participating
   */
  static calculateProRataShare(
    totalAmount: Decimal,
    participantShares: Decimal,
    totalShares: Decimal
  ): Decimal {
    if (this.isZero(totalShares)) {
      return DECIMAL_ZERO
    }
    return totalAmount.times(participantShares).dividedBy(totalShares)
  }

  /**
   * Calculate RVPS (Redemption Value Per Share)
   * @param totalValue Total value
   * @param totalShares Total shares
   */
  static calculateRVPS(totalValue: Decimal, totalShares: Decimal): Decimal {
    return this.safeDivide(totalValue, totalShares, DECIMAL_ZERO)
  }

  /**
   * Serialize Decimal to JSON-safe string
   */
  static serialize(value: Decimal): string {
    return value.toString()
  }

  /**
   * Deserialize string to Decimal
   */
  static deserialize(value: string): Decimal {
    return this.toDecimal(value)
  }

  /**
   * Create array of Decimals from array of numbers/strings
   */
  static toDecimalArray(values: (number | string | Decimal)[]): Decimal[] {
    return values.map((v) => this.toDecimal(v))
  }

  /**
   * Compare two decimals for sorting
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  static compare(a: Decimal, b: Decimal): -1 | 0 | 1 {
    if (a.lt(b)) return -1
    if (a.gt(b)) return 1
    return 0
  }

  /**
   * Calculate absolute value
   */
  static abs(value: Decimal): Decimal {
    return value.abs()
  }

  /**
   * Negate value
   */
  static negate(value: Decimal): Decimal {
    return value.neg()
  }

  /**
   * Calculate square root
   */
  static sqrt(value: Decimal): Decimal {
    if (value.isNegative()) {
      throw new Error('Cannot calculate square root of negative number')
    }
    return value.sqrt()
  }

  /**
   * Calculate power
   */
  static pow(base: Decimal, exponent: Decimal): Decimal {
    return base.pow(exponent)
  }

  /**
   * Natural logarithm
   */
  static ln(value: Decimal): Decimal {
    if (value.lte(DECIMAL_ZERO)) {
      throw new Error('Cannot calculate ln of non-positive number')
    }
    return value.ln()
  }

  /**
   * Exponential (e^x)
   */
  static exp(value: Decimal): Decimal {
    return value.exp()
  }

  /**
   * Floor to integer
   */
  static floor(value: Decimal): Decimal {
    return value.floor()
  }

  /**
   * Ceiling to integer
   */
  static ceil(value: Decimal): Decimal {
    return value.ceil()
  }

  /**
   * Check if value is integer
   */
  static isInteger(value: Decimal): boolean {
    return value.isInteger()
  }

  /**
   * Convert to number (use with caution - may lose precision)
   */
  static toNumber(value: Decimal): number {
    return value.toNumber()
  }

  /**
   * Convert to string with specified precision
   */
  static toString(value: Decimal, precision?: number): string {
    if (precision !== undefined) {
      return value.toFixed(precision)
    }
    return value.toString()
  }

  /**
   * Check if value exceeds safe integer range
   */
  static exceedsSafeInteger(value: Decimal): boolean {
    const num = value.toNumber()
    return num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER
  }

  /**
   * Calculate percentage change between two values
   * Returns decimal percentage (not multiplied by 100)
   */
  static percentageChange(oldValue: Decimal, newValue: Decimal): Decimal {
    if (this.isZero(oldValue)) {
      return DECIMAL_ZERO
    }
    return newValue.minus(oldValue).dividedBy(oldValue)
  }

  /**
   * Calculate compound interest
   * @param principal Initial amount
   * @param rate Interest rate (as decimal, e.g., 0.05 for 5%)
   * @param periods Number of compounding periods
   */
  static compoundInterest(principal: Decimal, rate: Decimal, periods: Decimal): Decimal {
    // A = P(1 + r)^n
    return principal.times(DECIMAL_ONE.plus(rate).pow(periods))
  }

  /**
   * Find value that satisfies condition using binary search
   * @param min Minimum value
   * @param max Maximum value
   * @param targetFn Function that returns target value for input
   * @param target Target value to find
   * @param tolerance Acceptable error
   * @param maxIterations Maximum iterations
   */
  static binarySearch(
    min: Decimal,
    max: Decimal,
    targetFn: (x: Decimal) => Decimal,
    target: Decimal,
    tolerance: Decimal = DECIMAL_TOLERANCE,
    maxIterations: number = 100
  ): Decimal | null {
    let iteration = 0

    while (iteration < maxIterations) {
      const mid = min.plus(max).dividedBy(2)
      const result = targetFn(mid)
      const error = result.minus(target).abs()

      if (error.lte(tolerance)) {
        return mid
      }

      if (result.lt(target)) {
        min = mid
      } else {
        max = mid
      }

      iteration++
    }

    return null // Failed to converge
  }
}
