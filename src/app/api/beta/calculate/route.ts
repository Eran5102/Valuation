import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  calculateBeta,
  adjustBeta,
  unleverBeta,
  releverBeta,
} from '@/lib/services/beta/betaCalculationService'

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'P9MHLKEMM4D1GOES'

interface BetaRequest {
  ticker: string
  marketIndex?: string
  valuationDate: string
  periodYears?: number
  adjustmentMethod?: 'raw' | 'blume' | 'vasicek'
  leverage?: {
    debtToEquity: number
    taxRate: number
  }
}

export async function POST(request: Request) {
  try {
    const body: BetaRequest = await request.json()
    const {
      ticker,
      marketIndex = 'SPY',
      valuationDate,
      periodYears = 2,
      adjustmentMethod = 'blume',
      leverage,
    } = body

    if (!ticker || !valuationDate) {
      return NextResponse.json({ error: 'Ticker and valuation date are required' }, { status: 400 })
    }

    // Fetch historical price data from Alpha Vantage
    const [companyData, marketData] = await Promise.all([
      fetchHistoricalPrices(ticker, ALPHA_VANTAGE_API_KEY),
      fetchHistoricalPrices(marketIndex, ALPHA_VANTAGE_API_KEY),
    ])

    if (!companyData || !marketData) {
      return NextResponse.json({ error: 'Failed to fetch historical price data' }, { status: 500 })
    }

    // Calculate beta
    const betaResult = await calculateBeta(companyData, marketData, valuationDate, periodYears)

    // Apply adjustments
    let adjustedBeta = betaResult.beta
    if (adjustmentMethod === 'blume') {
      adjustedBeta = adjustBeta(betaResult.beta)
    }

    // Calculate levered/unlevered if leverage data provided
    let unleveredBeta = null
    let releveredBeta = null
    if (leverage) {
      unleveredBeta = unleverBeta(adjustedBeta, leverage.debtToEquity, leverage.taxRate)
      // Example: relever to target capital structure
      releveredBeta = releverBeta(
        unleveredBeta,
        leverage.debtToEquity, // target D/E
        leverage.taxRate
      )
    }

    return NextResponse.json({
      ticker,
      marketIndex,
      valuationDate,
      rawBeta: betaResult.beta,
      adjustedBeta,
      unleveredBeta,
      releveredBeta,
      correlation: betaResult.correlation,
      rSquared: betaResult.rSquared,
      standardError: betaResult.standardError,
      observations: betaResult.observations,
      period: betaResult.period,
      startDate: betaResult.startDate,
      endDate: betaResult.endDate,
    })
  } catch (error) {
    console.error('Error calculating beta:', error)
    return NextResponse.json({ error: 'Failed to calculate beta' }, { status: 500 })
  }
}

async function fetchHistoricalPrices(symbol: string, apiKey: string) {
  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('Alpha Vantage error:', data['Error Message'] || data['Note'])
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
    console.error('Error fetching historical prices:', error)
    return null
  }
}
