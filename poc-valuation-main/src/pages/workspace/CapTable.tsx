import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { Save, Plus, Trash2, Calculator, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'

// Define types for our cap table data
interface ShareClass {
  id: string
  type: 'Common' | 'Preferred'
  name: string
  roundDate: string
  numberOfShares: number
  pricePerShare: number

  // Liquidation preferences
  preferenceType: 'Non-Participating' | 'Participating' | 'Participating with Cap'
  liquidationPreference: string // "1x", "2x", etc.
  participationCap?: number // Only relevant if preferenceType is "Participating with Cap"
  seniority: number // 1, 2, 3, etc.
  seniorityType: 'Senior' | 'Pari Passu'

  // Conversion & Ownership
  conversionRatio: number

  // Dividends
  dividendsDeclared: boolean
  dividendRate: number // Percentage
  dividendType: 'None' | 'Non-Cumulative' | 'Cumulative'
  isPIK: boolean // Payment in Kind
  yearsSinceRound?: number // Calculated field
}

interface OptionPool {
  id: string
  name: string
  numberOfOptions: number
  strikePrice: number
  vestingDetails: string
  type: 'ISO' | 'NSO'
  vestedPercentage: number // 0-100
}

interface CapTableState {
  shareClasses: ShareClass[]
  options: OptionPool[]
  exitValue: number
  transactionExpenses: number
}

// Helper functions for calculations
const calculateInvestmentAmount = (shares: number, pricePerShare: number): number => {
  return shares * pricePerShare
}

const calculateAsConvertedShares = (shares: number, conversionRatio: number): number => {
  return shares * conversionRatio
}

const calculateOwnershipPercentage = (
  asConvertedShares: number,
  totalAsConvertedShares: number
): number => {
  return totalAsConvertedShares > 0 ? (asConvertedShares / totalAsConvertedShares) * 100 : 0
}

const calculatePreferenceAmount = (
  investmentAmount: number,
  liquidationPreference: string
): number => {
  const prefMultiple = parseFloat(liquidationPreference.replace('x', ''))
  return investmentAmount * prefMultiple
}

const calculateDividends = (
  investmentAmount: number,
  dividendRate: number,
  dividendType: 'None' | 'Non-Cumulative' | 'Cumulative',
  yearsSinceRound: number = 1
): number => {
  if (dividendType === 'None') return 0
  if (dividendType === 'Non-Cumulative') return investmentAmount * (dividendRate / 100)
  // Cumulative
  return investmentAmount * (dividendRate / 100) * yearsSinceRound
}

const calculateEffectiveOptionShares = (
  options: number,
  strikePrice: number,
  pricePerShare: number
): number => {
  if (pricePerShare <= strikePrice) return 0 // Options are underwater
  return (options * (pricePerShare - strikePrice)) / pricePerShare
}

// Helper function to calculate payout order
const calculatePayoutOrder = (shareClasses: ShareClass[]): Record<string, number> => {
  // Group by seniority
  const seniorityGroups: Record<number, ShareClass[]> = {}

  shareClasses.forEach((shareClass) => {
    if (!seniorityGroups[shareClass.seniority]) {
      seniorityGroups[shareClass.seniority] = []
    }
    seniorityGroups[shareClass.seniority].push(shareClass)
  })

  // Sort seniority groups (lowest to highest, 1 is most senior)
  const orderedSeniorities = Object.keys(seniorityGroups)
    .map(Number)
    .sort((a, b) => a - b)

  // Assign payout order
  let payoutOrder: Record<string, number> = {}
  let currentOrder = 1

  orderedSeniorities.forEach((seniority) => {
    const group = seniorityGroups[seniority]
    group.forEach((shareClass) => {
      payoutOrder[shareClass.id] = currentOrder
    })
    currentOrder++
  })

  return payoutOrder
}

export default function CapTable() {
  const [activeTab, setActiveTab] = useState('basic')

  // Initialize cap table data
  const [capTableData, setCapTableData] = useState<CapTableState>({
    shareClasses: [],
    options: [],
    exitValue: 0,
    transactionExpenses: 0,
  })

  const [payoutOrder, setPayoutOrder] = useState<Record<string, number>>({})

  // Calculate payout order when share classes change
  useEffect(() => {
    const newPayoutOrder = calculatePayoutOrder(capTableData.shareClasses)
    setPayoutOrder(newPayoutOrder)
  }, [capTableData.shareClasses])

  // Add a new share class
  const addShareClass = () => {
    // Check if we already have a Common share class
    const hasCommon = capTableData.shareClasses.some((shareClass) => shareClass.type === 'Common')

    const newShareClass: ShareClass = {
      id: `share-${Date.now()}`,
      type: hasCommon ? 'Preferred' : 'Common',
      name: hasCommon
        ? `Series ${String.fromCharCode(65 + capTableData.shareClasses.filter((sc) => sc.type === 'Preferred').length)}`
        : 'Common',
      roundDate: new Date().toISOString().split('T')[0],
      numberOfShares: 0,
      pricePerShare: 0,
      preferenceType: 'Non-Participating',
      liquidationPreference: '1x',
      seniority: capTableData.shareClasses.length + 1,
      seniorityType: 'Senior',
      conversionRatio: 1,
      dividendsDeclared: false,
      dividendRate: 0,
      dividendType: 'None',
      isPIK: false,
      yearsSinceRound: 0,
    }

    setCapTableData((prev) => ({
      ...prev,
      shareClasses: [...prev.shareClasses, newShareClass],
    }))
  }

  // Update a share class
  const updateShareClass = (id: string, field: keyof ShareClass, value: any) => {
    setCapTableData((prev) => ({
      ...prev,
      shareClasses: prev.shareClasses.map((shareClass) => {
        if (shareClass.id === id) {
          return { ...shareClass, [field]: value }
        }
        return shareClass
      }),
    }))
  }

  // Remove a share class
  const removeShareClass = (id: string) => {
    setCapTableData((prev) => ({
      ...prev,
      shareClasses: prev.shareClasses.filter((shareClass) => shareClass.id !== id),
    }))
    toast.success('Share class removed')
  }

  // Add a new option pool
  const addOptionPool = () => {
    const newOption: OptionPool = {
      id: `opt-${Date.now()}`,
      name: `Option Pool ${capTableData.options.length + 1}`,
      numberOfOptions: 0,
      strikePrice: 0,
      vestingDetails: '4 year vesting, 1 year cliff',
      type: 'ISO',
      vestedPercentage: 0,
    }

    setCapTableData((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
  }

  // Update an option pool
  const updateOptionPool = (id: string, field: keyof OptionPool, value: any) => {
    setCapTableData((prev) => ({
      ...prev,
      options: prev.options.map((option) => {
        if (option.id === id) {
          return { ...option, [field]: value }
        }
        return option
      }),
    }))
  }

  // Remove an option pool
  const removeOptionPool = (id: string) => {
    setCapTableData((prev) => ({
      ...prev,
      options: prev.options.filter((option) => option.id !== id),
    }))
    toast.success('Option pool removed')
  }

  // Save the entire cap table
  const saveCapTable = () => {
    // In a real app, this would save to API/backend
    console.log('Saving cap table data:', capTableData)
    toast.success('Cap table data saved successfully')
  }

  // Calculate statistics for summary
  const calculateStats = () => {
    // Total shares by type
    const commonShares = capTableData.shareClasses
      .filter((sc) => sc.type === 'Common')
      .reduce((sum, sc) => sum + sc.numberOfShares, 0)

    const preferredShares = capTableData.shareClasses
      .filter((sc) => sc.type === 'Preferred')
      .reduce((sum, sc) => sum + sc.numberOfShares, 0)

    // Total options
    const totalOptions = capTableData.options.reduce(
      (sum, option) => sum + option.numberOfOptions,
      0
    )

    // Calculate as-converted shares
    const asConvertedByClass = capTableData.shareClasses.map((sc) => ({
      id: sc.id,
      asConverted: calculateAsConvertedShares(sc.numberOfShares, sc.conversionRatio),
    }))

    const totalAsConverted =
      asConvertedByClass.reduce((sum, item) => sum + item.asConverted, 0) + totalOptions

    // Calculate ownership percentages
    const ownershipByClass = asConvertedByClass.map((item) => ({
      id: item.id,
      ownership: calculateOwnershipPercentage(item.asConverted, totalAsConverted),
    }))

    const optionsOwnership = calculateOwnershipPercentage(totalOptions, totalAsConverted)

    return {
      commonShares,
      preferredShares,
      totalOptions,
      totalAsConverted,
      asConvertedByClass,
      ownershipByClass,
      optionsOwnership,
    }
  }

  const stats = calculateStats()

  // Calculate investment amounts for each share class
  const calculateInvestmentAmounts = () => {
    return capTableData.shareClasses.map((sc) => ({
      id: sc.id,
      investmentAmount: calculateInvestmentAmount(sc.numberOfShares, sc.pricePerShare),
    }))
  }

  const investmentAmounts = calculateInvestmentAmounts()

  // Validate common share class
  const validateShareClass = (type: 'Common' | 'Preferred') => {
    if (type === 'Common') {
      // Check if we already have a Common share class
      const commonClasses = capTableData.shareClasses.filter((sc) => sc.type === 'Common')
      if (commonClasses.length > 1) {
        toast.error('Only one Common share class is allowed')
        // Revert the last added common share class to preferred
        const lastCommonId = commonClasses[commonClasses.length - 1].id
        updateShareClass(lastCommonId, 'type', 'Preferred')
        updateShareClass(
          lastCommonId,
          'name',
          `Series ${String.fromCharCode(65 + capTableData.shareClasses.filter((sc) => sc.type === 'Preferred').length - 1)}`
        )
      }
    }
  }

  // Validate on changes to share class types
  useEffect(() => {
    const commonClasses = capTableData.shareClasses.filter((sc) => sc.type === 'Common')
    if (commonClasses.length > 1) {
      validateShareClass('Common')
    }
  }, [capTableData.shareClasses])

  return (
    <div className="w-full p-4">
      <PageHeader
        title="Capitalization Table Management"
        icon={<Calculator className="h-5 w-5" />}
        description="Manage and track the company's ownership structure and equity distributions"
      />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="bg-muted/40 pb-2">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Calculator className="h-5 w-5 text-primary" />
              <span>Ownership Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryCard title="Common Shares" value={stats.commonShares.toLocaleString()} />
              <SummaryCard
                title="Preferred Shares"
                value={stats.preferredShares.toLocaleString()}
              />
              <SummaryCard
                title="Options Outstanding"
                value={stats.totalOptions.toLocaleString()}
              />
              <SummaryCard
                title="Fully Diluted Shares"
                value={stats.totalAsConverted.toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/40 pb-2">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Calculator className="h-5 w-5 text-primary" />
              <span>Exit Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <Label>Exit Valuation</Label>
                <Input
                  type="number"
                  value={capTableData.exitValue}
                  onChange={(e) =>
                    setCapTableData((prev) => ({
                      ...prev,
                      exitValue: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <Label>Transaction Expenses</Label>
                <Input
                  type="number"
                  value={capTableData.transactionExpenses}
                  onChange={(e) =>
                    setCapTableData((prev) => ({
                      ...prev,
                      transactionExpenses: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <Label>Net Exit Value</Label>
                <div className="text-xl font-bold">
                  ${(capTableData.exitValue - capTableData.transactionExpenses).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <Button onClick={saveCapTable} className="bg-primary">
          <Save className="mr-2 h-4 w-4" />
          Save Cap Table Data
        </Button>

        <div>
          <Button onClick={addShareClass} className="mr-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Share Class
          </Button>
          <Button onClick={addOptionPool} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Option Pool
          </Button>
        </div>
      </div>

      {capTableData.shareClasses.length === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No share classes defined. Click "Add Share Class" to get started.
          </AlertDescription>
        </Alert>
      )}

      {capTableData.shareClasses.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="bg-muted/40 pb-2">
            <CardTitle>Share Classes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 grid grid-cols-4">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="liquidation">Liquidation Preferences</TabsTrigger>
                <TabsTrigger value="conversion">Conversion & Ownership</TabsTrigger>
                <TabsTrigger value="dividends">Dividends</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Round Date</TableHead>
                      <TableHead># Shares</TableHead>
                      <TableHead>Price/Share</TableHead>
                      <TableHead>Amt Invested</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTableData.shareClasses.map((shareClass) => {
                      const investmentAmount =
                        investmentAmounts.find((ia) => ia.id === shareClass.id)?.investmentAmount ||
                        0

                      return (
                        <TableRow key={shareClass.id}>
                          <TableCell>
                            <Select
                              value={shareClass.type}
                              onValueChange={(value: 'Common' | 'Preferred') => {
                                updateShareClass(shareClass.id, 'type', value)
                                validateShareClass(value)
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue>{shareClass.type}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Common">Common</SelectItem>
                                <SelectItem value="Preferred">Preferred</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={shareClass.name}
                              onChange={(e) =>
                                updateShareClass(shareClass.id, 'name', e.target.value)
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={shareClass.roundDate}
                              onChange={(e) =>
                                updateShareClass(shareClass.id, 'roundDate', e.target.value)
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={shareClass.numberOfShares}
                              onChange={(e) =>
                                updateShareClass(
                                  shareClass.id,
                                  'numberOfShares',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={shareClass.pricePerShare}
                              onChange={(e) =>
                                updateShareClass(
                                  shareClass.id,
                                  'pricePerShare',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>${investmentAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => removeShareClass(shareClass.id)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Liquidation Preferences Tab */}
              <TabsContent value="liquidation" className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Preference Type</TableHead>
                      <TableHead>Liquidation Preference</TableHead>
                      <TableHead>Participation Cap</TableHead>
                      <TableHead>Seniority</TableHead>
                      <TableHead>Seniority Type</TableHead>
                      <TableHead>Payout Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTableData.shareClasses.map((shareClass) => (
                      <TableRow key={shareClass.id}>
                        <TableCell>{shareClass.name}</TableCell>
                        <TableCell>
                          <Select
                            value={shareClass.preferenceType}
                            onValueChange={(
                              value:
                                | 'Non-Participating'
                                | 'Participating'
                                | 'Participating with Cap'
                            ) => updateShareClass(shareClass.id, 'preferenceType', value)}
                            disabled={shareClass.type === 'Common'}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>{shareClass.preferenceType}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Non-Participating">Non-Participating</SelectItem>
                              <SelectItem value="Participating">Participating</SelectItem>
                              <SelectItem value="Participating with Cap">
                                Participating with Cap
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={shareClass.liquidationPreference}
                            onValueChange={(value) =>
                              updateShareClass(shareClass.id, 'liquidationPreference', value)
                            }
                            disabled={shareClass.type === 'Common'}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>{shareClass.liquidationPreference}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1x">1x</SelectItem>
                              <SelectItem value="1.5x">1.5x</SelectItem>
                              <SelectItem value="2x">2x</SelectItem>
                              <SelectItem value="2.5x">2.5x</SelectItem>
                              <SelectItem value="3x">3x</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={shareClass.participationCap || 0}
                            onChange={(e) =>
                              updateShareClass(
                                shareClass.id,
                                'participationCap',
                                Number(e.target.value)
                              )
                            }
                            className="w-full"
                            disabled={
                              shareClass.type === 'Common' ||
                              shareClass.preferenceType !== 'Participating with Cap'
                            }
                            step="0.5"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={shareClass.seniority}
                            onChange={(e) =>
                              updateShareClass(shareClass.id, 'seniority', Number(e.target.value))
                            }
                            className="w-full"
                            min="1"
                            disabled={shareClass.type === 'Common'}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={shareClass.seniorityType}
                            onValueChange={(value: 'Senior' | 'Pari Passu') =>
                              updateShareClass(shareClass.id, 'seniorityType', value)
                            }
                            disabled={shareClass.type === 'Common'}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>{shareClass.seniorityType}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Pari Passu">Pari Passu</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {shareClass.type === 'Preferred' ? (
                            <Badge variant="outline">
                              {payoutOrder[shareClass.id] || '-'}
                              {getOrdinalSuffix(payoutOrder[shareClass.id] || 0)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Last</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Conversion & Ownership Tab */}
              <TabsContent value="conversion" className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Conversion Ratio</TableHead>
                      <TableHead>As-Converted Shares</TableHead>
                      <TableHead>Ownership %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTableData.shareClasses.map((shareClass) => {
                      const asConverted =
                        stats.asConvertedByClass.find((ac) => ac.id === shareClass.id)
                          ?.asConverted || 0
                      const ownership =
                        stats.ownershipByClass.find((o) => o.id === shareClass.id)?.ownership || 0

                      return (
                        <TableRow key={shareClass.id}>
                          <TableCell>{shareClass.name}</TableCell>
                          <TableCell>{shareClass.type}</TableCell>
                          <TableCell>{shareClass.numberOfShares.toLocaleString()}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={shareClass.conversionRatio}
                              onChange={(e) =>
                                updateShareClass(
                                  shareClass.id,
                                  'conversionRatio',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full"
                              step="0.01"
                              disabled={shareClass.type === 'Common'}
                              min="0.01"
                            />
                          </TableCell>
                          <TableCell>{asConverted.toLocaleString()}</TableCell>
                          <TableCell>{ownership.toFixed(2)}%</TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Options row */}
                    {capTableData.options.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>All Option Pools (fully vested)</TableCell>
                        <TableCell>{stats.totalOptions.toLocaleString()}</TableCell>
                        <TableCell>{stats.optionsOwnership.toFixed(2)}%</TableCell>
                      </TableRow>
                    )}

                    {/* Totals row */}
                    <TableRow className="font-medium">
                      <TableCell colSpan={4}>Total Fully Diluted</TableCell>
                      <TableCell>{stats.totalAsConverted.toLocaleString()}</TableCell>
                      <TableCell>100.00%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Dividends Tab */}
              <TabsContent value="dividends" className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Dividends Declared</TableHead>
                      <TableHead>Dividend Rate (%)</TableHead>
                      <TableHead>Dividend Type</TableHead>
                      <TableHead>PIK</TableHead>
                      <TableHead>Years Since Round</TableHead>
                      <TableHead>Total Dividends</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTableData.shareClasses.map((shareClass) => {
                      const investmentAmount =
                        investmentAmounts.find((ia) => ia.id === shareClass.id)?.investmentAmount ||
                        0
                      const totalDividends = calculateDividends(
                        investmentAmount,
                        shareClass.dividendRate,
                        shareClass.dividendType,
                        shareClass.yearsSinceRound || 1
                      )

                      return (
                        <TableRow key={shareClass.id}>
                          <TableCell>{shareClass.name}</TableCell>
                          <TableCell>
                            <Switch
                              checked={shareClass.dividendsDeclared}
                              onCheckedChange={(checked) =>
                                updateShareClass(shareClass.id, 'dividendsDeclared', checked)
                              }
                              disabled={shareClass.type === 'Common'}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={shareClass.dividendRate}
                              onChange={(e) =>
                                updateShareClass(
                                  shareClass.id,
                                  'dividendRate',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full"
                              step="0.1"
                              min="0"
                              max="100"
                              disabled={
                                shareClass.type === 'Common' || !shareClass.dividendsDeclared
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={shareClass.dividendType}
                              onValueChange={(value: 'None' | 'Non-Cumulative' | 'Cumulative') =>
                                updateShareClass(shareClass.id, 'dividendType', value)
                              }
                              disabled={
                                shareClass.type === 'Common' || !shareClass.dividendsDeclared
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue>{shareClass.dividendType}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Non-Cumulative">Non-Cumulative</SelectItem>
                                <SelectItem value="Cumulative">Cumulative</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={shareClass.isPIK}
                              onCheckedChange={(checked) =>
                                updateShareClass(shareClass.id, 'isPIK', checked)
                              }
                              disabled={
                                shareClass.type === 'Common' || !shareClass.dividendsDeclared
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={shareClass.yearsSinceRound || 1}
                              onChange={(e) =>
                                updateShareClass(
                                  shareClass.id,
                                  'yearsSinceRound',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full"
                              min="0"
                              step="0.5"
                              disabled={
                                shareClass.type === 'Common' ||
                                shareClass.dividendType !== 'Cumulative' ||
                                !shareClass.dividendsDeclared
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {shareClass.dividendsDeclared
                              ? `$${totalDividends.toLocaleString()}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Options Section */}
      <Card>
        <CardHeader className="bg-muted/40">
          <div className="flex items-center justify-between">
            <CardTitle>Option Pools</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {capTableData.options.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No option pools added. Click the "Add Option Pool" button above to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Number of Options</TableHead>
                  <TableHead>Strike Price</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>% Vested</TableHead>
                  <TableHead>Vesting Details</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capTableData.options.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell>
                      <Input
                        value={option.name}
                        onChange={(e) => updateOptionPool(option.id, 'name', e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={option.numberOfOptions}
                        onChange={(e) =>
                          updateOptionPool(option.id, 'numberOfOptions', Number(e.target.value))
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={option.strikePrice}
                        onChange={(e) =>
                          updateOptionPool(option.id, 'strikePrice', Number(e.target.value))
                        }
                        className="w-full"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={option.type}
                        onValueChange={(value: 'ISO' | 'NSO') =>
                          updateOptionPool(option.id, 'type', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue>{option.type}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ISO">ISO</SelectItem>
                          <SelectItem value="NSO">NSO</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={option.vestedPercentage}
                        onChange={(e) =>
                          updateOptionPool(option.id, 'vestedPercentage', Number(e.target.value))
                        }
                        className="w-full"
                        min="0"
                        max="100"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={option.vestingDetails}
                        onChange={(e) =>
                          updateOptionPool(option.id, 'vestingDetails', e.target.value)
                        }
                        className="h-[80px] w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => removeOptionPool(option.id)} variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(num: number): string {
  if (!num) return ''

  const j = num % 10
  const k = num % 100

  if (j === 1 && k !== 11) {
    return 'st'
  }
  if (j === 2 && k !== 12) {
    return 'nd'
  }
  if (j === 3 && k !== 13) {
    return 'rd'
  }
  return 'th'
}

// Summary card component for displaying statistics
const SummaryCard = ({ title, value }: { title: string; value: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg bg-muted/30 p-3">
    <div className="text-sm text-muted-foreground">{title}</div>
    <div className="mt-1 text-lg font-semibold">{value}</div>
  </div>
)
