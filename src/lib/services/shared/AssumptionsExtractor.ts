/**
 * Assumptions Extractor
 *
 * Centralized utility for extracting assumption values from the assumptions array.
 * Used across OPM, DLOM, and any other models that require Black-Scholes parameters.
 *
 * This ensures a single source of truth for assumptions extraction and eliminates
 * duplicate logic across frontend and backend.
 *
 * @module AssumptionsExtractor
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'

/**
 * Black-Scholes parameters extracted from assumptions
 */
export interface ExtractedBlackScholesParams {
  volatility: number // As decimal (0.60 = 60%)
  riskFreeRate: number // As decimal (0.045 = 4.5%)
  timeToLiquidity: number // In years
  dividendYield: number // As decimal (always 0 unless specified)
}

/**
 * Assumption category and field mapping
 */
export const ASSUMPTION_MAPPINGS = {
  VOLATILITY: {
    category: 'volatility_assumptions',
    field: 'equity_volatility',
    default: 60, // 60%
    convertToDecimal: true, // Divide by 100
  },
  RISK_FREE_RATE: {
    category: 'discount_rates',
    field: 'risk_free_rate',
    default: 4.5, // 4.5%
    convertToDecimal: true,
  },
  TIME_TO_LIQUIDITY: {
    category: 'volatility_assumptions',
    field: 'time_to_liquidity',
    default: 3.0, // 3 years
    convertToDecimal: false,
  },
  DIVIDEND_YIELD: {
    category: 'dividend_assumptions',
    field: 'dividend_yield',
    default: 0, // 0%
    convertToDecimal: true,
  },
} as const

/**
 * Validation result for extracted assumptions
 */
export interface AssumptionValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  extractedValues: ExtractedBlackScholesParams
}

/**
 * AssumptionsExtractor
 *
 * Provides centralized logic for extracting assumption values
 */
export class AssumptionsExtractor {
  /**
   * Extract Black-Scholes parameters from assumptions array
   *
   * @param assumptions - Array of assumption categories from database
   * @param overrides - Optional parameter overrides
   * @returns Extracted Black-Scholes parameters
   *
   * @example
   * ```typescript
   * const assumptions = valuation.assumptions
   * const bsParams = AssumptionsExtractor.extractBlackScholesParams(assumptions)
   * // { volatility: 0.60, riskFreeRate: 0.045, timeToLiquidity: 3.0, dividendYield: 0 }
   * ```
   */
  static extractBlackScholesParams(
    assumptions: any[] | null | undefined,
    overrides?: Partial<ExtractedBlackScholesParams>
  ): ExtractedBlackScholesParams {
    const extracted = {
      volatility: this.extractVolatility(assumptions),
      riskFreeRate: this.extractRiskFreeRate(assumptions),
      timeToLiquidity: this.extractTimeToLiquidity(assumptions),
      dividendYield: this.extractDividendYield(assumptions),
    }

    return { ...extracted, ...overrides }
  }

  /**
   * Extract equity volatility from assumptions
   */
  static extractVolatility(assumptions: any[] | null | undefined): number {
    const mapping = ASSUMPTION_MAPPINGS.VOLATILITY
    const value = this.getAssumptionValue(
      assumptions,
      mapping.category,
      mapping.field,
      mapping.default
    )
    return mapping.convertToDecimal ? value / 100 : value
  }

  /**
   * Extract risk-free rate from assumptions
   */
  static extractRiskFreeRate(assumptions: any[] | null | undefined): number {
    const mapping = ASSUMPTION_MAPPINGS.RISK_FREE_RATE
    const value = this.getAssumptionValue(
      assumptions,
      mapping.category,
      mapping.field,
      mapping.default
    )
    return mapping.convertToDecimal ? value / 100 : value
  }

  /**
   * Extract time to liquidity from assumptions
   */
  static extractTimeToLiquidity(assumptions: any[] | null | undefined): number {
    const mapping = ASSUMPTION_MAPPINGS.TIME_TO_LIQUIDITY
    return this.getAssumptionValue(assumptions, mapping.category, mapping.field, mapping.default)
  }

  /**
   * Extract dividend yield from assumptions
   */
  static extractDividendYield(assumptions: any[] | null | undefined): number {
    const mapping = ASSUMPTION_MAPPINGS.DIVIDEND_YIELD
    const value = this.getAssumptionValue(
      assumptions,
      mapping.category,
      mapping.field,
      mapping.default
    )
    return mapping.convertToDecimal ? value / 100 : value
  }

  /**
   * Core extraction logic - searches through assumption categories
   *
   * This replicates the existing logic from OPMBacksolve.tsx lines 60-77
   * and route.ts lines 52-66, ensuring consistent behavior.
   *
   * @param assumptions - Array of assumption categories
   * @param categoryId - Category ID to search in
   * @param assumptionId - Assumption field ID
   * @param defaultValue - Default value if not found
   * @returns Extracted value or default
   */
  private static getAssumptionValue(
    assumptions: any[] | null | undefined,
    categoryId: string,
    assumptionId: string,
    defaultValue: number
  ): number {
    // Return default if assumptions is null/undefined or not an array
    if (!assumptions || !Array.isArray(assumptions)) {
      return defaultValue
    }

    // Search through all categories for the assumption
    for (const category of assumptions) {
      if (category.assumptions && Array.isArray(category.assumptions)) {
        const assumption = category.assumptions.find((ass: any) => ass.id === assumptionId)

        // Check if assumption exists and has a valid value
        if (assumption && assumption.value !== undefined && assumption.value !== '') {
          const parsed = parseFloat(assumption.value)
          return isNaN(parsed) ? defaultValue : parsed
        }
      }
    }

    return defaultValue
  }

  /**
   * Validate extracted Black-Scholes parameters
   *
   * @param params - Parameters to validate
   * @returns Validation result with errors/warnings
   */
  static validate(params: ExtractedBlackScholesParams): AssumptionValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Volatility validation
    if (params.volatility <= 0) {
      errors.push('Volatility must be greater than 0')
    } else if (params.volatility < 0.1) {
      warnings.push('Volatility is very low (< 10%), which may be unrealistic for startups')
    } else if (params.volatility > 2.0) {
      warnings.push('Volatility is very high (> 200%), which may be unrealistic')
    }

    // Risk-free rate validation
    if (params.riskFreeRate < 0) {
      errors.push('Risk-free rate cannot be negative')
    } else if (params.riskFreeRate > 0.2) {
      warnings.push('Risk-free rate is very high (> 20%), which may be unrealistic')
    }

    // Time to liquidity validation
    if (params.timeToLiquidity <= 0) {
      errors.push('Time to liquidity must be greater than 0')
    } else if (params.timeToLiquidity < 0.25) {
      warnings.push('Time to liquidity is very short (< 3 months)')
    } else if (params.timeToLiquidity > 10) {
      warnings.push('Time to liquidity is very long (> 10 years)')
    }

    // Dividend yield validation (usually 0 for startups)
    if (params.dividendYield < 0) {
      errors.push('Dividend yield cannot be negative')
    } else if (params.dividendYield > 0.1) {
      warnings.push(
        'Dividend yield is high (> 10%), which is unusual for startups (most have 0% dividend yield)'
      )
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      extractedValues: params,
    }
  }

  /**
   * Format assumptions for display
   *
   * @param params - Parameters to format
   * @returns Human-readable string summary
   */
  static formatForDisplay(params: ExtractedBlackScholesParams): string {
    return `Volatility: ${(params.volatility * 100).toFixed(1)}%, Risk-Free Rate: ${(params.riskFreeRate * 100).toFixed(2)}%, Time to Liquidity: ${params.timeToLiquidity.toFixed(1)} years, Dividend Yield: ${(params.dividendYield * 100).toFixed(2)}%`
  }

  /**
   * Check if assumptions have changed (for useEffect dependencies)
   *
   * @param prev - Previous assumptions array
   * @param current - Current assumptions array
   * @returns True if assumptions have changed
   */
  static haveAssumptionsChanged(
    prev: any[] | null | undefined,
    current: any[] | null | undefined
  ): boolean {
    // Extract params from both
    const prevParams = this.extractBlackScholesParams(prev)
    const currentParams = this.extractBlackScholesParams(current)

    // Compare each field
    return (
      prevParams.volatility !== currentParams.volatility ||
      prevParams.riskFreeRate !== currentParams.riskFreeRate ||
      prevParams.timeToLiquidity !== currentParams.timeToLiquidity ||
      prevParams.dividendYield !== currentParams.dividendYield
    )
  }

  /**
   * Get assumption source info for display
   *
   * @param assumptions - Assumptions array
   * @returns Object with source info for each parameter
   */
  static getSourceInfo(assumptions: any[] | null | undefined): {
    volatility: { source: 'assumptions' | 'default'; value: number }
    riskFreeRate: { source: 'assumptions' | 'default'; value: number }
    timeToLiquidity: { source: 'assumptions' | 'default'; value: number }
    dividendYield: { source: 'assumptions' | 'default'; value: number }
  } {
    const checkSource = (categoryId: string, fieldId: string, defaultValue: number) => {
      if (!assumptions || !Array.isArray(assumptions)) {
        return { source: 'default' as const, value: defaultValue }
      }

      for (const category of assumptions) {
        if (category.assumptions && Array.isArray(category.assumptions)) {
          const assumption = category.assumptions.find((ass: any) => ass.id === fieldId)
          if (assumption && assumption.value !== undefined && assumption.value !== '') {
            const value = parseFloat(assumption.value)
            if (!isNaN(value)) {
              return { source: 'assumptions' as const, value }
            }
          }
        }
      }

      return { source: 'default' as const, value: defaultValue }
    }

    return {
      volatility: checkSource(
        ASSUMPTION_MAPPINGS.VOLATILITY.category,
        ASSUMPTION_MAPPINGS.VOLATILITY.field,
        ASSUMPTION_MAPPINGS.VOLATILITY.default
      ),
      riskFreeRate: checkSource(
        ASSUMPTION_MAPPINGS.RISK_FREE_RATE.category,
        ASSUMPTION_MAPPINGS.RISK_FREE_RATE.field,
        ASSUMPTION_MAPPINGS.RISK_FREE_RATE.default
      ),
      timeToLiquidity: checkSource(
        ASSUMPTION_MAPPINGS.TIME_TO_LIQUIDITY.category,
        ASSUMPTION_MAPPINGS.TIME_TO_LIQUIDITY.field,
        ASSUMPTION_MAPPINGS.TIME_TO_LIQUIDITY.default
      ),
      dividendYield: checkSource(
        ASSUMPTION_MAPPINGS.DIVIDEND_YIELD.category,
        ASSUMPTION_MAPPINGS.DIVIDEND_YIELD.field,
        ASSUMPTION_MAPPINGS.DIVIDEND_YIELD.default
      ),
    }
  }
}
