import Decimal from 'decimal.js';

// Set high precision for financial calculations
Decimal.set({ precision: 28 });

export enum SecurityType {
    COMMON_STOCK = "common",
    PREFERRED_STOCK = "preferred",
    OPTION = "option",
    WARRANT = "warrant",
    CONVERTIBLE_NOTE = "convertible_note"
}

export enum LiquidationRank {
    SENIOR = "senior",
    PARI_PASSU = "pari_passu", 
    SUBORDINATE = "subordinate"
}

export enum BreakpointType {
    LIQUIDATION_PREFERENCE = "liquidation_preference",
    PRO_RATA_DISTRIBUTION = "pro_rata_distribution",
    OPTION_EXERCISE = "option_exercise",
    VOLUNTARY_CONVERSION = "voluntary_conversion",
    PARTICIPATION_CAP = "participation_cap",
    POST_CAP_CONVERSION = "post_cap_conversion"
}

export interface PreferredStock {
    // Basic identifiers
    series_name: string;  // "Series A", "Series B-1"
    series_group: string; // "Series A", "Series B"
    sub_tranche?: string;
    
    // Financial terms
    shares_outstanding: Decimal;
    original_issue_price: Decimal;
    liquidation_multiple: Decimal;
    
    // Preference structure
    is_participating: boolean;
    participation_cap?: Decimal;
    participation_cap_type: string; // "multiple" or "absolute"
    
    // Seniority and ranking
    seniority_rank: number; // 1 = most senior
    liquidation_rank: LiquidationRank;
    pari_passu_group?: string;
    
    // Conversion terms
    conversion_ratio: Decimal;
    
    // Calculated properties
    liquidation_preference: Decimal;
}

export interface OptionPool {
    pool_name: string;
    total_outstanding: Decimal;
    strike_price: Decimal;
    exercisable_shares: Decimal;
    exercise_method: string; // "cash", "net", "both"
}

export interface CapTable {
    common_stock_shares: Decimal;
    preferred_series: PreferredStock[];
    option_pools: OptionPool[];
    
    // Metadata
    valuation_date: Date;
    total_authorized_shares: Decimal;
    
    // Calculated properties
    total_liquidation_preference: Decimal;
    total_preferred_shares: Decimal;
}

export interface WaterfallInput {
    cap_table: CapTable;
    gross_proceeds: Decimal;
    transaction_expenses: Decimal;
    calculation_date: Date;
    
    // Calculated property
    net_proceeds: Decimal;
}

export interface BreakpointSpec {
    breakpoint_type: BreakpointType;
    exit_value: Decimal;
    affected_securities: string[];
    calculation_method: string;
    priority_order: number;
    explanation: string;
    mathematical_derivation: string;
    dependencies: string[];
}

export interface RVPSAnalysis {
    security_name: string;
    rvps_value: Decimal;
    calculation_details: string;
    conversion_priority: number;
}

export interface ConversionDecision {
    security_name: string;
    decision: string; // "convert" or "liquidation_preference"
    conversion_breakpoint: Decimal;
    liquidation_value: Decimal;
    conversion_value: Decimal;
    mathematical_proof: string;
    confidence_score: Decimal;
}

export interface CircularResolutionResult {
    final_price_per_share: Decimal;
    exercised_options: { [key: string]: Decimal };
    iteration_count: number;
    convergence_achieved: boolean;
    mathematical_verification: string;
}

export interface WaterfallResult {
    input_parameters: WaterfallInput;
    net_proceeds: Decimal;
    breakpoint_structure: BreakpointSpec[];
    conversion_decisions: ConversionDecision[];
    final_distributions: { [key: string]: Decimal };
    circular_resolution?: CircularResolutionResult;
    calculation_audit_trail: string[];
    verification_hash: string;
    total_distributed: Decimal;
    calculation_time_ms: number;
}

// Utility functions for creating data structures
export class DataStructureFactory {
    
    static createPreferredStock(data: any): PreferredStock {
        const liquidation_preference = new Decimal(data.shares_outstanding)
            .mul(new Decimal(data.original_issue_price))
            .mul(new Decimal(data.liquidation_multiple));
            
        return {
            series_name: data.series_name,
            series_group: data.series_group || data.series_name,
            sub_tranche: data.sub_tranche,
            shares_outstanding: new Decimal(data.shares_outstanding),
            original_issue_price: new Decimal(data.original_issue_price),
            liquidation_multiple: new Decimal(data.liquidation_multiple),
            is_participating: data.is_participating,
            participation_cap: data.participation_cap ? new Decimal(data.participation_cap) : undefined,
            participation_cap_type: data.participation_cap_type || "multiple",
            seniority_rank: data.seniority_rank,
            liquidation_rank: data.liquidation_rank || LiquidationRank.SENIOR,
            pari_passu_group: data.pari_passu_group,
            conversion_ratio: new Decimal(data.conversion_ratio || 1),
            liquidation_preference
        };
    }
    
    static createOptionPool(data: any): OptionPool {
        return {
            pool_name: data.pool_name,
            total_outstanding: new Decimal(data.total_outstanding),
            strike_price: new Decimal(data.strike_price),
            exercisable_shares: new Decimal(data.exercisable_shares),
            exercise_method: data.exercise_method || "cash"
        };
    }
    
    static createCapTable(data: any): CapTable {
        const preferred_series = data.preferred_series.map((series: any) => 
            this.createPreferredStock(series)
        );
        
        const option_pools = data.option_pools.map((pool: any) => 
            this.createOptionPool(pool)
        );
        
        const total_liquidation_preference = preferred_series.reduce(
            (sum: Decimal, series: PreferredStock) => sum.add(series.liquidation_preference),
            new Decimal(0)
        );
        
        const total_preferred_shares = preferred_series.reduce(
            (sum: Decimal, series: PreferredStock) => sum.add(series.shares_outstanding),
            new Decimal(0)
        );
        
        return {
            common_stock_shares: new Decimal(data.common_stock_shares),
            preferred_series,
            option_pools,
            valuation_date: new Date(data.valuation_date || Date.now()),
            total_authorized_shares: new Decimal(data.total_authorized_shares || 0),
            total_liquidation_preference,
            total_preferred_shares
        };
    }
    
    static createWaterfallInput(data: any): WaterfallInput {
        const cap_table = this.createCapTable(data.cap_table);
        const gross_proceeds = new Decimal(data.gross_proceeds);
        const transaction_expenses = new Decimal(data.transaction_expenses);
        
        return {
            cap_table,
            gross_proceeds,
            transaction_expenses,
            calculation_date: new Date(data.calculation_date || Date.now()),
            net_proceeds: gross_proceeds.sub(transaction_expenses)
        };
    }
}