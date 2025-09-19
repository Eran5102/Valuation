import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, BarChart3, Target, RefreshCw, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';

const DataTable = dynamic(() => import('@/components/ui/optimized-data-table').then(mod => ({ default: mod.OptimizedDataTable })), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>,
  ssr: false
});
import { ColumnDef } from '@tanstack/react-table';
import { DLOMInputs, DLOMResults, ModelWeights } from '@/types';

interface DLOMModelsProps {
  assumptions?: any;
}

interface ModelData {
  id: string;
  name: string;
  description: string;
  icon: any;
  value: number;
  weight: number;
}

const DLOMModels: React.FC<DLOMModelsProps> = ({ assumptions }) => {
  // Pull values from assumptions if available - handles both array and flat object formats
  const getAssumptionValue = (categoryId: string, assumptionId: string, defaultValue: number) => {
    if (!assumptions) return defaultValue;
    
    // Handle flat object format (expected)
    if (assumptions[categoryId] && assumptions[categoryId][assumptionId] !== undefined) {
      return parseFloat(assumptions[categoryId][assumptionId]) || defaultValue;
    }
    
    // Handle array format (fallback for current data)
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
  };

  const [inputs, setInputs] = useState<DLOMInputs>({
    stockPrice: 100,
    strikePrice: 100,
    volatility: getAssumptionValue('volatility_assumptions', 'equity_volatility', 30), // Already in percentage
    riskFreeRate: getAssumptionValue('discount_rates', 'risk_free_rate', 4.5), // Already in percentage
    timeToExpiration: getAssumptionValue('volatility_assumptions', 'time_to_liquidity', 2.0),
    dividendYield: 0  // Now stored as percentage
  });

  // Update inputs when assumptions change
  useEffect(() => {
    setInputs(prev => ({
      ...prev,
      volatility: getAssumptionValue('volatility_assumptions', 'equity_volatility', 30), // Already in percentage
      riskFreeRate: getAssumptionValue('discount_rates', 'risk_free_rate', 4.5), // Already in percentage
      timeToExpiration: getAssumptionValue('volatility_assumptions', 'time_to_liquidity', 2.0)
    }));
  }, [assumptions]);

  const [results, setResults] = useState<DLOMResults>({
    chaffee: 0,
    finnerty: 0,
    ghaidarov: 0,
    longstaff: 0
  });

  const [weights, setWeights] = useState<ModelWeights>({
    chaffee: 25,
    finnerty: 25,
    ghaidarov: 25,
    longstaff: 25
  });

  // Standard normal cumulative distribution function
  const normSDist = (z: number): number => {
    const a1 = 0.31938153;
    const a2 = -0.356563782;
    const a3 = 1.781477937;
    const a4 = -1.821255978;
    const a5 = 1.330274429;
    
    const k = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
    const cnd = 1.0 - Math.exp(-z * z / 2.0) / Math.sqrt(2.0 * Math.PI) * 
                (a1 * k + a2 * k * k + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5));
    
    return z > 0 ? cnd : 1.0 - cnd;
  };

  // Chaffee Protective Put Model
  const calculateChaffee = (): number => {
    const { stockPrice: S, strikePrice: K, timeToExpiration: T } = inputs;
    // Convert percentages to decimals
    const sigma = inputs.volatility / 100;
    const r = inputs.riskFreeRate / 100;
    
    const d1 = (Math.log(S / K) + (r + Math.pow(sigma, 2) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const Nd1 = normSDist(d1);
    const Nd2 = normSDist(d2);
    const NnegD1 = normSDist(-d1);
    const NnegD2 = normSDist(-d2);
    
    const putValue = K * Math.exp(-r * T) * NnegD2 - S * NnegD1;
    const dlom = putValue / S;
    
    return dlom * 100; // Return as percentage
  };

  // Finnerty Average Strike 2012 Model
  const calculateFinnerty = (): number => {
    const { stockPrice: V0, timeToExpiration: T } = inputs;
    // Convert percentages to decimals
    const sigma = inputs.volatility / 100;
    const r = inputs.riskFreeRate / 100;
    const q = inputs.dividendYield / 100;
    
    const sigmaSquaredT = Math.pow(sigma, 2) * T;
    const expSigmaSquaredT = Math.exp(sigmaSquaredT);
    
    // Calculate v*sqrt(T) using correct Excel formula
    // Formula: √[σ²T + ln(2*(exp(σ²T) - σ²T - 1)) - 2*ln(exp(σ²T) - 1)]
    const term1 = sigmaSquaredT;
    const term2 = Math.log(2 * (expSigmaSquaredT - sigmaSquaredT - 1));
    const term3 = 2 * Math.log(expSigmaSquaredT - 1);
    const vSqrtT = Math.sqrt(term1 + term2 - term3);
    
    const C = normSDist(vSqrtT / 2);
    const D = normSDist(-vSqrtT / 2);
    
    const dlomValue = V0 * Math.exp(-q * T) * (C - D);
    const dlom = dlomValue / V0;
    
    return dlom * 100; // Return as percentage
  };

  // Ghaidarov Average Strike Model
  const calculateGhaidarov = (): number => {
    const { stockPrice: S, strikePrice: K, timeToExpiration: T } = inputs;
    // Convert percentages to decimals
    const sigma = inputs.volatility / 100;
    const r = inputs.riskFreeRate / 100;
    const q = inputs.dividendYield / 100;
    
    // Ghaidarov uses a unique formula structure
    const variance = Math.pow(sigma, 2); // σ²
    const varianceTimesT = variance * T;   // σ² * T
    
    // B33: (σ²)T = LN(2*(EXP(variance*T) - variance*T - 1)) - 2*LN(variance*T)
    const expVarianceT = Math.exp(varianceTimesT);
    const sigmaSquaredT = Math.log(2 * (expVarianceT - varianceTimesT - 1)) - 2 * Math.log(varianceTimesT);
    
    // B34: νT = SQRT((σ²)T)
    const nuT = Math.sqrt(sigmaSquaredT);
    
    // d1 = νT/2, d2 = -d1
    const d1 = nuT / 2;
    const d2 = -d1;
    
    // Put Option Value = EXP(-q*T) * S * (2*N(νT/2) - 1)
    const putValue = Math.exp(-q * T) * S * (2 * normSDist(nuT / 2) - 1);
    const dlom = putValue / S;
    
    return dlom * 100; // Return as percentage
  };

  // Longstaff Lookback Put Option Model
  const calculateLongstaff = (): number => {
    const { stockPrice: S, timeToExpiration: T } = inputs;
    // Convert percentages to decimals
    const sigma = inputs.volatility / 100;
    const r = inputs.riskFreeRate / 100;
    
    const sigmaSquaredT = Math.pow(sigma, 2) * T;
    const sqrtSigmaSquaredTOver2 = Math.sqrt(sigmaSquaredT) / 2;
    const pi = Math.PI;
    const sqrtSigmaSquaredTOver2Pi = Math.sqrt(sigmaSquaredT / (2 * pi));
    
    const NSqrtSigmaSquaredTOver2 = normSDist(sqrtSigmaSquaredTOver2);
    const expNegSigmaSquaredTOver8 = Math.exp(-sigmaSquaredT / 8);
    
    const putValue = S * (NSqrtSigmaSquaredTOver2 * expNegSigmaSquaredTOver8 - 
                         sqrtSigmaSquaredTOver2Pi * (1 - expNegSigmaSquaredTOver8));
    
    const dlom = putValue / S;
    
    return dlom * 100; // Return as percentage
  };

  // Calculate all models
  const calculateAllModels = () => {
    setResults({
      chaffee: calculateChaffee(),
      finnerty: calculateFinnerty(),
      ghaidarov: calculateGhaidarov(),
      longstaff: calculateLongstaff()
    });
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    calculateAllModels();
  }, [inputs]);

  const handleInputChange = (field: keyof DLOMInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleWeightChange = (modelId: string, newWeight: number) => {
    setWeights(prev => ({
      ...prev,
      [modelId]: newWeight
    }));
  };

  const calculateWeightedAverage = () => {
    const total = weights.chaffee + weights.finnerty + weights.ghaidarov + weights.longstaff;
    if (total === 0) return 0;
    
    return (
      (results.chaffee * weights.chaffee +
       results.finnerty * weights.finnerty +
       results.ghaidarov * weights.ghaidarov +
       results.longstaff * weights.longstaff) / total
    );
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare data for the table
  const modelTableData: ModelData[] = [
    {
      id: 'chaffee',
      name: 'Chaffee Protective Put',
      description: 'Black-Scholes protective put model for marketability discounts',
      icon: Target,
      value: results.chaffee,
      weight: weights.chaffee
    },
    {
      id: 'finnerty',
      name: 'Finnerty Average Strike 2012',
      description: 'Average strike put option model with continuous averaging',
      icon: TrendingUp,
      value: results.finnerty,
      weight: weights.finnerty
    },
    {
      id: 'ghaidarov',
      name: 'Ghaidarov Average Strike',
      description: 'Modified average strike model with enhanced volatility treatment',
      icon: BarChart3,
      value: results.ghaidarov,
      weight: weights.ghaidarov
    },
    {
      id: 'longstaff',
      name: 'Longstaff Lookback Put',
      description: 'Lookback put option model for maximum value protection',
      icon: Calculator,
      value: results.longstaff,
      weight: weights.longstaff
    }
  ];

  // Define columns for the DataTable
  const columns: ColumnDef<ModelData>[] = [
    {
      id: 'model',
      accessorKey: 'name',
      header: 'Model',
      cell: ({ row }) => {
        const Icon = row.original.icon;
        return (
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {row.original.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {row.original.description}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'dlom',
      accessorKey: 'value',
      header: 'DLOM %',
      cell: ({ row }) => (
        <div className="text-right">
          <div className="text-xl font-bold text-primary">
            {formatPercentage(row.original.value)}
          </div>
        </div>
      )
    },
    {
      id: 'weight',
      accessorKey: 'weight',
      header: 'Weight %',
      cell: ({ row }) => (
        <div className="w-24">
          <Input
            type="number"
            step="1"
            min="0"
            max="100"
            value={row.original.weight}
            onChange={(e) => handleWeightChange(row.original.id, parseFloat(e.target.value) || 0)}
            className="text-center"
          />
        </div>
      )
    },
    {
      id: 'contribution',
      header: 'Contribution',
      cell: ({ row }) => {
        const contribution = (row.original.value * row.original.weight) / 100;
        return (
          <div className="text-right">
            <div className="font-medium text-foreground">
              {formatPercentage(contribution)}
            </div>
            <div className="text-sm text-muted-foreground">
              to weighted avg
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">DLOM Models</h2>
          <p className="text-muted-foreground">
            Discount for Lack of Marketability calculation using advanced option-based models
          </p>
        </div>
        <Button onClick={calculateAllModels} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Recalculate</span>
        </Button>
      </div>

      {/* Model Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings2 className="h-5 w-5" />
            <span>Model Parameters</span>
          </CardTitle>
          <CardDescription>
            Configure pricing parameters (volatility and risk-free rate are pulled from Assumptions)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Stock Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={inputs.stockPrice}
                onChange={(e) => handleInputChange('stockPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Strike Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={inputs.strikePrice}
                onChange={(e) => handleInputChange('strikePrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Volatility (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={inputs.volatility}
                onChange={(e) => handleInputChange('volatility', e.target.value)}
                className="bg-muted/50"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">From assumptions</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Risk-Free Rate (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={inputs.riskFreeRate}
                onChange={(e) => handleInputChange('riskFreeRate', e.target.value)}
                className="bg-muted/50"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">From assumptions</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Time to Liquidity (years)
              </label>
              <Input
                type="number"
                step="0.1"
                value={inputs.timeToExpiration}
                onChange={(e) => handleInputChange('timeToExpiration', e.target.value)}
                className="bg-muted/50"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">From assumptions</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Dividend Yield (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={inputs.dividendYield}
                onChange={(e) => handleInputChange('dividendYield', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DLOM Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weighted Average - Primary Result */}
        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-primary">Weighted Average DLOM</CardTitle>
            <CardDescription>Final calculated discount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatPercentage(calculateWeightedAverage())}
            </div>
          </CardContent>
        </Card>

        {/* Simple Average */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Simple Average</CardTitle>
            <CardDescription>Unweighted average of all models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatPercentage((results.chaffee + results.finnerty + results.ghaidarov + results.longstaff) / 4)}
            </div>
          </CardContent>
        </Card>

        {/* Range */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Range</CardTitle>
            <CardDescription>Min to Max across all models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {formatPercentage(Math.min(results.chaffee, results.finnerty, results.ghaidarov, results.longstaff))} - {formatPercentage(Math.max(results.chaffee, results.finnerty, results.ghaidarov, results.longstaff))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DLOM Models Table */}
      <Card>
        <CardHeader>
          <CardTitle>DLOM Model Results</CardTitle>
          <CardDescription>
            Detailed breakdown of each model with configurable weights. Total weight: {
              (weights.chaffee + weights.finnerty + weights.ghaidarov + weights.longstaff).toFixed(0)
            }%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={modelTableData}
            enablePagination={false}
            enableColumnFilters={false}
            enableColumnVisibility={false}
            enableColumnReordering={false}
            enableColumnPinning={false}
            className="border-0"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DLOMModels;