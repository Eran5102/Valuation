'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PercentageInput } from '@/components/ui/percentage-input'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Calculator,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Save,
  RefreshCw,
  Info,
  Calendar,
  Target,
  Percent,
  Building,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDCFModel } from '@/contexts/DCFModelContext'

interface DCFAssumptionsClientProps {
  valuationId: string
}

interface TerminalYearAssumptions {
  method: 'growth' | 'multiple'
  growthRate: number
  exitMultiple: number
  normalizedMargins: {
    ebitdaMargin: number
    netMargin: number
    effectiveTaxRate: number
  }
  normalizedCapital: {
    capexEqualsDepreciation: boolean
    capexPercent: number
    depreciationPercent: number
    workingCapitalPercent: number
  }
  stabilityAdjustments: {
    marginCompression: number // % reduction from last projection year
    reinvestmentRate: number // % of NOPAT reinvested
    returnOnInvestedCapital: number // ROIC in terminal year
  }
}

export function DCFAssumptionsClient({ valuationId }: DCFAssumptionsClientProps) {
  const { assumptions, updateAssumptions, saveModel, recalculateAll, isSaving, hasChanges } =
    useDCFModel()

  const [localAssumptions, setLocalAssumptions] = useState({
    // Projection Period
    projectionYears: assumptions?.projectionYears || 5,
    baseYear: assumptions?.baseYear || new Date().getFullYear(),

    // Discount Rate
    discountRate: assumptions?.discountRate || 0.1,
    discountingConvention: assumptions?.discountingConvention || 'Mid-Year',

    // Tax
    effectiveTaxRate: assumptions?.effectiveTaxRate || 25,

    // Working Capital Method
    workingCapitalMethod: assumptions?.workingCapitalMethod || 'days',
    daysReceivables: assumptions?.daysReceivables || 45,
    daysPayables: assumptions?.daysPayables || 30,
    daysInventory: assumptions?.daysInventory || 60,
    targetNWCPercent: assumptions?.targetNWCPercent || 15,

    // Capex Method
    capexMethod: assumptions?.capexMethod || 'percentage',
    capexPercent: assumptions?.capexPercent || 5,
    maintenanceCapexPercent: assumptions?.maintenanceCapexPercent || 3,
    growthCapexPercent: assumptions?.growthCapexPercent || 2,

    // Depreciation Method
    depreciationMethod: assumptions?.depreciationMethod || 'percentage',
    depreciationPercent: assumptions?.depreciationPercent || 5,
  })

  const [terminalAssumptions, setTerminalAssumptions] = useState<TerminalYearAssumptions>({
    method: 'growth',
    growthRate: 3.0,
    exitMultiple: 8.0,
    normalizedMargins: {
      ebitdaMargin: 20,
      netMargin: 12,
      effectiveTaxRate: 25,
    },
    normalizedCapital: {
      capexEqualsDepreciation: true,
      capexPercent: 5,
      depreciationPercent: 5,
      workingCapitalPercent: 0, // No change in NWC in terminal year
    },
    stabilityAdjustments: {
      marginCompression: 2, // 2% margin reduction
      reinvestmentRate: 30, // 30% of NOPAT reinvested
      returnOnInvestedCapital: 15, // 15% ROIC
    },
  })

  const [isRecalculating, setIsRecalculating] = useState(false)

  // Handle assumption updates
  const handleUpdateAssumption = (key: string, value: any) => {
    setLocalAssumptions((prev) => ({
      ...prev,
      [key]: value,
    }))

    // Update context
    updateAssumptions({
      [key]: value,
    })
  }

  // Handle terminal assumption updates
  const handleUpdateTerminalAssumption = (path: string, value: any) => {
    const keys = path.split('.')
    setTerminalAssumptions((prev) => {
      const updated = { ...prev }
      let current: any = updated

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return updated
    })

    // Update context with terminal assumptions - removed terminalYear as it doesn't exist in DCFCoreAssumptions
    // The terminal assumptions are handled separately from the core assumptions
  }

  // Save all assumptions
  const handleSave = async () => {
    try {
      await saveModel()
      toast.success('DCF assumptions saved')
    } catch (error) {
      toast.error('Failed to save assumptions')
    }
  }

  // Recalculate DCF
  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      await recalculateAll()
      toast.success('DCF model recalculated')
    } catch (error) {
      toast.error('Failed to recalculate')
    } finally {
      setIsRecalculating(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Settings className="h-6 w-6" />
            DCF Assumptions
          </h1>
          <p className="mt-1 text-muted-foreground">
            Configure projection period, discount rate, and terminal value assumptions
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleRecalculate} disabled={isRecalculating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="inline-flex w-auto">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="terminal" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Terminal Year
          </TabsTrigger>
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculation Methods
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Assumptions */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Projection Period
              </CardTitle>
              <CardDescription>Define the forecast horizon and base year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Projection Years</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[localAssumptions.projectionYears]}
                      onValueChange={(value) => handleUpdateAssumption('projectionYears', value[0])}
                      min={3}
                      max={15}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={localAssumptions.projectionYears}
                      onChange={(e) =>
                        handleUpdateAssumption('projectionYears', parseInt(e.target.value))
                      }
                      min={3}
                      max={15}
                      className="w-20"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Typically 3-7 years for high-growth companies, 5-10 for mature companies
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Base Year</Label>
                  <Input
                    type="number"
                    value={localAssumptions.baseYear}
                    onChange={(e) => handleUpdateAssumption('baseYear', parseInt(e.target.value))}
                    min={2020}
                    max={2030}
                  />
                  <p className="text-xs text-muted-foreground">Starting year for projections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Discount Rate
              </CardTitle>
              <CardDescription>Cost of capital and discounting convention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Rate (WACC)</Label>
                  <PercentageInput
                    value={localAssumptions.discountRate * 100}
                    onChange={(value) => handleUpdateAssumption('discountRate', value / 100)}
                    min={0}
                    max={50}
                    step={0.1}
                    decimals={1}
                  />
                  <p className="text-xs text-muted-foreground">Weighted Average Cost of Capital</p>
                </div>
                <div className="space-y-2">
                  <Label>Discounting Convention</Label>
                  <Select
                    value={localAssumptions.discountingConvention}
                    onValueChange={(value) =>
                      handleUpdateAssumption('discountingConvention', value)
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
                  <p className="text-xs text-muted-foreground">
                    Mid-year assumes cash flows occur evenly throughout the year
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Effective Tax Rate</Label>
                <PercentageInput
                  value={localAssumptions.effectiveTaxRate}
                  onChange={(value) => handleUpdateAssumption('effectiveTaxRate', value)}
                  min={0}
                  max={50}
                  step={0.5}
                  decimals={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminal Year Assumptions */}
        <TabsContent value="terminal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Terminal Value Method
              </CardTitle>
              <CardDescription>
                How to calculate the value beyond the projection period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="flex-1">Terminal Value Method</Label>
                  <Select
                    value={terminalAssumptions.method}
                    onValueChange={(value: 'growth' | 'multiple') =>
                      handleUpdateTerminalAssumption('method', value)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="growth">Perpetual Growth</SelectItem>
                      <SelectItem value="multiple">Exit Multiple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {terminalAssumptions.method === 'growth' ? (
                  <div className="space-y-2">
                    <Label>Terminal Growth Rate</Label>
                    <PercentageInput
                      value={terminalAssumptions.growthRate}
                      onChange={(value) => handleUpdateTerminalAssumption('growthRate', value)}
                      min={0}
                      max={10}
                      step={0.5}
                      decimals={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Should not exceed long-term GDP growth (typically 2-3%)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Exit Multiple (EV/EBITDA)</Label>
                    <Input
                      type="number"
                      value={terminalAssumptions.exitMultiple}
                      onChange={(e) =>
                        handleUpdateTerminalAssumption('exitMultiple', parseFloat(e.target.value))
                      }
                      min={0}
                      max={30}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Based on comparable company multiples
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Normalized Terminal Year Assumptions
              </CardTitle>
              <CardDescription>Steady-state assumptions for the terminal year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Normalized Margins */}
              <div className="space-y-4">
                <h4 className="font-semibold">Normalized Margins</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>EBITDA Margin</Label>
                    <PercentageInput
                      value={terminalAssumptions.normalizedMargins.ebitdaMargin}
                      onChange={(value) =>
                        handleUpdateTerminalAssumption('normalizedMargins.ebitdaMargin', value)
                      }
                      min={0}
                      max={50}
                      step={0.5}
                      decimals={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Net Margin</Label>
                    <PercentageInput
                      value={terminalAssumptions.normalizedMargins.netMargin}
                      onChange={(value) =>
                        handleUpdateTerminalAssumption('normalizedMargins.netMargin', value)
                      }
                      min={0}
                      max={30}
                      step={0.5}
                      decimals={1}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Normalized Capital Requirements */}
              <div className="space-y-4">
                <h4 className="font-semibold">Capital Requirements</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Capex Equals Depreciation</Label>
                    <p className="text-xs text-muted-foreground">
                      Steady-state assumption for mature companies
                    </p>
                  </div>
                  <Switch
                    checked={terminalAssumptions.normalizedCapital.capexEqualsDepreciation}
                    onCheckedChange={(checked) =>
                      handleUpdateTerminalAssumption(
                        'normalizedCapital.capexEqualsDepreciation',
                        checked
                      )
                    }
                  />
                </div>

                {!terminalAssumptions.normalizedCapital.capexEqualsDepreciation && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capex % of Revenue</Label>
                      <PercentageInput
                        value={terminalAssumptions.normalizedCapital.capexPercent}
                        onChange={(value) =>
                          handleUpdateTerminalAssumption('normalizedCapital.capexPercent', value)
                        }
                        min={0}
                        max={20}
                        step={0.5}
                        decimals={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Depreciation % of Revenue</Label>
                      <PercentageInput
                        value={terminalAssumptions.normalizedCapital.depreciationPercent}
                        onChange={(value) =>
                          handleUpdateTerminalAssumption(
                            'normalizedCapital.depreciationPercent',
                            value
                          )
                        }
                        min={0}
                        max={20}
                        step={0.5}
                        decimals={1}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Change in NWC (% of Revenue Growth)</Label>
                  <PercentageInput
                    value={terminalAssumptions.normalizedCapital.workingCapitalPercent}
                    onChange={(value) =>
                      handleUpdateTerminalAssumption(
                        'normalizedCapital.workingCapitalPercent',
                        value
                      )
                    }
                    min={-10}
                    max={30}
                    step={1}
                    decimals={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Often set to 0 for terminal year (no further NWC investment)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Stability Adjustments */}
              <div className="space-y-4">
                <h4 className="font-semibold">Stability Adjustments</h4>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    These adjustments account for the transition to steady-state operations
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Margin Compression</Label>
                    <PercentageInput
                      value={terminalAssumptions.stabilityAdjustments.marginCompression}
                      onChange={(value) =>
                        handleUpdateTerminalAssumption(
                          'stabilityAdjustments.marginCompression',
                          value
                        )
                      }
                      min={0}
                      max={10}
                      step={0.5}
                      decimals={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      % reduction from last projection year
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Reinvestment Rate</Label>
                    <PercentageInput
                      value={terminalAssumptions.stabilityAdjustments.reinvestmentRate}
                      onChange={(value) =>
                        handleUpdateTerminalAssumption(
                          'stabilityAdjustments.reinvestmentRate',
                          value
                        )
                      }
                      min={0}
                      max={100}
                      step={5}
                      decimals={0}
                    />
                    <p className="text-xs text-muted-foreground">% of NOPAT reinvested</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Return on Invested Capital (ROIC)</Label>
                  <PercentageInput
                    value={terminalAssumptions.stabilityAdjustments.returnOnInvestedCapital}
                    onChange={(value) =>
                      handleUpdateTerminalAssumption(
                        'stabilityAdjustments.returnOnInvestedCapital',
                        value
                      )
                    }
                    min={0}
                    max={50}
                    step={1}
                    decimals={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Should converge to industry average over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculation Methods */}
        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Working Capital Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Calculation Method</Label>
                <Select
                  value={localAssumptions.workingCapitalMethod}
                  onValueChange={(value) => handleUpdateAssumption('workingCapitalMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days Outstanding</SelectItem>
                    <SelectItem value="percentage">Percentage of Revenue</SelectItem>
                    <SelectItem value="detailed">Detailed Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {localAssumptions.workingCapitalMethod === 'days' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Days Receivables (DSO)</Label>
                    <Input
                      type="number"
                      value={localAssumptions.daysReceivables}
                      onChange={(e) =>
                        handleUpdateAssumption('daysReceivables', parseInt(e.target.value))
                      }
                      min={0}
                      max={180}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Days Inventory (DIO)</Label>
                    <Input
                      type="number"
                      value={localAssumptions.daysInventory}
                      onChange={(e) =>
                        handleUpdateAssumption('daysInventory', parseInt(e.target.value))
                      }
                      min={0}
                      max={180}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Days Payables (DPO)</Label>
                    <Input
                      type="number"
                      value={localAssumptions.daysPayables}
                      onChange={(e) =>
                        handleUpdateAssumption('daysPayables', parseInt(e.target.value))
                      }
                      min={0}
                      max={180}
                    />
                  </div>
                </div>
              )}

              {localAssumptions.workingCapitalMethod === 'percentage' && (
                <div className="space-y-2">
                  <Label>Target NWC (% of Revenue)</Label>
                  <PercentageInput
                    value={localAssumptions.targetNWCPercent}
                    onChange={(value) => handleUpdateAssumption('targetNWCPercent', value)}
                    min={0}
                    max={50}
                    step={1}
                    decimals={0}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Capital Expenditure Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Calculation Method</Label>
                <Select
                  value={localAssumptions.capexMethod}
                  onValueChange={(value) => handleUpdateAssumption('capexMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage of Revenue</SelectItem>
                    <SelectItem value="growth">Maintenance + Growth</SelectItem>
                    <SelectItem value="schedule">Detailed Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {localAssumptions.capexMethod === 'percentage' && (
                <div className="space-y-2">
                  <Label>Capex (% of Revenue)</Label>
                  <PercentageInput
                    value={localAssumptions.capexPercent}
                    onChange={(value) => handleUpdateAssumption('capexPercent', value)}
                    min={0}
                    max={30}
                    step={0.5}
                    decimals={1}
                  />
                </div>
              )}

              {localAssumptions.capexMethod === 'growth' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maintenance Capex (%)</Label>
                    <PercentageInput
                      value={localAssumptions.maintenanceCapexPercent}
                      onChange={(value) => handleUpdateAssumption('maintenanceCapexPercent', value)}
                      min={0}
                      max={20}
                      step={0.5}
                      decimals={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Growth Capex (%)</Label>
                    <PercentageInput
                      value={localAssumptions.growthCapexPercent}
                      onChange={(value) => handleUpdateAssumption('growthCapexPercent', value)}
                      min={0}
                      max={20}
                      step={0.5}
                      decimals={1}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Fine-tune calculation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  These settings affect the precision and methodology of calculations. Only modify
                  if you understand the implications.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Depreciation Method</Label>
                  <Select
                    value={localAssumptions.depreciationMethod}
                    onValueChange={(value) => handleUpdateAssumption('depreciationMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage of Revenue</SelectItem>
                      <SelectItem value="schedule">Depreciation Schedule</SelectItem>
                      <SelectItem value="manual">Manual Input</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {localAssumptions.depreciationMethod === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Depreciation (% of Revenue)</Label>
                    <PercentageInput
                      value={localAssumptions.depreciationPercent}
                      onChange={(value) => handleUpdateAssumption('depreciationPercent', value)}
                      min={0}
                      max={20}
                      step={0.5}
                      decimals={1}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
