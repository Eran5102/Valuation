import Decimal from 'decimal.js';
import { 
    CapTable, 
    PreferredStock, 
    OptionPool, 
    BreakpointSpec, 
    BreakpointType,
    LiquidationRank 
} from './dataStructures';

export interface BreakpointAnalysisResult {
    breakpoints: BreakpointSpec[];
    critical_values: CriticalValue[];
    dependency_graph: DependencyMapping[];
    calculation_metadata: CalculationMetadata;
}

export interface CriticalValue {
    value: Decimal;
    description: string;
    affected_securities: string[];
    triggers: string[];
}

export interface DependencyMapping {
    breakpoint_id: string;
    depends_on: string[];
    affects: string[];
    calculation_order: number;
}

export interface CalculationMetadata {
    total_breakpoints: number;
    liquidation_preference_total: Decimal;
    participation_caps_total: Decimal;
    option_exercise_thresholds: Decimal[];
    complexity_score: number;
}

export class BreakpointAnalyzer {
    
    /**
     * Systematic analysis of all waterfall breakpoints
     */
    static analyzeBreakpoints(cap_table: CapTable, net_proceeds: Decimal): BreakpointAnalysisResult {
        const breakpoints: BreakpointSpec[] = [];
        
        // Phase 1: Liquidation Preference Breakpoints
        const lp_breakpoints = this.analyzeLiquidationPreferences(cap_table);
        breakpoints.push(...lp_breakpoints);
        
        // Sort breakpoints by exit value
        const sorted_breakpoints = breakpoints.sort((a, b) => a.exit_value.sub(b.exit_value).toNumber());
        
        // Calculate metadata
        const metadata = this.calculateMetadata(cap_table, sorted_breakpoints);
        
        return {
            breakpoints: sorted_breakpoints,
            critical_values: [],
            dependency_graph: [],
            calculation_metadata: metadata
        };
    }
    
    /**
     * Analyze liquidation preference breakpoints
     */
    private static analyzeLiquidationPreferences(cap_table: CapTable): BreakpointSpec[] {
        const breakpoints: BreakpointSpec[] = [];
        
        // Sort preferred series by seniority
        const sorted_series = [...cap_table.preferred_series].sort((a, b) => a.seniority_rank - b.seniority_rank);
        
        let cumulative_lp = new Decimal(0);
        
        sorted_series.forEach((series, index) => {
            cumulative_lp = cumulative_lp.add(series.liquidation_preference);
            
            breakpoints.push({
                breakpoint_type: BreakpointType.LIQUIDATION_PREFERENCE,
                exit_value: cumulative_lp,
                affected_securities: [series.series_name],
                calculation_method: 'cumulative_liquidation_preference',
                priority_order: index + 1,
                explanation: `Liquidation preference satisfied for ${series.series_name}`,
                mathematical_derivation: `LP: $${series.liquidation_preference.toFixed(2)}`,
                dependencies: []
            });
        });
        
        return breakpoints;
    }
    
    /**
     * Calculate analysis metadata
     */
    private static calculateMetadata(cap_table: CapTable, breakpoints: BreakpointSpec[]): CalculationMetadata {
        const liquidation_preference_total = cap_table.preferred_series.reduce(
            (sum, series) => sum.add(series.liquidation_preference),
            new Decimal(0)
        );
        
        const complexity_score = cap_table.preferred_series.length * 10 + 
                                cap_table.option_pools.length * 5;
        
        return {
            total_breakpoints: breakpoints.length,
            liquidation_preference_total,
            participation_caps_total: new Decimal(0),
            option_exercise_thresholds: [],
            complexity_score
        };
    }
}