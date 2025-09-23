import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatPercent } from '@/utils/formatters'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Toggle } from '@/components/ui/toggle'
import { Switch } from '@/components/ui/switch'

interface DCFStubPeriodInputsProps {
  isStubPeriod: boolean
  setIsStubPeriod: (value: boolean) => void
  stubPeriodFraction: number
  stubPeriodEndDate: string
  lastFYEDate: string
  valuationDate: string
  stubInputs: {
    revenue: number
    ebit: number
    taxes: number
    depreciation: number
    capex: number
    nwcChange: number
  }
  onStubInputChange: (
    input: keyof {
      revenue: number
      ebit: number
      taxes: number
      depreciation: number
      capex: number
      nwcChange: number
    },
    value: number
  ) => void
  currency: string
  unitMultiplier: number
}

export function DCFStubPeriodInputs({
  isStubPeriod,
  setIsStubPeriod,
  stubPeriodFraction,
  stubPeriodEndDate,
  lastFYEDate,
  valuationDate,
  stubInputs,
  onStubInputChange,
  currency,
  unitMultiplier,
}: DCFStubPeriodInputsProps) {
  // Format dates for display
  const formattedLastFYE = lastFYEDate ? new Date(lastFYEDate).toLocaleDateString() : 'N/A'
  const formattedValuationDate = valuationDate
    ? new Date(valuationDate).toLocaleDateString()
    : 'N/A'
  const formattedStubEndDate = stubPeriodEndDate
    ? new Date(stubPeriodEndDate).toLocaleDateString()
    : 'N/A'

  // Helper to handle input changes
  const handleInputChange =
    (field: keyof typeof stubInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove commas and other non-numeric characters except minus sign
      const cleanValue = e.target.value.replace(/[^\d.-]/g, '')
      const value = parseFloat(cleanValue) || 0
      onStubInputChange(field, value)
    }

  // Format number for display with commas and no decimals
  const formatNumberWithCommas = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Determine unit label based on multiplier
  const getUnitLabel = () => {
    switch (unitMultiplier) {
      case 1000:
        return 'thousands'
      case 1000000:
        return 'millions'
      case 1000000000:
        return 'billions'
      default:
        return ''
    }
  }

  const unitLabel = getUnitLabel()
  const displayCurrency = unitLabel ? `${currency} ${unitLabel}` : currency

  return (
    <Card className="mb-4 border-muted bg-card">
      <CardHeader className="bg-muted/20 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            Stub Period Inputs
            <InfoTooltip
              text={`Financial inputs for partial period from ${formattedValuationDate} to ${formattedStubEndDate}`}
            />
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Enable Stub Period</span>
            <Switch
              checked={isStubPeriod}
              onCheckedChange={setIsStubPeriod}
              aria-label="Toggle stub period"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isStubPeriod ? (
          <>
            <div className="mb-4 text-sm">
              <p>
                Enter projected financials for the partial first year from {formattedValuationDate}{' '}
                to {formattedStubEndDate}.
              </p>
              <p className="mt-1 font-medium">
                Stub Period Length: {(stubPeriodFraction * 12).toFixed(1)} months (
                {formatPercent(stubPeriodFraction, { decimals: 1 })} of a year)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="stub-revenue">Revenue ({displayCurrency})</Label>
                <Input
                  id="stub-revenue"
                  type="text"
                  value={stubInputs.revenue ? formatNumberWithCommas(stubInputs.revenue) : ''}
                  onChange={handleInputChange('revenue')}
                  placeholder="Enter revenue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stub-ebit">EBIT ({displayCurrency})</Label>
                <Input
                  id="stub-ebit"
                  type="text"
                  value={stubInputs.ebit ? formatNumberWithCommas(stubInputs.ebit) : ''}
                  onChange={handleInputChange('ebit')}
                  placeholder="Enter EBIT"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stub-taxes">Taxes on EBIT ({displayCurrency})</Label>
                <Input
                  id="stub-taxes"
                  type="text"
                  value={stubInputs.taxes ? formatNumberWithCommas(stubInputs.taxes) : ''}
                  onChange={handleInputChange('taxes')}
                  placeholder="Enter taxes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stub-depreciation">
                  Depreciation & Amortization ({displayCurrency})
                </Label>
                <Input
                  id="stub-depreciation"
                  type="text"
                  value={
                    stubInputs.depreciation ? formatNumberWithCommas(stubInputs.depreciation) : ''
                  }
                  onChange={handleInputChange('depreciation')}
                  placeholder="Enter depreciation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stub-capex">Capital Expenditures ({displayCurrency})</Label>
                <Input
                  id="stub-capex"
                  type="text"
                  value={stubInputs.capex ? formatNumberWithCommas(stubInputs.capex) : ''}
                  onChange={handleInputChange('capex')}
                  placeholder="Enter CapEx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stub-nwc">Change in Net Working Capital ({displayCurrency})</Label>
                <Input
                  id="stub-nwc"
                  type="text"
                  value={stubInputs.nwcChange ? formatNumberWithCommas(stubInputs.nwcChange) : ''}
                  onChange={handleInputChange('nwcChange')}
                  placeholder="Enter NWC change"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Stub period is disabled. Enable it to include partial first year projections in your DCF
            analysis.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
