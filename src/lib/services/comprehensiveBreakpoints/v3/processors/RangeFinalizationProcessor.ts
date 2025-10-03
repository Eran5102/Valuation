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
        summary: 'No breakpoints to process',
      }
    }

    // Step 1: Connect ranges
    const rangesConnected = this.connectRanges(breakpoints)

    // Step 2: Accumulate participants
    const participantsUpdated = this.accumulateParticipants(breakpoints, capTable)

    const summary = `Connected ${rangesConnected} ranges, updated ${participantsUpdated} participant lists`

    this.auditLogger.info('Range Finalization', summary, {
      totalBreakpoints: breakpoints.length,
      rangesConnected,
      participantsUpdated,
    })

    return {
      breakpoints,
      rangesConnected,
      participantsUpdated,
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
          bp.participants = Array.from(cumulativeParticipants.values())
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
          bp.participants = Array.from(cumulativeParticipants.values())
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
          bp.participants = Array.from(cumulativeParticipants.values())
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
