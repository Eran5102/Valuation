import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates statistical summary metrics (mean, median, 25th and 75th percentiles) for an array of values
 *
 * @param values - Array of numeric values to analyze
 * @returns Object containing mean, median, 25th percentile and 75th percentile values
 */
export function calculateStatisticalSummary(values: number[]) {
  if (values.length === 0) {
    return { mean: 0, median: 0, percentile25: 0, percentile75: 0 }
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const mean = values.reduce((a, b) => a + b, 0) / values.length

  // Median calculation
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[values.length / 2 - 1] + sortedValues[values.length / 2]) / 2
      : sortedValues[Math.floor(values.length / 2)]

  // 25th and 75th percentile calculations
  const percentile25Index = Math.floor(values.length * 0.25)
  const percentile75Index = Math.floor(values.length * 0.75)

  const percentile25 = sortedValues[percentile25Index]
  const percentile75 = sortedValues[percentile75Index]

  return { mean, median, percentile25, percentile75 }
}
