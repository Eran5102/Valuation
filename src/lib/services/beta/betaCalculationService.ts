import { format, subYears, parseISO } from 'date-fns'

interface PriceData {
  date: string
  close: number
  adjustedClose?: number
}

interface BetaCalculationResult {
  beta: number
  correlation: number
  rSquared: number
  standardError: number
  observations: number
  period: string
  startDate: string
  endDate: string
  companyReturns: number[]
  marketReturns: number[]
}

interface LeverageData {
  debtToEquity: number
  taxRate: number
}

/**
 * Calculate returns from price data
 */
function calculateReturns(prices: PriceData[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    const currentPrice = prices[i].adjustedClose || prices[i].close
    const previousPrice = prices[i - 1].adjustedClose || prices[i - 1].close
    const returnValue = Math.log(currentPrice / previousPrice)
    returns.push(returnValue)
  }
  return returns
}

/**
 * Calculate beta coefficient using regression
 */
function calculateBetaRegression(
  companyReturns: number[],
  marketReturns: number[]
): {
  beta: number
  correlation: number
  rSquared: number
  standardError: number
} {
  if (companyReturns.length !== marketReturns.length) {
    throw new Error('Company and market returns must have the same length')
  }

  const n = companyReturns.length
  if (n < 2) {
    throw new Error('Insufficient data points for beta calculation')
  }

  // Calculate means
  const meanCompany = companyReturns.reduce((sum, r) => sum + r, 0) / n
  const meanMarket = marketReturns.reduce((sum, r) => sum + r, 0) / n

  // Calculate covariance and variance
  let covariance = 0
  let marketVariance = 0
  let companyVariance = 0

  for (let i = 0; i < n; i++) {
    const companyDev = companyReturns[i] - meanCompany
    const marketDev = marketReturns[i] - meanMarket
    covariance += companyDev * marketDev
    marketVariance += marketDev * marketDev
    companyVariance += companyDev * companyDev
  }

  covariance /= n - 1
  marketVariance /= n - 1
  companyVariance /= n - 1

  // Calculate beta
  const beta = covariance / marketVariance

  // Calculate correlation
  const correlation = covariance / (Math.sqrt(companyVariance) * Math.sqrt(marketVariance))
  const rSquared = correlation * correlation

  // Calculate standard error
  let sumSquaredResiduals = 0
  for (let i = 0; i < n; i++) {
    const predicted = beta * marketReturns[i]
    const residual = companyReturns[i] - predicted
    sumSquaredResiduals += residual * residual
  }
  const standardError = Math.sqrt(sumSquaredResiduals / (n - 2))

  return {
    beta,
    correlation,
    rSquared,
    standardError,
  }
}

/**
 * Calculate unlevered beta (asset beta)
 * Unlevered Beta = Levered Beta / [1 + ((1 - Tax Rate) * (Debt/Equity))]
 */
export function unleverBeta(leveredBeta: number, debtToEquity: number, taxRate: number): number {
  return leveredBeta / (1 + (1 - taxRate) * debtToEquity)
}

/**
 * Calculate levered beta from unlevered beta
 * Levered Beta = Unlevered Beta * [1 + ((1 - Tax Rate) * (Debt/Equity))]
 */
export function releverBeta(unleveredBeta: number, debtToEquity: number, taxRate: number): number {
  return unleveredBeta * (1 + (1 - taxRate) * debtToEquity)
}

/**
 * Adjust raw beta using Blume adjustment
 * Adjusted Beta = (2/3) * Raw Beta + (1/3) * 1.0
 */
export function adjustBeta(rawBeta: number): number {
  return (2 / 3) * rawBeta + (1 / 3) * 1.0
}

/**
 * Calculate beta for a company against a market index
 */
export async function calculateBeta(
  companyPrices: PriceData[],
  marketPrices: PriceData[],
  valuationDate: string,
  periodYears: number = 2
): Promise<BetaCalculationResult> {
  // Parse valuation date and calculate start date
  const endDate = parseISO(valuationDate)
  const startDate = subYears(endDate, periodYears)

  // Filter prices to the specified period
  const filterByDate = (prices: PriceData[]) => {
    return prices
      .filter((p) => {
        const date = parseISO(p.date)
        return date >= startDate && date <= endDate
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const filteredCompanyPrices = filterByDate(companyPrices)
  const filteredMarketPrices = filterByDate(marketPrices)

  // Align dates between company and market
  const alignedData = alignPriceData(filteredCompanyPrices, filteredMarketPrices)

  if (alignedData.company.length < 20) {
    throw new Error(
      `Insufficient data points for beta calculation. Found ${alignedData.company.length} matching dates.`
    )
  }

  // Calculate returns
  const companyReturns = calculateReturns(alignedData.company)
  const marketReturns = calculateReturns(alignedData.market)

  // Calculate beta and statistics
  const stats = calculateBetaRegression(companyReturns, marketReturns)

  return {
    ...stats,
    observations: companyReturns.length,
    period: `${periodYears}Y`,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    companyReturns,
    marketReturns,
  }
}

/**
 * Align price data between company and market to ensure matching dates
 */
function alignPriceData(
  companyPrices: PriceData[],
  marketPrices: PriceData[]
): { company: PriceData[]; market: PriceData[] } {
  const marketMap = new Map(marketPrices.map((p) => [p.date, p]))
  const alignedCompany: PriceData[] = []
  const alignedMarket: PriceData[] = []

  for (const companyPrice of companyPrices) {
    const marketPrice = marketMap.get(companyPrice.date)
    if (marketPrice) {
      alignedCompany.push(companyPrice)
      alignedMarket.push(marketPrice)
    }
  }

  return { company: alignedCompany, market: alignedMarket }
}

/**
 * Calculate industry beta from peer companies
 */
export function calculateIndustryBeta(peerBetas: Array<{ beta: number; marketCap: number }>): {
  simpleAverage: number
  weightedAverage: number
  median: number
} {
  if (peerBetas.length === 0) {
    throw new Error('No peer companies provided')
  }

  // Simple average
  const simpleAverage = peerBetas.reduce((sum, p) => sum + p.beta, 0) / peerBetas.length

  // Market cap weighted average
  const totalMarketCap = peerBetas.reduce((sum, p) => sum + p.marketCap, 0)
  const weightedAverage = peerBetas.reduce((sum, p) => {
    return sum + p.beta * (p.marketCap / totalMarketCap)
  }, 0)

  // Median
  const sortedBetas = [...peerBetas].sort((a, b) => a.beta - b.beta)
  const median =
    sortedBetas.length % 2 === 0
      ? (sortedBetas[sortedBetas.length / 2 - 1].beta + sortedBetas[sortedBetas.length / 2].beta) /
        2
      : sortedBetas[Math.floor(sortedBetas.length / 2)].beta

  return {
    simpleAverage,
    weightedAverage,
    median,
  }
}

/**
 * Calculate rolling beta over time
 */
export async function calculateRollingBeta(
  companyPrices: PriceData[],
  marketPrices: PriceData[],
  windowDays: number = 252, // 1 year of trading days
  stepDays: number = 21 // Monthly steps (approximately)
): Promise<Array<{ date: string; beta: number; rSquared: number }>> {
  const results: Array<{ date: string; beta: number; rSquared: number }> = []

  // Align all price data first
  const alignedData = alignPriceData(companyPrices, marketPrices)

  for (let i = windowDays; i < alignedData.company.length; i += stepDays) {
    const windowCompany = alignedData.company.slice(i - windowDays, i)
    const windowMarket = alignedData.market.slice(i - windowDays, i)

    const companyReturns = calculateReturns(windowCompany)
    const marketReturns = calculateReturns(windowMarket)

    const stats = calculateBetaRegression(companyReturns, marketReturns)

    results.push({
      date: alignedData.company[i - 1].date,
      beta: stats.beta,
      rSquared: stats.rSquared,
    })
  }

  return results
}

/**
 * Calculate confidence interval for beta
 */
export function calculateBetaConfidenceInterval(
  beta: number,
  standardError: number,
  observations: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // T-distribution critical value approximation for 95% confidence
  // For large samples (n > 30), this approaches 1.96
  const tCritical = observations > 30 ? 1.96 : 2.0

  const marginOfError = tCritical * standardError

  return {
    lower: beta - marginOfError,
    upper: beta + marginOfError,
  }
}
