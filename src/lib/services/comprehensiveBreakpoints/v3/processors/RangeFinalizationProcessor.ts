/**
 * Range Finalization Processor
 *
 * Post-processes breakpoints after analysis to:
 * 1. Connect ranges: Set each breakpoint's rangeTo = next breakpoint's rangeFrom
 * 2. Accumulate participants: Track cumulative participating securities
 * 3. Update shares: Recalculate totalParticipatingShares
 *
 * Ensures:
 * - Only the LAST breakpoint has rangeTo: null (infinity)
 * - Participating securities accumulate as options exercise and preferreds convert
 * - Share counts update correctly at each breakpoint
 *
 * @module RangeFinalizationProcessor
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import {
  RangeBasedBreakpoint,
  BreakpointType,
  BreakpointParticipant,
} from '../types/BreakpointTypes'
import { CapTableSnapshot } from '../types/CapTableTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * Finalization result
 */
export interface FinalizationResult {
  breakpoints: RangeBasedBreakpoint[]
  rangesConnected: number
  participantsUpdated: number
  percentagesRecalculated: number
  summary: string
}

/**
 * RangeFinalizationProcessor
 *
 * Finalizes breakpoint ranges and accumulates participants
 */
export class RangeFinalizationProcessor {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Process breakpoints
   */
  process(breakpoints: RangeBasedBreakpoint[], capTable: CapTableSnapshot): FinalizationResult {
    this.auditLogger.step('Finalizing breakpoint ranges and participants')

    if (breakpoints.length === 0) {
      return {
        breakpoints: [],
        rangesConnected: 0,
        participantsUpdated: 0,
        percentagesRecalculated: 0,
        summary: 'No breakpoints to process',
      }
    }

    // Step 1: Connect ranges
    const rangesConnected = this.connectRanges(breakpoints)

    // Step 2: Accumulate participants
    const participantsUpdated = this.accumulateParticipants(breakpoints, capTable)

    // Step 3: Recalculate participation percentages per segment
    const percentagesRecalculated = this.recalculateParticipationPercentages(breakpoints)

    const summary = `Connected ${rangesConnected} ranges, updated ${participantsUpdated} participant lists, recalculated ${percentagesRecalculated} percentages`

    this.auditLogger.info('Range Finalization', summary, {
      totalBreakpoints: breakpoints.length,
      rangesConnected,
      participantsUpdated,
      percentagesRecalculated,
    })

    // DIAGNOSTIC: Verify percentages are still correct before returning
    if (breakpoints.length >= 4) {
      console.log(
        '[RangeFinalization BEFORE RETURN] BP4 participants:',
        breakpoints[3].participants.map((p) => ({
          name: p.securityName,
          percentage: p.participationPercentage.toString(),
        }))
      )
    }

    return {
      breakpoints,
      rangesConnected,
      participantsUpdated,
      percentagesRecalculated,
      summary,
    }
  }

  /**
   * Connect ranges
   * Set each breakpoint's rangeTo = next breakpoint's rangeFrom
   * Only the LAST breakpoint should have rangeTo: null (infinity)
   */
  private connectRanges(breakpoints: RangeBasedBreakpoint[]): number {
    let connected = 0

    for (let i = 0; i < breakpoints.length - 1; i++) {
      const current = breakpoints[i]
      const next = breakpoints[i + 1]

      // Set current breakpoint's rangeTo to next breakpoint's rangeFrom
      current.rangeTo = next.rangeFrom
      current.isOpenEnded = false
      connected++

      this.auditLogger.debug(
        'Range Connection',
        `BP ${i + 1}: ${current.breakpointType} range set to [${DecimalHelpers.formatCurrency(current.rangeFrom)} → ${DecimalHelpers.formatCurrency(current.rangeTo!)}]`
      )
    }

    // Last breakpoint stays open-ended
    const lastBP = breakpoints[breakpoints.length - 1]
    lastBP.rangeTo = null
    lastBP.isOpenEnded = true

    this.auditLogger.debug(
      'Range Connection',
      `BP ${breakpoints.length}: ${lastBP.breakpointType} remains open-ended [${DecimalHelpers.formatCurrency(lastBP.rangeFrom)} → ∞]`
    )

    return connected
  }

  /**
   * Accumulate participants
   * Track cumulative participating securities as they exercise/convert
   */
  private accumulateParticipants(
    breakpoints: RangeBasedBreakpoint[],
    capTable: CapTableSnapshot
  ): number {
    let updated = 0

    // Track cumulative participants
    // Map: securityName → participant object
    const cumulativeParticipants = new Map<string, BreakpointParticipant>()

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]

      switch (bp.breakpointType) {
        case BreakpointType.LIQUIDATION_PREFERENCE:
          // LP breakpoints don't have pro-rata participants
          // Keep participants as-is (LP recipients only)
          break

        case BreakpointType.PRO_RATA_DISTRIBUTION:
          // Pro-rata starts the accumulation
          // Initialize with Common + Participating Preferred
          for (const participant of bp.participants) {
            cumulativeParticipants.set(participant.securityName, { ...participant })
          }
          updated++
          break

        case BreakpointType.OPTION_EXERCISE:
          // Add newly exercised options to the pool
          const exercisedOption = bp.participants[0] // Current breakpoint's new participant
          if (exercisedOption) {
            // Check if this option pool already exists (from earlier exercise at different strike)
            const existing = cumulativeParticipants.get(exercisedOption.securityName)
            if (existing) {
              // Accumulate shares
              existing.participatingShares = existing.participatingShares.plus(
                exercisedOption.participatingShares
              )
            } else {
              // Add new option pool
              cumulativeParticipants.set(exercisedOption.securityName, {
                ...exercisedOption,
              })
            }
          }

          // Update breakpoint with cumulative participants
          // IMPORTANT: Create deep copies to avoid shared references
          bp.participants = Array.from(cumulativeParticipants.values()).map((p) => ({ ...p }))
          bp.totalParticipatingShares = this.calculateTotalShares(bp.participants)
          updated++
          break

        case BreakpointType.VOLUNTARY_CONVERSION:
          // Add newly converted preferred to the pool
          const convertedSeries = bp.participants[0] // The series that just converted
          if (convertedSeries) {
            cumulativeParticipants.set(convertedSeries.securityName, {
              ...convertedSeries,
              participationStatus: 'converted',
            })
          }

          // Update breakpoint with cumulative participants
          // IMPORTANT: Create deep copies to avoid shared references
          bp.participants = Array.from(cumulativeParticipants.values()).map((p) => ({ ...p }))
          bp.totalParticipatingShares = this.calculateTotalShares(bp.participants)
          updated++
          break

        case BreakpointType.PARTICIPATION_CAP:
          // Remove capped series from the pool
          const cappedSeries = bp.affectedSecurities[0] // The series that hit its cap
          if (cappedSeries) {
            cumulativeParticipants.delete(cappedSeries)
          }

          // Update breakpoint with cumulative participants
          // IMPORTANT: Create deep copies to avoid shared references
          bp.participants = Array.from(cumulativeParticipants.values()).map((p) => ({ ...p }))
          bp.totalParticipatingShares = this.calculateTotalShares(bp.participants)
          updated++
          break

        default:
          break
      }

      this.auditLogger.debug(
        'Participant Accumulation',
        `BP ${i + 1} (${bp.breakpointType}): ${cumulativeParticipants.size} participants, ${DecimalHelpers.formatNumber(bp.totalParticipatingShares)} total shares`
      )
    }

    return updated
  }

  /**
   * Recalculate participation percentages per segment
   *
   * For each breakpoint, recalculate each participant's percentage as:
   * participationPercentage = participatingShares / totalParticipatingSharesInThisSegment
   *
   * ALSO recalculates rvpsAtBreakpoint and sectionValue for each participant.
   *
   * This ensures percentages sum to 100% (1.0) within each breakpoint segment.
   */
  private recalculateParticipationPercentages(breakpoints: RangeBasedBreakpoint[]): number {
    let recalculated = 0

    for (let i = 0; i < breakpoints.length; i++) {
      const bp = breakpoints[i]

      if (bp.participants.length === 0) {
        continue
      }

      // Calculate total shares in THIS breakpoint segment
      const totalSharesInSegment = this.calculateTotalShares(bp.participants)

      if (DecimalHelpers.isZero(totalSharesInSegment)) {
        this.auditLogger.warning(
          'Percentage Recalculation',
          `BP ${i + 1} (${bp.breakpointType}): Zero total shares, cannot recalculate percentages`
        )
        continue
      }

      // Calculate section RVPS for THIS breakpoint segment
      // Section RVPS = (rangeTo - rangeFrom) / totalShares
      const rangeFrom = bp.rangeFrom
      const rangeTo = bp.rangeTo || DecimalHelpers.toDecimal(0) // Will be corrected later for open-ended
      const rangeWidth = bp.rangeTo ? rangeTo.minus(rangeFrom) : DecimalHelpers.toDecimal(0)
      const sectionRVPS = DecimalHelpers.safeDivide(rangeWidth, totalSharesInSegment)

      // Update breakpoint's sectionRVPS
      bp.sectionRVPS = sectionRVPS

      // Recalculate each participant's percentage, rvpsAtBreakpoint, and sectionValue
      for (const participant of bp.participants) {
        const oldPercentage = participant.participationPercentage.toNumber()
        participant.participationPercentage = DecimalHelpers.toDecimalPercentage(
          participant.participatingShares,
          totalSharesInSegment
        )
        const newPercentage = participant.participationPercentage.toNumber()

        // Update rvpsAtBreakpoint (section RVPS for this participant in THIS segment)
        participant.rvpsAtBreakpoint = sectionRVPS

        // Update sectionValue (value received in THIS segment)
        participant.sectionValue = participant.participatingShares.times(sectionRVPS)

        console.log(
          `[RangeFinalization] BP${i + 1}: ${participant.securityName} percentage ${(oldPercentage * 100).toFixed(2)}% → ${(newPercentage * 100).toFixed(2)}%, sectionRVPS=${sectionRVPS.toFixed(4)}, sectionValue=${participant.sectionValue.toFixed(2)}`
        )
      }

      recalculated++

      // Log the recalculated percentages
      const percentageSum = DecimalHelpers.sum(
        bp.participants.map((p) => p.participationPercentage)
      )

      this.auditLogger.debug(
        'Percentage Recalculation',
        `BP ${i + 1} (${bp.breakpointType}): Recalculated ${bp.participants.length} percentages (sum: ${DecimalHelpers.formatPercentage(percentageSum)}), sectionRVPS=${DecimalHelpers.formatCurrency(sectionRVPS)}`
      )

      // Verify percentages sum to ~1.0 (100%)
      if (Math.abs(percentageSum.toNumber() - 1.0) > 0.001) {
        this.auditLogger.warning(
          'Percentage Recalculation',
          `BP ${i + 1} (${bp.breakpointType}): Percentages do not sum to 100% (sum: ${DecimalHelpers.formatPercentage(percentageSum)})`
        )
      }
    }

    return recalculated
  }

  /**
   * Calculate total participating shares
   */
  private calculateTotalShares(participants: BreakpointParticipant[]): Decimal {
    return DecimalHelpers.sum(participants.map((p) => p.participatingShares))
  }

  /**
   * Validate finalization
   */
  validate(breakpoints: RangeBasedBreakpoint[]): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (breakpoints.length === 0) {
      return { valid: true, errors: [] }
    }

    // Check that all ranges are connected except the last
    for (let i = 0; i < breakpoints.length - 1; i++) {
      const current = breakpoints[i]

      if (current.rangeTo === null) {
        errors.push(
          `Breakpoint ${i + 1} (${current.breakpointType}) should not have rangeTo: null (only last breakpoint can be open-ended)`
        )
      }

      if (current.isOpenEnded) {
        errors.push(
          `Breakpoint ${i + 1} (${current.breakpointType}) should not be open-ended (only last breakpoint can be open-ended)`
        )
      }
    }

    // Check that last breakpoint is open-ended
    const lastBP = breakpoints[breakpoints.length - 1]
    if (lastBP.rangeTo !== null) {
      errors.push(`Last breakpoint (${lastBP.breakpointType}) should have rangeTo: null (infinity)`)
    }

    if (!lastBP.isOpenEnded) {
      errors.push(`Last breakpoint (${lastBP.breakpointType}) should be marked as open-ended`)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
