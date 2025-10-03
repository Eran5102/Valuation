/**
 * Breakpoint Validator
 *
 * Validates breakpoint structure, ranges, and logical consistency.
 * Ensures breakpoints are correctly formed and properly ordered.
 *
 * Validation Categories:
 * 1. Range Validity - Proper from/to relationships, non-overlapping
 * 2. Participant Data - Valid shares, percentages, RVPS values
 * 3. Breakpoint Order - Sequential, dependencies satisfied
 * 4. Type-Specific - Each breakpoint type has required fields
 *
 * @module BreakpointValidator
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { RangeBasedBreakpoint, BreakpointType } from '../types/BreakpointTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { ValidationTest } from './CapTableValidator'

/**
 * Breakpoint validation result
 */
export interface BreakpointValidationResult {
  valid: boolean
  totalTests: number
  passed: number
  failed: number
  warnings: number
  tests: ValidationTest[]
  summary: string
}

/**
 * BreakpointValidator
 *
 * Validates breakpoint array structure and consistency
 */
export class BreakpointValidator {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Validate breakpoint array
   */
  validate(breakpoints: RangeBasedBreakpoint[]): BreakpointValidationResult {
    this.auditLogger.step('Validating breakpoint structure and consistency')

    const tests: ValidationTest[] = []

    // Run all validation tests
    tests.push(...this.validateStructure(breakpoints))
    tests.push(...this.validateRanges(breakpoints))
    tests.push(...this.validateParticipants(breakpoints))
    tests.push(...this.validateOrdering(breakpoints))
    tests.push(...this.validateDependencies(breakpoints))
    tests.push(...this.validateTypeSpecific(breakpoints))

    // Calculate summary
    const passed = tests.filter((t) => t.passed).length
    const failed = tests.filter((t) => !t.passed && t.severity === 'error').length
    const warnings = tests.filter((t) => !t.passed && t.severity === 'warning').length
    const valid = failed === 0

    const summary = this.generateSummary(tests, valid, passed, failed, warnings)

    const result: BreakpointValidationResult = {
      valid,
      totalTests: tests.length,
      passed,
      failed,
      warnings,
      tests,
      summary,
    }

    // Log result
    if (valid) {
      this.auditLogger.info('Breakpoint Validation', 'Breakpoint validation passed', {
        totalBreakpoints: breakpoints.length,
        totalTests: tests.length,
        passed,
        warnings,
      })
    } else {
      this.auditLogger.error('Breakpoint Validation', 'Breakpoint validation failed', {
        totalBreakpoints: breakpoints.length,
        totalTests: tests.length,
        passed,
        failed,
        warnings,
        errors: tests.filter((t) => !t.passed && t.severity === 'error').map((t) => t.message),
      })
    }

    return result
  }

  /**
   * Validate basic structure
   */
  private validateStructure(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    // Check is array
    tests.push({
      testName: 'Breakpoints Array',
      passed: Array.isArray(breakpoints),
      message: Array.isArray(breakpoints)
        ? `Breakpoints is valid array (${breakpoints.length} items)`
        : 'Breakpoints must be an array',
      severity: 'error',
    })

    if (!Array.isArray(breakpoints)) {
      return tests
    }

    // Check not empty
    tests.push({
      testName: 'Non-Empty Breakpoints',
      passed: breakpoints.length > 0,
      message:
        breakpoints.length > 0
          ? `Found ${breakpoints.length} breakpoints`
          : 'No breakpoints found - expected at least pro-rata breakpoint',
      severity: 'error',
    })

    // Validate each breakpoint has required fields
    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]
      const label = `BP ${i + 1}`

      // Has breakpoint type
      tests.push({
        testName: `Breakpoint Type: ${label}`,
        passed: !!bp.breakpointType,
        message: bp.breakpointType
          ? `${label} has type: ${bp.breakpointType}`
          : `${label} missing breakpoint type`,
        severity: 'error',
        affectedItems: [label],
      })

      // Has rangeFrom
      tests.push({
        testName: `Range From: ${label}`,
        passed: bp.rangeFrom !== null && bp.rangeFrom !== undefined,
        message:
          bp.rangeFrom !== null && bp.rangeFrom !== undefined
            ? `${label} rangeFrom: ${DecimalHelpers.formatCurrency(bp.rangeFrom)}`
            : `${label} missing rangeFrom`,
        severity: 'error',
        affectedItems: [label],
      })

      // Has participants array
      tests.push({
        testName: `Participants: ${label}`,
        passed: Array.isArray(bp.participants),
        message: Array.isArray(bp.participants)
          ? `${label} has ${bp.participants.length} participants`
          : `${label} missing participants array`,
        severity: 'error',
        affectedItems: [label],
      })
    }

    return tests
  }

  /**
   * Validate ranges
   */
  private validateRanges(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
      return tests
    }

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]
      const label = `BP ${i + 1} (${bp.breakpointType})`

      // rangeFrom >= 0
      if (bp.rangeFrom !== null && bp.rangeFrom !== undefined) {
        const validFrom = bp.rangeFrom.gte(0)
        tests.push({
          testName: `Range From Valid: ${label}`,
          passed: validFrom,
          message: validFrom
            ? `${label} rangeFrom ${DecimalHelpers.formatCurrency(bp.rangeFrom)} is valid`
            : `${label} rangeFrom ${DecimalHelpers.formatCurrency(bp.rangeFrom)} is negative`,
          severity: 'error',
          affectedItems: [label],
        })
      }

      // If closed range, rangeTo > rangeFrom
      if (!bp.isOpenEnded && bp.rangeTo !== null) {
        const validRange = bp.rangeTo.gt(bp.rangeFrom)
        tests.push({
          testName: `Range Order: ${label}`,
          passed: validRange,
          message: validRange
            ? `${label} range ${DecimalHelpers.formatCurrency(bp.rangeFrom)} → ${DecimalHelpers.formatCurrency(bp.rangeTo)} is valid`
            : `${label} rangeTo ${DecimalHelpers.formatCurrency(bp.rangeTo)} must be > rangeFrom ${DecimalHelpers.formatCurrency(bp.rangeFrom)}`,
          severity: 'error',
          affectedItems: [label],
        })
      }

      // If open-ended, rangeTo must be null
      if (bp.isOpenEnded) {
        const validOpen = bp.rangeTo === null
        tests.push({
          testName: `Open-Ended Range: ${label}`,
          passed: validOpen,
          message: validOpen
            ? `${label} is correctly open-ended (rangeTo = null)`
            : `${label} marked as open-ended but has rangeTo = ${bp.rangeTo}`,
          severity: 'error',
          affectedItems: [label],
        })
      }

      // If not open-ended, rangeTo must exist
      if (!bp.isOpenEnded) {
        const hasTail = bp.rangeTo !== null && bp.rangeTo !== undefined
        tests.push({
          testName: `Closed Range End: ${label}`,
          passed: hasTail,
          message: hasTail
            ? `${label} has valid rangeTo`
            : `${label} not marked open-ended but missing rangeTo`,
          severity: 'error',
          affectedItems: [label],
        })
      }
    }

    // Check for overlapping ranges (closed ranges only)
    const closedRanges = breakpoints.filter((bp) => !bp.isOpenEnded && bp.rangeTo)
    for (let i = 0; i < closedRanges.length; i++) {
      for (let j = i + 1; j < closedRanges.length; j++) {
        const bp1 = closedRanges[i]
        const bp2 = closedRanges[j]

        // Check if ranges overlap
        const overlap = bp1.rangeFrom.lt(bp2.rangeTo!) && bp2.rangeFrom.lt(bp1.rangeTo!)

        if (overlap) {
          tests.push({
            testName: `Non-Overlapping Ranges`,
            passed: false,
            message: `Ranges overlap: ${bp1.breakpointType} [${DecimalHelpers.formatCurrency(bp1.rangeFrom)}, ${DecimalHelpers.formatCurrency(bp1.rangeTo!)}] overlaps ${bp2.breakpointType} [${DecimalHelpers.formatCurrency(bp2.rangeFrom)}, ${DecimalHelpers.formatCurrency(bp2.rangeTo!)}]`,
            severity: 'error',
            affectedItems: [bp1.breakpointType, bp2.breakpointType],
          })
        }
      }
    }

    return tests
  }

  /**
   * Validate participants
   */
  private validateParticipants(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
      return tests
    }

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]
      const label = `BP ${i + 1} (${bp.breakpointType})`

      if (!Array.isArray(bp.participants)) {
        continue
      }

      // At least one participant
      tests.push({
        testName: `Has Participants: ${label}`,
        passed: bp.participants.length > 0,
        message:
          bp.participants.length > 0
            ? `${label} has ${bp.participants.length} participants`
            : `${label} has no participants`,
        severity: 'error',
        affectedItems: [label],
      })

      // Validate each participant
      for (let j = 0; j < bp.participants.length; j++) {
        const p = bp.participants[j]
        const pLabel = `${label} P${j + 1}`

        // Has security name
        tests.push({
          testName: `Security Name: ${pLabel}`,
          passed: !!p.securityName,
          message: p.securityName
            ? `${pLabel}: ${p.securityName}`
            : `${pLabel} missing security name`,
          severity: 'error',
          affectedItems: [pLabel],
        })

        // Participating shares >= 0
        const sharesValid = p.participatingShares.gte(0)
        tests.push({
          testName: `Participating Shares: ${pLabel}`,
          passed: sharesValid,
          message: sharesValid
            ? `${pLabel} shares: ${DecimalHelpers.formatNumber(p.participatingShares)}`
            : `${pLabel} has negative shares`,
          severity: 'error',
          affectedItems: [pLabel],
        })

        // Participation % between 0 and 1
        const pctValid = p.participationPercentage.gte(0) && p.participationPercentage.lte(1)
        tests.push({
          testName: `Participation %: ${pLabel}`,
          passed: pctValid,
          message: pctValid
            ? `${pLabel} %: ${DecimalHelpers.formatPercentage(p.participationPercentage.times(100), 2)}`
            : `${pLabel} participation % ${p.participationPercentage} must be between 0 and 1`,
          severity: 'error',
          affectedItems: [pLabel],
        })

        // RVPS >= 0
        const rvpsValid = p.rvpsAtBreakpoint.gte(0)
        tests.push({
          testName: `RVPS: ${pLabel}`,
          passed: rvpsValid,
          message: rvpsValid
            ? `${pLabel} RVPS: ${DecimalHelpers.formatCurrency(p.rvpsAtBreakpoint)}`
            : `${pLabel} has negative RVPS`,
          severity: 'error',
          affectedItems: [pLabel],
        })

        // Cumulative RVPS >= 0
        const cumRvpsValid = p.cumulativeRVPS.gte(0)
        tests.push({
          testName: `Cumulative RVPS: ${pLabel}`,
          passed: cumRvpsValid,
          message: cumRvpsValid
            ? `${pLabel} cumulative RVPS: ${DecimalHelpers.formatCurrency(p.cumulativeRVPS)}`
            : `${pLabel} has negative cumulative RVPS`,
          severity: 'error',
          affectedItems: [pLabel],
        })
      }

      // Total participation % should sum to ~1.0 (within tolerance)
      const totalPct = bp.participants.reduce(
        (sum, p) => sum.plus(p.participationPercentage),
        DecimalHelpers.toDecimal(0)
      )
      const tolerance = new Decimal(0.0001) // 0.01%
      const validTotal = totalPct.minus(1).abs().lte(tolerance) || totalPct.eq(0) // Allow 0 for open-ended ranges

      if (bp.participants.length > 1) {
        tests.push({
          testName: `Total Participation %: ${label}`,
          passed: validTotal,
          message: validTotal
            ? `${label} total participation: ${DecimalHelpers.formatPercentage(totalPct.times(100), 2)}`
            : `${label} participation % sums to ${DecimalHelpers.formatPercentage(totalPct.times(100), 2)}, expected ~100%`,
          severity: validTotal ? 'info' : 'warning',
          affectedItems: [label],
        })
      }
    }

    return tests
  }

  /**
   * Validate ordering
   */
  private validateOrdering(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(breakpoints) || breakpoints.length <= 1) {
      return tests
    }

    // Check breakpoint order is sequential
    let sequential = true
    for (let i = 0; i < breakpoints.length; i++) {
      if (breakpoints[i].breakpointOrder !== i + 1) {
        sequential = false
        break
      }
    }

    tests.push({
      testName: 'Sequential Ordering',
      passed: sequential,
      message: sequential
        ? 'Breakpoints are sequentially ordered (1, 2, 3...)'
        : 'Breakpoint order numbers are not sequential',
      severity: 'warning',
    })

    // Check ranges are monotonically increasing
    let increasing = true
    for (let i = 1; i < breakpoints.length; i++) {
      const prev = breakpoints[i - 1]
      const curr = breakpoints[i]

      // Current rangeFrom should be >= previous rangeFrom
      if (curr.rangeFrom.lt(prev.rangeFrom)) {
        increasing = false
        tests.push({
          testName: `Monotonic Ranges`,
          passed: false,
          message: `${curr.breakpointType} rangeFrom ${DecimalHelpers.formatCurrency(curr.rangeFrom)} < previous ${prev.breakpointType} ${DecimalHelpers.formatCurrency(prev.rangeFrom)}`,
          severity: 'error',
          affectedItems: [prev.breakpointType, curr.breakpointType],
        })
      }
    }

    if (increasing) {
      tests.push({
        testName: 'Monotonic Ranges',
        passed: true,
        message: 'Breakpoint ranges are monotonically increasing',
        severity: 'info',
      })
    }

    return tests
  }

  /**
   * Validate dependencies
   */
  private validateDependencies(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
      return tests
    }

    // Collect all available dependencies (what has been completed)
    const available = new Set<string>()

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]
      const label = `BP ${i + 1} (${bp.breakpointType})`

      // Check dependencies are available
      if (bp.dependencies && bp.dependencies.length > 0) {
        const missing = bp.dependencies.filter((dep) => !available.has(dep))

        if (missing.length > 0) {
          tests.push({
            testName: `Dependencies: ${label}`,
            passed: false,
            message: `${label} has unsatisfied dependencies: ${missing.join(', ')}`,
            severity: 'warning',
            affectedItems: [label],
          })
        } else {
          tests.push({
            testName: `Dependencies: ${label}`,
            passed: true,
            message: `${label} dependencies satisfied`,
            severity: 'info',
            affectedItems: [label],
          })
        }
      }

      // Add this breakpoint's provided capabilities
      available.add(`${bp.breakpointType} completed`)
      if (bp.affectedSecurities) {
        bp.affectedSecurities.forEach((sec) => {
          available.add(`${sec} processed`)
          if (bp.breakpointType === BreakpointType.VOLUNTARY_CONVERSION) {
            available.add(`${sec} converted`)
          }
        })
      }
    }

    return tests
  }

  /**
   * Validate type-specific requirements
   */
  private validateTypeSpecific(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
      return tests
    }

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]
      const label = `BP ${i + 1} (${bp.breakpointType})`

      switch (bp.breakpointType) {
        case BreakpointType.LIQUIDATION_PREFERENCE:
          // LP breakpoints should be closed ranges
          tests.push({
            testName: `LP Range Type: ${label}`,
            passed: !bp.isOpenEnded,
            message: !bp.isOpenEnded
              ? `${label} is correctly a closed range`
              : `${label} should be a closed range (not open-ended)`,
            severity: 'error',
            affectedItems: [label],
          })
          break

        case BreakpointType.PRO_RATA_DISTRIBUTION:
          // Pro-rata marks the start of pro-rata distribution
          // Range will be finalized by RangeFinalizationProcessor
          break

        case BreakpointType.VOLUNTARY_CONVERSION:
          // Conversions mark when preferred converts to common
          // Range will be finalized by RangeFinalizationProcessor

          // Should have conversionStep in metadata
          const hasStep = bp.metadata?.conversionStep !== undefined
          tests.push({
            testName: `Conversion Metadata: ${label}`,
            passed: hasStep,
            message: hasStep
              ? `${label} has conversion step: ${bp.metadata?.conversionStep}`
              : `${label} missing conversionStep in metadata`,
            severity: 'warning',
            affectedItems: [label],
          })
          break

        case BreakpointType.OPTION_EXERCISE:
          // Options mark when options are exercised
          // Range will be finalized by RangeFinalizationProcessor

          // Should have exercisePrice in metadata
          const hasExercisePrice =
            bp.metadata?.exercisePrice !== undefined || bp.metadata?.strikePrice !== undefined
          tests.push({
            testName: `Option Metadata: ${label}`,
            passed: hasExercisePrice,
            message: hasExercisePrice
              ? `${label} has exercise price: ${bp.metadata?.exercisePrice || bp.metadata?.strikePrice}`
              : `${label} missing exercisePrice in metadata`,
            severity: 'warning',
            affectedItems: [label],
          })
          break

        case BreakpointType.PARTICIPATION_CAP:
          // Caps mark when a series reaches its participation cap
          // Range will be finalized by RangeFinalizationProcessor

          // Should have capAmount in metadata
          const hasCap = bp.metadata?.capAmount !== undefined
          tests.push({
            testName: `Cap Metadata: ${label}`,
            passed: hasCap,
            message: hasCap
              ? `${label} has cap amount: ${bp.metadata?.capAmount}`
              : `${label} missing capAmount in metadata`,
            severity: 'warning',
            affectedItems: [label],
          })
          break
      }
    }

    return tests
  }

  /**
   * Generate validation summary
   */
  private generateSummary(
    tests: ValidationTest[],
    valid: boolean,
    passed: number,
    failed: number,
    warnings: number
  ): string {
    const parts: string[] = []

    if (valid) {
      parts.push(`✓ Breakpoint validation PASSED`)
    } else {
      parts.push(`✗ Breakpoint validation FAILED`)
    }

    parts.push(`${passed}/${tests.length} tests passed`)

    if (failed > 0) {
      parts.push(`${failed} errors`)
    }

    if (warnings > 0) {
      parts.push(`${warnings} warnings`)
    }

    return parts.join('; ')
  }

  /**
   * Get validation report
   */
  getValidationReport(result: BreakpointValidationResult): string {
    const lines: string[] = []

    lines.push('Breakpoint Validation Report')
    lines.push('='.repeat(50))
    lines.push('')
    lines.push(`Status: ${result.valid ? 'PASSED ✓' : 'FAILED ✗'}`)
    lines.push(`Total Tests: ${result.totalTests}`)
    lines.push(`Passed: ${result.passed}`)
    lines.push(`Failed: ${result.failed}`)
    lines.push(`Warnings: ${result.warnings}`)
    lines.push('')

    if (result.failed > 0) {
      lines.push('ERRORS:')
      lines.push('-'.repeat(50))
      result.tests
        .filter((t) => !t.passed && t.severity === 'error')
        .forEach((test) => {
          lines.push(`✗ ${test.testName}: ${test.message}`)
        })
      lines.push('')
    }

    if (result.warnings > 0) {
      lines.push('WARNINGS:')
      lines.push('-'.repeat(50))
      result.tests
        .filter((t) => !t.passed && t.severity === 'warning')
        .forEach((test) => {
          lines.push(`⚠ ${test.testName}: ${test.message}`)
        })
      lines.push('')
    }

    lines.push('Summary:')
    lines.push(result.summary)

    return lines.join('\n')
  }
}
