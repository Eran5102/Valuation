import { FieldMapping, TemplateFieldMappings } from './templateDataMapper'

/**
 * Comprehensive field mapping definitions for all valuation data sources
 * Organized by category for better maintainability
 */

// Helper functions for common transformations
const formatCurrency = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercentage = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  return `${value.toFixed(1)}%`
}

const formatDate = (date: Date | string | number, format: string = 'MM/DD/YYYY'): string => {
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

const formatNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

// Company Information Fields
export const companyFields: TemplateFieldMappings = {
  'company.name': {
    sourceModule: 'company',
    sourcePath: 'name',
    required: true,
  },
  'company.legal_name': {
    sourceModule: 'company',
    sourcePath: 'legalName',
    fallback: 'Legal name not provided',
  },
  'company.address': {
    sourceModule: 'company',
    sourcePath: 'location',
    fallback: 'Address not provided',
  },
  'company.city': {
    sourceModule: 'company',
    sourcePath: 'city',
    fallback: 'City not provided',
  },
  'company.state': {
    sourceModule: 'company',
    sourcePath: 'stateOfIncorporation',
    fallback: 'Delaware',
  },
  'company.zip': {
    sourceModule: 'company',
    sourcePath: 'zipCode',
  },
  'company.ein': {
    sourceModule: 'company',
    sourcePath: 'ein',
    fallback: 'EIN not provided',
  },
  'company.industry': {
    sourceModule: 'company',
    sourcePath: 'industry',
    fallback: 'Technology',
  },
  'company.website': {
    sourceModule: 'company',
    sourcePath: 'website',
  },
  'company.founded_date': {
    sourceModule: 'company',
    sourcePath: 'foundedDate',
    transformer: (date) => formatDate(date, 'MM/DD/YYYY'),
  },
  'company.incorporation_date': {
    sourceModule: 'company',
    sourcePath: 'incorporationDate',
    transformer: (date) => formatDate(date, 'MM/DD/YYYY'),
  },
  'company.employees': {
    sourceModule: 'company',
    sourcePath: 'employees',
    transformer: formatNumber,
  },
  'company.description': {
    sourceModule: 'company',
    sourcePath: 'description',
    fallback: 'Company description not available',
  },
  'company.business_model': {
    sourceModule: 'company',
    sourcePath: 'businessModel',
  },
  'company.contact_person': {
    sourceModule: 'company',
    sourcePath: 'contactPerson',
  },
  'company.contact_email': {
    sourceModule: 'company',
    sourcePath: 'email',
  },
  'company.contact_phone': {
    sourceModule: 'company',
    sourcePath: 'phone',
  },
}

// DCF Core Assumptions Fields
export const dcfAssumptionsFields: TemplateFieldMappings = {
  'dcf.valuation_date': {
    sourceModule: 'assumptions',
    sourcePath: 'valuationDate',
    transformer: (date) => formatDate(date, 'MMMM DD, YYYY'),
    required: true,
  },
  'dcf.fiscal_year_end': {
    sourceModule: 'assumptions',
    sourcePath: 'mostRecentFiscalYearEnd',
    transformer: (date) => formatDate(date, 'MM/DD/YYYY'),
  },
  'dcf.currency': {
    sourceModule: 'assumptions',
    sourcePath: 'currency',
    fallback: 'USD',
  },
  'dcf.discounting_convention': {
    sourceModule: 'assumptions',
    sourcePath: 'discountingConvention',
    fallback: 'Mid-Year',
  },
  'dcf.historical_years': {
    sourceModule: 'assumptions',
    sourcePath: 'historicalYears',
    fallback: 3,
  },
  'dcf.projection_years': {
    sourceModule: 'assumptions',
    sourcePath: 'projectionYears',
    fallback: 5,
  },
  'dcf.base_year': {
    sourceModule: 'assumptions',
    sourcePath: 'baseYear',
  },
  'dcf.corporate_tax_rate': {
    sourceModule: 'assumptions',
    sourcePath: 'corporateTaxRate',
    transformer: formatPercentage,
  },
  'dcf.state_tax_rate': {
    sourceModule: 'assumptions',
    sourcePath: 'stateTaxRate',
    transformer: formatPercentage,
  },
  'dcf.effective_tax_rate': {
    sourceModule: 'assumptions',
    sourcePath: 'effectiveTaxRate',
    transformer: formatPercentage,
    required: true,
  },
  'dcf.discount_rate': {
    sourceModule: 'assumptions',
    sourcePath: 'discountRate',
    transformer: formatPercentage,
    required: true,
  },
  'dcf.terminal_growth_rate': {
    sourceModule: 'assumptions',
    sourcePath: 'terminalGrowthRate',
    transformer: formatPercentage,
    required: true,
  },
  'dcf.cash_balance': {
    sourceModule: 'assumptions',
    sourcePath: 'cashBalance',
    transformer: formatCurrency,
  },
  'dcf.debt_balance': {
    sourceModule: 'assumptions',
    sourcePath: 'debtBalance',
    transformer: formatCurrency,
  },
}

// WACC Fields
export const waccFields: TemplateFieldMappings = {
  'wacc.cost_of_equity': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.costOfEquity',
    transformer: formatPercentage,
    required: true,
  },
  'wacc.cost_of_debt': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.costOfDebt',
    transformer: formatPercentage,
  },
  'wacc.tax_rate': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.taxRate',
    transformer: formatPercentage,
  },
  'wacc.debt_weight': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.debtWeight',
    transformer: formatPercentage,
  },
  'wacc.equity_weight': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.equityWeight',
    transformer: formatPercentage,
  },
  'wacc.calculated_wacc': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.calculatedWACC',
    transformer: formatPercentage,
    required: true,
  },
  'wacc.unlevered_beta': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.unleveredBeta',
    transformer: (v) => v?.toFixed(2),
  },
  'wacc.levered_beta': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.leveredBeta',
    transformer: (v) => v?.toFixed(2),
  },
  'wacc.risk_free_rate': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.riskFreeRate',
    transformer: formatPercentage,
    required: true,
  },
  'wacc.equity_risk_premium': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.equityRiskPremium',
    transformer: formatPercentage,
  },
  'wacc.size_premium': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.sizePremium',
    transformer: formatPercentage,
  },
  'wacc.specific_risk_premium': {
    sourceModule: 'valuation',
    sourcePath: 'wacc.specificRiskPremium',
    transformer: formatPercentage,
  },
}

// Working Capital Fields
export const workingCapitalFields: TemplateFieldMappings = {
  'wc.current_nwc': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.summary.currentNWC',
    transformer: formatCurrency,
  },
  'wc.cash_conversion_cycle': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.summary.cashConversionCycle',
    transformer: (v) => `${v} days`,
  },
  'wc.days_receivables': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.assumptions.daysReceivables',
    transformer: (v) => `${v} days`,
  },
  'wc.days_inventory': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.assumptions.daysInventory',
    transformer: (v) => `${v} days`,
  },
  'wc.days_payables': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.assumptions.daysPayables',
    transformer: (v) => `${v} days`,
  },
  'wc.target_nwc_percent': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.assumptions.targetNWCPercent',
    transformer: formatPercentage,
  },
  'wc.accounts_receivable': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.current.accountsReceivable',
    transformer: formatCurrency,
  },
  'wc.inventory': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.current.inventory',
    transformer: formatCurrency,
  },
  'wc.prepaid_expenses': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.current.prepaidExpenses',
    transformer: formatCurrency,
  },
  'wc.accounts_payable': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.current.accountsPayable',
    transformer: formatCurrency,
  },
  'wc.accrued_expenses': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.current.accruedExpenses',
    transformer: formatCurrency,
  },
  'wc.deferred_revenue': {
    sourceModule: 'valuation',
    sourcePath: 'workingCapital.current.deferredRevenue',
    transformer: formatCurrency,
  },
}

// Debt Schedule Fields
export const debtFields: TemplateFieldMappings = {
  'debt.total_debt': {
    sourceModule: 'valuation',
    sourcePath: 'debtSchedule.summary.totalDebt',
    transformer: formatCurrency,
  },
  'debt.weighted_average_rate': {
    sourceModule: 'valuation',
    sourcePath: 'debtSchedule.summary.weightedAverageRate',
    transformer: formatPercentage,
  },
  'debt.annual_interest_expense': {
    sourceModule: 'valuation',
    sourcePath: 'debtSchedule.summary.annualInterestExpense',
    transformer: formatCurrency,
  },
  'debt.term_loan_balance': {
    sourceModule: 'valuation',
    sourcePath: 'debtSchedule.termLoan.currentBalance',
    transformer: formatCurrency,
  },
  'debt.revolver_balance': {
    sourceModule: 'valuation',
    sourcePath: 'debtSchedule.revolver.currentBalance',
    transformer: formatCurrency,
  },
  'debt.bond_balance': {
    sourceModule: 'valuation',
    sourcePath: 'debtSchedule.bond.currentBalance',
    transformer: formatCurrency,
  },
  'debt.interest_coverage_ratio': {
    sourceModule: 'calculated',
    sourcePath: 'interest_coverage_ratio',
    transformer: (v) => v?.toFixed(2) + 'x',
  },
  'debt.debt_to_equity_ratio': {
    sourceModule: 'calculated',
    sourcePath: 'debt_to_equity_ratio',
    transformer: (v) => v?.toFixed(2),
  },
}

// CapEx and Depreciation Fields
export const capexFields: TemplateFieldMappings = {
  'capex.total_ppe': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.summary.totalPPE',
    transformer: formatCurrency,
  },
  'capex.net_book_value': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.summary.netBookValue',
    transformer: formatCurrency,
  },
  'capex.annual_depreciation': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.summary.annualDepreciation',
    transformer: formatCurrency,
  },
  'capex.average_useful_life': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.assumptions.averageUsefulLife',
    transformer: (v) => `${v} years`,
  },
  'capex.maintenance_capex_percent': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.assumptions.maintenanceCapexPercent',
    transformer: formatPercentage,
  },
  'capex.growth_capex_percent': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.assumptions.growthCapexPercent',
    transformer: formatPercentage,
  },
  'capex.depreciation_method': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.assumptions.depreciationMethod',
  },
  'capex.current_year_capex': {
    sourceModule: 'valuation',
    sourcePath: 'capexDepreciation.currentYear.totalCapex',
    transformer: formatCurrency,
  },
}

// Financial Statement Fields
export const financialFields: TemplateFieldMappings = {
  'financials.revenue': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.revenue',
    transformer: formatCurrency,
    required: true,
  },
  'financials.revenue_growth': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.revenueGrowth',
    transformer: formatPercentage,
  },
  'financials.cogs': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.cogs',
    transformer: formatCurrency,
  },
  'financials.gross_profit': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.grossProfit',
    transformer: formatCurrency,
  },
  'financials.gross_margin': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.grossMargin',
    transformer: formatPercentage,
  },
  'financials.operating_expenses': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.operatingExpenses',
    transformer: formatCurrency,
  },
  'financials.ebitda': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.ebitda',
    transformer: formatCurrency,
    required: true,
  },
  'financials.ebitda_margin': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.ebitdaMargin',
    transformer: formatPercentage,
  },
  'financials.ebit': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.ebit',
    transformer: formatCurrency,
  },
  'financials.net_income': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.netIncome',
    transformer: formatCurrency,
  },
  'financials.total_assets': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.totalAssets',
    transformer: formatCurrency,
  },
  'financials.total_liabilities': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.totalLiabilities',
    transformer: formatCurrency,
  },
  'financials.total_equity': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.totalEquity',
    transformer: formatCurrency,
  },
  'financials.operating_cash_flow': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.operatingCashFlow',
    transformer: formatCurrency,
  },
  'financials.free_cash_flow': {
    sourceModule: 'valuation',
    sourcePath: 'financialStatements.current.freeCashFlow',
    transformer: formatCurrency,
  },
  'financials.burn_rate': {
    sourceModule: 'assumptions',
    sourcePath: 'financial_metrics.burn_rate',
    transformer: formatCurrency,
  },
  'financials.runway_months': {
    sourceModule: 'assumptions',
    sourcePath: 'financial_metrics.runway_months',
    transformer: (v) => `${v} months`,
  },
}

// Cap Table and Share Fields
export const capTableFields: TemplateFieldMappings = {
  'shares.common_outstanding': {
    sourceModule: 'capTable',
    sourcePath: 'summary.commonShares',
    transformer: formatNumber,
    required: true,
  },
  'shares.preferred_outstanding': {
    sourceModule: 'capTable',
    sourcePath: 'summary.preferredShares',
    transformer: formatNumber,
  },
  'shares.options_outstanding': {
    sourceModule: 'capTable',
    sourcePath: 'summary.optionsOutstanding',
    transformer: formatNumber,
    required: true,
  },
  'shares.warrants_outstanding': {
    sourceModule: 'capTable',
    sourcePath: 'summary.warrantsOutstanding',
    transformer: formatNumber,
  },
  'shares.fully_diluted': {
    sourceModule: 'capTable',
    sourcePath: 'summary.fullyDilutedShares',
    transformer: formatNumber,
    required: true,
  },
  'shares.option_pool_size': {
    sourceModule: 'capTable',
    sourcePath: 'summary.optionPoolSize',
    transformer: formatPercentage,
  },
  'shares.option_pool_available': {
    sourceModule: 'capTable',
    sourcePath: 'summary.optionPoolAvailable',
    transformer: formatNumber,
  },
  'shares.total_preferred_liquidation': {
    sourceModule: 'capTable',
    sourcePath: 'summary.totalLiquidationPreference',
    transformer: formatCurrency,
  },
  'shares.series_a_shares': {
    sourceModule: 'capTable',
    sourcePath: 'seriesA.sharesOutstanding',
    transformer: formatNumber,
  },
  'shares.series_a_price': {
    sourceModule: 'capTable',
    sourcePath: 'seriesA.pricePerShare',
    transformer: formatCurrency,
  },
  'shares.series_b_shares': {
    sourceModule: 'capTable',
    sourcePath: 'seriesB.sharesOutstanding',
    transformer: formatNumber,
  },
  'shares.series_b_price': {
    sourceModule: 'capTable',
    sourcePath: 'seriesB.pricePerShare',
    transformer: formatCurrency,
  },
}

// Funding and Investment Fields
export const fundingFields: TemplateFieldMappings = {
  'funding.total_raised': {
    sourceModule: 'calculated',
    sourcePath: 'total_funding',
    transformer: formatCurrency,
  },
  'funding.last_round_date': {
    sourceModule: 'assumptions',
    sourcePath: 'backsolve.last_round_date',
    transformer: (date) => formatDate(date, 'MMMM DD, YYYY'),
  },
  'funding.last_round_amount': {
    sourceModule: 'assumptions',
    sourcePath: 'backsolve.last_round_amount',
    transformer: formatCurrency,
  },
  'funding.last_round_type': {
    sourceModule: 'assumptions',
    sourcePath: 'backsolve.last_round_type',
  },
  'funding.last_round_premoney': {
    sourceModule: 'assumptions',
    sourcePath: 'backsolve.last_round_premoney',
    transformer: formatCurrency,
  },
  'funding.last_round_postmoney': {
    sourceModule: 'assumptions',
    sourcePath: 'backsolve.last_round_postmoney',
    transformer: formatCurrency,
  },
  'funding.last_round_price': {
    sourceModule: 'assumptions',
    sourcePath: 'backsolve.last_round_price',
    transformer: formatCurrency,
  },
  'funding.investor_count': {
    sourceModule: 'capTable',
    sourcePath: 'summary.investorCount',
    transformer: formatNumber,
  },
}

// DLOM Fields
export const dlomFields: TemplateFieldMappings = {
  'dlom.percentage': {
    sourceModule: 'dlom',
    sourcePath: 'dlomPercentage',
    transformer: formatPercentage,
    required: true,
  },
  'dlom.chaffee_model': {
    sourceModule: 'dlom',
    sourcePath: 'modelResults.chaffee',
    transformer: formatPercentage,
  },
  'dlom.finnerty_model': {
    sourceModule: 'dlom',
    sourcePath: 'modelResults.finnerty',
    transformer: formatPercentage,
  },
  'dlom.ghaidarov_model': {
    sourceModule: 'dlom',
    sourcePath: 'modelResults.ghaidarov',
    transformer: formatPercentage,
  },
  'dlom.longstaff_model': {
    sourceModule: 'dlom',
    sourcePath: 'modelResults.longstaff',
    transformer: formatPercentage,
  },
  'dlom.time_to_liquidity': {
    sourceModule: 'assumptions',
    sourcePath: 'volatility_assumptions.time_to_liquidity',
    transformer: (v) => `${v} years`,
  },
  'dlom.volatility': {
    sourceModule: 'assumptions',
    sourcePath: 'volatility_assumptions.equity_volatility',
    transformer: formatPercentage,
    required: true,
  },
  'dlom.minority_discount': {
    sourceModule: 'assumptions',
    sourcePath: 'discount_rates.minority_interest_discount',
    transformer: formatPercentage,
  },
}

// Valuation Results Fields
export const valuationResultsFields: TemplateFieldMappings = {
  'valuation.enterprise_value': {
    sourceModule: 'valuation',
    sourcePath: 'results.enterpriseValue',
    transformer: formatCurrency,
    required: true,
  },
  'valuation.equity_value': {
    sourceModule: 'valuation',
    sourcePath: 'results.equityValue',
    transformer: formatCurrency,
    required: true,
  },
  'valuation.common_share_value': {
    sourceModule: 'valuation',
    sourcePath: 'results.commonShareValue',
    transformer: formatCurrency,
    required: true,
  },
  'valuation.preferred_share_value': {
    sourceModule: 'valuation',
    sourcePath: 'results.preferredShareValue',
    transformer: formatCurrency,
  },
  'valuation.terminal_value': {
    sourceModule: 'valuation',
    sourcePath: 'results.terminalValue',
    transformer: formatCurrency,
  },
  'valuation.pv_cash_flows': {
    sourceModule: 'valuation',
    sourcePath: 'results.pvCashFlows',
    transformer: formatCurrency,
  },
  'valuation.pv_terminal_value': {
    sourceModule: 'valuation',
    sourcePath: 'results.pvTerminalValue',
    transformer: formatCurrency,
  },
  'valuation.implied_ev_multiple': {
    sourceModule: 'valuation',
    sourcePath: 'results.impliedEvMultiple',
    transformer: (v) => v?.toFixed(1) + 'x',
  },
  'valuation.methodology': {
    sourceModule: 'valuation',
    sourcePath: 'methodology',
    fallback: 'DCF and Market Approach',
  },
  'valuation.date': {
    sourceModule: 'valuation',
    sourcePath: 'valuationDate',
    transformer: (date) => formatDate(date, 'MMMM DD, YYYY'),
    required: true,
  },
  'valuation.report_date': {
    sourceModule: 'calculated',
    sourcePath: 'current_date',
    transformer: () => formatDate(new Date(), 'MMMM DD, YYYY'),
  },
}

// Footnote-related Fields for dynamic footnotes
export const footnoteFields: TemplateFieldMappings = {
  'data.source': {
    sourceModule: 'valuation',
    sourcePath: 'dataSource',
    fallback: 'Alpha Vantage',
  },
  'data.provider': {
    sourceModule: 'valuation',
    sourcePath: 'dataProvider',
    fallback: 'Market Data Provider',
  },
  'volatility.source': {
    sourceModule: 'valuation',
    sourcePath: 'volatility.source',
    fallback: 'Historical trading data',
  },
  'risk_free_rate.source': {
    sourceModule: 'valuation',
    sourcePath: 'riskFreeRate.source',
    fallback: 'US Treasury (10-year)',
  },
  'risk_free_rate.date': {
    sourceModule: 'valuation',
    sourcePath: 'riskFreeRate.asOfDate',
    transformer: (date) => formatDate(date, 'MMMM DD, YYYY'),
    fallback: 'Current date',
  },
  time_to_maturity: {
    sourceModule: 'valuation',
    sourcePath: 'options.timeToMaturity',
    transformer: (v) => v?.toFixed(1) + ' years',
    fallback: '4.0 years',
  },
  'market_data.date': {
    sourceModule: 'valuation',
    sourcePath: 'marketData.asOfDate',
    transformer: (date) => formatDate(date, 'MMMM DD, YYYY'),
  },
  'comparable.source': {
    sourceModule: 'valuation',
    sourcePath: 'comparables.dataSource',
    fallback: 'S&P Capital IQ',
  },
  'methodology.primary': {
    sourceModule: 'valuation',
    sourcePath: 'methodology.primary',
    fallback: 'Discounted Cash Flow (DCF)',
  },
  'methodology.secondary': {
    sourceModule: 'valuation',
    sourcePath: 'methodology.secondary',
    fallback: 'Market Approach',
  },
  'appraiser.firm': {
    sourceModule: 'company',
    sourcePath: 'appraiser.firm',
    fallback: 'Independent Valuation Firm',
  },
  'appraiser.name': {
    sourceModule: 'company',
    sourcePath: 'appraiser.name',
    fallback: 'Certified Valuation Professional',
  },
  'appraiser.credentials': {
    sourceModule: 'company',
    sourcePath: 'appraiser.credentials',
    fallback: 'CPA, ABV, ASA',
  },
  'appraiser.title': {
    sourceModule: 'company',
    sourcePath: 'appraiser.title',
    fallback: 'Managing Director',
  },
}

// Appraiser and Designee Fields
export const appraiserDesigneeFields: TemplateFieldMappings = {
  'appraiser.first_name': {
    sourceModule: 'company',
    sourcePath: 'appraiser.firstName',
    fallback: 'John',
  },
  'appraiser.last_name': {
    sourceModule: 'company',
    sourcePath: 'appraiser.lastName',
    fallback: 'Smith',
  },
  'appraiser.email': {
    sourceModule: 'company',
    sourcePath: 'appraiser.email',
    fallback: 'appraiser@valuation.com',
  },
  'appraiser.phone': {
    sourceModule: 'company',
    sourcePath: 'appraiser.phone',
    fallback: '(555) 123-4567',
  },
  'appraiser.address': {
    sourceModule: 'company',
    sourcePath: 'appraiser.address',
    fallback: '123 Valuation Street',
  },
  'appraiser.city': {
    sourceModule: 'company',
    sourcePath: 'appraiser.city',
    fallback: 'New York',
  },
  'appraiser.state': {
    sourceModule: 'company',
    sourcePath: 'appraiser.state',
    fallback: 'NY',
  },
  'appraiser.zip': {
    sourceModule: 'company',
    sourcePath: 'appraiser.zip',
    fallback: '10001',
  },
  'appraiser.signature_date': {
    sourceModule: 'company',
    sourcePath: 'appraiser.signatureDate',
    transformer: (date) => formatDate(date, 'MMMM DD, YYYY'),
  },
  'designee.first_name': {
    sourceModule: 'company',
    sourcePath: 'designee.firstName',
    fallback: 'Jane',
  },
  'designee.last_name': {
    sourceModule: 'company',
    sourcePath: 'designee.lastName',
    fallback: 'Doe',
  },
  'designee.title': {
    sourceModule: 'company',
    sourcePath: 'designee.title',
    fallback: 'Chief Financial Officer',
  },
  'designee.email': {
    sourceModule: 'company',
    sourcePath: 'designee.email',
    fallback: 'designee@company.com',
  },
  'designee.phone': {
    sourceModule: 'company',
    sourcePath: 'designee.phone',
    fallback: '(555) 987-6543',
  },
  'designee.address': {
    sourceModule: 'company',
    sourcePath: 'designee.address',
    fallback: '456 Corporate Blvd',
  },
  'designee.city': {
    sourceModule: 'company',
    sourcePath: 'designee.city',
    fallback: 'San Francisco',
  },
  'designee.state': {
    sourceModule: 'company',
    sourcePath: 'designee.state',
    fallback: 'CA',
  },
  'designee.zip': {
    sourceModule: 'company',
    sourcePath: 'designee.zip',
    fallback: '94105',
  },
}

// Security/Share Class Fields
export const securityFields: TemplateFieldMappings = {
  'security.type': {
    sourceModule: 'valuation',
    sourcePath: 'security.type',
    fallback: 'Common Stock',
  },
  'security.class': {
    sourceModule: 'valuation',
    sourcePath: 'security.class',
    fallback: 'Class A',
  },
  'security.shares_authorized': {
    sourceModule: 'capTable',
    sourcePath: 'security.sharesAuthorized',
    transformer: formatNumber,
  },
  'security.shares_issued': {
    sourceModule: 'capTable',
    sourcePath: 'security.sharesIssued',
    transformer: formatNumber,
  },
  'security.shares_outstanding': {
    sourceModule: 'capTable',
    sourcePath: 'security.sharesOutstanding',
    transformer: formatNumber,
    required: true,
  },
  'security.par_value': {
    sourceModule: 'capTable',
    sourcePath: 'security.parValue',
    transformer: formatCurrency,
  },
  'security.liquidation_preference': {
    sourceModule: 'capTable',
    sourcePath: 'security.liquidationPreference',
    transformer: formatCurrency,
  },
  'security.conversion_ratio': {
    sourceModule: 'capTable',
    sourcePath: 'security.conversionRatio',
    fallback: '1:1',
  },
  'security.dividend_rate': {
    sourceModule: 'capTable',
    sourcePath: 'security.dividendRate',
    transformer: formatPercentage,
  },
  'security.cumulative': {
    sourceModule: 'capTable',
    sourcePath: 'security.cumulative',
    fallback: 'No',
  },
  'security.participating': {
    sourceModule: 'capTable',
    sourcePath: 'security.participating',
    fallback: 'No',
  },
  'security.voting_rights': {
    sourceModule: 'capTable',
    sourcePath: 'security.votingRights',
    fallback: '1 vote per share',
  },
}

// Combine all field mappings
export const allFieldMappings: TemplateFieldMappings = {
  ...companyFields,
  ...dcfAssumptionsFields,
  ...waccFields,
  ...workingCapitalFields,
  ...debtFields,
  ...capexFields,
  ...financialFields,
  ...capTableFields,
  ...fundingFields,
  ...dlomFields,
  ...valuationResultsFields,
  ...footnoteFields,
  ...appraiserDesigneeFields,
  ...securityFields,
}

// Export categories for UI organization
export const fieldCategories = [
  { id: 'company', name: 'Company Information', fields: Object.keys(companyFields) },
  {
    id: 'appraiser_designee',
    name: 'Appraiser & Designee',
    fields: Object.keys(appraiserDesigneeFields),
  },
  { id: 'security', name: 'Security Information', fields: Object.keys(securityFields) },
  { id: 'dcf', name: 'DCF Assumptions', fields: Object.keys(dcfAssumptionsFields) },
  { id: 'wacc', name: 'WACC', fields: Object.keys(waccFields) },
  { id: 'working_capital', name: 'Working Capital', fields: Object.keys(workingCapitalFields) },
  { id: 'debt', name: 'Debt Schedule', fields: Object.keys(debtFields) },
  { id: 'capex', name: 'CapEx & Depreciation', fields: Object.keys(capexFields) },
  { id: 'financials', name: 'Financial Statements', fields: Object.keys(financialFields) },
  { id: 'cap_table', name: 'Cap Table', fields: Object.keys(capTableFields) },
  { id: 'funding', name: 'Funding & Investment', fields: Object.keys(fundingFields) },
  { id: 'dlom', name: 'DLOM', fields: Object.keys(dlomFields) },
  { id: 'valuation', name: 'Valuation Results', fields: Object.keys(valuationResultsFields) },
  { id: 'footnote', name: 'Footnote References', fields: Object.keys(footnoteFields) },
]

// Total field count: 200+ fields
export const totalFieldCount = Object.keys(allFieldMappings).length
