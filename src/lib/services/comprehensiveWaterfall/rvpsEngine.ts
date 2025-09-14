import Decimal from 'decimal.js';
import { CapTable, ConversionDecision, RVPSAnalysis, BreakpointSpec } from './dataStructures';

export interface RVPSCalculationResult {
    conversion_decisions: ConversionDecision[];
    rvps_analysis: RVPSAnalysis[];
    sequential_conversion_order: string[];
    waived_liquidation_preferences: { [security_name: string]: Decimal };
    total_conversion_impact: Decimal;
    calculation_confidence: Decimal;
}

export class RVPSEngine {
    
    /**
     * Calculate RVPS (Residual Value Per Share) for all securities
     */
    static calculateRVPS(
        cap_table: CapTable,
        net_proceeds: Decimal,
        breakpoints: BreakpointSpec[]
    ): RVPSCalculationResult {
        
        const conversion_decisions: ConversionDecision[] = [];
        const rvps_analysis: RVPSAnalysis[] = [];
        const waived_liquidation_preferences: { [security_name: string]: Decimal } = {};
        
        // Calculate conversion decisions for each preferred series
        cap_table.preferred_series.forEach(series => {
            const liquidation_value = series.liquidation_preference;
            
            // Simplified conversion value calculation
            const total_shares = cap_table.common_stock_shares.add(
                cap_table.preferred_series.reduce((sum, s) => 
                    sum.add(s.shares_outstanding.mul(s.conversion_ratio)), new Decimal(0))
            );
            
            const per_share_value = total_shares.gt(0) ? net_proceeds.div(total_shares) : new Decimal(0);
            const conversion_value = series.shares_outstanding.mul(series.conversion_ratio).mul(per_share_value);
            
            const decision = liquidation_value.gt(conversion_value) ? "liquidation_preference" : "convert";
            const confidence_score = new Decimal(0.85); // Simplified confidence
            
            conversion_decisions.push({
                security_name: series.series_name,
                decision,
                conversion_breakpoint: liquidation_value.gt(0) ? 
                    liquidation_value.div(series.shares_outstanding.mul(series.conversion_ratio)) : new Decimal(0),
                liquidation_value,
                conversion_value,
                mathematical_proof: `LP: $${liquidation_value.toFixed(2)}, Conv: $${conversion_value.toFixed(2)}`,
                confidence_score
            });
            
            // Track waived liquidation preferences
            if (decision === "convert") {
                waived_liquidation_preferences[series.series_name] = liquidation_value;
            }
            
            // RVPS analysis
            const optimal_value = Decimal.max(liquidation_value, conversion_value);
            const rvps_value = series.shares_outstanding.gt(0) ? 
                optimal_value.div(series.shares_outstanding) : new Decimal(0);
            
            rvps_analysis.push({
                security_name: series.series_name,
                rvps_value,
                calculation_details: `Optimal value: $${optimal_value.toFixed(2)} / ${series.shares_outstanding} shares`,
                conversion_priority: series.seniority_rank
            });
        });
        
        // Sequential conversion order
        const sequential_conversion_order = conversion_decisions
            .filter(d => d.decision === "convert")
            .sort((a, b) => a.conversion_breakpoint.sub(b.conversion_breakpoint).toNumber())
            .map(d => d.security_name);
        
        const total_conversion_impact = Object.values(waived_liquidation_preferences)
            .reduce((sum, val) => sum.add(val), new Decimal(0));
        
        return {
            conversion_decisions,
            rvps_analysis,
            sequential_conversion_order,
            waived_liquidation_preferences,
            total_conversion_impact,
            calculation_confidence: new Decimal(0.85)
        };
    }
}