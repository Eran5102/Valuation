import React, { useState, useEffect } from 'react'
import { BarChart3, Calculator, Download, Settings, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CapTableConfig } from '@/types'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface ComprehensiveWaterfallProps {
  companyId: number
  capTableConfig: CapTableConfig
}

export default function ComprehensiveWaterfall({
  companyId,
  capTableConfig,
}: ComprehensiveWaterfallProps) {
  const [exitValue, setExitValue] = useState(20000000)
  const [isCalculated, setIsCalculated] = useState(false)

  const mockWaterfallResults = [
    {
      security: 'Series B Preferred',
      shares: 128571,
      liquidationPreference: 2000000,
      participationAmount: 850000,
      totalDistribution: 2850000,
      valuePerShare: 22.17,
      multiple: 1.43,
    },
    {
      security: 'Series A Preferred',
      shares: 300000,
      liquidationPreference: 3000000,
      participationAmount: 1200000,
      totalDistribution: 4200000,
      valuePerShare: 14.0,
      multiple: 1.4,
    },
    {
      security: 'Common Stock',
      shares: 1000000,
      liquidationPreference: 0,
      participationAmount: 12950000,
      totalDistribution: 12950000,
      valuePerShare: 12.95,
      multiple: 12950,
    },
  ]

  const calculateWaterfall = async () => {

    // In a real implementation, this would call the comprehensive waterfall engine
    setIsCalculated(true)
  }

  const totalDistributed = mockWaterfallResults.reduce(
    (sum, result) => sum + result.totalDistribution,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Comprehensive Waterfall</h2>
          <p className="text-muted-foreground">
            Distribution waterfall analysis and visualizations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={calculateWaterfall}>
            <Calculator className="mr-2 h-4 w-4" />
            Calculate
          </Button>
        </div>
      </div>

      {/* Input Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Scenario Parameters
          </CardTitle>
          <CardDescription>Set the exit value to analyze distribution outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Exit/Liquidation Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  value={exitValue}
                  onChange={(e) => setExitValue(parseInt(e.target.value) || 0)}
                  className="pl-8"
                  step="1000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Transaction Type</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="liquidation">Liquidation</option>
                <option value="acquisition">Acquisition</option>
                <option value="ipo">IPO</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tax Treatment</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="qualified">Qualified Small Business Stock</option>
                <option value="capital_gains">Capital Gains</option>
                <option value="ordinary">Ordinary Income</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waterfall Results */}
      {isCalculated && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Distribution Analysis
              </CardTitle>
              <CardDescription>
                Detailed waterfall calculations for {formatCurrency(exitValue)} exit value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Security</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Liquidation Pref</TableHead>
                    <TableHead className="text-right">Participation</TableHead>
                    <TableHead className="text-right">Total Distribution</TableHead>
                    <TableHead className="text-right">Value/Share</TableHead>
                    <TableHead className="text-right">Multiple</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWaterfallResults.map((result) => (
                    <TableRow key={result.security}>
                      <TableCell className="font-medium">{result.security}</TableCell>
                      <TableCell className="text-right">{formatNumber(result.shares)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(result.liquidationPreference)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(result.participationAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(result.totalDistribution)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${result.valuePerShare.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{result.multiple.toFixed(2)}x</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-primary/20 font-bold">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(mockWaterfallResults.reduce((sum, r) => sum + r.shares, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        mockWaterfallResults.reduce((sum, r) => sum + r.liquidationPreference, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        mockWaterfallResults.reduce((sum, r) => sum + r.participationAmount, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(totalDistributed)}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Distributed</p>
                    <p className="text-lg font-bold">{formatCurrency(totalDistributed)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Common Value/Share</p>
                    <p className="text-lg font-bold">$12.95</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Preferred Multiple</p>
                    <p className="text-lg font-bold">1.42x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Analysis</p>
                    <p className="text-lg font-bold">All Convert</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Waterfall Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Waterfall Visualization</CardTitle>
              <CardDescription>Visual representation of distribution flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg bg-muted/30">
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Interactive waterfall chart will be displayed here
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Showing distribution flow from liquidation preferences to pro rata participation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isCalculated && (
        <div className="py-12 text-center">
          <Calculator className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium text-foreground">Ready to Calculate Waterfall</h3>
          <p className="mb-4 text-muted-foreground">
            Set your exit value and click "Calculate" to analyze the distribution waterfall
          </p>
          <Button size="lg" onClick={calculateWaterfall}>
            <Calculator className="mr-2 h-5 w-5" />
            Run Waterfall Analysis
          </Button>
        </div>
      )}
    </div>
  )
}
