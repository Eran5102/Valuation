'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { Slider } from '@/components/ui/slider'
import {
  Building2,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Calculator,
  TrendingDown,
  Package2,
  Cpu,
  Car,
  Info,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDCFModel } from '@/contexts/DCFModelContext'
import {
  CapexDepreciationData,
  AssetClass as DCFAssetClass,
  CapexProjection as DCFCapexProjection,
} from '@/types/dcf'
import { ColumnDef } from '@tanstack/react-table'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'

interface AssetClass {
  id: string
  name: string
  category:
    | 'buildings'
    | 'equipment'
    | 'vehicles'
    | 'computers'
    | 'furniture'
    | 'intangible'
    | 'other'
  depreciationMethod: 'straight-line' | 'declining-balance' | 'sum-of-years' | 'units-of-production'
  usefulLife: number
  salvageValue: number
  historicalCost: number
  accumulatedDepreciation: number
  netBookValue: number
  annualDepreciation: number
}

interface CapexItem {
  id: string
  year: number
  assetClass: string
  description: string
  amount: number
  category: string
  depreciationStart: string
}

interface CapexProjection {
  year: number
  revenue: number
  maintenanceCapex: number
  growthCapex: number
  totalCapex: number
  capexAsPercentOfRevenue: number
  beginningPPE: number
  additions: number
  disposals: number
  depreciation: number
  endingPPE: number
  netPPE: number
}

interface CapexAssumptions {
  maintenanceCapexPercent: number
  growthCapexPercent: number
  assetDisposalRate: number
  averageUsefulLife: number
  depreciationMethod: 'straight-line' | 'accelerated'
  projectionMethod: 'percentage' | 'fixed' | 'detailed'
  capexGrowthRate: number
}

interface CapexDepreciationClientProps {
  valuationId: string
}

export function CapexDepreciationClient({ valuationId }: CapexDepreciationClientProps) {
  // Use DCF Model Context
  const {
    capexDepreciation,
    assumptions: coreAssumptions,
    updateCapexDepreciation,
    updateAssumptions,
    saveModel,
    isSaving: contextSaving,
    hasChanges: contextHasChanges,
    recalculateAll,
  } = useDCFModel()

  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([])
  const [capexItems, setCapexItems] = useState<CapexItem[]>([])
  const [projections, setProjections] = useState<CapexProjection[]>([])
  const [assumptions, setAssumptions] = useState<CapexAssumptions>({
    maintenanceCapexPercent: coreAssumptions?.maintenanceCapexPercent || 3,
    growthCapexPercent: coreAssumptions?.growthCapexPercent || 2,
    assetDisposalRate: 5,
    averageUsefulLife: 7,
    depreciationMethod: 'straight-line',
    projectionMethod:
      coreAssumptions?.capexMethod === 'growth'
        ? 'detailed'
        : coreAssumptions?.capexMethod === 'schedule'
          ? 'detailed'
          : 'percentage',
    capexGrowthRate: 10,
  })
  const [financialData, setFinancialData] = useState({
    baseRevenue: 10000000,
    revenueGrowthRates: coreAssumptions?.revenueGrowthRates || [20, 18, 15, 12, 10],
    currentPPE: 5000000,
    accumulatedDepreciation: 2000000,
  })
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Sync with DCF Model Context
  useEffect(() => {
    if (capexDepreciation) {
      // Convert context data to local format
      const classes = capexDepreciation.assetClasses.map((ac) => ({
        ...ac,
        category: 'equipment' as const,
        depreciationMethod: 'straight-line' as const,
        salvageValue: 0,
      }))
      setAssetClasses(classes)

      const projs = capexDepreciation.projections.map((proj) => ({
        ...proj,
        revenue:
          10000000 *
          Math.pow(1.15, proj.year - (coreAssumptions?.baseYear || new Date().getFullYear())),
        capexAsPercentOfRevenue:
          (proj.totalCapex /
            (10000000 *
              Math.pow(
                1.15,
                proj.year - (coreAssumptions?.baseYear || new Date().getFullYear())
              ))) *
          100,
        additions: proj.totalCapex,
        disposals: 0,
      }))
      setProjections(projs)

      if (capexDepreciation.assumptions) {
        setAssumptions((prev) => ({
          ...prev,
          maintenanceCapexPercent: capexDepreciation.assumptions.maintenanceCapexPercent,
          growthCapexPercent: capexDepreciation.assumptions.growthCapexPercent,
          averageUsefulLife: capexDepreciation.assumptions.averageUsefulLife,
          depreciationMethod:
            capexDepreciation.assumptions.depreciationMethod === 'straight-line'
              ? 'straight-line'
              : 'accelerated',
        }))
      }
    } else {
      loadCapexData()
    }
  }, [capexDepreciation, coreAssumptions])

  // Update assumptions when core assumptions change
  useEffect(() => {
    if (coreAssumptions) {
      setAssumptions((prev) => ({
        ...prev,
        maintenanceCapexPercent:
          coreAssumptions.maintenanceCapexPercent || prev.maintenanceCapexPercent,
        growthCapexPercent: coreAssumptions.growthCapexPercent || prev.growthCapexPercent,
        projectionMethod:
          coreAssumptions.capexMethod === 'growth'
            ? 'detailed'
            : coreAssumptions.capexMethod === 'schedule'
              ? 'detailed'
              : 'percentage',
      }))

      setFinancialData((prev) => ({
        ...prev,
        revenueGrowthRates: coreAssumptions.revenueGrowthRates || prev.revenueGrowthRates,
      }))
    }
  }, [coreAssumptions])

  // Recalculate projections when assumptions change
  useEffect(() => {
    if (assetClasses.length > 0 || assumptions.projectionMethod === 'percentage') {
      calculateProjections()
    }
  }, [assumptions, financialData, assetClasses, capexItems])

  const loadCapexData = async () => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/capex`)
      if (response.ok) {
        const data = await response.json()
        setAssetClasses(data.assetClasses || generateSampleAssetClasses())
        setCapexItems(data.capexItems || [])
        setAssumptions(data.assumptions || assumptions)
        setFinancialData(data.financialData || financialData)
      } else {
        setAssetClasses(generateSampleAssetClasses())
      }
    } catch (error) {
      console.error('Error loading capex data:', error)
      setAssetClasses(generateSampleAssetClasses())
    }
  }

  const generateSampleAssetClasses = (): AssetClass[] => {
    return [
      {
        id: 'ac_1',
        name: 'Buildings & Improvements',
        category: 'buildings',
        depreciationMethod: 'straight-line',
        usefulLife: 30,
        salvageValue: 100000,
        historicalCost: 2000000,
        accumulatedDepreciation: 400000,
        netBookValue: 1600000,
        annualDepreciation: 63333,
      },
      {
        id: 'ac_2',
        name: 'Manufacturing Equipment',
        category: 'equipment',
        depreciationMethod: 'declining-balance',
        usefulLife: 10,
        salvageValue: 50000,
        historicalCost: 1500000,
        accumulatedDepreciation: 600000,
        netBookValue: 900000,
        annualDepreciation: 145000,
      },
      {
        id: 'ac_3',
        name: 'Computer Equipment',
        category: 'computers',
        depreciationMethod: 'straight-line',
        usefulLife: 3,
        salvageValue: 0,
        historicalCost: 500000,
        accumulatedDepreciation: 300000,
        netBookValue: 200000,
        annualDepreciation: 166667,
      },
      {
        id: 'ac_4',
        name: 'Vehicles',
        category: 'vehicles',
        depreciationMethod: 'straight-line',
        usefulLife: 5,
        salvageValue: 10000,
        historicalCost: 300000,
        accumulatedDepreciation: 150000,
        netBookValue: 150000,
        annualDepreciation: 58000,
      },
    ]
  }

  const calculateProjections = () => {
    const projectionYears = coreAssumptions?.projectionYears || 5
    const baseYear = coreAssumptions?.baseYear || new Date().getFullYear()
    const newProjections: CapexProjection[] = []
    let currentPPE = financialData.currentPPE
    let currentAccumDep = financialData.accumulatedDepreciation

    for (let i = 0; i < projectionYears; i++) {
      const year = baseYear + i + 1
      const revenue =
        financialData.baseRevenue *
        financialData.revenueGrowthRates
          .slice(0, i + 1)
          .reduce((acc, rate) => acc * (1 + rate / 100), 1)

      let maintenanceCapex = 0
      let growthCapex = 0
      let totalCapex = 0
      let depreciation = 0

      if (assumptions.projectionMethod === 'percentage') {
        maintenanceCapex = revenue * (assumptions.maintenanceCapexPercent / 100)
        growthCapex = revenue * (assumptions.growthCapexPercent / 100)
        totalCapex = maintenanceCapex + growthCapex
        depreciation = (currentPPE + totalCapex / 2) / assumptions.averageUsefulLife
      } else if (assumptions.projectionMethod === 'detailed') {
        // Use detailed capex items and asset classes
        const yearCapexItems = capexItems.filter((item) => item.year === year)
        totalCapex = yearCapexItems.reduce((sum, item) => sum + item.amount, 0)

        // Calculate maintenance vs growth split
        maintenanceCapex = totalCapex * 0.6
        growthCapex = totalCapex * 0.4

        // Calculate depreciation based on asset classes
        depreciation = assetClasses.reduce((sum, asset) => sum + asset.annualDepreciation, 0)
      } else {
        // Fixed amount method
        totalCapex = financialData.currentPPE * (assumptions.capexGrowthRate / 100)
        maintenanceCapex = totalCapex * 0.6
        growthCapex = totalCapex * 0.4
        depreciation = currentPPE / assumptions.averageUsefulLife
      }

      const beginningPPE = currentPPE
      const additions = totalCapex
      const disposals = beginningPPE * (assumptions.assetDisposalRate / 100)
      const endingPPE = beginningPPE + additions - disposals

      currentAccumDep += depreciation - disposals * 0.5 // Assume assets disposed are 50% depreciated
      const netPPE = endingPPE - currentAccumDep

      newProjections.push({
        year,
        revenue,
        maintenanceCapex,
        growthCapex,
        totalCapex,
        capexAsPercentOfRevenue: (totalCapex / revenue) * 100,
        beginningPPE,
        additions,
        disposals,
        depreciation,
        endingPPE,
        netPPE,
      })

      currentPPE = endingPPE
    }

    setProjections(newProjections)

    // Update DCF context with new capex data
    const updatedCapex: CapexDepreciationData = {
      assetClasses: assetClasses.map((ac) => ({
        id: ac.id,
        name: ac.name,
        historicalCost: ac.historicalCost,
        accumulatedDepreciation: ac.accumulatedDepreciation,
        netBookValue: ac.netBookValue,
        usefulLife: ac.usefulLife,
        annualDepreciation: ac.annualDepreciation,
      })),
      projections: newProjections.map((proj) => ({
        year: proj.year,
        maintenanceCapex: proj.maintenanceCapex,
        growthCapex: proj.growthCapex,
        totalCapex: proj.totalCapex,
        depreciation: proj.depreciation,
        amortization: 0,
        beginningPPE: proj.beginningPPE,
        endingPPE: proj.endingPPE,
        netPPE: proj.netPPE,
      })),
      assumptions: {
        averageUsefulLife: assumptions.averageUsefulLife,
        depreciationMethod: assumptions.depreciationMethod,
        maintenanceCapexPercent: assumptions.maintenanceCapexPercent,
        growthCapexPercent: assumptions.growthCapexPercent,
      },
      summary: {
        totalPPE: newProjections[newProjections.length - 1]?.endingPPE || financialData.currentPPE,
        netBookValue:
          newProjections[newProjections.length - 1]?.netPPE ||
          financialData.currentPPE - financialData.accumulatedDepreciation,
        annualDepreciation: newProjections[0]?.depreciation || 0,
      },
    }

    updateCapexDepreciation(updatedCapex)

    // Update core assumptions if percentages have changed
    if (
      coreAssumptions?.maintenanceCapexPercent !== assumptions.maintenanceCapexPercent ||
      coreAssumptions?.growthCapexPercent !== assumptions.growthCapexPercent ||
      coreAssumptions?.capexPercent !==
        assumptions.maintenanceCapexPercent + assumptions.growthCapexPercent
    ) {
      updateAssumptions({
        maintenanceCapexPercent: assumptions.maintenanceCapexPercent,
        growthCapexPercent: assumptions.growthCapexPercent,
        capexPercent: assumptions.maintenanceCapexPercent + assumptions.growthCapexPercent,
      })
    }
  }

  const handleAddAssetClass = () => {
    const newAsset: AssetClass = {
      id: `ac_${Date.now()}`,
      name: 'New Asset Class',
      category: 'equipment',
      depreciationMethod: 'straight-line',
      usefulLife: 5,
      salvageValue: 0,
      historicalCost: 0,
      accumulatedDepreciation: 0,
      netBookValue: 0,
      annualDepreciation: 0,
    }
    setAssetClasses([...assetClasses, newAsset])
  }

  const handleDeleteAssetClass = (id: string) => {
    setAssetClasses(assetClasses.filter((item) => item.id !== id))
  }

  const handleUpdateAssetClass = (id: string, updates: Partial<AssetClass>) => {
    setAssetClasses(
      assetClasses.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates }

          // Recalculate depreciation
          if (updated.depreciationMethod === 'straight-line') {
            updated.annualDepreciation =
              (updated.historicalCost - updated.salvageValue) / updated.usefulLife
          } else if (updated.depreciationMethod === 'declining-balance') {
            const rate = 2 / updated.usefulLife
            updated.annualDepreciation = updated.netBookValue * rate
          }

          updated.netBookValue = updated.historicalCost - updated.accumulatedDepreciation
          return updated
        }
        return item
      })
    )
  }

  const handleAddCapexItem = () => {
    const newItem: CapexItem = {
      id: `capex_${Date.now()}`,
      year: new Date().getFullYear() + 1,
      assetClass: assetClasses[0]?.id || '',
      description: 'New Capital Expenditure',
      amount: 0,
      category: 'equipment',
      depreciationStart: new Date().toISOString().split('T')[0],
    }
    setCapexItems([...capexItems, newItem])
  }

  const handleSave = async () => {
    await saveModel()
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      await recalculateAll()
      toast.success('DCF model recalculated')
    } catch (error) {
      toast.error('Failed to recalculate DCF model')
    } finally {
      setIsRecalculating(false)
    }
  }

  const assetColumns: ColumnDef<AssetClass>[] = [
    {
      accessorKey: 'name',
      header: 'Asset Class',
      cell: ({ row }) => (
        <Input
          value={row.original.name}
          onChange={(e) => handleUpdateAssetClass(row.original.id, { name: e.target.value })}
          className="min-w-[150px]"
        />
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Select
          value={row.original.category}
          onValueChange={(value) =>
            handleUpdateAssetClass(row.original.id, { category: value as AssetClass['category'] })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buildings">Buildings</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="vehicles">Vehicles</SelectItem>
            <SelectItem value="computers">Computers</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="intangible">Intangible</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: 'historicalCost',
      header: 'Historical Cost',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            value={row.original.historicalCost}
            onChange={(e) =>
              handleUpdateAssetClass(row.original.id, {
                historicalCost: parseFloat(e.target.value) || 0,
              })
            }
            className="w-[120px]"
          />
        </div>
      ),
    },
    {
      accessorKey: 'accumulatedDepreciation',
      header: 'Accum. Depreciation',
      cell: ({ row }) => `$${row.original.accumulatedDepreciation.toLocaleString()}`,
    },
    {
      accessorKey: 'netBookValue',
      header: 'Net Book Value',
      cell: ({ row }) => (
        <div className="font-semibold">${row.original.netBookValue.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'usefulLife',
      header: 'Useful Life',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={row.original.usefulLife}
            onChange={(e) =>
              handleUpdateAssetClass(row.original.id, { usefulLife: parseInt(e.target.value) || 1 })
            }
            className="w-[60px]"
          />
          <span className="text-muted-foreground">yrs</span>
        </div>
      ),
    },
    {
      accessorKey: 'annualDepreciation',
      header: 'Annual Depreciation',
      cell: ({ row }) => `$${row.original.annualDepreciation.toLocaleString()}`,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleDeleteAssetClass(row.original.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const projectionColumns: ColumnDef<CapexProjection>[] = [
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => `Year ${row.original.year}`,
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => `$${(row.original.revenue / 1000000).toFixed(1)}M`,
    },
    {
      accessorKey: 'maintenanceCapex',
      header: 'Maintenance',
      cell: ({ row }) => `$${(row.original.maintenanceCapex / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'growthCapex',
      header: 'Growth',
      cell: ({ row }) => `$${(row.original.growthCapex / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'totalCapex',
      header: 'Total Capex',
      cell: ({ row }) => (
        <div className="font-semibold">${(row.original.totalCapex / 1000000).toFixed(2)}M</div>
      ),
    },
    {
      accessorKey: 'capexAsPercentOfRevenue',
      header: 'Capex %',
      cell: ({ row }) => `${row.original.capexAsPercentOfRevenue.toFixed(1)}%`,
    },
    {
      accessorKey: 'depreciation',
      header: 'Depreciation',
      cell: ({ row }) => `$${(row.original.depreciation / 1000000).toFixed(2)}M`,
    },
    {
      accessorKey: 'netPPE',
      header: 'Net PP&E',
      cell: ({ row }) => `$${(row.original.netPPE / 1000000).toFixed(2)}M`,
    },
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'buildings':
        return <Building2 className="h-4 w-4" />
      case 'equipment':
        return <Package2 className="h-4 w-4" />
      case 'computers':
        return <Cpu className="h-4 w-4" />
      case 'vehicles':
        return <Car className="h-4 w-4" />
      default:
        return <Package2 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-6 w-6" />
            Capex & Depreciation Schedule
          </h1>
          <p className="mt-1 text-muted-foreground">
            Model capital expenditures and depreciation expenses
          </p>
        </div>
        <div className="flex gap-2">
          {contextHasChanges && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleRecalculate} disabled={isRecalculating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
          <Button onClick={handleSave} disabled={contextSaving}>
            <Save className="mr-2 h-4 w-4" />
            {contextSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(assetClasses.reduce((sum, a) => sum + a.historicalCost, 0) / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Book Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(assetClasses.reduce((sum, a) => sum + a.netBookValue, 0) / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Annual Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(assetClasses.reduce((sum, a) => sum + a.annualDepreciation, 0) / 1000000).toFixed(
                2
              )}
              M
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Capex %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(assumptions.maintenanceCapexPercent + assumptions.growthCapexPercent).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList className="inline-flex w-auto">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Asset Classes
          </TabsTrigger>
          <TabsTrigger value="projections" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Projections
          </TabsTrigger>
          <TabsTrigger value="assumptions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Assumptions
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fixed Asset Register</CardTitle>
                  <CardDescription>Manage asset classes and depreciation schedules</CardDescription>
                </div>
                <Button onClick={handleAddAssetClass}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assetClasses.length > 0 ? (
                <EditableDataTable columns={assetColumns} data={assetClasses} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No asset classes defined. Click "Add Asset Class" to get started.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capex & Depreciation Projections</CardTitle>
              <CardDescription>
                Projected capital expenditures and depreciation over the forecast period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditableDataTable columns={projectionColumns} data={projections} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capital Expenditure Assumptions</CardTitle>
              <CardDescription>Configure how capex and depreciation are projected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Capex Assumptions</h3>

                  <div className="space-y-2">
                    <Label>Maintenance Capex (% of Revenue)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[assumptions.maintenanceCapexPercent]}
                        onValueChange={(value) =>
                          setAssumptions({
                            ...assumptions,
                            maintenanceCapexPercent: value[0],
                          })
                        }
                        min={0}
                        max={10}
                        step={0.5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={assumptions.maintenanceCapexPercent}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            maintenanceCapexPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Growth Capex (% of Revenue)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[assumptions.growthCapexPercent]}
                        onValueChange={(value) =>
                          setAssumptions({
                            ...assumptions,
                            growthCapexPercent: value[0],
                          })
                        }
                        min={0}
                        max={10}
                        step={0.5}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={assumptions.growthCapexPercent}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            growthCapexPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Projection Method</Label>
                    <Select
                      value={assumptions.projectionMethod}
                      onValueChange={(value) =>
                        setAssumptions({
                          ...assumptions,
                          projectionMethod: value as CapexAssumptions['projectionMethod'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">% of Revenue</SelectItem>
                        <SelectItem value="fixed">Fixed Growth Rate</SelectItem>
                        <SelectItem value="detailed">Detailed Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Depreciation Assumptions</h3>

                  <div className="space-y-2">
                    <Label>Average Useful Life (Years)</Label>
                    <Input
                      type="number"
                      value={assumptions.averageUsefulLife}
                      onChange={(e) =>
                        setAssumptions({
                          ...assumptions,
                          averageUsefulLife: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Depreciation Method</Label>
                    <Select
                      value={assumptions.depreciationMethod}
                      onValueChange={(value) =>
                        setAssumptions({
                          ...assumptions,
                          depreciationMethod: value as CapexAssumptions['depreciationMethod'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight-line">Straight Line</SelectItem>
                        <SelectItem value="accelerated">Accelerated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Asset Disposal Rate (% per year)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={assumptions.assetDisposalRate}
                      onChange={(e) =>
                        setAssumptions({
                          ...assumptions,
                          assetDisposalRate: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Total Capex Target:</strong>{' '}
                  {(assumptions.maintenanceCapexPercent + assumptions.growthCapexPercent).toFixed(
                    1
                  )}
                  % of revenue
                  <br />
                  This represents both sustaining and growth capital expenditures.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capex vs Depreciation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalCapex" fill="#8884d8" name="Total Capex" />
                  <Bar yAxisId="left" dataKey="depreciation" fill="#82ca9d" name="Depreciation" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="capexAsPercentOfRevenue"
                    stroke="#ff7300"
                    name="Capex %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Asset Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    assetClasses.reduce(
                      (acc, asset) => {
                        acc[asset.category] = (acc[asset.category] || 0) + asset.netBookValue
                        return acc
                      },
                      {} as Record<string, number>
                    )
                  ).map(([category, value]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="capitalize">{category}</span>
                      </div>
                      <span className="font-semibold">${(value / 1000000).toFixed(2)}M</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">5-Year Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Capex:</span>
                    <span className="font-semibold">
                      $
                      {(projections.reduce((sum, p) => sum + p.totalCapex, 0) / 1000000).toFixed(1)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Depreciation:</span>
                    <span className="font-semibold">
                      $
                      {(projections.reduce((sum, p) => sum + p.depreciation, 0) / 1000000).toFixed(
                        1
                      )}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net PP&E Growth:</span>
                    <span className="font-semibold">
                      $
                      {(
                        (projections[projections.length - 1]?.netPPE -
                          financialData.currentPPE +
                          financialData.accumulatedDepreciation) /
                        1000000
                      ).toFixed(1)}
                      M
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
