'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { HybridScenario, OPMBlackScholesParams } from '@/types/opm'

interface HybridScenarioCardProps {
  scenario: HybridScenario
  index: number
  totalScenarios: number
  onUpdate: (scenario: HybridScenario) => void
  onDelete: () => void
  onProbabilityChange?: (newProbability: number) => void
  probabilityFormat: 'percentage' | 'decimal'
  globalParams: Partial<OPMBlackScholesParams>
}

export function HybridScenarioCard({
  scenario,
  index,
  totalScenarios,
  onUpdate,
  onDelete,
  onProbabilityChange,
  probabilityFormat,
  globalParams,
}: HybridScenarioCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [useCustomParams, setUseCustomParams] = useState(
    scenario.blackScholesParams !== undefined && scenario.blackScholesParams !== null
  )

  /**
   * Update scenario field
   */
  const updateField = (field: keyof HybridScenario, value: any) => {
    onUpdate({ ...scenario, [field]: value })
  }

  /**
   * Update custom Black-Scholes parameter
   */
  const updateCustomParam = (field: keyof OPMBlackScholesParams, value: number) => {
    const currentParams = scenario.blackScholesParams || {}
    onUpdate({
      ...scenario,
      blackScholesParams: {
        ...currentParams,
        [field]: value,
      },
    })
  }

  /**
   * Toggle custom parameters
   */
  const toggleCustomParams = () => {
    if (useCustomParams) {
      // Remove custom params
      const { blackScholesParams, ...rest } = scenario
      onUpdate(rest as HybridScenario)
      setUseCustomParams(false)
    } else {
      // Initialize with global params
      onUpdate({
        ...scenario,
        blackScholesParams: { ...globalParams } as OPMBlackScholesParams,
      })
      setUseCustomParams(true)
    }
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: scenario.color || '#6b7280' }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                <Input
                  value={scenario.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="h-8 font-semibold"
                  placeholder="Scenario name"
                />
              </CardTitle>
              <Badge variant="outline">
                Scenario {index + 1}/{totalScenarios}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={totalScenarios <= 1}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Core Fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`probability_${scenario.id}`}>
              Probability (%)
              <span className="ml-1 text-xs text-muted-foreground">*</span>
            </Label>
            <Input
              id={`probability_${scenario.id}`}
              type="number"
              value={scenario.probability}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                updateField('probability', value)
                onProbabilityChange?.(value)
              }}
              step="0.1"
              min="0"
              max="100"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`targetFMV_${scenario.id}`}>
              Target FMV ($/share)
              <span className="ml-1 text-xs text-muted-foreground">*</span>
            </Label>
            <Input
              id={`targetFMV_${scenario.id}`}
              type="number"
              value={scenario.targetFMV || ''}
              onChange={(e) => updateField('targetFMV', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className="mt-1"
              placeholder="Enter target FMV"
            />
          </div>

          <div>
            <Label htmlFor={`color_${scenario.id}`}>Color</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id={`color_${scenario.id}`}
                type="color"
                value={scenario.color || '#6b7280'}
                onChange={(e) => updateField('color', e.target.value)}
                className="h-9 w-16"
              />
              <Input
                type="text"
                value={scenario.color || '#6b7280'}
                onChange={(e) => updateField('color', e.target.value)}
                className="h-9 flex-1 font-mono text-xs"
                placeholder="#6b7280"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        {expanded && (
          <div>
            <Label htmlFor={`description_${scenario.id}`}>Description</Label>
            <Textarea
              id={`description_${scenario.id}`}
              value={scenario.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe this scenario..."
              className="mt-1"
              rows={2}
            />
          </div>
        )}

        {/* Custom Parameters Toggle */}
        {expanded && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Scenario-Specific Parameters</Label>
              <Button variant="outline" size="sm" onClick={toggleCustomParams}>
                {useCustomParams ? 'Use Global Parameters' : 'Override Parameters'}
              </Button>
            </div>

            {useCustomParams && scenario.blackScholesParams && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <div className="mb-2 text-sm text-muted-foreground">
                  Custom parameters for this scenario
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <Label htmlFor={`volatility_${scenario.id}`}>Volatility (%)</Label>
                    <Input
                      id={`volatility_${scenario.id}`}
                      type="number"
                      value={
                        scenario.blackScholesParams.volatility !== undefined
                          ? (scenario.blackScholesParams.volatility * 100).toFixed(1)
                          : ''
                      }
                      onChange={(e) =>
                        updateCustomParam('volatility', parseFloat(e.target.value) / 100 || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`riskFreeRate_${scenario.id}`}>Risk-Free Rate (%)</Label>
                    <Input
                      id={`riskFreeRate_${scenario.id}`}
                      type="number"
                      value={
                        scenario.blackScholesParams.riskFreeRate !== undefined
                          ? (scenario.blackScholesParams.riskFreeRate * 100).toFixed(1)
                          : ''
                      }
                      onChange={(e) =>
                        updateCustomParam('riskFreeRate', parseFloat(e.target.value) / 100 || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`timeToLiquidity_${scenario.id}`}>
                      Time to Liquidity (Years)
                    </Label>
                    <Input
                      id={`timeToLiquidity_${scenario.id}`}
                      type="number"
                      value={scenario.blackScholesParams.timeToLiquidity || ''}
                      onChange={(e) =>
                        updateCustomParam('timeToLiquidity', parseFloat(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`dividendYield_${scenario.id}`}>Dividend Yield (%)</Label>
                    <Input
                      id={`dividendYield_${scenario.id}`}
                      type="number"
                      value={
                        scenario.blackScholesParams.dividendYield !== undefined
                          ? (scenario.blackScholesParams.dividendYield * 100).toFixed(1)
                          : ''
                      }
                      onChange={(e) =>
                        updateCustomParam('dividendYield', parseFloat(e.target.value) / 100 || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {!useCustomParams && (
              <div className="bg-muted/50 rounded-lg border p-4 text-sm text-muted-foreground">
                Using global parameters:
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div>
                    <span className="font-medium">Volatility:</span>{' '}
                    {((globalParams.volatility || 0) * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Risk-Free:</span>{' '}
                    {((globalParams.riskFreeRate || 0) * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Time to Liquidity:</span>{' '}
                    {(globalParams.timeToLiquidity || 0).toFixed(1)} years
                  </div>
                  <div>
                    <span className="font-medium">Dividend:</span>{' '}
                    {((globalParams.dividendYield || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
