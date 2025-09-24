'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PercentageInput } from '@/components/ui/percentage-input'
import { Slider } from '@/components/ui/slider'
import { BarChart3 } from 'lucide-react'

interface CapitalStructureInputsProps {
  debtWeight: number
  targetDebtToEquity: number
  targetTaxRate: number
  onUpdate: (field: string, value: number) => void
}

export function CapitalStructureInputs({
  debtWeight,
  targetDebtToEquity,
  targetTaxRate,
  onUpdate,
}: CapitalStructureInputsProps) {
  const equityWeight = 1 - debtWeight

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Capital Structure
        </CardTitle>
        <CardDescription>Define the target capital structure and tax assumptions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="debtWeight">Debt/Equity Mix</Label>
          <div className="space-y-3">
            <Slider
              id="debtWeight"
              value={[debtWeight * 100]}
              onValueChange={([value]) => onUpdate('debtWeight', value / 100)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm">
              <div className="space-x-1">
                <span className="text-muted-foreground">Debt:</span>
                <span className="font-semibold">{(debtWeight * 100).toFixed(0)}%</span>
              </div>
              <div className="space-x-1">
                <span className="text-muted-foreground">Equity:</span>
                <span className="font-semibold">{(equityWeight * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetDebtToEquity">Target D/E Ratio</Label>
            <PercentageInput
              id="targetDebtToEquity"
              value={targetDebtToEquity * 100}
              onChange={(value) => {
                const deRatio = value / 100
                onUpdate('targetDebtToEquity', deRatio)
                // Update debt weight based on D/E ratio
                const newDebtWeight = deRatio / (1 + deRatio)
                onUpdate('debtWeight', newDebtWeight)
              }}
              min={0}
              max={500}
              step={1}
              placeholder="e.g., 30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetTaxRate">Target Tax Rate (%)</Label>
            <PercentageInput
              id="targetTaxRate"
              value={targetTaxRate * 100}
              onChange={(value) => onUpdate('targetTaxRate', value / 100)}
              min={0}
              max={50}
              step={0.1}
              placeholder="e.g., 21.0"
            />
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Debt Weight</div>
              <div className="font-semibold">{(debtWeight * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Equity Weight</div>
              <div className="font-semibold">{(equityWeight * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">D/E Ratio</div>
              <div className="font-semibold">{(targetDebtToEquity * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
