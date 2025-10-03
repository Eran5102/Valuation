/**
 * Mathematical Proofs Generator
 *
 * Generates human-readable mathematical derivations and proofs for breakpoint calculations.
 * Provides transparency by showing HOW values are calculated, not just WHAT they are.
 *
 * @module MathematicalProofs
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { PreferredShareClass } from '../types/CapTableTypes'
import { ClassRVPSAnalysis, IndifferenceProofData } from '../types/FormulaTypes'
import { DecimalHelpers } from './DecimalHelpers'

/**
 * MathematicalProofs class
 *
 * Generates mathematical derivations for all calculations
 */
export class MathematicalProofs {
  /**
   * Generate proof for class RVPS calculation
   */
  static generateClassRVPSProof(series: PreferredShareClass): string {
    const lines: string[] = []

    lines.push(`Class RVPS Calculation: ${series.name}`)
    lines.push('')
    lines.push('Formula: Class RVPS = Class LP ÷ Class Shares')
    lines.push('')
    lines.push('Given:')
    lines.push(`- Shares Outstanding: ${DecimalHelpers.formatNumber(series.sharesOutstanding)}`)
    lines.push(`- Price Per Share: ${DecimalHelpers.formatCurrency(series.pricePerShare)}`)
    lines.push(`- Liquidation Multiple: ${series.liquidationMultiple}x`)
    lines.push('')
    lines.push('Calculation:')
    lines.push(
      `- Class LP = ${DecimalHelpers.formatNumber(series.sharesOutstanding)} shares × ${DecimalHelpers.formatCurrency(series.pricePerShare)} × ${series.liquidationMultiple}x`
    )
    lines.push(`- Class LP = ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)}`)
    lines.push('')
    lines.push(
      `- Class RVPS = ${DecimalHelpers.formatCurrency(series.totalLiquidationPreference)} ÷ ${DecimalHelpers.formatNumber(series.sharesOutstanding)}`
    )

    const rvps = DecimalHelpers.calculateRVPS(
      series.totalLiquidationPreference,
      series.sharesOutstanding
    )
    lines.push(`- Class RVPS = ${DecimalHelpers.formatCurrency(rvps)} per share`)

    return lines.join('\n')
  }

  /**
   * Generate proof for voluntary conversion indifference point
   */
  static generateIndifferencePointProof(data: IndifferenceProofData): string {
    const lines: string[] = []

    lines.push(`Voluntary Conversion Indifference Point`)
    lines.push(`Step ${data.stepNumber}: ${data.targetSeries}`)
    lines.push('')

    if (data.alreadyConverted.length > 0) {
      lines.push('Prior Conversions:')
      data.alreadyConverted.forEach((series) => {
        lines.push(`- ${series}`)
      })
      lines.push(`- Total LP Waived: ${DecimalHelpers.formatCurrency(data.waivedLP)}`)
      lines.push('')
    }

    lines.push('Given:')
    lines.push(`- Target Series LP: ${DecimalHelpers.formatCurrency(data.targetLP)}`)
    lines.push(
      `- Remaining LP (after prior conversions): ${DecimalHelpers.formatCurrency(data.remainingLP)}`
    )
    lines.push(
      `- Pro-rata Percentage (after conversion): ${DecimalHelpers.formatPercentage(data.proRataPercentage.times(100), 2)}`
    )
    lines.push('')

    lines.push('Indifference Point Equation:')
    lines.push('At indifference, LP path value = Conversion path value')
    lines.push('')
    lines.push('LP Path:')
    lines.push(`- Value = ${DecimalHelpers.formatCurrency(data.targetLP)}`)
    lines.push('')
    lines.push('Conversion Path:')
    lines.push(`- Value = (Exit Value - Remaining LP) × Pro-rata %`)
    lines.push(
      `- Value = (X - ${DecimalHelpers.formatCurrency(data.remainingLP)}) × ${DecimalHelpers.formatPercentage(data.proRataPercentage.times(100), 2)}`
    )
    lines.push('')

    lines.push('Setting them equal:')
    lines.push(
      `${DecimalHelpers.formatCurrency(data.targetLP)} = (X - ${DecimalHelpers.formatCurrency(data.remainingLP)}) × ${data.proRataPercentage.toFixed(4)}`
    )
    lines.push('')

    lines.push('Solving for X:')
    const dividedLP = data.targetLP.dividedBy(data.proRataPercentage)
    lines.push(
      `${DecimalHelpers.formatCurrency(dividedLP)} = X - ${DecimalHelpers.formatCurrency(data.remainingLP)}`
    )
    lines.push(
      `X = ${DecimalHelpers.formatCurrency(dividedLP)} + ${DecimalHelpers.formatCurrency(data.remainingLP)}`
    )
    lines.push(`X = ${DecimalHelpers.formatCurrency(data.indifferencePoint)}`)
    lines.push('')

    lines.push('Conclusion:')
    lines.push(
      `${data.targetSeries} is indifferent to conversion at exit value ${DecimalHelpers.formatCurrency(data.indifferencePoint)}`
    )

    return lines.join('\n')
  }

  /**
   * Generate proof for liquidation preference breakpoint
   */
  static generateLPBreakpointProof(
    seniority: number,
    seriesNames: string[],
    lpAmount: Decimal,
    cumulativeLPBefore: Decimal,
    cumulativeLPAfter: Decimal
  ): string {
    const lines: string[] = []

    lines.push(`Liquidation Preference Breakpoint: Seniority ${seniority}`)
    lines.push('')
    lines.push('Series at this seniority:')
    seriesNames.forEach((name) => lines.push(`- ${name}`))
    lines.push('')

    lines.push('Calculation:')
    lines.push(`- LP at this seniority: ${DecimalHelpers.formatCurrency(lpAmount)}`)
    lines.push(`- Cumulative LP before: ${DecimalHelpers.formatCurrency(cumulativeLPBefore)}`)
    lines.push(`- Cumulative LP after: ${DecimalHelpers.formatCurrency(cumulativeLPAfter)}`)
    lines.push('')

    lines.push('Breakpoint Range:')
    lines.push(
      `- From: ${DecimalHelpers.formatCurrency(cumulativeLPBefore)} (LP satisfied up to prior seniority)`
    )
    lines.push(
      `- To: ${DecimalHelpers.formatCurrency(cumulativeLPAfter)} (LP satisfied including this seniority)`
    )
    lines.push('')

    lines.push('Participants in this range:')
    seriesNames.forEach((name) => lines.push(`- ${name} (receives liquidation preference)`))

    return lines.join('\n')
  }

  /**
   * Generate proof for pro-rata distribution
   */
  static generateProRataProof(
    totalLP: Decimal,
    commonShares: Decimal,
    participatingPreferredShares: Decimal,
    totalParticipatingShares: Decimal
  ): string {
    const lines: string[] = []

    lines.push('Pro-Rata Distribution Breakpoint')
    lines.push('')
    lines.push('Conditions:')
    lines.push('- All liquidation preferences satisfied')
    lines.push('- Remaining value distributed pro-rata among:')
    lines.push('  * Common stock')
    lines.push('  * Participating preferred (as-if-converted)')
    lines.push('  * Exercised options (if any)')
    lines.push('')

    lines.push('Calculation:')
    lines.push(`- Total LP Satisfied: ${DecimalHelpers.formatCurrency(totalLP)}`)
    lines.push(`- Common Shares: ${DecimalHelpers.formatNumber(commonShares)}`)
    lines.push(
      `- Participating Preferred Shares (as-if-converted): ${DecimalHelpers.formatNumber(participatingPreferredShares)}`
    )
    lines.push(
      `- Total Participating Shares: ${DecimalHelpers.formatNumber(totalParticipatingShares)}`
    )
    lines.push('')

    lines.push('Pro-Rata Start Point:')
    lines.push(`- Exit Value = ${DecimalHelpers.formatCurrency(totalLP)} (all LP satisfied)`)
    lines.push('')

    lines.push('Distribution Formula (for Exit > Total LP):')
    lines.push(
      '- Each participant receives: (Exit - Total LP) × (Participant Shares ÷ Total Shares)'
    )

    const commonPct = DecimalHelpers.toPercentage(commonShares, totalParticipatingShares)
    const participatingPct = DecimalHelpers.toPercentage(
      participatingPreferredShares,
      totalParticipatingShares
    )

    lines.push('')
    lines.push('Pro-rata percentages:')
    lines.push(`- Common: ${DecimalHelpers.formatPercentage(commonPct, 2)}`)
    lines.push(`- Participating Preferred: ${DecimalHelpers.formatPercentage(participatingPct, 2)}`)

    return lines.join('\n')
  }

  /**
   * Generate proof for option exercise breakpoint
   */
  static generateOptionExerciseProof(
    poolName: string,
    strikePrice: Decimal,
    optionShares: Decimal,
    baseTotalShares: Decimal,
    exercisePoint: Decimal,
    iterations?: number
  ): string {
    const lines: string[] = []

    lines.push('Option Exercise Breakpoint (Circular Dependency)')
    lines.push(`Pool: ${poolName}`)
    lines.push('')

    lines.push('Given:')
    lines.push(`- Strike Price: ${DecimalHelpers.formatCurrency(strikePrice)}`)
    lines.push(`- Option Shares: ${DecimalHelpers.formatNumber(optionShares)}`)
    lines.push(
      `- Base Total Shares (before exercise): ${DecimalHelpers.formatNumber(baseTotalShares)}`
    )
    lines.push('')

    lines.push('Exercise Condition:')
    lines.push('- Options exercise when Cumulative RVPS ≥ Strike Price')
    lines.push('')

    lines.push('Circular Dependency:')
    lines.push('- Cumulative RVPS = Exit Value ÷ Total Shares')
    lines.push('- Total Shares = Base Shares + Exercised Options')
    lines.push('- Exercised Options = f(Cumulative RVPS ≥ Strike)')
    lines.push('→ RVPS depends on Total Shares')
    lines.push('→ Total Shares depends on Exercise Decision')
    lines.push('→ Exercise Decision depends on RVPS')
    lines.push('→ CIRCULAR!')
    lines.push('')

    lines.push('Solution Method: Newton-Raphson Iteration')
    if (iterations !== undefined) {
      lines.push(`- Converged in ${iterations} iterations`)
    }
    lines.push('')

    lines.push('Result:')
    lines.push(`- Options exercise at Exit Value = ${DecimalHelpers.formatCurrency(exercisePoint)}`)

    const totalSharesAfter = baseTotalShares.plus(optionShares)
    const rvpsAtExercise = exercisePoint.dividedBy(totalSharesAfter)

    lines.push('')
    lines.push('Verification:')
    lines.push(`- Total Shares (after exercise) = ${DecimalHelpers.formatNumber(totalSharesAfter)}`)
    lines.push(
      `- RVPS at exercise point = ${DecimalHelpers.formatCurrency(exercisePoint)} ÷ ${DecimalHelpers.formatNumber(totalSharesAfter)}`
    )
    lines.push(`- RVPS at exercise point = ${DecimalHelpers.formatCurrency(rvpsAtExercise)}`)
    lines.push(`- RVPS ≥ Strike? ${rvpsAtExercise.gte(strikePrice) ? 'YES ✓' : 'NO ✗'}`)

    return lines.join('\n')
  }

  /**
   * Generate proof for participation cap threshold
   */
  static generateParticipationCapProof(
    seriesName: string,
    capAmount: Decimal,
    lpAmount: Decimal,
    proRataPercentage: Decimal,
    totalLP: Decimal,
    capThreshold: Decimal
  ): string {
    const lines: string[] = []

    lines.push('Participation Cap Threshold')
    lines.push(`Series: ${seriesName}`)
    lines.push('')

    lines.push('Given:')
    lines.push(`- Participation Cap: ${DecimalHelpers.formatCurrency(capAmount)}`)
    lines.push(`- Series LP: ${DecimalHelpers.formatCurrency(lpAmount)}`)
    lines.push(
      `- Pro-rata Percentage: ${DecimalHelpers.formatPercentage(proRataPercentage.times(100), 2)}`
    )
    lines.push(`- Total LP: ${DecimalHelpers.formatCurrency(totalLP)}`)
    lines.push('')

    lines.push('Cap Calculation:')
    lines.push('At cap, total value received = Cap Amount')
    lines.push('')

    lines.push('Total Value Received:')
    lines.push('- Value = LP + Pro-rata Share')
    lines.push(
      `- Value = ${DecimalHelpers.formatCurrency(lpAmount)} + (Exit - Total LP) × ${DecimalHelpers.formatPercentage(proRataPercentage.times(100), 2)}`
    )
    lines.push('')

    lines.push('Setting equal to cap:')
    lines.push(
      `${DecimalHelpers.formatCurrency(capAmount)} = ${DecimalHelpers.formatCurrency(lpAmount)} + (X - ${DecimalHelpers.formatCurrency(totalLP)}) × ${proRataPercentage.toFixed(4)}`
    )
    lines.push('')

    const capExcess = capAmount.minus(lpAmount)
    lines.push('Solving for X:')
    lines.push(
      `${DecimalHelpers.formatCurrency(capExcess)} = (X - ${DecimalHelpers.formatCurrency(totalLP)}) × ${proRataPercentage.toFixed(4)}`
    )

    const divided = capExcess.dividedBy(proRataPercentage)
    lines.push(
      `${DecimalHelpers.formatCurrency(divided)} = X - ${DecimalHelpers.formatCurrency(totalLP)}`
    )
    lines.push(
      `X = ${DecimalHelpers.formatCurrency(divided)} + ${DecimalHelpers.formatCurrency(totalLP)}`
    )
    lines.push(`X = ${DecimalHelpers.formatCurrency(capThreshold)}`)
    lines.push('')

    lines.push('Conclusion:')
    lines.push(
      `${seriesName} reaches participation cap at exit value ${DecimalHelpers.formatCurrency(capThreshold)}`
    )

    return lines.join('\n')
  }

  /**
   * Generate proof for RVPS calculation in a range
   */
  static generateRangeRVPSProof(
    rangeFrom: Decimal,
    rangeTo: Decimal | null,
    totalParticipatingShares: Decimal,
    sectionRVPS: Decimal
  ): string {
    const lines: string[] = []

    lines.push('Section RVPS Calculation')
    lines.push('')

    const rangeSize = rangeTo ? rangeTo.minus(rangeFrom) : new Decimal('Infinity')

    lines.push('Given:')
    lines.push(`- Range Start: ${DecimalHelpers.formatCurrency(rangeFrom)}`)
    lines.push(
      `- Range End: ${rangeTo ? DecimalHelpers.formatCurrency(rangeTo) : '∞ (open-ended)'}`
    )
    if (rangeTo) {
      lines.push(`- Range Size: ${DecimalHelpers.formatCurrency(rangeSize)}`)
    }
    lines.push(
      `- Total Participating Shares: ${DecimalHelpers.formatNumber(totalParticipatingShares)}`
    )
    lines.push('')

    if (rangeTo) {
      lines.push('Section RVPS Formula:')
      lines.push('- Section RVPS = Range Size ÷ Total Participating Shares')
      lines.push('')

      lines.push('Calculation:')
      lines.push(
        `- Section RVPS = ${DecimalHelpers.formatCurrency(rangeSize)} ÷ ${DecimalHelpers.formatNumber(totalParticipatingShares)}`
      )
      lines.push(`- Section RVPS = ${DecimalHelpers.formatCurrency(sectionRVPS)} per share`)
    } else {
      lines.push('Section RVPS:')
      lines.push('- This is an open-ended range')
      lines.push('- Section RVPS calculated at specific exit values')
    }

    return lines.join('\n')
  }

  /**
   * Generate proof for cumulative RVPS
   */
  static generateCumulativeRVPSProof(
    securityName: string,
    rvpsHistory: Array<{
      breakpointOrder: number
      sectionRVPS: Decimal
      cumulativeAfter: Decimal
    }>
  ): string {
    const lines: string[] = []

    lines.push('Cumulative RVPS Tracking')
    lines.push(`Security: ${securityName}`)
    lines.push('')

    lines.push('RVPS accumulates across all breakpoint ranges:')
    lines.push('')

    rvpsHistory.forEach((entry) => {
      lines.push(`Breakpoint ${entry.breakpointOrder}:`)
      lines.push(`- Section RVPS: ${DecimalHelpers.formatCurrency(entry.sectionRVPS)}`)
      lines.push(`- Cumulative RVPS: ${DecimalHelpers.formatCurrency(entry.cumulativeAfter)}`)
      lines.push('')
    })

    const finalCumulative =
      rvpsHistory.length > 0
        ? rvpsHistory[rvpsHistory.length - 1].cumulativeAfter
        : DecimalHelpers.toDecimal(0)

    lines.push('Total Cumulative RVPS:')
    lines.push(`- ${DecimalHelpers.formatCurrency(finalCumulative)} per share`)

    return lines.join('\n')
  }

  /**
   * Generate conversion order explanation
   */
  static generateConversionOrderProof(orderedClasses: ClassRVPSAnalysis[]): string {
    const lines: string[] = []

    lines.push('Voluntary Conversion Order Determination')
    lines.push('')

    lines.push('Principle:')
    lines.push('- Non-participating preferred converts from lowest to highest RVPS')
    lines.push('- Lower RVPS = Lower opportunity cost = Earlier conversion')
    lines.push('')

    lines.push('Class RVPS Analysis:')
    orderedClasses.forEach((classAnalysis, idx) => {
      lines.push(`${idx + 1}. ${classAnalysis.seriesName}`)
      lines.push(`   - Class RVPS: ${DecimalHelpers.formatCurrency(classAnalysis.classRVPS)}`)
      lines.push(`   - Preference Type: ${classAnalysis.preferenceType}`)
      if (classAnalysis.isParticipating) {
        lines.push('   - Note: Participating (never converts voluntarily)')
      }
    })

    lines.push('')
    lines.push('Conversion Sequence:')
    const nonParticipating = orderedClasses.filter((c) => !c.isParticipating)
    if (nonParticipating.length > 0) {
      nonParticipating.forEach((classAnalysis, idx) => {
        lines.push(
          `${idx + 1}. ${classAnalysis.seriesName} (RVPS: ${DecimalHelpers.formatCurrency(classAnalysis.classRVPS)})`
        )
      })
    } else {
      lines.push('- No non-participating preferred (no voluntary conversion breakpoints)')
    }

    return lines.join('\n')
  }

  /**
   * Generate summary proof for entire analysis
   */
  static generateAnalysisSummaryProof(
    totalBreakpoints: number,
    breakpointsByType: Record<string, number>,
    totalLP: Decimal,
    totalShares: Decimal
  ): string {
    const lines: string[] = []

    lines.push('Breakpoint Analysis Summary')
    lines.push('')

    lines.push('Total Breakpoints:')
    lines.push(`- ${totalBreakpoints} breakpoints identified`)
    lines.push('')

    lines.push('Breakpoints by Type:')
    Object.entries(breakpointsByType).forEach(([type, count]) => {
      lines.push(`- ${type}: ${count}`)
    })

    lines.push('')
    lines.push('Cap Table Summary:')
    lines.push(`- Total Liquidation Preference: ${DecimalHelpers.formatCurrency(totalLP)}`)
    lines.push(`- Total Fully Diluted Shares: ${DecimalHelpers.formatNumber(totalShares)}`)

    return lines.join('\n')
  }
}
