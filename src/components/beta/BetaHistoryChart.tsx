'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Calendar, TrendingUp, RefreshCw, Activity } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface BetaDataPoint {
  date: string
  beta: number
  rSquared: number
}

interface BetaHistoryChartProps {
  valuationId: string
  ticker?: string
  valuationDate?: string
}

export function BetaHistoryChart({ valuationId, ticker, valuationDate }: BetaHistoryChartProps) {
  const [loading, setLoading] = useState(false)
  const [betaHistory, setBetaHistory] = useState<BetaDataPoint[]>([])
  const [periodYears, setPeriodYears] = useState(2)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [statistics, setStatistics] = useState<{
    currentBeta: number
    averageBeta: number
    minBeta: number
    maxBeta: number
    volatility: number
    trend: 'increasing' | 'decreasing' | 'stable'
  } | null>(null)

  useEffect(() => {
    if (ticker) {
      fetchBetaHistory()
    }
  }, [ticker, periodYears, frequency])

  const fetchBetaHistory = async () => {
    if (!ticker) return

    setLoading(true)
    try {
      const response = await fetch('/api/beta/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          valuationDate: valuationDate || new Date().toISOString(),
          periodYears,
          frequency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setBetaHistory(data.history)
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Error fetching beta history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatXAxis = (dateStr: string) => {
    const date = parseISO(dateStr)
    return format(date, frequency === 'monthly' ? 'MMM yy' : 'MM/dd')
  }

  const formatTooltipDate = (dateStr: string) => {
    const date = parseISO(dateStr)
    return format(date, 'MMM dd, yyyy')
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-semibold">{formatTooltipDate(label)}</p>
          <p className="text-sm text-primary">Beta: {payload[0].value.toFixed(3)}</p>
          {payload[1] && (
            <p className="text-sm text-muted-foreground">R²: {payload[1].value.toFixed(3)}</p>
          )}
        </div>
      )
    }
    return null
  }

  const getTrendIcon = () => {
    if (!statistics) return null
    switch (statistics.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Beta History Analysis
              </CardTitle>
              <CardDescription>Historical beta calculations relative to S&P 500</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={periodYears.toString()}
                onValueChange={(v) => setPeriodYears(Number(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                </SelectContent>
              </Select>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBetaHistory}
                disabled={loading || !ticker}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {statistics && (
            <div className="mb-6 grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Current Beta</div>
                <div className="text-2xl font-bold">{statistics.currentBeta.toFixed(3)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Average</div>
                <div className="text-xl font-semibold">{statistics.averageBeta.toFixed(3)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Min</div>
                <div className="text-xl">{statistics.minBeta.toFixed(3)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Max</div>
                <div className="text-xl">{statistics.maxBeta.toFixed(3)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Trend</div>
                <div className="flex items-center justify-center gap-1 text-xl">
                  {getTrendIcon()}
                  <span className="text-sm capitalize">{statistics.trend}</span>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="beta" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="beta">Beta Trend</TabsTrigger>
              <TabsTrigger value="rsquared">R-Squared</TabsTrigger>
            </TabsList>

            <TabsContent value="beta" className="mt-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={betaHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} className="text-xs" />
                  <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {statistics && (
                    <ReferenceLine
                      y={statistics.averageBeta}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      label="Average"
                    />
                  )}
                  {valuationDate && (
                    <ReferenceLine
                      x={valuationDate}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="3 3"
                      label="Valuation Date"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="beta"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Beta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="rsquared" className="mt-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={betaHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickFormatter={formatXAxis} className="text-xs" />
                  <YAxis domain={[0, 1]} className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine
                    y={0.3}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    label="Low Correlation"
                  />
                  <ReferenceLine
                    y={0.7}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="5 5"
                    label="High Correlation"
                  />
                  <Line
                    type="monotone"
                    dataKey="rSquared"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="R-Squared"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>

          {betaHistory.length === 0 && !loading && (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <Calendar className="mb-4 h-12 w-12" />
              <p>No beta history available</p>
              {!ticker && <p className="mt-2 text-sm">Enter a ticker symbol to load data</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
