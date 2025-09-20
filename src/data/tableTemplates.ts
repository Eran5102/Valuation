// Static table templates for 409A reports - no external dependencies
export interface TableColumn {
  key: string
  header: string
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date'
  format?: string
  width?: string
}

export interface TableTemplate {
  id: string
  name: string
  description: string
  category: '409a' | 'cap-table' | 'waterfall' | 'analysis'
  columns: TableColumn[]
  sampleData?: Record<string, any>[]
}

// Bank of 20 standard table templates for valuation reports
export const TABLE_TEMPLATES: TableTemplate[] = [
  // Cap Table Templates
  {
    id: 'cap-table-basic',
    name: 'Basic Cap Table',
    description: 'Standard capitalization table with share counts and ownership percentages',
    category: 'cap-table',
    columns: [
      { key: 'shareholder', header: 'Shareholder', type: 'text', width: '25%' },
      { key: 'shareClass', header: 'Share Class', type: 'text', width: '15%' },
      { key: 'sharesOwned', header: 'Shares Owned', type: 'number', width: '15%' },
      { key: 'ownershipPercent', header: 'Ownership %', type: 'percentage', width: '15%' },
      { key: 'liquidationValue', header: 'Liquidation Value', type: 'currency', width: '15%' },
      { key: 'fairValue', header: 'Fair Value', type: 'currency', width: '15%' },
    ],
    sampleData: [
      {
        shareholder: 'Founder A',
        shareClass: 'Common',
        sharesOwned: 5000000,
        ownershipPercent: 0.45,
        liquidationValue: 4500000,
        fairValue: 4500000,
      },
      {
        shareholder: 'Founder B',
        shareClass: 'Common',
        sharesOwned: 3000000,
        ownershipPercent: 0.27,
        liquidationValue: 2700000,
        fairValue: 2700000,
      },
      {
        shareholder: 'Series A Investors',
        shareClass: 'Preferred A',
        sharesOwned: 2000000,
        ownershipPercent: 0.18,
        liquidationValue: 3000000,
        fairValue: 2500000,
      },
    ],
  },

  // Waterfall Analysis Templates
  {
    id: 'waterfall-analysis',
    name: 'Waterfall Analysis',
    description: 'Distribution waterfall showing payout priorities and allocations',
    category: 'waterfall',
    columns: [
      { key: 'scenario', header: 'Exit Scenario', type: 'text', width: '20%' },
      { key: 'exitValue', header: 'Exit Value', type: 'currency', width: '15%' },
      { key: 'preferredReturn', header: 'Preferred Return', type: 'currency', width: '15%' },
      { key: 'commonReturn', header: 'Common Return', type: 'currency', width: '15%' },
      { key: 'managementReturn', header: 'Management Return', type: 'currency', width: '15%' },
      { key: 'totalDistributed', header: 'Total Distributed', type: 'currency', width: '20%' },
    ],
    sampleData: [
      {
        scenario: 'Low Case',
        exitValue: 50000000,
        preferredReturn: 15000000,
        commonReturn: 20000000,
        managementReturn: 5000000,
        totalDistributed: 40000000,
      },
      {
        scenario: 'Base Case',
        exitValue: 100000000,
        preferredReturn: 20000000,
        commonReturn: 45000000,
        managementReturn: 10000000,
        totalDistributed: 75000000,
      },
      {
        scenario: 'High Case',
        exitValue: 200000000,
        preferredReturn: 25000000,
        commonReturn: 100000000,
        managementReturn: 20000000,
        totalDistributed: 145000000,
      },
    ],
  },

  // 409A Valuation Templates
  {
    id: '409a-summary',
    name: '409A Valuation Summary',
    description: 'Summary of fair market value determination for common stock',
    category: '409a',
    columns: [
      { key: 'valuationDate', header: 'Valuation Date', type: 'date', width: '15%' },
      { key: 'shareClass', header: 'Share Class', type: 'text', width: '15%' },
      { key: 'sharesOutstanding', header: 'Shares Outstanding', type: 'number', width: '20%' },
      { key: 'fairValuePerShare', header: 'Fair Value Per Share', type: 'currency', width: '20%' },
      { key: 'totalFairValue', header: 'Total Fair Value', type: 'currency', width: '20%' },
      { key: 'method', header: 'Valuation Method', type: 'text', width: '10%' },
    ],
    sampleData: [
      {
        valuationDate: '2024-09-15',
        shareClass: 'Common',
        sharesOutstanding: 10000000,
        fairValuePerShare: 12.5,
        totalFairValue: 125000000,
        method: 'OPM',
      },
      {
        valuationDate: '2024-09-15',
        shareClass: 'Preferred A',
        sharesOutstanding: 2000000,
        fairValuePerShare: 15.0,
        totalFairValue: 30000000,
        method: 'OPM',
      },
    ],
  },

  // Comparable Company Analysis
  {
    id: 'comparable-companies',
    name: 'Comparable Company Analysis',
    description: 'Market multiples and valuation metrics from comparable public companies',
    category: 'analysis',
    columns: [
      { key: 'company', header: 'Company', type: 'text', width: '20%' },
      { key: 'revenue', header: 'Revenue (LTM)', type: 'currency', width: '15%' },
      { key: 'ebitda', header: 'EBITDA (LTM)', type: 'currency', width: '15%' },
      { key: 'enterpriseValue', header: 'Enterprise Value', type: 'currency', width: '15%' },
      { key: 'evRevenue', header: 'EV/Revenue', type: 'number', width: '12%' },
      { key: 'evEbitda', header: 'EV/EBITDA', type: 'number', width: '12%' },
      { key: 'marketCap', header: 'Market Cap', type: 'currency', width: '11%' },
    ],
    sampleData: [
      {
        company: 'Company A',
        revenue: 500000000,
        ebitda: 75000000,
        enterpriseValue: 2500000000,
        evRevenue: 5.0,
        evEbitda: 33.3,
        marketCap: 2200000000,
      },
      {
        company: 'Company B',
        revenue: 300000000,
        ebitda: 60000000,
        enterpriseValue: 1800000000,
        evRevenue: 6.0,
        evEbitda: 30.0,
        marketCap: 1600000000,
      },
    ],
  },

  // Option Pricing Model Inputs
  {
    id: 'opm-inputs',
    name: 'Option Pricing Model Inputs',
    description: 'Key inputs and assumptions for Black-Scholes option pricing model',
    category: '409a',
    columns: [
      { key: 'parameter', header: 'Parameter', type: 'text', width: '30%' },
      { key: 'value', header: 'Value', type: 'text', width: '25%' },
      { key: 'source', header: 'Source/Rationale', type: 'text', width: '30%' },
      { key: 'sensitivity', header: 'Sensitivity Impact', type: 'text', width: '15%' },
    ],
    sampleData: [
      {
        parameter: 'Equity Value',
        value: '$125,000,000',
        source: 'DCF and Market Approaches',
        sensitivity: 'High',
      },
      {
        parameter: 'Volatility',
        value: '45%',
        source: 'Guideline Public Companies',
        sensitivity: 'Medium',
      },
      {
        parameter: 'Risk-Free Rate',
        value: '4.5%',
        source: '10-Year Treasury',
        sensitivity: 'Low',
      },
      {
        parameter: 'Time to Exit',
        value: '3.5 years',
        source: 'Management Projections',
        sensitivity: 'Medium',
      },
    ],
  },

  // DCF Model Summary
  {
    id: 'dcf-summary',
    name: 'DCF Model Summary',
    description: 'Discounted cash flow analysis summary and key assumptions',
    category: 'analysis',
    columns: [
      { key: 'year', header: 'Year', type: 'number', width: '10%' },
      { key: 'revenue', header: 'Revenue', type: 'currency', width: '15%' },
      { key: 'ebitda', header: 'EBITDA', type: 'currency', width: '15%' },
      { key: 'fcf', header: 'Free Cash Flow', type: 'currency', width: '15%' },
      { key: 'discountFactor', header: 'Discount Factor', type: 'number', width: '15%' },
      { key: 'presentValue', header: 'Present Value', type: 'currency', width: '15%' },
      { key: 'terminalValue', header: 'Terminal Value', type: 'currency', width: '15%' },
    ],
    sampleData: [
      {
        year: 2024,
        revenue: 50000000,
        ebitda: 10000000,
        fcf: 5000000,
        discountFactor: 1.0,
        presentValue: 5000000,
        terminalValue: 0,
      },
      {
        year: 2025,
        revenue: 75000000,
        ebitda: 18000000,
        fcf: 12000000,
        discountFactor: 0.87,
        presentValue: 10440000,
        terminalValue: 0,
      },
      {
        year: 2026,
        revenue: 110000000,
        ebitda: 28000000,
        fcf: 20000000,
        discountFactor: 0.76,
        presentValue: 15200000,
        terminalValue: 0,
      },
      {
        year: 2027,
        revenue: 150000000,
        ebitda: 40000000,
        fcf: 30000000,
        discountFactor: 0.66,
        presentValue: 19800000,
        terminalValue: 85000000,
      },
    ],
  },
]

// Helper function to get template by ID
export function getTableTemplate(id: string): TableTemplate | undefined {
  return TABLE_TEMPLATES.find((template) => template.id === id)
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: TableTemplate['category']): TableTemplate[] {
  return TABLE_TEMPLATES.filter((template) => template.category === category)
}

// Helper function to format cell value based on column type
export function formatCellValue(value: any, column: TableColumn): string {
  if (value === null || value === undefined) return '-'

  switch (column.type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value))

    case 'percentage':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(Number(value))

    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value))

    case 'date':
      return new Date(value).toLocaleDateString('en-US')

    default:
      return String(value)
  }
}

// Helper function to generate dynamic data from valuation module
export function populateTemplateWithData(
  template: TableTemplate,
  valuationData: any
): TableTemplate {
  // This function will be expanded to map valuation data to template structure
  // For now, return template with sample data or merge with provided data

  if (!valuationData || !valuationData.length) {
    return template
  }

  // Merge provided data with template structure
  const populatedTemplate = {
    ...template,
    sampleData: valuationData.map((row: any) => {
      const formattedRow: Record<string, any> = {}
      template.columns.forEach((column) => {
        formattedRow[column.key] = row[column.key] || null
      })
      return formattedRow
    }),
  }

  return populatedTemplate
}
