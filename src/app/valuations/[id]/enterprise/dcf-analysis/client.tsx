'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditableDataTable, EditableCell } from '@/components/ui/editable-data-table'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import { PercentageInput } from '@/components/ui/percentage-input'
import {
  TrendingUp,
  Calculator,
  Activity,
  DollarSign,
  Percent,
  AlertCircle,
  Save,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import {
  runDCFCalculation,
  saveDCFProjections,
  saveDCFSettings,
  runSensitivityAnalysis,
} from './actions'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface DCFData {
  projections: {
    revenue: number[]
    ebitda: number[]
    depreciation: number[]
    ebit: number[]
    taxes: number[]
    capex: number[]
    workingCapitalChange: number[]
  }
  settings: {
    discountRate: number
    terminalGrowthRate: number
    terminalValueMethod: 'PGM' | 'Exit Multiple'
    exitMultiple: number
    discountingConvention: 'Mid-Year' | 'End-Year'
    forecastPeriod: number
    taxRate: number
  }
  balanceSheet: {
    cashBalance: number
    debtBalance: number
  }
  sharesOutstanding: number
}

interface DCFResults {
  presentValueOfCashFlows: number
  terminalValue: number
  presentValueOfTerminalValue: number
  enterpriseValue: number
  discountFactors: number[]
  discountedCashFlows: number[]
}

interface DCFAnalysisClientProps {
  valuationId: string
  initialData: DCFData
}

export function DCFAnalysisClient({ valuationId, initialData }: DCFAnalysisClientProps) {
  const [data, setData] = useState<DCFData>(initialData)
  const [results, setResults] = useState<DCFResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Calculate free cash flows for display
  const calculateFCF = useCallback(() => {
    const fcf: number[] = []
    for (let i = 0; i < data.settings.forecastPeriod; i++) {
      const nopat = (data.projections.ebit[i] || 0) - (data.projections.taxes[i] || 0)
      const cashFlow =
        nopat +
        (data.projections.depreciation[i] || 0) -
        (data.projections.capex[i] || 0) -
        (data.projections.workingCapitalChange[i] || 0)
      fcf.push(cashFlow)
    }
    return fcf
  }, [data])

  // Auto-calculate when data changes
  const debouncedCalculate = useDebouncedCallback(async () => {
    if (!hasChanges) return

    setIsCalculating(true)
    try {
      const calculatedResults = await runDCFCalculation(valuationId, {
        projections: data.projections,
        settings: {
          discountRate: data.settings.discountRate,
          terminalGrowthRate: data.settings.terminalGrowthRate,
          terminalValueMethod: data.settings.terminalValueMethod,
          exitMultiple: data.settings.exitMultiple,
          discountingConvention: data.settings.discountingConvention,
        },
      })
      setResults(calculatedResults)
    } catch (error) {
      console.error('DCF calculation error:', error)
      toast.error('Failed to calculate DCF')
    } finally {
      setIsCalculating(false)
    }
  }, 500)

  useEffect(() => {
    debouncedCalculate()
  }, [data, debouncedCalculate])

  // Run initial calculation
  useEffect(() => {
    const runInitialCalculation = async () => {
      setIsCalculating(true)
      try {
        const calculatedResults = await runDCFCalculation(valuationId, {
          projections: data.projections,
          settings: {
            discountRate: data.settings.discountRate,
            terminalGrowthRate: data.settings.terminalGrowthRate,
            terminalValueMethod: data.settings.terminalValueMethod,
            exitMultiple: data.settings.exitMultiple,
            discountingConvention: data.settings.discountingConvention,
          },
        })
        setResults(calculatedResults)
      } catch (error) {
        console.error('Initial DCF calculation error:', error)
      } finally {
        setIsCalculating(false)
      }
    }
    runInitialCalculation()
  }, [])

  // Save data
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await Promise.all([
        saveDCFProjections(valuationId, data.projections),
        saveDCFSettings(valuationId, data.settings),
      ])
      toast.success('DCF analysis saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save DCF analysis')
    } finally {
      setIsSaving(false)
    }
  }

  // Update projections data
  const updateProjections = (field: keyof DCFData['projections'], index: number, value: number) => {
    setData((prev) => ({
      ...prev,
      projections: {
        ...prev.projections,
        [field]: prev.projections[field].map((v, i) => (i === index ? value : v)),
      },
    }))
    setHasChanges(true)
  }

  // Update settings
  const updateSettings = (field: keyof DCFData['settings'], value: any) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  // Create table data for projections
  const projectionTableData = Array.from({ length: data.settings.forecastPeriod }, (_, i) => {
    const fcf = calculateFCF()
    return {
      year: i + 1,
      revenue: data.projections.revenue[i] || 0,
      ebitda: data.projections.ebitda[i] || 0,
      depreciation: data.projections.depreciation[i] || 0,
      ebit: data.projections.ebit[i] || 0,
      taxes: data.projections.taxes[i] || 0,
      capex: data.projections.capex[i] || 0,
      workingCapitalChange: data.projections.workingCapitalChange[i] || 0,
      fcf: fcf[i] || 0,
      discountFactor: results?.discountFactors[i] || 0,
      pvFcf: results?.discountedCashFlows[i] || 0,
    }
  })

  // Define columns for the projections table
  const projectionColumns: ColumnDef<(typeof projectionTableData)[0]>[] = [
    {
      id: 'year',
      header: 'Year',
      accessorKey: 'year',
      cell: ({ row }) => `Year ${row.getValue('year')}`,
    },
    {
      id: 'revenue',
      header: 'Revenue',
      accessorKey: 'revenue',
      cell: ({ row }) => {
        const index = row.index
        return (
          <EditableCell
            value={row.getValue('revenue')}
            onChange={(value) => updateProjections('revenue', index, value)}
            type="currency"
            editable={true}
          />
        )
      },
    },
    {
      id: 'ebitda',
      header: 'EBITDA',
      accessorKey: 'ebitda',
      cell: ({ row }) => {
        const index = row.index
        return (
          <EditableCell
            value={row.getValue('ebitda')}
            onChange={(value) => updateProjections('ebitda', index, value)}
            type="currency"
            editable={true}
          />
        )
      },
    },
    {
      id: 'depreciation',
      header: 'Depreciation',
      accessorKey: 'depreciation',
      cell: ({ row }) => {
        const index = row.index
        return (
          <EditableCell
            value={row.getValue('depreciation')}
            onChange={(value) => updateProjections('depreciation', index, value)}
            type="currency"
            editable={true}
          />
        )
      },
    },
    {
      id: 'ebit',
      header: 'EBIT',
      accessorKey: 'ebit',
      cell: ({ row }) => {
        const index = row.index
        return (
          <EditableCell
            value={row.getValue('ebit')}
            onChange={(value) => updateProjections('ebit', index, value)}
            type="currency"
            editable={true}
          />
        )
      },
    },
    {
      id: 'taxes',
      header: 'Taxes',
      accessorKey: 'taxes',
      cell: ({ row }) => {
        const index = row.index
        return (
          <EditableCell
            value={row.getValue('taxes')}
            onChange={(value) => updateProjections('taxes', index, value)}
            type="currency"
            editable={true}
          />
        )
      },
    },
    {
      id: 'capex',
      header: 'CapEx',
      accessorKey: 'capex',
      cell: ({ row }) => {
        const index = row.index
        return (
          <EditableCell
            value={row.getValue('capex')}
            onChange={(value) => updateProjections('capex', index, value)}
            type="currency"
            editable={true}
          />
        )
      },
    },
    {
      id: 'workingCapitalChange',
      header: 'NWC Change',
      accessorKey: 'workingCapitalChange',
      cell: ({ row }) => {
        const index = row.index
        return (
          <EditableCell
            value={row.getValue('workingCapitalChange')}
            onChange={(value) => updateProjections('workingCapitalChange', index, value)}
            type="currency"
            editable={true}
          />
        )
      },
    },
    {
      id: 'fcf',
      header: 'Free Cash Flow',
      accessorKey: 'fcf',
      cell: ({ row }) => (
        <div className="font-medium">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(row.getValue('fcf'))}
        </div>
      ),
    },
    {
      id: 'discountFactor',
      header: 'Discount Factor',
      accessorKey: 'discountFactor',
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {(row.getValue('discountFactor') as number).toFixed(4)}
        </div>
      ),
    },
    {
      id: 'pvFcf',
      header: 'PV of FCF',
      accessorKey: 'pvFcf',
      cell: ({ row }) => (
        <div className="font-medium">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(row.getValue('pvFcf'))}
        </div>
      ),
    },
  ]

  // Calculate implied share price
  const impliedSharePrice = results
    ? (results.enterpriseValue + data.balanceSheet.cashBalance - data.balanceSheet.debtBalance) /
      (data.sharesOutstanding || 1)
    : 0

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DCF Analysis</h1>
          <p className="text-muted-foreground">Discounted Cash Flow valuation methodology</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" disabled>
              <AlertCircle className="mr-2 h-4 w-4" />
              Unsaved Changes
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Analysis'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((results?.enterpriseValue || 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">DCF methodology</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PV Cash Flows</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((results?.presentValueOfCashFlows || 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              {data.settings.forecastPeriod}-year forecast
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminal Value</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((results?.presentValueOfTerminalValue || 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              {data.settings.terminalValueMethod === 'PGM'
                ? `${(data.settings.terminalGrowthRate * 100).toFixed(1)}% growth`
                : `${data.settings.exitMultiple}x multiple`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.settings.discountRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">WACC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implied Share Price</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${impliedSharePrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per share value</p>
          </CardContent>
        </Card>
      </div>

      {isCalculating && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>Calculating DCF valuation...</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="projections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projections">Financial Projections</TabsTrigger>
          <TabsTrigger value="assumptions">DCF Assumptions</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
        </TabsList>

        {/* Projections Tab */}
        <TabsContent value="projections">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Projections</CardTitle>
              <CardDescription>
                Double-click any cell to edit the financial projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditableDataTable
                data={projectionTableData}
                columns={projectionColumns}
                tableId="dcf-projections"
                showExport={true}
                showColumnVisibility={true}
                showPagination={false}
                editable={false} // We're handling editable cells individually
              />

              {/* Summary rows */}
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between font-medium">
                  <span>Sum of PV Cash Flows</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(results?.presentValueOfCashFlows || 0)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>PV of Terminal Value</span>
                  <span>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(results?.presentValueOfTerminalValue || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Enterprise Value</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(results?.enterpriseValue || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assumptions Tab */}
        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Valuation Parameters</CardTitle>
              <CardDescription>Key assumptions for the DCF model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Discount Rate (WACC)</Label>
                  <PercentageInput
                    value={data.settings.discountRate * 100}
                    onChange={(value) => updateSettings('discountRate', value / 100)}
                    min={0}
                    max={50}
                    step={0.1}
                    decimals={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tax Rate</Label>
                  <PercentageInput
                    value={data.settings.taxRate * 100}
                    onChange={(value) => updateSettings('taxRate', value / 100)}
                    min={0}
                    max={50}
                    step={0.1}
                    decimals={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discounting Convention</Label>
                  <Select
                    value={data.settings.discountingConvention}
                    onValueChange={(value: 'Mid-Year' | 'End-Year') =>
                      updateSettings('discountingConvention', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                      <SelectItem value="End-Year">End-Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terminal Value</CardTitle>
              <CardDescription>Method for calculating terminal value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Terminal Value Method</Label>
                <Select
                  value={data.settings.terminalValueMethod}
                  onValueChange={(value: 'PGM' | 'Exit Multiple') =>
                    updateSettings('terminalValueMethod', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PGM">Perpetual Growth Method</SelectItem>
                    <SelectItem value="Exit Multiple">Exit Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.settings.terminalValueMethod === 'PGM' && (
                <div className="space-y-2">
                  <Label>Terminal Growth Rate</Label>
                  <PercentageInput
                    value={data.settings.terminalGrowthRate * 100}
                    onChange={(value) => updateSettings('terminalGrowthRate', value / 100)}
                    min={0}
                    max={10}
                    step={0.1}
                    decimals={1}
                  />
                </div>
              )}

              {data.settings.terminalValueMethod === 'Exit Multiple' && (
                <div className="space-y-2">
                  <Label>Exit Multiple (x EBITDA)</Label>
                  <input
                    type="number"
                    value={data.settings.exitMultiple}
                    onChange={(e) => updateSettings('exitMultiple', parseFloat(e.target.value))}
                    min={0}
                    max={20}
                    step={0.5}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sensitivity Analysis Tab */}
        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis</CardTitle>
              <CardDescription>
                Enterprise value sensitivity to discount rate and terminal growth rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SensitivityTable
                valuationId={valuationId}
                baseInputs={{
                  projections: data.projections,
                  settings: {
                    discountRate: data.settings.discountRate,
                    terminalGrowthRate: data.settings.terminalGrowthRate,
                    terminalValueMethod: data.settings.terminalValueMethod,
                    exitMultiple: data.settings.exitMultiple,
                    discountingConvention: data.settings.discountingConvention,
                  },
                }}
                currentEV={results?.enterpriseValue || 0}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sensitivity Analysis Component
function SensitivityTable({
  valuationId,
  baseInputs,
  currentEV,
}: {
  valuationId: string
  baseInputs: any
  currentEV: number
}) {
  const [sensitivityData, setSensitivityData] = useState<Record<string, Record<string, number>>>({})
  const [isCalculating, setIsCalculating] = useState(false)

  const discountRates = [0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16]
  const growthRates = [0.0, 0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.045]

  useEffect(() => {
    const calculateSensitivity = async () => {
      setIsCalculating(true)
      try {
        const results = await runSensitivityAnalysis(
          valuationId,
          baseInputs,
          discountRates,
          growthRates
        )
        setSensitivityData(results)
      } catch (error) {
        console.error('Sensitivity analysis error:', error)
      } finally {
        setIsCalculating(false)
      }
    }
    calculateSensitivity()
  }, [valuationId, baseInputs])

  if (isCalculating) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Calculating sensitivity...</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border p-2 text-left">WACC / Growth</th>
            {growthRates.map((gr) => (
              <th key={gr} className="border p-2 text-center">
                {(gr * 100).toFixed(1)}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {discountRates.map((dr) => (
            <tr key={dr}>
              <td className="border p-2 font-medium">{(dr * 100).toFixed(0)}%</td>
              {growthRates.map((gr) => {
                const value = sensitivityData[dr.toString()]?.[gr.toString()] || 0
                const percentChange = ((value - currentEV) / currentEV) * 100
                const isBase =
                  Math.abs(dr - baseInputs.settings.discountRate) < 0.001 &&
                  Math.abs(gr - baseInputs.settings.terminalGrowthRate) < 0.001

                return (
                  <td
                    key={gr}
                    className={cn(
                      'border p-2 text-center',
                      isBase && 'bg-primary/10 font-bold',
                      percentChange > 0 && 'text-green-600',
                      percentChange < 0 && 'text-red-600'
                    )}
                  >
                    {isNaN(value) ? (
                      '-'
                    ) : (
                      <div>
                        <div>${(value / 1000000).toFixed(1)}M</div>
                        {!isBase && (
                          <div className="text-xs">
                            {percentChange > 0 ? '+' : ''}
                            {percentChange.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
