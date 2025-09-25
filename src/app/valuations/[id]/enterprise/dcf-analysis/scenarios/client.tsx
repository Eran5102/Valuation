'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import { PercentageInput } from '@/components/ui/percentage-input'
import {
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  GitCompare,
  Save,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createScenario,
  updateScenario,
  deleteScenario,
  setActiveScenario,
  duplicateScenario,
  compareScenarios,
} from './actions'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface Scenario {
  id: string
  name: string
  description?: string
  type: 'Base' | 'Optimistic' | 'Pessimistic' | 'Custom'
  assumptions: {
    // Core Financial Assumptions
    revenueGrowthRate: number
    ebitdaMargin: number
    taxRate: number
    capexPercent: number
    workingCapitalPercent: number
    terminalGrowthRate: number
    discountRate: number

    // Operational Metrics
    daysReceivables?: number // Days Sales Outstanding (DSO)
    daysPayables?: number // Days Payable Outstanding (DPO)
    daysInventory?: number // Days Inventory Outstanding (DIO)
    inventoryTurnover?: number

    // Balance Sheet Metrics
    debtToEquityRatio?: number
    currentRatio?: number
    cashConversionCycle?: number

    // Margin Details
    grossMargin?: number
    sgaExpensePercent?: number
    depreciationPercent?: number
    interestCoverageRatio?: number

    // Growth Drivers
    averageSellingPrice?: number
    unitGrowthRate?: number
    marketShareGrowth?: number
    priceInflation?: number
  }
  projections?: {
    revenue: number[]
    ebitda: number[]
    depreciation: number[]
    ebit: number[]
    taxes: number[]
    capex: number[]
    workingCapitalChange: number[]
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ScenarioManagerClientProps {
  valuationId: string
  initialScenarios: Scenario[]
  currentDCFData: any
}

export function ScenarioManagerClient({
  valuationId,
  initialScenarios,
  currentDCFData,
}: ScenarioManagerClientProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonData, setComparisonData] = useState<any[]>([])

  // New scenario dialog state
  const [newScenarioOpen, setNewScenarioOpen] = useState(false)
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    type: 'Custom' as const,
    assumptions: {
      revenueGrowthRate: 0.15,
      ebitdaMargin: 0.25,
      taxRate: 0.21,
      capexPercent: 0.03,
      workingCapitalPercent: 0.02,
      terminalGrowthRate: 0.025,
      discountRate: 0.12,

      // Operational Metrics
      daysReceivables: 45,
      daysPayables: 30,
      daysInventory: 60,
      inventoryTurnover: 6,

      // Balance Sheet Metrics
      debtToEquityRatio: 0.3,
      currentRatio: 1.5,
      cashConversionCycle: 75,

      // Margin Details
      grossMargin: 0.6,
      sgaExpensePercent: 0.35,
      depreciationPercent: 0.03,
      interestCoverageRatio: 8,

      // Growth Drivers
      averageSellingPrice: 100,
      unitGrowthRate: 0.08,
      marketShareGrowth: 0.02,
      priceInflation: 0.02,
    },
  })

  // Handle scenario creation
  const handleCreateScenario = async () => {
    if (!newScenario.name) {
      toast.error('Please enter a scenario name')
      return
    }

    setIsCreating(true)
    try {
      const created = await createScenario(valuationId, newScenario)
      setScenarios([...scenarios, created])
      toast.success('Scenario created successfully')
      setNewScenarioOpen(false)
      setNewScenario({
        name: '',
        description: '',
        type: 'Custom',
        assumptions: {
          revenueGrowthRate: 0.15,
          ebitdaMargin: 0.25,
          taxRate: 0.21,
          capexPercent: 0.03,
          workingCapitalPercent: 0.02,
          terminalGrowthRate: 0.025,
          discountRate: 0.12,
        },
      })
    } catch (error) {
      console.error('Error creating scenario:', error)
      toast.error('Failed to create scenario')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle scenario activation
  const handleActivateScenario = async (scenarioId: string) => {
    try {
      await setActiveScenario(valuationId, scenarioId)
      setScenarios(
        scenarios.map((s) => ({
          ...s,
          is_active: s.id === scenarioId,
        }))
      )
      toast.success('Scenario activated')
    } catch (error) {
      console.error('Error activating scenario:', error)
      toast.error('Failed to activate scenario')
    }
  }

  // Handle scenario duplication
  const handleDuplicateScenario = async (scenarioId: string) => {
    const original = scenarios.find((s) => s.id === scenarioId)
    if (!original) return

    const newName = `${original.name} (Copy)`
    try {
      const duplicated = await duplicateScenario(valuationId, scenarioId, newName)
      setScenarios([...scenarios, duplicated])
      toast.success('Scenario duplicated successfully')
    } catch (error) {
      console.error('Error duplicating scenario:', error)
      toast.error('Failed to duplicate scenario')
    }
  }

  // Handle scenario deletion
  const handleDeleteScenario = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return

    try {
      await deleteScenario(valuationId, scenarioId)
      setScenarios(scenarios.filter((s) => s.id !== scenarioId))
      toast.success('Scenario deleted')
    } catch (error) {
      console.error('Error deleting scenario:', error)
      toast.error('Failed to delete scenario')
    }
  }

  // Handle scenario comparison
  const handleCompareScenarios = async () => {
    if (selectedScenarios.length < 2) {
      toast.error('Please select at least 2 scenarios to compare')
      return
    }

    setIsComparing(true)
    try {
      const comparison = await compareScenarios(valuationId, selectedScenarios)
      setComparisonData(comparison)
    } catch (error) {
      console.error('Error comparing scenarios:', error)
      toast.error('Failed to compare scenarios')
    } finally {
      setIsComparing(false)
    }
  }

  // Create quick scenarios based on common patterns
  const createQuickScenario = async (type: 'Base' | 'Optimistic' | 'Pessimistic') => {
    const templates = {
      Base: {
        name: 'Base Case',
        assumptions: {
          revenueGrowthRate: 0.15,
          ebitdaMargin: 0.25,
          taxRate: 0.21,
          capexPercent: 0.03,
          workingCapitalPercent: 0.02,
          terminalGrowthRate: 0.025,
          discountRate: 0.12,
        },
      },
      Optimistic: {
        name: 'Optimistic Case',
        assumptions: {
          revenueGrowthRate: 0.25,
          ebitdaMargin: 0.3,
          taxRate: 0.21,
          capexPercent: 0.025,
          workingCapitalPercent: 0.015,
          terminalGrowthRate: 0.035,
          discountRate: 0.1,
        },
      },
      Pessimistic: {
        name: 'Pessimistic Case',
        assumptions: {
          revenueGrowthRate: 0.05,
          ebitdaMargin: 0.2,
          taxRate: 0.21,
          capexPercent: 0.04,
          workingCapitalPercent: 0.03,
          terminalGrowthRate: 0.015,
          discountRate: 0.14,
        },
      },
    }

    const template = templates[type]
    try {
      const created = await createScenario(valuationId, {
        ...template,
        type,
        description: `${type} scenario with standard assumptions`,
      })
      setScenarios([...scenarios, created])
      toast.success(`${type} scenario created`)
    } catch (error) {
      console.error('Error creating quick scenario:', error)
      toast.error(`Failed to create ${type} scenario`)
    }
  }

  // Get scenario type badge color
  const getScenarioBadgeVariant = (type: string) => {
    switch (type) {
      case 'Base':
        return 'default'
      case 'Optimistic':
        return 'success'
      case 'Pessimistic':
        return 'destructive'
      case 'Custom':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scenario Manager</h1>
          <p className="text-muted-foreground">Create and compare different valuation scenarios</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newScenarioOpen} onOpenChange={setNewScenarioOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Scenario</DialogTitle>
                <DialogDescription>
                  Define assumptions for a new valuation scenario
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Scenario Name</Label>
                    <Input
                      value={newScenario.name}
                      onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                      placeholder="e.g., Conservative Growth"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scenario Type</Label>
                    <Select
                      value={newScenario.type}
                      onValueChange={(value: any) =>
                        setNewScenario({ ...newScenario, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Base">Base Case</SelectItem>
                        <SelectItem value="Optimistic">Optimistic</SelectItem>
                        <SelectItem value="Pessimistic">Pessimistic</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newScenario.description}
                    onChange={(e) =>
                      setNewScenario({ ...newScenario, description: e.target.value })
                    }
                    placeholder="Describe the key assumptions and rationale..."
                    rows={3}
                  />
                </div>

                <div className="border-t pt-4">
                  <Tabs defaultValue="core" className="w-full">
                    <TabsList className="inline-flex w-auto">
                      <TabsTrigger value="core" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Core
                      </TabsTrigger>
                      <TabsTrigger value="operations" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Operations
                      </TabsTrigger>
                      <TabsTrigger value="balance" className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Balance Sheet
                      </TabsTrigger>
                      <TabsTrigger value="growth" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Growth
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="core" className="mt-4 space-y-4">
                      <h4 className="font-medium">Core Financial Assumptions</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Revenue Growth Rate</Label>
                          <PercentageInput
                            value={newScenario.assumptions.revenueGrowthRate * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  revenueGrowthRate: value / 100,
                                },
                              })
                            }
                            min={-50}
                            max={100}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>EBITDA Margin</Label>
                          <PercentageInput
                            value={newScenario.assumptions.ebitdaMargin * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  ebitdaMargin: value / 100,
                                },
                              })
                            }
                            min={0}
                            max={50}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tax Rate</Label>
                          <PercentageInput
                            value={newScenario.assumptions.taxRate * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  taxRate: value / 100,
                                },
                              })
                            }
                            min={0}
                            max={50}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>CapEx (% of Revenue)</Label>
                          <PercentageInput
                            value={newScenario.assumptions.capexPercent * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  capexPercent: value / 100,
                                },
                              })
                            }
                            min={0}
                            max={20}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Terminal Growth Rate</Label>
                          <PercentageInput
                            value={newScenario.assumptions.terminalGrowthRate * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  terminalGrowthRate: value / 100,
                                },
                              })
                            }
                            min={0}
                            max={10}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Discount Rate (WACC)</Label>
                          <PercentageInput
                            value={newScenario.assumptions.discountRate * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  discountRate: value / 100,
                                },
                              })
                            }
                            min={5}
                            max={30}
                            decimals={1}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="operations" className="mt-4 space-y-4">
                      <h4 className="font-medium">Operational Metrics</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Days Sales Outstanding (DSO)</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.daysReceivables || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  daysReceivables: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={1}
                            max={365}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Days Payable Outstanding (DPO)</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.daysPayables || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  daysPayables: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={1}
                            max={365}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Days Inventory Outstanding (DIO)</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.daysInventory || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  daysInventory: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={1}
                            max={365}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Inventory Turnover (x)</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.inventoryTurnover || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  inventoryTurnover: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={0.1}
                            max={50}
                            step={0.1}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="balance" className="mt-4 space-y-4">
                      <h4 className="font-medium">Balance Sheet Metrics</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Debt-to-Equity Ratio</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.debtToEquityRatio || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  debtToEquityRatio: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={0}
                            max={5}
                            step={0.1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Current Ratio</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.currentRatio || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  currentRatio: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={0.1}
                            max={5}
                            step={0.1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Interest Coverage Ratio</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.interestCoverageRatio || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  interestCoverageRatio: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={1}
                            max={50}
                            step={0.1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Cash Conversion Cycle (days)</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.cashConversionCycle || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  cashConversionCycle: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={-100}
                            max={365}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="growth" className="mt-4 space-y-4">
                      <h4 className="font-medium">Growth Drivers</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Unit Growth Rate</Label>
                          <PercentageInput
                            value={(newScenario.assumptions.unitGrowthRate || 0) * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  unitGrowthRate: value / 100,
                                },
                              })
                            }
                            min={-50}
                            max={100}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Price Inflation</Label>
                          <PercentageInput
                            value={(newScenario.assumptions.priceInflation || 0) * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  priceInflation: value / 100,
                                },
                              })
                            }
                            min={-10}
                            max={20}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Market Share Growth</Label>
                          <PercentageInput
                            value={(newScenario.assumptions.marketShareGrowth || 0) * 100}
                            onChange={(value) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  marketShareGrowth: value / 100,
                                },
                              })
                            }
                            min={-20}
                            max={50}
                            decimals={1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Average Selling Price ($)</Label>
                          <Input
                            type="number"
                            value={newScenario.assumptions.averageSellingPrice || ''}
                            onChange={(e) =>
                              setNewScenario({
                                ...newScenario,
                                assumptions: {
                                  ...newScenario.assumptions,
                                  averageSellingPrice: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            min={0.01}
                            max={10000}
                            step={0.01}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewScenarioOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateScenario} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Scenario'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedScenarios.length > 0 && (
            <Button variant="outline" onClick={handleCompareScenarios} disabled={isComparing}>
              <GitCompare className="mr-2 h-4 w-4" />
              Compare ({selectedScenarios.length})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Create Buttons */}
      {scenarios.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Create standard scenarios to get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => createQuickScenario('Base')}>
                <Plus className="mr-2 h-4 w-4" />
                Base Case
              </Button>
              <Button variant="outline" onClick={() => createQuickScenario('Optimistic')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Optimistic Case
              </Button>
              <Button variant="outline" onClick={() => createQuickScenario('Pessimistic')}>
                <TrendingDown className="mr-2 h-4 w-4" />
                Pessimistic Case
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenarios List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className={cn(scenario.is_active && 'ring-2 ring-primary')}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {scenario.name}
                    {scenario.is_active && <CheckCircle className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </div>
                <Badge variant={getScenarioBadgeVariant(scenario.type) as any}>
                  {scenario.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue Growth:</span>
                  <span className="font-medium">
                    {(scenario.assumptions.revenueGrowthRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EBITDA Margin:</span>
                  <span className="font-medium">
                    {(scenario.assumptions.ebitdaMargin * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount Rate:</span>
                  <span className="font-medium">
                    {(scenario.assumptions.discountRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Terminal Growth:</span>
                  <span className="font-medium">
                    {(scenario.assumptions.terminalGrowthRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {!scenario.is_active && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleActivateScenario(scenario.id)}
                  >
                    Activate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicateScenario(scenario.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteScenario(scenario.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <input
                  type="checkbox"
                  className="ml-auto"
                  checked={selectedScenarios.includes(scenario.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedScenarios([...selectedScenarios, scenario.id])
                    } else {
                      setSelectedScenarios(selectedScenarios.filter((id) => id !== scenario.id))
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Results */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario Comparison</CardTitle>
            <CardDescription>Enterprise value and key metrics across scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonData.map((scenario) => {
                const baseEV = comparisonData[0].enterpriseValue
                const variance = ((scenario.enterpriseValue - baseEV) / baseEV) * 100

                return (
                  <div key={scenario.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{scenario.name}</h4>
                        <Badge
                          variant={getScenarioBadgeVariant(scenario.type) as any}
                          className="mt-1"
                        >
                          {scenario.type}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${(scenario.enterpriseValue / 1000000).toFixed(1)}M
                        </div>
                        {scenario.id !== comparisonData[0].id && (
                          <div
                            className={cn(
                              'text-sm',
                              variance > 0 ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {variance > 0 ? '+' : ''}
                            {variance.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Revenue CAGR: </span>
                        <span className="font-medium">{scenario.metrics.revenueCAGR * 100}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">EBITDA Margin: </span>
                        <span className="font-medium">
                          {scenario.metrics.avgEbitdaMargin * 100}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">WACC: </span>
                        <span className="font-medium">{scenario.metrics.discountRate}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Terminal Growth: </span>
                        <span className="font-medium">{scenario.metrics.terminalGrowthRate}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
