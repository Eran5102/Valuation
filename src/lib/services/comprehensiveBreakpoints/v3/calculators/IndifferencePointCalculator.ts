/**
 * Indifference Point Calculator
 *
 * Calculates voluntary conversion indifference points for non-participating preferred.
 *
 * Key Concept:
 * At the indifference point, LP path value = Conversion path value
 *
 * Critical: Sequential LP Waiver
 * - Lower RVPS classes convert first, WAIVING their LP
 * - Higher RVPS classes calculate indifference based on REMAINING LP
 * - Each step depends on prior conversions
 *
 * Formula:
 * LP Path: Target LP
 * Conversion Path: (Exit - Remaining LP) × Pro-rata %
 * Indifference: Target LP = (Exit - Remaining LP) × Pro-rata %
 * Solving: Exit = (Target LP ÷ Pro-rata %) + Remaining LP
 *
 * @module IndifferencePointCalculator
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot } from '../types/CapTableTypes'
import {
  ClassRVPSAnalysis,
  IndifferencePointResult,
  IndifferenceProofData,
} from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { MathematicalProofs } from '../utilities/MathematicalProofs'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * IndifferencePointCalculator
 *
 * Calculates indifference points for voluntary conversion
 */
export class IndifferencePointCalculator {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Calculate indifference point for a series
   * CRITICAL: Must account for LP waived by prior conversions
   */
  calculate(
    capTable: CapTableSnapshot,
    targetClass: ClassRVPSAnalysis,
    stepNumber: number,
    priorConversions: ClassRVPSAnalysis[]
  ): IndifferencePointResult {
    this.auditLogger.step(
      `Calculating indifference point for ${targetClass.seriesName} (Step ${stepNumber})`
    )

    // Calculate LP waived by prior conversions
    const waivedLP = DecimalHelpers.sum(priorConversions.map((c) => c.classLiquidationPreference))

    // Calculate total LP
    const totalLP = CapTableHelpers.calculateTotalLP(capTable)

    // Calculate remaining LP (after prior conversions)
    const remainingLP = totalLP.minus(waivedLP)

    this.auditLogger.debug(
      'Indifference Calculation',
      `Total LP: ${DecimalHelpers.formatCurrency(totalLP)}, Waived: ${DecimalHelpers.formatCurrency(waivedLP)}, Remaining: ${DecimalHelpers.formatCurrency(remainingLP)}`,
      {
        totalLP: totalLP.toString(),
        waivedLP: waivedLP.toString(),
        remainingLP: remainingLP.toString(),
        priorConversions: priorConversions.map((c) => c.seriesName),
      }
    )

    // Calculate total shares after all conversions (including this one)
    const totalSharesAfterConversion = this.calculateTotalSharesAfterConversion(capTable, [
      ...priorConversions,
      targetClass,
    ])

    // Calculate target series converted shares
    const series = CapTableHelpers.getSeriesByName(capTable, targetClass.seriesName)
    if (!series) {
      throw new Error(`Series not found: ${targetClass.seriesName}`)
    }

    const targetConvertedShares = CapTableHelpers.getConvertedShares(series)

    // Calculate pro-rata percentage after conversion
    const proRataPercentage = DecimalHelpers.safeDivide(
      targetConvertedShares,
      totalSharesAfterConversion
    )

    this.auditLogger.debug(
      'Indifference Calculation',
      `Pro-rata %: ${DecimalHelpers.formatPercentage(proRataPercentage.times(100), 2)}`,
      {
        targetConvertedShares: targetConvertedShares.toString(),
        totalSharesAfterConversion: totalSharesAfterConversion.toString(),
        proRataPercentage: proRataPercentage.toString(),
      }
    )

    // Calculate indifference point
    // Formula: Exit = (Target LP ÷ Pro-rata %) + Remaining LP
    const targetLP = targetClass.classLiquidationPreference

    if (DecimalHelpers.isZero(proRataPercentage)) {
      throw new Error(
        `Pro-rata percentage is zero for ${targetClass.seriesName} - cannot calculate indifference point`
      )
    }

    const indifferencePoint = targetLP.dividedBy(proRataPercentage).plus(remainingLP)

    // Generate mathematical proof
    const proofData: IndifferenceProofData = {
      stepNumber,
      targetSeries: targetClass.seriesName,
      alreadyConverted: priorConversions.map((c) => c.seriesName),
      waivedLP,
      targetLP,
      remainingLP,
      proRataPercentage,
      indifferencePoint,
    }

    const mathematicalProof = MathematicalProofs.generateIndifferencePointProof(proofData)

    // Log indifference point
    this.auditLogger.logConversion(
      targetClass.seriesName,
      stepNumber,
      targetClass.classRVPS,
      indifferencePoint,
      waivedLP,
      remainingLP,
      priorConversions.map((c) => c.seriesName)
    )

    // Log mathematical proof
    this.auditLogger.logMathematicalProof(
      `Indifference Point: ${targetClass.seriesName}`,
      mathematicalProof
    )

    return {
      breakpointValue: indifferencePoint,
      mathematicalProof,
      waivedLP,
      remainingLP,
      proRataPercentage,
      stepNumber,
      priorConversions: priorConversions.map((c) => c.seriesName),
    }
  }

  /**
   * Calculate indifference points for all non-participating series in order
   * Returns array in conversion order (lowest RVPS first)
   */
  calculateAllInOrder(
    capTable: CapTableSnapshot,
    orderedClasses: ClassRVPSAnalysis[]
  ): IndifferencePointResult[] {
    const results: IndifferencePointResult[] = []
    const convertedClasses: ClassRVPSAnalysis[] = []

    // Filter to non-participating only
    const nonParticipating = orderedClasses.filter((c) => !c.isParticipating)

    for (let i = 0; i < nonParticipating.length; i++) {
      const targetClass = nonParticipating[i]
      const stepNumber = i + 1

      const result = this.calculate(capTable, targetClass, stepNumber, convertedClasses)

      results.push(result)

      // Add to converted classes for next iteration
      convertedClasses.push(targetClass)
    }

    return results
  }

  /**
   * Verify indifference point calculation
   * Confirms LP path = Conversion path at calculated point
   */
  verifyIndifferencePoint(
    targetLP: Decimal,
    indifferencePoint: Decimal,
    remainingLP: Decimal,
    proRataPercentage: Decimal
  ): { verified: boolean; lpPath: Decimal; conversionPath: Decimal; error: Decimal } {
    // LP Path: Target receives its LP
    const lpPath = targetLP

    // Conversion Path: (Exit - Remaining LP) × Pro-rata %
    const conversionPath = indifferencePoint.minus(remainingLP).times(proRataPercentage)

    // Error: Difference between paths
    const error = lpPath.minus(conversionPath).abs()

    // Verified if error is within tolerance
    const verified = error.lte(DecimalHelpers.DECIMAL_TOLERANCE)

    return {
      verified,
      lpPath,
      conversionPath,
      error,
    }
  }

  /**
   * Calculate total shares after specified conversions
   * Includes: common + participating preferred + converted non-participating
   */
  private calculateTotalSharesAfterConversion(
    capTable: CapTableSnapshot,
    convertedClasses: ClassRVPSAnalysis[]
  ): Decimal {
    let totalShares = CapTableHelpers.getTotalCommonShares(capTable)

    // Add participating preferred (as-if-converted)
    const participatingPreferred = CapTableHelpers.getParticipatingPreferred(capTable)
    for (const series of participatingPreferred) {
      totalShares = totalShares.plus(CapTableHelpers.getConvertedShares(series))
    }

    // Add converted non-participating
    for (const classAnalysis of convertedClasses) {
      const series = CapTableHelpers.getSeriesByName(capTable, classAnalysis.seriesName)
      if (series) {
        totalShares = totalShares.plus(CapTableHelpers.getConvertedShares(series))
      }
    }

    return totalShares
  }

  /**
   * Get remaining LP at a specific conversion step
   */
  getRemainingLPAtStep(capTable: CapTableSnapshot, priorConversions: ClassRVPSAnalysis[]): Decimal {
    const totalLP = CapTableHelpers.calculateTotalLP(capTable)
    const waivedLP = DecimalHelpers.sum(priorConversions.map((c) => c.classLiquidationPreference))
    return totalLP.minus(waivedLP)
  }

  /**
   * Check if conversion is economically rational at given exit value
   * Returns true if conversion path > LP path
   */
  isConversionRational(
    exitValue: Decimal,
    targetLP: Decimal,
    remainingLP: Decimal,
    proRataPercentage: Decimal
  ): boolean {
    const lpPath = targetLP
    const conversionPath = exitValue.minus(remainingLP).times(proRataPercentage)
    return conversionPath.gt(lpPath)
  }

  /**
   * Calculate LP path value
   */
  calculateLPPath(targetLP: Decimal): Decimal {
    return targetLP
  }

  /**
   * Calculate conversion path value
   */
  calculateConversionPath(
    exitValue: Decimal,
    remainingLP: Decimal,
    proRataPercentage: Decimal
  ): Decimal {
    return exitValue.minus(remainingLP).times(proRataPercentage)
  }

  /**
   * Get conversion sequence summary
   */
  getConversionSequenceSummary(results: IndifferencePointResult[]): {
    totalSteps: number
    sequence: Array<{
      step: number
      series: string
      indifferencePoint: string
      waivedLP: string
      remainingLP: string
    }>
  } {
    return {
      totalSteps: results.length,
      sequence: results.map((result) => ({
        step: result.stepNumber,
        series: result.priorConversions[result.stepNumber - 1] || 'N/A',
        indifferencePoint: result.breakpointValue.toString(),
        waivedLP: result.waivedLP.toString(),
        remainingLP: result.remainingLP.toString(),
      })),
    }
  }
}
