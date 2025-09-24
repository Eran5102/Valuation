// DCF Model Integration Types

export interface DCFCoreAssumptions {
  // Project Fundamentals
  valuationDate: string
  mostRecentFiscalYearEnd: string
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  discountingConvention: 'Mid-Year' | 'End-Year'

  // Analysis Periods
  historicalYears: number
  projectionYears: number // This flows to all schedules
  baseYear: number

  // Tax Configuration
  corporateTaxRate: number // Federal tax rate
  stateTaxRate: number // State tax rate
  effectiveTaxRate: number // Combined effective rate
  taxCalculationMethod: 'effective' | 'detailed'

  // Core Financial Parameters
  discountRate: number // Can be overridden by WACC
  terminalGrowthRate: number
  cashBalance: number
  debtBalance: number

  // Calculation Method Flags
  depreciationMethod: 'schedule' | 'manual' | 'percentage'
  workingCapitalMethod: 'detailed' | 'percentage' | 'days'
  capexMethod: 'schedule' | 'percentage' | 'growth'
  debtMethod: 'schedule' | 'manual'
  interestMethod: 'schedule' | 'average' | 'fixed'

  // Default Percentages (when not using detailed schedules)
  depreciationPercent?: number // As % of revenue or PP&E
  capexPercent?: number // As % of revenue
  workingCapitalPercent?: number // As % of revenue
  maintenanceCapexPercent?: number
  growthCapexPercent?: number
}

export interface DCFModelData {
  assumptions: DCFCoreAssumptions
  debtSchedule?: DebtScheduleData
  workingCapital?: WorkingCapitalData
  capexDepreciation?: CapexDepreciationData
  wacc?: WACCData
  financialStatements?: FinancialStatementData[]
  dcfValuation?: DCFValuationResult
  lastUpdated: string
  version: number
}

export interface DebtScheduleData {
  items: DebtItem[]
  projections: DebtProjection[]
  summary: {
    totalDebt: number
    weightedAverageRate: number
    annualInterestExpense: number
  }
}

export interface DebtItem {
  id: string
  name: string
  type: 'term_loan' | 'revolver' | 'bond' | 'convertible' | 'other'
  principal: number
  interestRate: number
  maturityDate: string
  currentBalance: number
  isFixed: boolean
  mandatory: boolean // Whether this must be included in DCF
}

export interface DebtProjection {
  year: number
  beginningBalance: number
  newDebt: number
  principalPayments: number
  endingBalance: number
  interestExpense: number
  averageBalance: number
}

export interface WorkingCapitalData {
  historical: WorkingCapitalPeriod[]
  projected: WorkingCapitalPeriod[]
  assumptions: {
    daysReceivables: number
    daysInventory: number
    daysPayables: number
    targetNWCPercent?: number
  }
  summary: {
    currentNWC: number
    cashConversionCycle: number
  }
}

export interface WorkingCapitalPeriod {
  year: number
  revenue: number
  accountsReceivable: number
  inventory: number
  prepaidExpenses: number
  otherCurrentAssets: number
  accountsPayable: number
  accruedExpenses: number
  deferredRevenue: number
  otherCurrentLiabilities: number
  netWorkingCapital: number
  changeInNWC: number
}

export interface CapexDepreciationData {
  assetClasses: AssetClass[]
  projections: CapexProjection[]
  assumptions: {
    averageUsefulLife: number
    depreciationMethod: string
    maintenanceCapexPercent: number
    growthCapexPercent: number
  }
  summary: {
    totalPPE: number
    netBookValue: number
    annualDepreciation: number
  }
}

export interface AssetClass {
  id: string
  name: string
  historicalCost: number
  accumulatedDepreciation: number
  netBookValue: number
  usefulLife: number
  annualDepreciation: number
}

export interface CapexProjection {
  year: number
  maintenanceCapex: number
  growthCapex: number
  totalCapex: number
  depreciation: number
  amortization: number
  beginningPPE: number
  endingPPE: number
  netPPE: number
}

export interface WACCData {
  costOfEquity: number
  costOfDebt: number
  taxRate: number
  debtWeight: number
  equityWeight: number
  calculatedWACC: number
  unleveredBeta?: number
  leveredBeta?: number
  riskFreeRate?: number
  equityRiskPremium?: number
  sizePremium?: number
  specificRiskPremium?: number
}

export interface FinancialStatementData {
  year: number
  isHistorical: boolean
  isProjected: boolean

  // Income Statement
  revenue: number
  revenueGrowth: number
  cogs: number
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  ebitda: number
  ebitdaMargin: number
  depreciation: number
  amortization: number
  ebit: number
  interestExpense: number
  ebt: number
  taxes: number
  netIncome: number

  // Balance Sheet Summary
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  netDebt: number

  // Cash Flow
  operatingCashFlow: number
  capex: number
  changeInNWC: number
  freeCashFlow: number
  unleveredFreeCashFlow: number
}

export interface DCFValuationResult {
  // Inputs
  wacc: number
  terminalGrowthRate: number
  taxRate: number

  // Cash Flow Projections
  projectedCashFlows: {
    year: number
    unleveredFCF: number
    discountFactor: number
    presentValue: number
  }[]

  // Terminal Value
  terminalYear: number
  terminalCashFlow: number
  terminalValue: number
  terminalDiscountFactor: number
  presentValueOfTerminal: number

  // Valuation Results
  sumOfPVCashFlows: number
  enterpriseValue: number
  lessDebt: number
  plusCash: number
  equityValue: number
  sharesOutstanding: number
  valuePerShare: number

  // Sensitivity Metrics
  terminalValuePercent: number
  impliedExitMultiple: number
  impliedPerpGrowth?: number
}

// Integration Service Response Types
export interface DCFCalculationRequest {
  valuationId: string
  assumptions?: Partial<DCFCoreAssumptions>
  overrides?: {
    useScheduleData: boolean
    recalculateAll: boolean
  }
}

export interface DCFCalculationResponse {
  success: boolean
  data?: DCFModelData
  errors?: string[]
  warnings?: string[]
}

// Event Types for Real-time Updates
export interface DCFModelUpdateEvent {
  type: 'assumption_changed' | 'schedule_updated' | 'calculation_complete' | 'error'
  source: 'debt' | 'working_capital' | 'capex' | 'wacc' | 'assumptions' | 'manual'
  data?: any
  timestamp: string
}

// Calculation Method Options
export interface CalculationMethodOptions {
  depreciation: {
    method: 'schedule' | 'manual' | 'percentage'
    manualValues?: number[] // Array of values by year
    percentageValue?: number // Single percentage
    percentageBasis?: 'revenue' | 'ppe' // What to apply percentage to
  }

  workingCapital: {
    method: 'detailed' | 'percentage' | 'days'
    percentageValue?: number
    daysSalesOutstanding?: number
    daysInventory?: number
    daysPayablesOutstanding?: number
  }

  capex: {
    method: 'schedule' | 'percentage' | 'growth'
    percentageValue?: number
    growthRate?: number
    maintenanceSplit?: number // % that is maintenance vs growth
  }

  interest: {
    method: 'schedule' | 'average' | 'fixed'
    fixedRate?: number
    averageRate?: number
  }
}

// Validation Rules
export interface ValidationRule {
  field: string
  min?: number
  max?: number
  required?: boolean
  customValidator?: (value: any, model: DCFModelData) => boolean
  errorMessage: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'critical'
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}
