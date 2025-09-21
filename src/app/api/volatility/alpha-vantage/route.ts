import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tickers, timePeriodYears = 2, frequency = 'daily' } = body

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'Tickers array is required' }, { status: 400 })
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Alpha Vantage API key not configured' }, { status: 500 })
    }

    const volatilities: number[] = []
    const errors: string[] = []

    for (const ticker of tickers) {
      try {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}&outputsize=full`

        const response = await fetch(url)
        const data = await response.json()

        if (data['Error Message']) {
          errors.push(`${ticker}: ${data['Error Message']}`)
          continue
        }

        if (data['Note']) {
          return NextResponse.json(
            {
              error: 'API rate limit reached. Please wait a moment and try again.',
              details: data['Note'],
            },
            { status: 429 }
          )
        }

        const timeSeries = data['Time Series (Daily)']
        if (!timeSeries) {
          errors.push(`${ticker}: No time series data available`)
          continue
        }

        const results: any[] = []
        const cutoffDate = new Date()
        cutoffDate.setFullYear(cutoffDate.getFullYear() - timePeriodYears)

        for (const [date, values] of Object.entries(timeSeries) as any) {
          if (new Date(date) < cutoffDate) break

          results.push({
            date,
            close: parseFloat(values['5. adjusted close'] || values['4. close']),
          })
        }

        if (results.length < 2) {
          errors.push(`${ticker}: Insufficient data points`)
          continue
        }

        // Calculate volatility
        const returns: number[] = []
        for (let i = 1; i < results.length; i++) {
          const dailyReturn = Math.log(results[i].close / results[i - 1].close)
          returns.push(dailyReturn)
        }

        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
        const variance =
          returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)

        const annualizationFactors = { daily: 252, weekly: 52, monthly: 12 }
        const annualizationFactor =
          annualizationFactors[frequency as keyof typeof annualizationFactors]

        const dailyStdDev = Math.sqrt(variance)
        const annualizedVolatility = dailyStdDev * Math.sqrt(annualizationFactor) * 100

        volatilities.push(annualizedVolatility)
      } catch (error) {
        errors.push(`${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (volatilities.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to calculate volatility for any ticker',
          details: errors,
        },
        { status: 400 }
      )
    }

    const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length

    return NextResponse.json({
      value: avgVolatility,
      source: 'alpha_vantage',
      metadata: {
        fetchDate: new Date().toISOString(),
        tickers,
        timePeriod: timePeriodYears,
        frequency,
        dataPoints: volatilities.length,
        individualVolatilities: tickers.map((ticker, i) => ({
          ticker,
          volatility: volatilities[i] || null,
        })),
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    console.error('Alpha Vantage API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
