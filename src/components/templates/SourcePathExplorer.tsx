'use client'

import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Database, Folder, File, Copy, Check, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { fieldMappingService } from '@/lib/templates/fieldMappingService'

interface DataNode {
  id: string
  name: string
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'date'
  description?: string
  children?: DataNode[]
  sampleValue?: any
  isRequired?: boolean
}

// Define the complete data structure available in valuations
const dataStructure: DataNode[] = [
  {
    id: 'company',
    name: 'Company',
    path: 'company',
    type: 'object',
    description: 'Company information and details',
    children: [
      { id: 'company.name', name: 'Name', path: 'company.name', type: 'string', sampleValue: 'TechCo Inc.', isRequired: true },
      { id: 'company.legalName', name: 'Legal Name', path: 'company.legalName', type: 'string', sampleValue: 'TechCo Incorporated' },
      { id: 'company.location', name: 'Location', path: 'company.location', type: 'string', sampleValue: '123 Main St, San Francisco, CA' },
      { id: 'company.city', name: 'City', path: 'company.city', type: 'string', sampleValue: 'San Francisco' },
      { id: 'company.stateOfIncorporation', name: 'State of Incorporation', path: 'company.stateOfIncorporation', type: 'string', sampleValue: 'Delaware' },
      { id: 'company.ein', name: 'EIN', path: 'company.ein', type: 'string', sampleValue: '12-3456789' },
      { id: 'company.industry', name: 'Industry', path: 'company.industry', type: 'string', sampleValue: 'Software' },
      { id: 'company.website', name: 'Website', path: 'company.website', type: 'string', sampleValue: 'www.techco.com' },
      { id: 'company.foundedDate', name: 'Founded Date', path: 'company.foundedDate', type: 'date', sampleValue: '2020-01-15' },
      { id: 'company.employees', name: 'Employees', path: 'company.employees', type: 'number', sampleValue: 150 },
      { id: 'company.description', name: 'Description', path: 'company.description', type: 'string', sampleValue: 'Leading SaaS provider...' },
    ],
  },
  {
    id: 'assumptions',
    name: 'Assumptions',
    path: 'assumptions',
    type: 'object',
    description: 'DCF model assumptions and parameters',
    children: [
      { id: 'assumptions.valuationDate', name: 'Valuation Date', path: 'assumptions.valuationDate', type: 'date', sampleValue: '2024-01-01', isRequired: true },
      { id: 'assumptions.currency', name: 'Currency', path: 'assumptions.currency', type: 'string', sampleValue: 'USD' },
      { id: 'assumptions.discountingConvention', name: 'Discounting Convention', path: 'assumptions.discountingConvention', type: 'string', sampleValue: 'Mid-Year' },
      { id: 'assumptions.projectionYears', name: 'Projection Years', path: 'assumptions.projectionYears', type: 'number', sampleValue: 5 },
      { id: 'assumptions.corporateTaxRate', name: 'Corporate Tax Rate', path: 'assumptions.corporateTaxRate', type: 'number', sampleValue: 21 },
      { id: 'assumptions.effectiveTaxRate', name: 'Effective Tax Rate', path: 'assumptions.effectiveTaxRate', type: 'number', sampleValue: 25, isRequired: true },
      { id: 'assumptions.discountRate', name: 'Discount Rate', path: 'assumptions.discountRate', type: 'number', sampleValue: 12.5, isRequired: true },
      { id: 'assumptions.terminalGrowthRate', name: 'Terminal Growth Rate', path: 'assumptions.terminalGrowthRate', type: 'number', sampleValue: 3, isRequired: true },
      {
        id: 'assumptions.financial_metrics',
        name: 'Financial Metrics',
        path: 'assumptions.financial_metrics',
        type: 'object',
        children: [
          { id: 'assumptions.financial_metrics.revenue_current', name: 'Current Revenue', path: 'assumptions.financial_metrics.revenue_current', type: 'number', sampleValue: 10000000 },
          { id: 'assumptions.financial_metrics.revenue_prior', name: 'Prior Revenue', path: 'assumptions.financial_metrics.revenue_prior', type: 'number', sampleValue: 8000000 },
          { id: 'assumptions.financial_metrics.gross_margin', name: 'Gross Margin', path: 'assumptions.financial_metrics.gross_margin', type: 'number', sampleValue: 75 },
          { id: 'assumptions.financial_metrics.operating_margin', name: 'Operating Margin', path: 'assumptions.financial_metrics.operating_margin', type: 'number', sampleValue: 25 },
          { id: 'assumptions.financial_metrics.cash_balance', name: 'Cash Balance', path: 'assumptions.financial_metrics.cash_balance', type: 'number', sampleValue: 5000000 },
          { id: 'assumptions.financial_metrics.burn_rate', name: 'Burn Rate', path: 'assumptions.financial_metrics.burn_rate', type: 'number', sampleValue: 500000 },
          { id: 'assumptions.financial_metrics.runway_months', name: 'Runway Months', path: 'assumptions.financial_metrics.runway_months', type: 'number', sampleValue: 10 },
        ],
      },
      {
        id: 'assumptions.backsolve',
        name: 'Backsolve',
        path: 'assumptions.backsolve',
        type: 'object',
        children: [
          { id: 'assumptions.backsolve.last_round_date', name: 'Last Round Date', path: 'assumptions.backsolve.last_round_date', type: 'date', sampleValue: '2023-06-15' },
          { id: 'assumptions.backsolve.last_round_amount', name: 'Last Round Amount', path: 'assumptions.backsolve.last_round_amount', type: 'number', sampleValue: 20000000 },
          { id: 'assumptions.backsolve.last_round_type', name: 'Last Round Type', path: 'assumptions.backsolve.last_round_type', type: 'string', sampleValue: 'Series B' },
          { id: 'assumptions.backsolve.last_round_premoney', name: 'Last Round Pre-Money', path: 'assumptions.backsolve.last_round_premoney', type: 'number', sampleValue: 80000000 },
          { id: 'assumptions.backsolve.last_round_price', name: 'Last Round Price', path: 'assumptions.backsolve.last_round_price', type: 'number', sampleValue: 10.50 },
        ],
      },
      {
        id: 'assumptions.volatility_assumptions',
        name: 'Volatility Assumptions',
        path: 'assumptions.volatility_assumptions',
        type: 'object',
        children: [
          { id: 'assumptions.volatility_assumptions.equity_volatility', name: 'Equity Volatility', path: 'assumptions.volatility_assumptions.equity_volatility', type: 'number', sampleValue: 45, isRequired: true },
          { id: 'assumptions.volatility_assumptions.time_to_liquidity', name: 'Time to Liquidity', path: 'assumptions.volatility_assumptions.time_to_liquidity', type: 'number', sampleValue: 3 },
        ],
      },
      {
        id: 'assumptions.discount_rates',
        name: 'Discount Rates',
        path: 'assumptions.discount_rates',
        type: 'object',
        children: [
          { id: 'assumptions.discount_rates.risk_free_rate', name: 'Risk Free Rate', path: 'assumptions.discount_rates.risk_free_rate', type: 'number', sampleValue: 4.5, isRequired: true },
          { id: 'assumptions.discount_rates.minority_interest_discount', name: 'Minority Interest Discount', path: 'assumptions.discount_rates.minority_interest_discount', type: 'number', sampleValue: 15 },
        ],
      },
    ],
  },
  {
    id: 'valuation',
    name: 'Valuation',
    path: 'valuation',
    type: 'object',
    description: 'Valuation results and calculations',
    children: [
      {
        id: 'valuation.results',
        name: 'Results',
        path: 'valuation.results',
        type: 'object',
        children: [
          { id: 'valuation.results.enterpriseValue', name: 'Enterprise Value', path: 'valuation.results.enterpriseValue', type: 'number', sampleValue: 100000000, isRequired: true },
          { id: 'valuation.results.equityValue', name: 'Equity Value', path: 'valuation.results.equityValue', type: 'number', sampleValue: 95000000, isRequired: true },
          { id: 'valuation.results.commonShareValue', name: 'Common Share Value', path: 'valuation.results.commonShareValue', type: 'number', sampleValue: 2.50, isRequired: true },
          { id: 'valuation.results.preferredShareValue', name: 'Preferred Share Value', path: 'valuation.results.preferredShareValue', type: 'number', sampleValue: 10.00 },
          { id: 'valuation.results.terminalValue', name: 'Terminal Value', path: 'valuation.results.terminalValue', type: 'number', sampleValue: 150000000 },
        ],
      },
      {
        id: 'valuation.wacc',
        name: 'WACC',
        path: 'valuation.wacc',
        type: 'object',
        children: [
          { id: 'valuation.wacc.costOfEquity', name: 'Cost of Equity', path: 'valuation.wacc.costOfEquity', type: 'number', sampleValue: 15, isRequired: true },
          { id: 'valuation.wacc.costOfDebt', name: 'Cost of Debt', path: 'valuation.wacc.costOfDebt', type: 'number', sampleValue: 5 },
          { id: 'valuation.wacc.calculatedWACC', name: 'Calculated WACC', path: 'valuation.wacc.calculatedWACC', type: 'number', sampleValue: 12.5, isRequired: true },
          { id: 'valuation.wacc.riskFreeRate', name: 'Risk Free Rate', path: 'valuation.wacc.riskFreeRate', type: 'number', sampleValue: 4.5, isRequired: true },
        ],
      },
      {
        id: 'valuation.workingCapital',
        name: 'Working Capital',
        path: 'valuation.workingCapital',
        type: 'object',
        children: [
          { id: 'valuation.workingCapital.summary.currentNWC', name: 'Current NWC', path: 'valuation.workingCapital.summary.currentNWC', type: 'number', sampleValue: 2000000 },
          { id: 'valuation.workingCapital.summary.cashConversionCycle', name: 'Cash Conversion Cycle', path: 'valuation.workingCapital.summary.cashConversionCycle', type: 'number', sampleValue: 45 },
        ],
      },
      {
        id: 'valuation.debtSchedule',
        name: 'Debt Schedule',
        path: 'valuation.debtSchedule',
        type: 'object',
        children: [
          { id: 'valuation.debtSchedule.summary.totalDebt', name: 'Total Debt', path: 'valuation.debtSchedule.summary.totalDebt', type: 'number', sampleValue: 5000000 },
          { id: 'valuation.debtSchedule.summary.weightedAverageRate', name: 'Weighted Avg Rate', path: 'valuation.debtSchedule.summary.weightedAverageRate', type: 'number', sampleValue: 6.5 },
        ],
      },
      {
        id: 'valuation.capexDepreciation',
        name: 'CapEx & Depreciation',
        path: 'valuation.capexDepreciation',
        type: 'object',
        children: [
          { id: 'valuation.capexDepreciation.summary.totalPPE', name: 'Total PPE', path: 'valuation.capexDepreciation.summary.totalPPE', type: 'number', sampleValue: 3000000 },
          { id: 'valuation.capexDepreciation.summary.annualDepreciation', name: 'Annual Depreciation', path: 'valuation.capexDepreciation.summary.annualDepreciation', type: 'number', sampleValue: 300000 },
        ],
      },
      {
        id: 'valuation.financialStatements',
        name: 'Financial Statements',
        path: 'valuation.financialStatements',
        type: 'object',
        children: [
          { id: 'valuation.financialStatements.current.revenue', name: 'Revenue', path: 'valuation.financialStatements.current.revenue', type: 'number', sampleValue: 10000000, isRequired: true },
          { id: 'valuation.financialStatements.current.ebitda', name: 'EBITDA', path: 'valuation.financialStatements.current.ebitda', type: 'number', sampleValue: 2500000, isRequired: true },
          { id: 'valuation.financialStatements.current.grossMargin', name: 'Gross Margin', path: 'valuation.financialStatements.current.grossMargin', type: 'number', sampleValue: 75 },
        ],
      },
    ],
  },
  {
    id: 'capTable',
    name: 'Cap Table',
    path: 'capTable',
    type: 'object',
    description: 'Capitalization table data',
    children: [
      {
        id: 'capTable.summary',
        name: 'Summary',
        path: 'capTable.summary',
        type: 'object',
        children: [
          { id: 'capTable.summary.commonShares', name: 'Common Shares', path: 'capTable.summary.commonShares', type: 'number', sampleValue: 10000000, isRequired: true },
          { id: 'capTable.summary.preferredShares', name: 'Preferred Shares', path: 'capTable.summary.preferredShares', type: 'number', sampleValue: 5000000 },
          { id: 'capTable.summary.optionsOutstanding', name: 'Options Outstanding', path: 'capTable.summary.optionsOutstanding', type: 'number', sampleValue: 2000000, isRequired: true },
          { id: 'capTable.summary.warrantsOutstanding', name: 'Warrants Outstanding', path: 'capTable.summary.warrantsOutstanding', type: 'number', sampleValue: 100000 },
          { id: 'capTable.summary.fullyDilutedShares', name: 'Fully Diluted Shares', path: 'capTable.summary.fullyDilutedShares', type: 'number', sampleValue: 17100000, isRequired: true },
          { id: 'capTable.summary.optionPoolSize', name: 'Option Pool Size', path: 'capTable.summary.optionPoolSize', type: 'number', sampleValue: 15 },
          { id: 'capTable.summary.totalLiquidationPreference', name: 'Total Liquidation Preference', path: 'capTable.summary.totalLiquidationPreference', type: 'number', sampleValue: 50000000 },
        ],
      },
    ],
  },
  {
    id: 'dlom',
    name: 'DLOM',
    path: 'dlom',
    type: 'object',
    description: 'Discount for Lack of Marketability',
    children: [
      { id: 'dlom.dlomPercentage', name: 'DLOM Percentage', path: 'dlom.dlomPercentage', type: 'number', sampleValue: 30, isRequired: true },
      {
        id: 'dlom.modelResults',
        name: 'Model Results',
        path: 'dlom.modelResults',
        type: 'object',
        children: [
          { id: 'dlom.modelResults.chaffee', name: 'Chaffee Model', path: 'dlom.modelResults.chaffee', type: 'number', sampleValue: 28 },
          { id: 'dlom.modelResults.finnerty', name: 'Finnerty Model', path: 'dlom.modelResults.finnerty', type: 'number', sampleValue: 32 },
          { id: 'dlom.modelResults.ghaidarov', name: 'Ghaidarov Model', path: 'dlom.modelResults.ghaidarov', type: 'number', sampleValue: 30 },
          { id: 'dlom.modelResults.longstaff', name: 'Longstaff Model', path: 'dlom.modelResults.longstaff', type: 'number', sampleValue: 31 },
        ],
      },
    ],
  },
]

interface SourcePathExplorerProps {
  onSelectPath: (path: string) => void
  selectedModule?: string
  className?: string
}

export function SourcePathExplorer({ onSelectPath, selectedModule, className }: SourcePathExplorerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  const handleCopyPath = useCallback(async (path: string) => {
    await navigator.clipboard.writeText(path)
    setCopiedPath(path)
    setTimeout(() => setCopiedPath(null), 2000)
    onSelectPath(path)
  }, [onSelectPath])

  const getTypeIcon = (type: DataNode['type']) => {
    switch (type) {
      case 'object':
        return <Folder className="h-4 w-4 text-blue-500" />
      case 'array':
        return <Database className="h-4 w-4 text-purple-500" />
      case 'string':
        return <File className="h-4 w-4 text-green-500" />
      case 'number':
        return <File className="h-4 w-4 text-orange-500" />
      case 'boolean':
        return <File className="h-4 w-4 text-pink-500" />
      case 'date':
        return <File className="h-4 w-4 text-cyan-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeBadgeColor = (type: DataNode['type']) => {
    switch (type) {
      case 'object':
        return 'bg-blue-100 text-blue-800'
      case 'array':
        return 'bg-purple-100 text-purple-800'
      case 'string':
        return 'bg-green-100 text-green-800'
      case 'number':
        return 'bg-orange-100 text-orange-800'
      case 'boolean':
        return 'bg-pink-100 text-pink-800'
      case 'date':
        return 'bg-cyan-100 text-cyan-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderNode = (node: DataNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isLeaf = !hasChildren

    // Filter by search
    if (searchQuery) {
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.path.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch && !hasChildren) return null
    }

    // Filter by selected module
    if (selectedModule && !node.path.startsWith(selectedModule)) {
      return null
    }

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent',
            isLeaf && 'cursor-pointer',
            copiedPath === node.path && 'bg-green-50'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="rounded p-0.5 hover:bg-accent"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          {getTypeIcon(node.type)}

          <span className="flex-1 text-sm font-medium">{node.name}</span>

          {node.isRequired && (
            <Badge variant="destructive" className="h-5 px-1 text-xs">
              Required
            </Badge>
          )}

          <Badge className={cn('h-5 px-1 text-xs', getTypeBadgeColor(node.type))}>
            {node.type}
          </Badge>

          {isLeaf && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopyPath(node.path)}
                  >
                    {copiedPath === node.path ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy path: {node.path}</p>
                  {node.sampleValue && (
                    <p className="text-xs text-muted-foreground">Sample: {JSON.stringify(node.sampleValue)}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col rounded-lg border bg-card', className)}>
      <div className="border-b p-3">
        <h3 className="mb-2 text-sm font-semibold">Data Source Explorer</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        {dataStructure.map(node => renderNode(node))}
      </ScrollArea>

      <div className="border-t p-3">
        <p className="text-xs text-muted-foreground">
          Click <Copy className="inline h-3 w-3" /> to copy path
        </p>
      </div>
    </div>
  )
}