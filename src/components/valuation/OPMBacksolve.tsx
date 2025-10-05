'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calculator, TrendingUp, AlertCircle, DollarSign, Info } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { AssumptionsExtractor } from '@/lib/services/shared/AssumptionsExtractor'

interface OPMBacksolveProps {
  valuationId: string
  assumptions?: any
}

interface BlackScholesParams {
  volatility: number
  riskFreeRate: number
  timeToLiquidity: number
  dividendYield: number
}

interface SecurityClass {
  id: string
  name: string
  shareType: string
  pricePerShare: number
  sharesOutstanding: number
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
  const [securities, setSecurities] = useState<SecurityClass[]>([])
  const [selectedSecurityId, setSelectedSecurityId] = useState<string>('')
  const [analysisResult, setAnalysisResult] = useState<OPMAnalysisResult | null>(null)

  // Extract Black-Scholes parameters from assumptions using centralized utility
  const extractedParams = useMemo(() => {
    const params = AssumptionsExtractor.extractBlackScholesParams(assumptions)
    console.log('[OPMBacksolve] Extracted params:', params)
    console.log('[OPMBacksolve] Raw assumptions:', assumptions)
    return params
  }, [assumptions])

  // Get source info for display (shows if value from assumptions or default)
  const sourceInfo = useMemo(() => {
    const info = AssumptionsExtractor.getSourceInfo(assumptions)
    console.log('[OPMBacksolve] Source info:', info)
    return info
  }, [assumptions])

  const [parameters, setParameters] = useState<BlackScholesParams>({
    volatility: extractedParams.volatility,
    riskFreeRate: extractedParams.riskFreeRate,
    timeToLiquidity: extractedParams.timeToLiquidity,
    dividendYield: extractedParams.dividendYield,
  })

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

  // Fetch share classes from database
  useEffect(() => {
    async function fetchShareClasses() {
      try {
        console.log('[OPMBacksolve] Fetching share classes for valuation:', valuationId)
        const response = await fetch(`/api/valuations/${valuationId}/share-classes`)
        if (response.ok) {
          const data = await response.json()
          console.log('[OPMBacksolve] Share classes data:', data)

          if (data.shareClasses && Array.isArray(data.shareClasses)) {
            const securityClasses: SecurityClass[] = data.shareClasses.map((sc: any) => ({
              id: sc.id,
              name: sc.class_name,
              shareType: sc.type,
              pricePerShare: parseFloat(sc.price_per_share) || 0,
              sharesOutstanding: parseFloat(sc.shares) || 0,
            }))
            console.log('[OPMBacksolve] Security classes extracted:', securityClasses)
            setSecurities(securityClasses)

            // Auto-select first security if none selected
            if (securityClasses.length > 0 && !selectedSecurityId) {
              console.log('[OPMBacksolve] Auto-selecting first security:', securityClasses[0].id)
              setSelectedSecurityId(securityClasses[0].id)
            }
          } else {
            console.warn('[OPMBacksolve] No share classes found')
          }
        } else {
          console.error('[OPMBacksolve] Failed to fetch share classes:', response.status)
        }
      } catch (err) {
        console.error('[OPMBacksolve] Failed to fetch share classes:', err)
      }
    }

    if (valuationId) {
      fetchShareClasses()
    }
  }, [valuationId])

  // Auto-calculate when security is selected or parameters change
  useEffect(() => {
    if (selectedSecurityId) {
      handleBacksolve()
    }
  }, [selectedSecurityId, parameters])

  const handleBacksolve = async () => {
    if (!selectedSecurityId) {
      return
    }

    setCalculating(true)
    setError(null)

    try {
      const response = await fetch(`/api/valuations/${valuationId}/opm-reverse-backsolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securityClassId: selectedSecurityId,
          ...parameters,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        setAnalysisResult(result.data)
      } else {
        setError(result.error || 'Backsolve failed')
      }
    } catch (err) {
      console.error('Backsolve error:', err)
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
    if (
      !analysisResult ||
      !analysisResult.breakpointResults ||
      !analysisResult.breakpointResults.length
    )
      return []

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

  const selectedSecurity = securities.find((s) => s.id === selectedSecurityId)

  return (
    <div className="space-y-6">
      {/* Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Reverse Backsolve Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show parameter source info */}
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select a security from your cap table. The system will automatically calculate the
              enterprise value needed to produce that security's price per share.
              {sourceInfo.volatility.source === 'default' && ' (Using default volatility: 60%)'}
              {sourceInfo.riskFreeRate.source === 'default' &&
                ' (Using default risk-free rate: 4.5%)'}
              {sourceInfo.timeToLiquidity.source === 'default' &&
                ' (Using default time to liquidity: 3 years)'}
            </AlertDescription>
          </Alert>

          <div className="mb-4">
            <Label htmlFor="security">Target Security</Label>
            <Select value={selectedSecurityId} onValueChange={setSelectedSecurityId}>
              <SelectTrigger className="mt-1 max-w-md">
                <SelectValue placeholder="Select a security" />
              </SelectTrigger>
              <SelectContent>
                {securities.map((security) => (
                  <SelectItem key={security.id} value={security.id}>
                    {security.name} - ${security.pricePerShare.toFixed(4)}/share
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSecurity && (
              <div className="mt-2 text-sm text-muted-foreground">
                Target Price: ${selectedSecurity.pricePerShare.toFixed(4)} per share |{' '}
                {selectedSecurity.sharesOutstanding.toLocaleString()} shares outstanding
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
          </div>

          {calculating && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" />
              <span>Calculating enterprise value...</span>
            </div>
          )}

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
                Backsolve Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="bg-primary/5 rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Enterprise Value</div>
                  <div className="mt-1 text-2xl font-bold">
                    {formatCurrency(analysisResult.enterpriseValue)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    ({analysisResult.iterations} iterations, {analysisResult.method})
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Target Price Per Share</div>
                  <div className="mt-1 text-2xl font-bold">
                    ${analysisResult.targetFMV.toFixed(4)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {analysisResult.security?.name}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Actual Price Achieved</div>
                  <div className="mt-1 text-2xl font-bold">
                    ${analysisResult.actualFMV.toFixed(4)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Error: ${analysisResult.error.toFixed(6)}
                  </div>
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
