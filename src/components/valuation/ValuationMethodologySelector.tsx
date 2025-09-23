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
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ValuationMethodology {
  id: string
  name: string
  category: 'income' | 'market' | 'asset' | 'allocation'
  enabled: boolean
  weight: number
  implemented: boolean
  route?: string
  description: string
  icon?: React.ElementType
}

interface MethodologyGroup {
  name: string
  category: 'income' | 'market' | 'asset' | 'allocation'
  icon: React.ElementType
  description: string
  methodologies: ValuationMethodology[]
}

const methodologyGroups: MethodologyGroup[] = [
  {
    name: 'Income Approach',
    category: 'income',
    icon: TrendingUp,
    description: 'Value based on expected future cash flows',
    methodologies: [
      {
        id: 'dcf',
        name: 'Discounted Cash Flow (DCF)',
        category: 'income',
        enabled: false,
        weight: 0,
        implemented: false,
        route: 'dcf-analysis',
        description: 'Project and discount future cash flows to present value',
      },
      {
        id: 'cap_earnings',
        name: 'Capitalization of Earnings',
        category: 'income',
        enabled: false,
        weight: 0,
        implemented: false,
        description: 'Single-period capitalization of normalized earnings',
      },
      {
        id: 'dividend_discount',
        name: 'Dividend Discount Model',
        category: 'income',
        enabled: false,
        weight: 0,
        implemented: false,
        description: 'Value based on expected future dividends',
      },
    ],
  },
  {
    name: 'Market Approach',
    category: 'market',
    icon: BarChart3,
    description: 'Value based on comparable companies and transactions',
    methodologies: [
      {
        id: 'public_comps',
        name: 'Public Comparables (Trading Comps)',
        category: 'market',
        enabled: false,
        weight: 0,
        implemented: false,
        route: 'public-comps',
        description: 'Multiples from guideline public companies',
      },
      {
        id: 'precedent_transactions',
        name: 'Precedent Transactions',
        category: 'market',
        enabled: false,
        weight: 0,
        implemented: false,
        route: 'precedent-transactions',
        description: 'Multiples from comparable M&A transactions',
      },
      {
        id: 'precedent_financings',
        name: 'Precedent Financings',
        category: 'market',
        enabled: false,
        weight: 0,
        implemented: false,
        description: 'Recent funding rounds and private transactions',
      },
      {
        id: 'opm_backsolve_enterprise',
        name: 'OPM Backsolve (Enterprise)',
        category: 'market',
        enabled: false,
        weight: 0,
        implemented: true,
        route: 'allocation/opm',
        description: 'Implied value from recent transaction using option pricing',
      },
    ],
  },
  {
    name: 'Asset Approach',
    category: 'asset',
    icon: FileSpreadsheet,
    description: 'Value based on underlying assets and liabilities',
    methodologies: [
      {
        id: 'adjusted_book',
        name: 'Adjusted Book Value',
        category: 'asset',
        enabled: false,
        weight: 0,
        implemented: false,
        description: 'Net asset value with fair value adjustments',
      },
      {
        id: 'cost_approach',
        name: 'Cost/Replacement Method',
        category: 'asset',
        enabled: false,
        weight: 0,
        implemented: false,
        description: 'Cost to recreate or replace assets',
      },
      {
        id: 'liquidation',
        name: 'Liquidation Value',
        category: 'asset',
        enabled: false,
        weight: 0,
        implemented: false,
        description: 'Orderly or forced liquidation proceeds',
      },
    ],
  },
]

interface ValuationMethodologySelectorProps {
  selectedMethodologies: ValuationMethodology[]
  onMethodologiesChange: (methodologies: ValuationMethodology[]) => void
  onUpdateSidebar?: () => void
}

export function ValuationMethodologySelector({
  selectedMethodologies,
  onMethodologiesChange,
  onUpdateSidebar,
}: ValuationMethodologySelectorProps) {
  const [methodologies, setMethodologies] = useState<ValuationMethodology[]>([])
  const [totalWeight, setTotalWeight] = useState(0)

  // Initialize methodologies from props or defaults
  useEffect(() => {
    if (selectedMethodologies && selectedMethodologies.length > 0) {
      setMethodologies(selectedMethodologies)
    } else {
      // Flatten all methodologies from groups
      const allMethodologies = methodologyGroups.flatMap((group) => group.methodologies)
      setMethodologies(allMethodologies)
    }
  }, [selectedMethodologies])

  // Calculate total weight whenever methodologies change
  useEffect(() => {
    const total = methodologies.filter((m) => m.enabled).reduce((sum, m) => sum + m.weight, 0)
    setTotalWeight(total)
  }, [methodologies])

  const handleToggleMethodology = (methodId: string) => {
    setMethodologies((prev) =>
      prev.map((m) =>
        m.id === methodId ? { ...m, enabled: !m.enabled, weight: !m.enabled ? 0 : m.weight } : m
      )
    )
  }

  const handleWeightChange = (methodId: string, weight: string) => {
    const numWeight = parseFloat(weight) || 0
    setMethodologies((prev) =>
      prev.map((m) =>
        m.id === methodId ? { ...m, weight: Math.min(100, Math.max(0, numWeight)) } : m
      )
    )
  }

  const handleAutoNormalize = () => {
    const enabledMethods = methodologies.filter((m) => m.enabled)
    if (enabledMethods.length === 0) return

    const equalWeight = 100 / enabledMethods.length
    setMethodologies((prev) =>
      prev.map((m) => (m.enabled ? { ...m, weight: parseFloat(equalWeight.toFixed(1)) } : m))
    )
  }

  const handleSave = () => {
    onMethodologiesChange(methodologies)
    if (onUpdateSidebar) {
      onUpdateSidebar()
    }
  }

  const isWeightValid = Math.abs(totalWeight - 100) < 0.01 || totalWeight === 0

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Valuation Methodology Selection & Weighting
          </CardTitle>
          <CardDescription>
            Select which valuation methods to use and assign weights for the final valuation
            synthesis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {methodologyGroups.map((group) => (
            <div key={group.category} className="space-y-3">
              <div className="flex items-center gap-2">
                <group.icon className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">{group.name}</h4>
                <span className="text-sm text-muted-foreground">- {group.description}</span>
              </div>

              <div className="ml-6 space-y-2">
                {methodologies
                  .filter((m) => m.category === group.category)
                  .map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        'flex items-center gap-4 rounded-lg border p-3',
                        method.enabled ? 'bg-accent/20' : 'bg-background',
                        !method.implemented && 'opacity-60'
                      )}
                    >
                      <Checkbox
                        id={method.id}
                        checked={method.enabled}
                        onCheckedChange={() => handleToggleMethodology(method.id)}
                        disabled={!method.implemented}
                      />

                      <div className="flex-1">
                        <label htmlFor={method.id} className="cursor-pointer font-medium">
                          {method.name}
                          {!method.implemented && (
                            <Badge variant="outline" className="ml-2">
                              Coming Soon
                            </Badge>
                          )}
                        </label>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={method.weight}
                          onChange={(e) => handleWeightChange(method.id, e.target.value)}
                          disabled={!method.enabled}
                          className="w-20 text-right"
                          min="0"
                          max="100"
                          step="1"
                        />
                        <span className="text-muted-foreground">%</span>

                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Weight in final valuation calculation</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Total Weight Display */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Total Weight:</span>
                <span
                  className={cn('font-bold', isWeightValid ? 'text-green-600' : 'text-red-600')}
                >
                  {totalWeight.toFixed(1)}%
                </span>
                {isWeightValid && totalWeight > 0 && <Check className="h-4 w-4 text-green-600" />}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoNormalize}
                  disabled={methodologies.filter((m) => m.enabled).length === 0}
                >
                  Auto-normalize weights
                </Button>

                <Button onClick={handleSave} disabled={!isWeightValid && totalWeight > 0}>
                  Save & Update Sidebar
                </Button>
              </div>
            </div>

            {!isWeightValid && totalWeight > 0 && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Weights must sum to 100%. Current total: {totalWeight.toFixed(1)}%
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
