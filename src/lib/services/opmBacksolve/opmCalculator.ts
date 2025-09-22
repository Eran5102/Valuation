/**
 * OPM (Option Pricing Model) Backsolve Calculator
 * Implements Black-Scholes formula for valuing equity securities
 * using breakpoint analysis data
 */

import Decimal from 'decimal.js'

// Configure Decimal for high precision financial calculations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Black-Scholes parameters
 */
export interface BlackScholesParams {
  companyValue: number // Current company value (S)
  volatility: number // Annualized volatility (σ) as decimal (e.g., 0.60 for 60%)
  riskFreeRate: number // Risk-free rate as decimal (e.g., 0.045 for 4.5%)
  timeToLiquidity: number // Time to liquidity event in years (T)
  dividendYield: number // Dividend yield as decimal (default 0)
}

/**
 * Breakpoint data from the analyzer
 */
export interface BreakpointData {
  id: number
  breakpointType: string
  fromValue: number // Exercise price (K)
  toValue: number
  participatingSecurities: Array<{
    name: string
    sharesOutstanding: number
    participationPercentage: number
  }>
}

/**
 * OPM calculation result for a single breakpoint
 */
export interface OPMBreakpointResult {
  breakpointId: number
  exercisePrice: number
  toValue: number
  d1: number
  d2: number
  callOptionValue: number
  incrementalValue: number
  securityAllocations: Array<{
    name: string
    shares: number
    participationPercentage: number
    dollarAllocation: number
    perShareValue: number
  }>
}

/**
 * Complete OPM analysis result
 */
export interface OPMAnalysisResult {
  parameters: BlackScholesParams
  totalEquityValue: number
  breakpointResults: OPMBreakpointResult[]
  securitySummary: Array<{
    name: string
    totalValue: number
    totalShares: number
    averagePerShareValue: number
  }>
}

/**
 * Calculate the cumulative normal distribution function
 * Using approximation for N(x)
 */
function normSDist(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const a1 = 0.31938153
  const a2 = -0.356563782
  const a3 = 1.781477937
  const a4 = -1.821255978
  const a5 = 1.330274429

  const cdf = 1 - d * t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))))

  return x < 0 ? 1 - cdf : cdf
}

/**
 * Calculate Black-Scholes call option value
 */
function calculateBlackScholesCall(
  S: number, // Stock price
  K: number, // Strike price
  T: number, // Time to maturity
  r: number, // Risk-free rate
  σ: number, // Volatility
  q: number = 0 // Dividend yield
): { value: number; d1: number; d2: number } {
  if (K <= 0) {
    // If strike price is 0 or negative, option value equals stock price
    return { value: S, d1: 0, d2: 0 }
  }

  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r - q + (σ * σ) / 2) * T) / (σ * sqrtT)
  const d2 = d1 - σ * sqrtT

  const Nd1 = normSDist(d1)
  const Nd2 = normSDist(d2)

  const value = S * Math.exp(-q * T) * Nd1 - K * Math.exp(-r * T) * Nd2

  return {
    value: Math.max(0, value),
    d1: Math.round(d1 * 100) / 100, // Round to 2 decimal places for display
    d2: Math.round(d2 * 100) / 100,
  }
}

/**
 * Main OPM Calculator class
 */
export class OPMCalculator {
  private params: BlackScholesParams
  private breakpoints: BreakpointData[]

  constructor(params: BlackScholesParams, breakpoints: BreakpointData[]) {
    this.params = params
    this.breakpoints = breakpoints.sort((a, b) => a.fromValue - b.fromValue)
  }

  /**
   * Perform complete OPM analysis
   */
  public analyze(): OPMAnalysisResult {
    const breakpointResults: OPMBreakpointResult[] = []
    let previousCallValue = 0

    // Calculate call option value for each breakpoint
    for (let i = 0; i < this.breakpoints.length; i++) {
      const bp = this.breakpoints[i]

      // Calculate Black-Scholes value at this strike price
      const bsResult = calculateBlackScholesCall(
        this.params.companyValue,
        bp.fromValue,
        this.params.timeToLiquidity,
        this.params.riskFreeRate,
        this.params.volatility,
        this.params.dividendYield
      )

      // Calculate incremental value (this segment's value)
      const incrementalValue = i === 0 ? bsResult.value : bsResult.value - previousCallValue

      // Allocate value to participating securities
      const securityAllocations = bp.participatingSecurities.map((sec) => {
        const allocation = incrementalValue * (sec.participationPercentage / 100)
        return {
          name: sec.name,
          shares: sec.sharesOutstanding,
          participationPercentage: sec.participationPercentage,
          dollarAllocation: allocation,
          perShareValue: sec.sharesOutstanding > 0 ? allocation / sec.sharesOutstanding : 0,
        }
      })

      breakpointResults.push({
        breakpointId: bp.id,
        exercisePrice: bp.fromValue,
        toValue: bp.toValue,
        d1: bsResult.d1,
        d2: bsResult.d2,
        callOptionValue: bsResult.value,
        incrementalValue,
        securityAllocations,
      })

      previousCallValue = bsResult.value
    }

    // Calculate summary by security
    const securityMap = new Map<string, { totalValue: number; totalShares: number }>()

    breakpointResults.forEach((result) => {
      result.securityAllocations.forEach((alloc) => {
        const existing = securityMap.get(alloc.name) || { totalValue: 0, totalShares: alloc.shares }
        existing.totalValue += alloc.dollarAllocation
        securityMap.set(alloc.name, existing)
      })
    })

    const securitySummary = Array.from(securityMap.entries()).map(([name, data]) => ({
      name,
      totalValue: data.totalValue,
      totalShares: data.totalShares,
      averagePerShareValue: data.totalShares > 0 ? data.totalValue / data.totalShares : 0,
    }))

    // Calculate total equity value
    const totalEquityValue =
      breakpointResults.length > 0
        ? breakpointResults[breakpointResults.length - 1].callOptionValue
        : 0

    return {
      parameters: this.params,
      totalEquityValue,
      breakpointResults,
      securitySummary,
    }
  }

  /**
   * Update parameters and recalculate
   */
  public updateParameters(params: Partial<BlackScholesParams>): OPMAnalysisResult {
    this.params = { ...this.params, ...params }
    return this.analyze()
  }
}

/**
 * Helper function to format currency values
 */
export function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Helper function to format percentage values
 */
export function formatPercentageValue(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}
