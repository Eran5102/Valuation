/**
 * Breakpoint Orchestrator
 *
 * Top-level orchestrator for breakpoint analysis.
 * Coordinates validation, analysis sequencing, and result packaging.
 *
 * Execution Flow:
 * 1. Validate cap table structure
 * 2. Execute analysis sequence (via AnalysisSequencer)
 * 2.5. Finalize ranges and accumulate participants (via RangeFinalizationProcessor)
 * 3. Validate breakpoint array
 * 4. Validate cross-breakpoint consistency
 * 5. Package and return complete result
 *
 * @module BreakpointOrchestrator
 * @version 3.0.0
 */

import { CapTableSnapshot } from '../types/CapTableTypes'
import { RangeBasedBreakpoint } from '../types/BreakpointTypes'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { CapTableValidator, CapTableValidationResult } from '../validators/CapTableValidator'
import { BreakpointValidator, BreakpointValidationResult } from '../validators/BreakpointValidator'
import {
  ConsistencyValidator,
  ConsistencyValidationResult,
} from '../validators/ConsistencyValidator'
import { AnalysisSequencer, AnalysisResult } from './AnalysisSequencer'
import { RangeFinalizationProcessor } from '../processors/RangeFinalizationProcessor'

/**
 * Complete orchestration result
 */
export interface OrchestrationResult {
  // Analysis results
  breakpoints: RangeBasedBreakpoint[]
  totalBreakpoints: number

  // Validation results
  capTableValidation: CapTableValidationResult
  breakpointValidation: BreakpointValidationResult
  consistencyValidation: ConsistencyValidationResult

  // Analysis metadata
  executionOrder: string[]
  analysisMetadata: {
    lpBreakpoints: number
    proRataBreakpoints: number
    optionBreakpoints: number
    conversionBreakpoints: number
    capBreakpoints: number
  }

  // Overall status
  success: boolean
  errors: string[]
  warnings: string[]
}

/**
 * BreakpointOrchestrator
 *
 * Orchestrates complete breakpoint analysis
 */
export class BreakpointOrchestrator {
  private rangeProcessor: RangeFinalizationProcessor

  constructor(
    private capTableValidator: CapTableValidator,
    private breakpointValidator: BreakpointValidator,
    private consistencyValidator: ConsistencyValidator,
    private analysisSequencer: AnalysisSequencer,
    private auditLogger: AuditTrailLogger
  ) {
    this.rangeProcessor = new RangeFinalizationProcessor(auditLogger)
  }

  /**
   * Orchestrate complete analysis
   */
  async analyze(capTable: CapTableSnapshot): Promise<OrchestrationResult> {
    this.auditLogger.step('Starting breakpoint orchestration')

    const errors: string[] = []
    const warnings: string[] = []

    // Step 1: Validate cap table
    this.auditLogger.debug('Orchestration', 'Step 1: Validating cap table')
    const capTableValidation = this.capTableValidator.validate(capTable)

    if (!capTableValidation.valid) {
      errors.push('Cap table validation failed')
      errors.push(
        ...capTableValidation.tests
          .filter((t) => !t.passed && t.severity === 'error')
          .map((t) => t.message)
      )

      this.auditLogger.error('Orchestration', 'Cap table validation failed - aborting analysis', {
        errors,
      })

      // Return early with validation errors
      return {
        breakpoints: [],
        totalBreakpoints: 0,
        capTableValidation,
        breakpointValidation: {
          valid: false,
          totalTests: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          tests: [],
          summary: 'Skipped due to cap table validation failure',
        },
        consistencyValidation: {
          valid: false,
          totalTests: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          tests: [],
          summary: 'Skipped due to cap table validation failure',
        },
        executionOrder: [],
        analysisMetadata: {
          lpBreakpoints: 0,
          proRataBreakpoints: 0,
          optionBreakpoints: 0,
          conversionBreakpoints: 0,
          capBreakpoints: 0,
        },
        success: false,
        errors,
        warnings: [],
      }
    }

    // Collect cap table warnings
    warnings.push(
      ...capTableValidation.tests
        .filter((t) => !t.passed && t.severity === 'warning')
        .map((t) => t.message)
    )

    this.auditLogger.info('Orchestration', 'Step 1 complete: Cap table validation passed', {
      tests: capTableValidation.totalTests,
      warnings: capTableValidation.warnings,
    })

    // Step 2: Execute analysis sequence
    this.auditLogger.debug('Orchestration', 'Step 2: Executing analysis sequence')
    let analysisResult: AnalysisResult
    try {
      analysisResult = this.analysisSequencer.analyze(capTable)
    } catch (error) {
      errors.push(
        `Analysis sequence failed: ${error instanceof Error ? error.message : String(error)}`
      )

      this.auditLogger.error('Orchestration', 'Analysis sequence failed', { error })

      return {
        breakpoints: [],
        totalBreakpoints: 0,
        capTableValidation,
        breakpointValidation: {
          valid: false,
          totalTests: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          tests: [],
          summary: 'Skipped due to analysis failure',
        },
        consistencyValidation: {
          valid: false,
          totalTests: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          tests: [],
          summary: 'Skipped due to analysis failure',
        },
        executionOrder: [],
        analysisMetadata: {
          lpBreakpoints: 0,
          proRataBreakpoints: 0,
          optionBreakpoints: 0,
          conversionBreakpoints: 0,
          capBreakpoints: 0,
        },
        success: false,
        errors,
        warnings,
      }
    }

    this.auditLogger.info('Orchestration', 'Step 2 complete: Analysis sequence finished', {
      totalBreakpoints: analysisResult.breakpoints.length,
    })

    // Step 2.5: Finalize ranges and accumulate participants
    this.auditLogger.debug('Orchestration', 'Step 2.5: Finalizing ranges and participants')
    const finalizationResult = this.rangeProcessor.process(analysisResult.breakpoints, capTable)

    this.auditLogger.info('Orchestration', 'Step 2.5 complete: Range finalization', {
      rangesConnected: finalizationResult.rangesConnected,
      participantsUpdated: finalizationResult.participantsUpdated,
    })

    // Use finalized breakpoints for validation
    const finalizedBreakpoints = finalizationResult.breakpoints

    // Step 3: Validate breakpoints
    this.auditLogger.debug('Orchestration', 'Step 3: Validating breakpoints')
    const breakpointValidation = this.breakpointValidator.validate(finalizedBreakpoints)

    if (!breakpointValidation.valid) {
      errors.push('Breakpoint validation failed')
      errors.push(
        ...breakpointValidation.tests
          .filter((t) => !t.passed && t.severity === 'error')
          .map((t) => t.message)
      )
    }

    warnings.push(
      ...breakpointValidation.tests
        .filter((t) => !t.passed && t.severity === 'warning')
        .map((t) => t.message)
    )

    this.auditLogger.info(
      'Orchestration',
      `Step 3 complete: Breakpoint validation ${breakpointValidation.valid ? 'passed' : 'failed'}`,
      {
        tests: breakpointValidation.totalTests,
        errors: breakpointValidation.failed,
        warnings: breakpointValidation.warnings,
      }
    )

    // Step 4: Validate consistency
    this.auditLogger.debug('Orchestration', 'Step 4: Validating consistency')
    const consistencyValidation = this.consistencyValidator.validate(finalizedBreakpoints, capTable)

    if (!consistencyValidation.valid) {
      errors.push('Consistency validation failed')
      errors.push(
        ...consistencyValidation.tests
          .filter((t) => !t.passed && t.severity === 'error')
          .map((t) => t.message)
      )
    }

    warnings.push(
      ...consistencyValidation.tests
        .filter((t) => !t.passed && t.severity === 'warning')
        .map((t) => t.message)
    )

    this.auditLogger.info(
      'Orchestration',
      `Step 4 complete: Consistency validation ${consistencyValidation.valid ? 'passed' : 'failed'}`,
      {
        tests: consistencyValidation.totalTests,
        errors: consistencyValidation.failed,
        warnings: consistencyValidation.warnings,
      }
    )

    // Extract metadata
    const analysisMetadata = this.extractMetadata(finalizedBreakpoints)

    // Determine overall success
    const success =
      capTableValidation.valid &&
      breakpointValidation.valid &&
      consistencyValidation.valid &&
      errors.length === 0

    this.auditLogger.info(
      'Orchestration',
      `Breakpoint orchestration ${success ? 'completed successfully' : 'completed with errors'}`,
      {
        totalBreakpoints: finalizedBreakpoints.length,
        success,
        errors: errors.length,
        warnings: warnings.length,
      }
    )

    // Package result
    const result: OrchestrationResult = {
      breakpoints: finalizedBreakpoints,
      totalBreakpoints: finalizedBreakpoints.length,
      capTableValidation,
      breakpointValidation,
      consistencyValidation,
      executionOrder: analysisResult.executionOrder,
      analysisMetadata,
      success,
      errors,
      warnings,
    }

    return result
  }

  /**
   * Extract metadata from breakpoints
   */
  private extractMetadata(breakpoints: RangeBasedBreakpoint[]): {
    lpBreakpoints: number
    proRataBreakpoints: number
    optionBreakpoints: number
    conversionBreakpoints: number
    capBreakpoints: number
  } {
    const counts = {
      lpBreakpoints: 0,
      proRataBreakpoints: 0,
      optionBreakpoints: 0,
      conversionBreakpoints: 0,
      capBreakpoints: 0,
    }

    for (const bp of breakpoints) {
      switch (bp.breakpointType) {
        case 'liquidation_preference':
          counts.lpBreakpoints++
          break
        case 'pro_rata_distribution':
          counts.proRataBreakpoints++
          break
        case 'option_exercise':
          counts.optionBreakpoints++
          break
        case 'voluntary_conversion':
          counts.conversionBreakpoints++
          break
        case 'participation_cap':
          counts.capBreakpoints++
          break
      }
    }

    return counts
  }

  /**
   * Get orchestration summary
   */
  getOrchestrationSummary(result: OrchestrationResult): string {
    const lines: string[] = []

    lines.push('Breakpoint Analysis Summary')
    lines.push('='.repeat(60))
    lines.push('')

    lines.push(`Status: ${result.success ? 'SUCCESS ✓' : 'FAILED ✗'}`)
    lines.push(`Total Breakpoints: ${result.totalBreakpoints}`)
    lines.push('')

    lines.push('Breakpoint Breakdown:')
    lines.push(`- Liquidation Preference: ${result.analysisMetadata.lpBreakpoints}`)
    lines.push(`- Pro-Rata Distribution: ${result.analysisMetadata.proRataBreakpoints}`)
    lines.push(`- Option Exercise: ${result.analysisMetadata.optionBreakpoints}`)
    lines.push(`- Voluntary Conversion: ${result.analysisMetadata.conversionBreakpoints}`)
    lines.push(`- Participation Cap: ${result.analysisMetadata.capBreakpoints}`)
    lines.push('')

    lines.push('Validation Results:')
    lines.push(
      `- Cap Table: ${result.capTableValidation.valid ? 'PASS ✓' : 'FAIL ✗'} (${result.capTableValidation.passed}/${result.capTableValidation.totalTests} tests)`
    )
    lines.push(
      `- Breakpoints: ${result.breakpointValidation.valid ? 'PASS ✓' : 'FAIL ✗'} (${result.breakpointValidation.passed}/${result.breakpointValidation.totalTests} tests)`
    )
    lines.push(
      `- Consistency: ${result.consistencyValidation.valid ? 'PASS ✓' : 'FAIL ✗'} (${result.consistencyValidation.passed}/${result.consistencyValidation.totalTests} tests)`
    )
    lines.push('')

    if (result.errors.length > 0) {
      lines.push('ERRORS:')
      lines.push('-'.repeat(60))
      result.errors.forEach((err) => lines.push(`✗ ${err}`))
      lines.push('')
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:')
      lines.push('-'.repeat(60))
      result.warnings.forEach((warn) => lines.push(`⚠ ${warn}`))
      lines.push('')
    }

    lines.push('Execution Order:')
    result.executionOrder.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`)
    })

    return lines.join('\n')
  }
}
