/**
 * Extensible Interest Rate Service
 * Supports multiple interest rate sources with unified interface
 */

import { TreasuryYieldCurveService, YieldCurveResponse } from './treasuryService';

export interface InterestRateSource {
  id: string;
  name: string;
  country: string;
  currency: string;
  description: string;
  isAvailable: boolean;
}

export interface RiskFreeRateResult {
  rate: number | null;
  source: InterestRateSource;
  maturity: string;
  valuationDate: string;
  timeToLiquidity: number;
  fetchedAt: string;
  interpolated?: boolean;
  error?: string;
  fallbackUsed?: boolean;
}

export interface RiskFreeRateRequest {
  valuationDate: string;
  timeToLiquidityYears: number;
  preferredSourceId?: string;
  countryCode?: string;
  currency?: string;
}

export class InterestRateService {
  private static readonly SOURCES: InterestRateSource[] = [
    {
      id: 'us_treasury',
      name: 'US Treasury',
      country: 'US',
      currency: 'USD',
      description: 'US Treasury daily yield curve rates',
      isAvailable: true
    },
    {
      id: 'bank_of_israel',
      name: 'Bank of Israel',
      country: 'IL',
      currency: 'ILS',
      description: 'Bank of Israel interest rates (future implementation)',
      isAvailable: false
    },
    {
      id: 'ecb',
      name: 'European Central Bank',
      country: 'EU',
      currency: 'EUR',
      description: 'ECB Euro area yield curve (future implementation)',
      isAvailable: false
    },
    {
      id: 'boe',
      name: 'Bank of England',
      country: 'UK',
      currency: 'GBP',
      description: 'Bank of England gilt yield curve (future implementation)',
      isAvailable: false
    },
    {
      id: 'manual',
      name: 'Manual Entry',
      country: 'ANY',
      currency: 'ANY',
      description: 'Manually entered risk-free rate',
      isAvailable: true
    }
  ];

  /**
   * Get all available interest rate sources
   */
  static getAvailableSources(): InterestRateSource[] {
    return this.SOURCES.filter(source => source.isAvailable);
  }

  /**
   * Get all sources (including unavailable ones for future expansion)
   */
  static getAllSources(): InterestRateSource[] {
    return [...this.SOURCES];
  }

  /**
   * Get a specific source by ID
   */
  static getSourceById(sourceId: string): InterestRateSource | null {
    return this.SOURCES.find(source => source.id === sourceId) || null;
  }

  /**
   * Get recommended source based on country/currency
   */
  static getRecommendedSource(countryCode?: string, currency?: string): InterestRateSource {
    if (countryCode) {
      const countrySource = this.SOURCES.find(
        source => source.country.toLowerCase() === countryCode.toLowerCase() && source.isAvailable
      );
      if (countrySource) return countrySource;
    }

    if (currency) {
      const currencySource = this.SOURCES.find(
        source => source.currency.toLowerCase() === currency.toLowerCase() && source.isAvailable
      );
      if (currencySource) return currencySource;
    }

    // Default to US Treasury
    return this.SOURCES.find(source => source.id === 'us_treasury')!;
  }

  /**
   * Fetch risk-free rate from the specified or recommended source
   */
  static async getRiskFreeRate(request: RiskFreeRateRequest): Promise<RiskFreeRateResult> {
    let source: InterestRateSource;
    
    if (request.preferredSourceId) {
      source = this.getSourceById(request.preferredSourceId) || this.getRecommendedSource(request.countryCode, request.currency);
    } else {
      source = this.getRecommendedSource(request.countryCode, request.currency);
    }

    // If the preferred source is not available, fall back to US Treasury
    let fallbackUsed = false;
    if (!source.isAvailable) {
      source = this.getSourceById('us_treasury')!;
      fallbackUsed = true;
    }

    try {
      let rate: number | null = null;
      let maturity = '';
      let interpolated = false;
      let error: string | undefined;

      switch (source.id) {
        case 'us_treasury':
          const treasuryResult = await TreasuryYieldCurveService.getRiskFreeRate(
            request.valuationDate,
            request.timeToLiquidityYears
          );
          rate = treasuryResult.rate;
          maturity = treasuryResult.maturity;
          interpolated = treasuryResult.interpolated || false;
          error = treasuryResult.error;
          break;

        case 'bank_of_israel':
          // Future implementation
          error = 'Bank of Israel integration not yet implemented';
          break;

        case 'ecb':
          // Future implementation
          error = 'ECB integration not yet implemented';
          break;

        case 'boe':
          // Future implementation
          error = 'Bank of England integration not yet implemented';
          break;

        case 'manual':
          // Manual entry is handled in the UI
          error = 'Manual entry should be handled in the user interface';
          break;

        default:
          error = `Unknown source: ${source.id}`;
      }

      return {
        rate,
        source,
        maturity,
        valuationDate: request.valuationDate,
        timeToLiquidity: request.timeToLiquidityYears,
        fetchedAt: new Date().toISOString(),
        interpolated,
        error,
        fallbackUsed
      };

    } catch (err) {
      return {
        rate: null,
        source,
        maturity: '',
        valuationDate: request.valuationDate,
        timeToLiquidity: request.timeToLiquidityYears,
        fetchedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        fallbackUsed
      };
    }
  }

  /**
   * Test connection to a specific source
   */
  static async testSourceConnection(sourceId: string): Promise<{ success: boolean; error?: string }> {
    const source = this.getSourceById(sourceId);
    if (!source) {
      return { success: false, error: 'Source not found' };
    }

    if (!source.isAvailable) {
      return { success: false, error: 'Source is not available' };
    }

    try {
      switch (sourceId) {
        case 'us_treasury':
          const testResult = await TreasuryYieldCurveService.fetchLatestYieldCurve();
          return { success: testResult.success, error: testResult.error };

        case 'bank_of_israel':
          return { success: false, error: 'Bank of Israel integration not yet implemented' };

        case 'ecb':
          return { success: false, error: 'ECB integration not yet implemented' };

        case 'boe':
          return { success: false, error: 'Bank of England integration not yet implemented' };

        case 'manual':
          return { success: true };

        default:
          return { success: false, error: 'Unknown source' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Get maturity options for a given source
   */
  static getMaturityOptions(sourceId: string): string[] {
    switch (sourceId) {
      case 'us_treasury':
        return ['1Mo', '2Mo', '3Mo', '4Mo', '6Mo', '1Yr', '2Yr', '3Yr', '5Yr', '7Yr', '10Yr', '20Yr', '30Yr'];
      
      case 'bank_of_israel':
        // Future implementation - BOI typical maturities
        return ['3Mo', '6Mo', '1Yr', '2Yr', '5Yr', '10Yr'];
      
      case 'ecb':
        // Future implementation - ECB typical maturities
        return ['3Mo', '6Mo', '1Yr', '2Yr', '3Yr', '5Yr', '7Yr', '10Yr', '20Yr', '30Yr'];
      
      case 'boe':
        // Future implementation - BOE typical maturities
        return ['3Mo', '6Mo', '1Yr', '2Yr', '5Yr', '10Yr', '20Yr', '30Yr'];
      
      case 'manual':
        return ['Custom'];
      
      default:
        return [];
    }
  }

  /**
   * Validate risk-free rate request
   */
  static validateRequest(request: RiskFreeRateRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.valuationDate) {
      errors.push('Valuation date is required');
    } else if (isNaN(Date.parse(request.valuationDate))) {
      errors.push('Valuation date must be a valid date');
    }

    if (request.timeToLiquidityYears === undefined || request.timeToLiquidityYears === null) {
      errors.push('Time to liquidity is required');
    } else if (request.timeToLiquidityYears <= 0) {
      errors.push('Time to liquidity must be positive');
    } else if (request.timeToLiquidityYears > 50) {
      errors.push('Time to liquidity cannot exceed 50 years');
    }

    if (request.preferredSourceId && !this.getSourceById(request.preferredSourceId)) {
      errors.push('Invalid preferred source ID');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}