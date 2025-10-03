/**
 * Core Breakpoint Type Definitions
 *
 * This module defines the fundamental types for theoretical breakpoint analysis.
 * Key Principle: Breakpoints define WHEN behavior changes, not WHAT happens at specific exit values.
 *
 * @module BreakpointTypes
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'

/**
 * Breakpoint types following mathematical rules
 */
export enum BreakpointType {
  LIQUIDATION_PREFERENCE = 'liquidation_preference',
  PRO_RATA_DISTRIBUTION = 'pro_rata_distribution',
  OPTION_EXERCISE = 'option_exercise',
  VOLUNTARY_CONVERSION = 'voluntary_conversion',
  PARTICIPATION_CAP = 'participation_cap',
}

/**
 * Range-Based Breakpoint Specification
 *
 * Represents a breakpoint as a RANGE (from → to) rather than a single point.
 * Each range defines who participates and how value is distributed.
 */
export interface RangeBasedBreakpoint {
  /** Type of breakpoint */
  breakpointType: BreakpointType

  /** Sequential order (1, 2, 3...) */
  breakpointOrder: number

  /** Range start value */
  rangeFrom: Decimal

  /** Range end value (null for open-ended final range) */
  rangeTo: Decimal | null

  /** Whether this is an open-ended range */
  isOpenEnded: boolean

  /** Securities participating in this range */
  participants: BreakpointParticipant[]

  /** Total shares participating in this range */
  totalParticipatingShares: Decimal

  /** Value per share for this specific range (range ÷ participating shares) */
  redemptionValuePerShare: Decimal

  /** RVPS for THIS range only (not cumulative) */
  sectionRVPS: Decimal

  /** Calculation method used */
  calculationMethod: string

  /** Human-readable explanation */
  explanation: string

  /** Mathematical derivation for audit */
  mathematicalDerivation: string

  /** Dependencies on other breakpoints */
  dependencies: string[]

  /** Securities affected by this breakpoint */
  affectedSecurities: string[]

  /** Priority order for sorting (0-1000 for LP, 1000-2000 for pro-rata, etc.) */
  priorityOrder: number

  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Participant in a breakpoint range
 *
 * Represents a security participating in a specific breakpoint range
 * with tracking of RVPS accumulation
 */
export interface BreakpointParticipant {
  /** Security name (e.g., "Series A", "Common Stock", "Options @ $1.25") */
  securityName: string

  /** Security type for categorization */
  securityType: 'common' | 'preferred_series' | 'option_pool'

  /** Number of shares participating */
  participatingShares: Decimal

  /** Percentage of total participating shares in this range */
  participationPercentage: Decimal

  /** RVPS increment from THIS range only */
  rvpsAtBreakpoint: Decimal

  /** Total RVPS accumulated across ALL ranges up to this point */
  cumulativeRVPS: Decimal

  /** Dollar value from THIS range */
  sectionValue: Decimal

  /** Total dollar value accumulated across ALL ranges */
  cumulativeValue: Decimal

  /** Participation status */
  participationStatus: 'active' | 'capped' | 'converted' | 'exercised' | 'inactive'

  /** Additional notes */
  participationNotes?: string
}

/**
 * Theoretical Breakpoint (Formula-Based)
 *
 * Represents a breakpoint with a FORMULA rather than hardcoded values.
 * The formula calculates the breakpoint value based on the current cap table state.
 */
export interface TheoreticalBreakpoint {
  /** Type of breakpoint */
  breakpointType: BreakpointType

  /** Sequential order */
  breakpointOrder: number

  /** Formula that calculates the breakpoint value when asked */
  breakpointFormula: BreakpointFormula

  /** Condition that triggers this breakpoint */
  condition: BreakpointCondition

  /** Securities affected */
  affectedSecurities: string[]

  /** Mathematical derivation */
  mathematicalDerivation: string

  /** Dependencies on other breakpoints */
  dependencies: string[]

  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Breakpoint Formula Interface
 *
 * Defines HOW to calculate a breakpoint value, not WHAT the value is.
 * Supports lazy evaluation based on current cap table state.
 */
export interface BreakpointFormula {
  /** Type of formula */
  formulaType: FormulaType

  /** Parameters for the formula */
  parameters: FormulaParameters

  /** Calculate the breakpoint value based on context */
  calculate(context: CalculationContext): Decimal

  /** Get mathematical expression for humans */
  toExpression(): MathematicalExpression

  /** Get dependencies (which breakpoints must be calculated first) */
  getDependencies(): BreakpointDependency[]
}

/**
 * Formula types
 */
export type FormulaType =
  | 'cumulative_liquidation_preference'
  | 'total_liquidation_preference'
  | 'voluntary_conversion_indifference'
  | 'option_exercise_circular'
  | 'participation_cap_threshold'

/**
 * Formula parameters (varies by formula type)
 */
export type FormulaParameters = Record<string, any>

/**
 * Calculation context for formula evaluation
 */
export interface CalculationContext {
  /** Current cap table snapshot */
  capTable: any // Will be defined in CapTableTypes.ts

  /** Already-calculated breakpoints (for sequential logic) */
  priorBreakpoints?: TheoreticalBreakpoint[]

  /** Conversion decisions made */
  conversionDecisions?: Map<string, boolean>

  /** Additional context data */
  metadata?: Record<string, any>
}

/**
 * Mathematical expression for human consumption
 */
export interface MathematicalExpression {
  /** LaTeX format for rendering */
  latex: string

  /** Plain text format */
  plaintext: string

  /** Human-readable explanation */
  explanation?: string

  /** Component expressions */
  components?: string[]
}

/**
 * Breakpoint dependency
 */
export interface BreakpointDependency {
  /** Type of breakpoint depended upon */
  breakpointType: BreakpointType

  /** Specific identifier (e.g., seniority rank, conversion step) */
  identifier?: string | number

  /** Reason for dependency */
  reason: string
}

/**
 * Breakpoint condition
 */
export interface BreakpointCondition {
  /** Description of the condition */
  description: string

  /** Trigger point (if calculable) */
  triggerPoint?: Decimal

  /** Whether this involves circular dependency */
  circularDependency?: boolean

  /** Trigger formula (if circular) */
  triggerFormula?: string

  /** Resolution method (if circular) */
  resolutionMethod?: 'newton_raphson' | 'binary_search' | 'iterative'

  /** Dependencies */
  dependencies?: string[]
}

/**
 * Critical value point in the waterfall
 */
export interface CriticalValue {
  /** The critical exit value */
  value: Decimal

  /** Description of what this value represents */
  description: string

  /** Securities affected at this point */
  affectedSecurities: string[]

  /** What triggers at this value */
  triggers: string[]

  /** Type of critical value */
  valueType?: string
}

/**
 * Complete breakpoint analysis result
 */
export interface BreakpointAnalysisResult {
  /** Total number of breakpoints identified */
  totalBreakpoints: number

  /** Count by breakpoint type */
  breakpointsByType: Record<BreakpointType, number>

  /** Theoretical breakpoints (formula-based) */
  theoreticalBreakpoints: TheoreticalBreakpoint[]

  /** Range-based breakpoints (for UI display) */
  rangeBasedBreakpoints?: RangeBasedBreakpoint[]

  /** Per-class RVPS analysis */
  classRVPSAnalysis?: any // Will be defined in a separate file

  /** Conversion order (sequential priority) */
  conversionOrder?: any // Will be defined in a separate file

  /** Critical exit value points */
  criticalValues: CriticalValue[]

  /** Human-readable audit trail */
  auditTrail: string

  /** Validation results */
  validationResults: ValidationResult[]

  /** Performance metrics */
  performanceMetrics: PerformanceMetrics
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Name of validation test */
  testName: string

  /** Whether test passed */
  passed: boolean

  /** Expected value */
  expected: any

  /** Actual value */
  actual: any

  /** Validation message */
  message: string

  /** Severity level */
  severity?: 'error' | 'warning' | 'info'
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Total analysis time in milliseconds */
  analysisTimeMs: number

  /** Iterations used by solvers */
  iterationsUsed?: Record<string, number>

  /** Cache hits */
  cacheHits?: number

  /** Additional metrics */
  [key: string]: any
}
