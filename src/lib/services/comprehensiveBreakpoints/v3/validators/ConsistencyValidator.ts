/**
 * Consistency Validator
 *
 * Validates cross-breakpoint consistency and logical relationships.
 * Ensures the complete breakpoint array forms a coherent waterfall.
 *
 * Validation Categories:
 * 1. Waterfall Continuity - LP → Pro-rata transition is seamless
 * 2. RVPS Accumulation - Cumulative RVPS increases correctly
 * 3. Conversion Order - Sequential conversions in correct RVPS order
 * 4. Participation Consistency - Securities participate correctly across ranges
 *
 * @module ConsistencyValidator
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot } from '../types/CapTableTypes'
import { RangeBasedBreakpoint, BreakpointType } from '../types/BreakpointTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { ValidationTest } from './CapTableValidator'

/**
 * Consistency validation result
 */
export interface ConsistencyValidationResult {
  valid: boolean
  totalTests: number
  passed: number
  failed: number
  warnings: number
  tests: ValidationTest[]
  summary: string
}

/**
 * ConsistencyValidator
 *
 * Validates consistency across breakpoint array
 */
export class ConsistencyValidator {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Validate consistency
   */
  validate(
    breakpoints: RangeBasedBreakpoint[],
    capTable: CapTableSnapshot
  ): ConsistencyValidationResult {
    this.auditLogger.step('Validating cross-breakpoint consistency')

    const tests: ValidationTest[] = []

    // Run all validation tests
    tests.push(...this.validateWaterfallContinuity(breakpoints, capTable))
    tests.push(...this.validateRVPSAccumulation(breakpoints))
    tests.push(...this.validateConversionSequence(breakpoints))
    tests.push(...this.validateParticipationFlow(breakpoints, capTable))
    tests.push(...this.validateBreakpointCount(breakpoints, capTable))

    // Calculate summary
    const passed = tests.filter((t) => t.passed).length
    const failed = tests.filter((t) => !t.passed && t.severity === 'error').length
    const warnings = tests.filter((t) => !t.passed && t.severity === 'warning').length
    const valid = failed === 0

    const summary = this.generateSummary(tests, valid, passed, failed, warnings)

    const result: ConsistencyValidationResult = {
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
      this.auditLogger.info('Consistency Validation', 'Consistency validation passed', {
        totalTests: tests.length,
        passed,
        warnings,
      })
    } else {
      this.auditLogger.error('Consistency Validation', 'Consistency validation failed', {
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
   * Validate waterfall continuity
   */
  private validateWaterfallContinuity(
    breakpoints: RangeBasedBreakpoint[],
    capTable: CapTableSnapshot
  ): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (breakpoints.length === 0) {
      return tests
    }

    // Check LP → Pro-rata transition
    const lpBreakpoints = breakpoints.filter(
      (bp) => bp.breakpointType === BreakpointType.LIQUIDATION_PREFERENCE
    )
    const proRataBreakpoint = breakpoints.find(
      (bp) => bp.breakpointType === BreakpointType.PRO_RATA_DISTRIBUTION
    )

    if (lpBreakpoints.length > 0 && proRataBreakpoint) {
      const lastLP = lpBreakpoints[lpBreakpoints.length - 1]
      const totalLP = CapTableHelpers.calculateTotalLP(capTable)

      // Last LP rangeTo should match total LP
      tests.push({
        testName: 'LP Coverage',
        passed: DecimalHelpers.equals(lastLP.rangeTo!, totalLP),
        message: DecimalHelpers.equals(lastLP.rangeTo!, totalLP)
          ? `LP breakpoints cover full LP range (${DecimalHelpers.formatCurrency(totalLP)})`
          : `Last LP rangeTo ${DecimalHelpers.formatCurrency(lastLP.rangeTo!)} ≠ total LP ${DecimalHelpers.formatCurrency(totalLP)}`,
        severity: 'error',
      })

      // Pro-rata should start where LP ends
      tests.push({
        testName: 'LP → Pro-Rata Transition',
        passed: DecimalHelpers.equals(proRataBreakpoint.rangeFrom, totalLP),
        message: DecimalHelpers.equals(proRataBreakpoint.rangeFrom, totalLP)
          ? `Pro-rata starts correctly at ${DecimalHelpers.formatCurrency(totalLP)}`
          : `Pro-rata starts at ${DecimalHelpers.formatCurrency(proRataBreakpoint.rangeFrom)}, expected ${DecimalHelpers.formatCurrency(totalLP)}`,
        severity: 'error',
      })
    }

    // Check LP ranges are continuous
    if (lpBreakpoints.length > 1) {
      let continuous = true
      for (let i = 1; i < lpBreakpoints.length; i++) {
        const prev = lpBreakpoints[i - 1]
        const curr = lpBreakpoints[i]

        if (!DecimalHelpers.equals(prev.rangeTo!, curr.rangeFrom)) {
          continuous = false
          tests.push({
            testName: 'LP Range Continuity',
            passed: false,
            message: `Gap in LP ranges: ${DecimalHelpers.formatCurrency(prev.rangeTo!)} → ${DecimalHelpers.formatCurrency(curr.rangeFrom)}`,
            severity: 'error',
          })
        }
      }

      if (continuous) {
        tests.push({
          testName: 'LP Range Continuity',
          passed: true,
          message: 'LP ranges are continuous (no gaps)',
          severity: 'info',
        })
      }
    }

    return tests
  }

  /**
   * Validate RVPS accumulation
   */
  private validateRVPSAccumulation(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (breakpoints.length === 0) {
      return tests
    }

    // Track cumulative RVPS per security
    const securityRVPS = new Map<string, Decimal>()

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]

      for (const p of bp.participants) {
        const prevRVPS = securityRVPS.get(p.securityName) || DecimalHelpers.toDecimal(0)
        const currentCumulative = p.cumulativeRVPS

        // Cumulative RVPS should be >= previous
        const increasing = currentCumulative.gte(prevRVPS)

        if (!increasing && !DecimalHelpers.isZero(currentCumulative)) {
          tests.push({
            testName: `RVPS Accumulation: ${p.securityName}`,
            passed: false,
            message: `${p.securityName} cumulative RVPS decreased: ${DecimalHelpers.formatCurrency(prevRVPS)} → ${DecimalHelpers.formatCurrency(currentCumulative)} at BP ${i + 1}`,
            severity: 'error',
            affectedItems: [p.securityName],
          })
        }

        // Update tracking
        securityRVPS.set(p.securityName, currentCumulative)
      }
    }

    // Summary
    if (tests.filter((t) => !t.passed && t.severity === 'error').length === 0) {
      tests.push({
        testName: 'RVPS Accumulation',
        passed: true,
        message: 'Cumulative RVPS increases correctly for all securities',
        severity: 'info',
      })
    }

    return tests
  }

  /**
   * Validate conversion sequence
   */
  private validateConversionSequence(breakpoints: RangeBasedBreakpoint[]): ValidationTest[] {
    const tests: ValidationTest[] = []

    const conversions = breakpoints.filter(
      (bp) => bp.breakpointType === BreakpointType.VOLUNTARY_CONVERSION
    )

    if (conversions.length === 0) {
      tests.push({
        testName: 'Conversion Sequence',
        passed: true,
        message: 'No voluntary conversions',
        severity: 'info',
      })
      return tests
    }

    // Check conversions are in increasing order (indifference points)
    let sequential = true
    for (let i = 1; i < conversions.length; i++) {
      const prev = conversions[i - 1]
      const curr = conversions[i]

      if (curr.rangeFrom.lte(prev.rangeFrom)) {
        sequential = false
        tests.push({
          testName: 'Conversion Order',
          passed: false,
          message: `Conversion ${i + 1} at ${DecimalHelpers.formatCurrency(curr.rangeFrom)} should be > conversion ${i} at ${DecimalHelpers.formatCurrency(prev.rangeFrom)}`,
          severity: 'error',
          affectedItems: [prev.affectedSecurities[0], curr.affectedSecurities[0]],
        })
      }
    }

    if (sequential) {
      tests.push({
        testName: 'Conversion Order',
        passed: true,
        message: 'Conversions are in correct sequential order',
        severity: 'info',
      })
    }

    // Check conversion steps are sequential
    const steps = conversions
      .map((bp) => bp.metadata?.conversionStep)
      .filter((s) => s !== undefined) as number[]

    if (steps.length === conversions.length) {
      let correctSteps = true
      for (let i = 0; i < steps.length; i++) {
        if (steps[i] !== i + 1) {
          correctSteps = false
          break
        }
      }

      tests.push({
        testName: 'Conversion Steps',
        passed: correctSteps,
        message: correctSteps
          ? 'Conversion steps are sequential (1, 2, 3...)'
          : 'Conversion steps are not sequential',
        severity: 'warning',
      })
    }

    return tests
  }

  /**
   * Validate participation flow
   */
  private validateParticipationFlow(
    breakpoints: RangeBasedBreakpoint[],
    capTable: CapTableSnapshot
  ): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (breakpoints.length === 0) {
      return tests
    }

    // Track which securities should be participating at each stage
    const activeSecurities = new Set<string>()

    // Common should participate after pro-rata starts
    const proRata = breakpoints.find(
      (bp) => bp.breakpointType === BreakpointType.PRO_RATA_DISTRIBUTION
    )

    if (proRata) {
      const hasCommon = proRata.participants.some((p) => p.securityType === 'common')
      tests.push({
        testName: 'Common Participation',
        passed: hasCommon,
        message: hasCommon
          ? 'Common stock participates in pro-rata distribution'
          : 'Common stock missing from pro-rata distribution',
        severity: 'error',
        affectedItems: ['Common Stock'],
      })
    }

    // Participating preferred should participate after pro-rata starts
    const participating = CapTableHelpers.getParticipatingPreferred(capTable)
    if (participating.length > 0 && proRata) {
      const participatingNames = participating.map((p) => p.name)
      const proRataParticipants = proRata.participants.map((p) => p.securityName)
      const missing = participatingNames.filter((name) => !proRataParticipants.includes(name))

      tests.push({
        testName: 'Participating Preferred Participation',
        passed: missing.length === 0,
        message:
          missing.length === 0
            ? 'All participating preferred participate in pro-rata'
            : `Participating preferred missing from pro-rata: ${missing.join(', ')}`,
        severity: 'error',
        affectedItems: missing,
      })
    }

    // Non-participating should NOT participate until converted
    const nonParticipating = CapTableHelpers.getNonParticipatingPreferred(capTable)
    if (nonParticipating.length > 0 && proRata) {
      const nonParticipatingNames = nonParticipating.map((p) => p.name)
      const proRataParticipants = proRata.participants.map((p) => p.securityName)
      const incorrectlyParticipating = nonParticipatingNames.filter((name) =>
        proRataParticipants.includes(name)
      )

      tests.push({
        testName: 'Non-Participating Exclusion',
        passed: incorrectlyParticipating.length === 0,
        message:
          incorrectlyParticipating.length === 0
            ? 'Non-participating preferred correctly excluded from initial pro-rata'
            : `Non-participating should not participate before conversion: ${incorrectlyParticipating.join(', ')}`,
        severity: 'error',
        affectedItems: incorrectlyParticipating,
      })
    }

    return tests
  }

  /**
   * Validate breakpoint counts
   */
  private validateBreakpointCount(
    breakpoints: RangeBasedBreakpoint[],
    capTable: CapTableSnapshot
  ): ValidationTest[] {
    const tests: ValidationTest[] = []

    // Expected LP breakpoints = distinct seniority ranks
    const expectedLP = CapTableHelpers.countDistinctSeniorityRanks(capTable)
    const actualLP = breakpoints.filter(
      (bp) => bp.breakpointType === BreakpointType.LIQUIDATION_PREFERENCE
    ).length

    tests.push({
      testName: 'LP Breakpoint Count',
      passed: actualLP === expectedLP,
      message:
        actualLP === expectedLP
          ? `Found ${actualLP} LP breakpoints (expected ${expectedLP})`
          : `Found ${actualLP} LP breakpoints, expected ${expectedLP}`,
      severity: 'error',
    })

    // Expected pro-rata breakpoints = 1
    const actualProRata = breakpoints.filter(
      (bp) => bp.breakpointType === BreakpointType.PRO_RATA_DISTRIBUTION
    ).length

    tests.push({
      testName: 'Pro-Rata Breakpoint Count',
      passed: actualProRata === 1,
      message:
        actualProRata === 1
          ? 'Found 1 pro-rata breakpoint (expected 1)'
          : `Found ${actualProRata} pro-rata breakpoints, expected 1`,
      severity: 'error',
    })

    // Expected conversion breakpoints = non-participating count
    const expectedConversions = CapTableHelpers.getNonParticipatingPreferred(capTable).length
    const actualConversions = breakpoints.filter(
      (bp) => bp.breakpointType === BreakpointType.VOLUNTARY_CONVERSION
    ).length

    tests.push({
      testName: 'Conversion Breakpoint Count',
      passed: actualConversions === expectedConversions,
      message:
        actualConversions === expectedConversions
          ? `Found ${actualConversions} conversion breakpoints (expected ${expectedConversions})`
          : `Found ${actualConversions} conversion breakpoints, expected ${expectedConversions}`,
      severity: 'error',
    })

    // Expected cap breakpoints = participating-with-cap count
    const expectedCaps = CapTableHelpers.getPreferredWithCaps(capTable).length
    const actualCaps = breakpoints.filter(
      (bp) => bp.breakpointType === BreakpointType.PARTICIPATION_CAP
    ).length

    tests.push({
      testName: 'Cap Breakpoint Count',
      passed: actualCaps === expectedCaps,
      message:
        actualCaps === expectedCaps
          ? `Found ${actualCaps} cap breakpoints (expected ${expectedCaps})`
          : `Found ${actualCaps} cap breakpoints, expected ${expectedCaps}`,
      severity: 'error',
    })

    // Expected option breakpoints = unique strikes > $0.01
    const uniqueStrikes = CapTableHelpers.getUniqueStrikePrices(capTable)
    const expectedOptions = uniqueStrikes.filter((s) => s.gt(new Decimal(0.01))).length
    const actualOptions = breakpoints.filter(
      (bp) => bp.breakpointType === BreakpointType.OPTION_EXERCISE
    ).length

    tests.push({
      testName: 'Option Breakpoint Count',
      passed: actualOptions === expectedOptions,
      message:
        actualOptions === expectedOptions
          ? `Found ${actualOptions} option breakpoints (expected ${expectedOptions})`
          : `Found ${actualOptions} option breakpoints, expected ${expectedOptions}`,
      severity: 'error',
    })

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
      parts.push(`✓ Consistency validation PASSED`)
    } else {
      parts.push(`✗ Consistency validation FAILED`)
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
  getValidationReport(result: ConsistencyValidationResult): string {
    const lines: string[] = []

    lines.push('Consistency Validation Report')
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
