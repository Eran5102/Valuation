import React, { useState, useEffect } from 'react';
import {
  Settings,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  Activity,
  Building2,
  Clock
} from 'lucide-react';
import { FinancialAssumption } from '@/types';
import { AssumptionCategory as AssumptionCategoryComponent } from './AssumptionCategory';
import { AssumptionsSummary } from './AssumptionsSummary';

export interface AssumptionCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  assumptions: Assumption[];
}

export interface Assumption {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  type: 'number' | 'percentage' | 'currency' | 'text' | 'date' | 'select';
  options?: string[];
  description?: string;
  required?: boolean;
  category?: string;
}

const defaultAssumptionCategories: AssumptionCategory[] = [
  {
    id: 'general',
    name: 'General Information',
    icon: Settings,
    assumptions: [
      { id: 'company_name', name: 'Company Name', value: '', type: 'text', required: true },
      { id: 'valuation_date', name: 'Valuation Date', value: '', type: 'date', required: true },
      { id: 'fiscal_year_end', name: 'Fiscal Year End', value: '12/31', type: 'text' },
      { id: 'industry', name: 'Industry', value: '', type: 'select', options: ['Technology', 'Healthcare', 'Financial Services', 'Consumer', 'Industrial'] },
      { id: 'stage', name: 'Company Stage', value: '', type: 'select', options: ['Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Pre-IPO'] },
      { id: 'years_in_operation', name: 'Years in Operation', value: '', type: 'number' },
    ]
  },
  {
    id: 'financial_metrics',
    name: 'Financial Metrics',
    icon: DollarSign,
    assumptions: [
      { id: 'revenue_current', name: 'Current Year Revenue', value: '', type: 'currency', required: true },
      { id: 'revenue_prior', name: 'Prior Year Revenue', value: '', type: 'currency' },
      { id: 'ebitda_current', name: 'Current EBITDA', value: '', type: 'currency' },
      { id: 'burn_rate', name: 'Monthly Burn Rate', value: '', type: 'currency' },
      { id: 'cash_balance', name: 'Cash Balance', value: '', type: 'currency' },
      { id: 'debt_outstanding', name: 'Total Debt Outstanding', value: '', type: 'currency' },
      { id: 'runway_months', name: 'Cash Runway (Months)', value: '', type: 'number' },
    ]
  },
  {
    id: 'growth_assumptions',
    name: 'Growth Assumptions',
    icon: TrendingUp,
    assumptions: [
      { id: 'revenue_growth_y1', name: 'Year 1 Revenue Growth', value: '25', type: 'percentage', required: true },
      { id: 'revenue_growth_y2', name: 'Year 2 Revenue Growth', value: '20', type: 'percentage', required: true },
      { id: 'revenue_growth_y3', name: 'Year 3 Revenue Growth', value: '15', type: 'percentage', required: true },
      { id: 'revenue_growth_y4', name: 'Year 4 Revenue Growth', value: '12', type: 'percentage' },
      { id: 'revenue_growth_y5', name: 'Year 5 Revenue Growth', value: '10', type: 'percentage' },
      { id: 'terminal_growth_rate', name: 'Terminal Growth Rate', value: '2.5', type: 'percentage', required: true },
      { id: 'target_ebitda_margin', name: 'Target EBITDA Margin', value: '15', type: 'percentage' },
    ]
  },
  {
    id: 'discount_rates',
    name: 'Discount Rates',
    icon: Percent,
    assumptions: [
      { id: 'wacc', name: 'Weighted Average Cost of Capital (WACC)', value: '12', type: 'percentage', required: true },
      { id: 'cost_of_equity', name: 'Cost of Equity', value: '15', type: 'percentage' },
      { id: 'cost_of_debt', name: 'Cost of Debt', value: '6', type: 'percentage' },
      { id: 'tax_rate', name: 'Tax Rate', value: '21', type: 'percentage', required: true },
      { id: 'risk_free_rate', name: 'Risk-Free Rate', value: '4.5', type: 'percentage', required: true },
      { id: 'market_risk_premium', name: 'Market Risk Premium', value: '7', type: 'percentage' },
      { id: 'size_premium', name: 'Size Premium', value: '3', type: 'percentage' },
      { id: 'company_specific_premium', name: 'Company-Specific Risk Premium', value: '2', type: 'percentage' },
    ]
  },
  {
    id: 'volatility_assumptions',
    name: 'Volatility & Option Pricing',
    icon: Activity,
    assumptions: [
      { id: 'equity_volatility', name: 'Equity Volatility', value: '60', type: 'percentage', required: true },
      { id: 'asset_volatility', name: 'Asset Volatility', value: '45', type: 'percentage' },
      { id: 'time_to_liquidity', name: 'Expected Time to Liquidity (Years)', value: '3', type: 'number', required: true },
      { id: 'probability_ipo', name: 'Probability of IPO', value: '10', type: 'percentage' },
      { id: 'probability_ma', name: 'Probability of M&A', value: '30', type: 'percentage' },
      { id: 'probability_dissolution', name: 'Probability of Dissolution', value: '5', type: 'percentage' },
    ]
  },
  {
    id: 'market_approach',
    name: 'Market Approach',
    icon: Building2,
    assumptions: [
      { id: 'revenue_multiple', name: 'Revenue Multiple (EV/Revenue)', value: '3.5', type: 'number' },
      { id: 'ebitda_multiple', name: 'EBITDA Multiple (EV/EBITDA)', value: '12', type: 'number' },
      { id: 'ps_ratio', name: 'Price-to-Sales Ratio', value: '4', type: 'number' },
      { id: 'market_approach_weight', name: 'Market Approach Weight', value: '30', type: 'percentage' },
      { id: 'income_approach_weight', name: 'Income Approach Weight', value: '70', type: 'percentage' },
    ]
  },
  {
    id: 'backsolve',
    name: 'Backsolve / Recent Transaction',
    icon: Clock,
    assumptions: [
      { id: 'last_round_date', name: 'Last Funding Round Date', value: '', type: 'date' },
      { id: 'last_round_amount', name: 'Last Round Amount Raised', value: '', type: 'currency' },
      { id: 'last_round_premoney', name: 'Last Round Pre-Money Valuation', value: '', type: 'currency' },
      { id: 'last_round_price', name: 'Last Round Price per Share', value: '', type: 'currency' },
      { id: 'backsolve_volatility', name: 'Implied Volatility from Backsolve', value: '55', type: 'percentage' },
    ]
  },
];

interface ValuationAssumptionsProps {
  valuationId: string;
  initialCategories?: AssumptionCategory[];
  onSave?: (categories: AssumptionCategory[]) => void;
}

export default function ValuationAssumptions({ 
  valuationId, 
  initialCategories = defaultAssumptionCategories,
  onSave 
}: ValuationAssumptionsProps) {
  const [categories, setCategories] = useState<AssumptionCategory[]>(initialCategories);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['general', 'financial_metrics']);

  // Update categories when initialCategories change
  useEffect(() => {
    if (initialCategories !== defaultAssumptionCategories) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  const handleAssumptionChange = (categoryId: string, assumptionId: string, value: string | number) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          assumptions: cat.assumptions.map(assumption =>
            assumption.id === assumptionId
              ? { ...assumption, value }
              : assumption
          )
        };
      }
      return cat;
    });

    setCategories(updatedCategories);

    // Auto-save changes to parent component
    if (onSave) {
      onSave(updatedCategories);
    }
  };

  const getAssumptionValue = (assumptionId: string): string | number => {
    for (const category of categories) {
      const assumption = category.assumptions.find(a => a.id === assumptionId);
      if (assumption) {
        return assumption.value;
      }
    }
    return '';
  };


  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Valuation Assumptions</h2>
          <p className="text-muted-foreground">Configure all assumptions for your 409A valuation model (auto-saved)</p>
        </div>
      </div>

      {/* Assumption Categories */}
      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          
          return (
            <AssumptionCategoryComponent
              key={category.id}
              category={category}
              isExpanded={isExpanded}
              onToggle={toggleCategory}
              onAssumptionChange={handleAssumptionChange}
              onGetAssumptionValue={getAssumptionValue}
            />
          );
        })}
      </div>

      {/* Summary Stats */}
      <AssumptionsSummary categories={categories} />
    </div>
  );
}