/**
 * Format options for currency formatting
 */
export interface CurrencyFormatOptions {
  currency?: string
  unitMultiplier?: number
  decimals?: number
  showNegative?: boolean
}

/**
 * Formats a number as currency with the specified currency symbol and locale
 * @param value - The numeric value to format
 * @param optionsOrCurrency - Currency code (e.g., 'USD', 'EUR') or options object
 * @param decimalsOrLocale - Number of decimals or locale string
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  optionsOrCurrency: string | CurrencyFormatOptions = 'USD',
  decimalsOrLocale: number | string = 'en-US'
): string {
  // Default options
  let currency = 'USD'
  let unitMultiplier = 1
  let maximumFractionDigits = 0
  let showNegative = true
  let locale = 'en-US'

  // Handle options object or string for currency
  if (typeof optionsOrCurrency === 'object') {
    currency = optionsOrCurrency.currency || currency
    unitMultiplier = optionsOrCurrency.unitMultiplier || unitMultiplier
    maximumFractionDigits =
      optionsOrCurrency.decimals !== undefined ? optionsOrCurrency.decimals : maximumFractionDigits
    showNegative =
      optionsOrCurrency.showNegative !== undefined ? optionsOrCurrency.showNegative : showNegative
  } else if (typeof optionsOrCurrency === 'string') {
    currency = optionsOrCurrency
  }

  // Handle decimals or locale
  if (typeof decimalsOrLocale === 'number') {
    maximumFractionDigits = decimalsOrLocale
  } else if (typeof decimalsOrLocale === 'string') {
    locale = decimalsOrLocale
  }

  // Apply unit multiplier
  const scaledValue = value / unitMultiplier

  // Format the value
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(scaledValue)

  // Handle negative values display
  if (!showNegative && scaledValue < 0) {
    return formatted.replace('-', '')
  }

  return formatted
}

/**
 * Format options for percentage formatting
 */
export interface PercentFormatOptions {
  decimals?: number
  includeSign?: boolean
}

/**
 * Formats a number as a percentage with the specified number of decimal places
 * @param value - The numeric value to format (e.g., 0.05 for 5%)
 * @param decimalsOrOptions - Number of decimal places to show (defaults to 1) or options object
 * @param includeSign - Whether to include the percentage sign (defaults to true)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  decimalsOrOptions: number | PercentFormatOptions = 1,
  includeSign: boolean = true
): string {
  let decimals = 1
  let showSign = includeSign

  // Handle options object or number
  if (typeof decimalsOrOptions === 'object') {
    decimals = decimalsOrOptions.decimals !== undefined ? decimalsOrOptions.decimals : decimals
    showSign =
      decimalsOrOptions.includeSign !== undefined ? decimalsOrOptions.includeSign : showSign
  } else if (typeof decimalsOrOptions === 'number') {
    decimals = decimalsOrOptions
  }

  const formatted = (value * 100).toFixed(decimals)
  return showSign ? `${formatted}%` : formatted
}

/**
 * Format options for number formatting
 */
export interface NumberFormatOptions {
  decimals?: number
  useThousandsSeparator?: boolean
}

/**
 * Formats a number with the specified number of decimal places and optional thousands separator
 * @param value - The numeric value to format
 * @param decimalsOrOptions - Number of decimal places to show (defaults to 2) or options object
 * @param useThousandsSeparator - Whether to include thousands separators (defaults to true)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  decimalsOrOptions: number | NumberFormatOptions = 2,
  useThousandsSeparator: boolean = true
): string {
  let decimals = 2
  let useSeparator = useThousandsSeparator

  // Handle options object or number
  if (typeof decimalsOrOptions === 'object') {
    decimals = decimalsOrOptions.decimals !== undefined ? decimalsOrOptions.decimals : decimals
    useSeparator =
      decimalsOrOptions.useThousandsSeparator !== undefined
        ? decimalsOrOptions.useThousandsSeparator
        : useSeparator
  } else if (typeof decimalsOrOptions === 'number') {
    decimals = decimalsOrOptions
  }

  // Format the value
  if (useSeparator) {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
    return new Intl.NumberFormat('en-US', options).format(value)
  } else {
    return value.toFixed(decimals)
  }
}

/**
 * Formats a date object using a locale-specific format
 * @param date - The date object to format
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: string = 'en-US'): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Alias for formatCurrency to maintain backward compatibility
 */
export const getFormattedCurrency = formatCurrency
