import { DLOMCalculationService } from '@/services/dlomCalculations'

export interface FieldMapping {
  sourceModule:
    | 'assumptions'
    | 'company'
    | 'valuation'
    | 'capTable'
    | 'dlom'
    | 'calculated'
    | 'manual'
  sourcePath: string
  transformer?: (value: any, context?: any) => any
  validator?: (value: any) => boolean
  fallback?: any
  required?: boolean
}

export interface TemplateFieldMappings {
  [templateFieldId: string]: FieldMapping
}

export interface ValuationContext {
  valuation: any
  company: any
  assumptions: any
  capTable: any
  dlomResults?: any
  metadata?: any
}

/**
 * Centralized service for mapping valuation data to template fields
 * Supports extensible field mappings and dynamic data population
 */
export class TemplateDataMapper {
  private static instance: TemplateDataMapper
  private fieldMappings: TemplateFieldMappings = {}
  private dlomService: DLOMCalculationService

  constructor() {
    this.dlomService = new DLOMCalculationService()
    this.initializeStandardMappings()
  }

  static getInstance(): TemplateDataMapper {
    if (!TemplateDataMapper.instance) {
      TemplateDataMapper.instance = new TemplateDataMapper()
    }
    return TemplateDataMapper.instance
  }

  /**
   * Initialize standard field mappings for 409A template
   */
  private initializeStandardMappings(): void {
    this.fieldMappings = {
      // Company Information
      company_name: {
        sourceModule: 'company',
        sourcePath: 'name',
        required: true,
      },
      company_address: {
        sourceModule: 'company',
        sourcePath: 'location',
        fallback: 'Address not provided',
      },
      company_ein: {
        sourceModule: 'company',
        sourcePath: 'ein',
        fallback: 'EIN not provided',
      },
      company_description: {
        sourceModule: 'company',
        sourcePath: 'description',
        fallback: 'Company description not available',
      },
      company_industry: {
        sourceModule: 'company',
        sourcePath: 'industry',
        fallback: 'Technology',
      },
      company_email: {
        sourceModule: 'company',
        sourcePath: 'email',
        fallback: 'Email not provided',
      },
      company_phone: {
        sourceModule: 'company',
        sourcePath: 'phone',
        fallback: 'Phone not provided',
      },
      company_contact_person: {
        sourceModule: 'company',
        sourcePath: 'contact_person',
        fallback: 'Contact person not specified',
      },
      company_state: {
        sourceModule: 'company',
        sourcePath: 'stateOfIncorporation',
        fallback: 'Delaware',
      },
      company_incorporation_date: {
        sourceModule: 'company',
        sourcePath: 'foundedDate',
        transformer: (date) => this.formatDate(date, 'MM/DD/YYYY'),
      },
      company_fiscal_year_end: {
        sourceModule: 'assumptions',
        sourcePath: 'general.fiscal_year_end',
        transformer: (month) => `${month}/31`,
      },
      company_stage: {
        sourceModule: 'assumptions',
        sourcePath: 'general.stage',
        fallback: 'Growth Stage',
      },
      company_employees: {
        sourceModule: 'company',
        sourcePath: 'employees',
        fallback: 0,
      },

      // Valuation Details
      valuation_date: {
        sourceModule: 'valuation',
        sourcePath: 'valuationDate',
        transformer: (date) => this.formatDate(date, 'MMMM DD, YYYY'),
        required: true,
      },
      report_date: {
        sourceModule: 'calculated',
        sourcePath: 'current_date',
        transformer: () => this.formatDate(new Date(), 'MMMM DD, YYYY'),
      },
      valuation_purpose: {
        sourceModule: 'manual',
        sourcePath: 'valuation_purpose',
        fallback: 'Section 409A of the Internal Revenue Code',
      },
      standard_of_value: {
        sourceModule: 'manual',
        sourcePath: 'standard_of_value',
        fallback: 'Fair Market Value',
      },
      premise_of_value: {
        sourceModule: 'manual',
        sourcePath: 'premise_of_value',
        fallback: 'Going Concern',
      },

      // Financial Metrics
      revenue_current: {
        sourceModule: 'assumptions',
        sourcePath: 'financial_metrics.revenue_current',
        transformer: (value) => this.formatCurrency(value),
      },
      revenue_prior: {
        sourceModule: 'assumptions',
        sourcePath: 'financial_metrics.revenue_prior',
        transformer: (value) => this.formatCurrency(value),
      },
      revenue_growth: {
        sourceModule: 'calculated',
        sourcePath: 'revenue_growth',
        transformer: (_, context) => this.calculateRevenueGrowth(context),
      },
      gross_margin: {
        sourceModule: 'assumptions',
        sourcePath: 'financial_metrics.gross_margin',
        transformer: (value) => this.formatPercentage(value),
      },
      operating_margin: {
        sourceModule: 'assumptions',
        sourcePath: 'financial_metrics.operating_margin',
        transformer: (value) => this.formatPercentage(value),
      },
      cash_balance: {
        sourceModule: 'assumptions',
        sourcePath: 'financial_metrics.cash_balance',
        transformer: (value) => this.formatCurrency(value),
        required: true,
      },
      burn_rate: {
        sourceModule: 'assumptions',
        sourcePath: 'financial_metrics.burn_rate',
        transformer: (value) => this.formatCurrency(value),
      },
      runway_months: {
        sourceModule: 'assumptions',
        sourcePath: 'financial_metrics.runway_months',
      },

      // Funding Information
      total_funding: {
        sourceModule: 'calculated',
        sourcePath: 'total_funding',
        transformer: (_, context) => this.calculateTotalFunding(context),
      },
      last_round_date: {
        sourceModule: 'assumptions',
        sourcePath: 'backsolve.last_round_date',
        transformer: (date) => this.formatDate(date, 'MM/DD/YYYY'),
      },
      last_round_amount: {
        sourceModule: 'assumptions',
        sourcePath: 'backsolve.last_round_amount',
        transformer: (value) => this.formatCurrency(value),
      },
      last_round_valuation: {
        sourceModule: 'assumptions',
        sourcePath: 'backsolve.last_round_premoney',
        transformer: (value) => this.formatCurrency(value),
      },
      preferred_liquidation: {
        sourceModule: 'calculated',
        sourcePath: 'preferred_liquidation',
        transformer: (_, context) => this.calculatePreferredLiquidation(context),
      },

      // Share Information
      common_shares_outstanding: {
        sourceModule: 'calculated',
        sourcePath: 'common_shares',
        transformer: (_, context) => this.calculateCommonShares(context),
        required: true,
      },
      preferred_shares_outstanding: {
        sourceModule: 'calculated',
        sourcePath: 'preferred_shares',
        transformer: (_, context) => this.calculatePreferredShares(context),
      },
      options_outstanding: {
        sourceModule: 'calculated',
        sourcePath: 'options_outstanding',
        transformer: (_, context) => this.calculateOptionsOutstanding(context),
        required: true,
      },
      warrants_outstanding: {
        sourceModule: 'calculated',
        sourcePath: 'warrants_outstanding',
        transformer: (_, context) => this.calculateWarrantsOutstanding(context),
      },
      fully_diluted_shares: {
        sourceModule: 'calculated',
        sourcePath: 'fully_diluted_shares',
        transformer: (_, context) => this.calculateFullyDilutedShares(context),
        required: true,
      },
      option_pool_size: {
        sourceModule: 'calculated',
        sourcePath: 'option_pool_size',
        transformer: (_, context) => this.calculateOptionPoolSize(context),
      },

      // Methodology
      primary_methodology: {
        sourceModule: 'manual',
        sourcePath: 'primary_methodology',
        fallback: 'Option Pricing Model',
      },
      secondary_methodology: {
        sourceModule: 'manual',
        sourcePath: 'secondary_methodology',
        fallback: 'Market Approach',
      },
      volatility: {
        sourceModule: 'assumptions',
        sourcePath: 'volatility_assumptions.equity_volatility',
        transformer: (value) => this.formatPercentage(value),
        required: true,
      },
      risk_free_rate: {
        sourceModule: 'assumptions',
        sourcePath: 'discount_rates.risk_free_rate',
        transformer: (value) => this.formatPercentage(value),
        required: true,
      },
      expected_term: {
        sourceModule: 'assumptions',
        sourcePath: 'volatility_assumptions.time_to_liquidity',
        required: true,
      },

      // DLOM Fields
      discount_lack_marketability: {
        sourceModule: 'dlom',
        sourcePath: 'dlomPercentage',
        transformer: (value) => this.formatPercentage(value || 0),
        required: true,
      },
      dlom_chaffee: {
        sourceModule: 'dlom',
        sourcePath: 'modelResults.chaffee',
        transformer: (value) => this.formatPercentage(value || 0),
      },
      dlom_finnerty: {
        sourceModule: 'dlom',
        sourcePath: 'modelResults.finnerty',
        transformer: (value) => this.formatPercentage(value || 0),
      },
      dlom_ghaidarov: {
        sourceModule: 'dlom',
        sourcePath: 'modelResults.ghaidarov',
        transformer: (value) => this.formatPercentage(value || 0),
      },
      dlom_longstaff: {
        sourceModule: 'dlom',
        sourcePath: 'modelResults.longstaff',
        transformer: (value) => this.formatPercentage(value || 0),
      },
      discount_minority_interest: {
        sourceModule: 'assumptions',
        sourcePath: 'discount_rates.minority_interest_discount',
        transformer: (value) => this.formatPercentage(value),
      },

      // Valuation Results (to be calculated by valuation engine)
      enterprise_value: {
        sourceModule: 'calculated',
        sourcePath: 'enterprise_value',
        transformer: (value) => this.formatCurrency(value),
        required: true,
      },
      equity_value: {
        sourceModule: 'calculated',
        sourcePath: 'equity_value',
        transformer: (value) => this.formatCurrency(value),
        required: true,
      },
      common_value_per_share: {
        sourceModule: 'calculated',
        sourcePath: 'common_value_per_share',
        transformer: (value) => this.formatCurrency(value),
        required: true,
      },
      preferred_value_per_share: {
        sourceModule: 'calculated',
        sourcePath: 'preferred_value_per_share',
        transformer: (value) => this.formatCurrency(value),
      },

      // Appraiser Information
      appraiser_name: {
        sourceModule: 'manual',
        sourcePath: 'appraiser_name',
        fallback: 'Bridgeland Advisors',
      },
      appraiser_firm: {
        sourceModule: 'manual',
        sourcePath: 'appraiser_firm',
        fallback: 'Bridgeland Advisors',
      },
      appraiser_credentials: {
        sourceModule: 'manual',
        sourcePath: 'appraiser_credentials',
        fallback: 'ASA, CFA',
      },
    }
  }

  /**
   * Map valuation data to template fields
   */
  public mapValuationData(context: ValuationContext): Record<string, any> {
    const mappedData: Record<string, any> = {}
    const errors: string[] = []

    // Calculate DLOM if needed
    if (!context.dlomResults) {
      context.dlomResults = this.calculateDLOM(context)
    }

    // Process each field mapping
    for (const [fieldId, mapping] of Object.entries(this.fieldMappings)) {
      try {
        const value = this.extractFieldValue(fieldId, mapping, context)

        if (mapping.required && (value === null || value === undefined)) {
          errors.push(`Required field '${fieldId}' is missing or null`)
          continue
        }

        mappedData[fieldId] = value
      } catch (error) {
        console.error(`Error mapping field '${fieldId}':`, error)
        if (mapping.fallback !== undefined) {
          mappedData[fieldId] = mapping.fallback
        } else if (mapping.required) {
          errors.push(`Failed to map required field '${fieldId}': ${error}`)
        }
      }
    }

    if (errors.length > 0) {
      console.warn('Template mapping errors:', errors)
    }

    return mappedData
  }

  /**
   * Extract value for a specific field
   */
  private extractFieldValue(
    fieldId: string,
    mapping: FieldMapping,
    context: ValuationContext
  ): any {
    let value: any

    // Extract value based on source module
    switch (mapping.sourceModule) {
      case 'company':
        value = this.getNestedValue(context.company, mapping.sourcePath)
        break
      case 'valuation':
        value = this.getNestedValue(context.valuation, mapping.sourcePath)
        break
      case 'assumptions':
        value = this.getNestedValue(context.assumptions, mapping.sourcePath)
        break
      case 'capTable':
        value = this.getNestedValue(context.capTable, mapping.sourcePath)
        break
      case 'dlom':
        value = this.getNestedValue(context.dlomResults, mapping.sourcePath)
        break
      case 'calculated':
        value = mapping.transformer ? mapping.transformer(null, context) : null
        break
      case 'manual':
        value = this.getNestedValue(context.metadata, mapping.sourcePath) || mapping.fallback
        break
      default:
        value = mapping.fallback
    }

    // Apply transformer if provided
    if (mapping.transformer && mapping.sourceModule !== 'calculated') {
      value = mapping.transformer(value, context)
    }

    // Apply validator if provided
    if (mapping.validator && !mapping.validator(value)) {
      throw new Error(`Validation failed for field '${fieldId}'`)
    }

    // Use fallback if value is null/undefined
    if ((value === null || value === undefined) && mapping.fallback !== undefined) {
      value = mapping.fallback
    }

    return value
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return null

    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  /**
   * Format currency values
   */
  private formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  /**
   * Format percentage values (assumes input is already in percentage format)
   */
  private formatPercentage(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '0%'
    return `${value.toFixed(1)}%`
  }

  /**
   * Format decimal values as percentages (multiplies by 100)
   */
  private formatDecimalAsPercentage(value: number): string {
    if (value === null || value === undefined || isNaN(value)) return '0%'
    return `${(value * 100).toFixed(1)}%`
  }

  /**
   * Format date values
   */
  private formatDate(date: Date | string | number, format: string = 'MM/DD/YYYY'): string {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const month = d.getMonth() + 1
    const day = d.getDate()
    const year = d.getFullYear()

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`
      case 'MMMM DD, YYYY':
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      default:
        return d.toLocaleDateString()
    }
  }

  /**
   * Calculate revenue growth rate
   */
  private calculateRevenueGrowth(context: ValuationContext): string {
    const current = context.assumptions?.financial_metrics?.revenue_current
    const prior = context.assumptions?.financial_metrics?.revenue_prior

    if (!current || !prior || prior === 0) return '0%'

    const growthRate = ((current - prior) / prior) * 100
    return `${growthRate.toFixed(1)}%`
  }

  /**
   * Calculate total funding from cap table
   */
  private calculateTotalFunding(context: ValuationContext): string {
    const shareClasses = context.capTable || []
    const totalInvested = shareClasses.reduce((sum: number, shareClass: any) => {
      return sum + (shareClass.amountInvested || 0)
    }, 0)

    return this.formatCurrency(totalInvested)
  }

  /**
   * Calculate preferred liquidation preference
   */
  private calculatePreferredLiquidation(context: ValuationContext): string {
    const shareClasses = context.capTable?.shareClasses || []
    const totalLP = shareClasses.reduce((sum: number, shareClass: any) => {
      if (shareClass.shareType === 'preferred') {
        return sum + (shareClass.totalLP || 0)
      }
      return sum
    }, 0)

    return this.formatCurrency(totalLP)
  }

  /**
   * Calculate common shares outstanding
   */
  private calculateCommonShares(context: ValuationContext): number {
    const shareClasses = context.capTable || []
    return shareClasses.reduce((sum: number, shareClass: any) => {
      if (shareClass.shareType === 'common') {
        return sum + (shareClass.sharesOutstanding || 0)
      }
      return sum
    }, 0)
  }

  /**
   * Calculate preferred shares outstanding
   */
  private calculatePreferredShares(context: ValuationContext): number {
    const shareClasses = context.capTable || []
    return shareClasses.reduce((sum: number, shareClass: any) => {
      if (shareClass.shareType === 'preferred') {
        return sum + (shareClass.sharesOutstanding || 0)
      }
      return sum
    }, 0)
  }

  /**
   * Calculate options outstanding
   */
  private calculateOptionsOutstanding(context: ValuationContext): number {
    const options = context.options || []
    return options.reduce((sum: number, option: any) => {
      return sum + (option.numOptions || 0)
    }, 0)
  }

  /**
   * Calculate warrants outstanding
   */
  private calculateWarrantsOutstanding(context: ValuationContext): number {
    // Placeholder - implement when warrants module is added
    return 0
  }

  /**
   * Calculate fully diluted shares
   */
  private calculateFullyDilutedShares(context: ValuationContext): number {
    const commonShares = this.calculateCommonShares(context)
    const preferredShares = this.calculatePreferredShares(context)
    const optionsShares = this.calculateOptionsOutstanding(context)
    const warrantsShares = this.calculateWarrantsOutstanding(context)

    return commonShares + preferredShares + optionsShares + warrantsShares
  }

  /**
   * Calculate option pool size as percentage
   */
  private calculateOptionPoolSize(context: ValuationContext): string {
    const optionsShares = this.calculateOptionsOutstanding(context)
    const fullyDilutedShares = this.calculateFullyDilutedShares(context)

    if (fullyDilutedShares === 0) return '0%'

    const poolSize = (optionsShares / fullyDilutedShares) * 100
    return `${poolSize.toFixed(1)}%`
  }

  /**
   * Calculate DLOM using existing service
   */
  private calculateDLOM(context: ValuationContext): any {
    // Placeholder - implement DLOM calculation integration
    return {
      weighted_average: 0.3, // 30% default DLOM
    }
  }

  /**
   * Register new field mapping (for future modules)
   */
  public registerFieldMapping(fieldId: string, mapping: FieldMapping): void {
    this.fieldMappings[fieldId] = mapping
  }

  /**
   * Get all registered field mappings
   */
  public getFieldMappings(): TemplateFieldMappings {
    return { ...this.fieldMappings }
  }

  /**
   * Validate that all required fields can be mapped
   */
  public validateRequiredFields(context: ValuationContext): string[] {
    const errors: string[] = []

    for (const [fieldId, mapping] of Object.entries(this.fieldMappings)) {
      if (mapping.required) {
        try {
          const value = this.extractFieldValue(fieldId, mapping, context)
          if (value === null || value === undefined) {
            errors.push(`Required field '${fieldId}' is missing`)
          }
        } catch (error) {
          errors.push(`Required field '${fieldId}' failed validation: ${error}`)
        }
      }
    }

    return errors
  }
}

export default TemplateDataMapper
