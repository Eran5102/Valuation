import React, { useState, useEffect } from 'react';
import {
  Settings,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  Activity,
  Building2,
  Clock,
  UserCheck,
  FileText,
  Calculator,
  Share2,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { FinancialAssumption } from '@/types';
import { AssumptionCategory as AssumptionCategoryComponent } from './AssumptionCategory';
import { AssumptionsSummary } from './AssumptionsSummary';

export interface AssumptionCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  assumptions: Assumption[];
  priority?: number; // For ordering categories
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
    id: 'company',
    name: 'Company Information',
    icon: Building2,
    priority: 1,
    assumptions: [
      { id: 'company_name', name: 'Company Name', value: '', type: 'text' },
      { id: 'company_address', name: 'Company Address', value: '', type: 'text' },
      { id: 'company_ein', name: 'EIN (Tax ID)', value: '', type: 'text' },
      { id: 'company_state', name: 'State of Incorporation', value: '', type: 'select',
        options: ['Delaware', 'California', 'New York', 'Texas', 'Nevada', 'Wyoming', 'Other'] },
      { id: 'company_incorporation_date', name: 'Date of Incorporation', value: '', type: 'date' },
      { id: 'fiscal_year_end', name: 'Fiscal Year End', value: '12/31', type: 'text' },
      { id: 'industry', name: 'Industry', value: '', type: 'select',
        options: ['Technology', 'Healthcare', 'Financial Services', 'Consumer', 'Industrial', 'Energy', 'Real Estate', 'Other'] },
      { id: 'stage', name: 'Company Stage', value: '', type: 'select',
        options: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Pre-IPO'] },
      { id: 'company_employees', name: 'Number of Employees', value: '', type: 'number' },
      { id: 'years_in_operation', name: 'Years in Operation', value: '', type: 'number' },
      { id: 'company_website', name: 'Website', value: '', type: 'text' },
    ]
  },
  {
    id: 'valuation_details',
    name: 'Valuation Details',
    icon: FileText,
    priority: 2,
    assumptions: [
      { id: 'valuation_date', name: 'Valuation Date', value: '', type: 'date' },
      { id: 'report_date', name: 'Report Date', value: '', type: 'date' },
      { id: 'valuation_purpose', name: 'Valuation Purpose', value: 'Section 409A of the Internal Revenue Code', type: 'text' },
      { id: 'standard_of_value', name: 'Standard of Value', value: 'Fair Market Value', type: 'select',
        options: ['Fair Market Value', 'Fair Value', 'Investment Value', 'Intrinsic Value'] },
      { id: 'premise_of_value', name: 'Premise of Value', value: 'Going Concern', type: 'select',
        options: ['Going Concern', 'Liquidation', 'Orderly Liquidation', 'Forced Liquidation'] },
      { id: 'valuation_approach', name: 'Primary Valuation Approach', value: '', type: 'select',
        options: ['Income Approach', 'Market Approach', 'Asset Approach', 'Option Pricing Model', 'Probability-Weighted Expected Return Method'] },
    ]
  },
  {
    id: 'appraiser',
    name: 'Appraiser Information',
    icon: UserCheck,
    priority: 3,
    assumptions: [
      { id: 'appraiser_name', name: 'Appraiser Name', value: '', type: 'text' },
      { id: 'appraiser_firm', name: 'Appraiser Firm', value: '', type: 'text' },
      { id: 'appraiser_credentials', name: 'Credentials (ASA, CFA, etc.)', value: '', type: 'text' },
      { id: 'appraiser_address', name: 'Firm Address', value: '', type: 'text' },
      { id: 'appraiser_phone', name: 'Contact Phone', value: '', type: 'text' },
      { id: 'appraiser_email', name: 'Contact Email', value: '', type: 'text' },
      { id: 'engagement_date', name: 'Engagement Date', value: '', type: 'date' },
    ]
  },
  {
    id: 'financial_metrics',
    name: 'Financial Performance',
    icon: DollarSign,
    priority: 4,
    assumptions: [
      { id: 'revenue_current', name: 'Current Year Revenue', value: '', type: 'currency' },
      { id: 'revenue_prior', name: 'Prior Year Revenue', value: '', type: 'currency' },
      { id: 'revenue_two_years_prior', name: '2 Years Prior Revenue', value: '', type: 'currency' },
      { id: 'gross_profit_current', name: 'Current Gross Profit', value: '', type: 'currency' },
      { id: 'gross_margin', name: 'Gross Margin %', value: '', type: 'percentage' },
      { id: 'ebitda_current', name: 'Current EBITDA', value: '', type: 'currency' },
      { id: 'operating_margin', name: 'Operating Margin %', value: '', type: 'percentage' },
      { id: 'net_income_current', name: 'Current Net Income', value: '', type: 'currency' },
      { id: 'burn_rate', name: 'Monthly Burn Rate', value: '', type: 'currency' },
      { id: 'cash_balance', name: 'Cash Balance', value: '', type: 'currency' },
      { id: 'ar_balance', name: 'Accounts Receivable', value: '', type: 'currency' },
      { id: 'total_assets', name: 'Total Assets', value: '', type: 'currency' },
      { id: 'total_liabilities', name: 'Total Liabilities', value: '', type: 'currency' },
      { id: 'debt_outstanding', name: 'Total Debt Outstanding', value: '', type: 'currency' },
      { id: 'runway_months', name: 'Cash Runway (Months)', value: '', type: 'number' },
    ]
  },
  {
    id: 'funding',
    name: 'Funding & Investment',
    icon: CreditCard,
    priority: 5,
    assumptions: [
      { id: 'total_funding', name: 'Total Funding Raised', value: '', type: 'currency' },
      { id: 'number_of_rounds', name: 'Number of Funding Rounds', value: '', type: 'number' },
      { id: 'last_round_date', name: 'Last Funding Round Date', value: '', type: 'date' },
      { id: 'last_round_amount', name: 'Last Round Amount Raised', value: '', type: 'currency' },
      { id: 'last_round_premoney', name: 'Last Round Pre-Money Valuation', value: '', type: 'currency' },
      { id: 'last_round_postmoney', name: 'Last Round Post-Money Valuation', value: '', type: 'currency' },
      { id: 'last_round_price', name: 'Last Round Price per Share', value: '', type: 'currency' },
      { id: 'preferred_liquidation', name: 'Total Liquidation Preference', value: '', type: 'currency' },
      { id: 'participation_cap', name: 'Participation Cap (if any)', value: '', type: 'currency' },
      { id: 'dividend_rate', name: 'Cumulative Dividend Rate', value: '', type: 'percentage' },
    ]
  },
  {
    id: 'shares',
    name: 'Capitalization & Shares',
    icon: Share2,
    priority: 6,
    assumptions: [
      { id: 'common_shares_outstanding', name: 'Common Shares Outstanding', value: '', type: 'number' },
      { id: 'preferred_shares_outstanding', name: 'Preferred Shares Outstanding', value: '', type: 'number' },
      { id: 'options_outstanding', name: 'Options Outstanding', value: '', type: 'number' },
      { id: 'unvested_options', name: 'Unvested Options', value: '', type: 'number' },
      { id: 'warrants_outstanding', name: 'Warrants Outstanding', value: '', type: 'number' },
      { id: 'convertible_notes', name: 'Convertible Notes Outstanding', value: '', type: 'currency' },
      { id: 'fully_diluted_shares', name: 'Fully Diluted Shares', value: '', type: 'number' },
      { id: 'option_pool_size', name: 'Option Pool Size (%)', value: '', type: 'percentage' },
      { id: 'option_pool_available', name: 'Available Options in Pool', value: '', type: 'number' },
    ]
  },
  {
    id: 'growth_projections',
    name: 'Growth & Projections',
    icon: TrendingUp,
    priority: 7,
    assumptions: [
      { id: 'revenue_growth_y1', name: 'Year 1 Revenue Growth', value: '25', type: 'percentage' },
      { id: 'revenue_growth_y2', name: 'Year 2 Revenue Growth', value: '20', type: 'percentage' },
      { id: 'revenue_growth_y3', name: 'Year 3 Revenue Growth', value: '15', type: 'percentage' },
      { id: 'revenue_growth_y4', name: 'Year 4 Revenue Growth', value: '12', type: 'percentage' },
      { id: 'revenue_growth_y5', name: 'Year 5 Revenue Growth', value: '10', type: 'percentage' },
      { id: 'terminal_growth_rate', name: 'Terminal Growth Rate', value: '2.5', type: 'percentage' },
      { id: 'target_ebitda_margin', name: 'Target EBITDA Margin', value: '15', type: 'percentage' },
      { id: 'capex_percent_revenue', name: 'CapEx as % of Revenue', value: '5', type: 'percentage' },
      { id: 'working_capital_percent', name: 'Working Capital as % of Revenue', value: '10', type: 'percentage' },
    ]
  },
  {
    id: 'discount_rates',
    name: 'Discount & Risk Factors',
    icon: Percent,
    priority: 8,
    assumptions: [
      { id: 'wacc', name: 'Weighted Average Cost of Capital (WACC)', value: '12', type: 'percentage' },
      { id: 'cost_of_equity', name: 'Cost of Equity', value: '15', type: 'percentage' },
      { id: 'cost_of_debt', name: 'Cost of Debt', value: '6', type: 'percentage' },
      { id: 'target_debt_equity_ratio', name: 'Target Debt/Equity Ratio', value: '0.3', type: 'number' },
      { id: 'tax_rate', name: 'Tax Rate', value: '21', type: 'percentage' },
      { id: 'risk_free_rate', name: 'Risk-Free Rate', value: '4.5', type: 'percentage' },
      { id: 'equity_risk_premium', name: 'Equity Risk Premium', value: '7', type: 'percentage' },
      { id: 'size_premium', name: 'Size Premium', value: '3', type: 'percentage' },
      { id: 'company_specific_premium', name: 'Company-Specific Risk Premium', value: '2', type: 'percentage' },
      { id: 'country_risk_premium', name: 'Country Risk Premium', value: '0', type: 'percentage' },
    ]
  },
  {
    id: 'option_pricing',
    name: 'Option Pricing & Volatility',
    icon: Activity,
    priority: 9,
    assumptions: [
      { id: 'equity_volatility', name: 'Equity Volatility', value: '60', type: 'percentage' },
      { id: 'asset_volatility', name: 'Asset Volatility', value: '45', type: 'percentage' },
      { id: 'time_to_liquidity', name: 'Expected Time to Liquidity (Years)', value: '3', type: 'number' },
      { id: 'probability_ipo', name: 'Probability of IPO', value: '10', type: 'percentage' },
      { id: 'probability_ma', name: 'Probability of M&A', value: '30', type: 'percentage' },
      { id: 'probability_dissolution', name: 'Probability of Dissolution', value: '5', type: 'percentage' },
      { id: 'probability_stay_private', name: 'Probability Stay Private', value: '55', type: 'percentage' },
      { id: 'expected_ipo_value', name: 'Expected IPO Valuation', value: '', type: 'currency' },
      { id: 'expected_ma_value', name: 'Expected M&A Valuation', value: '', type: 'currency' },
    ]
  },
  {
    id: 'market_multiples',
    name: 'Market Comparables',
    icon: BarChart3,
    priority: 10,
    assumptions: [
      { id: 'revenue_multiple', name: 'EV/Revenue Multiple', value: '3.5', type: 'number' },
      { id: 'ebitda_multiple', name: 'EV/EBITDA Multiple', value: '12', type: 'number' },
      { id: 'ps_ratio', name: 'Price-to-Sales Ratio', value: '4', type: 'number' },
      { id: 'pe_ratio', name: 'Price-to-Earnings Ratio', value: '15', type: 'number' },
      { id: 'pb_ratio', name: 'Price-to-Book Ratio', value: '2', type: 'number' },
      { id: 'market_approach_weight', name: 'Market Approach Weight (%)', value: '30', type: 'percentage' },
      { id: 'income_approach_weight', name: 'Income Approach Weight (%)', value: '70', type: 'percentage' },
      { id: 'asset_approach_weight', name: 'Asset Approach Weight (%)', value: '0', type: 'percentage' },
    ]
  },
  {
    id: 'valuation_methodology',
    name: 'Valuation Methodology Weighting',
    icon: Calculator,
    priority: 11,
    assumptions: [
      { id: 'val_public_comps_weight', name: 'Public Comparables Weight (%)', value: '0', type: 'percentage', description: 'Weight assigned to public company comparables method' },
      { id: 'val_precedent_transactions_weight', name: 'Precedent Transactions Weight (%)', value: '0', type: 'percentage', description: 'Weight assigned to precedent M&A transactions method' },
      { id: 'val_precedent_financings_weight', name: 'Precedent Financings Weight (%)', value: '0', type: 'percentage', description: 'Weight assigned to recent financing rounds method' },
      { id: 'val_backsolve_weight', name: 'Backsolve Method Weight (%)', value: '100', type: 'percentage', description: 'Weight assigned to OPM backsolve from recent transaction' },
      { id: 'val_dcf_weight', name: 'DCF Method Weight (%)', value: '0', type: 'percentage', description: 'Weight assigned to discounted cash flow method' },
      { id: 'val_asset_approach_weight', name: 'Asset Approach Weight (%)', value: '0', type: 'percentage', description: 'Weight assigned to asset-based valuation method' },
      { id: 'val_total_weight_check', name: 'Total Valuation Weight Check', value: '100', type: 'percentage', description: 'Should equal 100% when all weights are summed' },
    ]
  },
  {
    id: 'allocation_methodology',
    name: 'Allocation Methodology Weighting',
    icon: Share2,
    priority: 12,
    assumptions: [
      { id: 'alloc_pwerm_weight', name: 'PWERM Weight (%)', value: '0', type: 'percentage', description: 'Probability-Weighted Expected Return Method weight' },
      { id: 'alloc_opm_weight', name: 'OPM Weight (%)', value: '0', type: 'percentage', description: 'Option Pricing Model weight' },
      { id: 'alloc_cvm_weight', name: 'CVM Weight (%)', value: '0', type: 'percentage', description: 'Current Value Method weight' },
      { id: 'alloc_hybrid_weight', name: 'Hybrid Method Weight (%)', value: '100', type: 'percentage', description: 'Hybrid method combining PWERM and OPM weight' },
      { id: 'alloc_total_weight_check', name: 'Total Allocation Weight Check', value: '100', type: 'percentage', description: 'Should equal 100% when all weights are summed' },
    ]
  },
  {
    id: 'discounts',
    name: 'Valuation Discounts',
    icon: Calculator,
    priority: 13,
    assumptions: [
      { id: 'discount_lack_marketability', name: 'Discount for Lack of Marketability (DLOM)', value: '30', type: 'percentage' },
      { id: 'discount_minority_interest', name: 'Discount for Minority Interest', value: '0', type: 'percentage' },
      { id: 'discount_key_person', name: 'Key Person Discount', value: '0', type: 'percentage' },
      { id: 'control_premium', name: 'Control Premium (if applicable)', value: '0', type: 'percentage' },
      { id: 'blockage_discount', name: 'Blockage Discount', value: '0', type: 'percentage' },
    ]
  },
  {
    id: 'transaction_history',
    name: 'Recent Transactions',
    icon: Clock,
    priority: 14,
    assumptions: [
      { id: 'recent_transaction_date', name: 'Most Recent Transaction Date', value: '', type: 'date' },
      { id: 'recent_transaction_type', name: 'Transaction Type', value: '', type: 'select',
        options: ['Primary Issuance', 'Secondary Sale', 'Tender Offer', 'M&A', 'Other'] },
      { id: 'recent_transaction_price', name: 'Transaction Price per Share', value: '', type: 'currency' },
      { id: 'recent_transaction_shares', name: 'Number of Shares', value: '', type: 'number' },
      { id: 'recent_transaction_value', name: 'Total Transaction Value', value: '', type: 'currency' },
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
  const [categories, setCategories] = useState<AssumptionCategory[]>(
    // Sort categories by priority on initial load
    [...initialCategories].sort((a, b) => (a.priority || 999) - (b.priority || 999))
  );
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['company', 'valuation_details', 'financial_metrics']);
  const [searchQuery, setSearchQuery] = useState('');

  // Update categories when initialCategories change
  useEffect(() => {
    if (initialCategories !== defaultAssumptionCategories) {
      setCategories([...initialCategories].sort((a, b) => (a.priority || 999) - (b.priority || 999)));
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

  const toggleAllCategories = () => {
    if (expandedCategories.length === categories.length) {
      setExpandedCategories([]);
    } else {
      setExpandedCategories(categories.map(c => c.id));
    }
  };

  // Filter categories and assumptions based on search
  const filteredCategories = categories.map(category => {
    if (!searchQuery) return category;

    const matchingAssumptions = category.assumptions.filter(assumption =>
      assumption.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assumption.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matchingAssumptions.length > 0 || category.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return { ...category, assumptions: matchingAssumptions.length > 0 ? matchingAssumptions : category.assumptions };
    }
    return null;
  }).filter(Boolean) as AssumptionCategory[];

  // Calculate completion statistics
  const getCompletionStats = () => {
    let total = 0;
    let required = 0;
    let completed = 0;
    let requiredCompleted = 0;

    categories.forEach(category => {
      category.assumptions.forEach(assumption => {
        total++;
        if (assumption.required) required++;
        if (assumption.value && assumption.value !== '') {
          completed++;
          if (assumption.required) requiredCompleted++;
        }
      });
    });

    return { total, required, completed, requiredCompleted };
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Valuation Assumptions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure all assumptions and inputs for your 409A valuation
            </p>
          </div>
          <button
            onClick={toggleAllCategories}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {expandedCategories.length === categories.length ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{stats.completed} / {stats.total} fields completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Required Fields</span>
            <span className="font-medium text-red-600">
              {stats.requiredCompleted} / {stats.required} required fields completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${stats.requiredCompleted === stats.required ? 'bg-green-500' : 'bg-red-500'} rounded-full h-2 transition-all duration-300`}
              style={{ width: `${(stats.requiredCompleted / stats.required) * 100}%` }}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search assumptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Summary Section */}
      <AssumptionsSummary categories={categories} />

      {/* Categories */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <AssumptionCategoryComponent
            key={category.id}
            category={category}
            isExpanded={expandedCategories.includes(category.id)}
            onToggle={() => toggleCategory(category.id)}
            onAssumptionChange={(assumptionId, value) =>
              handleAssumptionChange(category.id, assumptionId, value)
            }
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {filteredCategories.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          No assumptions found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}