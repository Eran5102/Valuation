/**
 * Analysis Sequencer
 *
 * Sequences the execution of breakpoint analyzers in correct dependency order.
 * Ensures analyzers run in the right sequence with proper data flow.
 *
 * Execution Sequence:
 * 1. Liquidation Preference (creates LP breakpoints)
 * 2. Pro-Rata Distribution (uses LP breakpoints)
 * 3. Option Exercise (uses LP + pro-rata breakpoints)
 * 4. Voluntary Conversion (uses all prior breakpoints, SEQUENTIAL!)
 * 5. Participation Cap (uses all prior breakpoints)
 *
 * @module AnalysisSequencer
 * @version 3.0.0
 */

import { CapTableSnapshot } from '../types/CapTableTypes'
import { RangeBasedBreakpoint } from '../types/BreakpointTypes'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { LiquidationPreferenceAnalyzer } from '../analyzers/LiquidationPreferenceAnalyzer'
import { ProRataAnalyzer } from '../analyzers/ProRataAnalyzer'
import { OptionExerciseAnalyzer } from '../analyzers/OptionExerciseAnalyzer'
import { VoluntaryConversionAnalyzer } from '../analyzers/VoluntaryConversionAnalyzer'
import { ParticipationCapAnalyzer } from '../analyzers/ParticipationCapAnalyzer'

/**
 * Analysis result
 */
export interface AnalysisResult {
  breakpoints: RangeBasedBreakpoint[]
  executionOrder: string[]
  totalAnalyzers: number
  completedAnalyzers: number
}

/**
 * AnalysisSequencer
 *
 * Sequences analyzer execution
 */
export class AnalysisSequencer {
  constructor(
    private lpAnalyzer: LiquidationPreferenceAnalyzer,
    private proRataAnalyzer: ProRataAnalyzer,
    private optionAnalyzer: OptionExerciseAnalyzer,
    private conversionAnalyzer: VoluntaryConversionAnalyzer,
    private capAnalyzer: ParticipationCapAnalyzer,
    private auditLogger: AuditTrailLogger
  ) {}

  /**
   * Execute analysis sequence
   */
  analyze(capTable: CapTableSnapshot): AnalysisResult {
    this.auditLogger.step('Starting breakpoint analysis sequence')

    const breakpoints: RangeBasedBreakpoint[] = []
    const executionOrder: string[] = []

    // Step 1: Liquidation Preference Analysis
    this.auditLogger.debug('Analysis Sequence', 'Step 1: Analyzing liquidation preferences')
    const lpBreakpoints = this.lpAnalyzer.analyze(capTable)
    breakpoints.push(...lpBreakpoints)
    executionOrder.push(`LP Analysis: ${lpBreakpoints.length} breakpoints`)

    this.auditLogger.info(
      'Analysis Sequence',
      `Step 1 complete: ${lpBreakpoints.length} LP breakpoints`,
      { count: lpBreakpoints.length }
    )

    // Step 2: Pro-Rata Distribution Analysis
    this.auditLogger.debug('Analysis Sequence', 'Step 2: Analyzing pro-rata distribution')
    const proRataBreakpoint = this.proRataAnalyzer.analyze(capTable, lpBreakpoints)
    breakpoints.push(proRataBreakpoint)
    executionOrder.push('Pro-Rata Analysis: 1 breakpoint')

    this.auditLogger.info('Analysis Sequence', 'Step 2 complete: Pro-rata breakpoint')

    // Get prior breakpoints for remaining analyzers
    const priorBreakpoints = [...breakpoints]

    // Step 3: Option Exercise Analysis
    this.auditLogger.debug('Analysis Sequence', 'Step 3: Analyzing option exercise')
    const optionBreakpoints = this.optionAnalyzer.analyze(capTable, priorBreakpoints)
    breakpoints.push(...optionBreakpoints)
    executionOrder.push(`Option Analysis: ${optionBreakpoints.length} breakpoints`)

    this.auditLogger.info(
      'Analysis Sequence',
      `Step 3 complete: ${optionBreakpoints.length} option breakpoints`,
      { count: optionBreakpoints.length }
    )

    // Update prior breakpoints
    const priorWithOptions = [...priorBreakpoints, ...optionBreakpoints]

    // Step 4: Voluntary Conversion Analysis (SEQUENTIAL!)
    this.auditLogger.debug(
      'Analysis Sequence',
      'Step 4: Analyzing voluntary conversions (SEQUENTIAL)'
    )
    const conversionBreakpoints = this.conversionAnalyzer.analyze(capTable, priorWithOptions)
    breakpoints.push(...conversionBreakpoints)
    executionOrder.push(`Conversion Analysis: ${conversionBreakpoints.length} breakpoints`)

    this.auditLogger.info(
      'Analysis Sequence',
      `Step 4 complete: ${conversionBreakpoints.length} conversion breakpoints`,
      { count: conversionBreakpoints.length }
    )

    // Update prior breakpoints
    const priorWithConversions = [...priorWithOptions, ...conversionBreakpoints]

    // Step 5: Participation Cap Analysis
    this.auditLogger.debug('Analysis Sequence', 'Step 5: Analyzing participation caps')
    const capBreakpoints = this.capAnalyzer.analyze(capTable, priorWithConversions)
    breakpoints.push(...capBreakpoints)
    executionOrder.push(`Cap Analysis: ${capBreakpoints.length} breakpoints`)

    this.auditLogger.info(
      'Analysis Sequence',
      `Step 5 complete: ${capBreakpoints.length} cap breakpoints`,
      { count: capBreakpoints.length }
    )

    // Sort breakpoints by priority order
    const sortedBreakpoints = this.sortBreakpoints(breakpoints)

    this.auditLogger.info('Analysis Sequence', 'Breakpoint analysis sequence complete', {
      totalBreakpoints: sortedBreakpoints.length,
      executionSteps: executionOrder.length,
      breakdown: {
        lp: lpBreakpoints.length,
        proRata: 1,
        options: optionBreakpoints.length,
        conversions: conversionBreakpoints.length,
        caps: capBreakpoints.length,
      },
    })

    return {
      breakpoints: sortedBreakpoints,
      executionOrder,
      totalAnalyzers: 5,
      completedAnalyzers: 5,
    }
  }

  /**
   * Sort breakpoints by priority order
   */
  private sortBreakpoints(breakpoints: RangeBasedBreakpoint[]): RangeBasedBreakpoint[] {
    // Sort by:
    // 1. Priority order (100s = LP, 1000s = pro-rata, 2000s = options, etc.)
    // 2. Then by rangeFrom (ascending)
    return [...breakpoints].sort((a, b) => {
      // First by priority order
      const priorityDiff = (a.priorityOrder || 0) - (b.priorityOrder || 0)
      if (priorityDiff !== 0) return priorityDiff

      // Then by rangeFrom
      if (a.rangeFrom.lt(b.rangeFrom)) return -1
      if (a.rangeFrom.gt(b.rangeFrom)) return 1
      return 0
    })
  }

  /**
   * Get expected breakpoint counts
   */
  getExpectedCounts(capTable: CapTableSnapshot): {
    lp: number
    proRata: number
    options: number
    conversions: number
    caps: number
    total: number
  } {
    const lp = this.lpAnalyzer.getExpectedBreakpointCount(capTable)
    const proRata = this.proRataAnalyzer.getExpectedBreakpointCount()
    const options = this.optionAnalyzer.getExpectedBreakpointCount(capTable)
    const conversions = this.conversionAnalyzer.getExpectedBreakpointCount(capTable)
    const caps = this.capAnalyzer.getExpectedBreakpointCount(capTable)

    return {
      lp,
      proRata,
      options,
      conversions,
      caps,
      total: lp + proRata + options + conversions + caps,
    }
  }

  /**
   * Validate sequence execution
   */
  validateSequence(
    result: AnalysisResult,
    capTable: CapTableSnapshot
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check all analyzers executed
    if (result.completedAnalyzers !== result.totalAnalyzers) {
      errors.push(`Only ${result.completedAnalyzers}/${result.totalAnalyzers} analyzers completed`)
    }

    // Check expected counts
    const expected = this.getExpectedCounts(capTable)
    if (result.breakpoints.length !== expected.total) {
      errors.push(`Expected ${expected.total} breakpoints, found ${result.breakpoints.length}`)
    }

    // Check execution order
    const expectedOrder = [
      'LP Analysis',
      'Pro-Rata Analysis',
      'Option Analysis',
      'Conversion Analysis',
      'Cap Analysis',
    ]

    for (let i = 0; i < expectedOrder.length; i++) {
      if (!result.executionOrder[i]?.startsWith(expectedOrder[i])) {
        errors.push(
          `Step ${i + 1} should be ${expectedOrder[i]}, found: ${result.executionOrder[i] || 'missing'}`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
