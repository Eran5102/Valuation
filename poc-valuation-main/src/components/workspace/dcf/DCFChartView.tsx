import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency } from '@/utils/formatters'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'

interface DCFChartViewProps {
  projectionYearLabels: string[]
  calculatedProjections: {
    revenue: number[]
    ebit?: number[]
    fcf: number[]
  }
  unitMultiplier: number
  currency: string
  // Add the stubPeriod property
  stubPeriod?: {
    isStubPeriod: boolean
    stubPeriodFraction: number
    fcf: number
    discountedFcf: number
  }
}

export function DCFChartView({
  projectionYearLabels,
  calculatedProjections,
  unitMultiplier,
  currency,
  stubPeriod,
}: DCFChartViewProps) {
  const [activeChart, setActiveChart] = useState('revenue-chart')

  // Format data for charts
  const chartData = projectionYearLabels.map((year, index) => ({
    year,
    revenue: calculatedProjections.revenue[index] || 0,
    ebit: calculatedProjections.ebit ? calculatedProjections.ebit[index] || 0 : 0,
    fcf: calculatedProjections.fcf[index] || 0,
  }))

  // Add stub period data if available
  if (stubPeriod && stubPeriod.isStubPeriod) {
    // Add stub period as "Stub" in the chart data at the beginning
    chartData.unshift({
      year: 'Stub',
      revenue: 0, // We don't show revenue for stub period in the chart
      ebit: 0, // We don't show EBIT for stub period in the chart
      fcf: stubPeriod.fcf || 0,
    })
  }

  // Format function for the tooltip and axis labels
  const formatChartValue = (value: number) => {
    return formatCurrency(value, { unitMultiplier, currency, decimals: 1 })
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border bg-white p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              <span className="font-medium">{entry.name}: </span>
              {formatChartValue(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeChart} onValueChange={setActiveChart}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="revenue-chart" className="flex-1">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="profitability-chart" className="flex-1">
            Profitability
          </TabsTrigger>
          <TabsTrigger value="fcf-chart" className="flex-1">
            Free Cash Flow
          </TabsTrigger>
          <TabsTrigger value="combined-chart" className="flex-1">
            Combined View
          </TabsTrigger>
        </TabsList>

        {/* Revenue Chart */}
        <TabsContent value="revenue-chart">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-medium">Revenue Projection</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" angle={-45} textAnchor="end" height={60} />
                    <YAxis tickFormatter={formatChartValue} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#4f46e5"
                      barSize={50}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profitability Chart */}
        <TabsContent value="profitability-chart">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-medium">EBIT Projection</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" angle={-45} textAnchor="end" height={60} />
                    <YAxis tickFormatter={formatChartValue} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="ebit"
                      name="EBIT"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Free Cash Flow Chart */}
        <TabsContent value="fcf-chart">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-medium">Free Cash Flow Projection</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" angle={-45} textAnchor="end" height={60} />
                    <YAxis tickFormatter={formatChartValue} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="fcf"
                      name="Free Cash Flow"
                      fill="#d97706"
                      barSize={50}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Combined Chart */}
        <TabsContent value="combined-chart">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-medium">Combined Financial Projections</h3>
              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" angle={-45} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tickFormatter={formatChartValue} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={formatChartValue} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Revenue"
                      fill="#4f46e5"
                      barSize={50}
                      opacity={0.7}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="ebit"
                      name="EBIT"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="fcf"
                      name="Free Cash Flow"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="px-1 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> All values shown are in{' '}
          {unitMultiplier === 1
            ? 'Dollars'
            : unitMultiplier === 1000
              ? 'Thousands'
              : unitMultiplier === 1000000
                ? 'Millions'
                : 'Billions'}{' '}
          of {currency}.
        </p>
      </div>
    </div>
  )
}
