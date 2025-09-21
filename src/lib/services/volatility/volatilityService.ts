import {
  VolatilitySource,
  VolatilityResult,
  VolatilityServiceConfig,
  DamodaranVolatilityData,
  AlphaVantageTimeSeriesData,
  VolatilityCalculationParams,
} from '@/types/volatility'

export interface IVolatilityService {
  getVolatility(params: {
    source: VolatilitySource
    industry?: string
    market?: string
    tickers?: string[]
    timePeriodYears?: number
  }): Promise<VolatilityResult>

  calculateHistoricalVolatility(params: VolatilityCalculationParams): number

  getAvailableIndustries(market?: string): string[]

  getCachedResult(key: string): VolatilityResult | null
}

export class VolatilityService implements IVolatilityService {
  private config: VolatilityServiceConfig
  private cache: Map<string, { result: VolatilityResult; timestamp: number }>
  private damodaranData: Map<string, DamodaranVolatilityData[]>

  constructor(config: VolatilityServiceConfig = {}) {
    this.config = {
      cacheEnabled: true,
      cacheDuration: 3600000, // 1 hour default
      alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY || config.alphaVantageApiKey,
      ...config,
    }
    this.cache = new Map()
    this.damodaranData = new Map()
  }

  async getVolatility(params: {
    source: VolatilitySource
    industry?: string
    market?: string
    tickers?: string[]
    timePeriodYears?: number
    frequency?: 'daily' | 'weekly' | 'monthly'
  }): Promise<VolatilityResult> {
    const cacheKey = this.getCacheKey(params)

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getCachedResult(cacheKey)
      if (cached) return cached
    }

    let result: VolatilityResult

    switch (params.source) {
      case 'manual':
        throw new Error('Manual volatility should be handled by the component directly')

      case 'damodaran':
        result = await this.getDamodaranVolatility(params.industry!, params.market || 'US')
        break

      case 'alpha_vantage':
        result = await this.getAlphaVantageVolatility(
          params.tickers!,
          params.timePeriodYears || 2,
          params.frequency || 'daily'
        )
        break

      default:
        throw new Error(`Unknown volatility source: ${params.source}`)
    }

    // Cache the result
    if (this.config.cacheEnabled) {
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      })
    }

    return result
  }

  private async getDamodaranVolatility(
    industry: string,
    market: string
  ): Promise<VolatilityResult> {
    // Load Damodaran data for the specified market
    const marketData = await this.loadDamodaranData(market)

    // Find matching industry
    const industryData = marketData.find(
      (item) => item.industry.toLowerCase() === industry.toLowerCase()
    )

    if (!industryData) {
      // Return average if industry not found
      const avgVolatility =
        marketData.reduce((sum, item) => sum + item.standardDeviation, 0) / marketData.length

      return {
        value: avgVolatility / 100, // Convert from stored integer to decimal percentage
        source: 'damodaran',
        metadata: {
          fetchDate: new Date().toISOString(),
          industry: 'Market Average',
          market,
          region: market as any,
        },
      }
    }

    return {
      value: industryData.standardDeviation / 100, // Convert from stored integer to decimal percentage
      source: 'damodaran',
      metadata: {
        fetchDate: new Date().toISOString(),
        industry: industryData.industry,
        market,
        region: industryData.region,
      },
    }
  }

  private async getAlphaVantageVolatility(
    tickers: string[],
    timePeriodYears: number,
    frequency: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<VolatilityResult> {
    if (!this.config.alphaVantageApiKey) {
      throw new Error('Alpha Vantage API key is required')
    }

    // Get historical data for each ticker
    const volatilities: number[] = []

    for (const ticker of tickers) {
      const timeSeries = await this.fetchAlphaVantageData(ticker, timePeriodYears)
      const volatility = this.calculateHistoricalVolatility({
        timeSeries,
        periodInYears: timePeriodYears,
        frequency,
      })
      volatilities.push(volatility)
    }

    // Average volatility across all tickers
    const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length

    return {
      value: avgVolatility,
      source: 'alpha_vantage',
      metadata: {
        fetchDate: new Date().toISOString(),
        tickers,
        timePeriod: timePeriodYears,
        frequency,
        dataPoints: volatilities.length,
      },
    }
  }

  private async fetchAlphaVantageData(
    ticker: string,
    years: number
  ): Promise<AlphaVantageTimeSeriesData[]> {
    const apiKey = this.config.alphaVantageApiKey
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}&outputsize=full`

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || 'API rate limit reached')
      }

      const timeSeries = data['Time Series (Daily)']
      const results: AlphaVantageTimeSeriesData[] = []

      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - years)

      for (const [date, values] of Object.entries(timeSeries)) {
        if (new Date(date) < cutoffDate) break

        results.push({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          adjustedClose: parseFloat(values['5. adjusted close']),
          volume: parseFloat(values['6. volume']),
        } as AlphaVantageTimeSeriesData)
      }

      return results.reverse() // Return in chronological order
    } catch (error) {
      console.error(`Failed to fetch data for ${ticker}:`, error)
      throw error
    }
  }

  calculateHistoricalVolatility(params: VolatilityCalculationParams): number {
    const { timeSeries, frequency = 'daily' } = params

    // Set annualization factor based on frequency
    const annualizationFactors = {
      daily: 252,
      weekly: 52,
      monthly: 12,
    }
    const annualizationFactor = params.annualizationFactor || annualizationFactors[frequency]

    if (timeSeries.length < 2) {
      throw new Error('Need at least 2 data points to calculate volatility')
    }

    // Calculate daily returns
    const returns: number[] = []
    for (let i = 1; i < timeSeries.length; i++) {
      const prevPrice = timeSeries[i - 1].adjustedClose || timeSeries[i - 1].close
      const currPrice = timeSeries[i].adjustedClose || timeSeries[i].close
      const dailyReturn = Math.log(currPrice / prevPrice)
      returns.push(dailyReturn)
    }

    // Calculate mean return
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length

    // Calculate variance
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)

    // Calculate standard deviation and annualize
    const dailyStdDev = Math.sqrt(variance)
    const annualizedVolatility = dailyStdDev * Math.sqrt(annualizationFactor)

    // Convert to percentage
    return annualizedVolatility * 100
  }

  private async loadDamodaranData(market: string): Promise<DamodaranVolatilityData[]> {
    // Check if already loaded
    if (this.damodaranData.has(market)) {
      return this.damodaranData.get(market)!
    }

    try {
      // Import the JSON data for the specified market
      const module = await import(`@/data/damodaran-volatility/${market.toLowerCase()}-market.json`)
      const data = module.default as DamodaranVolatilityData[]

      this.damodaranData.set(market, data)
      return data
    } catch (error) {
      console.error(`Failed to load Damodaran data for ${market}:`, error)
      // Return empty array if data not found
      return []
    }
  }

  getAvailableIndustries(market = 'US'): string[] {
    const marketData = this.damodaranData.get(market)
    if (!marketData) return []

    return marketData.map((item) => item.industry).sort()
  }

  getCachedResult(key: string): VolatilityResult | null {
    if (!this.config.cacheEnabled) return null

    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.config.cacheDuration!
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  private getCacheKey(params: any): string {
    return JSON.stringify(params)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

// Singleton instance
let serviceInstance: VolatilityService | null = null

export function getVolatilityService(config?: VolatilityServiceConfig): VolatilityService {
  if (!serviceInstance) {
    serviceInstance = new VolatilityService(config)
  }
  return serviceInstance
}
