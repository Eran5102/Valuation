/**
 * Validation Type Definitions
 *
 * This module defines types for validation and consistency checking.
 *
 * @module ValidationTypes
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import type { BreakpointType } from './BreakpointTypes'

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info'

/**
 * Validation test result
 */
export interface ValidationTestResult {
  /** Test name */
  testName: string

  /** Category of test */
  category: ValidationCategory

  /** Whether test passed */
  passed: boolean

  /** Expected value */
  expected: any

  /** Actual value */
  actual: any

  /** Validation message */
  message: string

  /** Severity level */
  severity: ValidationSeverity

  /** Additional details */
  details?: string

  /** Timestamp of test */
  timestamp: Date
}

/**
 * Validation category
 */
export type ValidationCategory =
  | 'input_validation'
  | 'structural_validation'
  | 'count_validation'
  | 'consistency_validation'
  | 'mathematical_validation'
  | 'dependency_validation'

/**
 * Cap Table Validation Result
 */
export interface CapTableValidationResult {
  /** Whether cap table is valid */
  isValid: boolean

  /** All validation tests */
  tests: ValidationTestResult[]

  /** Errors (severity: error) */
  errors: ValidationTestResult[]

  /** Warnings (severity: warning) */
  warnings: ValidationTestResult[]

  /** Summary message */
  summary: string
}

/**
 * Breakpoint Validation Result
 */
export interface BreakpointValidationResult {
  /** Whether breakpoints are valid */
  isValid: boolean

  /** All validation tests */
  tests: ValidationTestResult[]

  /** Errors */
  errors: ValidationTestResult[]

  /** Warnings */
  warnings: ValidationTestResult[]

  /** Summary message */
  summary: string

  /** Expected counts by type */
  expectedCounts: Record<BreakpointType, number>

  /** Actual counts by type */
  actualCounts: Record<BreakpointType, number>
}

/**
 * Consistency Check Result
 *
 * Validates consistency across breakpoints
 */
export interface ConsistencyCheckResult {
  /** Check name */
  checkName: string

  /** Whether check passed */
  passed: boolean

  /** Issue description (if failed) */
  issue?: string

  /** Recommended fix (if failed) */
  recommendation?: string

  /** Affected breakpoints */
  affectedBreakpoints?: number[]
}

/**
 * Expected breakpoint counts
 */
export interface ExpectedBreakpointCounts {
  /** Expected LP breakpoints (= number of distinct seniority ranks) */
  liquidationPreference: number

  /** Expected pro rata breakpoints (always 1) */
  proRataDistribution: number

  /** Expected option exercise breakpoints (= number of unique strikes > $0.01) */
  optionExercise: number

  /** Expected voluntary conversion breakpoints */
  voluntaryConversion: number

  /** Expected participation cap breakpoints */
  participationCap: number

  /** Calculation rationale */
  rationale: Record<BreakpointType, string>
}

/**
 * Structural validation checks
 */
export interface StructuralValidation {
  /** Whether ranges are continuous (no gaps) */
  rangesContinuous: boolean

  /** Whether ranges are non-overlapping */
  rangesNonOverlapping: boolean

  /** Whether dependencies are satisfied */
  dependenciesSatisfied: boolean

  /** Whether conversion order matches RVPS order */
  conversionOrderCorrect: boolean

  /** Issues found */
  issues: string[]
}

/**
 * Mathematical validation checks
 */
export interface MathematicalValidation {
  /** Whether all formulas are calculable */
  formulasCalculable: boolean

  /** Whether circular dependencies converge */
  circularDependenciesConverge: boolean

  /** Whether totals match expectations */
  totalsMat: boolean

  /** Issues found */
  issues: string[]
}
