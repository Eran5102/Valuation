import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { useDepreciationCapexData, DepreciationMethod } from '@/hooks/useDepreciationCapexData'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Building, Calendar, Download, Upload, Info, Plus, Trash2, Save } from 'lucide-react'

export default function DepreciationCapexSchedule() {
  const { settings } = useProjectSettings()
  const {
    depreciationCapexData,
    depreciationSchedule,
    capexSchedule,
    updateDepreciationLine,
    updateCapexLine,
    addDepreciationLine,
    addCapexLine,
    removeDepreciationLine,
    removeCapexLine,
    calculateTotals,
    saveDepreciationCapexData,
  } = useDepreciationCapexData(settings.maxProjectionYears)

  const [activeTab, setActiveTab] = useState('schedule')
  const [isLoading, setIsLoading] = useState(false)

  // State for form inputs
  const [newDepreciationItem, setNewDepreciationItem] = useState({
    assetCategory: '',
    initialValue: 0,
    usefulLife: 5,
    salvageValue: 0,
    depreciationMethod: 'straight_line' as DepreciationMethod,
  })

  const [newCapexItem, setNewCapexItem] = useState({
    description: '',
    amount: 0,
    year: new Date().getFullYear(),
    assetCategory: '',
    usefulLife: 5,
    depreciationMethod: 'straight_line' as DepreciationMethod,
  })

  // Years for projection display
  const currentYear = new Date().getFullYear()
  const projectionYears = Array.from(
    { length: Math.min(10, settings.maxProjectionYears) },
    (_, i) => currentYear + i
  )

  // Effect to calculate totals when data changes
  useEffect(() => {
    calculateTotals()
  }, [depreciationSchedule, capexSchedule])

  const handleSaveAsPreference = () => {
    setIsLoading(true)

    // Save current data as default
    saveDepreciationCapexData({
      ...depreciationCapexData,
      lastModified: new Date().toISOString(),
    })

    setTimeout(() => {
      setIsLoading(false)
      toast.success('Schedule saved as default preference')
    }, 500)
  }

  const handleAddDepreciation = () => {
    if (!newDepreciationItem.assetCategory) {
      toast.error('Asset category is required')
      return
    }

    addDepreciationLine({
      ...newDepreciationItem,
      depreciationMethod: newDepreciationItem.depreciationMethod || 'straight_line',
    })

    setNewDepreciationItem({
      assetCategory: '',
      initialValue: 0,
      usefulLife: 5,
      salvageValue: 0,
      depreciationMethod: 'straight_line',
    })
  }

  const handleAddCapex = () => {
    if (!newCapexItem.description || !newCapexItem.assetCategory) {
      toast.error('Description and asset category are required')
      return
    }

    addCapexLine(newCapexItem)
    setNewCapexItem({
      description: '',
      amount: 0,
      year: new Date().getFullYear(),
      assetCategory: '',
      usefulLife: 5,
      depreciationMethod: 'straight_line',
    })
  }

  // Get summary values from calculateTotals
  const {
    totalCurrentPPE = 0,
    totalAccumulatedDepreciation = 0,
    totalPlannedCapex = 0,
  } = calculateTotals()

  // Calculate depreciation amount based on method
  const calculateDepreciationAmount = (
    initialValue: number,
    salvageValue: number,
    usefulLife: number,
    method: DepreciationMethod,
    year: number // 1-based year of asset life
  ): number => {
    const depreciableBasis = initialValue - salvageValue

    switch (method) {
      case 'straight_line':
        return depreciableBasis / usefulLife

      case 'percent_net': // Declining balance method
        // Using 200% (double-declining)
        const rate = 2 / usefulLife
        const bookValueStart = initialValue - (year - 1) * (depreciableBasis / usefulLife)
        return Math.min(bookValueStart * rate, bookValueStart - salvageValue)

      case 'percent_gross': // Fixed percentage of cost
        return depreciableBasis * (1 / usefulLife)

      default:
        return depreciableBasis / usefulLife // Default to straight-line
    }
  }

  // Generate depreciation schedule visualization for a single asset
  const generateAssetDepreciationSchedule = (asset: any) => {
    const { initialValue, salvageValue, usefulLife, depreciationMethod = 'straight_line' } = asset
    const schedule = []
    let bookValue = initialValue
    let accumulatedDepreciation = 0

    for (let year = 1; year <= usefulLife; year++) {
      const depreciationAmount = calculateDepreciationAmount(
        initialValue,
        salvageValue,
        usefulLife,
        depreciationMethod as DepreciationMethod,
        year
      )

      accumulatedDepreciation += depreciationAmount
      bookValue = initialValue - accumulatedDepreciation

      // Adjust for final year to ensure we don't depreciate below salvage value
      if (bookValue < salvageValue) {
        accumulatedDepreciation = initialValue - salvageValue
        bookValue = salvageValue
      }

      schedule.push({
        year,
        depreciationExpense: depreciationAmount,
        accumulatedDepreciation,
        bookValue,
      })
    }

    return schedule
  }

  return (
    <div className="w-full space-y-6 p-4">
      <PageHeader
        title="Depreciation & Capital Expenditure Schedule"
        icon={<Building className="h-5 w-5" />}
        description="Track historical and projected depreciation and capital expenditures"
      />

      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle>Asset Depreciation & Capital Expenditure Tracking</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Import feature coming soon')}
              >
                <Upload className="mr-1 h-4 w-4" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Export feature coming soon')}
              >
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6 flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="schedule">Depreciation Schedule</TabsTrigger>
                <TabsTrigger value="capex">Capital Expenditures</TabsTrigger>
                <TabsTrigger value="projection">Projected Schedule</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <Button onClick={handleSaveAsPreference} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save as Default'}
              </Button>
            </div>

            <TabsContent value="schedule" className="space-y-6">
              <div className="rounded border bg-muted/20 p-4">
                <h3 className="mb-2 flex items-center font-medium">
                  <Info className="mr-2 h-4 w-4 text-blue-500" />
                  About Depreciation Methods
                </h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  <strong>Straight Line:</strong> Equal depreciation expense over asset's useful
                  life.
                </p>
                <p className="mb-2 text-sm text-muted-foreground">
                  <strong>Declining Balance:</strong> Accelerated depreciation with higher expenses
                  in earlier years.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Fixed Percentage:</strong> Constant percentage of the original cost each
                  year.
                </p>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                <div>
                  <Label htmlFor="assetCategory">Asset Category</Label>
                  <Input
                    id="assetCategory"
                    value={newDepreciationItem.assetCategory}
                    onChange={(e) =>
                      setNewDepreciationItem({
                        ...newDepreciationItem,
                        assetCategory: e.target.value,
                      })
                    }
                    placeholder="Building, Equipment, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="initialValue">Initial Value</Label>
                  <Input
                    id="initialValue"
                    type="number"
                    value={newDepreciationItem.initialValue}
                    onChange={(e) =>
                      setNewDepreciationItem({
                        ...newDepreciationItem,
                        initialValue: Number(e.target.value),
                      })
                    }
                    placeholder="$"
                  />
                </div>

                <div>
                  <Label htmlFor="usefulLife">Useful Life (years)</Label>
                  <Input
                    id="usefulLife"
                    type="number"
                    value={newDepreciationItem.usefulLife}
                    onChange={(e) =>
                      setNewDepreciationItem({
                        ...newDepreciationItem,
                        usefulLife: Number(e.target.value),
                      })
                    }
                    placeholder="Years"
                    min={1}
                  />
                </div>

                <div>
                  <Label htmlFor="depreciationMethod">Depreciation Method</Label>
                  <Select
                    value={newDepreciationItem.depreciationMethod}
                    onValueChange={(value: DepreciationMethod) =>
                      setNewDepreciationItem({ ...newDepreciationItem, depreciationMethod: value })
                    }
                  >
                    <SelectTrigger id="depreciationMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight_line">Straight Line</SelectItem>
                      <SelectItem value="percent_net">Declining Balance</SelectItem>
                      <SelectItem value="percent_gross">Fixed Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salvageValue">Salvage Value</Label>
                  <Input
                    id="salvageValue"
                    type="number"
                    value={newDepreciationItem.salvageValue}
                    onChange={(e) =>
                      setNewDepreciationItem({
                        ...newDepreciationItem,
                        salvageValue: Number(e.target.value),
                      })
                    }
                    placeholder="$"
                  />
                </div>
              </div>

              <Button className="w-full md:w-auto" onClick={handleAddDepreciation}>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Category</TableHead>
                      <TableHead>Initial Value ($)</TableHead>
                      <TableHead>Useful Life (years)</TableHead>
                      <TableHead>Salvage Value ($)</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Annual Depreciation ($)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depreciationSchedule.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-4 text-center">
                          No depreciation items added. Add your first asset above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      depreciationSchedule.map((item, index) => {
                        const depreciationAmount = calculateDepreciationAmount(
                          item.initialValue,
                          item.salvageValue,
                          item.usefulLife,
                          (item.depreciationMethod as DepreciationMethod) || 'straight_line',
                          1
                        )

                        return (
                          <TableRow key={index}>
                            <TableCell>{item.assetCategory}</TableCell>
                            <TableCell>${item.initialValue.toLocaleString()}</TableCell>
                            <TableCell>{item.usefulLife}</TableCell>
                            <TableCell>${item.salvageValue.toLocaleString()}</TableCell>
                            <TableCell>
                              {item.depreciationMethod === 'straight_line' && 'Straight Line'}
                              {item.depreciationMethod === 'percent_net' && 'Declining Balance'}
                              {item.depreciationMethod === 'percent_gross' && 'Fixed Percentage'}
                            </TableCell>
                            <TableCell>
                              $
                              {depreciationAmount.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDepreciationLine(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {depreciationSchedule.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium">Depreciation Over Asset Lifespan</h3>
                  {depreciationSchedule.map((asset, index) => {
                    const schedule = generateAssetDepreciationSchedule(asset)
                    return (
                      <div key={index} className="mb-6 rounded-md border p-4">
                        <h4 className="mb-3 flex items-center font-medium">
                          <Calendar className="mr-2 h-4 w-4" />
                          {asset.assetCategory} - ${asset.initialValue.toLocaleString()} (
                          {asset.depreciationMethod === 'straight_line'
                            ? 'Straight Line'
                            : asset.depreciationMethod === 'percent_net'
                              ? 'Declining Balance'
                              : 'Fixed Percentage'}{' '}
                          method)
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Year</TableHead>
                                <TableHead>Beginning Book Value</TableHead>
                                <TableHead>Depreciation Expense</TableHead>
                                <TableHead>Accumulated Depreciation</TableHead>
                                <TableHead>Ending Book Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {schedule.map((year, i) => (
                                <TableRow key={i}>
                                  <TableCell>{year.year}</TableCell>
                                  <TableCell>
                                    $
                                    {i === 0
                                      ? asset.initialValue.toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })
                                      : schedule[i - 1].bookValue.toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}
                                  </TableCell>
                                  <TableCell>
                                    $
                                    {year.depreciationExpense.toLocaleString(undefined, {
                                      maximumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    $
                                    {year.accumulatedDepreciation.toLocaleString(undefined, {
                                      maximumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    $
                                    {year.bookValue.toLocaleString(undefined, {
                                      maximumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="capex" className="space-y-6">
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-6">
                <div className="md:col-span-2">
                  <Label htmlFor="capexDescription">Description</Label>
                  <Input
                    id="capexDescription"
                    value={newCapexItem.description}
                    onChange={(e) =>
                      setNewCapexItem({ ...newCapexItem, description: e.target.value })
                    }
                    placeholder="New equipment purchase, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="capexAmount">Amount</Label>
                  <Input
                    id="capexAmount"
                    type="number"
                    value={newCapexItem.amount}
                    onChange={(e) =>
                      setNewCapexItem({ ...newCapexItem, amount: Number(e.target.value) })
                    }
                    placeholder="$"
                  />
                </div>

                <div>
                  <Label htmlFor="capexYear">Year</Label>
                  <Select
                    value={newCapexItem.year.toString()}
                    onValueChange={(value) =>
                      setNewCapexItem({ ...newCapexItem, year: Number(value) })
                    }
                  >
                    <SelectTrigger id="capexYear">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() + i
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="capexCategory">Category</Label>
                  <Input
                    id="capexCategory"
                    value={newCapexItem.assetCategory}
                    onChange={(e) =>
                      setNewCapexItem({ ...newCapexItem, assetCategory: e.target.value })
                    }
                    placeholder="Category"
                  />
                </div>

                <div>
                  <Label htmlFor="capexUsefulLife">Useful Life</Label>
                  <Input
                    id="capexUsefulLife"
                    type="number"
                    value={newCapexItem.usefulLife}
                    onChange={(e) =>
                      setNewCapexItem({ ...newCapexItem, usefulLife: Number(e.target.value) })
                    }
                    placeholder="Years"
                    min={1}
                  />
                </div>
              </div>

              <Button className="mb-6 w-full md:w-auto" onClick={handleAddCapex}>
                <Plus className="mr-2 h-4 w-4" />
                Add Capital Expenditure
              </Button>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount ($)</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Useful Life (years)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capexSchedule.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-4 text-center">
                          No capital expenditures added. Add your first CapEx above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      capexSchedule.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>${item.amount.toLocaleString()}</TableCell>
                          <TableCell>{item.year}</TableCell>
                          <TableCell>{item.assetCategory}</TableCell>
                          <TableCell>{item.usefulLife}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCapexLine(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="projection" className="space-y-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Item</TableHead>
                      {projectionYears.map((year) => (
                        <TableHead key={year}>{year}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Opening Gross PPE</TableCell>
                      {projectionYears.map((_, i) => (
                        <TableCell key={i}>
                          $
                          {(
                            totalCurrentPPE + (i > 0 ? totalPlannedCapex * i * 0.2 : 0)
                          ).toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Capital Expenditures</TableCell>
                      {projectionYears.map((year) => {
                        const yearCapex = capexSchedule
                          .filter((item) => item.year === year)
                          .reduce((sum, item) => sum + item.amount, 0)
                        return <TableCell key={year}>${yearCapex.toLocaleString()}</TableCell>
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Depreciation Expense</TableCell>
                      {projectionYears.map((year, i) => {
                        // Simple estimation of depreciation based on existing assets
                        const baseDepreciation = depreciationSchedule.reduce((sum, asset) => {
                          if (i < asset.usefulLife) {
                            return (
                              sum +
                              calculateDepreciationAmount(
                                asset.initialValue,
                                asset.salvageValue,
                                asset.usefulLife,
                                (asset.depreciationMethod as DepreciationMethod) || 'straight_line',
                                i + 1
                              )
                            )
                          }
                          return sum
                        }, 0)

                        // Add depreciation from capex that happened in prior years
                        const capexDepreciation = capexSchedule
                          .filter((item) => item.year < year)
                          .reduce((sum, item) => {
                            const yearsSinceAcquisition = year - item.year
                            if (yearsSinceAcquisition <= item.usefulLife) {
                              return sum + item.amount / item.usefulLife
                            }
                            return sum
                          }, 0)

                        return (
                          <TableCell key={year}>
                            $
                            {(baseDepreciation + capexDepreciation).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Accumulated Depreciation</TableCell>
                      {projectionYears.map((_, i) => {
                        // Simple accumulated depreciation projection
                        const projectedAccumDep =
                          totalAccumulatedDepreciation +
                          depreciationSchedule.reduce((sum, asset) => {
                            let assetDepreciation = 0
                            for (let year = 1; year <= Math.min(i + 1, asset.usefulLife); year++) {
                              assetDepreciation += calculateDepreciationAmount(
                                asset.initialValue,
                                asset.salvageValue,
                                asset.usefulLife,
                                (asset.depreciationMethod as DepreciationMethod) || 'straight_line',
                                year
                              )
                            }
                            return sum + assetDepreciation
                          }, 0)

                        return (
                          <TableCell key={i}>
                            $
                            {projectedAccumDep.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Closing Net PPE</TableCell>
                      {projectionYears.map((year, i) => {
                        // Simple net PPE calculation
                        const grossPPE =
                          totalCurrentPPE +
                          capexSchedule
                            .filter((item) => item.year <= year)
                            .reduce((sum, item) => sum + item.amount, 0)

                        // Estimated accumulated depreciation
                        const accumDep =
                          totalAccumulatedDepreciation +
                          depreciationSchedule.reduce((sum, asset) => {
                            let assetDepreciation = 0
                            for (let yr = 1; yr <= Math.min(i + 1, asset.usefulLife); yr++) {
                              assetDepreciation += calculateDepreciationAmount(
                                asset.initialValue,
                                asset.salvageValue,
                                asset.usefulLife,
                                (asset.depreciationMethod as DepreciationMethod) || 'straight_line',
                                yr
                              )
                            }
                            return sum + assetDepreciation
                          }, 0)

                        const netPPE = grossPPE - accumDep

                        return (
                          <TableCell key={year} className="font-medium">
                            ${netPPE.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Current PPE Balance
                  </h3>
                  <p className="text-2xl font-bold">${totalCurrentPPE.toLocaleString()}</p>
                </Card>

                <Card className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Accumulated Depreciation
                  </h3>
                  <p className="text-2xl font-bold">
                    ${totalAccumulatedDepreciation.toLocaleString()}
                  </p>
                </Card>

                <Card className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Total Planned Capital Expenditures
                  </h3>
                  <p className="text-2xl font-bold">${totalPlannedCapex.toLocaleString()}</p>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Fixed Asset Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Total Assets Count:</span>
                      <span>{depreciationSchedule.length}</span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Net Book Value:</span>
                      <span>
                        ${(totalCurrentPPE - totalAccumulatedDepreciation).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Average Useful Life:</span>
                      <span>
                        {depreciationSchedule.length > 0
                          ? (
                              depreciationSchedule.reduce(
                                (sum, asset) => sum + asset.usefulLife,
                                0
                              ) / depreciationSchedule.length
                            ).toFixed(1)
                          : 'N/A'}{' '}
                        years
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-medium">Average Annual Depreciation:</span>
                      <span>
                        $
                        {depreciationSchedule.length > 0
                          ? depreciationSchedule
                              .reduce((sum, asset) => {
                                return (
                                  sum +
                                  calculateDepreciationAmount(
                                    asset.initialValue,
                                    asset.salvageValue,
                                    asset.usefulLife,
                                    (asset.depreciationMethod as DepreciationMethod) ||
                                      'straight_line',
                                    1
                                  )
                                )
                              }, 0)
                              .toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : '0'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Depreciation & CapEx Projection</h3>
                <div className="flex items-center justify-center rounded-md border bg-muted/20 p-6">
                  <p className="text-muted-foreground">
                    Depreciation & CapEx projection chart will be displayed here
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
