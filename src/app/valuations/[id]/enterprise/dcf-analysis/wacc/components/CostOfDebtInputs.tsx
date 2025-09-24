'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PercentageInput } from '@/components/ui/percentage-input'
import { TrendingDown } from 'lucide-react'

interface CostOfDebtInputsProps {
  preTaxCostOfDebt: number
  debtTaxRate: number
  afterTaxCostOfDebt: number
  onUpdate: (field: string, value: number) => void
}

export function CostOfDebtInputs({
  preTaxCostOfDebt,
  debtTaxRate,
  afterTaxCostOfDebt,
  onUpdate,
}: CostOfDebtInputsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Cost of Debt
        </CardTitle>
        <CardDescription>
          Calculate the after-tax cost of debt based on current rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preTaxCostOfDebt">Pre-Tax Cost of Debt (%)</Label>
            <PercentageInput
              id="preTaxCostOfDebt"
              value={preTaxCostOfDebt}
              onChange={(value) => onUpdate('preTaxCostOfDebt', value)}
              min={0}
              max={30}
              step={0.1}
              placeholder="e.g., 6.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debtTaxRate">Tax Rate (%)</Label>
            <PercentageInput
              id="debtTaxRate"
              value={debtTaxRate * 100}
              onChange={(value) => onUpdate('debtTaxRate', value / 100)}
              min={0}
              max={50}
              step={0.1}
              placeholder="e.g., 21.0"
            />
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">After-Tax Cost of Debt</span>
            <span className="text-lg font-semibold">{afterTaxCostOfDebt.toFixed(2)}%</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">= Pre-Tax Cost × (1 - Tax Rate)</div>
        </div>
      </CardContent>
    </Card>
  )
}
