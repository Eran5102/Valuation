import 'server-only' // This will error if imported client-side

/**
 * Server-only DCF calculations
 * These are proprietary formulas that should never be exposed to the client
 */

export interface DCFInputs {
  // Cash flows
  cashFlows: number[] // Projected free cash flows by year

  // Discount parameters
  discountRate: number // WACC as decimal (e.g., 0.12 for 12%)
  discountingConvention: 'Mid-Year' | 'End-Year'

  // Terminal value parameters
  terminalValueMethod: 'PGM' | 'Exit Multiple'
  terminalGrowthRate?: number // For PGM (as decimal)
  exitMultiple?: number // For Exit Multiple method
  terminalMetric?: number // EBITDA or other metric for exit multiple

  // Timing
  valuationDate: Date
  firstProjectionDate: Date
}

export interface DCFResults {
  presentValueOfCashFlows: number
  terminalValue: number
  presentValueOfTerminalValue: number
  enterpriseValue: number
  discountFactors: number[]
  discountedCashFlows: number[]
}

/**
 * Calculate the discount factor for each period
 * PROPRIETARY FORMULA
 */
function calculateDiscountFactors(
  periods: number,
  discountRate: number,
  convention: 'Mid-Year' | 'End-Year',
  stubPeriodFraction?: number
): number[] {
  const factors: number[] = []

  for (let i = 0; i < periods; i++) {
    let timeValue: number

    if (i === 0 && stubPeriodFraction) {
      // Handle stub period
      timeValue = convention === 'Mid-Year' ? stubPeriodFraction / 2 : stubPeriodFraction
    } else {
      const fullPeriod = i + (stubPeriodFraction ? stubPeriodFraction : 0)
      timeValue = convention === 'Mid-Year' ? fullPeriod + 0.5 : fullPeriod + 1
    }

    // Discount factor formula: 1 / (1 + r)^t
    factors.push(1 / Math.pow(1 + discountRate, timeValue))
  }

  return factors
}

/**
 * Calculate terminal value using Perpetual Growth Method
 * PROPRIETARY FORMULA
 */
function calculateTerminalValuePGM(
  lastCashFlow: number,
  growthRate: number,
  discountRate: number
): number {
  if (growthRate >= discountRate) {
    throw new Error('Terminal growth rate must be less than discount rate')
  }

  // Gordon Growth Model: TV = FCF(n+1) / (WACC - g)
  const nextYearCashFlow = lastCashFlow * (1 + growthRate)
  return nextYearCashFlow / (discountRate - growthRate)
}

/**
 * Calculate terminal value using Exit Multiple Method
 * PROPRIETARY FORMULA
 */
function calculateTerminalValueExitMultiple(terminalMetric: number, exitMultiple: number): number {
  return terminalMetric * exitMultiple
}

/**
 * Main DCF calculation engine
 * PROPRIETARY CALCULATION LOGIC
 */
export function calculateDCF(inputs: DCFInputs): DCFResults {
  const {
    cashFlows,
    discountRate,
    discountingConvention,
    terminalValueMethod,
    terminalGrowthRate,
    exitMultiple,
    terminalMetric,
  } = inputs

  // Validate inputs
  if (!cashFlows || cashFlows.length === 0) {
    throw new Error('Cash flows are required')
  }

  if (discountRate < 0 || discountRate > 1) {
    throw new Error('Discount rate must be between 0 and 1')
  }

  // Calculate discount factors
  const discountFactors = calculateDiscountFactors(
    cashFlows.length,
    discountRate,
    discountingConvention
  )

  // Calculate present value of cash flows
  const discountedCashFlows = cashFlows.map((cf, i) => cf * discountFactors[i])
  const presentValueOfCashFlows = discountedCashFlows.reduce((sum, dcf) => sum + dcf, 0)

  // Calculate terminal value
  let terminalValue = 0

  if (terminalValueMethod === 'PGM' && terminalGrowthRate !== undefined) {
    terminalValue = calculateTerminalValuePGM(
      cashFlows[cashFlows.length - 1],
      terminalGrowthRate,
      discountRate
    )
  } else if (terminalValueMethod === 'Exit Multiple' && exitMultiple && terminalMetric) {
    terminalValue = calculateTerminalValueExitMultiple(terminalMetric, exitMultiple)
  }

  // Discount terminal value to present
  const terminalDiscountFactor = discountFactors[discountFactors.length - 1]
  const presentValueOfTerminalValue = terminalValue * terminalDiscountFactor

  // Calculate enterprise value
  const enterpriseValue = presentValueOfCashFlows + presentValueOfTerminalValue

  return {
    presentValueOfCashFlows,
    terminalValue,
    presentValueOfTerminalValue,
    enterpriseValue,
    discountFactors,
    discountedCashFlows,
  }
}

/**
 * Sensitivity analysis for DCF
 * Tests different discount rates and growth rates
 */
export function calculateDCFSensitivity(
  baseInputs: DCFInputs,
  discountRateRange: number[],
  growthRateRange: number[]
): Record<string, Record<string, number>> {
  const results: Record<string, Record<string, number>> = {}

  for (const dr of discountRateRange) {
    results[dr.toString()] = {}

    for (const gr of growthRateRange) {
      try {
        const sensitivityInputs = {
          ...baseInputs,
          discountRate: dr,
          terminalGrowthRate: gr,
        }

        const dcfResult = calculateDCF(sensitivityInputs)
        results[dr.toString()][gr.toString()] = dcfResult.enterpriseValue
      } catch (error) {
        // Invalid combination (e.g., growth rate >= discount rate)
        results[dr.toString()][gr.toString()] = NaN
      }
    }
  }

  return results
}

/**
 * Calculate implied share price from enterprise value
 */
export function calculateImpliedSharePrice(
  enterpriseValue: number,
  cashBalance: number,
  debtBalance: number,
  sharesOutstanding: number
): number {
  // Enterprise Value to Equity Value bridge
  const equityValue = enterpriseValue + cashBalance - debtBalance

  // Price per share
  return equityValue / sharesOutstanding
}
