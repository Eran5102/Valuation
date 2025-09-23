import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, ChevronUp, Percent, DollarSign, SlidersHorizontal } from 'lucide-react'
import { formatPercent } from '@/utils/formatters'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface DCFAssumptionsSummaryProps {
  discountRate: number
  terminalGrowthRate: number
  taxRate: number
  forecastPeriod: number
  onDiscountRateChange: (value: number[]) => void
  onTerminalGrowthChange: (value: number[]) => void
  onTaxRateChange: (value: number[]) => void
  onForecastPeriodChange: (value: number[]) => void
  maxProjectionYears?: number
  terminalValueMethod?: string
}

export function DCFAssumptionsSummary({
  discountRate,
  terminalGrowthRate,
  taxRate,
  forecastPeriod,
  onDiscountRateChange,
  onTerminalGrowthChange,
  onTaxRateChange,
  onForecastPeriodChange,
  maxProjectionYears = 10,
  terminalValueMethod = 'PGM',
}: DCFAssumptionsSummaryProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card className="mb-6 overflow-hidden border">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between border-b bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Valuation Parameters</h3>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-6 p-6">
            {/* Assumptions in a single row with 4 columns layout */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Discount Rate (WACC) */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <Percent className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Discount Rate (WACC) {discountRate}%</span>
                </div>
                <Slider
                  value={[discountRate]}
                  min={5}
                  max={25}
                  step={0.5}
                  onValueChange={onDiscountRateChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5%</span>
                  <span>25%</span>
                </div>
              </div>

              {/* Terminal Growth Rate - Only show when terminal value method is PGM */}
              {terminalValueMethod === 'PGM' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    <Percent className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Terminal Growth Rate {terminalGrowthRate}%
                    </span>
                  </div>
                  <Slider
                    value={[terminalGrowthRate]}
                    min={0}
                    max={5}
                    step={0.1}
                    onValueChange={onTerminalGrowthChange}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>5%</span>
                  </div>
                </div>
              )}

              {/* Tax Rate */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Tax Rate {taxRate}%</span>
                </div>
                <Slider
                  value={[taxRate]}
                  min={0}
                  max={40}
                  step={1}
                  onValueChange={onTaxRateChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>40%</span>
                </div>
              </div>

              {/* Forecast Period */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">
                    Forecast Period {forecastPeriod} years
                  </span>
                </div>
                <Slider
                  value={[forecastPeriod]}
                  min={3}
                  max={maxProjectionYears}
                  step={1}
                  onValueChange={onForecastPeriodChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3 years</span>
                  <span>{maxProjectionYears} years</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
