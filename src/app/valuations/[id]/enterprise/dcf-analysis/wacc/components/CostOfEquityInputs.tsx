'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PercentageInput } from '@/components/ui/percentage-input'
import { TrendingUp } from 'lucide-react'

interface CostOfEquityInputsProps {
  riskFreeRate: number
  equityRiskPremium: number
  sizePremium: number
  countryRiskPremium: number
  companySpecificPremium: number
  onUpdate: (field: string, value: number) => void
}

export function CostOfEquityInputs({
  riskFreeRate,
  equityRiskPremium,
  sizePremium,
  countryRiskPremium,
  companySpecificPremium,
  onUpdate,
}: CostOfEquityInputsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Cost of Equity Components
        </CardTitle>
        <CardDescription>Build up the cost of equity using CAPM plus adjustments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="riskFreeRate">Risk-Free Rate (%)</Label>
            <PercentageInput
              id="riskFreeRate"
              value={riskFreeRate}
              onChange={(value) => onUpdate('riskFreeRate', value)}
              min={0}
              max={20}
              step={0.1}
              placeholder="e.g., 4.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equityRiskPremium">Equity Risk Premium (%)</Label>
            <PercentageInput
              id="equityRiskPremium"
              value={equityRiskPremium}
              onChange={(value) => onUpdate('equityRiskPremium', value)}
              min={0}
              max={20}
              step={0.1}
              placeholder="e.g., 5.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sizePremium">Size Premium (%)</Label>
            <PercentageInput
              id="sizePremium"
              value={sizePremium}
              onChange={(value) => onUpdate('sizePremium', value)}
              min={0}
              max={20}
              step={0.1}
              placeholder="e.g., 2.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="countryRiskPremium">Country Risk Premium (%)</Label>
            <PercentageInput
              id="countryRiskPremium"
              value={countryRiskPremium}
              onChange={(value) => onUpdate('countryRiskPremium', value)}
              min={0}
              max={20}
              step={0.1}
              placeholder="e.g., 0.0"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="companySpecificPremium">Company Specific Premium (%)</Label>
            <PercentageInput
              id="companySpecificPremium"
              value={companySpecificPremium}
              onChange={(value) => onUpdate('companySpecificPremium', value)}
              min={-10}
              max={20}
              step={0.1}
              placeholder="e.g., 1.0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
