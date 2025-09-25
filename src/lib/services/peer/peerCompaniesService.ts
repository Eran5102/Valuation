interface CompanyFundamentals {
  ticker: string
  name: string
  sector: string
  industry: string
  marketCap: number
  enterpriseValue: number
  revenue: number
  ebitda: number
  netIncome: number
  totalDebt: number
  cash: number
  totalEquity: number
  sharesOutstanding: number
  currentPrice: number
  beta?: number

  // Calculated metrics
  peRatio?: number
  evToRevenue?: number
  evToEbitda?: number
  debtToEquity?: number
  profitMargin?: number
  returnOnEquity?: number
}

interface PeerComparisonMetrics {
  company: CompanyFundamentals
  peers: CompanyFundamentals[]
  industryAverages: {
    peRatio: number
    evToRevenue: number
    evToEbitda: number
    beta: number
    debtToEquity: number
    profitMargin: number
    returnOnEquity: number
  }
  percentileRankings: {
    marketCap: number
    peRatio: number
    evToRevenue: number
    evToEbitda: number
    beta: number
    profitMargin: number
  }
}

interface AlphaVantageOverviewResponse {
  Symbol: string
  Name: string
  Description: string
  Sector: string
  Industry: string
  MarketCapitalization: string
  EBITDA: string
  PERatio: string
  BookValue: string
  DividendPerShare: string
  EPS: string
  Revenue: string // This might be RevenuePerShareTTM
  ProfitMargin: string
  OperatingMarginTTM: string
  ReturnOnAssetsTTM: string
  ReturnOnEquityTTM: string
  RevenueTTM: string
  GrossProfitTTM: string
  SharesOutstanding: string
  Beta: string
}

interface AlphaVantageIncomeStatement {
  fiscalDateEnding: string
  totalRevenue: string
  ebitda: string
  netIncome: string
}

interface AlphaVantageBalanceSheet {
  fiscalDateEnding: string
  totalShareholderEquity: string
  totalLiabilities: string
  longTermDebt: string
  shortTermDebt: string
}

/**
 * Fetch company fundamentals from Alpha Vantage
 */
export async function fetchCompanyFundamentals(
  ticker: string,
  apiKey: string
): Promise<CompanyFundamentals | null> {
  try {
    // Fetch overview data
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`
    const overviewResponse = await fetch(overviewUrl)
    const overview: AlphaVantageOverviewResponse = await overviewResponse.json()

    if (!overview.Symbol) {
      console.error(`No data found for ticker: ${ticker}`)
      return null
    }

    // Parse numeric values
    const marketCap = parseFloat(overview.MarketCapitalization) || 0
    const revenue = parseFloat(overview.RevenueTTM) || 0
    const ebitda = parseFloat(overview.EBITDA) || 0
    const sharesOutstanding = parseFloat(overview.SharesOutstanding) || 0
    // Beta should have a default value of 1.0 if not provided
    const beta = parseFloat(overview.Beta) || 1.0

    // Fetch additional data if needed
    const incomeStatementUrl = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`
    const incomeResponse = await fetch(incomeStatementUrl)
    const incomeData = await incomeResponse.json()

    const balanceSheetUrl = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`
    const balanceResponse = await fetch(balanceSheetUrl)
    const balanceData = await balanceResponse.json()

    // Get most recent data
    const latestIncome = incomeData.annualReports?.[0] || {}
    const latestBalance = balanceData.annualReports?.[0] || {}

    const netIncome = parseFloat(latestIncome.netIncome) || 0
    const totalEquity = parseFloat(latestBalance.totalShareholderEquity) || 0
    const longTermDebt = parseFloat(latestBalance.longTermDebt) || 0
    const shortTermDebt = parseFloat(latestBalance.shortTermDebt) || 0
    const totalDebt = longTermDebt + shortTermDebt

    // Try to get cash from balance sheet
    const cash = parseFloat(latestBalance.cashAndCashEquivalents) || 0

    // Calculate enterprise value
    const enterpriseValue = marketCap + totalDebt - cash

    // Get current price
    const priceUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
    const priceResponse = await fetch(priceUrl)
    const priceData = await priceResponse.json()
    const currentPrice = parseFloat(priceData['Global Quote']?.['05. price']) || 0

    // Calculate metrics
    const peRatio =
      currentPrice > 0 && parseFloat(overview.EPS) > 0
        ? currentPrice / parseFloat(overview.EPS)
        : undefined

    const evToRevenue = revenue > 0 ? enterpriseValue / revenue : undefined
    const evToEbitda = ebitda > 0 ? enterpriseValue / ebitda : undefined
    const debtToEquity = totalEquity > 0 ? totalDebt / totalEquity : undefined
    const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : undefined
    const returnOnEquity = totalEquity > 0 ? (netIncome / totalEquity) * 100 : undefined

    return {
      ticker: overview.Symbol,
      name: overview.Name,
      sector: overview.Sector,
      industry: overview.Industry,
      marketCap,
      enterpriseValue,
      revenue,
      ebitda,
      netIncome,
      totalDebt,
      cash,
      totalEquity,
      sharesOutstanding,
      currentPrice,
      beta,
      peRatio,
      evToRevenue,
      evToEbitda,
      debtToEquity,
      profitMargin,
      returnOnEquity,
    }
  } catch (error) {
    console.error(`Error fetching fundamentals for ${ticker}:`, error)
    return null
  }
}

/**
 * Search for peer companies in the same industry
 */
export async function searchPeerCompanies(
  baseTicker: string,
  apiKey: string,
  maxPeers: number = 10
): Promise<string[]> {
  try {
    // First get the base company's industry
    const baseCompany = await fetchCompanyFundamentals(baseTicker, apiKey)
    if (!baseCompany) {
      throw new Error(`Could not fetch data for base ticker: ${baseTicker}`)
    }

    // Alpha Vantage doesn't have a direct industry search endpoint
    // In production, you would integrate with a more comprehensive data provider
    // or maintain a database of companies by industry

    // For now, return a predefined list based on common industries
    const industryPeers: Record<string, string[]> = {
      Technology: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ADBE', 'ORCL'],
      'Financial Services': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC', 'COF'],
      Healthcare: ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'CVS', 'MRK', 'DHR', 'LLY'],
      'Consumer Cyclical': [
        'AMZN',
        'TSLA',
        'HD',
        'NKE',
        'MCD',
        'SBUX',
        'TGT',
        'LOW',
        'BKNG',
        'CMG',
      ],
      Energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'PSX', 'VLO', 'KMI'],
      Industrials: ['BA', 'CAT', 'GE', 'MMM', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'NOC'],
    }

    // Find peers in the same sector
    const sectorPeers = industryPeers[baseCompany.sector] || []

    // Filter out the base ticker and limit results
    const peers = sectorPeers
      .filter((ticker) => ticker !== baseTicker.toUpperCase())
      .slice(0, maxPeers)

    return peers
  } catch (error) {
    console.error('Error searching for peer companies:', error)
    return []
  }
}

/**
 * Fetch fundamentals for multiple companies with rate limiting
 */
export async function fetchMultipleCompanies(
  tickers: string[],
  apiKey: string,
  delayMs: number = 12000 // Alpha Vantage free tier: 5 calls per minute
): Promise<CompanyFundamentals[]> {
  const results: CompanyFundamentals[] = []

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i]
    console.log(`Fetching data for ${ticker} (${i + 1}/${tickers.length})...`)

    const fundamentals = await fetchCompanyFundamentals(ticker, apiKey)
    if (fundamentals) {
      results.push(fundamentals)
    }

    // Rate limiting delay (except for last item)
    if (i < tickers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Calculate industry averages from peer companies
 */
export function calculateIndustryAverages(
  companies: CompanyFundamentals[]
): PeerComparisonMetrics['industryAverages'] {
  const validMetrics = (values: (number | undefined)[]): number[] => {
    return values.filter((v): v is number => v !== undefined && !isNaN(v))
  }

  const average = (values: number[]): number => {
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
  }

  return {
    peRatio: average(validMetrics(companies.map((c) => c.peRatio))),
    evToRevenue: average(validMetrics(companies.map((c) => c.evToRevenue))),
    evToEbitda: average(validMetrics(companies.map((c) => c.evToEbitda))),
    beta: average(validMetrics(companies.map((c) => c.beta))),
    debtToEquity: average(validMetrics(companies.map((c) => c.debtToEquity))),
    profitMargin: average(validMetrics(companies.map((c) => c.profitMargin))),
    returnOnEquity: average(validMetrics(companies.map((c) => c.returnOnEquity))),
  }
}

/**
 * Calculate percentile ranking for a company among peers
 */
export function calculatePercentileRankings(
  company: CompanyFundamentals,
  peers: CompanyFundamentals[]
): PeerComparisonMetrics['percentileRankings'] {
  const allCompanies = [company, ...peers]

  const getPercentile = (value: number | undefined, allValues: (number | undefined)[]): number => {
    if (value === undefined) return 0

    const validValues = allValues.filter((v): v is number => v !== undefined && !isNaN(v))
    if (validValues.length === 0) return 0

    const sorted = [...validValues].sort((a, b) => a - b)
    const index = sorted.findIndex((v) => v >= value)
    return index === -1 ? 100 : (index / sorted.length) * 100
  }

  return {
    marketCap: getPercentile(
      company.marketCap,
      allCompanies.map((c) => c.marketCap)
    ),
    peRatio: getPercentile(
      company.peRatio,
      allCompanies.map((c) => c.peRatio)
    ),
    evToRevenue: getPercentile(
      company.evToRevenue,
      allCompanies.map((c) => c.evToRevenue)
    ),
    evToEbitda: getPercentile(
      company.evToEbitda,
      allCompanies.map((c) => c.evToEbitda)
    ),
    beta: getPercentile(
      company.beta,
      allCompanies.map((c) => c.beta)
    ),
    profitMargin: getPercentile(
      company.profitMargin,
      allCompanies.map((c) => c.profitMargin)
    ),
  }
}

/**
 * Perform complete peer comparison analysis
 */
export async function performPeerComparison(
  targetTicker: string,
  peerTickers: string[],
  apiKey: string
): Promise<PeerComparisonMetrics | null> {
  try {
    // Fetch target company
    const company = await fetchCompanyFundamentals(targetTicker, apiKey)
    if (!company) {
      throw new Error(`Could not fetch data for target ticker: ${targetTicker}`)
    }

    // Fetch peer companies
    const peers = await fetchMultipleCompanies(peerTickers, apiKey)

    // Calculate industry averages
    const industryAverages = calculateIndustryAverages([company, ...peers])

    // Calculate percentile rankings
    const percentileRankings = calculatePercentileRankings(company, peers)

    return {
      company,
      peers,
      industryAverages,
      percentileRankings,
    }
  } catch (error) {
    console.error('Error performing peer comparison:', error)
    return null
  }
}

/**
 * Filter peers by market cap range
 */
export function filterPeersByMarketCap(
  companies: CompanyFundamentals[],
  targetMarketCap: number,
  tolerance: number = 0.5 // 50% tolerance
): CompanyFundamentals[] {
  const minMarketCap = targetMarketCap * (1 - tolerance)
  const maxMarketCap = targetMarketCap * (1 + tolerance)

  return companies.filter((c) => c.marketCap >= minMarketCap && c.marketCap <= maxMarketCap)
}

/**
 * Rank peers by similarity score
 */
export function rankPeersBySimilarity(
  target: CompanyFundamentals,
  peers: CompanyFundamentals[]
): Array<{ company: CompanyFundamentals; similarityScore: number }> {
  return peers
    .map((peer) => {
      // Calculate similarity based on multiple factors
      const marketCapDiff = Math.abs(Math.log(peer.marketCap / target.marketCap))
      const revenueDiff = Math.abs(Math.log(peer.revenue / target.revenue))
      const marginDiff = Math.abs((peer.profitMargin || 0) - (target.profitMargin || 0)) / 100

      // Weight the factors
      const similarityScore = 1 / (1 + marketCapDiff * 0.3 + revenueDiff * 0.3 + marginDiff * 0.4)

      return { company: peer, similarityScore }
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
}
