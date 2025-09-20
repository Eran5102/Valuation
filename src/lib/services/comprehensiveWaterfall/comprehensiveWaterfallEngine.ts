import Decimal from 'decimal.js'
import { WaterfallInput, WaterfallResult, CapTable, DataStructureFactory } from './dataStructures'
import { NetProceedsCalculator } from './netProceedsCalculator'
import { BreakpointAnalyzer } from './breakpointAnalyzer'
import { RVPSEngine, RVPSCalculationResult } from './rvpsEngine'
import { CircularReferenceResolver } from './circularReferenceResolver'
import { CircularResolutionResult } from './dataStructures'
import { createHash } from 'crypto'

export class ComprehensiveWaterfallEngine {
  /**
   * Main comprehensive waterfall calculation orchestrator
   */
  static calculateWaterfall(input_data: any): WaterfallResult {
    const start_time = Date.now()
    const calculation_audit_trail: string[] = []

    try {
      // Phase 1: Data structure validation and preparation
      calculation_audit_trail.push('Phase 1: Data structure preparation')
      const waterfall_input = DataStructureFactory.createWaterfallInput(input_data)
      calculation_audit_trail.push(
        `- Cap table loaded: ${waterfall_input.cap_table.preferred_series.length} preferred series, ${waterfall_input.cap_table.option_pools.length} option pools`
      )

      // Phase 2: Net proceeds calculation and validation
      calculation_audit_trail.push('Phase 2: Net proceeds calculation')
      const net_proceeds_result = NetProceedsCalculator.calculateNetProceeds(waterfall_input)

      if (!net_proceeds_result.validation_status.is_valid) {
        throw new Error(
          `Net proceeds validation failed: ${net_proceeds_result.validation_status.errors.join(', ')}`
        )
      }

      calculation_audit_trail.push(
        `- Net proceeds: $${net_proceeds_result.net_proceeds.toFixed(2)}`
      )
      calculation_audit_trail.push(
        `- Validation: ${net_proceeds_result.validation_status.confidence_level}`
      )

      // Phase 3: Breakpoint structure analysis
      calculation_audit_trail.push('Phase 3: Breakpoint analysis')
      const breakpoint_analysis = BreakpointAnalyzer.analyzeBreakpoints(
        waterfall_input.cap_table,
        net_proceeds_result.net_proceeds
      )

      calculation_audit_trail.push(
        `- ${breakpoint_analysis.breakpoints.length} breakpoints identified`
      )
      calculation_audit_trail.push(
        `- Complexity score: ${breakpoint_analysis.calculation_metadata.complexity_score}`
      )

      // Phase 4: Circular reference resolution (if needed)
      let circular_resolution_result = undefined
      const has_circular_dependencies = this.detectCircularDependencies(waterfall_input.cap_table)

      if (has_circular_dependencies) {
        calculation_audit_trail.push('Phase 4: Circular reference resolution')
        circular_resolution_result = CircularReferenceResolver.resolveCircularReferences(
          waterfall_input.cap_table,
          net_proceeds_result.net_proceeds
        )
        calculation_audit_trail.push(
          `- Convergence achieved: ${circular_resolution_result.convergence_achieved}`
        )
        calculation_audit_trail.push(`- Iterations: ${circular_resolution_result.iteration_count}`)
        calculation_audit_trail.push(
          `- Final price per share: $${circular_resolution_result.final_price_per_share.toFixed(6)}`
        )
      } else {
        calculation_audit_trail.push('Phase 4: No circular references detected')
      }

      // Phase 5: RVPS calculation and conversion decisions
      calculation_audit_trail.push('Phase 5: RVPS analysis and conversion decisions')
      let rvps_result: RVPSCalculationResult

      try {
        rvps_result = RVPSEngine.calculateRVPS(
          waterfall_input.cap_table,
          net_proceeds_result.net_proceeds,
          breakpoint_analysis.breakpoints
        )

        if (!rvps_result) {
          throw new Error('RVPS calculation returned null/undefined result')
        }

        if (!rvps_result.conversion_decisions) {
          throw new Error('RVPS result missing conversion_decisions property')
        }

        calculation_audit_trail.push(
          `- ${rvps_result.conversion_decisions.length} conversion decisions analyzed`
        )
        calculation_audit_trail.push(
          `- ${rvps_result.sequential_conversion_order.length} securities converting to common`
        )
        calculation_audit_trail.push(
          `- Total waived liquidation preferences: $${Object.values(
            rvps_result.waived_liquidation_preferences
          )
            .reduce((sum, val) => sum.add(val), new Decimal(0))
            .toFixed(2)}`
        )
      } catch (rvps_error) {
        calculation_audit_trail.push(
          `- RVPS calculation failed: ${rvps_error instanceof Error ? rvps_error.message : 'Unknown RVPS error'}`
        )
        throw new Error(
          `RVPS calculation failed: ${rvps_error instanceof Error ? rvps_error.message : 'Unknown RVPS error'}`
        )
      }

      // Phase 6: Final distribution calculation
      calculation_audit_trail.push('Phase 6: Final distribution calculation')
      const final_distributions = this.calculateFinalDistributions(
        waterfall_input.cap_table,
        net_proceeds_result.net_proceeds,
        rvps_result,
        circular_resolution_result
      )

      const total_distributed = Object.values(final_distributions).reduce(
        (sum, amount) => sum.add(amount),
        new Decimal(0)
      )

      calculation_audit_trail.push(`- Total distributed: $${total_distributed.toFixed(2)}`)
      calculation_audit_trail.push(
        `- Distribution accuracy: ${total_distributed.div(net_proceeds_result.net_proceeds).mul(100).toFixed(4)}%`
      )

      // Phase 7: Verification and audit trail generation
      calculation_audit_trail.push('Phase 7: Verification and audit trail generation')
      const verification_hash = this.generateVerificationHash({
        input: waterfall_input,
        net_proceeds: net_proceeds_result,
        breakpoints: breakpoint_analysis,
        rvps: rvps_result,
        distributions: final_distributions,
      })

      calculation_audit_trail.push(`- Verification hash: ${verification_hash}`)

      const calculation_time_ms = Date.now() - start_time
      calculation_audit_trail.push(`- Total calculation time: ${calculation_time_ms}ms`)

      // Assemble final result
      const result: WaterfallResult = {
        input_parameters: waterfall_input,
        net_proceeds: net_proceeds_result.net_proceeds,
        breakpoint_structure: breakpoint_analysis.breakpoints,
        conversion_decisions: rvps_result.conversion_decisions,
        final_distributions,
        circular_resolution: circular_resolution_result,
        calculation_audit_trail,
        verification_hash,
        total_distributed,
        calculation_time_ms,
      }

      return result
    } catch (error) {
      calculation_audit_trail.push(
        `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw new Error(
        `Waterfall calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Calculate final distributions based on RVPS analysis
   */
  private static calculateFinalDistributions(
    cap_table: CapTable,
    net_proceeds: Decimal,
    rvps_result: RVPSCalculationResult,
    circular_resolution?: CircularResolutionResult
  ): { [security_name: string]: Decimal } {
    const distributions: { [security_name: string]: Decimal } = {}
    let remaining_proceeds = net_proceeds

    // Step 1: Distribute to securities staying preferred (liquidation preferences)
    const staying_preferred = rvps_result.conversion_decisions.filter(
      (decision) => decision.decision === 'liquidation_preference'
    )

    // Sort by liquidation priority
    const sorted_staying = staying_preferred.sort((a, b) => {
      const series_a = cap_table.preferred_series.find((s) => s.series_name === a.security_name)
      const series_b = cap_table.preferred_series.find((s) => s.series_name === b.security_name)
      return (series_a?.seniority_rank || 0) - (series_b?.seniority_rank || 0)
    })

    // Distribute liquidation preferences
    sorted_staying.forEach((decision) => {
      const distribution = Decimal.min(decision.liquidation_value, remaining_proceeds)
      distributions[decision.security_name] = distribution
      remaining_proceeds = remaining_proceeds.sub(distribution)
    })

    // Step 2: Distribute remaining proceeds to common pool (including converted securities)
    if (remaining_proceeds.gt(0)) {
      // Calculate total participating shares
      let total_common_shares = cap_table.common_stock_shares

      // Add converted preferred shares
      const converting_securities = rvps_result.conversion_decisions.filter(
        (decision) => decision.decision === 'convert'
      )

      converting_securities.forEach((decision) => {
        const series = cap_table.preferred_series.find(
          (s) => s.series_name === decision.security_name
        )
        if (series) {
          total_common_shares = total_common_shares.add(
            series.shares_outstanding.mul(series.conversion_ratio)
          )
        }
      })

      // Add participating preferred shares (those that got liquidation preference and participate)
      cap_table.preferred_series
        .filter(
          (series) =>
            series.is_participating &&
            staying_preferred.some((sp) => sp.security_name === series.series_name)
        )
        .forEach((series) => {
          total_common_shares = total_common_shares.add(
            series.shares_outstanding.mul(series.conversion_ratio)
          )
        })

      // Add exercised options if circular resolution was performed
      if (circular_resolution) {
        Object.values(circular_resolution.exercised_options).forEach((exercised) => {
          total_common_shares = total_common_shares.add(exercised)
        })
      }

      // Calculate per-share distribution
      const per_share_amount = total_common_shares.gt(0)
        ? remaining_proceeds.div(total_common_shares)
        : new Decimal(0)

      // Distribute to common stock
      const common_distribution = per_share_amount.mul(cap_table.common_stock_shares)
      distributions['Common Stock'] = common_distribution

      // Distribute to converted securities
      converting_securities.forEach((decision) => {
        const series = cap_table.preferred_series.find(
          (s) => s.series_name === decision.security_name
        )
        if (series) {
          const converted_shares = series.shares_outstanding.mul(series.conversion_ratio)
          const distribution = per_share_amount.mul(converted_shares)
          distributions[decision.security_name] = distribution
        }
      })

      // Distribute additional participation to participating preferred
      cap_table.preferred_series
        .filter(
          (series) =>
            series.is_participating &&
            staying_preferred.some((sp) => sp.security_name === series.series_name)
        )
        .forEach((series) => {
          const participating_shares = series.shares_outstanding.mul(series.conversion_ratio)
          const participation_amount = per_share_amount.mul(participating_shares)

          // Check participation cap
          if (series.participation_cap) {
            const max_total = series.participation_cap.mul(series.liquidation_preference)
            const current_total = (distributions[series.series_name] || new Decimal(0)).add(
              participation_amount
            )

            if (current_total.gt(max_total)) {
              const capped_participation = max_total.sub(
                distributions[series.series_name] || new Decimal(0)
              )
              distributions[series.series_name] = (
                distributions[series.series_name] || new Decimal(0)
              ).add(capped_participation)
            } else {
              distributions[series.series_name] = (
                distributions[series.series_name] || new Decimal(0)
              ).add(participation_amount)
            }
          } else {
            distributions[series.series_name] = (
              distributions[series.series_name] || new Decimal(0)
            ).add(participation_amount)
          }
        })

      // Distribute to exercised options
      if (circular_resolution) {
        Object.entries(circular_resolution.exercised_options).forEach(
          ([pool_name, exercised_shares]) => {
            if (exercised_shares.gt(0)) {
              const option_distribution = per_share_amount.mul(exercised_shares)
              distributions[pool_name] = option_distribution
            }
          }
        )
      }
    }

    return distributions
  }

  /**
   * Detect if cap table has circular dependencies requiring resolution
   */
  private static detectCircularDependencies(cap_table: CapTable): boolean {
    // Check for option pools that might create circular references
    const has_net_exercise_options = cap_table.option_pools.some(
      (pool) => pool.exercise_method === 'net' || pool.exercise_method === 'both'
    )

    // Check for complex conversion scenarios that might create circularity
    const has_complex_conversions = cap_table.preferred_series.some(
      (series) => series.is_participating && series.participation_cap
    )

    return has_net_exercise_options || has_complex_conversions
  }

  /**
   * Generate cryptographic hash for verification
   */
  private static generateVerificationHash(calculation_data: any): string {
    const hash_input = JSON.stringify(calculation_data, (key, value) => {
      // Convert Decimal objects to strings for consistent hashing
      if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
        return value.toFixed(10)
      }
      return value
    })

    return createHash('sha256').update(hash_input).digest('hex').substring(0, 16)
  }

  /**
   * Format comprehensive waterfall result for display
   */
  static formatWaterfallResult(result: WaterfallResult): string {
    const lines: string[] = []

    lines.push('COMPREHENSIVE WATERFALL ANALYSIS RESULTS')
    lines.push('========================================')
    lines.push('')

    // Summary
    lines.push('EXECUTIVE SUMMARY:')
    lines.push(`Net Proceeds: $${result.net_proceeds.toFixed(2)}`)
    lines.push(`Total Distributed: $${result.total_distributed.toFixed(2)}`)
    lines.push(
      `Distribution Accuracy: ${result.total_distributed.div(result.net_proceeds).mul(100).toFixed(4)}%`
    )
    lines.push(`Calculation Time: ${result.calculation_time_ms}ms`)
    lines.push(`Verification Hash: ${result.verification_hash}`)
    lines.push('')

    // Conversion Decisions
    lines.push('CONVERSION DECISIONS:')
    result.conversion_decisions.forEach((decision) => {
      lines.push(`${decision.security_name}: ${decision.decision.toUpperCase()}`)
      lines.push(`  Liquidation Value: $${decision.liquidation_value.toFixed(2)}`)
      lines.push(`  Conversion Value: $${decision.conversion_value.toFixed(2)}`)
      lines.push(`  Confidence: ${decision.confidence_score.mul(100).toFixed(1)}%`)
    })
    lines.push('')

    // Final Distributions
    lines.push('FINAL DISTRIBUTIONS:')
    Object.entries(result.final_distributions)
      .sort(([, a], [, b]) => b.sub(a).toNumber())
      .forEach(([security, amount]) => {
        const percentage = amount.div(result.total_distributed).mul(100)
        lines.push(`${security}: $${amount.toFixed(2)} (${percentage.toFixed(2)}%)`)
      })
    lines.push('')

    // Breakpoint Analysis
    lines.push(`BREAKPOINT STRUCTURE (${result.breakpoint_structure.length} breakpoints):`)
    result.breakpoint_structure.slice(0, 10).forEach((bp, index) => {
      lines.push(`${index + 1}. ${bp.breakpoint_type} at $${bp.exit_value.toFixed(2)}`)
      lines.push(`   Affected: ${bp.affected_securities.join(', ')}`)
    })

    if (result.breakpoint_structure.length > 10) {
      lines.push(`   ... and ${result.breakpoint_structure.length - 10} more breakpoints`)
    }
    lines.push('')

    // Circular Resolution (if applicable)
    if (result.circular_resolution) {
      lines.push('CIRCULAR REFERENCE RESOLUTION:')
      lines.push(
        `Convergence Achieved: ${result.circular_resolution.convergence_achieved ? 'YES' : 'NO'}`
      )
      lines.push(`Iterations: ${result.circular_resolution.iteration_count}`)
      lines.push(
        `Final Price per Share: $${result.circular_resolution.final_price_per_share.toFixed(6)}`
      )

      const exercised_options = Object.entries(result.circular_resolution.exercised_options).filter(
        ([, shares]) => shares.gt(0)
      )

      if (exercised_options.length > 0) {
        lines.push('Exercised Options:')
        exercised_options.forEach(([pool, shares]) => {
          lines.push(`  ${pool}: ${shares.toFixed(0)} shares`)
        })
      }
      lines.push('')
    }

    // Audit Trail (summary)
    lines.push('CALCULATION AUDIT TRAIL:')
    result.calculation_audit_trail.forEach((entry) => {
      lines.push(`• ${entry}`)
    })

    return lines.join('\n')
  }
}
