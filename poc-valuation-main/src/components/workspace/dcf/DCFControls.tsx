import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatPercent } from '@/utils/formatters'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'

interface DCFControlsProps {
  unitMultiplier: number
  currency: string
  forecastPeriod: number
  maxProjectionYears: number
  discountRate: number
  taxRate: number
  terminalGrowthRate: number
  terminalValueMethod: string
  exitMultipleMetric: string
  exitMultipleValue: number
  onUnitChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onForecastPeriodChange: (value: number[]) => void
  onDiscountRateChange: (value: number[]) => void
  onTaxRateChange: (value: number[]) => void
  onTerminalGrowthChange: (value: number[]) => void
  onTerminalValueMethodChange: (value: string) => void
  onExitMultipleMetricChange: (value: string) => void
  onExitMultipleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNavigateToDepreciationSchedule: () => void
  hasCustomDepreciationSchedule?: boolean
  depreciationSource: 'scenario' | 'schedule'
  onDepreciationSourceChange: (source: 'scenario' | 'schedule') => void
  showMainControlSliders?: boolean
}

export function DCFControls({
  unitMultiplier,
  currency,
  forecastPeriod,
  maxProjectionYears,
  discountRate,
  taxRate,
  terminalGrowthRate,
  terminalValueMethod,
  exitMultipleMetric,
  exitMultipleValue,
  onUnitChange,
  onCurrencyChange,
  onForecastPeriodChange,
  onDiscountRateChange,
  onTaxRateChange,
  onTerminalGrowthChange,
  onTerminalValueMethodChange,
  onExitMultipleMetricChange,
  onExitMultipleValueChange,
  onNavigateToDepreciationSchedule,
  hasCustomDepreciationSchedule = false,
  depreciationSource,
  onDepreciationSourceChange,
  showMainControlSliders = true,
}: DCFControlsProps) {
  const [expanded, setExpanded] = useState(true)

  const toggleExpanded = () => setExpanded((prev) => !prev)

  return (
    <Card className="mb-4 overflow-hidden">
      <div
        className="flex cursor-pointer items-center justify-between border-b bg-slate-50 p-4"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="text-teal h-5 w-5" />
          <h3 className="font-medium">DCF Controls</h3>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {expanded && (
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Display Units */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="unit-select">Display Units</Label>
                <InfoTooltip text="Choose the units to display financial figures (e.g., thousands, millions, etc.)" />
              </div>
              <Select value={String(unitMultiplier)} onValueChange={onUnitChange}>
                <SelectTrigger id="unit-select">
                  <SelectValue placeholder="Select units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dollars</SelectItem>
                  <SelectItem value="1000">Thousands</SelectItem>
                  <SelectItem value="1000000">Millions</SelectItem>
                  <SelectItem value="1000000000">Billions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="currency-select">Currency</Label>
                <InfoTooltip text="The currency used for financial calculations and display" />
              </div>
              <Select value={currency} onValueChange={onCurrencyChange}>
                <SelectTrigger id="currency-select">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Terminal Value Method */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="terminal-value-method">Terminal Value Method</Label>
                <InfoTooltip text="Method used to calculate the value of all future cash flows beyond the explicit forecast period" />
              </div>
              <Select value={terminalValueMethod} onValueChange={onTerminalValueMethodChange}>
                <SelectTrigger id="terminal-value-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PGM">Perpetuity Growth Model</SelectItem>
                  <SelectItem value="EXIT">Exit Multiple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exit Multiple (if EXIT) */}
            {terminalValueMethod === 'EXIT' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="exit-multiple-metric">Exit Multiple Metric</Label>
                    <InfoTooltip text="Financial metric used as the basis for the exit multiple" />
                  </div>
                  <Select value={exitMultipleMetric} onValueChange={onExitMultipleMetricChange}>
                    <SelectTrigger id="exit-multiple-metric">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EBITDA">EBITDA</SelectItem>
                      <SelectItem value="EBIT">EBIT</SelectItem>
                      <SelectItem value="Revenue">Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="exit-multiple-value">Exit Multiple (x)</Label>
                    <InfoTooltip text="Multiple applied to the selected metric in the final forecast year to calculate terminal value" />
                  </div>
                  <Input
                    id="exit-multiple-value"
                    type="number"
                    value={exitMultipleValue}
                    onChange={onExitMultipleValueChange}
                    step={0.1}
                    min={0}
                  />
                </div>
              </>
            )}

            {/* Depreciation Source */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="depreciation-source">Depreciation & CapEx Source</Label>
                <InfoTooltip text="Choose where to pull depreciation and capital expenditure data from" />
              </div>
              <Select
                value={depreciationSource}
                onValueChange={(value: 'scenario' | 'schedule') =>
                  onDepreciationSourceChange(value)
                }
              >
                <SelectTrigger id="depreciation-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scenario">Scenario Assumptions</SelectItem>
                  <SelectItem value="schedule">Custom Schedule</SelectItem>
                </SelectContent>
              </Select>

              {depreciationSource === 'schedule' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={onNavigateToDepreciationSchedule}
                >
                  {hasCustomDepreciationSchedule ? 'Edit Schedule' : 'Create Schedule'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
