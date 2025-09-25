'use client'

import { useState } from 'react'
import { useValuationWorkspace } from '@/contexts/ValuationWorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  Calculator,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function EnterpriseValuationPage() {
  const { valuation, updateMethodologies, updateAssumptions, loading } = useValuationWorkspace()
  const [activeApproach, setActiveApproach] = useState('market')
  const [selectedMethods, setSelectedMethods] = useState({
    market: valuation?.methodologies?.enterprise?.market || false,
    income: valuation?.methodologies?.enterprise?.income || false,
    asset: valuation?.methodologies?.enterprise?.asset || false,
  })

  // Market approach data
  const [marketMultiples, setMarketMultiples] = useState({
    revenue: { value: 2.5, weight: 0.5 },
    ebitda: { value: 12, weight: 0.5 },
  })

  // Income approach data
  const [dcfAssumptions, setDcfAssumptions] = useState({
    wacc: 12,
    terminalGrowthRate: 2.5,
    projectionYears: 5,
  })

  // Asset approach data
  const [assetValues, setAssetValues] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    adjustments: 0,
  })

  const handleMethodToggle = (method: 'market' | 'income' | 'asset') => {
    const newMethods = {
      ...selectedMethods,
      [method]: !selectedMethods[method],
    }
    setSelectedMethods(newMethods)

    // Save to context
    updateMethodologies({
      enterprise: newMethods,
    })
  }

  const calculateEnterpriseValue = () => {
    let totalValue = 0
    let methodCount = 0

    if (selectedMethods.market) {
      // Market approach calculation (simplified)
      const revenueValue = 10000000 * marketMultiples.revenue.value // Assume $10M revenue
      const ebitdaValue = 2000000 * marketMultiples.ebitda.value // Assume $2M EBITDA
      const marketValue =
        revenueValue * marketMultiples.revenue.weight + ebitdaValue * marketMultiples.ebitda.weight
      totalValue += marketValue
      methodCount++
    }

    if (selectedMethods.income) {
      // DCF calculation (simplified)
      const dcfValue = 28000000 // Simplified DCF result
      totalValue += dcfValue
      methodCount++
    }

    if (selectedMethods.asset) {
      // Asset approach calculation
      const assetValue =
        assetValues.totalAssets - assetValues.totalLiabilities + assetValues.adjustments
      totalValue += assetValue
      methodCount++
    }

    return methodCount > 0 ? totalValue / methodCount : 0
  }

  const enterpriseValue = calculateEnterpriseValue()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Enterprise Valuation</h1>
        <p className="mt-1 text-muted-foreground">
          Determine the total enterprise value using market, income, and asset approaches
        </p>
      </div>

      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Valuation Approaches</CardTitle>
          <CardDescription>Select which approaches to use for enterprise valuation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
              className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                selectedMethods.market
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleMethodToggle('market')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Market Approach</h3>
                    <p className="text-sm text-muted-foreground">Comparable company analysis</p>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.market}
                  onCheckedChange={() => {}}
                  className="mt-1"
                />
              </div>
              {selectedMethods.market && (
                <Badge className="absolute -top-2 right-2" variant="default">
                  Active
                </Badge>
              )}
            </div>

            <div
              className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                selectedMethods.income
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleMethodToggle('income')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Income Approach</h3>
                    <p className="text-sm text-muted-foreground">Discounted cash flow analysis</p>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.income}
                  onCheckedChange={() => {}}
                  className="mt-1"
                />
              </div>
              {selectedMethods.income && (
                <Badge className="absolute -top-2 right-2" variant="default">
                  Active
                </Badge>
              )}
            </div>

            <div
              className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                selectedMethods.asset
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleMethodToggle('asset')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Asset Approach</h3>
                    <p className="text-sm text-muted-foreground">Net asset value method</p>
                  </div>
                </div>
                <Checkbox
                  checked={selectedMethods.asset}
                  onCheckedChange={() => {}}
                  className="mt-1"
                />
              </div>
              {selectedMethods.asset && (
                <Badge className="absolute -top-2 right-2" variant="default">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approach Details */}
      <Tabs value={activeApproach} onValueChange={setActiveApproach}>
        <TabsList className="inline-flex w-auto">
          <TabsTrigger
            value="market"
            disabled={!selectedMethods.market}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Market
          </TabsTrigger>
          <TabsTrigger
            value="income"
            disabled={!selectedMethods.income}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Income
          </TabsTrigger>
          <TabsTrigger
            value="asset"
            disabled={!selectedMethods.asset}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Asset
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>Market Approach - Comparable Company Analysis</CardTitle>
              <CardDescription>
                Configure revenue and EBITDA multiples based on comparable companies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Revenue Multiple</Label>
                  <Input
                    type="number"
                    value={marketMultiples.revenue.value}
                    onChange={(e) =>
                      setMarketMultiples({
                        ...marketMultiples,
                        revenue: { ...marketMultiples.revenue, value: parseFloat(e.target.value) },
                      })
                    }
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Based on industry comparables</p>
                </div>
                <div className="space-y-2">
                  <Label>Revenue Weight</Label>
                  <Input
                    type="number"
                    value={marketMultiples.revenue.weight}
                    onChange={(e) =>
                      setMarketMultiples({
                        ...marketMultiples,
                        revenue: { ...marketMultiples.revenue, weight: parseFloat(e.target.value) },
                      })
                    }
                    min="0"
                    max="1"
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Weighting in final calculation</p>
                </div>
                <div className="space-y-2">
                  <Label>EBITDA Multiple</Label>
                  <Input
                    type="number"
                    value={marketMultiples.ebitda.value}
                    onChange={(e) =>
                      setMarketMultiples({
                        ...marketMultiples,
                        ebitda: { ...marketMultiples.ebitda, value: parseFloat(e.target.value) },
                      })
                    }
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Based on industry comparables</p>
                </div>
                <div className="space-y-2">
                  <Label>EBITDA Weight</Label>
                  <Input
                    type="number"
                    value={marketMultiples.ebitda.weight}
                    onChange={(e) =>
                      setMarketMultiples({
                        ...marketMultiples,
                        ebitda: { ...marketMultiples.ebitda, weight: parseFloat(e.target.value) },
                      })
                    }
                    min="0"
                    max="1"
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Weighting in final calculation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income Approach - Discounted Cash Flow</CardTitle>
              <CardDescription>Configure DCF assumptions and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>WACC (%)</Label>
                  <Input
                    type="number"
                    value={dcfAssumptions.wacc}
                    onChange={(e) =>
                      setDcfAssumptions({
                        ...dcfAssumptions,
                        wacc: parseFloat(e.target.value),
                      })
                    }
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Weighted average cost of capital</p>
                </div>
                <div className="space-y-2">
                  <Label>Terminal Growth Rate (%)</Label>
                  <Input
                    type="number"
                    value={dcfAssumptions.terminalGrowthRate}
                    onChange={(e) =>
                      setDcfAssumptions({
                        ...dcfAssumptions,
                        terminalGrowthRate: parseFloat(e.target.value),
                      })
                    }
                    step="0.1"
                  />
                  <p className="text-sm text-muted-foreground">Perpetual growth rate</p>
                </div>
                <div className="space-y-2">
                  <Label>Projection Years</Label>
                  <Input
                    type="number"
                    value={dcfAssumptions.projectionYears}
                    onChange={(e) =>
                      setDcfAssumptions({
                        ...dcfAssumptions,
                        projectionYears: parseInt(e.target.value),
                      })
                    }
                    min="3"
                    max="10"
                  />
                  <p className="text-sm text-muted-foreground">Years to project cash flows</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asset">
          <Card>
            <CardHeader>
              <CardTitle>Asset Approach - Adjusted Book Value</CardTitle>
              <CardDescription>Enter balance sheet values and adjustments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Assets ($)</Label>
                  <Input
                    type="number"
                    value={assetValues.totalAssets}
                    onChange={(e) =>
                      setAssetValues({
                        ...assetValues,
                        totalAssets: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground">Book value of assets</p>
                </div>
                <div className="space-y-2">
                  <Label>Total Liabilities ($)</Label>
                  <Input
                    type="number"
                    value={assetValues.totalLiabilities}
                    onChange={(e) =>
                      setAssetValues({
                        ...assetValues,
                        totalLiabilities: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground">Book value of liabilities</p>
                </div>
                <div className="space-y-2">
                  <Label>Fair Value Adjustments ($)</Label>
                  <Input
                    type="number"
                    value={assetValues.adjustments}
                    onChange={(e) =>
                      setAssetValues({
                        ...assetValues,
                        adjustments: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground">Net adjustments to book value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Value Summary</CardTitle>
          <CardDescription>Weighted average of selected valuation approaches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Calculated Enterprise Value</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(enterpriseValue)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Approaches:</p>
              <div className="flex flex-wrap gap-2">
                {selectedMethods.market && (
                  <Badge variant="secondary">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Market Approach
                  </Badge>
                )}
                {selectedMethods.income && (
                  <Badge variant="secondary">
                    <DollarSign className="mr-1 h-3 w-3" />
                    Income Approach
                  </Badge>
                )}
                {selectedMethods.asset && (
                  <Badge variant="secondary">
                    <FileSpreadsheet className="mr-1 h-3 w-3" />
                    Asset Approach
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Info className="mt-0.5 h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-900">
                The enterprise value represents the total value of the company before allocation to
                different share classes. This value will be used as input for the equity allocation
                methodology.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
