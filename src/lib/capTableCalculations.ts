import { ShareClass } from '@/types'

/**
 * Calculates the amount invested for a share class
 *
 * @param {ShareClass} shareClass - The share class object containing shares and price information
 * @returns {number} The total amount invested (sharesOutstanding * pricePerShare)
 *
 * @example
 * const shareClass = { sharesOutstanding: 1000, pricePerShare: 10 }
 * calculateAmountInvested(shareClass) // Returns 10000
 */
export function calculateAmountInvested(shareClass: ShareClass): number {
  return shareClass.sharesOutstanding * shareClass.pricePerShare
}

/**
 * Calculates the total liquidation preference
 * Formula: amountInvested * lpMultiple
 * Note: Common shares don't have liquidation preference
 */
export function calculateTotalLP(shareClass: ShareClass): number {
  // Common shares don't have liquidation preference
  if (shareClass.shareType === 'common') {
    return 0
  }
  const amountInvested = calculateAmountInvested(shareClass)
  return amountInvested * (shareClass.lpMultiple || 1)
}

/**
 * Calculates the as-converted shares
 * Formula: sharesOutstanding * conversionRatio
 */
export function calculateAsConvertedShares(shareClass: ShareClass): number {
  return shareClass.sharesOutstanding * shareClass.conversionRatio
}

/**
 * Calculates total dividends from round date to present
 * Only applies if dividendsDeclared is true
 */
export function calculateTotalDividends(shareClass: ShareClass): number {
  if (!shareClass.dividendsDeclared || !shareClass.dividendsRate || !shareClass.roundDate) {
    return 0
  }

  const roundDate = new Date(shareClass.roundDate)
  const currentDate = new Date()
  const yearsElapsed =
    (currentDate.getTime() - roundDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  const amountInvested = calculateAmountInvested(shareClass)

  if (shareClass.dividendsType === 'cumulative') {
    // Cumulative: all dividends accrue regardless of payment
    return amountInvested * shareClass.dividendsRate * yearsElapsed
  } else if (shareClass.dividendsType === 'non-cumulative') {
    // Non-cumulative: typically calculated annually, not compounded over unpaid periods
    // For simplicity, we'll calculate as if paid annually
    return amountInvested * shareClass.dividendsRate * yearsElapsed
  }

  return 0
}

/**
 * Enhances a share class with calculated fields
 */
export function enhanceShareClassWithCalculations(shareClass: ShareClass): ShareClass {
  const enhanced: ShareClass = {
    ...shareClass,
    amountInvested: calculateAmountInvested(shareClass),
    totalLP: calculateTotalLP(shareClass),
    asConvertedShares: calculateAsConvertedShares(shareClass),
    totalDividends: calculateTotalDividends(shareClass),
  }

  return enhanced
}

/**
 * Enhances an array of share classes with calculated fields
 */
export function enhanceShareClassesWithCalculations(shareClasses: ShareClass[]): ShareClass[] {
  return shareClasses.map(enhanceShareClassWithCalculations)
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formats number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Formats percentage
 */
export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

/**
 * Validates share class data
 */
export function validateShareClass(shareClass: Partial<ShareClass>): string[] {
  const errors: string[] = []

  if (!shareClass.name) {
    errors.push('Class name is required')
  }

  if (!shareClass.sharesOutstanding || shareClass.sharesOutstanding <= 0) {
    errors.push('Shares outstanding must be greater than 0')
  }

  if (shareClass.pricePerShare === undefined || shareClass.pricePerShare < 0) {
    errors.push('Price per share must be 0 or greater')
  }

  // Only validate LP Multiple for preferred shares
  if (
    shareClass.shareType === 'preferred' &&
    (!shareClass.lpMultiple || shareClass.lpMultiple <= 0)
  ) {
    errors.push('LP Multiple must be greater than 0 for preferred shares')
  }

  if (
    shareClass.preferenceType === 'participating-with-cap' &&
    (!shareClass.participationCap || shareClass.participationCap <= 0)
  ) {
    errors.push('Participation cap is required for participating-with-cap preference type')
  }

  if (shareClass.dividendsDeclared && !shareClass.dividendsRate) {
    errors.push('Dividends rate is required when dividends are declared')
  }

  if (shareClass.dividendsDeclared && !shareClass.dividendsType) {
    errors.push('Dividends type is required when dividends are declared')
  }

  return errors
}
