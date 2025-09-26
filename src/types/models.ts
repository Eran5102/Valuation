// Business domain model type definitions

import { ReactNode } from 'react'

// Common status and enum types
export type Status = 'draft' | 'in_progress' | 'under_review' | 'completed' | 'on_hold'
export type ShareClassType = 'Common' | 'Preferred'
export type PreferenceType = 'Non-Participating' | 'Participating' | 'Participating with Cap'
export type DividendsType = 'None' | 'Cumulative' | 'Non-Cumulative'
export type OptionsType = 'Options' | 'Warrants' | 'RSUs'

export enum BreakpointType {
  LIQUIDATION_PREFERENCE = 'Liquidation Preference',
  PRO_RATA = 'Pro Rata',
  OPTION_EXERCISE = 'Option Exercise',
  CAP_REACHED = 'Cap Reached',
  CONVERSION = 'Conversion',
}

// Core business entities
export interface Company {
  id: number
  name: string
  legal_name?: string
  industry?: string
  stage?: string
  location?: string
  created_at: string
  updated_at: string
}

export interface ValuationProject {
  id: string
  title: string
  clientName: string
  valuationDate: string
  projectType: string
  status: Status
  currency: string
  maxProjectedYears: number
  discountingConvention: string
  taxRate: number
  description: string
  company_id?: number
  created_at?: string
  updated_at?: string
  assumptions?: Record<string, unknown>
  cap_table?: CapTableData
}

// Cap table related types
export interface ShareClass {
  id: string
  companyId: number
  shareType: 'common' | 'preferred'
  name: string
  roundDate: string
  sharesOutstanding: number
  pricePerShare: number
  amountInvested?: number
  preferenceType: 'non-participating' | 'participating' | 'participating-with-cap'
  lpMultiple: number
  totalLP?: number
  seniority: number
  participationCap?: number | null
  conversionRatio: number
  asConvertedShares?: number
  dividendsDeclared: boolean
  dividendsRate?: number | null
  dividendsType?: 'cumulative' | 'non-cumulative' | null
  pik: boolean
  totalDividends?: number
  shares?: number
}

export interface OptionsWarrants {
  id: string
  numOptions: number
  exercisePrice: number
  type: OptionsType
  isEditing?: boolean
}

export interface CapTableData {
  shareClasses: ShareClass[]
  options: OptionsWarrants[]
}

// DLOM (Discount for Lack of Marketability) types
export interface DLOMInputs {
  stockPrice: number
  strikePrice: number
  volatility: number
  riskFreeRate: number
  timeToExpiration: number
  dividendYield: number
}

export interface DLOMResults {
  chaffee: number
  finnerty: number
  ghaidarov: number
  longstaff: number
}

export interface ModelWeights {
  chaffee: number
  finnerty: number
  ghaidarov: number
  longstaff: number
}

// Breakpoints analysis types
export interface Breakpoint {
  id: number
  name: string
  type: BreakpointType
  fromValue: number
  toValue: number
  participatingSecurities: Array<{
    name: string
    percentage: number
    shares: number
  }>
  shares: number
  sectionRVPS?: number
  cumulativeRVPS?: number
}

export interface BreakpointTableData {
  id: number
  breakpoint: string
  type: string
  from: string
  to: string
  participatingSecurities: string[]
  shares: string
  sectionRVPS: string
  cumulativeRVPS: string
}

export interface BreakpointValidationError {
  expected: unknown
  actual: unknown
}

// OPM (Option Pricing Model) types
export interface OPMParameters {
  companyEquityValue: number
  volatility: number
  riskFreeRate: number
  timeToLiquidity: number
  dividendYield: number
}

export interface BreakpointOption {
  id: number
  fromValue: number
  toValue: number
  strikePrice: number
  optionValue: number
  incrementalValue?: number
  d1: number
  d2: number
  participatingSecurities: Array<{
    name: string
    percentage: number
    shares: number
    allocatedValue: number
  }>
}

export interface SecurityValuation {
  securityName: string
  totalValue: number
  shares: number
  valuePerShare: number
}

// Financial assumptions types
export interface FinancialAssumption {
  id: string
  category: string
  name: string
  value: string
  unit: string
  description: string
}

export interface AssumptionCategory {
  id: string
  name: string
  assumptions: FinancialAssumption[]
}

// Waterfall analysis types
export interface PreferredStock {
  name: string
  shares: number
  price_per_share: number
  liquidation_preference: number
  participation_cap_multiple?: number
  is_participating: boolean
  seniority_rank: number
  conversion_ratio: number
  dividend_rate?: number
  is_cumulative_dividend?: boolean
}

export interface OptionPool {
  name: string
  shares: number
  exercise_price: number
  expiration_date: string
}

export interface CapTable {
  common_shares: number
  preferred_series: PreferredStock[]
  option_pools: OptionPool[]
  total_authorized_shares: number
}

export interface WaterfallInput {
  cap_table: CapTable
  company_value: number
  analysis_date: string
  assumptions: {
    discount_rate: number
    time_to_liquidity: number
    volatility: number
  }
}

export interface WaterfallResult {
  breakpoints: Breakpoint[]
  security_valuations: SecurityValuation[]
  total_value: number
  verification_hash: string
  calculation_metadata: {
    timestamp: string
    version: string
    input_hash: string
  }
}

// Comprehensive cap table types
export interface ComprehensiveCapTable {
  common_stock: {
    shares_outstanding: number
    price_per_share: number
  }
  preferred_series: Array<{
    series_name: string
    shares_outstanding: number
    price_per_share: number
    liquidation_preference: number
    participation_multiple?: number
    is_participating: boolean
    seniority_rank: number
    conversion_ratio: number
    dividend_rate?: number
    is_cumulative_dividend?: boolean
    accrued_dividends?: number
  }>
  option_pools: Array<{
    pool_name: string
    shares_available: number
    exercise_price: number
    vesting_schedule?: string
  }>
  validation_errors?: ModelValidationError[]
  validation_warnings?: ModelValidationError[]
}

export interface ModelValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ModelValidationResult {
  is_valid: boolean
  errors: ModelValidationError[]
  warnings: ModelValidationError[]
}

// Add missing type alias for backward compatibility
export type CapTableConfig = any // Temporary fix for missing type
