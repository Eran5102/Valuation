'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Calculator,
  Calendar,
  DollarSign,
  Info,
  Save,
  Settings,
  TrendingUp,
  Building2,
} from 'lucide-react'
import { PercentageInput } from '@/components/ui/percentage-input'
import { ValuationMethodologySelector } from '@/components/valuation/ValuationMethodologySelector'
import { CoreAssumptions, saveCoreAssumptions } from './actions'
import { useMethodologyStore } from '@/hooks/useMethodologyStore'
import { useDebouncedCallback } from 'use-debounce'

interface CoreAssumptionsClientProps {
  valuationId: string
  valuation: any
  initialAssumptions: CoreAssumptions
}

export default function CoreAssumptionsClient({
  valuationId,
  valuation,
  initialAssumptions,
}: CoreAssumptionsClientProps) {
  const [assumptions, setAssumptions] = useState<CoreAssumptions>(initialAssumptions)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { methodologies } = useMethodologyStore()

  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(
    async (data: CoreAssumptions) => {
      setIsSaving(true)
      const result = await saveCoreAssumptions(valuationId, data)
      if (result.success) {
        toast.success('Assumptions saved')
        setHasChanges(false)
      } else {
        toast.error(result.error || 'Failed to save')
      }
      setIsSaving(false)
    },
    2000 // 2 second delay
  )

  // Handle input changes
  const handleChange = useCallback(
    (field: keyof CoreAssumptions, value: any) => {
      const newAssumptions = { ...assumptions, [field]: value }
      setAssumptions(newAssumptions)
      setHasChanges(true)
      debouncedSave(newAssumptions)
    },
    [assumptions, debouncedSave]
  )

  // Manual save
  const handleSave = async () => {
    setIsSaving(true)
    const result = await saveCoreAssumptions(valuationId, assumptions)
    if (result.success) {
      toast.success('Assumptions saved successfully')
      setHasChanges(false)
    } else {
      toast.error(result.error || 'Failed to save assumptions')
    }
    setIsSaving(false)
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Core Project Assumptions</h1>
          <p className="mt-2 text-muted-foreground">
            Define the fundamental parameters and methodologies for your valuation analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50">
              Unsaved changes
            </Badge>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="methodologies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="methodologies">Methodologies</TabsTrigger>
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="periods">Analysis Periods</TabsTrigger>
          <TabsTrigger value="financial">Financial Parameters</TabsTrigger>
        </TabsList>

        {/* Methodologies Tab */}
        <TabsContent value="methodologies" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select the valuation methodologies you want to use. The sidebar will dynamically
              update to show only relevant sections based on your selections.
            </AlertDescription>
          </Alert>

          <ValuationMethodologySelector />

          {/* Show selected methodologies summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Methodologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {methodologies
                  .filter((m) => m.enabled)
                  .map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <div>
                        <span className="font-medium">{method.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {method.category}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{method.weight}%</span>
                    </div>
                  ))}
                {methodologies.filter((m) => m.enabled).length === 0 && (
                  <p className="text-sm text-muted-foreground">No methodologies selected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Fundamentals Tab */}
        <TabsContent value="fundamentals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project Settings
              </CardTitle>
              <CardDescription>Core dates and conventions for the valuation</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valuationDate">
                  Valuation Date
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The as-of date for the valuation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="valuationDate"
                  type="date"
                  value={assumptions.valuationDate}
                  onChange={(e) => handleChange('valuationDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalYearEnd">
                  Most Recent Fiscal Year End
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The date of the most recently completed fiscal year</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="fiscalYearEnd"
                  type="date"
                  value={assumptions.mostRecentFiscalYearEnd}
                  onChange={(e) => handleChange('mostRecentFiscalYearEnd', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={assumptions.currency}
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="convention">
                  Discounting Convention
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>When cash flows are assumed to occur during the period</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={assumptions.discountingConvention}
                  onValueChange={(value) => handleChange('discountingConvention', value)}
                >
                  <SelectTrigger id="convention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                    <SelectItem value="End-Year">End-Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Periods Tab */}
        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analysis Periods
              </CardTitle>
              <CardDescription>
                Define the historical and projection periods for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="historicalYears">
                  Number of Historical Years
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of historical fiscal years to include (1-10)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="historicalYears"
                  type="number"
                  min="1"
                  max="10"
                  value={assumptions.historicalYears}
                  onChange={(e) => handleChange('historicalYears', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">Min: 1, Max: 10 years</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectionYears">
                  Maximum Projection Years
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Maximum years for forecast assumptions (1-30)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="projectionYears"
                  type="number"
                  min="1"
                  max="30"
                  value={assumptions.maxProjectionYears}
                  onChange={(e) => handleChange('maxProjectionYears', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Sets the maximum forecast period for DCF and scenario analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Parameters Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                DCF Parameters
              </CardTitle>
              <CardDescription>Core financial assumptions for DCF analysis</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="taxRate">
                  Tax Rate (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Effective tax rate for calculations</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <PercentageInput
                  id="taxRate"
                  value={assumptions.taxRate}
                  onChange={(value) => handleChange('taxRate', value)}
                  min={0}
                  max={100}
                  step={0.1}
                  decimals={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountRate">
                  Discount Rate (WACC) (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Weighted average cost of capital</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <PercentageInput
                  id="discountRate"
                  value={assumptions.discountRate}
                  onChange={(value) => handleChange('discountRate', value)}
                  min={0}
                  max={100}
                  step={0.1}
                  decimals={1}
                />
                <p className="text-sm text-muted-foreground">
                  You can calculate this using the WACC Calculator
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminalGrowth">
                  Terminal Growth Rate (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Long-term growth rate for terminal value</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <PercentageInput
                  id="terminalGrowth"
                  value={assumptions.terminalGrowthRate}
                  onChange={(value) => handleChange('terminalGrowthRate', value)}
                  min={-10}
                  max={20}
                  step={0.1}
                  decimals={1}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Enterprise to Equity Value Bridge
              </CardTitle>
              <CardDescription>Cash and debt balances as of valuation date</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cashBalance">
                  Cash Balance
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cash and cash equivalents as of valuation date</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cashBalance"
                    type="number"
                    min="0"
                    step="1000"
                    value={assumptions.cashBalance}
                    onChange={(e) => handleChange('cashBalance', parseFloat(e.target.value))}
                    className="pl-8"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="debtBalance">
                  Debt Balance
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline-block h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total debt as of valuation date</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="debtBalance"
                    type="number"
                    min="0"
                    step="1000"
                    value={assumptions.debtBalance}
                    onChange={(e) => handleChange('debtBalance', parseFloat(e.target.value))}
                    className="pl-8"
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Period Labeling Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Period Labeling Convention:</strong> Financial columns will be labeled based on
          the Fiscal Year End ({assumptions.mostRecentFiscalYearEnd}) relative to the Valuation Date
          ({assumptions.valuationDate}). Example: 'FYE Jun 2024', 'FYE Jun 2025', etc.
        </AlertDescription>
      </Alert>
    </div>
  )
}
