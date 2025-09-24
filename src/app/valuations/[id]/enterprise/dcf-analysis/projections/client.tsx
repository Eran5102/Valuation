'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  FileSpreadsheet,
  AlertCircle,
  Save,
  Download,
  TrendingUp,
  DollarSign,
  Percent,
  Calculator,
  BarChart3,
  Info,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts'
import { useDCFModel } from '@/contexts/DCFModelOptimized'

interface FinancialStatement {
  year: number
  isHistorical: boolean
  // Income Statement
  revenue: number
  revenueGrowth: number
  cogs: number
  grossProfit: number
  grossMargin: number
  sgaExpense: number
  rdExpense: number
  otherOpex: number
  ebitda: number
  ebitdaMargin: number
  depreciation: number
  amortization: number
  ebit: number
  interestExpense: number
  otherIncome: number
  ebt: number
  taxes: number
  netIncome: number
  netMargin: number
  // Balance Sheet Items
  cashAndEquivalents: number
  accountsReceivable: number
  inventory: number
  otherCurrentAssets: number
  totalCurrentAssets: number
  ppe: number
  intangibleAssets: number
  otherLongTermAssets: number
  totalAssets: number
  accountsPayable: number
  accruedExpenses: number
  shortTermDebt: number
  otherCurrentLiabilities: number
  totalCurrentLiabilities: number
  longTermDebt: number
  otherLongTermLiabilities: number
  totalLiabilities: number
  commonStock: number
  retainedEarnings: number
  totalEquity: number
  // Cash Flow Items
  operatingCashFlow: number
  capex: number
  changeInNWC: number
  freeCashFlow: number
  unleveredFreeCashFlow: number
  // Metrics
  roic: number
  roe: number
  currentRatio: number
  debtToEquity: number
  interestCoverage: number
}

interface ProjectedFinancialsClientProps {
  valuationId: string
}

export function ProjectedFinancialsClient({ valuationId }: ProjectedFinancialsClientProps) {
  // Use DCF Model Context
  const {
    modelData,
    assumptions,
    debtSchedule,
    workingCapital,
    capexDepreciation,
    wacc,
    financialStatements,
    dcfValuation,
    isLoading: contextLoading,
    isSaving: contextSaving,
    hasChanges: contextHasChanges,
    updateAssumptions,
    setCalculationMethod,
    recalculateAll,
    saveModel,
    loadModel,
  } = useDCFModel()

  const [localFinancials, setLocalFinancials] = useState<FinancialStatement[]>([])
  const [localDcfSummary, setLocalDcfSummary] = useState({
    wacc: 12,
    terminalGrowth: 2.5,
    enterpriseValue: 0,
    netDebt: 0,
    equityValue: 0,
    sharesOutstanding: 10000000,
    valuePerShare: 0,
    terminalValue: 0,
    pvOfCashFlows: 0,
    pvOfTerminalValue: 0,
  })
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Sync with DCF Model Context
  useEffect(() => {
    if (financialStatements && financialStatements.length > 0) {
      // Convert context financial statements to local format
      const convertedStatements = financialStatements.map((stmt) => ({
        ...stmt,
        sgaExpense: stmt.operatingExpenses * 0.7,
        rdExpense: stmt.operatingExpenses * 0.2,
        otherOpex: stmt.operatingExpenses * 0.1,
        otherIncome: 50000,
        netMargin: (stmt.netIncome / stmt.revenue) * 100,
        cashAndEquivalents: assumptions?.cashBalance || stmt.revenue * 0.1,
        accountsReceivable: stmt.revenue * 0.12,
        inventory: stmt.cogs * 0.15,
        otherCurrentAssets: stmt.revenue * 0.02,
        totalCurrentAssets: stmt.totalAssets * 0.4,
        ppe: stmt.totalAssets * 0.5,
        intangibleAssets: stmt.totalAssets * 0.08,
        otherLongTermAssets: stmt.totalAssets * 0.02,
        accountsPayable: stmt.cogs * 0.1,
        accruedExpenses: stmt.operatingExpenses * 0.1,
        shortTermDebt: stmt.totalLiabilities * 0.1,
        otherCurrentLiabilities: stmt.revenue * 0.03,
        totalCurrentLiabilities: stmt.totalLiabilities * 0.3,
        longTermDebt: stmt.totalLiabilities * 0.6,
        otherLongTermLiabilities: stmt.totalLiabilities * 0.1,
        commonStock: 1000000,
        retainedEarnings: stmt.totalEquity - 1000000,
        roic:
          stmt.totalAssets > 0
            ? ((stmt.ebit * (1 - (assumptions?.effectiveTaxRate || 25) / 100)) /
                (stmt.totalAssets - (assumptions?.cashBalance || 0))) *
              100
            : 0,
        roe: stmt.totalEquity > 0 ? (stmt.netIncome / stmt.totalEquity) * 100 : 0,
        currentRatio:
          stmt.totalLiabilities > 0 ? (stmt.totalAssets * 0.4) / (stmt.totalLiabilities * 0.3) : 0,
        debtToEquity: stmt.totalEquity > 0 ? stmt.netDebt / stmt.totalEquity : 0,
        interestCoverage: stmt.interestExpense > 0 ? stmt.ebit / stmt.interestExpense : 0,
      }))
      setLocalFinancials(convertedStatements)
    }

    if (dcfValuation) {
      setLocalDcfSummary({
        wacc: dcfValuation.wacc,
        terminalGrowth: dcfValuation.terminalGrowthRate,
        enterpriseValue: dcfValuation.enterpriseValue,
        netDebt: dcfValuation.lessDebt - dcfValuation.plusCash,
        equityValue: dcfValuation.equityValue,
        sharesOutstanding: dcfValuation.sharesOutstanding,
        valuePerShare: dcfValuation.valuePerShare,
        terminalValue: dcfValuation.terminalValue,
        pvOfCashFlows: dcfValuation.sumOfPVCashFlows,
        pvOfTerminalValue: dcfValuation.presentValueOfTerminal,
      })
    }
  }, [financialStatements, dcfValuation, assumptions])

  // Load data if not available from context
  useEffect(() => {
    if (!modelData && !contextLoading) {
      loadModel(valuationId)
    }
  }, [modelData, contextLoading, loadModel, valuationId])

  const loadAllData = async () => {
    // This is now handled by the DCF Model Context
    if (!modelData) {
      await loadModel(valuationId)
    }
  }

  const generateIntegratedProjections = (
    debtData: any,
    wcData: any,
    capexData: any,
    waccData: any
  ): FinancialStatement[] => {
    const currentYear = assumptions?.baseYear || new Date().getFullYear()
    const statements: FinancialStatement[] = []
    const historicalYears = assumptions?.historicalYears || 3
    const projectionYears = assumptions?.projectionYears || 5
    const effectiveTaxRate = (assumptions?.effectiveTaxRate || 25) / 100

    // Generate historical + projected years based on assumptions
    for (let i = -historicalYears + 1; i <= projectionYears; i++) {
      const year = currentYear + i
      const isHistorical = i <= 0

      // Base revenue and growth
      let revenue = 10000000
      let revenueGrowth = 0

      if (isHistorical) {
        revenue = 10000000 * Math.pow(1.15, i + 3)
        revenueGrowth = i === -2 ? 0 : 15
      } else {
        const growthRates = [20, 18, 15, 12, 10]
        revenueGrowth = growthRates[i - 1] || 10
        revenue = statements[statements.length - 1].revenue * (1 + revenueGrowth / 100)
      }

      // Operating expenses
      const cogs = revenue * 0.4
      const grossProfit = revenue - cogs
      const grossMargin = (grossProfit / revenue) * 100

      const sgaExpense = revenue * 0.25
      const rdExpense = revenue * 0.08
      const otherOpex = revenue * 0.02

      const ebitda = grossProfit - sgaExpense - rdExpense - otherOpex
      const ebitdaMargin = (ebitda / revenue) * 100

      // Get depreciation based on method from assumptions
      let depreciation = revenue * 0.03
      if (assumptions?.depreciationMethod === 'schedule' && capexData?.projections?.[i - 1]) {
        depreciation = capexData.projections[i - 1].depreciation
      } else if (assumptions?.depreciationMethod === 'percentage') {
        depreciation = revenue * ((assumptions.depreciationPercent || 3) / 100)
      } else if (assumptions?.depreciationMethod === 'manual') {
        // Would need manual input array from UI
        depreciation = revenue * 0.03
      }
      const amortization = revenue * 0.005

      const ebit = ebitda - depreciation - amortization

      // Get interest expense from debt schedule
      const interestExpense =
        debtData?.projections?.[i - 1]?.interestExpense ||
        debtData?.debtItems?.reduce(
          (sum: number, item: any) => sum + item.currentBalance * (item.interestRate / 100),
          0
        ) ||
        200000

      const otherIncome = 50000
      const ebt = ebit - interestExpense + otherIncome

      const taxes = Math.max(0, ebt * effectiveTaxRate)
      const netIncome = ebt - taxes
      const netMargin = (netIncome / revenue) * 100

      // Balance Sheet Items
      const cashAndEquivalents = revenue * 0.1

      // Get working capital items based on method
      let accountsReceivable = revenue * 0.12
      if (assumptions?.workingCapitalMethod === 'detailed' && wcData?.projectedData?.[i - 1]) {
        accountsReceivable = wcData.projectedData[i - 1].accountsReceivable
      } else if (assumptions?.workingCapitalMethod === 'days' && assumptions?.daysReceivables) {
        accountsReceivable = (revenue * assumptions.daysReceivables) / 365
      }
      const inventory = wcData?.projectedData?.[i - 1]?.inventory || cogs * 0.15
      const otherCurrentAssets = revenue * 0.02
      const totalCurrentAssets =
        cashAndEquivalents + accountsReceivable + inventory + otherCurrentAssets

      // Get PP&E from capex schedule
      const ppe = capexData?.projections?.[i - 1]?.netPPE || revenue * 0.5
      const intangibleAssets = revenue * 0.1
      const otherLongTermAssets = revenue * 0.05
      const totalAssets = totalCurrentAssets + ppe + intangibleAssets + otherLongTermAssets

      // Liabilities
      const accountsPayable = wcData?.projectedData?.[i - 1]?.accountsPayable || cogs * 0.1
      const accruedExpenses = sgaExpense * 0.1
      const shortTermDebt =
        debtData?.debtItems
          ?.filter((item: any) => {
            const maturityYear = new Date(item.maturityDate).getFullYear() - currentYear
            return maturityYear <= 1
          })
          .reduce((sum: number, item: any) => sum + item.currentBalance, 0) || 500000

      const otherCurrentLiabilities = revenue * 0.03
      const totalCurrentLiabilities =
        accountsPayable + accruedExpenses + shortTermDebt + otherCurrentLiabilities

      // Get long-term debt from debt schedule
      const longTermDebt = debtData?.projections?.[i - 1]?.endingBalance || revenue * 0.3
      const otherLongTermLiabilities = revenue * 0.05
      const totalLiabilities = totalCurrentLiabilities + longTermDebt + otherLongTermLiabilities

      // Equity
      const commonStock = 1000000
      const previousRetainedEarnings =
        i === -2 ? 5000000 : statements[statements.length - 1]?.retainedEarnings || 5000000
      const retainedEarnings = previousRetainedEarnings + netIncome
      const totalEquity = commonStock + retainedEarnings

      // Cash Flow Items
      const changeInNWC =
        wcData?.projectedData?.[i - 1]?.changeInNWC ||
        (i === -2 ? 0 : -(revenue - statements[statements.length - 1]?.revenue || 0) * 0.1)

      // Get capex based on method
      let capex = -(revenue * 0.05)
      if (assumptions?.capexMethod === 'schedule' && capexData?.projections?.[i - 1]) {
        capex = -capexData.projections[i - 1].totalCapex
      } else if (assumptions?.capexMethod === 'percentage') {
        capex = -(revenue * ((assumptions.capexPercent || 5) / 100))
      } else if (assumptions?.capexMethod === 'growth') {
        const maintenanceCapex = revenue * ((assumptions.maintenanceCapexPercent || 3) / 100)
        const growthCapex = revenue * ((assumptions.growthCapexPercent || 2) / 100)
        capex = -(maintenanceCapex + growthCapex)
      }

      const operatingCashFlow = netIncome + depreciation + amortization - changeInNWC
      const freeCashFlow = operatingCashFlow + capex
      const unleveredFreeCashFlow =
        ebit * (1 - effectiveTaxRate) + depreciation + amortization - changeInNWC + capex

      // Metrics
      const roic =
        totalAssets > 0
          ? ((ebit * (1 - effectiveTaxRate)) / (totalAssets - cashAndEquivalents)) * 100
          : 0
      const roe = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0
      const currentRatio =
        totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0
      const debtToEquity = totalEquity > 0 ? (shortTermDebt + longTermDebt) / totalEquity : 0
      const interestCoverage = interestExpense > 0 ? ebit / interestExpense : 0

      statements.push({
        year,
        isHistorical,
        revenue,
        revenueGrowth,
        cogs,
        grossProfit,
        grossMargin,
        sgaExpense,
        rdExpense,
        otherOpex,
        ebitda,
        ebitdaMargin,
        depreciation,
        amortization,
        ebit,
        interestExpense,
        otherIncome,
        ebt,
        taxes,
        netIncome,
        netMargin,
        cashAndEquivalents,
        accountsReceivable,
        inventory,
        otherCurrentAssets,
        totalCurrentAssets,
        ppe,
        intangibleAssets,
        otherLongTermAssets,
        totalAssets,
        accountsPayable,
        accruedExpenses,
        shortTermDebt,
        otherCurrentLiabilities,
        totalCurrentLiabilities,
        longTermDebt,
        otherLongTermLiabilities,
        totalLiabilities,
        commonStock,
        retainedEarnings,
        totalEquity,
        operatingCashFlow,
        capex,
        changeInNWC,
        freeCashFlow,
        unleveredFreeCashFlow,
        roic,
        roe,
        currentRatio,
        debtToEquity,
        interestCoverage,
      })
    }

    // Calculate DCF valuation
    calculateDCFValuation(statements)

    return statements
  }

  const generateSampleFinancials = (): FinancialStatement[] => {
    return generateIntegratedProjections(null, null, null, null)
  }

  const calculateDCFValuation = (statements: FinancialStatement[]) => {
    const projectedStatements = statements.filter((s) => !s.isHistorical)
    const wacc = localDcfSummary.wacc / 100
    const terminalGrowth = localDcfSummary.terminalGrowth / 100

    // Calculate PV of cash flows
    let pvOfCashFlows = 0
    projectedStatements.forEach((statement, index) => {
      const discountFactor = Math.pow(1 + wacc, index + 1)
      pvOfCashFlows += statement.unleveredFreeCashFlow / discountFactor
    })

    // Calculate terminal value
    const lastCashFlow = projectedStatements[projectedStatements.length - 1].unleveredFreeCashFlow
    const terminalCashFlow = lastCashFlow * (1 + terminalGrowth)
    const terminalValue = terminalCashFlow / (wacc - terminalGrowth)
    const pvOfTerminalValue = terminalValue / Math.pow(1 + wacc, projectedStatements.length)

    // Calculate enterprise and equity value
    const enterpriseValue = pvOfCashFlows + pvOfTerminalValue
    const currentStatement = statements.find((s) => s.year === new Date().getFullYear())
    const netDebt =
      (currentStatement?.shortTermDebt || 0) +
      (currentStatement?.longTermDebt || 0) -
      (currentStatement?.cashAndEquivalents || 0)
    const equityValue = enterpriseValue - netDebt
    const valuePerShare = equityValue / localDcfSummary.sharesOutstanding

    setLocalDcfSummary((prev) => ({
      ...prev,
      enterpriseValue,
      netDebt,
      equityValue,
      valuePerShare,
      terminalValue,
      pvOfCashFlows,
      pvOfTerminalValue,
    }))

    setHasChanges(true)
  }

  const handleSave = async () => {
    // Use context save method which saves the entire DCF model
    await saveModel()
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      await recalculateAll()
      toast.success('DCF model recalculated successfully')
    } catch (error) {
      toast.error('Failed to recalculate DCF model')
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleExport = () => {
    const csv = convertToCSV(localFinancials)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-projections-${valuationId}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: FinancialStatement[]) => {
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map((row) => Object.values(row).join(','))
    return [headers, ...rows].join('\n')
  }

  const incomeStatementColumns: ColumnDef<FinancialStatement>[] = [
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.year}
          {row.original.isHistorical && (
            <Badge variant="outline" className="ml-2 text-xs">
              Actual
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => `$${(row.original.revenue / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'revenueGrowth',
      header: 'Growth %',
      cell: ({ row }) => `${row.original.revenueGrowth.toFixed(1)}%`,
    },
    {
      accessorKey: 'grossProfit',
      header: 'Gross Profit',
      cell: ({ row }) => `$${(row.original.grossProfit / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'grossMargin',
      header: 'Gross Margin',
      cell: ({ row }) => `${row.original.grossMargin.toFixed(1)}%`,
    },
    {
      accessorKey: 'ebitda',
      header: 'EBITDA',
      cell: ({ row }) => `$${(row.original.ebitda / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'ebitdaMargin',
      header: 'EBITDA %',
      cell: ({ row }) => `${row.original.ebitdaMargin.toFixed(1)}%`,
    },
    {
      accessorKey: 'netIncome',
      header: 'Net Income',
      cell: ({ row }) => (
        <div className={row.original.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
          ${(row.original.netIncome / 1000000).toFixed(2)}M
        </div>
      ),
    },
  ]

  const cashFlowColumns: ColumnDef<FinancialStatement>[] = [
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => row.original.year,
    },
    {
      accessorKey: 'operatingCashFlow',
      header: 'Operating CF',
      cell: ({ row }) => `$${(row.original.operatingCashFlow / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'capex',
      header: 'Capex',
      cell: ({ row }) => (
        <div className="text-red-600">${(row.original.capex / 1000000).toFixed(2)}M</div>
      ),
    },
    {
      accessorKey: 'changeInNWC',
      header: 'Change in NWC',
      cell: ({ row }) => (
        <div className={row.original.changeInNWC > 0 ? 'text-green-600' : 'text-red-600'}>
          ${(row.original.changeInNWC / 1000000).toFixed(2)}M
        </div>
      ),
    },
    {
      accessorKey: 'freeCashFlow',
      header: 'Free Cash Flow',
      cell: ({ row }) => (
        <div className="font-semibold">${(row.original.freeCashFlow / 1000000).toFixed(2)}M</div>
      ),
    },
    {
      accessorKey: 'unleveredFreeCashFlow',
      header: 'Unlevered FCF',
      cell: ({ row }) => (
        <div className="font-semibold text-blue-600">
          ${(row.original.unleveredFreeCashFlow / 1000000).toFixed(2)}M
        </div>
      ),
    },
  ]

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileSpreadsheet className="h-6 w-6" />
            Projected Financials
          </h1>
          <p className="mt-1 text-muted-foreground">
            Integrated financial statements and DCF valuation
          </p>
        </div>
        <div className="flex gap-2">
          {contextHasChanges && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleRecalculate} disabled={isRecalculating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={contextSaving}>
            <Save className="mr-2 h-4 w-4" />
            {contextSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Calculation Method Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calculation Methods
          </CardTitle>
          <CardDescription>
            Configure how different components are calculated in the DCF model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="depreciation-method">Depreciation</Label>
              <Select
                value={assumptions?.depreciationMethod || 'percentage'}
                onValueChange={(value) => {
                  setCalculationMethod('depreciation', {
                    depreciation: { method: value as any },
                  })
                }}
              >
                <SelectTrigger id="depreciation-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">From Schedule</SelectItem>
                  <SelectItem value="percentage">% of Revenue</SelectItem>
                  <SelectItem value="manual">Manual Input</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wc-method">Working Capital</Label>
              <Select
                value={assumptions?.workingCapitalMethod || 'percentage'}
                onValueChange={(value) => {
                  setCalculationMethod('workingCapital', {
                    workingCapital: { method: value as any },
                  })
                }}
              >
                <SelectTrigger id="wc-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed Schedule</SelectItem>
                  <SelectItem value="percentage">% of Revenue</SelectItem>
                  <SelectItem value="days">Days Method</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capex-method">Capex</Label>
              <Select
                value={assumptions?.capexMethod || 'percentage'}
                onValueChange={(value) => {
                  setCalculationMethod('capex', {
                    capex: { method: value as any },
                  })
                }}
              >
                <SelectTrigger id="capex-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">From Schedule</SelectItem>
                  <SelectItem value="percentage">% of Revenue</SelectItem>
                  <SelectItem value="growth">Growth-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-method">Interest Expense</Label>
              <Select
                value={assumptions?.interestMethod || 'schedule'}
                onValueChange={(value) => {
                  setCalculationMethod('interest', {
                    interest: { method: value as any },
                  })
                }}
              >
                <SelectTrigger id="interest-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Debt Schedule</SelectItem>
                  <SelectItem value="average">Average Rate</SelectItem>
                  <SelectItem value="fixed">Fixed Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tax Rate:</span>
              <span className="ml-2 font-semibold">{assumptions?.effectiveTaxRate || 25}%</span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({assumptions?.taxCalculationMethod === 'detailed' ? 'Detailed' : 'Effective'})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Projection Years:</span>
              <span className="ml-2 font-semibold">{assumptions?.projectionYears || 5}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Discounting Convention:</span>
              <span className="ml-2 font-semibold">
                {assumptions?.discountingConvention || 'Mid-Year'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DCF Valuation Summary */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>DCF Valuation Summary</CardTitle>
          <CardDescription>Discounted cash flow analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Enterprise Value</div>
              <div className="text-2xl font-bold text-primary">
                ${(localDcfSummary.enterpriseValue / 1000000).toFixed(1)}M
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Equity Value</div>
              <div className="text-2xl font-bold">
                ${(localDcfSummary.equityValue / 1000000).toFixed(1)}M
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Value per Share</div>
              <div className="text-2xl font-bold text-green-600">
                ${localDcfSummary.valuePerShare.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Terminal Value %</div>
              <div className="text-2xl font-bold">
                {localDcfSummary.enterpriseValue > 0
                  ? (
                      (localDcfSummary.pvOfTerminalValue / localDcfSummary.enterpriseValue) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6 text-sm">
            <div>
              <span className="text-muted-foreground">WACC:</span>
              <span className="ml-2 font-semibold">{localDcfSummary.wacc}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Terminal Growth:</span>
              <span className="ml-2 font-semibold">{localDcfSummary.terminalGrowth}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Net Debt:</span>
              <span className="ml-2 font-semibold">
                ${(localDcfSummary.netDebt / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="income" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="income">Income Statement</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Statement Projections</CardTitle>
              <CardDescription>Historical and projected P&L statements</CardDescription>
            </CardHeader>
            <CardContent>
              <EditableDataTable columns={incomeStatementColumns} data={localFinancials} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Projections</CardTitle>
              <CardDescription>Operating, investing, and free cash flows</CardDescription>
            </CardHeader>
            <CardContent>
              <EditableDataTable columns={cashFlowColumns} data={localFinancials} />

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>5-Year Total FCF:</strong> $
                  {(
                    localFinancials
                      .filter((s) => !s.isHistorical)
                      .reduce((sum, s) => sum + s.freeCashFlow, 0) / 1000000
                  ).toFixed(1)}
                  M
                  <br />
                  <strong>Average FCF Conversion:</strong>{' '}
                  {(
                    (localFinancials
                      .filter((s) => !s.isHistorical)
                      .reduce((sum, s, _, arr) => sum + s.freeCashFlow / s.revenue, 0) /
                      localFinancials.filter((s) => !s.isHistorical).length) *
                    100
                  ).toFixed(1)}
                  %
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet Projections</CardTitle>
              <CardDescription>Assets, liabilities, and equity projections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localFinancials.map((statement) => (
                  <div key={statement.year} className="rounded-lg border p-4">
                    <h3 className="mb-3 font-semibold">
                      {statement.year}
                      {statement.isHistorical && (
                        <Badge variant="outline" className="ml-2">
                          Historical
                        </Badge>
                      )}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="mb-2 font-medium text-muted-foreground">Assets</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Current Assets</span>
                            <span>${(statement.totalCurrentAssets / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PP&E</span>
                            <span>${(statement.ppe / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-semibold">
                            <span>Total Assets</span>
                            <span>${(statement.totalAssets / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-2 font-medium text-muted-foreground">Liabilities</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Current Liabilities</span>
                            <span>
                              ${(statement.totalCurrentLiabilities / 1000000).toFixed(1)}M
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Long-term Debt</span>
                            <span>${(statement.longTermDebt / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-semibold">
                            <span>Total Liabilities</span>
                            <span>${(statement.totalLiabilities / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-2 font-medium text-muted-foreground">Equity</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Common Stock</span>
                            <span>${(statement.commonStock / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Retained Earnings</span>
                            <span>${(statement.retainedEarnings / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between border-t pt-1 font-semibold">
                            <span>Total Equity</span>
                            <span>${(statement.totalEquity / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Metrics</CardTitle>
              <CardDescription>Key performance indicators and ratios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={localFinancials}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="grossMargin"
                    stroke="#8884d8"
                    name="Gross Margin %"
                  />
                  <Line
                    type="monotone"
                    dataKey="ebitdaMargin"
                    stroke="#82ca9d"
                    name="EBITDA Margin %"
                  />
                  <Line type="monotone" dataKey="netMargin" stroke="#ffc658" name="Net Margin %" />
                  <Line type="monotone" dataKey="roic" stroke="#ff7300" name="ROIC %" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Profitability Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {localFinancials
                      .filter((s) => !s.isHistorical)
                      .map((s) => (
                        <div key={s.year} className="flex justify-between">
                          <span>{s.year}</span>
                          <div className="space-x-4">
                            <span>ROE: {s.roe.toFixed(1)}%</span>
                            <span>ROIC: {s.roic.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Leverage Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {localFinancials
                      .filter((s) => !s.isHistorical)
                      .map((s) => (
                        <div key={s.year} className="flex justify-between">
                          <span>{s.year}</span>
                          <div className="space-x-4">
                            <span>D/E: {s.debtToEquity.toFixed(2)}x</span>
                            <span>Interest Coverage: {s.interestCoverage.toFixed(1)}x</span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & EBITDA Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={localFinancials}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar yAxisId="left" dataKey="ebitda" fill="#82ca9d" name="EBITDA" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenueGrowth"
                      stroke="#ff7300"
                      name="Growth %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Free Cash Flow Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={localFinancials}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Legend />
                    <Bar dataKey="unleveredFreeCashFlow" fill="#8884d8" name="Unlevered FCF" />
                    <Bar dataKey="freeCashFlow" fill="#82ca9d" name="Levered FCF" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>DCF Valuation Waterfall</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    { name: 'PV of Cash Flows', value: localDcfSummary.pvOfCashFlows / 1000000 },
                    {
                      name: 'PV of Terminal Value',
                      value: localDcfSummary.pvOfTerminalValue / 1000000,
                    },
                    { name: 'Enterprise Value', value: localDcfSummary.enterpriseValue / 1000000 },
                    { name: 'Less: Net Debt', value: -localDcfSummary.netDebt / 1000000 },
                    { name: 'Equity Value', value: localDcfSummary.equityValue / 1000000 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(1)}M`} />
                  <Bar dataKey="value" fill={(data) => (data.value < 0 ? '#ef4444' : '#10b981')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
