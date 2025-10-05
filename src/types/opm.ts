/**
 * OPM (Option Pricing Model) Type Definitions
 *
 * Comprehensive type system for Single OPM and Hybrid Scenario PWERM modes.
 * Covers parameters, results, scenarios, and API contracts.
 *
 * @module OPMTypes
 * @version 1.0.0
 */

import { Decimal } from 'decimal.js'

// ============================================================================
// Core OPM Parameters
// ============================================================================

/**
 * Black-Scholes parameters for OPM calculations
 */
export interface OPMBlackScholesParams {
  /** Company/enterprise value (S) */
  companyValue: number

  /** Strike price / breakpoint value (K) */
  strikePrice: number

  /** Time to liquidity event in years (T) */
  timeToLiquidity: number

  /** Annualized volatility as decimal (σ) - e.g., 0.60 for 60% */
  volatility: number

  /** Risk-free rate as decimal (r) - e.g., 0.045 for 4.5% */
  riskFreeRate: number

  /** Dividend yield as decimal (q) - typically 0 for startups */
  dividendYield: number
}

/**
 * Breakpoint for OPM calculation
 */
export interface OPMBreakpoint {
  /** Unique identifier */
  id: string

  /** Breakpoint value (enterprise value threshold) */
  value: number

  /** Breakpoint type */
  type:
    | 'liquidation_preference'
    | 'pro_rata_distribution'
    | 'option_exercise'
    | 'voluntary_conversion'
    | 'participation_cap'

  /** Security class this breakpoint affects */
  securityClass: string

  /** Description of what happens at this breakpoint */
  description: string

  /** Share allocation changes at this breakpoint */
  allocation: {
    securityClass: string
    sharesReceived: number
    participationPercentage: number // Percentage (0-100) from V3 breakpoints
  }[]
}

// ============================================================================
// Single OPM Mode
// ============================================================================

/**
 * Single OPM calculation request
 */
export interface SingleOPMRequest {
  /** Valuation ID */
  valuationId: string

  /** Target FMV per share to achieve */
  targetFMV: number

  /** Black-Scholes parameters (optional - will use assumptions if not provided) */
  blackScholesParams?: Partial<OPMBlackScholesParams>

  /** Breakpoints to use (optional - will calculate from cap table if not provided) */
  breakpoints?: OPMBreakpoint[]

  /** Security class to optimize for */
  securityClassId: string
}

/**
 * Single OPM calculation result
 */
export interface SingleOPMResult {
  /** Whether calculation succeeded */
  success: boolean

  /** Calculated enterprise value that achieves target FMV */
  enterpriseValue: number

  /** Actual FMV achieved */
  actualFMV: number

  /** Error between target and actual FMV */
  error: number

  /** Whether backsolve converged */
  converged: boolean

  /** Number of iterations required */
  iterations: number

  /** Black-Scholes parameters used */
  blackScholesParams: OPMBlackScholesParams

  /** Breakpoints used in calculation */
  breakpoints: OPMBreakpoint[]

  /** Detailed allocation at solution */
  allocation: OPMAllocationResult

  /** Calculation metadata */
  metadata: {
    method: 'newton_raphson' | 'binary_search' | 'hybrid'
    executionTimeMs: number
    iterationHistory?: {
      iteration: number
      enterpriseValue: number
      calculatedFMV: number
      error: number
    }[]
  }

  /** Errors (if any) */
  errors?: string[]

  /** Warnings (if any) */
  warnings?: string[]
}

/**
 * OPM allocation result for a specific enterprise value
 */
export interface OPMAllocationResult {
  /** Enterprise value analyzed */
  enterpriseValue: number

  /** Allocations by security class */
  allocationsByClass: {
    securityClass: string
    totalShares: number
    totalValue: number
    valuePerShare: number
    percentOfTotal: number
  }[]

  /** Breakpoint-level details */
  breakpointAllocations: {
    breakpointId: string
    breakpointValue: number
    breakpointType: string
    active: boolean // Whether this breakpoint is active at current EV
    allocationChanges: {
      securityClass: string
      sharesReceived: number
      valueReceived: number
    }[]
  }[]

  /** Total company value distributed */
  totalValueDistributed: number

  /** Validation */
  valid: boolean
  validationErrors?: string[]
}

// ============================================================================
// Hybrid Scenario PWERM Mode
// ============================================================================

/**
 * Single scenario definition for hybrid mode
 */
export interface HybridScenario {
  /** Unique scenario ID */
  id: string

  /** Scenario name (e.g., "IPO", "Acquisition", "Down Round") */
  name: string

  /** Probability weight (0-100 or 0-1 depending on format) */
  probability: number

  /** Scenario mode: manual (user enters enterprise value) or backsolve (system solves for it) */
  mode?: 'manual' | 'backsolve'

  /** Enterprise value for manual mode scenarios */
  enterpriseValue?: number

  /** Target FMV for this scenario (legacy/backward compatibility) */
  targetFMV: number

  /** Scenario-specific parameters (optional - inherits from global if not provided) */
  blackScholesParams?: Partial<OPMBlackScholesParams>

  /** Scenario-specific breakpoints (optional) */
  breakpoints?: OPMBreakpoint[]

  /** Description/notes about this scenario */
  description?: string

  /** Color for UI visualization */
  color?: string
}

/**
 * Hybrid PWERM calculation request
 */
export interface HybridPWERMRequest {
  /** Valuation ID */
  valuationId: string

  /** Security class to optimize for */
  securityClassId: string

  /** Scenarios to analyze */
  scenarios: HybridScenario[]

  /** Global Black-Scholes parameters (used unless scenario overrides) */
  globalBlackScholesParams?: Partial<OPMBlackScholesParams>

  /** Probability format */
  probabilityFormat: 'percentage' | 'decimal'

  /** Target probability-weighted FMV to achieve */
  targetWeightedFMV: number
}

/**
 * Hybrid PWERM calculation result
 */
export interface HybridPWERMResult {
  /** Whether calculation succeeded */
  success: boolean

  /** Calculated enterprise value that achieves target weighted FMV */
  enterpriseValue: number

  /** Probability-weighted FMV achieved */
  weightedFMV: number

  /** Error between target and actual weighted FMV */
  error: number

  /** Whether backsolve converged */
  converged: boolean

  /** Number of iterations required */
  iterations: number

  /** Scenario-level results */
  scenarioResults: HybridScenarioResult[]

  /** Probability validation */
  probabilityValidation: {
    valid: boolean
    totalProbability: number
    normalizedProbabilities: number[]
    errors?: string[]
    warnings?: string[]
  }

  /** Weighted statistics */
  statistics: {
    weightedMean: number
    weightedVariance: number
    weightedStdDev: number
    coefficientOfVariation: number
    percentile25: number
    percentile50: number
    percentile75: number
  }

  /** Calculation metadata */
  metadata: {
    method: 'newton_raphson' | 'binary_search' | 'hybrid'
    executionTimeMs: number
    iterationHistory?: {
      iteration: number
      enterpriseValue: number
      weightedFMV: number
      error: number
    }[]
  }

  /** Errors (if any) */
  errors?: string[]

  /** Warnings (if any) */
  warnings?: string[]
}

/**
 * Result for a single scenario within hybrid mode
 */
export interface HybridScenarioResult {
  /** Scenario ID */
  scenarioId: string

  /** Scenario name */
  scenarioName: string

  /** Probability weight (normalized to 0-1) */
  probability: number

  /** Target FMV for this scenario */
  targetFMV: number

  /** Calculated FMV at solution enterprise value */
  calculatedFMV: number

  /** Black-Scholes parameters used */
  blackScholesParams: OPMBlackScholesParams

  /** Breakpoints used */
  breakpoints: OPMBreakpoint[]

  /** Detailed allocation at solution */
  allocation: OPMAllocationResult

  /** Contribution to weighted FMV */
  weightedContribution: number

  /** Percentage of total weighted value */
  percentOfWeightedValue: number
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * POST /api/valuations/[id]/opm-single
 */
export interface SingleOPMAPIRequest {
  targetFMV: number
  securityClassId: string
  blackScholesParams?: Partial<OPMBlackScholesParams>
  breakpoints?: OPMBreakpoint[]
}

export interface SingleOPMAPIResponse {
  success: boolean
  data?: SingleOPMResult
  error?: string
}

/**
 * POST /api/valuations/[id]/opm-hybrid
 */
export interface HybridPWERMAPIRequest {
  securityClassId: string
  scenarios: HybridScenario[]
  globalBlackScholesParams?: Partial<OPMBlackScholesParams>
  probabilityFormat: 'percentage' | 'decimal'
  targetWeightedFMV: number
}

export interface HybridPWERMAPIResponse {
  success: boolean
  data?: HybridPWERMResult
  error?: string
}

/**
 * GET /api/valuations/[id]/opm-breakpoints
 */
export interface OPMBreakpointsAPIResponse {
  success: boolean
  data?: {
    breakpoints: OPMBreakpoint[]
    metadata: {
      totalBreakpoints: number
      breakpointTypes: {
        type: string
        count: number
      }[]
    }
  }
  error?: string
}

// ============================================================================
// UI Component Props
// ============================================================================

/**
 * Props for SingleOPMPanel component
 */
export interface SingleOPMPanelProps {
  valuationId: string
  assumptions: any[] // Assumptions array from database
  onResultCalculated?: (result: SingleOPMResult) => void
}

/**
 * Props for HybridScenarioManager component
 */
export interface HybridScenarioManagerProps {
  valuationId: string
  assumptions: any[]
  onResultCalculated?: (result: HybridPWERMResult) => void
}

/**
 * Props for HybridScenarioCard component
 */
export interface HybridScenarioCardProps {
  scenario: HybridScenario
  index: number
  totalScenarios: number
  onUpdate: (scenario: HybridScenario) => void
  onDelete: () => void
  probabilityFormat: 'percentage' | 'decimal'
  globalParams: Partial<OPMBlackScholesParams>
}

/**
 * Props for OPMResultsDisplay component
 */
export interface OPMResultsDisplayProps {
  result: SingleOPMResult | HybridPWERMResult
  mode: 'single' | 'hybrid'
  onExport?: () => void
}

// ============================================================================
// Internal Calculation Types
// ============================================================================

/**
 * Optimization target function for backsolve
 */
export type OPMTargetFunction = (enterpriseValue: Decimal) => Decimal

/**
 * OPM calculation context (internal to calculation engine)
 */
export interface OPMCalculationContext {
  valuationId: string
  securityClassId: string
  capTable: any // CapTableSnapshot from V3
  breakpoints: OPMBreakpoint[]
  blackScholesParams: OPMBlackScholesParams
  targetFMV: number
}

/**
 * Backsolve optimization parameters
 */
export interface BacksolveOptimizationParams {
  /** Initial guess for enterprise value */
  initialGuess?: number

  /** Search bounds */
  searchBounds?: {
    min: number
    max: number
  }

  /** Maximum iterations */
  maxIterations?: number

  /** Convergence tolerance */
  tolerance?: number

  /** Optimization method */
  method?: 'newton_raphson' | 'binary_search' | 'hybrid' | 'auto'
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * OPM parameter validation result
 */
export interface OPMValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  validatedParams: OPMBlackScholesParams
}

/**
 * Hybrid scenario validation result
 */
export interface HybridScenarioValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  probabilityValidation: {
    valid: boolean
    totalProbability: number
    normalizedProbabilities: number[]
    errors: string[]
    warnings: string[]
  }
  scenarioValidations: {
    scenarioId: string
    valid: boolean
    errors: string[]
    warnings: string[]
  }[]
}

// ============================================================================
// Export Formats
// ============================================================================

/**
 * OPM result export format
 */
export interface OPMResultExport {
  metadata: {
    valuationId: string
    exportDate: string
    mode: 'single' | 'hybrid'
  }
  result: SingleOPMResult | HybridPWERMResult
  formatVersion: string
}
