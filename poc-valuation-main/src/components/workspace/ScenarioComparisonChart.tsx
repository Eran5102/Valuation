import React, { useMemo } from 'react'
import { ChartContainer } from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, HelpCircle } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { Tooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface ScenarioData {
  id: string
  name: string
  enterpriseValue: number
  isActive?: boolean
}

interface ScenarioComparisonChartProps {
  scenarios: ScenarioData[]
  unitMultiplier: number
  currency: string
  title?: string
  subtitle?: string
}

export function ScenarioComparisonChart({
  scenarios,
  unitMultiplier,
  currency,
  title = 'Scenario Comparison: Implied Enterprise Value',
  subtitle = 'DCF valuation results across defined scenarios',
}: ScenarioComparisonChartProps) {
  const chartColors = {
    'Base Case': '#3b82f6', // blue
    'Upside Case': '#22c55e', // green
    'Downside Case': '#ef4444', // red
    active: '#8b5cf6', // purple for active scenario
    other: '#6b7280', // gray for other scenarios
  }

  const chartData = useMemo(() => {
    if (!scenarios || scenarios.length === 0) {
      return []
    }

    return scenarios.map((scenario) => ({
      name: scenario.name,
      value: scenario.enterpriseValue,
      isActive: scenario.isActive || false,
    }))
  }, [scenarios])

  // If no data available, show placeholder
  if (!chartData.length) {
    return (
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center bg-muted/5 p-6">
          <div className="text-center text-muted-foreground">
            <p>No scenario data available</p>
            <p className="mt-2 text-sm">Create scenarios to see comparison</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="bg-muted/40 pb-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
          <Tooltip
            content={
              <div className="max-w-xs">
                <p>
                  <strong>What this shows:</strong> This chart compares the Enterprise Value across
                  different DCF scenarios you've created.
                </p>
                <p className="mt-2">
                  <strong>Color coding:</strong> Blue = Base Case, Green = Upside Case, Red =
                  Downside Case, Purple = Active Scenario (when not one of the standard cases).
                </p>
                <p className="mt-2">
                  <strong>Create scenarios</strong> in the Scenario Manager to add more bars to this
                  chart.
                </p>
              </div>
            }
          >
            <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Tooltip>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-64">
          <ChartContainer
            config={{
              bar: { color: '#3b82f6' },
              grid: { color: '#e5e7eb' },
            }}
          >
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-grid)" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tickMargin={10} />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(value, { unitMultiplier, currency, decimals: 0 })
                }
              />
              <RechartsTooltip
                formatter={(value: number) => [
                  formatCurrency(value, { unitMultiplier, currency }),
                  'Enterprise Value',
                ]}
              />
              <Legend />
              <Bar
                dataKey="value"
                name="Enterprise Value"
                fill="var(--color-bar)"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => {
                  let color = chartColors[entry.name as keyof typeof chartColors]
                  if (!color) {
                    color = entry.isActive ? chartColors.active : chartColors.other
                  }
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
