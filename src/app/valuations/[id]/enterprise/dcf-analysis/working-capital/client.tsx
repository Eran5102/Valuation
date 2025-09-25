'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { Slider } from '@/components/ui/slider'
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Save,
  Calculator,
  BarChart3,
  Info,
  Package,
  Users,
  CreditCard,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDCFModel } from '@/contexts/DCFModelContext'
import { WorkingCapitalData, WorkingCapitalPeriod } from '@/types/dcf'
import { ColumnDef } from '@tanstack/react-table'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface WorkingCapitalItem {
  year: number
  revenue: number
  cogs: number
  operatingExpenses: number
  accountsReceivable: number
  inventory: number
  prepaidExpenses: number
  otherCurrentAssets: number
  accountsPayable: number
  accruedExpenses: number
  deferredRevenue: number
  otherCurrentLiabilities: number
  netWorkingCapital: number
  changeInNWC: number
  nwcAsPercentOfRevenue: number
}

interface WorkingCapitalAssumptions {
  daysReceivables: number
  daysInventory: number
  daysPayables: number
  prepaidExpensesPercent: number
  accruedExpensesPercent: number
  deferredRevenuePercent: number
  otherCurrentAssetsPercent: number
  otherCurrentLiabsPercent: number
  projectionMethod: 'days' | 'percentage' | 'fixed'
  targetNWCPercent: number
}

interface WorkingCapitalClientProps {
  valuationId: string
}

export function WorkingCapitalClient({ valuationId }: WorkingCapitalClientProps) {
  // Use DCF Model Context
  const {
    workingCapital,
    assumptions: coreAssumptions,
    updateWorkingCapital,
    updateAssumptions,
    saveModel,
    isSaving: contextSaving,
    hasChanges: contextHasChanges,
    recalculateAll,
  } = useDCFModel()

  const [historicalData, setHistoricalData] = useState<WorkingCapitalItem[]>([])
  const [projectedData, setProjectedData] = useState<WorkingCapitalItem[]>([])
  const [assumptions, setAssumptions] = useState<WorkingCapitalAssumptions>({
    daysReceivables: 45,
    daysInventory: 60,
    daysPayables: 30,
    prepaidExpensesPercent: 2,
    accruedExpensesPercent: 5,
    deferredRevenuePercent: 3,
    otherCurrentAssetsPercent: 1,
    otherCurrentLiabsPercent: 2,
    projectionMethod: 'days',
    targetNWCPercent: 15,
  })
  const [financialData, setFinancialData] = useState({
    baseRevenue: 10000000,
    revenueGrowthRates: [20, 18, 15, 12, 10],
    grossMargin: 60,
    opexPercent: 40,
  })
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadWorkingCapital()
  }, [valuationId])

  // Recalculate projections when assumptions or financial data change
  useEffect(() => {
    calculateProjections()
  }, [assumptions, financialData, historicalData])

  const loadWorkingCapital = async () => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/working-capital`)
      if (response.ok) {
        const data = await response.json()
        setHistoricalData(data.historicalData || generateSampleHistorical())
        setAssumptions(data.assumptions || assumptions)
        setFinancialData(data.financialData || financialData)
      } else {
        // Generate sample historical data if none exists
        setHistoricalData(generateSampleHistorical())
      }
    } catch (error) {
      console.error('Error loading working capital:', error)
      setHistoricalData(generateSampleHistorical())
    }
  }

  const generateSampleHistorical = (): WorkingCapitalItem[] => {
    const currentYear = new Date().getFullYear()
    const historical: WorkingCapitalItem[] = []
    let baseRevenue = 5000000

    for (let i = 2; i >= 0; i--) {
      const year = currentYear - i
      const revenue = baseRevenue * Math.pow(1.15, 2 - i)
      const cogs = revenue * 0.4
      const operatingExpenses = revenue * 0.35

      const ar = (revenue * 45) / 365
      const inventory = (cogs * 60) / 365
      const prepaid = revenue * 0.02
      const otherCA = revenue * 0.01

      const ap = (cogs * 30) / 365
      const accrued = operatingExpenses * 0.05
      const deferred = revenue * 0.03
      const otherCL = revenue * 0.02

      const nwc = ar + inventory + prepaid + otherCA - ap - accrued - deferred - otherCL

      historical.push({
        year,
        revenue,
        cogs,
        operatingExpenses,
        accountsReceivable: ar,
        inventory,
        prepaidExpenses: prepaid,
        otherCurrentAssets: otherCA,
        accountsPayable: ap,
        accruedExpenses: accrued,
        deferredRevenue: deferred,
        otherCurrentLiabilities: otherCL,
        netWorkingCapital: nwc,
        changeInNWC: i > 0 ? nwc - (historical[i - 1]?.netWorkingCapital || 0) : 0,
        nwcAsPercentOfRevenue: (nwc / revenue) * 100,
      })
    }

    return historical
  }

  const calculateProjections = () => {
    const projections: WorkingCapitalItem[] = []
    let previousNWC = historicalData[historicalData.length - 1]?.netWorkingCapital || 0
    const projectionYears = coreAssumptions?.projectionYears || 5
    const baseYear = coreAssumptions?.baseYear || new Date().getFullYear()

    for (let i = 0; i < projectionYears; i++) {
      const year = baseYear + i + 1
      const revenue =
        financialData.baseRevenue *
        financialData.revenueGrowthRates
          .slice(0, i + 1)
          .reduce((acc, rate) => acc * (1 + rate / 100), 1)

      const cogs = revenue * (1 - financialData.grossMargin / 100)
      const operatingExpenses = revenue * (financialData.opexPercent / 100)

      let ar, inventory, ap, nwc

      if (assumptions.projectionMethod === 'days') {
        ar = (revenue * assumptions.daysReceivables) / 365
        inventory = (cogs * assumptions.daysInventory) / 365
        ap = (cogs * assumptions.daysPayables) / 365
      } else if (assumptions.projectionMethod === 'percentage') {
        ar = revenue * (assumptions.daysReceivables / 365)
        inventory = revenue * (assumptions.daysInventory / 365)
        ap = revenue * (assumptions.daysPayables / 365)
      } else {
        // Fixed NWC as % of revenue
        nwc = revenue * (assumptions.targetNWCPercent / 100)
        ar = nwc * 0.4
        inventory = nwc * 0.3
        ap = nwc * 0.2
      }

      const prepaid = revenue * (assumptions.prepaidExpensesPercent / 100)
      const otherCA = revenue * (assumptions.otherCurrentAssetsPercent / 100)
      const accrued = operatingExpenses * (assumptions.accruedExpensesPercent / 100)
      const deferred = revenue * (assumptions.deferredRevenuePercent / 100)
      const otherCL = revenue * (assumptions.otherCurrentLiabsPercent / 100)

      if (assumptions.projectionMethod !== 'fixed') {
        nwc = ar + inventory + prepaid + otherCA - ap - accrued - deferred - otherCL
      }

      const changeInNWC = nwc - previousNWC
      previousNWC = nwc

      projections.push({
        year,
        revenue,
        cogs,
        operatingExpenses,
        accountsReceivable: ar,
        inventory,
        prepaidExpenses: prepaid,
        otherCurrentAssets: otherCA,
        accountsPayable: ap,
        accruedExpenses: accrued,
        deferredRevenue: deferred,
        otherCurrentLiabilities: otherCL,
        netWorkingCapital: nwc,
        changeInNWC,
        nwcAsPercentOfRevenue: (nwc / revenue) * 100,
      })
    }

    setProjectedData(projections)

    // Update DCF context with new working capital data
    const updatedWC: WorkingCapitalData = {
      historical: historicalData.map((item) => ({
        year: item.year,
        revenue: item.revenue,
        accountsReceivable: item.accountsReceivable,
        inventory: item.inventory,
        prepaidExpenses: item.prepaidExpenses,
        otherCurrentAssets: item.otherCurrentAssets,
        accountsPayable: item.accountsPayable,
        accruedExpenses: item.accruedExpenses,
        deferredRevenue: item.deferredRevenue,
        otherCurrentLiabilities: item.otherCurrentLiabilities,
        netWorkingCapital: item.netWorkingCapital,
        changeInNWC: item.changeInNWC,
      })),
      projected: projections.map((item) => ({
        year: item.year,
        revenue: item.revenue,
        accountsReceivable: item.accountsReceivable,
        inventory: item.inventory,
        prepaidExpenses: item.prepaidExpenses,
        otherCurrentAssets: item.otherCurrentAssets,
        accountsPayable: item.accountsPayable,
        accruedExpenses: item.accruedExpenses,
        deferredRevenue: item.deferredRevenue,
        otherCurrentLiabilities: item.otherCurrentLiabilities,
        netWorkingCapital: item.netWorkingCapital,
        changeInNWC: item.changeInNWC,
      })),
      assumptions: {
        daysReceivables: assumptions.daysReceivables,
        daysInventory: assumptions.daysInventory,
        daysPayables: assumptions.daysPayables,
        targetNWCPercent: assumptions.targetNWCPercent,
      },
      summary: {
        currentNWC: projections[0]?.netWorkingCapital || 0,
        cashConversionCycle:
          assumptions.daysReceivables + assumptions.daysInventory - assumptions.daysPayables,
      },
    }

    updateWorkingCapital(updatedWC)
  }

  const handleSave = async () => {
    await saveModel()
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      await recalculateAll()
      toast.success('DCF model recalculated')
    } catch (error) {
      toast.error('Failed to recalculate DCF model')
    } finally {
      setIsRecalculating(false)
    }
  }

  const combinedData = [...historicalData, ...projectedData]

  const columns: ColumnDef<WorkingCapitalItem>[] = [
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.year}
          {row.original.year > new Date().getFullYear() && (
            <Badge variant="outline" className="ml-2 text-xs">
              Projected
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
      accessorKey: 'accountsReceivable',
      header: 'A/R',
      cell: ({ row }) => `$${(row.original.accountsReceivable / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'inventory',
      header: 'Inventory',
      cell: ({ row }) => `$${(row.original.inventory / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'accountsPayable',
      header: 'A/P',
      cell: ({ row }) => `$${(row.original.accountsPayable / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'netWorkingCapital',
      header: 'Net Working Capital',
      cell: ({ row }) => (
        <div className="font-semibold">
          ${(row.original.netWorkingCapital / 1000000).toFixed(2)}M
        </div>
      ),
    },
    {
      accessorKey: 'changeInNWC',
      header: 'Change in NWC',
      cell: ({ row }) => (
        <div className={row.original.changeInNWC > 0 ? 'text-red-600' : 'text-green-600'}>
          ${(row.original.changeInNWC / 1000000).toFixed(2)}M
        </div>
      ),
    },
    {
      accessorKey: 'nwcAsPercentOfRevenue',
      header: 'NWC % of Revenue',
      cell: ({ row }) => `${row.original.nwcAsPercentOfRevenue.toFixed(1)}%`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6" />
            Working Capital Schedule
          </h1>
          <p className="mt-1 text-muted-foreground">
            Model working capital requirements and cash flow impact
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
          <Button onClick={handleSave} disabled={contextSaving}>
            <Save className="mr-2 h-4 w-4" />
            {contextSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current NWC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(
                (historicalData[historicalData.length - 1]?.netWorkingCapital || 0) / 1000000
              ).toFixed(1)}
              M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NWC % of Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historicalData[historicalData.length - 1]?.nwcAsPercentOfRevenue.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Days Receivables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assumptions.daysReceivables} days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash Conversion Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assumptions.daysReceivables + assumptions.daysInventory - assumptions.daysPayables}{' '}
              days
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Projections</CardTitle>
              <CardDescription>Historical and projected working capital components</CardDescription>
            </CardHeader>
            <CardContent>
              <EditableDataTable columns={columns} data={combinedData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Assumptions</CardTitle>
              <CardDescription>
                Configure days outstanding and percentage assumptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Package className="h-4 w-4" />
                    Operating Cycle
                  </h3>

                  <div className="space-y-2">
                    <Label>Days Sales Outstanding (DSO)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[assumptions.daysReceivables]}
                        onValueChange={(value) =>
                          setAssumptions({
                            ...assumptions,
                            daysReceivables: value[0],
                          })
                        }
                        min={0}
                        max={120}
                        step={5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={assumptions.daysReceivables}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            daysReceivables: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Days Inventory Outstanding (DIO)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[assumptions.daysInventory]}
                        onValueChange={(value) =>
                          setAssumptions({
                            ...assumptions,
                            daysInventory: value[0],
                          })
                        }
                        min={0}
                        max={180}
                        step={5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={assumptions.daysInventory}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            daysInventory: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Days Payables Outstanding (DPO)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[assumptions.daysPayables]}
                        onValueChange={(value) =>
                          setAssumptions({
                            ...assumptions,
                            daysPayables: value[0],
                          })
                        }
                        min={0}
                        max={90}
                        step={5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={assumptions.daysPayables}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            daysPayables: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <CreditCard className="h-4 w-4" />
                    Other Working Capital Items
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prepaid Expenses (% of Revenue)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={assumptions.prepaidExpensesPercent}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            prepaidExpensesPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Accrued Expenses (% of OpEx)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={assumptions.accruedExpensesPercent}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            accruedExpensesPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Deferred Revenue (% of Revenue)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={assumptions.deferredRevenuePercent}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            deferredRevenuePercent: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Target NWC (% of Revenue)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={assumptions.targetNWCPercent}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            targetNWCPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Analysis</CardTitle>
              <CardDescription>Key metrics and cash flow impact analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cash Conversion Cycle:</strong>{' '}
                  {assumptions.daysReceivables +
                    assumptions.daysInventory -
                    assumptions.daysPayables}{' '}
                  days
                  <br />
                  This represents the time between paying suppliers and collecting from customers.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">5-Year NWC Investment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      $
                      {(
                        projectedData.reduce((sum, item) => sum + item.changeInNWC, 0) / 1000000
                      ).toFixed(2)}
                      M
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total cash required for working capital growth
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Average Annual Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      $
                      {(
                        projectedData.reduce((sum, item) => sum + item.changeInNWC, 0) /
                        projectedData.length /
                        1000000
                      ).toFixed(2)}
                      M
                    </div>
                    <p className="text-sm text-muted-foreground">Average yearly cash flow impact</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Working Capital Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="accountsReceivable"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="A/R"
                  />
                  <Area
                    type="monotone"
                    dataKey="inventory"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Inventory"
                  />
                  <Area
                    type="monotone"
                    dataKey="accountsPayable"
                    stackId="2"
                    stroke="#ffc658"
                    fill="#ffc658"
                    name="A/P"
                  />
                  <Line
                    type="monotone"
                    dataKey="netWorkingCapital"
                    stroke="#ff7300"
                    strokeWidth={2}
                    name="Net Working Capital"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
