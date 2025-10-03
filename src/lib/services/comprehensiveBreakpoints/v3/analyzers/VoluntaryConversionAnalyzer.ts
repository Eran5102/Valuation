/**
 * Voluntary Conversion Analyzer
 *
 * Analyzes when non-participating preferred voluntarily converts to common.
 * Creates one breakpoint per non-participating series at their indifference point.
 *
 * CRITICAL - Sequential LP Waiver:
 * - Conversion order: lowest RVPS first (lowest opportunity cost)
 * - Each conversion WAIVES that series' LP
 * - Subsequent conversions calculated with REMAINING LP (after prior waivers)
 * - MUST execute in strict order (not parallel!)
 *
 * Example:
 * Step 1: Series A (RVPS $2.00) converts, waives $10M LP → Remaining LP = $25M
 * Step 2: Series B (RVPS $3.00) converts based on $25M remaining (NOT $35M total)
 *
 * @module VoluntaryConversionAnalyzer
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { CapTableSnapshot } from '../types/CapTableTypes'
import { RangeBasedBreakpoint, BreakpointType } from '../types/BreakpointTypes'
import { ClassRVPSAnalysis } from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { CapTableHelpers } from '../utilities/CapTableHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { PerClassRVPSCalculator } from '../calculators/PerClassRVPSCalculator'
import { IndifferencePointCalculator } from '../calculators/IndifferencePointCalculator'

/**
 * VoluntaryConversionAnalyzer
 *
 * Identifies voluntary conversion breakpoints (sequential, not parallel!)
 */
export class VoluntaryConversionAnalyzer {
  constructor(
    private rvpsCalculator: PerClassRVPSCalculator,
    private indifferenceCalculator: IndifferencePointCalculator,
    private auditLogger: AuditTrailLogger
  ) {}

  /**
   * Analyze voluntary conversion breakpoints
   * MUST execute sequentially in RVPS order (lowest first)
   */
  analyze(
    capTable: CapTableSnapshot,
    priorBreakpoints: RangeBasedBreakpoint[]
  ): RangeBasedBreakpoint[] {
    this.auditLogger.step('Analyzing voluntary conversion breakpoints (SEQUENTIAL)')

    const breakpoints: RangeBasedBreakpoint[] = []

    // Get conversion order (lowest RVPS first)
    const conversionOrderResult = this.rvpsCalculator.analyze(capTable)
    const nonParticipating = conversionOrderResult.orderedClasses.filter((c) => !c.isParticipating)

    if (nonParticipating.length === 0) {
      this.auditLogger.info(
        'Voluntary Conversion Analysis',
        'No non-participating preferred - no conversion breakpoints'
      )
      return []
    }

    this.auditLogger.info(
      'Voluntary Conversion Analysis',
      `Found ${nonParticipating.length} non-participating series`,
      {
        series: nonParticipating.map((c) => c.seriesName),
        order: nonParticipating.map((c) => ({
          name: c.seriesName,
          rvps: c.classRVPS.toString(),
          priority: c.conversionPriority,
        })),
      }
    )

    let breakpointOrder = priorBreakpoints.length + 1
    const convertedClasses: ClassRVPSAnalysis[] = []

    // Process each series IN ORDER (sequential, not parallel!)
    for (let i = 0; i < nonParticipating.length; i++) {
      const targetClass = nonParticipating[i]
      const stepNumber = i + 1

      this.auditLogger.debug(
        'Voluntary Conversion',
        `Step ${stepNumber}: Analyzing ${targetClass.seriesName}`,
        {
          stepNumber,
          seriesName: targetClass.seriesName,
          classRVPS: targetClass.classRVPS.toString(),
          priorConversions: convertedClasses.map((c) => c.seriesName),
        }
      )

      // Calculate indifference point (accounts for prior conversions!)
      const indifferenceResult = this.indifferenceCalculator.calculate(
        capTable,
        targetClass,
        stepNumber,
        convertedClasses // Classes that already converted
      )

      // Create breakpoint
      const breakpoint = this.createConversionBreakpoint(
        targetClass,
        indifferenceResult.breakpointValue,
        indifferenceResult.waivedLP,
        indifferenceResult.remainingLP,
        indifferenceResult.proRataPercentage,
        indifferenceResult.mathematicalProof,
        stepNumber,
        breakpointOrder,
        convertedClasses.map((c) => c.seriesName)
      )

      breakpoints.push(breakpoint)

      // Log
      this.auditLogger.logBreakpoint(breakpoint)

      // CRITICAL: Add to converted classes for next iteration
      convertedClasses.push(targetClass)

      breakpointOrder++
    }

    this.auditLogger.info(
      'Voluntary Conversion Analysis',
      `Identified ${breakpoints.length} voluntary conversion breakpoints`,
      {
        conversionSequence: breakpoints.map((bp) => ({
          order: bp.breakpointOrder,
          series: bp.affectedSecurities[0],
          value: bp.rangeFrom.toString(),
        })),
      }
    )

    return breakpoints
  }

  /**
   * Create voluntary conversion breakpoint
   */
  private createConversionBreakpoint(
    targetClass: ClassRVPSAnalysis,
    indifferencePoint: Decimal,
    waivedLP: Decimal,
    remainingLP: Decimal,
    proRataPercentage: Decimal,
    mathematicalProof: string,
    stepNumber: number,
    breakpointOrder: number,
    priorConversions: string[]
  ): RangeBasedBreakpoint {
    const series = targetClass.seriesName

    // Get series info
    const seriesInfo = CapTableHelpers.getSeriesByName(
      {
        preferredSeries: [],
        commonStock: { sharesOutstanding: DecimalHelpers.toDecimal(0) },
        options: [],
      } as any,
      series
    )

    const convertedShares = targetClass.classTotalShares.times(
      DecimalHelpers.toDecimal(1) // conversion ratio, assume 1:1 for now
    )

    // Participant: series converts to common
    const participant = {
      securityName: series,
      securityType: 'preferred_series' as const,
      participatingShares: convertedShares,
      participationPercentage: proRataPercentage,
      rvpsAtBreakpoint: DecimalHelpers.toDecimal(0), // Open-ended
      cumulativeRVPS: DecimalHelpers.toDecimal(0),
      sectionValue: DecimalHelpers.toDecimal(0),
      cumulativeValue: DecimalHelpers.toDecimal(0),
      participationStatus: 'converted' as const,
      participationNotes: `Voluntarily converts at indifference point (Step ${stepNumber})`,
    }

    const dependencies = [
      'Pro-rata distribution started',
      ...priorConversions.map((s) => `${s} converted`),
    ]

    const breakpoint: RangeBasedBreakpoint = {
      breakpointType: BreakpointType.VOLUNTARY_CONVERSION,
      breakpointOrder,
      rangeFrom: indifferencePoint,
      rangeTo: null, // Open-ended (continues to participate after conversion)
      isOpenEnded: true,
      participants: [participant],
      totalParticipatingShares: convertedShares,
      redemptionValuePerShare: DecimalHelpers.toDecimal(0),
      sectionRVPS: DecimalHelpers.toDecimal(0),
      calculationMethod: 'voluntary_conversion_indifference',
      explanation: this.generateExplanation(
        series,
        indifferencePoint,
        targetClass.classRVPS,
        stepNumber,
        waivedLP,
        remainingLP,
        priorConversions
      ),
      mathematicalDerivation: mathematicalProof,
      dependencies,
      affectedSecurities: [series],
      priorityOrder: 3000 + stepNumber, // Conversion: 3000-3999
      metadata: {
        conversionStep: stepNumber,
        classRVPS: targetClass.classRVPS.toString(),
        waivedLP: waivedLP.toString(),
        remainingLP: remainingLP.toString(),
        proRataPercentage: proRataPercentage.toString(),
        priorConversions,
      },
    }

    return breakpoint
  }

  /**
   * Generate explanation
   */
  private generateExplanation(
    series: string,
    indifferencePoint: Decimal,
    classRVPS: Decimal,
    stepNumber: number,
    waivedLP: Decimal,
    remainingLP: Decimal,
    priorConversions: string[]
  ): string {
    const parts: string[] = []

    parts.push(`Step ${stepNumber}: ${series} voluntary conversion`)
    parts.push(`Indifference Point: ${DecimalHelpers.formatCurrency(indifferencePoint)}`)
    parts.push(`Class RVPS: ${DecimalHelpers.formatCurrency(classRVPS)}`)

    if (priorConversions.length > 0) {
      parts.push(`Prior Conversions: ${priorConversions.join(', ')}`)
      parts.push(`LP Waived by Prior: ${DecimalHelpers.formatCurrency(waivedLP)}`)
      parts.push(`Remaining LP: ${DecimalHelpers.formatCurrency(remainingLP)}`)
    }

    parts.push('At indifference point, LP path value = Conversion path value')

    return parts.join('; ')
  }

  /**
   * Get expected voluntary conversion breakpoint count
   */
  getExpectedBreakpointCount(capTable: CapTableSnapshot): number {
    return CapTableHelpers.getNonParticipatingPreferred(capTable).length
  }

  /**
   * Validate conversion breakpoints
   */
  validate(
    breakpoints: RangeBasedBreakpoint[],
    capTable: CapTableSnapshot
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check count
    const expectedCount = this.getExpectedBreakpointCount(capTable)
    if (breakpoints.length !== expectedCount) {
      errors.push(`Expected ${expectedCount} conversion breakpoints, found ${breakpoints.length}`)
    }

    // Check sequential order (each depends on prior)
    for (let i = 1; i < breakpoints.length; i++) {
      const current = breakpoints[i]
      const prior = breakpoints[i - 1]

      // Current should depend on prior
      const dependsOnPrior = current.dependencies?.includes(
        `${prior.affectedSecurities[0]} converted`
      )

      if (!dependsOnPrior) {
        errors.push(
          `${current.affectedSecurities[0]} should depend on ${prior.affectedSecurities[0]} conversion`
        )
      }

      // Current indifference point should be > prior
      if (current.rangeFrom.lte(prior.rangeFrom)) {
        errors.push(
          `${current.affectedSecurities[0]} indifference point ${DecimalHelpers.formatCurrency(current.rangeFrom)} should be > ${prior.affectedSecurities[0]} ${DecimalHelpers.formatCurrency(prior.rangeFrom)}`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
