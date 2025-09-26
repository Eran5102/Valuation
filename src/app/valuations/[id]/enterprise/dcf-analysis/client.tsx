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
import { VerticalDCFTable } from '@/components/dcf/VerticalDCFTable'
import { ScenarioProjectionLink } from '@/components/dcf/ScenarioProjectionLink'
import { DCFDataFlowDiagram } from '@/components/dcf/DCFDataFlowDiagram'
import { useDCFModel } from '@/contexts/DCFModelContext'
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
  Settings,
  GitBranch,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import {
  runDCFCalculation,
  saveDCFProjections,
  saveDCFSettings,
  runSensitivityAnalysis,
} from './actions'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

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
  // Try to use DCF context, but fallback gracefully if not available
  let assumptions = null
  let updateAssumptions = null

  try {
    const dcfContext = useDCFModel()
    assumptions = dcfContext.assumptions
    updateAssumptions = dcfContext.updateAssumptions
  } catch (error) {
    // Context not available yet, will use local state
    console.warn('DCF context not available, using local state')
  }

  const [data, setData] = useState<DCFData>(initialData)
  const [results, setResults] = useState<DCFResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeScenario, setActiveScenario] = useState<any>(null)
  const [availableScenarios, setAvailableScenarios] = useState<any[]>([])

  // Load scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const response = await fetch(`/api/valuations/${valuationId}/scenarios`)
        if (response.ok) {
          const scenarios = await response.json()
          setAvailableScenarios(scenarios)
          const active = scenarios.find((s: any) => s.is_active)
          if (active) {
            setActiveScenario(active)
          }
        }
      } catch (error) {
      }
    }
    loadScenarios()
  }, [valuationId])

  // Use projection years from assumptions, with fallback to settings
  const forecastPeriod = assumptions?.projectionYears || data.settings.forecastPeriod

  // Use discount rate from assumptions (which gets updated by WACC), with fallback to settings
  const currentDiscountRate = assumptions?.discountRate || data.settings.discountRate

  // Auto-calculate when data changes
  const debouncedCalculate = useDebouncedCallback(async () => {
    if (!hasChanges) return

    setIsCalculating(true)
    try {
      const calculatedResults = await runDCFCalculation(valuationId, {
        projections: data.projections,
        settings: {
          discountRate: currentDiscountRate,
          terminalGrowthRate: data.settings.terminalGrowthRate,
          terminalValueMethod: data.settings.terminalValueMethod,
          exitMultiple: data.settings.exitMultiple,
          discountingConvention: data.settings.discountingConvention,
        },
      })
      setResults(calculatedResults)
    } catch (error) {
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">DCF Analysis</h1>
            {activeScenario && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="gap-1">
                  {activeScenario.name}
                </Badge>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            Discounted Cash Flow valuation methodology
            {activeScenario && ` • ${activeScenario.type} scenario`}
          </p>
        </div>
        <div className="flex gap-2">
          {availableScenarios.length > 0 && (
            <Select
              value={activeScenario?.id || ''}
              onValueChange={async (scenarioId) => {
                try {
                  const response = await fetch(
                    `/api/valuations/${valuationId}/scenarios/${scenarioId}/activate`,
                    {
                      method: 'POST',
                    }
                  )
                  if (response.ok) {
                    const newActive = availableScenarios.find((s) => s.id === scenarioId)
                    setActiveScenario(newActive)
                    toast.success(`Switched to ${newActive?.name} scenario`)
                    // Trigger recalculation with new scenario
                  }
                } catch (error) {
                  toast.error('Failed to switch scenario')
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {availableScenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    <div className="flex items-center gap-2">
                      <span>{scenario.name}</span>
                      <Badge variant="outline">
                        {scenario.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={`/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Scenarios
            </a>
          </Button>
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
            <div className="text-2xl font-bold">{(currentDiscountRate * 100).toFixed(1)}%</div>
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
        <TabsList className="inline-flex w-auto">
          <TabsTrigger value="projections" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Financial Projections
          </TabsTrigger>
          <TabsTrigger value="sensitivity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sensitivity Analysis
          </TabsTrigger>
        </TabsList>

        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-4">
          {/* Projection Period Controls */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label className="whitespace-nowrap">Projection Years:</Label>
                  <Select
                    value={String(assumptions?.projectionYears || 5)}
                    onValueChange={(value) => {
                      if (updateAssumptions) {
                        updateAssumptions({ projectionYears: parseInt(value) })
                      }
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((years) => (
                        <SelectItem key={years} value={String(years)}>
                          {years} years
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">+ Terminal Year</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Scroll horizontally to view all years</span>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Scenario Integration */}
          {activeScenario && (
            <ScenarioProjectionLink valuationId={valuationId} activeScenario={activeScenario} />
          )}

          {/* DCF Table */}
          <VerticalDCFTable
            projections={data.projections}
            results={results}
            forecastPeriod={forecastPeriod}
            onUpdateProjection={updateProjections}
            isCalculating={isCalculating}
          />

          {/* Data Flow Diagram */}
          <DCFDataFlowDiagram />
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
                    discountRate: currentDiscountRate,
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
