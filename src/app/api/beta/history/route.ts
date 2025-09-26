import { NextResponse } from 'next/server'
import { calculateRollingBeta } from '@/lib/services/beta/betaCalculationService'
import { subYears, format } from 'date-fns'

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'P9MHLKEMM4D1GOES'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticker, valuationDate, periodYears = 2, frequency = 'monthly' } = body

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
    }

    // Fetch historical prices for the ticker and market index
    const [companyData, marketData] = await Promise.all([
      fetchHistoricalPrices(ticker, ALPHA_VANTAGE_API_KEY),
      fetchHistoricalPrices('SPY', ALPHA_VANTAGE_API_KEY),
    ])

    if (!companyData || !marketData) {
      return NextResponse.json({ error: 'Failed to fetch historical price data' }, { status: 500 })
    }

    // Calculate window and step sizes based on frequency
    let windowDays = 252 // 1 year of trading days
    let stepDays = 21 // Monthly steps

    switch (frequency) {
      case 'daily':
        windowDays = 60 // 60 trading days
        stepDays = 1
        break
      case 'weekly':
        windowDays = 126 // ~6 months
        stepDays = 5
        break
      case 'monthly':
      default:
        windowDays = 252 // 1 year
        stepDays = 21
        break
    }

    // Calculate rolling beta
    const rollingBetaData = await calculateRollingBeta(
      companyData,
      marketData,
      windowDays,
      stepDays
    )

    // Filter data based on period
    const cutoffDate = subYears(new Date(valuationDate || new Date()), periodYears)
    const filteredData = rollingBetaData.filter((point) => new Date(point.date) >= cutoffDate)

    // Calculate statistics
    const betas = filteredData.map((p) => p.beta)
    const currentBeta = betas[betas.length - 1] || 0
    const averageBeta = betas.reduce((sum, b) => sum + b, 0) / betas.length
    const minBeta = Math.min(...betas)
    const maxBeta = Math.max(...betas)

    // Calculate volatility (standard deviation)
    const variance = betas.reduce((sum, b) => sum + Math.pow(b - averageBeta, 2), 0) / betas.length
    const volatility = Math.sqrt(variance)

    // Determine trend
    const recentAvg = betas.slice(-6).reduce((sum, b) => sum + b, 0) / Math.min(6, betas.length)
    const olderAvg = betas.slice(0, 6).reduce((sum, b) => sum + b, 0) / Math.min(6, betas.length)
    const trend =
      recentAvg > olderAvg * 1.05
        ? 'increasing'
        : recentAvg < olderAvg * 0.95
          ? 'decreasing'
          : 'stable'

    return NextResponse.json({
      history: filteredData,
      statistics: {
        currentBeta,
        averageBeta,
        minBeta,
        maxBeta,
        volatility,
        trend,
      },
      metadata: {
        ticker,
        valuationDate,
        periodYears,
        frequency,
        dataPoints: filteredData.length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate beta history' }, { status: 500 })
  }
}

async function fetchHistoricalPrices(symbol: string, apiKey: string) {
  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      return null
    }

    const timeSeries = data['Time Series (Daily)']
    if (!timeSeries) {
      return null
    }

    // Convert to our format
    const prices = Object.entries(timeSeries)
      .map(([date, values]: [string, any]) => ({
        date,
        close: parseFloat(values['4. close']),
        adjustedClose: parseFloat(values['5. adjusted close']),
      }))
      .reverse() // Oldest first

    return prices
  } catch (error) {
    return null
  }
}
