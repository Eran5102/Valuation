export function generateProjectionLabels(
  mostRecentFiscalYearEnd: string,
  fiscalYearEnd: string,
  forecastPeriod: number
): string[] {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  return Array.from({ length: forecastPeriod }, (_, i) => `${currentYear + i}`)
}

export function generateFiscalYearLabels(
  mostRecentFiscalYearEnd: string,
  fiscalYearEnd: string,
  forecastPeriod: number
): string[] {
  const mostRecentYear = new Date(mostRecentFiscalYearEnd).getFullYear()

  return Array.from({ length: forecastPeriod }, (_, i) => `FY${mostRecentYear + i + 1}`)
}

export function generateHistoricalFiscalYearLabels(
  mostRecentFiscalYearEnd: string,
  historicalYears: number = 3
): string[] {
  const mostRecentYear = new Date(mostRecentFiscalYearEnd).getFullYear()

  return Array.from(
    { length: historicalYears },
    (_, i) => `FY${mostRecentYear - (historicalYears - 1 - i)}`
  )
}
