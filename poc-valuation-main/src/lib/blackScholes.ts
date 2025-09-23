/**
 * Cumulative Standard Normal Distribution function
 * @param x - Input value
 * @returns Probability that a standard normal random variable will be less than or equal to x
 */
function CNDF(x: number): number {
  // Using an approximation of the error function (erf)
  // CNDF(x) = 0.5 * (1 + erf(x / sqrt(2)))

  // Implementation of error function approximation
  // This is a highly accurate approximation of erf
  const sign = x >= 0 ? 1 : -1
  const absX = Math.abs(x)

  // Constants for the approximation
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  // Formula using Abramowitz and Stegun 7.1.26
  const t = 1.0 / (1.0 + (p * absX) / Math.sqrt(2))
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-absX * absX) / 2)

  return 0.5 * (1 + sign * y)
}

/**
 * Calculates the Black-Scholes Call Option Price
 * @param S - Current underlying asset price (Total Equity Value)
 * @param K - Strike price (Breakpoint)
 * @param T - Time to expiration (in years)
 * @param r - Risk-free interest rate (annualized, e.g., 0.02 for 2%)
 * @param v - Volatility of the underlying asset (annualized, e.g., 0.3 for 30%)
 * @returns Call option price
 */
export function blackScholesCall(S: number, K: number, T: number, r: number, v: number): number {
  if (v <= 0 || T <= 0) {
    // If volatility or time is zero, the option value is intrinsic value max(0, S-K)
    return Math.max(0, S - K)
  }

  if (S <= 0) {
    return 0 // If equity value is zero, option value is zero
  }

  const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T))
  const d2 = d1 - v * Math.sqrt(T)

  const callPrice = S * CNDF(d1) - K * Math.exp(-r * T) * CNDF(d2)

  return callPrice
}

/**
 * Calculates the Black-Scholes Put Option Price
 * @param S - Current underlying asset price (Total Equity Value)
 * @param K - Strike price (Breakpoint)
 * @param T - Time to expiration (in years)
 * @param r - Risk-free interest rate (annualized, e.g., 0.02 for 2%)
 * @param v - Volatility of the underlying asset (annualized, e.g., 0.3 for 30%)
 * @returns Put option price
 */
export function blackScholesPut(S: number, K: number, T: number, r: number, v: number): number {
  if (v <= 0 || T <= 0) {
    return Math.max(0, K - S)
  }

  if (S <= 0) {
    return K // If equity value is zero, put option is worth the strike price
  }

  const d1 = (Math.log(S / K) + (r + (v * v) / 2) * T) / (v * Math.sqrt(T))
  const d2 = d1 - v * Math.sqrt(T)

  const putPrice = K * Math.exp(-r * T) * CNDF(-d2) - S * CNDF(-d1)

  return putPrice
}

/**
 * Calculates implied volatility using a numerical approximation (Newton-Raphson method)
 * @param optionPrice - Market price of the option
 * @param S - Current underlying asset price
 * @param K - Strike price
 * @param T - Time to expiration (in years)
 * @param r - Risk-free interest rate (annualized)
 * @param isCall - True for call option, false for put option
 * @param maxIterations - Maximum number of iterations (default: 100)
 * @param precision - Desired precision (default: 0.00001)
 * @returns Implied volatility or null if it doesn't converge
 */
export function calculateImpliedVolatility(
  optionPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  isCall: boolean = true,
  maxIterations: number = 100,
  precision: number = 0.00001
): number | null {
  // Initial guess for volatility
  let volatility = 0.3 // Starting with 30%

  for (let i = 0; i < maxIterations; i++) {
    // Calculate option price with current volatility estimate
    const price = isCall
      ? blackScholesCall(S, K, T, r, volatility)
      : blackScholesPut(S, K, T, r, volatility)

    // Calculate price difference
    const diff = optionPrice - price

    // If we're within precision, return the current volatility
    if (Math.abs(diff) < precision) {
      return volatility
    }

    // Calculate Vega (derivative of price with respect to volatility)
    // Using an approximation for vega
    const h = 0.0001 // Small increment
    const vega = isCall
      ? (blackScholesCall(S, K, T, r, volatility + h) - price) / h
      : (blackScholesPut(S, K, T, r, volatility + h) - price) / h

    // If vega is too small, we can't reliably update volatility
    if (Math.abs(vega) < 1e-8) {
      break
    }

    // Update volatility estimate using Newton-Raphson
    const newVolatility = volatility + diff / vega

    // Ensure volatility stays in reasonable bounds (0.001 to 5.0 or 0.1% to 500%)
    if (newVolatility <= 0.001 || newVolatility > 5.0) {
      break
    }

    volatility = newVolatility
  }

  // If we didn't converge, return null
  return null
}
