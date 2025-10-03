/**
 * Cumulative RVPS Tracker
 *
 * Tracks cumulative Redemption Value Per Share (RVPS) accumulation across all breakpoint ranges.
 * Critical for option exercise logic: options exercise when cumulative RVPS ≥ strike price.
 *
 * Key Concept:
 * - Each breakpoint range contributes "section RVPS" to cumulative total
 * - Securities only accumulate RVPS in ranges where they participate
 * - Common stock accumulates RVPS starting from pro-rata distribution
 *
 * @module CumulativeRVPSTracker
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { RangeBasedBreakpoint } from '../types/BreakpointTypes'
import { SecurityRVPSHistory, RVPSHistoryEntry } from '../types/FormulaTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'
import { MathematicalProofs } from '../utilities/MathematicalProofs'

/**
 * CumulativeRVPSTracker
 *
 * Tracks RVPS accumulation for each security across breakpoints
 */
export class CumulativeRVPSTracker {
  private rvpsHistories: Map<string, SecurityRVPSHistory> = new Map()

  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Track RVPS accumulation across all breakpoints
   */
  track(breakpoints: RangeBasedBreakpoint[]): void {
    this.auditLogger.step('Tracking cumulative RVPS across breakpoints')

    // Clear previous tracking
    this.rvpsHistories.clear()

    // Process each breakpoint in order
    for (const breakpoint of breakpoints) {
      this.processBreakpoint(breakpoint)
    }

    // Log cumulative RVPS for each security
    for (const [securityName, history] of this.rvpsHistories) {
      this.auditLogger.debug(
        'RVPS Tracking',
        `${securityName}: Cumulative RVPS = ${DecimalHelpers.formatCurrency(history.cumulativeRVPS)}`,
        {
          totalValue: history.totalValue.toString(),
          breakpointsParticipated: history.breakpointsParticipated,
        }
      )

      // Log mathematical proof
      const proof = MathematicalProofs.generateCumulativeRVPSProof(
        securityName,
        history.history.map((entry) => ({
          breakpointOrder: entry.breakpointOrder,
          sectionRVPS: entry.rvpsIncrement,
          cumulativeAfter: entry.cumulativeAfter,
        }))
      )
      this.auditLogger.logMathematicalProof(`Cumulative RVPS: ${securityName}`, proof)
    }
  }

  /**
   * Process a single breakpoint
   */
  private processBreakpoint(breakpoint: RangeBasedBreakpoint): void {
    for (const participant of breakpoint.participants) {
      const securityName = participant.securityName

      // Get or create history for this security
      let history = this.rvpsHistories.get(securityName)
      if (!history) {
        history = {
          securityName,
          cumulativeRVPS: DecimalHelpers.toDecimal(0),
          history: [],
          totalValue: DecimalHelpers.toDecimal(0),
          breakpointsParticipated: 0,
        }
        this.rvpsHistories.set(securityName, history)
      }

      // Calculate RVPS increment from this breakpoint
      const rvpsIncrement = participant.rvpsAtBreakpoint

      // Calculate range size
      const rangeSize = breakpoint.isOpenEnded
        ? DecimalHelpers.toDecimal(0) // Open-ended: calculated at specific exit values
        : breakpoint.rangeTo!.minus(breakpoint.rangeFrom)

      // Update cumulative RVPS
      const newCumulativeRVPS = history.cumulativeRVPS.plus(rvpsIncrement)

      // Create history entry
      const entry: RVPSHistoryEntry = {
        breakpointOrder: breakpoint.breakpointOrder,
        breakpointType: breakpoint.breakpointType,
        rvpsIncrement,
        breakpointRange: rangeSize,
        participationPercentage: participant.participationPercentage,
        cumulativeAfter: newCumulativeRVPS,
        explanation: this.generateExplanation(
          securityName,
          breakpoint,
          participant,
          rvpsIncrement,
          newCumulativeRVPS
        ),
      }

      // Update history
      history.history.push(entry)
      history.cumulativeRVPS = newCumulativeRVPS
      history.totalValue = history.totalValue.plus(participant.sectionValue)
      history.breakpointsParticipated++

      // Log RVPS tracking
      this.auditLogger.logRVPSTracking(
        securityName,
        breakpoint.breakpointOrder,
        rvpsIncrement,
        newCumulativeRVPS
      )
    }
  }

  /**
   * Get cumulative RVPS for a specific security
   */
  getCumulativeRVPS(securityName: string): Decimal {
    const history = this.rvpsHistories.get(securityName)
    return history ? history.cumulativeRVPS : DecimalHelpers.toDecimal(0)
  }

  /**
   * Get full RVPS history for a security
   */
  getHistory(securityName: string): SecurityRVPSHistory | null {
    return this.rvpsHistories.get(securityName) || null
  }

  /**
   * Get all tracked securities
   */
  getTrackedSecurities(): string[] {
    return Array.from(this.rvpsHistories.keys())
  }

  /**
   * Check if cumulative RVPS meets or exceeds threshold
   * Used for option exercise condition
   */
  meetsThreshold(securityName: string, threshold: Decimal): boolean {
    const cumulativeRVPS = this.getCumulativeRVPS(securityName)
    return cumulativeRVPS.gte(threshold)
  }

  /**
   * Find breakpoint order where cumulative RVPS first meets threshold
   * Returns null if threshold never met
   */
  findBreakpointWhereThresholdMet(securityName: string, threshold: Decimal): number | null {
    const history = this.rvpsHistories.get(securityName)
    if (!history) return null

    for (const entry of history.history) {
      if (entry.cumulativeAfter.gte(threshold)) {
        return entry.breakpointOrder
      }
    }

    return null
  }

  /**
   * Calculate cumulative RVPS at a specific exit value
   * (for open-ended ranges or projections)
   */
  calculateCumulativeRVPSAtExit(
    securityName: string,
    exitValue: Decimal,
    breakpoints: RangeBasedBreakpoint[]
  ): Decimal {
    let cumulativeRVPS = DecimalHelpers.toDecimal(0)

    for (const breakpoint of breakpoints) {
      // Find participant for this security in this breakpoint
      const participant = breakpoint.participants.find((p) => p.securityName === securityName)

      if (!participant) {
        continue // Security doesn't participate in this range
      }

      // Determine how much of this range applies
      const rangeStart = breakpoint.rangeFrom
      const rangeEnd = breakpoint.rangeTo || exitValue // Use exit value for open-ended

      if (exitValue.lte(rangeStart)) {
        break // Haven't reached this range yet
      }

      // Calculate applicable range
      const applicableEnd = DecimalHelpers.min(exitValue, rangeEnd)
      const applicableRange = applicableEnd.minus(rangeStart)

      // Calculate RVPS from this range
      const sectionRVPS = DecimalHelpers.safeDivide(
        applicableRange,
        breakpoint.totalParticipatingShares
      )

      // Add to cumulative
      cumulativeRVPS = cumulativeRVPS.plus(sectionRVPS)

      if (exitValue.lte(rangeEnd)) {
        break // No more ranges apply
      }
    }

    return cumulativeRVPS
  }

  /**
   * Get RVPS increment from a specific breakpoint
   */
  getRVPSIncrementAtBreakpoint(securityName: string, breakpointOrder: number): Decimal {
    const history = this.rvpsHistories.get(securityName)
    if (!history) return DecimalHelpers.toDecimal(0)

    const entry = history.history.find((e) => e.breakpointOrder === breakpointOrder)
    return entry ? entry.rvpsIncrement : DecimalHelpers.toDecimal(0)
  }

  /**
   * Get cumulative RVPS up to (and including) a specific breakpoint
   */
  getCumulativeRVPSUpToBreakpoint(securityName: string, breakpointOrder: number): Decimal {
    const history = this.rvpsHistories.get(securityName)
    if (!history) return DecimalHelpers.toDecimal(0)

    const entry = history.history.find((e) => e.breakpointOrder === breakpointOrder)
    return entry ? entry.cumulativeAfter : DecimalHelpers.toDecimal(0)
  }

  /**
   * Get all securities that meet a specific RVPS threshold
   */
  getSecuritiesMeetingThreshold(threshold: Decimal): string[] {
    const securities: string[] = []

    for (const [securityName, history] of this.rvpsHistories) {
      if (history.cumulativeRVPS.gte(threshold)) {
        securities.push(securityName)
      }
    }

    return securities
  }

  /**
   * Generate explanation for RVPS history entry
   */
  private generateExplanation(
    securityName: string,
    breakpoint: RangeBasedBreakpoint,
    participant: any,
    rvpsIncrement: Decimal,
    cumulativeAfter: Decimal
  ): string {
    const parts: string[] = []

    parts.push(`Breakpoint ${breakpoint.breakpointOrder} [${breakpoint.breakpointType}]`)

    if (DecimalHelpers.isZero(rvpsIncrement)) {
      parts.push(`${securityName} does not participate in this range`)
      parts.push(`RVPS increment: $0.00`)
    } else {
      const rangeSize = breakpoint.isOpenEnded
        ? 'Open-ended'
        : DecimalHelpers.formatCurrency(breakpoint.rangeTo!.minus(breakpoint.rangeFrom))

      parts.push(`Range size: ${rangeSize}`)
      parts.push(
        `Participation %: ${DecimalHelpers.formatPercentage(participant.participationPercentage.times(100), 2)}`
      )
      parts.push(`RVPS increment: ${DecimalHelpers.formatCurrency(rvpsIncrement)}`)
    }

    parts.push(
      `Cumulative RVPS after this breakpoint: ${DecimalHelpers.formatCurrency(cumulativeAfter)}`
    )

    return parts.join('; ')
  }

  /**
   * Export RVPS history summary for all securities
   */
  exportSummary(): Array<{
    securityName: string
    cumulativeRVPS: string
    totalValue: string
    breakpointsParticipated: number
  }> {
    const summary: Array<{
      securityName: string
      cumulativeRVPS: string
      totalValue: string
      breakpointsParticipated: number
    }> = []

    for (const [securityName, history] of this.rvpsHistories) {
      summary.push({
        securityName,
        cumulativeRVPS: history.cumulativeRVPS.toString(),
        totalValue: history.totalValue.toString(),
        breakpointsParticipated: history.breakpointsParticipated,
      })
    }

    return summary.sort((a, b) => a.securityName.localeCompare(b.securityName))
  }

  /**
   * Reset tracker (clear all history)
   */
  reset(): void {
    this.rvpsHistories.clear()
  }
}
