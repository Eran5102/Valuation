'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WACCResultsProps {
  results: {
    unleveredBeta: number
    releveredBeta: number
    costOfEquity: number
    afterTaxCostOfDebt: number
    wacc: number
    breakdown: {
      riskFreeRate: number
      betaAdjustedPremium: number
      sizePremium: number
      countryRiskPremium: number
      companySpecificPremium: number
    }
  } | null
  debtWeight: number
  lastUpdated: string | null
}

export function WACCResults({ results, debtWeight, lastUpdated }: WACCResultsProps) {
  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            WACC Calculation Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calculator className="mb-3 h-12 w-12" />
            <p>Enter parameters to calculate WACC</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const equityWeight = 1 - debtWeight

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              WACC Calculation Results
            </CardTitle>
            <CardDescription>
              Weighted Average Cost of Capital based on current inputs
            </CardDescription>
          </div>
          {lastUpdated && (
            <Badge variant="outline">
              Last updated: {new Date(lastUpdated).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main WACC Result */}
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
          <div className="text-center">
            <div className="mb-2 text-sm text-muted-foreground">
              Weighted Average Cost of Capital
            </div>
            <div className="text-4xl font-bold text-primary">{results.wacc.toFixed(2)}%</div>
          </div>
        </div>

        {/* Cost Components */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Cost of Equity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.costOfEquity.toFixed(2)}%</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Weight: {(equityWeight * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4" />
                After-Tax Cost of Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{results.afterTaxCostOfDebt.toFixed(2)}%</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Weight: {(debtWeight * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost of Equity Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Cost of Equity Breakdown</h4>
          <div className="space-y-1 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Risk-Free Rate</span>
              <span className="font-mono">{results.breakdown.riskFreeRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Beta-Adjusted Premium ({results.releveredBeta.toFixed(3)} × ERP)
              </span>
              <span className="font-mono">{results.breakdown.betaAdjustedPremium.toFixed(2)}%</span>
            </div>
            {results.breakdown.sizePremium > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size Premium</span>
                <span className="font-mono">{results.breakdown.sizePremium.toFixed(2)}%</span>
              </div>
            )}
            {results.breakdown.countryRiskPremium > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Country Risk Premium</span>
                <span className="font-mono">
                  {results.breakdown.countryRiskPremium.toFixed(2)}%
                </span>
              </div>
            )}
            {results.breakdown.companySpecificPremium !== 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Company Specific Premium</span>
                <span className="font-mono">
                  {results.breakdown.companySpecificPremium.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="mt-2 border-t pt-1">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Total Cost of Equity</span>
                <span className="font-mono">{results.costOfEquity.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* WACC Calculation */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">WACC Calculation</h4>
          <div className="space-y-1 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Equity Component ({(equityWeight * 100).toFixed(1)}% ×{' '}
                {results.costOfEquity.toFixed(2)}%)
              </span>
              <span className="font-mono">{(equityWeight * results.costOfEquity).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Debt Component ({(debtWeight * 100).toFixed(1)}% ×{' '}
                {results.afterTaxCostOfDebt.toFixed(2)}%)
              </span>
              <span className="font-mono">
                {(debtWeight * results.afterTaxCostOfDebt).toFixed(2)}%
              </span>
            </div>
            <div className="mt-2 border-t pt-1">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Weighted Average Cost of Capital</span>
                <span className="font-mono text-primary">{results.wacc.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Beta Values */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3">
          <div>
            <div className="text-xs text-muted-foreground">Unlevered Beta</div>
            <div className="font-mono font-semibold">{results.unleveredBeta.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Relevered Beta</div>
            <div className="font-mono font-semibold">{results.releveredBeta.toFixed(3)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
