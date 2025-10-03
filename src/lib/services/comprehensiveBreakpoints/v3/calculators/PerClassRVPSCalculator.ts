/**
 * Per-Class RVPS Calculator
 *
 * Calculates Redemption Value Per Share (RVPS) for each preferred share class.
 * Formula: Class RVPS = Class LP ÷ Class Shares
 *
 * This is CRITICAL for determining voluntary conversion order:
 * - Lower RVPS = Lower opportunity cost = Converts first
 * - Higher RVPS = Higher opportunity cost = Converts later
 *
 * @module PerClassRVPSCalculator
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot, PreferredShareClass } from '../types/CapTableTypes'
import {
  ClassRVPSAnalysis,
  ConversionOrderResult,
  ConversionTimelineEntry,
} from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { MathematicalProofs } from '../utilities/MathematicalProofs'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * PerClassRVPSCalculator
 *
 * Analyzes each preferred class to determine conversion order
 */
export class PerClassRVPSCalculator {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Analyze all preferred classes and determine conversion order
   */
  analyze(capTable: CapTableSnapshot): ConversionOrderResult {
    this.auditLogger.step('Calculating per-class RVPS for conversion order')

    const classAnalyses: ClassRVPSAnalysis[] = []

    // Calculate RVPS for each preferred class
    for (const series of capTable.preferredSeries) {
      const classRVPS = this.calculateClassRVPS(series)

      const analysis: ClassRVPSAnalysis = {
        seriesName: series.name,
        classLiquidationPreference: series.totalLiquidationPreference,
        classTotalShares: series.sharesOutstanding,
        classRVPS,
        isParticipating:
          series.preferenceType === 'participating' ||
          series.preferenceType === 'participating-with-cap',
        preferenceType: series.preferenceType,
        calculationDetails: this.generateCalculationDetails(series, classRVPS),
      }

      classAnalyses.push(analysis)

      // Log class RVPS
      this.auditLogger.logClassRVPS(
        series.name,
        series.totalLiquidationPreference,
        series.sharesOutstanding,
        classRVPS
      )

      // Log mathematical proof
      const proof = MathematicalProofs.generateClassRVPSProof(series)
      this.auditLogger.logMathematicalProof(`Class RVPS: ${series.name}`, proof)
    }

    // Determine conversion order (non-participating only, sorted by RVPS)
    const orderedClasses = this.determineConversionOrder(classAnalyses)

    // Generate timeline
    const timeline = this.generateTimeline(orderedClasses)

    // Log conversion order
    this.auditLogger.logConversionOrder(
      orderedClasses
        .filter((c) => !c.isParticipating)
        .map((c) => ({
          name: c.seriesName,
          rvps: c.classRVPS,
        }))
    )

    const orderingLogic = this.generateOrderingLogic(orderedClasses)

    // Log mathematical proof for conversion order
    const orderProof = MathematicalProofs.generateConversionOrderProof(orderedClasses)
    this.auditLogger.logMathematicalProof('Conversion Order', orderProof)

    return {
      orderedClasses,
      orderingLogic,
      timeline,
    }
  }

  /**
   * Calculate class-specific RVPS
   * Formula: Class RVPS = Class LP ÷ Class Shares
   */
  private calculateClassRVPS(series: PreferredShareClass): Decimal {
    return CapTableHelpers.calculateClassRVPS(series)
  }

  /**
   * Determine conversion order for non-participating preferred
   * Lower RVPS converts first (lower opportunity cost)
   */
  private determineConversionOrder(classAnalyses: ClassRVPSAnalysis[]): ClassRVPSAnalysis[] {
    // Separate participating and non-participating
    const participating = classAnalyses.filter((c) => c.isParticipating)
    const nonParticipating = classAnalyses.filter((c) => !c.isParticipating)

    // Sort non-participating by RVPS (ascending)
    nonParticipating.sort((a, b) => DecimalHelpers.compare(a.classRVPS, b.classRVPS))

    // Assign conversion priorities
    nonParticipating.forEach((analysis, idx) => {
      analysis.conversionPriority = idx + 1
    })

    // Participating classes don't convert voluntarily
    participating.forEach((analysis) => {
      analysis.conversionPriority = undefined
    })

    // Return all classes with non-participating first (in conversion order)
    return [...nonParticipating, ...participating]
  }

  /**
   * Generate calculation details for a class
   */
  private generateCalculationDetails(series: PreferredShareClass, classRVPS: Decimal): string {
    return [
      `Class RVPS = Class LP ÷ Class Shares`,
      `Class RVPS = ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)} ÷ ${DecimalHelpers.formatNumber(series.sharesOutstanding)}`,
      `Class RVPS = ${DecimalHelpers.formatCurrency(classRVPS)} per share`,
    ].join('\n')
  }

  /**
   * Generate ordering logic explanation
   */
  private generateOrderingLogic(orderedClasses: ClassRVPSAnalysis[]): string {
    const nonParticipating = orderedClasses.filter((c) => !c.isParticipating)

    if (nonParticipating.length === 0) {
      return 'No non-participating preferred classes - no voluntary conversion breakpoints'
    }

    const parts: string[] = []

    parts.push('Voluntary conversion order determined by class RVPS (Redemption Value Per Share):')
    parts.push('')
    parts.push('Principle: Lower RVPS = Lower opportunity cost = Converts first')
    parts.push('')
    parts.push('Conversion sequence:')

    nonParticipating.forEach((classAnalysis, idx) => {
      parts.push(
        `${idx + 1}. ${classAnalysis.seriesName} (RVPS: ${DecimalHelpers.formatCurrency(classAnalysis.classRVPS)})`
      )
    })

    if (orderedClasses.some((c) => c.isParticipating)) {
      parts.push('')
      parts.push('Note: Participating preferred never converts voluntarily')
      const participatingNames = orderedClasses
        .filter((c) => c.isParticipating)
        .map((c) => c.seriesName)
        .join(', ')
      parts.push(`Participating: ${participatingNames}`)
    }

    return parts.join('\n')
  }

  /**
   * Generate visual timeline of conversion order
   */
  private generateTimeline(orderedClasses: ClassRVPSAnalysis[]): ConversionTimelineEntry[] {
    const timeline: ConversionTimelineEntry[] = []

    const nonParticipating = orderedClasses.filter((c) => !c.isParticipating)

    nonParticipating.forEach((classAnalysis, idx) => {
      const rationale = this.generateConversionRationale(classAnalysis, idx, nonParticipating)

      timeline.push({
        step: idx + 1,
        seriesName: classAnalysis.seriesName,
        classRVPS: classAnalysis.classRVPS,
        priority: classAnalysis.conversionPriority!,
        rationale,
      })
    })

    return timeline
  }

  /**
   * Generate rationale for conversion priority
   */
  private generateConversionRationale(
    classAnalysis: ClassRVPSAnalysis,
    index: number,
    allNonParticipating: ClassRVPSAnalysis[]
  ): string {
    const parts: string[] = []

    parts.push(`Class RVPS: ${DecimalHelpers.formatCurrency(classAnalysis.classRVPS)}`)

    if (index === 0) {
      parts.push('Lowest RVPS → Converts first (lowest opportunity cost)')
    } else {
      const prior = allNonParticipating[index - 1]
      const rvpsDiff = classAnalysis.classRVPS.minus(prior.classRVPS)
      parts.push(
        `RVPS ${DecimalHelpers.formatCurrency(rvpsDiff)} higher than ${prior.seriesName} → Converts after ${prior.seriesName}`
      )
    }

    return parts.join('; ')
  }

  /**
   * Get non-participating classes in conversion order
   */
  getNonParticipatingInOrder(capTable: CapTableSnapshot): ClassRVPSAnalysis[] {
    const result = this.analyze(capTable)
    return result.orderedClasses.filter((c) => !c.isParticipating)
  }

  /**
   * Get conversion priority for a specific series
   */
  getConversionPriority(capTable: CapTableSnapshot, seriesName: string): number | null {
    const result = this.analyze(capTable)
    const analysis = result.orderedClasses.find((c) => c.seriesName === seriesName)

    if (!analysis || analysis.isParticipating) {
      return null // Participating preferred doesn't convert
    }

    return analysis.conversionPriority!
  }

  /**
   * Check if a series converts before another series
   */
  convertsBefore(capTable: CapTableSnapshot, seriesA: string, seriesB: string): boolean {
    const priorityA = this.getConversionPriority(capTable, seriesA)
    const priorityB = this.getConversionPriority(capTable, seriesB)

    if (priorityA === null || priorityB === null) {
      return false // At least one is participating
    }

    return priorityA < priorityB
  }

  /**
   * Get classes that convert before a given series
   */
  getClassesConvertingBefore(capTable: CapTableSnapshot, seriesName: string): ClassRVPSAnalysis[] {
    const result = this.analyze(capTable)
    const targetAnalysis = result.orderedClasses.find((c) => c.seriesName === seriesName)

    if (!targetAnalysis || targetAnalysis.isParticipating) {
      return []
    }

    const targetPriority = targetAnalysis.conversionPriority!

    return result.orderedClasses.filter(
      (c) =>
        !c.isParticipating &&
        c.conversionPriority !== undefined &&
        c.conversionPriority < targetPriority
    )
  }

  /**
   * Calculate total LP waived by classes that convert before a given series
   */
  calculateWaivedLPBefore(capTable: CapTableSnapshot, seriesName: string): Decimal {
    const priorClasses = this.getClassesConvertingBefore(capTable, seriesName)

    return DecimalHelpers.sum(priorClasses.map((c) => c.classLiquidationPreference))
  }
}
