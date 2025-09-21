import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  Briefcase,
  Search,
  Filter,
  ChevronRight,
  Check,
  AlertCircle,
  HelpCircle,
  Hash,
  CalendarDays,
  Globe,
  Shield,
  Zap,
  Target,
  PieChart,
  Layers,
  BookOpen,
  Users,
} from 'lucide-react'
import { FinancialAssumption } from '@/types'
import { AssumptionInput } from './AssumptionInput'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface AssumptionCategory {
  id: string
  name: string
  icon: React.ElementType
  color: string
  bgColor: string
  assumptions: Assumption[]
  priority?: number
  description?: string
  subCategories?: SubCategory[]
}

export interface SubCategory {
  id: string
  name: string
  assumptions: Assumption[]
}

export interface Assumption {
  id: string
  name: string
  value: string | number
  unit?: string
  type: 'number' | 'percentage' | 'currency' | 'text' | 'date' | 'select' | 'textarea'
  options?: string[]
  description?: string
  required?: boolean
  category?: string
  helpText?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

// Enhanced category definitions with colors and better organization
const defaultAssumptionCategories: AssumptionCategory[] = [
  {
    id: 'company',
    name: 'Company Information',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    priority: 1,
    description: 'Basic company details and structure',
    subCategories: [
      {
        id: 'basic_info',
        name: 'Basic Information',
        assumptions: [
          { id: 'company_name', name: 'Company Name', value: '', type: 'text', required: true },
          { id: 'company_address', name: 'Company Address', value: '', type: 'text' },
          {
            id: 'company_state',
            name: 'State of Incorporation',
            value: '',
            type: 'select',
            options: ['Delaware', 'California', 'New York', 'Texas', 'Nevada', 'Wyoming', 'Other'],
            required: true,
          },
          {
            id: 'company_incorporation_date',
            name: 'Date of Incorporation',
            value: '',
            type: 'date',
          },
          { id: 'fiscal_year_end', name: 'Fiscal Year End', value: '12/31', type: 'text' },
        ],
      },
      {
        id: 'business_info',
        name: 'Business Details',
        assumptions: [
          {
            id: 'industry',
            name: 'Industry',
            value: '',
            type: 'select',
            options: [
              'Technology',
              'Healthcare',
              'Financial Services',
              'Consumer',
              'Industrial',
              'Energy',
              'Real Estate',
              'Other',
            ],
            required: true,
          },
          {
            id: 'stage',
            name: 'Company Stage',
            value: '',
            type: 'select',
            options: [
              'Stage 1: Ideation',
              'Stage 2: Product Development',
              'Stage 3: Development Progress',
              'Stage 4: Early Revenue',
              'Stage 5: Revenue Generation',
              'Stage 6: Established Operations',
            ],
            required: true,
          },
          { id: 'stage_description', name: 'Stage Description', value: '', type: 'textarea' },
          { id: 'company_employees', name: 'Number of Employees', value: '', type: 'number' },
          { id: 'years_in_operation', name: 'Years in Operation', value: '', type: 'number' },
          { id: 'company_website', name: 'Website', value: '', type: 'text' },
        ],
      },
    ],
    assumptions: [], // For backward compatibility
  },
  {
    id: 'valuation_details',
    name: 'Valuation Details',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    priority: 2,
    description: 'Valuation methodology and dates',
    assumptions: [
      { id: 'valuation_date', name: 'Valuation Date', value: '', type: 'date', required: true },
      { id: 'report_date', name: 'Report Date', value: '', type: 'date', required: true },
      {
        id: 'valuation_purpose',
        name: 'Valuation Purpose',
        value: 'Section 409A of the Internal Revenue Code',
        type: 'text',
      },
      {
        id: 'standard_of_value',
        name: 'Standard of Value',
        value: 'Fair Market Value',
        type: 'select',
        options: ['Fair Market Value', 'Fair Value', 'Investment Value', 'Intrinsic Value'],
      },
      {
        id: 'premise_of_value',
        name: 'Premise of Value',
        value: 'Going Concern',
        type: 'select',
        options: ['Going Concern', 'Liquidation', 'Orderly Liquidation', 'Forced Liquidation'],
      },
      {
        id: 'valuation_approach',
        name: 'Primary Valuation Approach',
        value: '',
        type: 'select',
        options: [
          'Income Approach',
          'Market Approach',
          'Asset Approach',
          'Option Pricing Model',
          'Probability-Weighted Expected Return Method',
        ],
      },
    ],
  },
  {
    id: 'appraiser',
    name: 'Appraiser Information',
    icon: UserCheck,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    priority: 3,
    description: 'Valuation firm and appraiser details',
    assumptions: [
      { id: 'appraiser_name', name: 'Appraiser Name', value: '', type: 'text', required: true },
      { id: 'appraiser_firm', name: 'Appraiser Firm', value: '', type: 'text', required: true },
      {
        id: 'appraiser_credentials',
        name: 'Credentials (ASA, CFA, etc.)',
        value: '',
        type: 'text',
      },
      { id: 'appraiser_address', name: 'Firm Address', value: '', type: 'text' },
      { id: 'appraiser_phone', name: 'Contact Phone', value: '', type: 'text' },
      { id: 'appraiser_email', name: 'Contact Email', value: '', type: 'text' },
      { id: 'engagement_date', name: 'Engagement Date', value: '', type: 'date' },
    ],
  },
  {
    id: 'financial_metrics',
    name: 'Financial Performance',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    priority: 4,
    description: 'Historical financial metrics and performance',
    subCategories: [
      {
        id: 'revenue_metrics',
        name: 'Revenue',
        assumptions: [
          {
            id: 'revenue_current',
            name: 'Current Year Revenue',
            value: '',
            type: 'currency',
            required: true,
          },
          { id: 'revenue_prior', name: 'Prior Year Revenue', value: '', type: 'currency' },
          {
            id: 'revenue_two_years_prior',
            name: '2 Years Prior Revenue',
            value: '',
            type: 'currency',
          },
        ],
      },
      {
        id: 'profitability',
        name: 'Profitability',
        assumptions: [
          { id: 'gross_profit_current', name: 'Current Gross Profit', value: '', type: 'currency' },
          { id: 'gross_margin', name: 'Gross Margin %', value: '', type: 'percentage' },
          { id: 'ebitda_current', name: 'Current EBITDA', value: '', type: 'currency' },
          { id: 'operating_margin', name: 'Operating Margin %', value: '', type: 'percentage' },
          { id: 'net_income_current', name: 'Current Net Income', value: '', type: 'currency' },
        ],
      },
      {
        id: 'balance_sheet',
        name: 'Balance Sheet',
        assumptions: [
          { id: 'cash_balance', name: 'Cash Balance', value: '', type: 'currency' },
          { id: 'ar_balance', name: 'Accounts Receivable', value: '', type: 'currency' },
          { id: 'total_assets', name: 'Total Assets', value: '', type: 'currency' },
          { id: 'total_liabilities', name: 'Total Liabilities', value: '', type: 'currency' },
          { id: 'debt_outstanding', name: 'Total Debt Outstanding', value: '', type: 'currency' },
        ],
      },
      {
        id: 'cash_flow',
        name: 'Cash Flow',
        assumptions: [
          { id: 'burn_rate', name: 'Monthly Burn Rate', value: '', type: 'currency' },
          { id: 'runway_months', name: 'Cash Runway (Months)', value: '', type: 'number' },
        ],
      },
    ],
    assumptions: [], // For backward compatibility
  },
  {
    id: 'growth_projections',
    name: 'Growth & Projections',
    icon: TrendingUp,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    priority: 5,
    description: 'Future growth rates and projections',
    assumptions: [
      { id: 'revenue_growth_y1', name: 'Year 1 Revenue Growth', value: '25', type: 'percentage' },
      { id: 'revenue_growth_y2', name: 'Year 2 Revenue Growth', value: '20', type: 'percentage' },
      { id: 'revenue_growth_y3', name: 'Year 3 Revenue Growth', value: '15', type: 'percentage' },
      { id: 'revenue_growth_y4', name: 'Year 4 Revenue Growth', value: '12', type: 'percentage' },
      { id: 'revenue_growth_y5', name: 'Year 5 Revenue Growth', value: '10', type: 'percentage' },
      {
        id: 'terminal_growth_rate',
        name: 'Terminal Growth Rate',
        value: '2.5',
        type: 'percentage',
      },
      { id: 'target_ebitda_margin', name: 'Target EBITDA Margin', value: '15', type: 'percentage' },
      {
        id: 'capex_percent_revenue',
        name: 'CapEx as % of Revenue',
        value: '5',
        type: 'percentage',
      },
      {
        id: 'working_capital_percent',
        name: 'Working Capital as % of Revenue',
        value: '10',
        type: 'percentage',
      },
    ],
  },
  {
    id: 'discount_rates',
    name: 'Discount & Risk Factors',
    icon: Percent,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    priority: 6,
    description: 'Cost of capital and risk premiums',
    subCategories: [
      {
        id: 'cost_of_capital',
        name: 'Cost of Capital',
        assumptions: [
          {
            id: 'wacc',
            name: 'Weighted Average Cost of Capital (WACC)',
            value: '12',
            type: 'percentage',
          },
          { id: 'cost_of_equity', name: 'Cost of Equity', value: '15', type: 'percentage' },
          { id: 'cost_of_debt', name: 'Cost of Debt', value: '6', type: 'percentage' },
          {
            id: 'target_debt_equity_ratio',
            name: 'Target Debt/Equity Ratio',
            value: '0.3',
            type: 'number',
          },
          { id: 'tax_rate', name: 'Tax Rate', value: '21', type: 'percentage' },
        ],
      },
      {
        id: 'risk_premiums',
        name: 'Risk Premiums',
        assumptions: [
          {
            id: 'risk_free_rate',
            name: 'Risk-Free Rate',
            value: '4.5',
            type: 'percentage',
            required: true,
          },
          {
            id: 'equity_risk_premium',
            name: 'Equity Risk Premium',
            value: '7',
            type: 'percentage',
          },
          { id: 'size_premium', name: 'Size Premium', value: '3', type: 'percentage' },
          {
            id: 'company_specific_premium',
            name: 'Company-Specific Risk Premium',
            value: '2',
            type: 'percentage',
          },
          {
            id: 'country_risk_premium',
            name: 'Country Risk Premium',
            value: '0',
            type: 'percentage',
          },
        ],
      },
    ],
    assumptions: [], // For backward compatibility
  },
  {
    id: 'option_pricing',
    name: 'Option Pricing & Volatility',
    icon: Activity,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    priority: 7,
    description: 'Option valuation parameters',
    assumptions: [
      { id: 'equity_volatility', name: 'Equity Volatility', value: '60', type: 'percentage' },
      { id: 'asset_volatility', name: 'Asset Volatility', value: '45', type: 'percentage' },
      {
        id: 'time_to_liquidity',
        name: 'Expected Time to Liquidity (Years)',
        value: '3',
        type: 'number',
      },
      { id: 'probability_ipo', name: 'Probability of IPO', value: '10', type: 'percentage' },
      { id: 'probability_ma', name: 'Probability of M&A', value: '30', type: 'percentage' },
      {
        id: 'probability_dissolution',
        name: 'Probability of Dissolution',
        value: '5',
        type: 'percentage',
      },
      {
        id: 'probability_stay_private',
        name: 'Probability Stay Private',
        value: '55',
        type: 'percentage',
      },
      { id: 'expected_ipo_value', name: 'Expected IPO Valuation', value: '', type: 'currency' },
      { id: 'expected_ma_value', name: 'Expected M&A Valuation', value: '', type: 'currency' },
    ],
  },
  {
    id: 'market_multiples',
    name: 'Market Comparables',
    icon: BarChart3,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    priority: 8,
    description: 'Industry multiples and comparables',
    assumptions: [
      { id: 'revenue_multiple', name: 'EV/Revenue Multiple', value: '3.5', type: 'number' },
      { id: 'ebitda_multiple', name: 'EV/EBITDA Multiple', value: '12', type: 'number' },
      { id: 'ps_ratio', name: 'Price-to-Sales Ratio', value: '4', type: 'number' },
      { id: 'pe_ratio', name: 'Price-to-Earnings Ratio', value: '15', type: 'number' },
      { id: 'pb_ratio', name: 'Price-to-Book Ratio', value: '2', type: 'number' },
      {
        id: 'market_approach_weight',
        name: 'Market Approach Weight (%)',
        value: '30',
        type: 'percentage',
      },
      { id: 'comparable_companies', name: 'Comparable Companies', value: '', type: 'textarea' },
    ],
  },
  {
    id: 'equity_structure',
    name: 'Equity Structure',
    icon: Share2,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    priority: 9,
    description: 'Equity and ownership details',
    assumptions: [
      { id: 'shares_outstanding', name: 'Total Shares Outstanding', value: '', type: 'number' },
      { id: 'common_shares', name: 'Common Shares', value: '', type: 'number' },
      { id: 'preferred_shares', name: 'Preferred Shares', value: '', type: 'number' },
      { id: 'options_outstanding', name: 'Options Outstanding', value: '', type: 'number' },
      { id: 'warrants_outstanding', name: 'Warrants Outstanding', value: '', type: 'number' },
      { id: 'fully_diluted_shares', name: 'Fully Diluted Shares', value: '', type: 'number' },
      {
        id: 'common_strike_price',
        name: 'Common Option Strike Price',
        value: '',
        type: 'currency',
      },
      { id: 'latest_round_price', name: 'Latest Round Price/Share', value: '', type: 'currency' },
      { id: 'latest_round_date', name: 'Latest Round Date', value: '', type: 'date' },
      { id: 'latest_round_amount', name: 'Latest Round Amount', value: '', type: 'currency' },
    ],
  },
]

interface ValuationAssumptionsRedesignedProps {
  valuationId: string
  initialCategories?: AssumptionCategory[]
  onSave?: (categories: AssumptionCategory[]) => Promise<void>
}

export function ValuationAssumptionsRedesigned({
  valuationId,
  initialCategories,
  onSave,
}: ValuationAssumptionsRedesignedProps) {
  // Flatten subcategories into main assumptions for backward compatibility
  const flattenCategories = (categories: AssumptionCategory[]): AssumptionCategory[] => {
    return categories.map((cat) => ({
      ...cat,
      assumptions: cat.subCategories
        ? cat.subCategories.flatMap((sub) => sub.assumptions)
        : cat.assumptions,
    }))
  }

  const [categories, setCategories] = useState<AssumptionCategory[]>(
    initialCategories || flattenCategories(defaultAssumptionCategories)
  )
  const [selectedCategory, setSelectedCategory] = useState<string>('company')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'required' | 'incomplete'>('all')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Enhanced category structure with subcategories for better organization
  const enhancedCategories = useMemo(() => {
    return defaultAssumptionCategories.map((defaultCat) => {
      const savedCat = categories.find((c) => c.id === defaultCat.id)
      if (savedCat) {
        // Map saved assumptions back to subcategories
        const enhancedCat = { ...defaultCat }
        if (enhancedCat.subCategories) {
          enhancedCat.subCategories = enhancedCat.subCategories.map((subCat) => ({
            ...subCat,
            assumptions: subCat.assumptions.map((assumption) => {
              const savedAssumption = savedCat.assumptions.find((a) => a.id === assumption.id)
              return savedAssumption || assumption
            }),
          }))
        } else {
          enhancedCat.assumptions = defaultCat.assumptions.map((assumption) => {
            const savedAssumption = savedCat.assumptions.find((a) => a.id === assumption.id)
            return savedAssumption || assumption
          })
        }
        return enhancedCat
      }
      return defaultCat
    })
  }, [categories])

  // Get current category
  const currentCategory =
    enhancedCategories.find((cat) => cat.id === selectedCategory) || enhancedCategories[0]

  // Calculate completion stats for a category
  const getCategoryStats = useCallback((category: AssumptionCategory) => {
    const allAssumptions = category.subCategories
      ? category.subCategories.flatMap((sub) => sub.assumptions)
      : category.assumptions

    const total = allAssumptions.length
    const required = allAssumptions.filter((a) => a.required).length
    const completed = allAssumptions.filter((a) => a.value && a.value !== '').length
    const requiredCompleted = allAssumptions.filter(
      (a) => a.required && a.value && a.value !== ''
    ).length

    return {
      total,
      required,
      completed,
      requiredCompleted,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      requiredPercentage: required > 0 ? Math.round((requiredCompleted / required) * 100) : 0,
    }
  }, [])

  // Filter assumptions based on search and filter type
  const filterAssumptions = useCallback(
    (assumptions: Assumption[]) => {
      let filtered = [...assumptions]

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      // Apply type filter
      if (filterType === 'required') {
        filtered = filtered.filter((a) => a.required)
      } else if (filterType === 'incomplete') {
        filtered = filtered.filter((a) => !a.value || a.value === '')
      }

      return filtered
    },
    [searchQuery, filterType]
  )

  // Handle assumption change
  const handleAssumptionChange = useCallback(
    (categoryId: string, assumptionId: string, value: string | number) => {
      setCategories((prevCategories) => {
        const newCategories = prevCategories.map((cat) => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              assumptions: cat.assumptions.map((assumption) =>
                assumption.id === assumptionId ? { ...assumption, value } : assumption
              ),
            }
          }
          return cat
        })
        return newCategories
      })
      setIsDirty(true)
    },
    []
  )

  // Auto-save with debounce
  useEffect(() => {
    if (isDirty && onSave) {
      const timer = setTimeout(async () => {
        setIsSaving(true)
        try {
          await onSave(categories)
          setIsDirty(false)
        } catch (error) {
          console.error('Failed to save assumptions:', error)
        } finally {
          setIsSaving(false)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [categories, isDirty, onSave])

  // Get overall stats
  const overallStats = useMemo(() => {
    let total = 0
    let required = 0
    let completed = 0
    let requiredCompleted = 0

    enhancedCategories.forEach((category) => {
      const stats = getCategoryStats(category)
      total += stats.total
      required += stats.required
      completed += stats.completed
      requiredCompleted += stats.requiredCompleted
    })

    return {
      total,
      required,
      completed,
      requiredCompleted,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      requiredPercentage: required > 0 ? Math.round((requiredCompleted / required) * 100) : 0,
    }
  }, [enhancedCategories, getCategoryStats])

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Left Sidebar Navigation */}
        <div className="w-80 flex-shrink-0 overflow-y-auto rounded-lg border bg-card">
          <div className="sticky top-0 z-10 border-b bg-card p-4">
            <h3 className="mb-3 text-lg font-semibold">Categories</h3>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search assumptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>All Fields</span>
                  </div>
                </SelectItem>
                <SelectItem value="required">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span>Required Only</span>
                  </div>
                </SelectItem>
                <SelectItem value="incomplete">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-red-500" />
                    <span>Incomplete Only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Overall Progress */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{overallStats.percentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${overallStats.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{overallStats.completed} completed</span>
                <span>{overallStats.total} total</span>
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="p-2">
            {enhancedCategories.map((category) => {
              const stats = getCategoryStats(category)
              const isSelected = selectedCategory === category.id
              const Icon = category.icon

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-accent',
                    isSelected && 'bg-accent shadow-sm'
                  )}
                >
                  <div className={cn('rounded-lg p-2', category.bgColor)}>
                    <Icon className={cn('h-4 w-4', category.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.completed}/{stats.total} fields
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        stats.percentage === 100
                          ? 'default'
                          : stats.percentage > 50
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-xs"
                    >
                      {stats.percentage}%
                    </Badge>
                    {stats.required > 0 && stats.requiredCompleted < stats.required && (
                      <Badge variant="destructive" className="text-xs">
                        {stats.required - stats.requiredCompleted} required
                      </Badge>
                    )}
                  </div>
                  {isSelected && <ChevronRight className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto rounded-lg border bg-card">
          <div className="sticky top-0 z-10 border-b bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-3', currentCategory.bgColor)}>
                  <currentCategory.icon className={cn('h-6 w-6', currentCategory.color)} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentCategory.name}</h2>
                  {currentCategory.description && (
                    <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <Badge variant="outline" className="animate-pulse">
                    <Zap className="mr-1 h-3 w-3" />
                    Saving...
                  </Badge>
                )}
                {!isSaving && !isDirty && (
                  <Badge variant="outline" className="text-green-600">
                    <Check className="mr-1 h-3 w-3" />
                    Saved
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {currentCategory.subCategories ? (
              // Render with tabs for subcategories
              <Tabs defaultValue={currentCategory.subCategories[0]?.id} className="w-full">
                <TabsList className="mb-6 w-full justify-start">
                  {currentCategory.subCategories.map((subCat) => (
                    <TabsTrigger key={subCat.id} value={subCat.id} className="min-w-[120px]">
                      {subCat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {currentCategory.subCategories.map((subCat) => (
                  <TabsContent key={subCat.id} value={subCat.id}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                      {filterAssumptions(subCat.assumptions).map((assumption) => (
                        <div key={assumption.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="block text-sm font-medium">
                              {assumption.name}
                              {assumption.required && (
                                <span className="ml-1 text-destructive">*</span>
                              )}
                            </label>
                            {assumption.helpText && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-sm">{assumption.helpText}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <AssumptionInput
                            assumption={assumption}
                            categoryId={currentCategory.id}
                            onChange={handleAssumptionChange}
                            onGetAssumptionValue={(id) => {
                              const cat = categories.find((c) => c.id === currentCategory.id)
                              const assumption = cat?.assumptions.find((a) => a.id === id)
                              return assumption?.value || ''
                            }}
                          />
                          {assumption.description && (
                            <p className="text-xs text-muted-foreground">
                              {assumption.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {filterAssumptions(subCat.assumptions).length === 0 && (
                      <div className="py-12 text-center text-muted-foreground">
                        No assumptions match your current filters
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Render regular assumptions without tabs
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {filterAssumptions(currentCategory.assumptions).map((assumption) => (
                  <div key={assumption.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium">
                        {assumption.name}
                        {assumption.required && <span className="ml-1 text-destructive">*</span>}
                      </label>
                      {assumption.helpText && (
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-sm">{assumption.helpText}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <AssumptionInput
                      assumption={assumption}
                      categoryId={currentCategory.id}
                      onChange={handleAssumptionChange}
                      onGetAssumptionValue={(id) => {
                        const cat = categories.find((c) => c.id === currentCategory.id)
                        const assumption = cat?.assumptions.find((a) => a.id === id)
                        return assumption?.value || ''
                      }}
                    />
                    {assumption.description && (
                      <p className="text-xs text-muted-foreground">{assumption.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {filterAssumptions(currentCategory.assumptions).length === 0 &&
              !currentCategory.subCategories && (
                <div className="py-12 text-center text-muted-foreground">
                  No assumptions match your current filters
                </div>
              )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
