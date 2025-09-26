/**
 * Treasury Yield Curve Data Service
 * Fetches yield curve rates from the US Treasury API
 * https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=2024
 */

export interface TreasuryYieldCurveRate {
  date: string
  '1Mo'?: number
  '2Mo'?: number
  '3Mo'?: number
  '4Mo'?: number
  '6Mo'?: number
  '1Yr'?: number
  '2Yr'?: number
  '3Yr'?: number
  '5Yr'?: number
  '7Yr'?: number
  '10Yr'?: number
  '20Yr'?: number
  '30Yr'?: number
}

export interface YieldCurveResponse {
  success: boolean
  data?: TreasuryYieldCurveRate[]
  error?: string
  source: 'treasury'
  fetchedAt: string
}

export class TreasuryYieldCurveService {
  private static readonly BASE_URL =
    'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv'
  private static readonly XML_URL =
    'https://home.treasury.gov/sites/default/files/interest-rates/yield.xml'

  /**
   * Fetches the most recent yield curve data from Treasury
   */
  static async fetchLatestYieldCurve(): Promise<YieldCurveResponse> {
    try {
      // Treasury provides data in XML format, we'll use the XML endpoint
      const response = await fetch('/api/external/treasury-yield-curve', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      return {
        success: true,
        data: result.data,
        source: 'treasury',
        fetchedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Treasury data',
        source: 'treasury',
        fetchedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Fetches yield curve data for a specific date
   */
  static async fetchYieldCurveForDate(date: string): Promise<YieldCurveResponse> {
    try {
      const response = await fetch('/api/external/treasury-yield-curve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      return {
        success: true,
        data: result.data,
        source: 'treasury',
        fetchedAt: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Treasury data',
        source: 'treasury',
        fetchedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Maps time to liquidity (in years) to the closest Treasury maturity
   */
  static getClosestMaturityForTimeToLiquidity(timeToLiquidityYears: number): string {
    const maturities = [
      { key: '1Mo', years: 1 / 12 },
      { key: '2Mo', years: 2 / 12 },
      { key: '3Mo', years: 3 / 12 },
      { key: '4Mo', years: 4 / 12 },
      { key: '6Mo', years: 6 / 12 },
      { key: '1Yr', years: 1 },
      { key: '2Yr', years: 2 },
      { key: '3Yr', years: 3 },
      { key: '5Yr', years: 5 },
      { key: '7Yr', years: 7 },
      { key: '10Yr', years: 10 },
      { key: '20Yr', years: 20 },
      { key: '30Yr', years: 30 },
    ]

    // Find the closest maturity
    let closestMaturity = maturities[0]
    let minDifference = Math.abs(timeToLiquidityYears - maturities[0].years)

    for (const maturity of maturities) {
      const difference = Math.abs(timeToLiquidityYears - maturity.years)
      if (difference < minDifference) {
        minDifference = difference
        closestMaturity = maturity
      }
    }

    return closestMaturity.key
  }

  /**
   * Gets the risk-free rate for a specific valuation date and time to liquidity
   */
  static async getRiskFreeRate(
    valuationDate: string,
    timeToLiquidityYears: number
  ): Promise<{ rate: number | null; maturity: string; error?: string; interpolated?: boolean }> {
    try {
      // Get yield curve data for the valuation date (or closest available date)
      const yieldCurveResponse = await this.fetchYieldCurveForDate(valuationDate)

      if (
        !yieldCurveResponse.success ||
        !yieldCurveResponse.data ||
        yieldCurveResponse.data.length === 0
      ) {
        return {
          rate: null,
          maturity: '',
          error: yieldCurveResponse.error || 'No yield curve data available',
        }
      }

      // Get the most recent data point
      const latestData = yieldCurveResponse.data[0]

      // Find the closest maturity
      const maturityKey = this.getClosestMaturityForTimeToLiquidity(timeToLiquidityYears)
      const rate = latestData[maturityKey as keyof TreasuryYieldCurveRate] as number

      if (rate === undefined || rate === null) {
        return {
          rate: null,
          maturity: maturityKey,
          error: `No rate available for ${maturityKey} maturity`,
        }
      }

      // Check if we should interpolate between two maturities for more precision
      const shouldInterpolate = this.shouldInterpolate(timeToLiquidityYears)
      if (shouldInterpolate.interpolate) {
        const interpolatedRate = this.interpolateRate(
          latestData,
          timeToLiquidityYears,
          shouldInterpolate.lowerMaturity!,
          shouldInterpolate.upperMaturity!
        )

        if (interpolatedRate !== null) {
          return {
            rate: interpolatedRate,
            maturity: `Interpolated between ${shouldInterpolate.lowerMaturity} and ${shouldInterpolate.upperMaturity}`,
            interpolated: true,
          }
        }
      }

      return {
        rate,
        maturity: maturityKey,
        interpolated: false,
      }
    } catch (error) {
      return {
        rate: null,
        maturity: '',
        error: error instanceof Error ? error.message : 'Failed to get risk-free rate',
      }
    }
  }

  /**
   * Determines if interpolation should be used for more accuracy
   */
  private static shouldInterpolate(timeToLiquidityYears: number): {
    interpolate: boolean
    lowerMaturity?: string
    upperMaturity?: string
  } {
    const maturities = [
      { key: '1Mo', years: 1 / 12 },
      { key: '3Mo', years: 3 / 12 },
      { key: '6Mo', years: 6 / 12 },
      { key: '1Yr', years: 1 },
      { key: '2Yr', years: 2 },
      { key: '3Yr', years: 3 },
      { key: '5Yr', years: 5 },
      { key: '7Yr', years: 7 },
      { key: '10Yr', years: 10 },
      { key: '20Yr', years: 20 },
      { key: '30Yr', years: 30 },
    ]

    // Find bounding maturities for interpolation
    for (let i = 0; i < maturities.length - 1; i++) {
      const lower = maturities[i]
      const upper = maturities[i + 1]

      if (timeToLiquidityYears > lower.years && timeToLiquidityYears < upper.years) {
        // Only interpolate if the time to liquidity is significantly different from both bounds
        const lowerDiff = Math.abs(timeToLiquidityYears - lower.years)
        const upperDiff = Math.abs(timeToLiquidityYears - upper.years)
        const minDiff = Math.min(lowerDiff, upperDiff)

        // Interpolate if the closest maturity is still more than 6 months away
        if (minDiff > 0.5) {
          return {
            interpolate: true,
            lowerMaturity: lower.key,
            upperMaturity: upper.key,
          }
        }
      }
    }

    return { interpolate: false }
  }

  /**
   * Performs linear interpolation between two yield curve points
   */
  private static interpolateRate(
    yieldData: TreasuryYieldCurveRate,
    targetYears: number,
    lowerMaturityKey: string,
    upperMaturityKey: string
  ): number | null {
    const maturitiesMap = new Map([
      ['1Mo', 1 / 12],
      ['2Mo', 2 / 12],
      ['3Mo', 3 / 12],
      ['4Mo', 4 / 12],
      ['6Mo', 6 / 12],
      ['1Yr', 1],
      ['2Yr', 2],
      ['3Yr', 3],
      ['5Yr', 5],
      ['7Yr', 7],
      ['10Yr', 10],
      ['20Yr', 20],
      ['30Yr', 30],
    ])

    const lowerYears = maturitiesMap.get(lowerMaturityKey)
    const upperYears = maturitiesMap.get(upperMaturityKey)
    const lowerRate = yieldData[lowerMaturityKey as keyof TreasuryYieldCurveRate] as number
    const upperRate = yieldData[upperMaturityKey as keyof TreasuryYieldCurveRate] as number

    if (
      !lowerYears ||
      !upperYears ||
      lowerRate === undefined ||
      upperRate === undefined ||
      lowerRate === null ||
      upperRate === null
    ) {
      return null
    }

    // Linear interpolation formula: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
    const interpolatedRate =
      lowerRate + ((targetYears - lowerYears) * (upperRate - lowerRate)) / (upperYears - lowerYears)

    return Math.round(interpolatedRate * 100) / 100 // Round to 2 decimal places
  }
}
