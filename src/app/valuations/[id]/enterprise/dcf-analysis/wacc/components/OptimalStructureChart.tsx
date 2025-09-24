'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, RefreshCw } from 'lucide-react'
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

interface OptimalStructureChartProps {
  optimalStructure: {
    optimalDebtRatio: number
    optimalWACC: number
    scenarios: Array<{ debtRatio: number; wacc: number }>
  } | null
  onCalculate: () => void
  isCalculating: boolean
}

export function OptimalStructureChart({
  optimalStructure,
  onCalculate,
  isCalculating,
}: OptimalStructureChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Optimal Capital Structure Analysis
            </CardTitle>
            <CardDescription>Find the debt ratio that minimizes WACC</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onCalculate} disabled={isCalculating}>
            {isCalculating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Find Optimal Structure
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {optimalStructure ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-primary/5 p-4">
              <div>
                <div className="text-sm text-muted-foreground">Optimal Debt Ratio</div>
                <div className="text-2xl font-bold text-primary">
                  {(optimalStructure.optimalDebtRatio * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Minimum WACC</div>
                <div className="text-2xl font-bold text-primary">
                  {optimalStructure.optimalWACC.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={optimalStructure.scenarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="debtRatio"
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    label={{ value: 'Debt Ratio', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    label={{ value: 'WACC', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    labelFormatter={(value) => `Debt Ratio: ${(value * 100).toFixed(0)}%`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="wacc"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="WACC"
                    dot={false}
                  />
                  <ReferenceLine
                    x={optimalStructure.optimalDebtRatio}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    label={{ value: 'Optimal', position: 'top' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                The optimal capital structure occurs at a debt ratio of{' '}
                <span className="font-semibold text-foreground">
                  {(optimalStructure.optimalDebtRatio * 100).toFixed(1)}%
                </span>
                , resulting in a minimum WACC of{' '}
                <span className="font-semibold text-foreground">
                  {optimalStructure.optimalWACC.toFixed(2)}%
                </span>
                . This represents the point where the tax benefits of debt are optimally balanced
                with the increased financial risk.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="mb-3 h-12 w-12" />
            <p>Click "Find Optimal Structure" to analyze</p>
            <p className="text-sm">different capital structure scenarios</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
