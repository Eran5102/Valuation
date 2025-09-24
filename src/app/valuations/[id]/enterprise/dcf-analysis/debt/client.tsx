'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDCFModel } from '@/contexts/DCFModelOptimized'
import { DebtItem as DCFDebtItem, DebtProjection, DebtScheduleData } from '@/types/dcf'
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
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  Save,
  Calculator,
  Calendar,
  Percent,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'

interface DebtItem {
  id: string
  name: string
  type: 'term_loan' | 'revolver' | 'bond' | 'convertible' | 'other'
  principal: number
  interestRate: number
  maturityDate: string
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
  isFixed: boolean
  currentBalance: number
  minimumPayment?: number
  balloonPayment?: number
  prepaymentPenalty?: number
  covenants?: string
}

interface DebtScheduleProjection {
  year: number
  beginningBalance: number
  newDebt: number
  principalPayments: number
  endingBalance: number
  interestExpense: number
  cashInterestPaid: number
  debtServiceCoverageRatio?: number
  averageInterestRate: number
}

interface DebtScheduleClientProps {
  valuationId: string
}

export function DebtScheduleClient({ valuationId }: DebtScheduleClientProps) {
  // Use DCF Model Context
  const {
    debtSchedule,
    assumptions: coreAssumptions,
    updateDebtSchedule,
    saveModel,
    isSaving: contextSaving,
    hasChanges: contextHasChanges,
    recalculateAll,
  } = useDCFModel()

  const [debtItems, setDebtItems] = useState<DebtItem[]>([])
  const [projections, setProjections] = useState<DebtScheduleProjection[]>([])
  const [assumptions, setAssumptions] = useState({
    projectionYears: coreAssumptions?.projectionYears || 5,
    targetDebtToEquity: 0.3,
    minimumCashBalance: coreAssumptions?.cashBalance || 1000000,
    revolvingCreditLimit: 5000000,
    unusedLineFee: 0.5,
    refinancingAssumptions: 'maintain_current',
  })
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Sync with DCF Model Context
  useEffect(() => {
    if (debtSchedule) {
      setDebtItems(
        debtSchedule.items.map((item) => ({
          ...item,
          frequency: 'annual' as const,
          minimumPayment: 0,
          balloonPayment: 0,
          prepaymentPenalty: 0,
          covenants: '',
        }))
      )
      setProjections(
        debtSchedule.projections.map((proj) => ({
          ...proj,
          cashInterestPaid: proj.interestExpense,
          averageInterestRate: (proj.interestExpense / (proj.averageBalance || 1)) * 100,
          debtServiceCoverageRatio: 0,
        }))
      )
    } else {
      loadDebtSchedule()
    }
  }, [debtSchedule])

  // Update assumptions when core assumptions change
  useEffect(() => {
    if (coreAssumptions) {
      setAssumptions((prev) => ({
        ...prev,
        projectionYears: coreAssumptions.projectionYears,
        minimumCashBalance: coreAssumptions.cashBalance,
      }))
    }
  }, [coreAssumptions])

  // Calculate projections when debt items or assumptions change
  useEffect(() => {
    if (debtItems.length > 0) {
      calculateProjections()
    }
  }, [debtItems, assumptions])

  const loadDebtSchedule = async () => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/debt-schedule`)
      if (response.ok) {
        const data = await response.json()
        setDebtItems(data.debtItems || [])
        setAssumptions(data.assumptions || assumptions)
        setProjections(data.projections || [])
      }
    } catch (error) {
      console.error('Error loading debt schedule:', error)
    }
  }

  const calculateProjections = () => {
    const years = assumptions.projectionYears
    const newProjections: DebtScheduleProjection[] = []

    let currentBalance = debtItems.reduce((sum, item) => sum + item.currentBalance, 0)

    for (let year = 1; year <= years; year++) {
      const beginningBalance = currentBalance
      const newDebt = year === 1 ? 0 : beginningBalance * 0.05 // Assume 5% growth in debt needs

      // Calculate principal payments based on maturity and type
      let principalPayments = 0
      let interestExpense = 0

      debtItems.forEach((item) => {
        const maturityYear = new Date(item.maturityDate).getFullYear() - new Date().getFullYear()

        if (maturityYear <= year) {
          // Debt matures this year
          principalPayments += item.currentBalance
        } else if (item.type === 'term_loan') {
          // Amortizing payment
          const remainingYears = maturityYear - year + 1
          principalPayments += item.currentBalance / remainingYears
        }

        // Calculate interest
        const avgBalance = item.currentBalance - principalPayments / 2
        interestExpense += avgBalance * (item.interestRate / 100)
      })

      const endingBalance = beginningBalance + newDebt - principalPayments
      const avgInterestRate = currentBalance > 0 ? (interestExpense / currentBalance) * 100 : 0

      newProjections.push({
        year,
        beginningBalance,
        newDebt,
        principalPayments,
        endingBalance,
        interestExpense,
        cashInterestPaid: interestExpense,
        debtServiceCoverageRatio: 0, // Will be calculated with EBITDA from financials
        averageInterestRate: avgInterestRate,
      })

      currentBalance = endingBalance
    }

    setProjections(newProjections)

    // Update DCF context with new debt schedule
    const updatedSchedule: DebtScheduleData = {
      items: debtItems.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        principal: item.principal,
        interestRate: item.interestRate,
        maturityDate: item.maturityDate,
        currentBalance: item.currentBalance,
        isFixed: item.isFixed,
        mandatory: true,
      })),
      projections: newProjections.map((proj) => ({
        year: proj.year,
        beginningBalance: proj.beginningBalance,
        newDebt: proj.newDebt,
        principalPayments: proj.principalPayments,
        endingBalance: proj.endingBalance,
        interestExpense: proj.interestExpense,
        averageBalance: (proj.beginningBalance + proj.endingBalance) / 2,
      })),
      summary: {
        totalDebt: debtItems.reduce((sum, item) => sum + item.currentBalance, 0),
        weightedAverageRate: calculateWeightedAverageRate(),
        annualInterestExpense: newProjections[0]?.interestExpense || 0,
      },
    }

    updateDebtSchedule(updatedSchedule)
  }

  const calculateWeightedAverageRate = () => {
    const totalDebt = debtItems.reduce((sum, item) => sum + item.currentBalance, 0)
    if (totalDebt === 0) return 0

    return debtItems.reduce((sum, item) => {
      return sum + (item.currentBalance / totalDebt) * item.interestRate
    }, 0)
  }

  const handleAddDebtItem = () => {
    const newItem: DebtItem = {
      id: `debt_${Date.now()}`,
      name: 'New Debt Item',
      type: 'term_loan',
      principal: 0,
      interestRate: 5,
      maturityDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      frequency: 'quarterly',
      isFixed: true,
      currentBalance: 0,
    }
    setDebtItems([...debtItems, newItem])
  }

  const handleDeleteDebtItem = (id: string) => {
    setDebtItems(debtItems.filter((item) => item.id !== id))
  }

  const handleUpdateDebtItem = (id: string, updates: Partial<DebtItem>) => {
    setDebtItems(debtItems.map((item) => (item.id === id ? { ...item, ...updates } : item)))
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

  const debtColumns: ColumnDef<DebtItem>[] = [
    {
      accessorKey: 'name',
      header: 'Debt Item',
      cell: ({ row }) => (
        <Input
          value={row.original.name}
          onChange={(e) => handleUpdateDebtItem(row.original.id, { name: e.target.value })}
          className="min-w-[150px]"
        />
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Select
          value={row.original.type}
          onValueChange={(value) =>
            handleUpdateDebtItem(row.original.id, { type: value as DebtItem['type'] })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="term_loan">Term Loan</SelectItem>
            <SelectItem value="revolver">Revolver</SelectItem>
            <SelectItem value="bond">Bond</SelectItem>
            <SelectItem value="convertible">Convertible</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: 'principal',
      header: 'Original Principal',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            value={row.original.principal}
            onChange={(e) =>
              handleUpdateDebtItem(row.original.id, { principal: parseFloat(e.target.value) || 0 })
            }
            className="w-[120px]"
          />
        </div>
      ),
    },
    {
      accessorKey: 'currentBalance',
      header: 'Current Balance',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            value={row.original.currentBalance}
            onChange={(e) =>
              handleUpdateDebtItem(row.original.id, {
                currentBalance: parseFloat(e.target.value) || 0,
              })
            }
            className="w-[120px]"
          />
        </div>
      ),
    },
    {
      accessorKey: 'interestRate',
      header: 'Interest Rate',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.1"
            value={row.original.interestRate}
            onChange={(e) =>
              handleUpdateDebtItem(row.original.id, {
                interestRate: parseFloat(e.target.value) || 0,
              })
            }
            className="w-[80px]"
          />
          <Percent className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
    },
    {
      accessorKey: 'maturityDate',
      header: 'Maturity Date',
      cell: ({ row }) => (
        <Input
          type="date"
          value={row.original.maturityDate}
          onChange={(e) => handleUpdateDebtItem(row.original.id, { maturityDate: e.target.value })}
          className="w-[140px]"
        />
      ),
    },
    {
      accessorKey: 'frequency',
      header: 'Payment Freq',
      cell: ({ row }) => (
        <Select
          value={row.original.frequency}
          onValueChange={(value) =>
            handleUpdateDebtItem(row.original.id, { frequency: value as DebtItem['frequency'] })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="semi-annual">Semi-Annual</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => handleDeleteDebtItem(row.original.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const projectionColumns: ColumnDef<DebtScheduleProjection>[] = [
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => `Year ${row.original.year}`,
    },
    {
      accessorKey: 'beginningBalance',
      header: 'Beginning Balance',
      cell: ({ row }) => `$${row.original.beginningBalance.toLocaleString()}`,
    },
    {
      accessorKey: 'newDebt',
      header: 'New Debt',
      cell: ({ row }) => `$${row.original.newDebt.toLocaleString()}`,
    },
    {
      accessorKey: 'principalPayments',
      header: 'Principal Payments',
      cell: ({ row }) => `$${row.original.principalPayments.toLocaleString()}`,
    },
    {
      accessorKey: 'endingBalance',
      header: 'Ending Balance',
      cell: ({ row }) => `$${row.original.endingBalance.toLocaleString()}`,
    },
    {
      accessorKey: 'interestExpense',
      header: 'Interest Expense',
      cell: ({ row }) => `$${row.original.interestExpense.toLocaleString()}`,
    },
    {
      accessorKey: 'averageInterestRate',
      header: 'Avg Rate',
      cell: ({ row }) => `${row.original.averageInterestRate.toFixed(2)}%`,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <DollarSign className="h-6 w-6" />
            Debt Schedule
          </h1>
          <p className="mt-1 text-muted-foreground">
            Model debt balances, interest expense, and principal repayments
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

      <Tabs defaultValue="debt-items" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="debt-items">Debt Items</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
        </TabsList>

        <TabsContent value="debt-items" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Debt Obligations</CardTitle>
                  <CardDescription>
                    Enter all outstanding debt instruments and their terms
                  </CardDescription>
                </div>
                <Button onClick={handleAddDebtItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Debt Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {debtItems.length > 0 ? (
                <EditableDataTable columns={debtColumns} data={debtItems} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No debt items added yet. Click "Add Debt Item" to get started.
                  </AlertDescription>
                </Alert>
              )}

              {debtItems.length > 0 && (
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Debt:</span>
                      <p className="text-lg font-semibold">
                        $
                        {debtItems
                          .reduce((sum, item) => sum + item.currentBalance, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Weighted Avg Rate:</span>
                      <p className="text-lg font-semibold">
                        {debtItems.length > 0
                          ? (
                              debtItems.reduce(
                                (sum, item) => sum + item.interestRate * item.currentBalance,
                                0
                              ) / debtItems.reduce((sum, item) => sum + item.currentBalance, 0)
                            ).toFixed(2)
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Year Interest:</span>
                      <p className="text-lg font-semibold">
                        $
                        {debtItems
                          .reduce(
                            (sum, item) => sum + item.currentBalance * (item.interestRate / 100),
                            0
                          )
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debt Projections</CardTitle>
              <CardDescription>
                Projected debt balances and interest expense over the forecast period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projections.length > 0 ? (
                <EditableDataTable columns={projectionColumns} data={projections} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Add debt items to see projections.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debt Management Assumptions</CardTitle>
              <CardDescription>
                Configure how debt will be managed over the projection period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Projection Years</Label>
                  <Input
                    type="number"
                    value={assumptions.projectionYears}
                    onChange={(e) =>
                      setAssumptions({
                        ...assumptions,
                        projectionYears: parseInt(e.target.value) || 5,
                      })
                    }
                    min={1}
                    max={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Debt/Equity Ratio</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={assumptions.targetDebtToEquity}
                    onChange={(e) =>
                      setAssumptions({
                        ...assumptions,
                        targetDebtToEquity: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Cash Balance</Label>
                  <Input
                    type="number"
                    value={assumptions.minimumCashBalance}
                    onChange={(e) =>
                      setAssumptions({
                        ...assumptions,
                        minimumCashBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Revolving Credit Limit</Label>
                  <Input
                    type="number"
                    value={assumptions.revolvingCreditLimit}
                    onChange={(e) =>
                      setAssumptions({
                        ...assumptions,
                        revolvingCreditLimit: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unused Line Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={assumptions.unusedLineFee}
                    onChange={(e) =>
                      setAssumptions({
                        ...assumptions,
                        unusedLineFee: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Refinancing Assumptions</Label>
                  <Select
                    value={assumptions.refinancingAssumptions}
                    onValueChange={(value) =>
                      setAssumptions({
                        ...assumptions,
                        refinancingAssumptions: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintain_current">Maintain Current Terms</SelectItem>
                      <SelectItem value="market_rates">Roll at Market Rates</SelectItem>
                      <SelectItem value="pay_down">Pay Down at Maturity</SelectItem>
                      <SelectItem value="refinance_all">Refinance All Debt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
