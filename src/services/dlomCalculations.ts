// DLOM Calculation Service
// Provides calculated DLOM values based on valuation assumptions

export interface DLOMInputs {
  stockPrice: number;
  strikePrice: number;
  volatility: number; // in percentage
  riskFreeRate: number; // in percentage
  timeToExpiration: number;
  dividendYield?: number; // in percentage
}

export interface DLOMResults {
  chaffee: number;
  finnerty: number;
  ghaidarov: number;
  longstaff: number;
}

export interface DLOMWeights {
  chaffee: number;
  finnerty: number;
  ghaidarov: number;
  longstaff: number;
}

export class DLOMCalculationService {
  // Standard normal cumulative distribution function
  private normSDist(z: number): number {
    const a1 = 0.31938153;
    const a2 = -0.356563782;
    const a3 = 1.781477937;
    const a4 = -1.821255978;
    const a5 = 1.330274429;

    const k = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
    const cnd = 1.0 - Math.exp(-z * z / 2.0) / Math.sqrt(2.0 * Math.PI) *
                (a1 * k + a2 * k * k + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5));

    return z > 0 ? cnd : 1.0 - cnd;
  }

  // Chaffee Protective Put Model
  private calculateChaffee(inputs: DLOMInputs): number {
    const { stockPrice: S, strikePrice: K, timeToExpiration: T } = inputs;
    // Convert percentages to decimals
    const sigma = inputs.volatility / 100;
    const r = inputs.riskFreeRate / 100;
    const q = (inputs.dividendYield || 0) / 100;

    if (T <= 0 || sigma <= 0) return 0;

    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const putPrice = K * Math.exp(-r * T) * this.normSDist(-d2) - S * Math.exp(-q * T) * this.normSDist(-d1);
    const dlom = (putPrice / S) * 100;

    return Math.max(0, Math.min(100, dlom));
  }

  // Finnerty Average Strike Put Model
  private calculateFinnerty(inputs: DLOMInputs): number {
    const { stockPrice: S, timeToExpiration: T } = inputs;
    const sigma = inputs.volatility / 100;
    const r = inputs.riskFreeRate / 100;
    const q = (inputs.dividendYield || 0) / 100;

    if (T <= 0 || sigma <= 0) return 0;

    // Average strike price assumption (typically 90-95% of current price)
    const avgStrike = S * 0.92;

    const d1 = (Math.log(S / avgStrike) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const putPrice = avgStrike * Math.exp(-r * T) * this.normSDist(-d2) - S * Math.exp(-q * T) * this.normSDist(-d1);
    const dlom = (putPrice / S) * 100;

    return Math.max(0, Math.min(100, dlom));
  }

  // Ghaidarov Model (simplified approximation)
  private calculateGhaidarov(inputs: DLOMInputs): number {
    const { timeToExpiration: T } = inputs;
    const sigma = inputs.volatility / 100;

    if (T <= 0 || sigma <= 0) return 0;

    // Ghaidarov approximation based on volatility and time
    const dlom = sigma * Math.sqrt(T) * 25 + Math.log(T + 1) * 8;

    return Math.max(0, Math.min(100, dlom));
  }

  // Longstaff Model (simplified approximation)
  private calculateLongstaff(inputs: DLOMInputs): number {
    const { timeToExpiration: T } = inputs;
    const sigma = inputs.volatility / 100;
    const r = inputs.riskFreeRate / 100;

    if (T <= 0 || sigma <= 0) return 0;

    // Longstaff approximation
    const dlom = (sigma * Math.sqrt(T) * 20) + (r * T * 5) + Math.min(T * 3, 15);

    return Math.max(0, Math.min(100, dlom));
  }

  // Calculate all DLOM models
  public calculateAllModels(inputs: DLOMInputs): DLOMResults {
    return {
      chaffee: this.calculateChaffee(inputs),
      finnerty: this.calculateFinnerty(inputs),
      ghaidarov: this.calculateGhaidarov(inputs),
      longstaff: this.calculateLongstaff(inputs)
    };
  }

  // Calculate weighted average DLOM
  public calculateWeightedDLOM(
    inputs: DLOMInputs,
    weights: DLOMWeights = { chaffee: 25, finnerty: 25, ghaidarov: 25, longstaff: 25 }
  ): number {
    const results = this.calculateAllModels(inputs);
    const totalWeight = weights.chaffee + weights.finnerty + weights.ghaidarov + weights.longstaff;

    if (totalWeight === 0) return 0;

    const weightedSum =
      (results.chaffee * weights.chaffee) +
      (results.finnerty * weights.finnerty) +
      (results.ghaidarov * weights.ghaidarov) +
      (results.longstaff * weights.longstaff);

    return weightedSum / totalWeight;
  }

  // Get default DLOM calculation from valuation assumptions
  public getDLOMFromAssumptions(assumptions: any): {
    dlomPercentage: number;
    modelResults: DLOMResults;
    weights: DLOMWeights;
  } {
    // Extract inputs from assumptions
    const inputs: DLOMInputs = {
      stockPrice: 100, // Normalized to 100
      strikePrice: 100, // At-the-money
      volatility: this.getAssumptionValue(assumptions, 'volatility_assumptions', 'equity_volatility', 60),
      riskFreeRate: this.getAssumptionValue(assumptions, 'discount_rates', 'risk_free_rate', 4.5),
      timeToExpiration: this.getAssumptionValue(assumptions, 'volatility_assumptions', 'time_to_liquidity', 3),
      dividendYield: 0
    };

    // Use default equal weights
    const weights: DLOMWeights = {
      chaffee: 25,
      finnerty: 25,
      ghaidarov: 25,
      longstaff: 25
    };

    const modelResults = this.calculateAllModels(inputs);
    const dlomPercentage = this.calculateWeightedDLOM(inputs, weights);

    return {
      dlomPercentage,
      modelResults,
      weights
    };
  }

  // Helper method to extract assumption values
  private getAssumptionValue(assumptions: any, categoryId: string, assumptionId: string, defaultValue: number): number {
    if (!assumptions) return defaultValue;

    // Handle flat object format
    if (assumptions[categoryId] && assumptions[categoryId][assumptionId] !== undefined) {
      return parseFloat(assumptions[categoryId][assumptionId]) || defaultValue;
    }

    // Handle array format (fallback)
    if (Array.isArray(assumptions)) {
      const category = assumptions.find((cat: any) => cat.id === categoryId);
      if (category && category.assumptions) {
        const assumption = category.assumptions.find((ass: any) => ass.id === assumptionId);
        if (assumption && assumption.value) {
          return parseFloat(assumption.value) || defaultValue;
        }
      }
    }

    return defaultValue;
  }
}

// Export singleton instance
export const dlomCalculationService = new DLOMCalculationService();