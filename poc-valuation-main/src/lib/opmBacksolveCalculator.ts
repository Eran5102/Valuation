import { blackScholesCall } from './blackScholes'

// Define types for the input data
export interface ShareClass {
  name: string
  totalShares: number
  participation: ParticipationRule[]
}

export interface ParticipationRule {
  from: number
  to: number
  sharesParticipating: number
}

export interface FmvResult {
  name: string
  fmvPerShare: number
  totalValue: number
}

export interface BreakpointDetail {
  from: number
  to: number
  d1: number
  d2: number
  optionValue: number
  incrementalValue: number
  sharesParticipation: {
    className: string
    shares: number
    percentOfTotal: number
    incrementalValue: number
    incrementalPercent: number
  }[]
}

/**
 * Performs the OPM Backsolve calculation to determine FMV per share class.
 *
 * @param totalEquityValue - The total equity value of the company (S in Black-Scholes).
 * @param breakpoints - An array of breakpoint values (strike prices K), sorted ascendingly.
 * @param capTableData - Array of share class objects.
 * @param timeToLiquidity - Time to exit/liquidity (T in Black-Scholes, in years).
 * @param riskFreeRate - Annualized risk-free rate (r in Black-Scholes, e.g., 0.02).
 * @param volatility - Annualized volatility (v in Black-Scholes, e.g., 0.3).
 * @returns - Array of objects, each containing { name: string, fmvPerShare: number, totalValue: number }
 */
export function calculateOpmFmv(
  totalEquityValue: number,
  breakpoints: number[],
  capTableData: ShareClass[],
  timeToLiquidity: number,
  riskFreeRate: number,
  volatility: number
): FmvResult[] {
  const results: Record<string, { totalValue: number; totalShares: number }> = {}

  // Initialize results for each class
  capTableData.forEach((cls) => {
    results[cls.name] = { totalValue: 0, totalShares: cls.totalShares }
  })

  // Ensure breakpoints are sorted and add 0 if not already present
  const sortedBreakpoints = Array.from(new Set([0, ...breakpoints])).sort((a, b) => a - b)

  // Calculate value of each "slice" between breakpoints
  for (let i = 0; i < sortedBreakpoints.length; i++) {
    const lowerBreakpoint = sortedBreakpoints[i]
    const upperBreakpoint = i + 1 < sortedBreakpoints.length ? sortedBreakpoints[i + 1] : Infinity

    // Value of a call option at the lower breakpoint strike
    const valueAtLowerK = blackScholesCall(
      totalEquityValue,
      lowerBreakpoint,
      timeToLiquidity,
      riskFreeRate,
      volatility
    )

    // Value of a call option at the upper breakpoint strike
    // For the last slice (above the highest breakpoint), this value is 0
    const valueAtUpperK =
      upperBreakpoint === Infinity
        ? 0
        : blackScholesCall(
            totalEquityValue,
            upperBreakpoint,
            timeToLiquidity,
            riskFreeRate,
            volatility
          )

    // The value of the "slice" of equity between the lower and upper breakpoint
    const sliceValue = valueAtLowerK - valueAtUpperK

    if (sliceValue <= 0) {
      continue // No value in this slice to distribute
    }

    // Find total shares participating across ALL classes in this specific slice
    let totalSharesParticipatingInSlice = 0
    capTableData.forEach((cls) => {
      const participationRule = cls.participation?.find(
        (p) =>
          p.from === lowerBreakpoint &&
          (p.to === upperBreakpoint || (upperBreakpoint === Infinity && p.to === Infinity))
      )

      if (participationRule) {
        totalSharesParticipatingInSlice += participationRule.sharesParticipating
      }
    })

    if (totalSharesParticipatingInSlice <= 0) {
      continue // No shares participate in this slice
    }

    // Calculate value per participating share in this slice
    const valuePerShareInSlice = sliceValue / totalSharesParticipatingInSlice

    // Allocate slice value to each participating class
    capTableData.forEach((cls) => {
      const participationRule = cls.participation?.find(
        (p) =>
          p.from === lowerBreakpoint &&
          (p.to === upperBreakpoint || (upperBreakpoint === Infinity && p.to === Infinity))
      )

      if (participationRule && participationRule.sharesParticipating > 0) {
        const valueForClassInSlice = valuePerShareInSlice * participationRule.sharesParticipating
        results[cls.name].totalValue += valueForClassInSlice
      }
    })
  }

  // Calculate final FMV per share for each class
  const finalResults: FmvResult[] = capTableData.map((cls) => {
    const classResult = results[cls.name]
    const fmvPerShare =
      classResult.totalShares > 0 ? classResult.totalValue / classResult.totalShares : 0

    return {
      name: cls.name,
      fmvPerShare: fmvPerShare,
      totalValue: classResult.totalValue,
    }
  })

  return finalResults
}

/**
 * Helper function to convert a simplified capital structure into the required format for OPM calculations
 * @param securityClasses - Array of security classes with basic info
 * @param liquidationPreferences - Map of preferences by class
 * @returns Formatted data for OPM calculation with breakpoints and participation rules
 */
export function prepareOpmData(
  securityClasses: Array<{
    id: string
    name: string
    type: 'common' | 'preferred'
    shareCount: number
    liquidationPreference: number
    sharePrice: number
    seniority: number
  }>
): {
  breakpoints: number[]
  shareClasses: ShareClass[]
} {
  // Sort securities by seniority (lowest number = highest seniority)
  const sortedClasses = [...securityClasses].sort((a, b) => a.seniority - b.seniority)

  // Calculate breakpoints based on liquidation preferences
  const breakpoints: number[] = []
  let cumulativePreference = 0

  // Process preferred shares first to establish liquidation preferences
  sortedClasses
    .filter((sec) => sec.type === 'preferred')
    .forEach((sec) => {
      const preference = sec.shareCount * sec.sharePrice * sec.liquidationPreference
      if (preference > 0) {
        cumulativePreference += preference
        breakpoints.push(cumulativePreference)
      }
    })

  // Create share classes with participation rules
  const shareClasses: ShareClass[] = []

  // Add preferred shares
  sortedClasses
    .filter((sec) => sec.type === 'preferred')
    .forEach((sec) => {
      const preference = sec.shareCount * sec.sharePrice * sec.liquidationPreference
      // Define where this class participates - typically in the preference amount and then pro-rata
      const participation: ParticipationRule[] = []

      // Preferred shares participate in their preference amount
      if (preference > 0) {
        const preferenceIndex = breakpoints.indexOf(preference)

        // Add participation rules for each breakpoint slice where this class participates
        if (preferenceIndex >= 0) {
          participation.push({
            from: preferenceIndex > 0 ? breakpoints[preferenceIndex - 1] : 0,
            to: breakpoints[preferenceIndex],
            sharesParticipating: sec.shareCount,
          })
        }
      }

      // After all preferences are paid, all shares participate
      participation.push({
        from: breakpoints[breakpoints.length - 1] || 0,
        to: Infinity,
        sharesParticipating: sec.shareCount,
      })

      shareClasses.push({
        name: sec.name,
        totalShares: sec.shareCount,
        participation,
      })
    })

  // Add common shares - these only participate after all preferences are paid
  sortedClasses
    .filter((sec) => sec.type === 'common')
    .forEach((sec) => {
      shareClasses.push({
        name: sec.name,
        totalShares: sec.shareCount,
        participation: [
          {
            from: breakpoints[breakpoints.length - 1] || 0, // After all preferences
            to: Infinity,
            sharesParticipating: sec.shareCount,
          },
        ],
      })
    })

  return { breakpoints, shareClasses }
}

/**
 * Calculate backsolve for simple capital structure (common and preferred)
 * @param totalEquityValue - Company equity value
 * @param securityClasses - Array of security classes
 * @param timeToExit - Time to exit in years
 * @param riskFreeRate - Risk-free rate
 * @param volatility - Equity volatility
 * @returns The calculated FMV results
 */
export function calculateBacksolveSimplified(
  totalEquityValue: number,
  securityClasses: Array<{
    id: string
    name: string
    type: 'common' | 'preferred'
    shareCount: number
    liquidationPreference: number
    sharePrice: number
    seniority: number
  }>,
  timeToExit: number,
  riskFreeRate: number,
  volatility: number
): FmvResult[] {
  // First prepare the data in the format needed
  const { breakpoints, shareClasses } = prepareOpmData(securityClasses)

  // Then perform the OPM calculation
  const results = calculateOpmFmv(
    totalEquityValue,
    breakpoints,
    shareClasses,
    timeToExit,
    riskFreeRate,
    volatility
  )

  return results
}

/**
 * Calculate detailed breakpoint analysis for OPM
 * @param totalEquityValue - Total equity value
 * @param shareClasses - Share class data
 * @param breakpoints - Breakpoints for calculation
 * @param timeToLiquidity - Time to exit in years
 * @param riskFreeRate - Risk-free interest rate
 * @param volatility - Equity volatility
 * @returns Detailed breakpoint analysis
 */
export function calculateBreakpointAnalysis(
  totalEquityValue: number,
  shareClasses: ShareClass[],
  breakpoints: number[],
  timeToLiquidity: number,
  riskFreeRate: number,
  volatility: number
): BreakpointDetail[] {
  // Ensure breakpoints are sorted and add 0
  const sortedBreakpoints = Array.from(new Set([0, ...breakpoints])).sort((a, b) => a - b)

  const result: BreakpointDetail[] = []
  let totalSharesOutstanding = 0

  // Calculate total shares across all classes
  shareClasses.forEach((cls) => {
    totalSharesOutstanding += cls.totalShares
  })

  // Calculate values for each breakpoint "slice"
  for (let i = 0; i < sortedBreakpoints.length; i++) {
    const lowerBreakpoint = sortedBreakpoints[i]
    const upperBreakpoint = i + 1 < sortedBreakpoints.length ? sortedBreakpoints[i + 1] : Infinity

    // Calculate d1 and d2 for this breakpoint
    let d1 = 0,
      d2 = 0

    if (volatility > 0 && timeToLiquidity > 0) {
      d1 =
        (Math.log(totalEquityValue / upperBreakpoint) +
          (riskFreeRate + (volatility * volatility) / 2) * timeToLiquidity) /
        (volatility * Math.sqrt(timeToLiquidity))
      d2 = d1 - volatility * Math.sqrt(timeToLiquidity)
    }

    // Calculate option values
    const valueAtLowerK = blackScholesCall(
      totalEquityValue,
      lowerBreakpoint,
      timeToLiquidity,
      riskFreeRate,
      volatility
    )

    const valueAtUpperK =
      upperBreakpoint === Infinity
        ? 0
        : blackScholesCall(
            totalEquityValue,
            upperBreakpoint,
            timeToLiquidity,
            riskFreeRate,
            volatility
          )

    // Incremental value in this slice
    const incrementalValue = valueAtLowerK - valueAtUpperK

    // Find participating shares in this slice
    const sharesParticipation: {
      className: string
      shares: number
      percentOfTotal: number
      incrementalValue: number
      incrementalPercent: number
    }[] = []

    let totalParticipatingShares = 0

    // First, calculate total participating shares in this slice
    shareClasses.forEach((cls) => {
      const participationRule = cls.participation?.find(
        (p) =>
          p.from === lowerBreakpoint &&
          (p.to === upperBreakpoint || (upperBreakpoint === Infinity && p.to === Infinity))
      )

      if (participationRule) {
        totalParticipatingShares += participationRule.sharesParticipating
      }
    })

    if (totalParticipatingShares > 0 && incrementalValue > 0) {
      // Now calculate participation percentages and allocated value
      shareClasses.forEach((cls) => {
        const participationRule = cls.participation?.find(
          (p) =>
            p.from === lowerBreakpoint &&
            (p.to === upperBreakpoint || (upperBreakpoint === Infinity && p.to === Infinity))
        )

        if (participationRule && participationRule.sharesParticipating > 0) {
          const percentOfTotal =
            (participationRule.sharesParticipating / totalParticipatingShares) * 100
          const allocatedValue = (incrementalValue * percentOfTotal) / 100

          sharesParticipation.push({
            className: cls.name,
            shares: participationRule.sharesParticipating,
            percentOfTotal: percentOfTotal,
            incrementalValue: allocatedValue,
            incrementalPercent: (allocatedValue / incrementalValue) * 100,
          })
        } else {
          // Class doesn't participate in this slice
          sharesParticipation.push({
            className: cls.name,
            shares: 0,
            percentOfTotal: 0,
            incrementalValue: 0,
            incrementalPercent: 0,
          })
        }
      })
    }

    result.push({
      from: lowerBreakpoint,
      to: upperBreakpoint === Infinity ? Number.MAX_SAFE_INTEGER : upperBreakpoint,
      d1,
      d2,
      optionValue: valueAtLowerK,
      incrementalValue,
      sharesParticipation,
    })
  }

  return result
}
