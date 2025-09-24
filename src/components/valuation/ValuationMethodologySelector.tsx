'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Calculator,
  Info,
  AlertCircle,
  Check,
  Sliders,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMethodologyStore } from '@/hooks/useMethodologyStore'

// Re-export the ValuationMethodology type from the store
import type { ValuationMethodology } from '@/hooks/useMethodologyStore'
export type { ValuationMethodology }

interface MethodologyGroup {
  name: string
  category: 'income' | 'market' | 'asset' | 'allocation'
  icon: React.ElementType
  description: string
  methodologies: ValuationMethodology[]
}

// Define methodology groups structure (without data)
const methodologyGroups: MethodologyGroup[] = [
  {
    name: 'Income Approach',
    category: 'income',
    icon: TrendingUp,
    description: 'Value based on expected future cash flows',
    methodologies: [],
  },
  {
    name: 'Market Approach',
    category: 'market',
    icon: BarChart3,
    description: 'Value based on comparable companies and transactions',
    methodologies: [],
  },
  {
    name: 'Asset Approach',
    category: 'asset',
    icon: FileSpreadsheet,
    description: 'Value based on underlying assets',
    methodologies: [],
  },
  {
    name: 'Equity Allocation Methods',
    category: 'allocation',
    icon: Calculator,
    description: 'Methods to allocate value across share classes',
    methodologies: [],
  },
]

interface ValuationMethodologySelectorProps {
  isExpanded?: boolean
  onToggle?: () => void
}

export function ValuationMethodologySelector({
  isExpanded = true,
  onToggle,
}: ValuationMethodologySelectorProps) {
  const { methodologies, toggleMethodology, updateMethodologyWeight, updateMethodologies } =
    useMethodologyStore()
  const [showWeightError, setShowWeightError] = useState(false)

  const handleToggleMethodology = (methodId: string) => {
    toggleMethodology(methodId)
    // Don't auto-normalize here to avoid conflicts
  }

  const handleWeightChange = (methodId: string, value: string) => {
    const weight = Math.max(0, Math.min(100, parseInt(value) || 0))
    updateMethodologyWeight(methodId, weight)
  }

  const normalizeWeights = () => {
    const enabledMethods = methodologies.filter((m) => m.enabled)

    if (enabledMethods.length === 0) {
      return
    }

    const totalWeight = enabledMethods.reduce((sum, m) => sum + m.weight, 0)

    let normalized = [...methodologies]
    if (totalWeight !== 100 && totalWeight > 0) {
      normalized = methodologies.map((m) => {
        if (m.enabled && m.weight > 0) {
          const normalizedWeight = Math.round((m.weight / totalWeight) * 100)
          return { ...m, weight: normalizedWeight }
        }
        return m
      })

      // Ensure exactly 100%
      const newTotal = normalized.filter((m) => m.enabled).reduce((sum, m) => sum + m.weight, 0)
      if (newTotal !== 100) {
        const diff = 100 - newTotal
        const firstEnabled = normalized.find((m) => m.enabled)
        if (firstEnabled) {
          normalized = normalized.map((m) =>
            m.id === firstEnabled.id ? { ...m, weight: m.weight + diff } : m
          )
        }
      }
    }

    updateMethodologies(normalized)
    setShowWeightError(false)
  }

  const getTotalWeight = () => {
    return methodologies.filter((m) => m.enabled).reduce((sum, m) => sum + m.weight, 0)
  }

  const getEnabledCount = () => {
    return methodologies.filter((m) => m.enabled).length
  }

  const Icon = Sliders

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className={onToggle ? 'cursor-pointer transition-colors hover:bg-muted/50' : ''}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Valuation Methodology Selection</CardTitle>
              <CardDescription className="text-sm">
                {getEnabledCount()} methodologies selected
                {getEnabledCount() > 0 && ` • Total weight: ${getTotalWeight()}%`}
              </CardDescription>
            </div>
          </div>
          {onToggle && (
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                {getEnabledCount() > 0 ? `${getEnabledCount()} active` : 'None selected'}
              </div>
              <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Weight Warning */}
          {showWeightError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Weights must sum to 100%. Click "Normalize Weights" to auto-adjust.
              </AlertDescription>
            </Alert>
          )}

          {/* Methodology Groups */}
          <div className="space-y-4">
            {methodologyGroups.map((group) => {
              const GroupIcon = group.icon
              const groupMethodologies = methodologies.filter((m) => m.category === group.category)

              return (
                <div key={group.category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GroupIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">{group.name}</h4>
                    <span className="text-xs text-muted-foreground">({group.description})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {groupMethodologies.map((method) => (
                      <div
                        key={method.id}
                        className={cn(
                          'rounded-lg border p-3 transition-all',
                          method.enabled
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2">
                              <Checkbox
                                id={method.id}
                                checked={method.enabled}
                                onCheckedChange={() => handleToggleMethodology(method.id)}
                                disabled={!method.implemented}
                                className="mt-0.5"
                              />
                              <div className="space-y-1">
                                <label
                                  htmlFor={method.id}
                                  className={cn(
                                    'cursor-pointer text-sm font-medium',
                                    !method.implemented && 'text-muted-foreground'
                                  )}
                                >
                                  {method.name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {method.description}
                                </p>
                                {!method.implemented && (
                                  <Badge variant="outline" className="text-xs">
                                    Coming Soon
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Weight Input */}
                          {method.enabled && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">Weight:</span>
                              <div className="flex items-center space-x-1">
                                <Input
                                  type="number"
                                  value={method.weight}
                                  onChange={(e) => handleWeightChange(method.id, e.target.value)}
                                  className="h-7 w-16 text-xs"
                                  min="0"
                                  max="100"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Normalize Button */}
          {getEnabledCount() > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="text-sm">
                <span className="font-medium">Total Weight: </span>
                <span
                  className={cn(getTotalWeight() === 100 ? 'text-green-600' : 'text-orange-600')}
                >
                  {getTotalWeight()}%
                </span>
                {getTotalWeight() !== 100 && (
                  <span className="ml-2 text-xs text-muted-foreground">(Should be 100%)</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => normalizeWeights()}
                className="ml-4"
              >
                Normalize Weights
              </Button>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Select the valuation methodologies to use and assign weights. The weights determine
              how much each methodology contributes to the final valuation. Weights are
              automatically normalized to sum to 100%.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  )
}
