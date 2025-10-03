/**
 * Breakpoint to Database Transformer
 *
 * Transforms breakpoint analysis results to database format for storage.
 * Creates structured JSON that can be stored in database JSONB columns.
 *
 * Database Schema (for reference):
 * ```sql
 * CREATE TABLE valuation_breakpoints (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
 *   breakpoint_type TEXT NOT NULL,
 *   breakpoint_order INT NOT NULL,
 *   range_from NUMERIC NOT NULL,
 *   range_to NUMERIC,
 *   is_open_ended BOOLEAN NOT NULL,
 *   participants JSONB NOT NULL,
 *   total_participating_shares NUMERIC NOT NULL,
 *   redemption_value_per_share NUMERIC NOT NULL,
 *   section_rvps NUMERIC NOT NULL,
 *   calculation_method TEXT NOT NULL,
 *   explanation TEXT,
 *   mathematical_derivation TEXT,
 *   dependencies JSONB,
 *   affected_securities JSONB,
 *   priority_order INT,
 *   metadata JSONB,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * ```
 *
 * @module BreakpointToDatabaseTransformer
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { RangeBasedBreakpoint, ParticipantData } from '../types/BreakpointTypes'
import { DecimalHelpers } from '../utilities/DecimalHelpers'
import { AuditTrailLogger } from '../utilities/AuditTrailLogger'

/**
 * Database breakpoint record
 */
export interface DatabaseBreakpoint {
  valuation_id: string
  breakpoint_type: string
  breakpoint_order: number
  range_from: string // Stored as string for precision
  range_to: string | null
  is_open_ended: boolean
  participants: DatabaseParticipant[]
  total_participating_shares: string
  redemption_value_per_share: string
  section_rvps: string
  calculation_method: string
  explanation: string
  mathematical_derivation: string
  dependencies: string[]
  affected_securities: string[]
  priority_order: number
  metadata: Record<string, any>
}

/**
 * Database participant record
 */
export interface DatabaseParticipant {
  security_name: string
  security_type: string
  participating_shares: string
  participation_percentage: string
  rvps_at_breakpoint: string
  cumulative_rvps: string
  section_value: string
  cumulative_value: string
  participation_status: string
  participation_notes: string
}

/**
 * Transformation result
 */
export interface DatabaseTransformationResult {
  breakpoints: DatabaseBreakpoint[]
  summary: {
    totalBreakpoints: number
    breakpointTypes: Record<string, number>
  }
  errors: string[]
}

/**
 * BreakpointToDatabaseTransformer
 *
 * Transforms breakpoints to database format
 */
export class BreakpointToDatabaseTransformer {
  constructor(private auditLogger: AuditTrailLogger) {}

  /**
   * Transform breakpoints to database format
   */
  transform(
    breakpoints: RangeBasedBreakpoint[],
    valuationId: string
  ): DatabaseTransformationResult {
    this.auditLogger.step('Transforming breakpoints to database format')

    const errors: string[] = []
    const dbBreakpoints: DatabaseBreakpoint[] = []
    const breakpointTypes: Record<string, number> = {}

    for (const bp of breakpoints) {
      try {
        const dbBp = this.transformBreakpoint(bp, valuationId)
        dbBreakpoints.push(dbBp)

        // Count by type
        breakpointTypes[bp.breakpointType] = (breakpointTypes[bp.breakpointType] || 0) + 1
      } catch (error) {
        errors.push(
          `Failed to transform breakpoint ${bp.breakpointOrder}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    this.auditLogger.info('Database Transform', 'Breakpoint transformation complete', {
      totalBreakpoints: dbBreakpoints.length,
      breakpointTypes,
      errors: errors.length,
    })

    return {
      breakpoints: dbBreakpoints,
      summary: {
        totalBreakpoints: dbBreakpoints.length,
        breakpointTypes,
      },
      errors,
    }
  }

  /**
   * Transform single breakpoint
   */
  private transformBreakpoint(bp: RangeBasedBreakpoint, valuationId: string): DatabaseBreakpoint {
    return {
      valuation_id: valuationId,
      breakpoint_type: bp.breakpointType,
      breakpoint_order: bp.breakpointOrder,
      range_from: bp.rangeFrom.toString(),
      range_to: bp.rangeTo?.toString() || null,
      is_open_ended: bp.isOpenEnded,
      participants: bp.participants.map((p) => this.transformParticipant(p)),
      total_participating_shares: bp.totalParticipatingShares.toString(),
      redemption_value_per_share: bp.redemptionValuePerShare.toString(),
      section_rvps: bp.sectionRVPS.toString(),
      calculation_method: bp.calculationMethod,
      explanation: bp.explanation,
      mathematical_derivation: bp.mathematicalDerivation,
      dependencies: bp.dependencies || [],
      affected_securities: bp.affectedSecurities || [],
      priority_order: bp.priorityOrder || 0,
      metadata: bp.metadata || {},
    }
  }

  /**
   * Transform participant
   */
  private transformParticipant(p: ParticipantData): DatabaseParticipant {
    return {
      security_name: p.securityName,
      security_type: p.securityType,
      participating_shares: p.participatingShares.toString(),
      participation_percentage: p.participationPercentage.toString(),
      rvps_at_breakpoint: p.rvpsAtBreakpoint.toString(),
      cumulative_rvps: p.cumulativeRVPS.toString(),
      section_value: p.sectionValue.toString(),
      cumulative_value: p.cumulativeValue.toString(),
      participation_status: p.participationStatus,
      participation_notes: p.participationNotes,
    }
  }

  /**
   * Create SQL INSERT statements (for reference/debugging)
   */
  generateInsertSQL(breakpoints: DatabaseBreakpoint[]): string[] {
    const statements: string[] = []

    for (const bp of breakpoints) {
      const sql = `
INSERT INTO valuation_breakpoints (
  valuation_id,
  breakpoint_type,
  breakpoint_order,
  range_from,
  range_to,
  is_open_ended,
  participants,
  total_participating_shares,
  redemption_value_per_share,
  section_rvps,
  calculation_method,
  explanation,
  mathematical_derivation,
  dependencies,
  affected_securities,
  priority_order,
  metadata
) VALUES (
  '${bp.valuation_id}',
  '${bp.breakpoint_type}',
  ${bp.breakpoint_order},
  ${bp.range_from},
  ${bp.range_to || 'NULL'},
  ${bp.is_open_ended},
  '${JSON.stringify(bp.participants)}'::jsonb,
  ${bp.total_participating_shares},
  ${bp.redemption_value_per_share},
  ${bp.section_rvps},
  '${bp.calculation_method}',
  '${bp.explanation.replace(/'/g, "''")}',
  '${bp.mathematical_derivation.replace(/'/g, "''")}',
  '${JSON.stringify(bp.dependencies)}'::jsonb,
  '${JSON.stringify(bp.affected_securities)}'::jsonb,
  ${bp.priority_order},
  '${JSON.stringify(bp.metadata)}'::jsonb
);`.trim()

      statements.push(sql)
    }

    return statements
  }

  /**
   * Create database schema migration (for reference)
   */
  static getSchemaSQL(): string {
    return `
-- Breakpoints table
CREATE TABLE IF NOT EXISTS valuation_breakpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID NOT NULL REFERENCES valuations(id) ON DELETE CASCADE,
  breakpoint_type TEXT NOT NULL,
  breakpoint_order INT NOT NULL,
  range_from NUMERIC NOT NULL,
  range_to NUMERIC,
  is_open_ended BOOLEAN NOT NULL,
  participants JSONB NOT NULL,
  total_participating_shares NUMERIC NOT NULL,
  redemption_value_per_share NUMERIC NOT NULL,
  section_rvps NUMERIC NOT NULL,
  calculation_method TEXT NOT NULL,
  explanation TEXT,
  mathematical_derivation TEXT,
  dependencies JSONB,
  affected_securities JSONB,
  priority_order INT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_breakpoints_valuation_id ON valuation_breakpoints(valuation_id);
CREATE INDEX IF NOT EXISTS idx_breakpoints_type ON valuation_breakpoints(breakpoint_type);
CREATE INDEX IF NOT EXISTS idx_breakpoints_order ON valuation_breakpoints(valuation_id, breakpoint_order);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_valuation_breakpoints_updated_at
  BEFORE UPDATE ON valuation_breakpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
    `.trim()
  }

  /**
   * Validate database breakpoints
   */
  validate(result: DatabaseTransformationResult): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = [...result.errors]

    // Check for transformation errors
    if (result.errors.length > 0) {
      return { valid: false, errors }
    }

    // Check all breakpoints have required fields
    for (const bp of result.breakpoints) {
      if (!bp.valuation_id) {
        errors.push(`Breakpoint ${bp.breakpoint_order} missing valuation_id`)
      }
      if (!bp.breakpoint_type) {
        errors.push(`Breakpoint ${bp.breakpoint_order} missing breakpoint_type`)
      }
      if (bp.participants.length === 0) {
        errors.push(`Breakpoint ${bp.breakpoint_order} has no participants`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get transformation summary
   */
  getSummary(result: DatabaseTransformationResult): string {
    const lines: string[] = []

    lines.push('Database Transformation Summary')
    lines.push('='.repeat(50))
    lines.push('')
    lines.push(`Total Breakpoints: ${result.summary.totalBreakpoints}`)
    lines.push('')
    lines.push('Breakpoint Types:')

    for (const [type, count] of Object.entries(result.summary.breakpointTypes)) {
      lines.push(`- ${type}: ${count}`)
    }

    if (result.errors.length > 0) {
      lines.push('')
      lines.push('ERRORS:')
      result.errors.forEach((err) => lines.push(`✗ ${err}`))
    }

    return lines.join('\n')
  }
}
