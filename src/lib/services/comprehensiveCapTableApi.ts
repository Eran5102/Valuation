// Comprehensive Cap Table API Service
// Backend service for managing comprehensive cap tables with waterfall integration

import Decimal from 'decimal.js';
import { DataStructureFactory } from './comprehensiveWaterfall/dataStructures';
import { ComprehensiveWaterfallEngine } from './comprehensiveWaterfall/comprehensiveWaterfallEngine';

// Set high precision for financial calculations
Decimal.set({ precision: 28 });

export interface ComprehensivePreferredStock {
  id?: string;
  series_name: string;
  series_group: string;
  sub_tranche?: string;
  shares_outstanding: number;
  original_issue_price: number;
  liquidation_multiple: number;
  is_participating: boolean;
  participation_cap?: number;
  participation_cap_type: 'multiple' | 'absolute';
  seniority_rank: number;
  liquidation_rank: 'senior' | 'pari_passu' | 'subordinate';
  pari_passu_group?: string;
  conversion_ratio: number;
  round_date?: string;
  amount_invested?: number;
  liquidation_preference?: number;
}

export interface ComprehensiveOptionPool {
  id?: string;
  pool_name: string;
  total_outstanding: number;
  strike_price: number;
  exercisable_shares: number;
  exercise_method: 'cash' | 'net' | 'both';
  pool_type: 'options' | 'warrants' | 'rsus';
}

export interface ComprehensiveCapTable {
  common_stock_shares: number;
  preferred_series: ComprehensivePreferredStock[];
  option_pools: ComprehensiveOptionPool[];
  valuation_date: string;
  total_authorized_shares?: number;
  total_liquidation_preference?: number;
  total_preferred_shares?: number;
  total_invested?: number;
  total_fully_diluted_shares?: number;
}

export interface ComprehensiveCapTableConfig {
  cap_table: ComprehensiveCapTable;
  company_id: number;
  valuation_id?: string;
  last_updated: string;
  version: string;
  validation_errors?: any[];
  validation_warnings?: any[];
  is_valid_for_waterfall?: boolean;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: any[];
  warnings: any[];
  waterfall_readiness_score: number;
  recommendations: string[];
}

export class ComprehensiveCapTableService {
  
  /**
   * Convert legacy cap table to comprehensive format
   */
  static convertLegacyCapTable(legacyData: any): ComprehensiveCapTable {
    const preferred_series: ComprehensivePreferredStock[] = (legacyData.shareClasses || [])
      .filter((sc: any) => sc.type === 'Preferred')
      .map((sc: any, index: number) => ({
        id: sc.id || `preferred_${index}`,
        series_name: sc.className || `Series ${String.fromCharCode(65 + index)}`,
        series_group: sc.className || `Series ${String.fromCharCode(65 + index)}`,
        shares_outstanding: sc.shares || 0,
        original_issue_price: sc.pricePerShare || 0,
        liquidation_multiple: sc.lpMultiple || 1,
        is_participating: sc.preferenceType === 'Participating' || sc.preferenceType === 'Participating with Cap',
        participation_cap: sc.participationCap,
        participation_cap_type: 'multiple' as const,
        seniority_rank: sc.seniority || (index + 1),
        liquidation_rank: 'senior' as const,
        conversion_ratio: sc.conversionRatio || 1,
        round_date: sc.roundDate,
        amount_invested: sc.amountInvested,
        liquidation_preference: sc.amountInvested * (sc.lpMultiple || 1)
      }));

    const option_pools: ComprehensiveOptionPool[] = (legacyData.options || [])
      .map((opt: any, index: number) => ({
        id: opt.id || `pool_${index}`,
        pool_name: opt.type || 'Option Pool',
        total_outstanding: opt.numOptions || 0,
        strike_price: opt.exercisePrice || 0,
        exercisable_shares: opt.numOptions || 0, // Assume all are exercisable for legacy data
        exercise_method: 'cash' as const,
        pool_type: opt.type === 'Warrants' ? 'warrants' as const : 'options' as const
      }));

    const common_stock_shares = (legacyData.shareClasses || [])
      .filter((sc: any) => sc.type === 'Common')
      .reduce((total: number, sc: any) => total + (sc.shares || 0), 0);

    return {
      common_stock_shares,
      preferred_series,
      option_pools,
      valuation_date: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Validate comprehensive cap table
   */
  static validateCapTable(capTable: ComprehensiveCapTable): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic validation
    if (capTable.common_stock_shares <= 0) {
      errors.push({
        field: 'common_stock_shares',
        message: 'Common stock shares must be greater than 0',
        severity: 'error'
      });
    }

    // Validate preferred series
    const seriesNames = capTable.preferred_series.map(s => s.series_name);
    const duplicateNames = seriesNames.filter((name, index) => seriesNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push({
        field: 'preferred_series',
        message: `Duplicate series names: ${duplicateNames.join(', ')}`,
        severity: 'error'
      });
    }

    // Validate seniority rankings
    const seniorityRanks = capTable.preferred_series.map(s => s.seniority_rank);
    const uniqueRanks = [...new Set(seniorityRanks)];
    if (uniqueRanks.length !== seniorityRanks.length) {
      errors.push({
        field: 'preferred_series',
        message: 'Duplicate seniority ranks found',
        severity: 'error'
      });
    }

    // Individual series validation
    capTable.preferred_series.forEach((series, index) => {
      if (!series.series_name?.trim()) {
        errors.push({
          field: `preferred_series[${index}].series_name`,
          message: 'Series name is required',
          severity: 'error'
        });
      }

      if (series.shares_outstanding <= 0) {
        errors.push({
          field: `preferred_series[${index}].shares_outstanding`,
          message: 'Shares outstanding must be greater than 0',
          severity: 'error'
        });
      }

      if (series.original_issue_price <= 0) {
        errors.push({
          field: `preferred_series[${index}].original_issue_price`,
          message: 'Original issue price must be greater than 0',
          severity: 'error'
        });
      }

      // Warnings for unusual terms
      if (series.liquidation_multiple > 3) {
        warnings.push({
          field: `preferred_series[${index}].liquidation_multiple`,
          message: `High liquidation multiple (${series.liquidation_multiple}x)`,
          severity: 'warning'
        });
      }
    });

    // Option pool validation
    capTable.option_pools.forEach((pool, index) => {
      if (!pool.pool_name?.trim()) {
        errors.push({
          field: `option_pools[${index}].pool_name`,
          message: 'Pool name is required',
          severity: 'error'
        });
      }

      if (pool.total_outstanding <= 0) {
        errors.push({
          field: `option_pools[${index}].total_outstanding`,
          message: 'Total outstanding must be greater than 0',
          severity: 'error'
        });
      }

      if (pool.exercisable_shares > pool.total_outstanding) {
        errors.push({
          field: `option_pools[${index}].exercisable_shares`,
          message: 'Exercisable shares cannot exceed total outstanding',
          severity: 'error'
        });
      }
    });

    // Calculate waterfall readiness score
    let waterfall_readiness_score = 100;
    waterfall_readiness_score -= errors.length * 15;
    waterfall_readiness_score -= warnings.length * 5;
    waterfall_readiness_score = Math.max(0, Math.min(100, waterfall_readiness_score));

    // Generate recommendations
    const recommendations: string[] = [];
    if (errors.length > 0) {
      recommendations.push('Fix all validation errors before running waterfall analysis');
    }
    if (capTable.preferred_series.length === 0) {
      recommendations.push('Consider adding preferred stock series for a complete cap table');
    }
    if (capTable.option_pools.length === 0) {
      recommendations.push('Consider adding option pools if employees have equity grants');
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      waterfall_readiness_score,
      recommendations
    };
  }

  /**
   * Calculate cap table metrics
   */
  static calculateMetrics(capTable: ComprehensiveCapTable) {
    const total_preferred_shares = capTable.preferred_series.reduce(
      (sum, series) => sum + series.shares_outstanding, 0
    );

    const total_liquidation_preference = capTable.preferred_series.reduce(
      (sum, series) => sum + (series.shares_outstanding * series.original_issue_price * series.liquidation_multiple), 0
    );

    const total_invested = capTable.preferred_series.reduce(
      (sum, series) => sum + (series.shares_outstanding * series.original_issue_price), 0
    );

    const total_options = capTable.option_pools.reduce(
      (sum, pool) => sum + pool.total_outstanding, 0
    );

    const total_fully_diluted_shares = capTable.common_stock_shares + total_preferred_shares + total_options;

    // Calculate ownership percentages
    const preferred_ownership_percentages: { [series_name: string]: number } = {};
    capTable.preferred_series.forEach(series => {
      const as_converted_shares = series.shares_outstanding * series.conversion_ratio;
      preferred_ownership_percentages[series.series_name] = (as_converted_shares / total_fully_diluted_shares) * 100;
    });

    const common_ownership_percentage = (capTable.common_stock_shares / total_fully_diluted_shares) * 100;

    const option_pool_percentages: { [pool_name: string]: number } = {};
    capTable.option_pools.forEach(pool => {
      option_pool_percentages[pool.pool_name] = (pool.total_outstanding / total_fully_diluted_shares) * 100;
    });

    return {
      preferred_ownership_percentages,
      common_ownership_percentage,
      option_pool_percentages,
      total_liquidation_preference,
      total_invested,
      total_shares_outstanding: capTable.common_stock_shares + total_preferred_shares,
      total_fully_diluted_shares,
      liquidation_preference_coverage: total_invested > 0 ? total_liquidation_preference / total_invested : 1,
      option_pool_size_percentage: (total_options / total_fully_diluted_shares) * 100,
      investment_concentration: this.calculateHerfindahlIndex(capTable.preferred_series)
    };
  }

  /**
   * Calculate Herfindahl index for investment concentration
   */
  private static calculateHerfindahlIndex(preferred_series: ComprehensivePreferredStock[]): number {
    const total_invested = preferred_series.reduce(
      (sum, series) => sum + (series.shares_outstanding * series.original_issue_price), 0
    );

    if (total_invested === 0) return 0;

    const market_shares = preferred_series.map(series => {
      const invested = series.shares_outstanding * series.original_issue_price;
      return invested / total_invested;
    });

    return market_shares.reduce((sum, share) => sum + (share * share), 0);
  }

  /**
   * Update cap table with calculated fields
   */
  static updateCalculations(capTable: ComprehensiveCapTable): ComprehensiveCapTable {
    const updatedCapTable = { ...capTable };

    // Update calculated fields for each preferred series
    updatedCapTable.preferred_series = capTable.preferred_series.map(series => ({
      ...series,
      amount_invested: series.shares_outstanding * series.original_issue_price,
      liquidation_preference: series.shares_outstanding * series.original_issue_price * series.liquidation_multiple
    }));

    // Calculate and update totals
    const metrics = this.calculateMetrics(updatedCapTable);
    updatedCapTable.total_liquidation_preference = metrics.total_liquidation_preference;
    updatedCapTable.total_preferred_shares = updatedCapTable.preferred_series.reduce(
      (sum, series) => sum + series.shares_outstanding, 0
    );
    updatedCapTable.total_invested = metrics.total_invested;
    updatedCapTable.total_fully_diluted_shares = metrics.total_fully_diluted_shares;
    updatedCapTable.total_authorized_shares = updatedCapTable.total_authorized_shares || metrics.total_fully_diluted_shares;

    return updatedCapTable;
  }

  /**
   * Convert comprehensive cap table to waterfall engine format
   */
  static convertToWaterfallFormat(capTable: ComprehensiveCapTable): any {
    // Ensure calculations are up to date
    const updatedCapTable = this.updateCalculations(capTable);

    return {
      cap_table: {
        common_stock_shares: updatedCapTable.common_stock_shares,
        preferred_series: updatedCapTable.preferred_series.map(series => ({
          series_name: series.series_name,
          series_group: series.series_group,
          sub_tranche: series.sub_tranche,
          shares_outstanding: series.shares_outstanding,
          original_issue_price: series.original_issue_price,
          liquidation_multiple: series.liquidation_multiple,
          is_participating: series.is_participating,
          participation_cap: series.participation_cap,
          participation_cap_type: series.participation_cap_type,
          seniority_rank: series.seniority_rank,
          liquidation_rank: series.liquidation_rank,
          pari_passu_group: series.pari_passu_group,
          conversion_ratio: series.conversion_ratio,
          liquidation_preference: series.liquidation_preference || 
            (series.shares_outstanding * series.original_issue_price * series.liquidation_multiple)
        })),
        option_pools: updatedCapTable.option_pools.map(pool => ({
          pool_name: pool.pool_name,
          total_outstanding: pool.total_outstanding,
          strike_price: pool.strike_price,
          exercisable_shares: pool.exercisable_shares,
          exercise_method: pool.exercise_method
        })),
        valuation_date: new Date(updatedCapTable.valuation_date),
        total_authorized_shares: updatedCapTable.total_authorized_shares || updatedCapTable.total_fully_diluted_shares,
        total_liquidation_preference: updatedCapTable.total_liquidation_preference,
        total_preferred_shares: updatedCapTable.total_preferred_shares
      }
    };
  }

  /**
   * Run waterfall calculation
   */
  static runWaterfallCalculation(
    capTable: ComprehensiveCapTable,
    grossProceeds: number,
    transactionExpenses: number = 0
  ): any {
    // Convert to waterfall format
    const waterfallInput = this.convertToWaterfallFormat(capTable);
    
    // Add transaction parameters
    waterfallInput.gross_proceeds = grossProceeds;
    waterfallInput.transaction_expenses = transactionExpenses;
    waterfallInput.calculation_date = new Date();

    // Run comprehensive waterfall calculation
    try {
      const result = ComprehensiveWaterfallEngine.calculateWaterfall(waterfallInput);
      return {
        success: true,
        result,
        formatted_output: ComprehensiveWaterfallEngine.formatWaterfallResult(result)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Waterfall calculation failed'
      };
    }
  }

  /**
   * Preview waterfall distribution for given exit value
   */
  static previewWaterfallDistribution(
    capTable: ComprehensiveCapTable,
    exitValue: number
  ): { [security_name: string]: number } {
    // Simplified waterfall preview calculation
    const distributions: { [security_name: string]: number } = {};
    let remaining_proceeds = exitValue;

    // Sort preferred by seniority
    const sorted_series = [...capTable.preferred_series].sort((a, b) => 
      a.seniority_rank - b.seniority_rank
    );

    // Distribute liquidation preferences first
    for (const series of sorted_series) {
      const lp = series.shares_outstanding * series.original_issue_price * series.liquidation_multiple;
      const distribution = Math.min(lp, remaining_proceeds);
      distributions[series.series_name] = distribution;
      remaining_proceeds -= distribution;

      if (remaining_proceeds <= 0) break;
    }

    // Distribute remaining proceeds pro-rata to common and participating preferred
    if (remaining_proceeds > 0) {
      let total_participating_shares = capTable.common_stock_shares;

      // Add participating preferred shares
      sorted_series.forEach(series => {
        if (series.is_participating && distributions[series.series_name] > 0) {
          total_participating_shares += series.shares_outstanding * series.conversion_ratio;
        }
      });

      if (total_participating_shares > 0) {
        const per_share_amount = remaining_proceeds / total_participating_shares;

        // Distribute to common
        distributions['Common Stock'] = per_share_amount * capTable.common_stock_shares;

        // Distribute additional participation to preferred
        sorted_series.forEach(series => {
          if (series.is_participating && distributions[series.series_name] > 0) {
            const participating_shares = series.shares_outstanding * series.conversion_ratio;
            const additional_distribution = per_share_amount * participating_shares;

            // Check participation cap
            if (series.participation_cap) {
              const lp = series.shares_outstanding * series.original_issue_price * series.liquidation_multiple;
              const max_total = series.participation_cap_type === 'multiple'
                ? lp * series.participation_cap
                : series.participation_cap;
              const current_total = distributions[series.series_name] + additional_distribution;

              if (current_total > max_total) {
                distributions[series.series_name] = max_total;
              } else {
                distributions[series.series_name] += additional_distribution;
              }
            } else {
              distributions[series.series_name] += additional_distribution;
            }
          }
        });
      }
    }

    return distributions;
  }
}