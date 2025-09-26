import { allFieldMappings, fieldCategories } from './fieldMappingDefinitions'
import type { FieldMapping, TemplateFieldMappings, ValuationContext } from './templateDataMapper'
import type { TemplateVariable } from './types'

export interface MappedField {
  id: string
  name: string
  description?: string
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean'
  category: string
  required: boolean
  sourcePath: string
  sourceModule: string
  isMapped: boolean
  defaultValue?: any
  sampleValue?: any
}

export interface FieldMappingStats {
  totalFields: number
  mappedFields: number
  requiredFields: number
  missingRequired: number
  categories: {
    [category: string]: {
      total: number
      mapped: number
      required: number
    }
  }
}

/**
 * Unified service for managing field mappings between data sources and templates
 */
export class FieldMappingService {
  private static instance: FieldMappingService
  private mappings: TemplateFieldMappings
  private customMappings: TemplateFieldMappings = {}
  private cache: Map<string, any> = new Map()

  constructor() {
    // Load default mappings from definitions
    this.mappings = { ...allFieldMappings }
    this.loadCustomMappings()
  }

  static getInstance(): FieldMappingService {
    if (!FieldMappingService.instance) {
      FieldMappingService.instance = new FieldMappingService()
    }
    return FieldMappingService.instance
  }

  /**
   * Load custom mappings from localStorage or API
   */
  private loadCustomMappings(): void {
    try {
      const stored = localStorage.getItem('custom_field_mappings')
      if (stored) {
        this.customMappings = JSON.parse(stored)
        // Merge custom mappings with defaults
        this.mappings = { ...this.mappings, ...this.customMappings }
      }
    } catch (error) {
    }
  }

  /**
   * Save custom mappings to localStorage
   */
  private saveCustomMappings(): void {
    try {
      localStorage.setItem('custom_field_mappings', JSON.stringify(this.customMappings))
    } catch (error) {
    }
  }

  /**
   * Get all field mappings
   */
  getAllMappings(): TemplateFieldMappings {
    return { ...this.mappings }
  }

  /**
   * Get mapped fields as template variables for the editor
   */
  getMappedFieldsAsVariables(): TemplateVariable[] {
    const variables: TemplateVariable[] = []

    for (const [fieldId, mapping] of Object.entries(this.mappings)) {
      const category = this.getCategoryForField(fieldId)

      variables.push({
        id: fieldId,
        name: this.getFieldName(fieldId),
        type: this.getFieldType(fieldId),
        category: category?.name || 'Other',
        required: mapping.required || false,
        defaultValue: mapping.fallback,
        description: this.getFieldDescription(fieldId),
        format: this.getFieldFormat(fieldId),
      })
    }

    return variables
  }

  /**
   * Get fields by category
   */
  getFieldsByCategory(categoryId: string): MappedField[] {
    const category = fieldCategories.find(c => c.id === categoryId)
    if (!category) return []

    return category.fields.map(fieldId => this.getFieldDetails(fieldId)).filter(Boolean) as MappedField[]
  }

  /**
   * Get detailed field information
   */
  getFieldDetails(fieldId: string): MappedField | null {
    const mapping = this.mappings[fieldId]
    if (!mapping) return null

    const category = this.getCategoryForField(fieldId)

    return {
      id: fieldId,
      name: this.getFieldName(fieldId),
      description: this.getFieldDescription(fieldId),
      type: this.getFieldType(fieldId),
      category: category?.name || 'Other',
      required: mapping.required || false,
      sourcePath: mapping.sourcePath,
      sourceModule: mapping.sourceModule,
      isMapped: true,
      defaultValue: mapping.fallback,
      sampleValue: this.getSampleValue(fieldId),
    }
  }

  /**
   * Add or update a field mapping
   */
  addMapping(fieldId: string, mapping: FieldMapping): void {
    this.customMappings[fieldId] = mapping
    this.mappings[fieldId] = mapping
    this.saveCustomMappings()
    this.cache.clear() // Clear cache on update
  }

  /**
   * Remove a custom field mapping
   */
  removeMapping(fieldId: string): void {
    delete this.customMappings[fieldId]
    // Restore default if it exists
    if (allFieldMappings[fieldId]) {
      this.mappings[fieldId] = allFieldMappings[fieldId]
    } else {
      delete this.mappings[fieldId]
    }
    this.saveCustomMappings()
    this.cache.clear()
  }

  /**
   * Get field mapping statistics
   */
  getStats(): FieldMappingStats {
    const stats: FieldMappingStats = {
      totalFields: Object.keys(this.mappings).length,
      mappedFields: Object.keys(this.mappings).length,
      requiredFields: 0,
      missingRequired: 0,
      categories: {},
    }

    // Count required fields
    for (const mapping of Object.values(this.mappings)) {
      if (mapping.required) {
        stats.requiredFields++
      }
    }

    // Calculate category stats
    for (const category of fieldCategories) {
      const categoryMappings = category.fields.map(f => this.mappings[f]).filter(Boolean)

      stats.categories[category.id] = {
        total: category.fields.length,
        mapped: categoryMappings.length,
        required: categoryMappings.filter(m => m.required).length,
      }
    }

    return stats
  }

  /**
   * Get available source paths for a module
   */
  getAvailableSourcePaths(module: string): string[] {
    // This would ideally connect to your data schema
    // For now, return common paths based on module
    const paths: { [key: string]: string[] } = {
      company: [
        'name',
        'legalName',
        'location',
        'city',
        'stateOfIncorporation',
        'zipCode',
        'ein',
        'industry',
        'website',
        'foundedDate',
        'incorporationDate',
        'employees',
        'description',
        'businessModel',
        'contactPerson',
        'email',
        'phone',
      ],
      assumptions: [
        'valuationDate',
        'mostRecentFiscalYearEnd',
        'currency',
        'discountingConvention',
        'historicalYears',
        'projectionYears',
        'baseYear',
        'corporateTaxRate',
        'stateTaxRate',
        'effectiveTaxRate',
        'discountRate',
        'terminalGrowthRate',
        'cashBalance',
        'debtBalance',
        'financial_metrics.revenue_current',
        'financial_metrics.revenue_prior',
        'financial_metrics.gross_margin',
        'financial_metrics.operating_margin',
        'financial_metrics.burn_rate',
        'financial_metrics.runway_months',
        'backsolve.last_round_date',
        'backsolve.last_round_amount',
        'backsolve.last_round_premoney',
        'volatility_assumptions.equity_volatility',
        'volatility_assumptions.time_to_liquidity',
        'discount_rates.risk_free_rate',
        'discount_rates.minority_interest_discount',
      ],
      valuation: [
        'results.enterpriseValue',
        'results.equityValue',
        'results.commonShareValue',
        'results.preferredShareValue',
        'results.terminalValue',
        'wacc.costOfEquity',
        'wacc.costOfDebt',
        'wacc.calculatedWACC',
        'wacc.riskFreeRate',
        'workingCapital.summary.currentNWC',
        'debtSchedule.summary.totalDebt',
        'capexDepreciation.summary.totalPPE',
        'financialStatements.current.revenue',
        'financialStatements.current.ebitda',
      ],
      capTable: [
        'summary.commonShares',
        'summary.preferredShares',
        'summary.optionsOutstanding',
        'summary.warrantsOutstanding',
        'summary.fullyDilutedShares',
        'summary.optionPoolSize',
        'summary.totalLiquidationPreference',
        'seriesA.sharesOutstanding',
        'seriesA.pricePerShare',
        'seriesB.sharesOutstanding',
        'seriesB.pricePerShare',
      ],
      dlom: [
        'dlomPercentage',
        'modelResults.chaffee',
        'modelResults.finnerty',
        'modelResults.ghaidarov',
        'modelResults.longstaff',
      ],
    }

    return paths[module] || []
  }

  /**
   * Validate a field mapping
   */
  validateMapping(fieldId: string, context?: ValuationContext): string[] {
    const errors: string[] = []
    const mapping = this.mappings[fieldId]

    if (!mapping) {
      errors.push(`No mapping found for field: ${fieldId}`)
      return errors
    }

    // Check if source module is valid
    const validModules = ['assumptions', 'company', 'valuation', 'capTable', 'dlom', 'calculated', 'manual']
    if (!validModules.includes(mapping.sourceModule)) {
      errors.push(`Invalid source module: ${mapping.sourceModule}`)
    }

    // Check if required fields have a value or fallback
    if (mapping.required && !mapping.fallback && !context) {
      errors.push(`Required field ${fieldId} has no fallback value`)
    }

    return errors
  }

  /**
   * Export mappings to JSON
   */
  exportMappings(): string {
    return JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      defaultMappings: allFieldMappings,
      customMappings: this.customMappings,
      stats: this.getStats(),
    }, null, 2)
  }

  /**
   * Import mappings from JSON
   */
  importMappings(jsonString: string): { success: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      const data = JSON.parse(jsonString)

      if (!data.customMappings) {
        errors.push('Invalid import format: missing customMappings')
        return { success: false, errors }
      }

      // Validate each mapping
      for (const [fieldId, mapping] of Object.entries(data.customMappings)) {
        const validationErrors = this.validateMapping(fieldId)
        if (validationErrors.length > 0) {
          errors.push(`Field ${fieldId}: ${validationErrors.join(', ')}`)
        }
      }

      if (errors.length === 0) {
        this.customMappings = data.customMappings as TemplateFieldMappings
        this.mappings = { ...allFieldMappings, ...this.customMappings }
        this.saveCustomMappings()
        this.cache.clear()
        return { success: true, errors: [] }
      }

      return { success: false, errors }
    } catch (error) {
      errors.push(`Parse error: ${error}`)
      return { success: false, errors }
    }
  }

  // Helper methods

  private getCategoryForField(fieldId: string): typeof fieldCategories[0] | undefined {
    return fieldCategories.find(cat => cat.fields.includes(fieldId))
  }

  private getFieldName(fieldId: string): string {
    // Convert field ID to human-readable name
    return fieldId
      .split('.')
      .pop()!
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  private getFieldDescription(fieldId: string): string {
    // Generate description based on field ID and mapping
    const mapping = this.mappings[fieldId]
    if (!mapping) return ''

    const category = this.getCategoryForField(fieldId)
    return `${category?.name || 'Field'} from ${mapping.sourceModule} module (${mapping.sourcePath})`
  }

  private getFieldType(fieldId: string): TemplateVariable['type'] {
    // Determine type based on field ID patterns
    if (fieldId.includes('date')) return 'date'
    if (fieldId.includes('percent') || fieldId.includes('rate') || fieldId.includes('margin')) return 'percentage'
    if (fieldId.includes('value') || fieldId.includes('amount') || fieldId.includes('price') ||
        fieldId.includes('revenue') || fieldId.includes('cost') || fieldId.includes('balance')) return 'currency'
    if (fieldId.includes('count') || fieldId.includes('number') || fieldId.includes('shares') ||
        fieldId.includes('years') || fieldId.includes('months')) return 'number'
    if (fieldId.includes('enabled') || fieldId.includes('is_')) return 'boolean'
    return 'text'
  }

  private getFieldFormat(fieldId: string): string | undefined {
    const type = this.getFieldType(fieldId)
    switch (type) {
      case 'date':
        return 'MMMM DD, YYYY'
      case 'currency':
        return '$0,0'
      case 'percentage':
        return '0.0%'
      case 'number':
        return '0,0'
      default:
        return undefined
    }
  }

  private getSampleValue(fieldId: string): any {
    const type = this.getFieldType(fieldId)
    switch (type) {
      case 'date':
        return new Date().toLocaleDateString()
      case 'currency':
        return '$1,000,000'
      case 'percentage':
        return '15.5%'
      case 'number':
        return '1,234'
      case 'boolean':
        return 'Yes'
      default:
        return 'Sample Text'
    }
  }
}

// Export singleton instance
export const fieldMappingService = FieldMappingService.getInstance()