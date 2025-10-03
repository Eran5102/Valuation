/**
 * Formula Type Definitions
 *
 * This module defines types for breakpoint formulas and calculations.
 * Formulas define HOW to calculate values, not WHAT the values are.
 *
 * @module FormulaTypes
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import type { CapTableSnapshot } from './CapTableTypes'
import type { TheoreticalBreakpoint } from './BreakpointTypes'

/**
 * Per-Class RVPS Analysis Result
 *
 * RVPS = Redemption Value Per Share (Class LP ÷ Class Shares)
 * Used to determine conversion order (lowest RVPS converts first)
 */
export interface ClassRVPSAnalysis {
  /** Series name */
  seriesName: string

  /** Class-specific liquidation preference */
  classLiquidationPreference: Decimal

  /** Total shares in this class */
  classTotalShares: Decimal

  /** Class RVPS (LP ÷ Shares) */
  classRVPS: Decimal

  /** Whether this class is participating */
  isParticipating: boolean

  /** Preference type */
  preferenceType: string

  /** Conversion priority (assigned based on RVPS order) */
  conversionPriority?: number

  /** Mathematical derivation */
  calculationDetails: string
}

/**
 * Conversion Order Result
 *
 * Defines the sequential order in which non-participating preferred converts
 * (lowest RVPS first = lowest opportunity cost)
 */
export interface ConversionOrderResult {
  /** Ordered list of class RVPS analyses */
  orderedClasses: ClassRVPSAnalysis[]

  /** Summary explanation */
  orderingLogic: string

  /** Visual timeline representation */
  timeline?: ConversionTimelineEntry[]
}

/**
 * Conversion timeline entry
 */
export interface ConversionTimelineEntry {
  /** Step number */
  step: number

  /** Series name */
  seriesName: string

  /** Class RVPS */
  classRVPS: Decimal

  /** Conversion priority */
  priority: number

  /** Explanation of why this order */
  rationale: string
}

/**
 * Indifference Point Calculation Result
 *
 * Result of calculating voluntary conversion indifference point
 */
export interface IndifferencePointResult {
  /** Exit value at indifference point */
  breakpointValue: Decimal

  /** Mathematical proof of calculation */
  mathematicalProof: string

  /** LP waived by classes that already converted */
  waivedLP: Decimal

  /** LP remaining after this conversion */
  remainingLP: Decimal

  /** Pro rata percentage after conversion */
  proRataPercentage: Decimal

  /** Step number in conversion sequence */
  stepNumber: number

  /** Classes that already converted (dependencies) */
  priorConversions: string[]
}

/**
 * Indifference Proof Data
 *
 * Data used to generate indifference point mathematical proof
 */
export interface IndifferenceProofData {
  /** Conversion step number */
  stepNumber: number

  /** Target series name */
  targetSeries: string

  /** Already converted classes */
  alreadyConverted: string[]

  /** LP waived by prior conversions */
  waivedLP: Decimal

  /** Target series LP */
  targetLP: Decimal

  /** Remaining LP after conversion */
  remainingLP: Decimal

  /** Pro rata percentage */
  proRataPercentage: Decimal

  /** Calculated indifference point */
  indifferencePoint: Decimal
}

/**
 * Circular Dependency Solution
 *
 * Result of solving a circular dependency (e.g., option exercise)
 */
export interface CircularSolutionResult {
  /** Solved exit value */
  exitValue: Decimal

  /** Number of iterations used */
  iterations: number

  /** Final convergence tolerance achieved */
  tolerance: Decimal

  /** Whether solution converged */
  converged: boolean

  /** Solution method used */
  method: 'newton_raphson' | 'binary_search' | 'iterative'

  /** Mathematical explanation */
  explanation: string

  /** Iteration history (for debugging) */
  iterationHistory?: IterationStep[]
}

/**
 * Iteration step in circular solver
 */
export interface IterationStep {
  /** Iteration number */
  iteration: number

  /** Exit value at this step */
  exitValue: Decimal

  /** Error/residual at this step */
  error: Decimal

  /** Condition satisfied? */
  satisfied: boolean
}

/**
 * Participation Rules
 *
 * Defines who participates in pro-rata distribution
 */
export interface ParticipationRules {
  /** Always participate */
  alwaysParticipate: string[]

  /** Never participate (initially) */
  neverParticipate: string[]

  /** Conditionally participate */
  conditionalParticipation: ConditionalParticipationRule[]

  /** Human-readable summary */
  rulesSummary: string
}

/**
 * Conditional participation rule
 */
export interface ConditionalParticipationRule {
  /** Security or class name */
  security: string

  /** Condition for participation */
  condition: string

  /** When condition is met */
  trigger: string
}

/**
 * RVPS History Entry
 *
 * Tracks RVPS accumulation for a security across breakpoints
 */
export interface RVPSHistoryEntry {
  /** Breakpoint order where this increment occurred */
  breakpointOrder: number

  /** Breakpoint type */
  breakpointType: string

  /** RVPS increment from this breakpoint */
  rvpsIncrement: Decimal

  /** Breakpoint range size */
  breakpointRange: Decimal

  /** Participation percentage in this range */
  participationPercentage: Decimal

  /** Cumulative RVPS after this breakpoint */
  cumulativeAfter: Decimal

  /** Human-readable explanation */
  explanation: string
}

/**
 * Security RVPS History
 *
 * Complete RVPS tracking for a single security
 */
export interface SecurityRVPSHistory {
  /** Security name */
  securityName: string

  /** Current cumulative RVPS */
  cumulativeRVPS: Decimal

  /** History of RVPS increments by breakpoint */
  history: RVPSHistoryEntry[]

  /** Total value accumulated */
  totalValue: Decimal

  /** Number of breakpoints participated in */
  breakpointsParticipated: number
}

/**
 * Participation Calculation Result
 *
 * Result of calculating who participates in a range
 */
export interface ParticipationCalculationResult {
  /** Total participating shares */
  totalParticipatingShares: Decimal

  /** Individual participants */
  participants: Array<{
    securityName: string
    securityType: string
    shares: Decimal
    percentage: Decimal
    reason: string
  }>

  /** Participation logic applied */
  logicApplied: string
}
