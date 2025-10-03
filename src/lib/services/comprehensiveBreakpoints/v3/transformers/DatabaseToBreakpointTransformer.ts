/**
 * Database to Breakpoint Transformer
 *
 * Transforms database valuation data (ShareClass, OptionsWarrant) into
 * CapTableSnapshot format required by breakpoint analyzer.
 *
 * Transformation Steps:
 * 1. Fetch share classes and options from database
 * 2. Transform preferred series with all fields
 * 3. Transform common stock
 * 4. Transform options/warrants
 * 5. Package into CapTableSnapshot
 *
 * @module DatabaseToBreakpointTransformer
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import {
  CapTableSnapshot,
  PreferredShareClass,
  CommonStock,
  OptionGrant,
  PreferenceType,
} from '../types/CapTableTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import type { ShareClass, OptionsWarrant } from '@/types/database'

/**
 * Transformation result
 */
export interface TransformationResult {
  capTable: CapTableSnapshot
  errors: string[]
  warnings: string[]
  metadata: {
    totalPreferredSeries: number
    totalCommonShares: Decimal
    totalOptions: number
  }
}

/**
 * DatabaseToBreakpointTransformer
 *
 * Transforms database data to breakpoint format
 */
export class DatabaseToBreakpointTransformer {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Transform database data to cap table snapshot
   */
  transform(shareClasses: ShareClass[], options: OptionsWarrant[]): TransformationResult {
    this.auditLogger.step('Transforming database data to cap table snapshot')

    const errors: string[] = []
    const warnings: string[] = []

    // Separate preferred and common
    const preferredData = shareClasses.filter((sc) => sc.type === 'Preferred')
    const commonData = shareClasses.filter((sc) => sc.type === 'Common')

    // Transform preferred series
    const preferredSeries: PreferredShareClass[] = []
    for (const pref of preferredData) {
      try {
        const transformed = this.transformPreferredSeries(pref)
        preferredSeries.push(transformed)
      } catch (error) {
        errors.push(
          `Failed to transform preferred series ${pref.class_name}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    // Transform common stock
    let commonStock: CommonStock
    try {
      commonStock = this.transformCommonStock(commonData)
    } catch (error) {
      errors.push(
        `Failed to transform common stock: ${error instanceof Error ? error.message : String(error)}`
      )
      // Fallback to zero common
      commonStock = {
        sharesOutstanding: DecimalHelpers.toDecimal(0),
      }
    }

    // Transform options
    const optionGrants: OptionGrant[] = []
    for (const opt of options) {
      try {
        const transformed = this.transformOption(opt)
        optionGrants.push(transformed)
      } catch (error) {
        errors.push(
          `Failed to transform option ${opt.grantee_name || opt.id}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    // Create cap table snapshot
    const capTable: CapTableSnapshot = {
      preferredSeries,
      commonStock,
      options: optionGrants,
    }

    // Calculate metadata
    const totalCommonShares = commonStock.sharesOutstanding
    const metadata = {
      totalPreferredSeries: preferredSeries.length,
      totalCommonShares,
      totalOptions: optionGrants.length,
    }

    this.auditLogger.info('Database Transform', 'Transformation complete', {
      preferredSeries: preferredSeries.length,
      commonShares: totalCommonShares.toString(),
      options: optionGrants.length,
      errors: errors.length,
      warnings: warnings.length,
    })

    return {
      capTable,
      errors,
      warnings,
      metadata,
    }
  }

  /**
   * Transform preferred series
   */
  private transformPreferredSeries(data: ShareClass): PreferredShareClass {
    // Map preference type
    const preferenceType = this.mapParticipationType(data.preference_type, data.participation)

    // Calculate liquidation preference
    const totalLiquidationPreference = DecimalHelpers.toDecimal(data.liquidation_preference)

    // Get participation cap
    let participationCap: Decimal | null = null
    if (preferenceType === 'participating-with-cap' && data.participation_cap) {
      participationCap = DecimalHelpers.toDecimal(data.participation_cap)
    }

    const preferredSeries: PreferredShareClass = {
      id: data.id,
      name: data.class_name,
      shareType: 'preferred',
      sharesOutstanding: DecimalHelpers.toDecimal(data.shares),
      pricePerShare: DecimalHelpers.toDecimal(data.price_per_share),
      liquidationMultiple: data.liquidation_multiple || 1,
      totalLiquidationPreference,
      seniority: data.seniority_rank ?? data.seniority ?? 0,
      preferenceType,
      participationCap,
      conversionRatio: data.conversion_ratio || 1,
      roundDate: data.round_date ? new Date(data.round_date) : new Date(),
      dividendsDeclared: data.dividends_declared || false,
      dividendsRate: data.div_rate ? DecimalHelpers.toDecimal(data.div_rate) : null,
      dividendsType: this.mapDividendsType(data.dividends_type),
      pik: data.pik || false,
    }

    return preferredSeries
  }

  /**
   * Transform common stock
   */
  private transformCommonStock(commonData: ShareClass[]): CommonStock {
    // Sum all common stock shares
    const totalShares = commonData.reduce(
      (sum, c) => sum.plus(DecimalHelpers.toDecimal(c.shares)),
      DecimalHelpers.toDecimal(0)
    )

    return {
      sharesOutstanding: totalShares,
    }
  }

  /**
   * Transform option
   */
  private transformOption(data: OptionsWarrant): OptionGrant {
    return {
      id: data.id,
      poolName: data.grantee_name || `${data.type} Pool ${data.id.slice(0, 8)}`,
      numOptions: DecimalHelpers.toDecimal(data.num_options),
      exercisePrice: DecimalHelpers.toDecimal(data.exercise_price),
      vested: DecimalHelpers.toDecimal(data.num_options), // Assume all vested for now
      optionType: data.type === 'Options' ? 'iso' : data.type === 'Warrants' ? 'warrant' : 'other',
      grantDate: data.grant_date ? new Date(data.grant_date) : new Date(),
      expirationDate: data.expiration_date ? new Date(data.expiration_date) : null,
      vestingSchedule: data.vesting_schedule || null,
    }
  }

  /**
   * Map database preference type to participation type
   */
  private mapParticipationType(
    preferenceType: string | null | undefined,
    participation: boolean
  ): PreferenceType {
    // Handle null/undefined
    if (!preferenceType) {
      return participation ? 'participating' : 'non-participating'
    }

    // Normalize the preference type
    const normalized = preferenceType.toLowerCase().trim()

    if (normalized.includes('non-participating') || normalized.includes('non participating')) {
      return 'non-participating'
    }

    if (
      normalized.includes('participating with cap') ||
      normalized.includes('participating_with_cap')
    ) {
      return 'participating-with-cap'
    }

    if (normalized.includes('participating')) {
      return 'participating'
    }

    // Fallback based on participation boolean
    return participation ? 'participating' : 'non-participating'
  }

  /**
   * Map database dividends type
   */
  private mapDividendsType(
    dividendsType: string | null | undefined
  ): 'none' | 'cumulative' | 'non_cumulative' {
    if (!dividendsType) {
      return 'none'
    }

    const normalized = dividendsType.toLowerCase().trim()

    if (normalized === 'cumulative') {
      return 'cumulative'
    }

    if (normalized === 'non-cumulative' || normalized === 'non_cumulative') {
      return 'non_cumulative'
    }

    return 'none'
  }

  /**
   * Validate transformation
   */
  validate(result: TransformationResult): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = [...result.errors]

    // Check for errors in transformation
    if (result.errors.length > 0) {
      return { valid: false, errors }
    }

    // Check cap table has data
    if (
      result.capTable.preferredSeries.length === 0 &&
      DecimalHelpers.isZero(result.capTable.commonStock.sharesOutstanding)
    ) {
      errors.push('Cap table has no preferred series and no common stock')
    }

    // Check for negative values
    for (const series of result.capTable.preferredSeries) {
      if (series.sharesOutstanding.lt(0)) {
        errors.push(`${series.name} has negative shares`)
      }
      if (series.pricePerShare.lt(0)) {
        errors.push(`${series.name} has negative price per share`)
      }
      if (series.totalLiquidationPreference.lt(0)) {
        errors.push(`${series.name} has negative liquidation preference`)
      }
    }

    if (result.capTable.commonStock.sharesOutstanding.lt(0)) {
      errors.push('Common stock has negative shares')
    }

    for (const pool of result.capTable.options) {
      if (pool.numOptions.lt(0)) {
        errors.push(`${pool.poolName} has negative number of options`)
      }
      if (pool.strikePrice.lt(0)) {
        errors.push(`${pool.poolName} has negative strike price`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
