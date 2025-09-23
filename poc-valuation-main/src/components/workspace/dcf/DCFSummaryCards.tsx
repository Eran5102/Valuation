import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { DollarSign, TrendingUp, LineChart, BarChart } from 'lucide-react'

interface DCFSummaryCardsProps {
  enterpriseValue: number
  pvFcf: number[]
  pvTerminalValue: number
  impliedMultiple?: number
  discountRate: number
  terminalGrowthRate: number
  unitMultiplier: number
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  // Add the stubPeriod property
  stubPeriod?: {
    isStubPeriod: boolean
    stubPeriodFraction: number
    fcf: number
    discountedFcf: number
  }
}

export function DCFSummaryCards({
  enterpriseValue,
  pvFcf,
  pvTerminalValue,
  impliedMultiple,
  discountRate,
  terminalGrowthRate,
  unitMultiplier,
  currency,
  stubPeriod,
}: DCFSummaryCardsProps) {
  // Calculate sum of present value of FCF
  const sumPvFcf = Array.isArray(pvFcf) ? pvFcf.reduce((a, b) => a + b, 0) : 0

  // Calculate terminal value as percentage of total enterprise value
  const terminalValuePercentage =
    enterpriseValue > 0 ? (pvTerminalValue / enterpriseValue) * 100 : 0

  // Include stub period FCF in totals if applicable
  const stubPeriodValue = stubPeriod?.discountedFcf || 0
  const totalPvFcf = sumPvFcf + stubPeriodValue
  const projectionValuePercentage = enterpriseValue > 0 ? (totalPvFcf / enterpriseValue) * 100 : 0

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Enterprise Value</CardTitle>
          <DollarSign className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(enterpriseValue, { unitMultiplier, currency })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Based on {formatPercent(discountRate / 100)} discount rate
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Terminal Value</CardTitle>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(pvTerminalValue, { unitMultiplier, currency })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatPercent(terminalValuePercentage / 100)} of enterprise value
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Projection Period</CardTitle>
          <LineChart className="h-5 w-5 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalPvFcf, { unitMultiplier, currency })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatPercent(projectionValuePercentage / 100)} of enterprise value
            {stubPeriod?.isStubPeriod && (
              <div className="text-xs">
                Includes stub period:{' '}
                {formatCurrency(stubPeriodValue, { unitMultiplier, currency })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {impliedMultiple !== undefined && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Implied Multiple</CardTitle>
            <BarChart className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{impliedMultiple.toFixed(1)}x</div>
            <div className="mt-1 text-sm text-muted-foreground">Enterprise Value / EBITDA</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
