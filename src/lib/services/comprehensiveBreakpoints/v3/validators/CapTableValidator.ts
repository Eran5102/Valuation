/**
 * Cap Table Validator
 *
 * Validates cap table structure and data integrity before breakpoint analysis.
 * Performs comprehensive validation checks to ensure clean, analyzable data.
 *
 * Validation Categories:
 * 1. Structural - Required fields, non-empty arrays
 * 2. Numeric - Positive values, valid ranges
 * 3. Logical - Unique names, sequential seniority, valid participation types
 * 4. Business Rules - Valid multipliers, conversion ratios, cap relationships
 *
 * @module CapTableValidator
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot, PreferredShareClass, PreferenceType } from '../types/CapTableTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * Validation test result
 */
export interface ValidationTest {
  testName: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
  affectedItems?: string[]
}

/**
 * Cap table validation result
 */
export interface CapTableValidationResult {
  valid: boolean
  totalTests: number
  passed: number
  failed: number
  warnings: number
  tests: ValidationTest[]
  summary: string
}

/**
 * CapTableValidator
 *
 * Validates cap table data integrity
 */
export class CapTableValidator {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Validate cap table
   */
  validate(capTable: CapTableSnapshot): CapTableValidationResult {
    this.auditLogger.step('Validating cap table structure and data')

    const tests: ValidationTest[] = []

    // Run all validation tests
    tests.push(...this.validateStructure(capTable))
    tests.push(...this.validatePreferredSeries(capTable))
    tests.push(...this.validateCommonStock(capTable))
    tests.push(...this.validateOptions(capTable))
    tests.push(...this.validateSeniority(capTable))
    tests.push(...this.validateParticipation(capTable))
    tests.push(...this.validateCaps(capTable))

    // Calculate summary
    const passed = tests.filter((t) => t.passed).length
    const failed = tests.filter((t) => !t.passed && t.severity === 'error').length
    const warnings = tests.filter((t) => !t.passed && t.severity === 'warning').length
    const valid = failed === 0

    const summary = this.generateSummary(tests, valid, passed, failed, warnings)

    const result: CapTableValidationResult = {
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
      this.auditLogger.info('Cap Table Validation', 'Cap table validation passed', {
        totalTests: tests.length,
        passed,
        warnings,
      })
    } else {
      this.auditLogger.error('Cap Table Validation', 'Cap table validation failed', {
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
  private validateStructure(capTable: CapTableSnapshot): ValidationTest[] {
    const tests: ValidationTest[] = []

    // Check preferred series exists
    tests.push({
      testName: 'Preferred Series Structure',
      passed: Array.isArray(capTable.preferredSeries),
      message: Array.isArray(capTable.preferredSeries)
        ? 'Preferred series is valid array'
        : 'Preferred series must be an array',
      severity: 'error',
    })

    // Check common stock exists
    tests.push({
      testName: 'Common Stock Structure',
      passed: capTable.commonStock !== null && capTable.commonStock !== undefined,
      message:
        capTable.commonStock !== null && capTable.commonStock !== undefined
          ? 'Common stock structure exists'
          : 'Common stock structure is required',
      severity: 'error',
    })

    // Check options exists
    tests.push({
      testName: 'Options Structure',
      passed: Array.isArray(capTable.options),
      message: Array.isArray(capTable.options)
        ? 'Options is valid array'
        : 'Options must be an array',
      severity: 'error',
    })

    return tests
  }

  /**
   * Validate preferred series
   */
  private validatePreferredSeries(capTable: CapTableSnapshot): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(capTable.preferredSeries)) {
      return tests
    }

    // Check for empty preferred (warning only)
    if (capTable.preferredSeries.length === 0) {
      tests.push({
        testName: 'Preferred Series Count',
        passed: false,
        message: 'No preferred series found - only common stock waterfall',
        severity: 'warning',
      })
    }

    // Validate each series
    for (const series of capTable.preferredSeries) {
      // Name required
      tests.push({
        testName: `Series Name: ${series.name || 'unnamed'}`,
        passed: !!series.name && series.name.trim().length > 0,
        message: series.name ? `Series name '${series.name}' is valid` : 'Series must have a name',
        severity: 'error',
        affectedItems: [series.name || 'unnamed'],
      })

      // Shares outstanding > 0
      const sharesValid = DecimalHelpers.isPositive(series.sharesOutstanding)
      tests.push({
        testName: `Shares Outstanding: ${series.name}`,
        passed: sharesValid,
        message: sharesValid
          ? `${series.name} has ${DecimalHelpers.formatNumber(series.sharesOutstanding)} shares`
          : `${series.name} must have positive shares outstanding`,
        severity: 'error',
        affectedItems: [series.name],
      })

      // Price per share >= 0
      const priceValid = series.pricePerShare.gte(0)
      tests.push({
        testName: `Price Per Share: ${series.name}`,
        passed: priceValid,
        message: priceValid
          ? `${series.name} has valid price ${DecimalHelpers.formatCurrency(series.pricePerShare)}`
          : `${series.name} price per share cannot be negative`,
        severity: 'error',
        affectedItems: [series.name],
      })

      // Liquidation multiple >= 1
      const multValid = series.liquidationMultiple >= 1
      tests.push({
        testName: `Liquidation Multiple: ${series.name}`,
        passed: multValid,
        message: multValid
          ? `${series.name} has ${series.liquidationMultiple}x liquidation preference`
          : `${series.name} liquidation multiple must be >= 1`,
        severity: 'error',
        affectedItems: [series.name],
      })

      // Conversion ratio > 0
      const convValid = series.conversionRatio > 0
      tests.push({
        testName: `Conversion Ratio: ${series.name}`,
        passed: convValid,
        message: convValid
          ? `${series.name} has conversion ratio ${series.conversionRatio}`
          : `${series.name} conversion ratio must be > 0`,
        severity: 'error',
        affectedItems: [series.name],
      })

      // Seniority >= 0
      const seniorityValid = series.seniority >= 0
      tests.push({
        testName: `Seniority: ${series.name}`,
        passed: seniorityValid,
        message: seniorityValid
          ? `${series.name} has seniority ${series.seniority}`
          : `${series.name} seniority cannot be negative`,
        severity: 'error',
        affectedItems: [series.name],
      })

      // Valid participation type (PreferenceType)
      const validTypes: PreferenceType[] = [
        'non-participating',
        'participating',
        'participating-with-cap',
      ]
      const typeValid = validTypes.includes(series.preferenceType)
      tests.push({
        testName: `Participation Type: ${series.name}`,
        passed: typeValid,
        message: typeValid
          ? `${series.name} has valid participation type: ${series.preferenceType}`
          : `${series.name} has invalid participation type: ${series.preferenceType}`,
        severity: 'error',
        affectedItems: [series.name],
      })
    }

    // Check for duplicate names
    const names = capTable.preferredSeries.map((s) => s.name)
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
    if (duplicates.length > 0) {
      tests.push({
        testName: 'Unique Series Names',
        passed: false,
        message: `Duplicate series names found: ${[...new Set(duplicates)].join(', ')}`,
        severity: 'error',
        affectedItems: [...new Set(duplicates)],
      })
    } else if (capTable.preferredSeries.length > 0) {
      tests.push({
        testName: 'Unique Series Names',
        passed: true,
        message: 'All series have unique names',
        severity: 'info',
      })
    }

    return tests
  }

  /**
   * Validate common stock
   */
  private validateCommonStock(capTable: CapTableSnapshot): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!capTable.commonStock) {
      return tests
    }

    // Shares outstanding >= 0 (can be 0 if only preferred exists)
    const sharesValid = capTable.commonStock.sharesOutstanding.gte(0)
    tests.push({
      testName: 'Common Stock Shares',
      passed: sharesValid,
      message: sharesValid
        ? `Common stock: ${DecimalHelpers.formatNumber(capTable.commonStock.sharesOutstanding)} shares`
        : 'Common stock shares cannot be negative',
      severity: 'error',
      affectedItems: ['Common Stock'],
    })

    // Warning if no common shares
    if (DecimalHelpers.isZero(capTable.commonStock.sharesOutstanding)) {
      tests.push({
        testName: 'Common Stock Existence',
        passed: false,
        message: 'No common stock shares - unusual cap table structure',
        severity: 'warning',
        affectedItems: ['Common Stock'],
      })
    }

    return tests
  }

  /**
   * Validate options
   */
  private validateOptions(capTable: CapTableSnapshot): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(capTable.options)) {
      return tests
    }

    // Empty options is valid (warning only)
    if (capTable.options.length === 0) {
      tests.push({
        testName: 'Option Pools',
        passed: true,
        message: 'No option pools - valid but uncommon',
        severity: 'info',
      })
      return tests
    }

    // Validate each pool
    for (const pool of capTable.options) {
      // Pool name required
      tests.push({
        testName: `Option Pool Name: ${pool.poolName || 'unnamed'}`,
        passed: !!pool.poolName && pool.poolName.trim().length > 0,
        message: pool.poolName
          ? `Pool name '${pool.poolName}' is valid`
          : 'Option pool must have a name',
        severity: 'error',
        affectedItems: [pool.poolName || 'unnamed'],
      })

      // Validate exercise price
      // Exercise price >= 0 (must be non-negative)
      const exerciseValid = pool.exercisePrice.gte(0)
      tests.push({
        testName: `Exercise Price: ${pool.poolName}`,
        passed: exerciseValid,
        message: exerciseValid
          ? `${pool.poolName} exercise price: ${DecimalHelpers.formatCurrency(pool.exercisePrice)}`
          : `${pool.poolName} exercise price cannot be negative`,
        severity: 'error',
        affectedItems: [pool.poolName],
      })

      // Num options > 0
      const optionsValid = DecimalHelpers.isPositive(pool.numOptions)
      tests.push({
        testName: `Options Count: ${pool.poolName}`,
        passed: optionsValid,
        message: optionsValid
          ? `${pool.poolName}: ${DecimalHelpers.formatNumber(pool.numOptions)} options`
          : `${pool.poolName} must have positive number of options`,
        severity: 'error',
        affectedItems: [pool.poolName],
      })
    }

    // Check for duplicate pool names
    const poolNames = capTable.options.map((p) => p.poolName)
    const duplicates = poolNames.filter((name, index) => poolNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      tests.push({
        testName: 'Unique Pool Names',
        passed: false,
        message: `Duplicate pool names found: ${[...new Set(duplicates)].join(', ')}`,
        severity: 'error',
        affectedItems: [...new Set(duplicates)],
      })
    } else {
      tests.push({
        testName: 'Unique Pool Names',
        passed: true,
        message: 'All option pools have unique names',
        severity: 'info',
      })
    }

    return tests
  }

  /**
   * Validate seniority structure
   */
  private validateSeniority(capTable: CapTableSnapshot): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(capTable.preferredSeries) || capTable.preferredSeries.length === 0) {
      return tests
    }

    const seniorities = capTable.preferredSeries.map((s) => s.seniority).sort((a, b) => a - b)

    // Check starts at 0
    tests.push({
      testName: 'Seniority Starting Point',
      passed: seniorities[0] === 0,
      message:
        seniorities[0] === 0
          ? 'Most senior series has seniority 0'
          : `Most senior series has seniority ${seniorities[0]}, should be 0`,
      severity: 'warning',
    })

    // Check sequential (no gaps)
    let sequential = true
    const gaps: number[] = []
    for (let i = 0; i < seniorities[seniorities.length - 1]; i++) {
      if (!seniorities.includes(i)) {
        sequential = false
        gaps.push(i)
      }
    }

    tests.push({
      testName: 'Sequential Seniority',
      passed: sequential,
      message: sequential
        ? 'Seniority ranks are sequential (no gaps)'
        : `Missing seniority ranks: ${gaps.join(', ')}`,
      severity: 'warning',
    })

    return tests
  }

  /**
   * Validate participation logic
   */
  private validateParticipation(capTable: CapTableSnapshot): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(capTable.preferredSeries) || capTable.preferredSeries.length === 0) {
      return tests
    }

    for (const series of capTable.preferredSeries) {
      // If participating_with_cap, must have cap amount
      if (series.participationType === 'participating_with_cap') {
        const hasCap = series.participationCap !== null && series.participationCap !== undefined
        tests.push({
          testName: `Participation Cap: ${series.name}`,
          passed: hasCap,
          message: hasCap
            ? `${series.name} has cap: ${DecimalHelpers.formatCurrency(series.participationCap!)}`
            : `${series.name} is participating_with_cap but missing cap amount`,
          severity: 'error',
          affectedItems: [series.name],
        })

        // Cap must be >= LP
        if (hasCap) {
          const capValid = series.participationCap!.gte(series.totalLiquidationPreference)
          tests.push({
            testName: `Cap Amount: ${series.name}`,
            passed: capValid,
            message: capValid
              ? `${series.name} cap (${DecimalHelpers.formatCurrency(series.participationCap!)}) >= LP (${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)})`
              : `${series.name} cap (${DecimalHelpers.formatCurrency(series.participationCap!)}) < LP (${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)}) - invalid`,
            severity: 'error',
            affectedItems: [series.name],
          })
        }
      }

      // If not participating_with_cap, should not have cap
      if (
        series.participationType !== 'participating_with_cap' &&
        series.participationCap !== null &&
        series.participationCap !== undefined
      ) {
        tests.push({
          testName: `Unexpected Cap: ${series.name}`,
          passed: false,
          message: `${series.name} is ${series.participationType} but has participation cap - will be ignored`,
          severity: 'warning',
          affectedItems: [series.name],
        })
      }
    }

    return tests
  }

  /**
   * Validate participation caps
   */
  private validateCaps(capTable: CapTableSnapshot): ValidationTest[] {
    const tests: ValidationTest[] = []

    if (!Array.isArray(capTable.preferredSeries) || capTable.preferredSeries.length === 0) {
      return tests
    }

    const withCaps = capTable.preferredSeries.filter(
      (s) => s.participationType === 'participating_with_cap'
    )

    if (withCaps.length === 0) {
      tests.push({
        testName: 'Participation Caps',
        passed: true,
        message: 'No series with participation caps',
        severity: 'info',
      })
      return tests
    }

    // Validate cap relationships
    for (const series of withCaps) {
      if (!series.participationCap) continue

      // Cap should be reasonable multiple of LP (typically 2x-3x)
      const multiple = series.participationCap.dividedBy(series.totalLiquidationPreference)
      const reasonable = multiple.gte(1) && multiple.lte(10)

      tests.push({
        testName: `Cap Multiple: ${series.name}`,
        passed: reasonable,
        message: reasonable
          ? `${series.name} cap is ${multiple.toFixed(1)}x LP (reasonable)`
          : `${series.name} cap is ${multiple.toFixed(1)}x LP (unusual - verify)`,
        severity: reasonable ? 'info' : 'warning',
        affectedItems: [series.name],
      })
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
      parts.push(`✓ Cap table validation PASSED`)
    } else {
      parts.push(`✗ Cap table validation FAILED`)
    }

    parts.push(`${passed}/${tests.length} tests passed`)

    if (failed > 0) {
      parts.push(`${failed} errors`)
    }

    if (warnings > 0) {
      parts.push(`${warnings} warnings`)
    }

    // Add critical errors
    const errors = tests.filter((t) => !t.passed && t.severity === 'error')
    if (errors.length > 0) {
      parts.push(`\nCritical errors: ${errors.map((e) => e.message).join('; ')}`)
    }

    return parts.join('; ')
  }

  /**
   * Get validation report
   */
  getValidationReport(result: CapTableValidationResult): string {
    const lines: string[] = []

    lines.push('Cap Table Validation Report')
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
          if (test.affectedItems && test.affectedItems.length > 0) {
            lines.push(`  Affected: ${test.affectedItems.join(', ')}`)
          }
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
