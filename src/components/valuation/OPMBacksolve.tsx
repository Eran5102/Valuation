'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import { Calculator, TrendingUp, AlertCircle, DollarSign, Info } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { AssumptionsExtractor } from '@/lib/services/shared/AssumptionsExtractor'

interface OPMBacksolveProps {
  valuationId: string
  assumptions?: any
}

interface BlackScholesParams {
  companyValue: number
  volatility: number
  riskFreeRate: number
  timeToLiquidity: number
  dividendYield: number
}

interface SecurityAllocation {
  name: string
  shares: number
  participationPercentage: number
  dollarAllocation: number
  perShareValue: number
}

interface BreakpointResult {
  breakpointId: number
  exercisePrice: number
  toValue: number
  d1: number
  d2: number
  callOptionValue: number
  incrementalValue: number
  securityAllocations: SecurityAllocation[]
}

interface OPMAnalysisResult {
  parameters: BlackScholesParams
  totalEquityValue: number
  breakpointResults: BreakpointResult[]
  securitySummary: Array<{
    name: string
    totalValue: number
    totalShares: number
    averagePerShareValue: number
  }>
}

export function OPMBacksolve({ valuationId, assumptions }: OPMBacksolveProps) {
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract Black-Scholes parameters from assumptions using centralized utility
  const extractedParams = useMemo(() => {
    return AssumptionsExtractor.extractBlackScholesParams(assumptions)
  }, [assumptions])

  // Get source info for display (shows if value from assumptions or default)
  const sourceInfo = useMemo(() => {
    return AssumptionsExtractor.getSourceInfo(assumptions)
  }, [assumptions])

  const [parameters, setParameters] = useState<BlackScholesParams>({
    companyValue: 0,
    volatility: extractedParams.volatility,
    riskFreeRate: extractedParams.riskFreeRate,
    timeToLiquidity: extractedParams.timeToLiquidity,
    dividendYield: extractedParams.dividendYield,
  })
  const [analysisResult, setAnalysisResult] = useState<OPMAnalysisResult | null>(null)

  // Update parameters when assumptions change
  useEffect(() => {
    setParameters((prev) => ({
      ...prev,
      volatility: extractedParams.volatility,
      riskFreeRate: extractedParams.riskFreeRate,
      timeToLiquidity: extractedParams.timeToLiquidity,
      dividendYield: extractedParams.dividendYield,
    }))
  }, [extractedParams])

  const handleCalculate = async () => {
    if (!parameters.companyValue || parameters.companyValue <= 0) {
      setError('Please enter a valid company value')
      return
    }

    setCalculating(true)
    setError(null)

    try {
      const response = await fetch(`/api/valuations/${valuationId}/opm-backsolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(
          `Failed to calculate OPM backsolve: ${response.status} ${response.statusText}`
        )
      }

      const result = await response.json()
      if (result.success) {
        setAnalysisResult(result.data)
      } else {
        setError(result.error || 'Calculation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCalculating(false)
    }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Format percentage
  const formatPercent = (value: number, decimals = 2) => {
    return `${(value * 100).toFixed(decimals)}%`
  }

  // Prepare table columns
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!analysisResult || !analysisResult.breakpointResults.length) return []

    // Get all unique security names
    const allSecurities = new Set<string>()
    analysisResult.breakpointResults.forEach((br) => {
      br.securityAllocations.forEach((sa) => {
        allSecurities.add(sa.name)
      })
    })

    const cols: ColumnDef<any>[] = [
      {
        accessorKey: 'metric',
        header: 'Metric',
        cell: ({ row }) => (
          <div className="whitespace-nowrap font-medium">{row.original.metric}</div>
        ),
        size: 200,
        enableSorting: false,
      },
    ]

    // Add a column for each breakpoint
    analysisResult.breakpointResults.forEach((br, index) => {
      cols.push({
        accessorKey: `breakpoint_${br.breakpointId}`,
        header: () => (
          <div className="text-center">
            <div className="font-medium">Breakpoint {br.breakpointId}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(br.exercisePrice)}</div>
          </div>
        ),
        cell: ({ row }) => {
          const value = row.original[`breakpoint_${br.breakpointId}`]
          if (value === undefined || value === null) return '-'

          // Format based on row type
          const metric = row.original.metric
          if (
            metric === 'Exercise Price (K)' ||
            metric === 'Call Option Value' ||
            metric === 'Incremental Value' ||
            metric.includes('$')
          ) {
            return <div className="text-right font-mono">{formatCurrency(value)}</div>
          } else if (metric === 'd1' || metric === 'd2') {
            return <div className="text-right font-mono">{value.toFixed(4)}</div>
          } else if (metric.includes('%')) {
            return <div className="text-right font-mono">{formatPercent(value / 100, 2)}</div>
          }
          return <div className="text-right font-mono">{value}</div>
        },
        size: 150,
      })
    })

    return cols
  }, [analysisResult])

  // Prepare table data
  const tableData = useMemo(() => {
    if (!analysisResult || !analysisResult.breakpointResults.length) return []

    const data: any[] = []

    // Add parameter rows
    data.push({
      metric: 'Exercise Price (K)',
      ...analysisResult.breakpointResults.reduce(
        (acc, br) => ({
          ...acc,
          [`breakpoint_${br.breakpointId}`]: br.exercisePrice,
        }),
        {}
      ),
    })

    data.push({
      metric: 'd1',
      ...analysisResult.breakpointResults.reduce(
        (acc, br) => ({
          ...acc,
          [`breakpoint_${br.breakpointId}`]: br.d1,
        }),
        {}
      ),
    })

    data.push({
      metric: 'd2',
      ...analysisResult.breakpointResults.reduce(
        (acc, br) => ({
          ...acc,
          [`breakpoint_${br.breakpointId}`]: br.d2,
        }),
        {}
      ),
    })

    data.push({
      metric: 'Call Option Value',
      ...analysisResult.breakpointResults.reduce(
        (acc, br) => ({
          ...acc,
          [`breakpoint_${br.breakpointId}`]: br.callOptionValue,
        }),
        {}
      ),
    })

    data.push({
      metric: 'Incremental Value',
      ...analysisResult.breakpointResults.reduce(
        (acc, br) => ({
          ...acc,
          [`breakpoint_${br.breakpointId}`]: br.incrementalValue,
        }),
        {}
      ),
    })

    // Add separator
    data.push({
      metric: '--- Participating Securities ---',
      ...analysisResult.breakpointResults.reduce(
        (acc, br) => ({
          ...acc,
          [`breakpoint_${br.breakpointId}`]: null,
        }),
        {}
      ),
    })

    // Get all unique securities
    const allSecurities = new Set<string>()
    analysisResult.breakpointResults.forEach((br) => {
      br.securityAllocations.forEach((sa) => {
        allSecurities.add(sa.name)
      })
    })

    // Add rows for each security's participation percentage
    allSecurities.forEach((securityName) => {
      data.push({
        metric: `${securityName} (%)`,
        ...analysisResult.breakpointResults.reduce((acc, br) => {
          const allocation = br.securityAllocations.find((sa) => sa.name === securityName)
          return {
            ...acc,
            [`breakpoint_${br.breakpointId}`]: allocation ? allocation.participationPercentage : 0,
          }
        }, {}),
      })
    })

    // Add separator
    data.push({
      metric: '--- Dollar Allocations ---',
      ...analysisResult.breakpointResults.reduce(
        (acc, br) => ({
          ...acc,
          [`breakpoint_${br.breakpointId}`]: null,
        }),
        {}
      ),
    })

    // Add rows for each security's dollar allocation
    allSecurities.forEach((securityName) => {
      data.push({
        metric: `${securityName} ($)`,
        ...analysisResult.breakpointResults.reduce((acc, br) => {
          const allocation = br.securityAllocations.find((sa) => sa.name === securityName)
          return {
            ...acc,
            [`breakpoint_${br.breakpointId}`]: allocation ? allocation.dollarAllocation : 0,
          }
        }, {}),
      })
    })

    return data
  }, [analysisResult])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Black-Scholes Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show parameter source info */}
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Parameters auto-populated from Assumptions page. You can override them below.
              {sourceInfo.volatility.source === 'default' && ' (Using default volatility: 60%)'}
              {sourceInfo.riskFreeRate.source === 'default' &&
                ' (Using default risk-free rate: 4.5%)'}
              {sourceInfo.timeToLiquidity.source === 'default' &&
                ' (Using default time to liquidity: 3 years)'}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <Label htmlFor="companyValue">Company Value ($)</Label>
              <Input
                id="companyValue"
                type="number"
                value={parameters.companyValue || ''}
                onChange={(e) =>
                  setParameters((prev) => ({
                    ...prev,
                    companyValue: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="Enter value"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="volatility">
                Volatility (%)
                {sourceInfo.volatility.source === 'assumptions' && (
                  <span className="ml-1 text-xs text-muted-foreground">(from assumptions)</span>
                )}
              </Label>
              <Input
                id="volatility"
                type="number"
                value={(parameters.volatility * 100).toFixed(1)}
                onChange={(e) =>
                  setParameters((prev) => ({
                    ...prev,
                    volatility: parseFloat(e.target.value) / 100 || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="riskFreeRate">
                Risk-Free Rate (%)
                {sourceInfo.riskFreeRate.source === 'assumptions' && (
                  <span className="ml-1 text-xs text-muted-foreground">(from assumptions)</span>
                )}
              </Label>
              <Input
                id="riskFreeRate"
                type="number"
                value={(parameters.riskFreeRate * 100).toFixed(1)}
                onChange={(e) =>
                  setParameters((prev) => ({
                    ...prev,
                    riskFreeRate: parseFloat(e.target.value) / 100 || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="timeToLiquidity">
                Time to Liquidity (Years)
                {sourceInfo.timeToLiquidity.source === 'assumptions' && (
                  <span className="ml-1 text-xs text-muted-foreground">(from assumptions)</span>
                )}
              </Label>
              <Input
                id="timeToLiquidity"
                type="number"
                value={parameters.timeToLiquidity}
                onChange={(e) =>
                  setParameters((prev) => ({
                    ...prev,
                    timeToLiquidity: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
              <Input
                id="dividendYield"
                type="number"
                value={(parameters.dividendYield * 100).toFixed(1)}
                onChange={(e) =>
                  setParameters((prev) => ({
                    ...prev,
                    dividendYield: parseFloat(e.target.value) / 100 || 0,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCalculate}
                disabled={calculating || !parameters.companyValue}
                className="w-full"
              >
                {calculating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" /> Calculating...
                  </>
                ) : (
                  <>Calculate OPM</>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                OPM Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Equity Value:</span>
                  <span className="font-semibold">
                    {formatCurrency(analysisResult.totalEquityValue)}
                  </span>
                </div>
              </div>

              <OptimizedDataTable
                data={tableData}
                columns={columns}
                pageSize={50}
                enablePagination={false}
                enableSorting={false}
                stickyHeader
                className="rounded-lg border"
              />
            </CardContent>
          </Card>

          {/* Security Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Security Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analysisResult.securitySummary.map((security) => (
                  <div key={security.name} className="rounded-lg border bg-card p-4">
                    <div className="mb-2 font-medium">{security.name}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Value:</span>
                        <span className="font-mono">{formatCurrency(security.totalValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shares:</span>
                        <span className="font-mono">{security.totalShares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Share:</span>
                        <span className="font-mono">
                          ${security.averagePerShareValue.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default OPMBacksolve
