// Re-export all types from organized modules for better maintainability
export * from './api'
export * from './models'
export * from './common'

// Legacy exports for backward compatibility
// These maintain the original interface structure but are now defined in separate modules

// API Response Types (from api.ts)
export type { ApiResponse, ApiError, PaginatedResponse } from './api'

// Business Model Types (from models.ts)
export type {
  Company,
  ValuationProject,
  ShareClass,
  OptionsWarrants,
  CapTableData,
  Status,
  ShareClassType,
  PreferenceType,
  DividendsType,
  OptionsType,
  BreakpointType,
  Breakpoint,
  BreakpointTableData,
  DLOMInputs,
  DLOMResults,
  ModelWeights,
  OPMParameters,
  BreakpointOption,
  SecurityValuation,
  FinancialAssumption,
} from './models'

// Common Component Types (from common.ts)
export type {
  LoadingState,
  FormState,
  FormFieldProps,
  StatusBadgeProps,
  MetricCardProps,
  PageHeaderProps,
  LoadingCardProps,
  SummaryCardProps,
  TabButtonProps,
} from './common'

// Utility Types (from common.ts)
export type { Optional, RequiredBy, Nullable, DeepPartial } from './common'
