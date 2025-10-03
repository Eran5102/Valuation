/**
 * Black-Scholes Calculator
 *
 * Shared implementation of the Black-Scholes option pricing formula.
 * Used across OPM backsolve, DLOM models, and any other option valuation needs.
 *
 * Formula:
 * C = S * e^(-q*T) * N(d1) - K * e^(-r*T) * N(d2)
 *
 * Where:
 * - C = Call option value
 * - S = Current stock price (company value)
 * - K = Strike price (exercise price)
 * - T = Time to expiration (years)
 * - r = Risk-free rate
 * - σ (sigma) = Volatility
 * - q = Dividend yield
 * - N(x) = Cumulative standard normal distribution
 *
 * @module BlackScholesCalculator
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'
import { DecimalHelpers } from '../../comprehensiveBreakpoints/v3/utilities/DecimalHelpers'

// Configure Decimal for high precision financial calculations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Black-Scholes input parameters
 */
export interface BlackScholesParams {
  /** Current company/stock value (S) */
  companyValue: number

  /** Strike/exercise price (K) */
  strikePrice: number

  /** Time to expiration in years (T) */
  timeToExpiration: number

  /** Annualized volatility as decimal (σ) - e.g., 0.60 for 60% */
  volatility: number

  /** Risk-free rate as decimal (r) - e.g., 0.045 for 4.5% */
  riskFreeRate: number

  /** Dividend yield as decimal (q) - e.g., 0 for no dividends */
  dividendYield?: number
}

/**
 * Black-Scholes calculation result
 */
export interface BlackScholesResult {
  /** Call option value */
  callValue: number

  /** d1 parameter (used in N(d1)) */
  d1: number

  /** d2 parameter (used in N(d2)) */
  d2: number

  /** N(d1) - Cumulative normal distribution of d1 */
  Nd1: number

  /** N(d2) - Cumulative normal distribution of d2 */
  Nd2: number

  /** Calculation metadata */
  metadata: {
    companyValue: number
    strikePrice: number
    timeToExpiration: number
    volatility: number
    riskFreeRate: number
    dividendYield: number
  }
}

/**
 * BlackScholesCalculator
 *
 * Provides Black-Scholes option pricing calculations
 */
export class BlackScholesCalculator {
  /**
   * Calculate Black-Scholes call option value
   *
   * @param params - Black-Scholes parameters
   * @returns Calculation result with call value and intermediate values
   *
   * @example
   * ```typescript
   * const result = BlackScholesCalculator.calculateCall({
   *   companyValue: 10000000,  // $10M company value
   *   strikePrice: 5000000,    // $5M breakpoint
   *   timeToExpiration: 3,     // 3 years
   *   volatility: 0.60,        // 60% volatility
   *   riskFreeRate: 0.045,     // 4.5% risk-free rate
   *   dividendYield: 0,        // No dividends
   * })
   * // result.callValue = calculated option value
   * ```
   */
  static calculateCall(params: BlackScholesParams): BlackScholesResult {
    const {
      companyValue: S,
      strikePrice: K,
      timeToExpiration: T,
      volatility: sigma,
      riskFreeRate: r,
      dividendYield: q = 0,
    } = params

    // Validate parameters
    this.validateParams(params)

    // Handle edge case: strike price is 0 or negative
    if (K <= 0) {
      // If strike is 0, option value equals stock price
      return {
        callValue: S,
        d1: 0,
        d2: 0,
        Nd1: 1,
        Nd2: 1,
        metadata: {
          companyValue: S,
          strikePrice: K,
          timeToExpiration: T,
          volatility: sigma,
          riskFreeRate: r,
          dividendYield: q,
        },
      }
    }

    // Calculate d1 and d2
    const sqrtT = Math.sqrt(T)
    const d1 = (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / (sigma * sqrtT)
    const d2 = d1 - sigma * sqrtT

    // Calculate cumulative normal distributions
    const Nd1 = this.normalCDF(d1)
    const Nd2 = this.normalCDF(d2)

    // Calculate call option value
    // C = S * e^(-q*T) * N(d1) - K * e^(-r*T) * N(d2)
    const callValue = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2

    return {
      callValue: Math.max(0, callValue), // Option value cannot be negative
      d1: this.roundToDecimalPlaces(d1, 4),
      d2: this.roundToDecimalPlaces(d2, 4),
      Nd1: this.roundToDecimalPlaces(Nd1, 6),
      Nd2: this.roundToDecimalPlaces(Nd2, 6),
      metadata: {
        companyValue: S,
        strikePrice: K,
        timeToExpiration: T,
        volatility: sigma,
        riskFreeRate: r,
        dividendYield: q,
      },
    }
  }

  /**
   * Calculate cumulative normal distribution function N(x)
   *
   * Uses approximation formula with high accuracy (error < 7.5e-8)
   *
   * @param x - Input value
   * @returns Cumulative probability P(X ≤ x) for standard normal distribution
   */
  static normalCDF(x: number): number {
    // Constants for approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(x))
    const d = 0.3989423 * Math.exp((-x * x) / 2)

    // Polynomial coefficients
    const a1 = 0.31938153
    const a2 = -0.356563782
    const a3 = 1.781477937
    const a4 = -1.821255978
    const a5 = 1.330274429

    // Calculate CDF
    const cdf = 1 - d * t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))))

    // Handle negative values
    return x < 0 ? 1 - cdf : cdf
  }

  /**
   * Calculate probability density function (PDF) of standard normal distribution
   *
   * φ(x) = (1 / √(2π)) * e^(-x²/2)
   *
   * @param x - Input value
   * @returns Probability density at x
   */
  static normalPDF(x: number): number {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp((-x * x) / 2)
  }

  /**
   * Calculate Black-Scholes Greeks
   *
   * Greeks measure sensitivity of option value to changes in parameters
   *
   * @param params - Black-Scholes parameters
   * @returns Greeks (Delta, Gamma, Vega, Theta, Rho)
   */
  static calculateGreeks(params: BlackScholesParams): {
    delta: number // ∂C/∂S - Change in option value per $1 change in stock price
    gamma: number // ∂²C/∂S² - Rate of change of delta
    vega: number // ∂C/∂σ - Change in option value per 1% change in volatility
    theta: number // ∂C/∂T - Time decay (per day)
    rho: number // ∂C/∂r - Change in option value per 1% change in interest rate
  } {
    const {
      companyValue: S,
      strikePrice: K,
      timeToExpiration: T,
      volatility: sigma,
      riskFreeRate: r,
      dividendYield: q = 0,
    } = params

    const sqrtT = Math.sqrt(T)
    const d1 = (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / (sigma * sqrtT)
    const d2 = d1 - sigma * sqrtT

    const Nd1 = this.normalCDF(d1)
    const Nd2 = this.normalCDF(d2)
    const nd1 = this.normalPDF(d1) // PDF of d1

    // Delta: ∂C/∂S
    const delta = Math.exp(-q * T) * Nd1

    // Gamma: ∂²C/∂S²
    const gamma = (Math.exp(-q * T) * nd1) / (S * sigma * sqrtT)

    // Vega: ∂C/∂σ (per 1% change in volatility)
    const vega = (S * Math.exp(-q * T) * nd1 * sqrtT) / 100

    // Theta: ∂C/∂T (per day, so divide by 365)
    const theta =
      (-(S * Math.exp(-q * T) * nd1 * sigma) / (2 * sqrtT) -
        r * K * Math.exp(-r * T) * Nd2 +
        q * S * Math.exp(-q * T) * Nd1) /
      365

    // Rho: ∂C/∂r (per 1% change in interest rate)
    const rho = (K * T * Math.exp(-r * T) * Nd2) / 100

    return {
      delta: this.roundToDecimalPlaces(delta, 4),
      gamma: this.roundToDecimalPlaces(gamma, 6),
      vega: this.roundToDecimalPlaces(vega, 2),
      theta: this.roundToDecimalPlaces(theta, 2),
      rho: this.roundToDecimalPlaces(rho, 2),
    }
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   *
   * Given a market price, find the volatility that produces that price
   *
   * @param marketPrice - Observed option price
   * @param params - Black-Scholes parameters (volatility will be ignored)
   * @param tolerance - Convergence tolerance
   * @param maxIterations - Maximum iterations
   * @returns Implied volatility or null if failed to converge
   */
  static calculateImpliedVolatility(
    marketPrice: number,
    params: BlackScholesParams,
    tolerance: number = 0.0001,
    maxIterations: number = 100
  ): number | null {
    // Initial guess: 50% volatility
    let sigma = 0.5

    for (let i = 0; i < maxIterations; i++) {
      // Calculate option value with current volatility guess
      const result = this.calculateCall({ ...params, volatility: sigma })
      const priceDiff = result.callValue - marketPrice

      // Check convergence
      if (Math.abs(priceDiff) < tolerance) {
        return this.roundToDecimalPlaces(sigma, 4)
      }

      // Calculate vega for Newton-Raphson step
      const {
        companyValue: S,
        strikePrice: K,
        timeToExpiration: T,
        riskFreeRate: r,
        dividendYield: q = 0,
      } = params
      const sqrtT = Math.sqrt(T)
      const d1 = (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / (sigma * sqrtT)
      const nd1 = this.normalPDF(d1)
      const vega = S * Math.exp(-q * T) * nd1 * sqrtT

      // Avoid division by zero
      if (vega < 1e-10) {
        return null // Failed to converge
      }

      // Newton-Raphson update: σ_new = σ_old - f(σ) / f'(σ)
      sigma = sigma - priceDiff / vega

      // Ensure volatility stays positive and reasonable
      sigma = Math.max(0.01, Math.min(5.0, sigma))
    }

    // Failed to converge
    return null
  }

  /**
   * Validate Black-Scholes parameters
   *
   * @param params - Parameters to validate
   * @throws Error if parameters are invalid
   */
  private static validateParams(params: BlackScholesParams): void {
    const {
      companyValue,
      strikePrice,
      timeToExpiration,
      volatility,
      riskFreeRate,
      dividendYield = 0,
    } = params

    if (companyValue <= 0) {
      throw new Error(`Company value must be positive, got ${companyValue}`)
    }

    if (strikePrice < 0) {
      throw new Error(`Strike price cannot be negative, got ${strikePrice}`)
    }

    if (timeToExpiration <= 0) {
      throw new Error(`Time to expiration must be positive, got ${timeToExpiration}`)
    }

    if (volatility <= 0) {
      throw new Error(`Volatility must be positive, got ${volatility}`)
    }

    if (riskFreeRate < 0) {
      throw new Error(`Risk-free rate cannot be negative, got ${riskFreeRate}`)
    }

    if (dividendYield < 0) {
      throw new Error(`Dividend yield cannot be negative, got ${dividendYield}`)
    }

    // Reasonable bounds warnings (not errors)
    if (volatility > 3.0) {
      console.warn(`Volatility is very high: ${(volatility * 100).toFixed(1)}% (> 300%)`)
    }

    if (timeToExpiration > 10) {
      console.warn(
        `Time to expiration is very long: ${timeToExpiration.toFixed(1)} years (> 10 years)`
      )
    }
  }

  /**
   * Round number to specified decimal places
   */
  private static roundToDecimalPlaces(value: number, places: number): number {
    const multiplier = Math.pow(10, places)
    return Math.round(value * multiplier) / multiplier
  }

  /**
   * Format Black-Scholes result for display
   *
   * @param result - Calculation result
   * @returns Human-readable string
   */
  static formatResult(result: BlackScholesResult): string {
    return `Call Value: $${result.callValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, d1: ${result.d1.toFixed(4)}, d2: ${result.d2.toFixed(4)}`
  }
}
