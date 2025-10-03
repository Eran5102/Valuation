'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import { TrendingUp, AlertCircle, CheckCircle2, DollarSign, BarChart3 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { HybridPWERMResult, HybridScenarioResult } from '@/types/opm'

interface HybridResultsDisplayProps {
  result: HybridPWERMResult
}

export function HybridResultsDisplay({ result }: HybridResultsDisplayProps) {
  /**
   * Format currency
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  /**
   * Format percentage
   */
  const formatPercent = (value: number, decimals = 2) => {
    return `${(value * 100).toFixed(decimals)}%`
  }

  /**
   * Scenario results table columns
   */
  const scenarioColumns = useMemo<ColumnDef<HybridScenarioResult>[]>(
    () => [
      {
        accessorKey: 'scenarioName',
        header: 'Scenario',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor:
                  result.scenarioResults.find((s) => s.scenarioId === row.original.scenarioId)
                    ?.scenarioName || '#6b7280',
              }}
            />
            <span className="font-medium">{row.original.scenarioName}</span>
          </div>
        ),
      },
      {
        accessorKey: 'probability',
        header: 'Probability',
        cell: ({ row }) => (
          <div className="text-right font-mono">{formatPercent(row.original.probability)}</div>
        ),
      },
      {
        accessorKey: 'targetFMV',
        header: 'Target FMV',
        cell: ({ row }) => (
          <div className="text-right font-mono">${row.original.targetFMV.toFixed(4)}</div>
        ),
      },
      {
        accessorKey: 'calculatedFMV',
        header: 'Calculated FMV',
        cell: ({ row }) => (
          <div className="text-right font-mono">${row.original.calculatedFMV.toFixed(4)}</div>
        ),
      },
      {
        accessorKey: 'weightedContribution',
        header: 'Weighted Contribution',
        cell: ({ row }) => (
          <div className="text-right font-mono">
            ${row.original.weightedContribution.toFixed(4)}
          </div>
        ),
      },
      {
        accessorKey: 'percentOfWeightedValue',
        header: '% of Total',
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {row.original.percentOfWeightedValue.toFixed(2)}%
          </div>
        ),
      },
      {
        id: 'allocation',
        header: 'Status',
        cell: ({ row }) => (
          <div>
            {row.original.allocation.valid ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Valid
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <AlertCircle className="mr-1 h-3 w-3" />
                Invalid
              </Badge>
            )}
          </div>
        ),
      },
    ],
    [result]
  )

  return (
    <div className="space-y-6">
      {/* Success/Error Banner */}
      {result.success ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Hybrid PWERM calculation completed successfully
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {result.errors ? result.errors.join(', ') : 'Calculation failed'}
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="font-semibold">Warnings:</div>
            <ul className="mt-1 list-inside list-disc text-sm">
              {result.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Probability-Weighted Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Weighted FMV</div>
              <div className="text-2xl font-bold text-primary">
                ${result.weightedFMV.toFixed(4)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Weighted Mean</div>
              <div className="text-xl font-semibold">
                ${result.statistics.weightedMean.toFixed(4)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Std. Deviation</div>
              <div className="text-xl font-semibold">
                ${result.statistics.weightedStdDev.toFixed(4)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Coefficient of Variation</div>
              <div className="text-xl font-semibold">
                {(result.statistics.coefficientOfVariation * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Percentiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribution Percentiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="mb-1 text-sm font-medium text-muted-foreground">25th Percentile</div>
              <div className="text-xl font-bold">${result.statistics.percentile25.toFixed(4)}</div>
            </div>
            <div className="bg-primary/10 rounded-lg border p-4">
              <div className="mb-1 text-sm font-medium text-muted-foreground">
                50th Percentile (Median)
              </div>
              <div className="text-xl font-bold">${result.statistics.percentile50.toFixed(4)}</div>
            </div>
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="mb-1 text-sm font-medium text-muted-foreground">75th Percentile</div>
              <div className="text-xl font-bold">${result.statistics.percentile75.toFixed(4)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizedDataTable
            data={result.scenarioResults}
            columns={scenarioColumns}
            pageSize={10}
            enablePagination={result.scenarioResults.length > 10}
            enableSorting={true}
            stickyHeader
            className="rounded-lg border"
          />
        </CardContent>
      </Card>

      {/* Detailed Allocations */}
      {result.scenarioResults.map((scenarioResult) => (
        <Card key={scenarioResult.scenarioId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#6b7280' }} />
              {scenarioResult.scenarioName} - Allocation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scenarioResult.allocation.valid ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Enterprise Value:</span>
                    <span className="font-semibold">
                      {formatCurrency(scenarioResult.allocation.enterpriseValue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Total Distributed:</span>
                    <span className="font-semibold">
                      {formatCurrency(scenarioResult.allocation.totalValueDistributed)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scenarioResult.allocation.allocationsByClass.map((alloc) => (
                    <div key={alloc.securityClass} className="rounded-lg border bg-card p-4">
                      <div className="mb-2 font-medium">{alloc.securityClass}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Value:</span>
                          <span className="font-mono">{formatCurrency(alloc.totalValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shares:</span>
                          <span className="font-mono">{alloc.totalShares.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Per Share:</span>
                          <span className="font-mono">${alloc.valuePerShare.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">% of Total:</span>
                          <span className="font-mono">{alloc.percentOfTotal.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Allocation validation failed
                  {scenarioResult.allocation.validationErrors && (
                    <ul className="mt-2 list-inside list-disc text-sm">
                      {scenarioResult.allocation.validationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Method</div>
              <div className="font-mono">{result.metadata.method}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Execution Time</div>
              <div className="font-mono">{result.metadata.executionTimeMs}ms</div>
            </div>
            <div>
              <div className="text-muted-foreground">Scenarios</div>
              <div className="font-mono">{result.scenarioResults.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Converged</div>
              <div className="font-mono">{result.converged ? 'Yes ✓' : 'No ✗'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
