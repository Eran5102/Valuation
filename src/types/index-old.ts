// Shared type definitions for enterprise-grade type safety

// API Response Types
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

// Form Types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState<T> {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isDirty: boolean
}

export interface FormFieldProps<T = string> {
  label: string
  value: T
  onChange: (value: T) => void
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}

// Loading State
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Common Status Types
export type Status = 'draft' | 'in_progress' | 'under_review' | 'completed' | 'on_hold'
export type ShareClassType = 'Common' | 'Preferred'
export type PreferenceType = 'Non-Participating' | 'Participating' | 'Participating with Cap'
export type DividendsType = 'None' | 'Cumulative' | 'Non-Cumulative'
export type OptionsType = 'Options' | 'Warrants' | 'RSUs'

// Valuation Types
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
  assumptions?: any // Add assumptions property for backward compatibility
}

// Cap Table Types
export interface ShareClass {
  id: string
  companyId: number
  shareType: 'common' | 'preferred'
  name: string
  roundDate: string
  sharesOutstanding: number
  pricePerShare: number
  // Calculated fields
  amountInvested?: number // sharesOutstanding * pricePerShare
  preferenceType: 'non-participating' | 'participating' | 'participating-with-cap'
  lpMultiple: number // LP Multiple (x)
  totalLP?: number // amountInvested * lpMultiple
  seniority: number // 0 = most senior, higher = less senior
  participationCap?: number | null // Only relevant for participating-with-cap
  conversionRatio: number
  asConvertedShares?: number // sharesOutstanding * conversionRatio
  dividendsDeclared: boolean
  dividendsRate?: number | null
  dividendsType?: 'cumulative' | 'non-cumulative' | null
  pik: boolean
  totalDividends?: number // Calculated based on dividends from roundDate to present
  shares?: number // Add shares property for backward compatibility
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

// DLOM Types
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

// Breakpoints Types
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

export enum BreakpointType {
  LIQUIDATION_PREFERENCE = 'Liquidation Preference',
  PRO_RATA = 'Pro Rata',
  OPTION_EXERCISE = 'Option Exercise',
  CAP_REACHED = 'Cap Reached',
  CONVERSION = 'Conversion',
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

export interface CapTableConfig {
  shareClasses: ShareClass[]
  options: OptionsWarrants[]
}

// OPM (Option Pricing Model) Types
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

// Financial Assumptions
export interface FinancialAssumption {
  id: string
  category: string
  name: string
  value: string
  unit: string
  description: string
}

// Component Props Types
export interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon?: React.ElementType
  children: React.ReactNode
  disabled?: boolean
}

export interface StatusBadgeProps {
  status: Status | ShareClassType | string
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

// Utility Types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>
