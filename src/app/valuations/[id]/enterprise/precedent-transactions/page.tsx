'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GitBranch,
  Plus,
  Trash2,
  TrendingUp,
  Building2,
  DollarSign,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  FileText,
} from 'lucide-react'
import { useValuationWorkspace } from '@/contexts/ValuationWorkspaceContext'

interface Transaction {
  id: string
  target: string
  acquirer: string
  date: string
  dealValue: number
  revenue: number
  ebitda: number
  evRevenue: number
  evEbitda: number
  dealType: 'Strategic' | 'Financial' | 'Management Buyout'
  industry: string
  selected: boolean
  notes?: string
}

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    target: 'WhatsApp',
    acquirer: 'Facebook',
    date: '2014-02-19',
    dealValue: 19000,
    revenue: 1500,
    ebitda: 450,
    evRevenue: 12.7,
    evEbitda: 42.2,
    dealType: 'Strategic',
    industry: 'Technology',
    selected: true,
    notes: 'Messaging platform acquisition',
  },
  {
    id: '2',
    target: 'LinkedIn',
    acquirer: 'Microsoft',
    date: '2016-06-13',
    dealValue: 26200,
    revenue: 3000,
    ebitda: 750,
    evRevenue: 8.7,
    evEbitda: 34.9,
    dealType: 'Strategic',
    industry: 'Technology',
    selected: true,
    notes: 'Professional network acquisition',
  },
  {
    id: '3',
    target: 'GitHub',
    acquirer: 'Microsoft',
    date: '2018-06-04',
    dealValue: 7500,
    revenue: 300,
    ebitda: 66,
    evRevenue: 25.0,
    evEbitda: 113.6,
    dealType: 'Strategic',
    industry: 'Technology',
    selected: true,
    notes: 'Developer platform acquisition',
  },
  {
    id: '4',
    target: 'Slack',
    acquirer: 'Salesforce',
    date: '2020-12-01',
    dealValue: 27700,
    revenue: 900,
    ebitda: -150,
    evRevenue: 30.8,
    evEbitda: 0,
    dealType: 'Strategic',
    industry: 'Technology',
    selected: false,
    notes: 'Workplace collaboration tool',
  },
  {
    id: '5',
    target: 'Tableau',
    acquirer: 'Salesforce',
    date: '2019-06-10',
    dealValue: 15700,
    revenue: 1200,
    ebitda: 120,
    evRevenue: 13.1,
    evEbitda: 130.8,
    dealType: 'Strategic',
    industry: 'Technology',
    selected: false,
    notes: 'Data visualization platform',
  },
]

export default function PrecedentTransactionsPage() {
  const params = useParams()
  const valuationId = params?.id as string
  const { valuation, updateAssumptions } = useValuationWorkspace()

  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [selectedDealType, setSelectedDealType] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    target: '',
    acquirer: '',
    date: '',
    dealValue: 0,
    revenue: 0,
    ebitda: 0,
    dealType: 'Strategic',
    industry: '',
    notes: '',
  })

  // Calculate statistics for selected transactions
  const selectedTransactions = transactions.filter((t) => t.selected)

  const calculateStats = () => {
    const validTransactions = selectedTransactions.filter((t) => t.evEbitda > 0)

    if (validTransactions.length === 0) {
      return {
        mean: { evRevenue: 0, evEbitda: 0 },
        median: { evRevenue: 0, evEbitda: 0 },
        min: { evRevenue: 0, evEbitda: 0 },
        max: { evRevenue: 0, evEbitda: 0 },
      }
    }

    const metrics = {
      evRevenue: validTransactions.map((t) => t.evRevenue).sort((a, b) => a - b),
      evEbitda: validTransactions
        .map((t) => t.evEbitda)
        .filter((v) => v > 0)
        .sort((a, b) => a - b),
    }

    const getMedian = (arr: number[]) => {
      if (arr.length === 0) return 0
      const mid = Math.floor(arr.length / 2)
      return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
    }

    return {
      mean: {
        evRevenue: metrics.evRevenue.reduce((a, b) => a + b, 0) / metrics.evRevenue.length || 0,
        evEbitda: metrics.evEbitda.reduce((a, b) => a + b, 0) / metrics.evEbitda.length || 0,
      },
      median: {
        evRevenue: getMedian(metrics.evRevenue),
        evEbitda: getMedian(metrics.evEbitda),
      },
      min: {
        evRevenue: Math.min(...metrics.evRevenue) || 0,
        evEbitda: Math.min(...metrics.evEbitda) || 0,
      },
      max: {
        evRevenue: Math.max(...metrics.evRevenue) || 0,
        evEbitda: Math.max(...metrics.evEbitda) || 0,
      },
    }
  }

  const stats = calculateStats()

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.acquirer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = selectedIndustry === 'all' || transaction.industry === selectedIndustry
    const matchesDealType = selectedDealType === 'all' || transaction.dealType === selectedDealType

    let matchesDate = true
    if (dateRange.start) {
      matchesDate = matchesDate && new Date(transaction.date) >= new Date(dateRange.start)
    }
    if (dateRange.end) {
      matchesDate = matchesDate && new Date(transaction.date) <= new Date(dateRange.end)
    }

    return matchesSearch && matchesIndustry && matchesDealType && matchesDate
  })

  const toggleTransactionSelection = (id: string) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)))
  }

  const removeTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const addNewTransaction = () => {
    if (newTransaction.target && newTransaction.acquirer && newTransaction.dealValue) {
      const transaction: Transaction = {
        id: Date.now().toString(),
        target: newTransaction.target!,
        acquirer: newTransaction.acquirer!,
        date: newTransaction.date || new Date().toISOString().split('T')[0],
        dealValue: newTransaction.dealValue || 0,
        revenue: newTransaction.revenue || 0,
        ebitda: newTransaction.ebitda || 0,
        evRevenue: newTransaction.revenue ? newTransaction.dealValue / newTransaction.revenue : 0,
        evEbitda:
          newTransaction.ebitda && newTransaction.ebitda > 0
            ? newTransaction.dealValue / newTransaction.ebitda
            : 0,
        dealType: newTransaction.dealType as Transaction['dealType'],
        industry: newTransaction.industry || 'Other',
        selected: false,
        notes: newTransaction.notes,
      }
      setTransactions((prev) => [...prev, transaction])
      setNewTransaction({})
      setShowAddDialog(false)
    }
  }

  const saveAssumptions = async () => {
    await updateAssumptions({
      precedentTransactions: {
        transactions: transactions,
        selectedMultiples: {
          evRevenue: stats.median.evRevenue,
          evEbitda: stats.median.evEbitda,
        },
      },
    })
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Precedent Transactions</h1>
          <p className="text-muted-foreground">
            Analyze valuation multiples from comparable M&A transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Precedent Transaction</DialogTitle>
                <DialogDescription>
                  Add a new M&A transaction to your comparables analysis
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Target Company</Label>
                    <Input
                      value={newTransaction.target || ''}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, target: e.target.value })
                      }
                      placeholder="WhatsApp"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Acquirer</Label>
                    <Input
                      value={newTransaction.acquirer || ''}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, acquirer: e.target.value })
                      }
                      placeholder="Facebook"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Transaction Date</Label>
                    <Input
                      type="date"
                      value={newTransaction.date || ''}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Deal Type</Label>
                    <Select
                      value={newTransaction.dealType}
                      onValueChange={(value) =>
                        setNewTransaction({
                          ...newTransaction,
                          dealType: value as Transaction['dealType'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strategic">Strategic</SelectItem>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Management Buyout">Management Buyout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Industry</Label>
                    <Select
                      value={newTransaction.industry || ''}
                      onValueChange={(value) =>
                        setNewTransaction({ ...newTransaction, industry: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Consumer">Consumer</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Deal Value ($M)</Label>
                    <Input
                      type="number"
                      value={newTransaction.dealValue || ''}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, dealValue: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Target Revenue ($M)</Label>
                    <Input
                      type="number"
                      value={newTransaction.revenue || ''}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, revenue: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Target EBITDA ($M)</Label>
                    <Input
                      type="number"
                      value={newTransaction.ebitda || ''}
                      onChange={(e) =>
                        setNewTransaction({ ...newTransaction, ebitda: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input
                    value={newTransaction.notes || ''}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, notes: e.target.value })
                    }
                    placeholder="Additional transaction details..."
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={addNewTransaction}>Add Transaction</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={saveAssumptions} variant="default">
            Save Analysis
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Financial">Financial</SelectItem>
                <SelectItem value="Consumer">Consumer</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDealType} onValueChange={setSelectedDealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deal Types</SelectItem>
                <SelectItem value="Strategic">Strategic</SelectItem>
                <SelectItem value="Financial">Financial</SelectItem>
                <SelectItem value="Management Buyout">Management Buyout</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <Input
                type="date"
                placeholder="End date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions Table</TabsTrigger>
          <TabsTrigger value="statistics">Statistical Analysis</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        {/* Transactions Table */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Precedent Transactions</CardTitle>
              <CardDescription>
                Select relevant transactions to include in your valuation analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredTransactions.every((t) => t.selected)}
                        onCheckedChange={(checked) => {
                          setTransactions((prev) =>
                            prev.map((t) => ({
                              ...t,
                              selected: checked as boolean,
                            }))
                          )
                        }}
                      />
                    </TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Acquirer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Deal Value</TableHead>
                    <TableHead className="text-right">EV/Revenue</TableHead>
                    <TableHead className="text-right">EV/EBITDA</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox
                          checked={transaction.selected}
                          onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{transaction.target}</TableCell>
                      <TableCell>{transaction.acquirer}</TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.dealType === 'Strategic' ? 'default' : 'secondary'}
                        >
                          {transaction.dealType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${(transaction.dealValue / 1000).toFixed(1)}B
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.evRevenue.toFixed(1)}x
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.evEbitda > 0 ? `${transaction.evEbitda.toFixed(1)}x` : 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{transaction.notes}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTransactions.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No transactions found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="grid gap-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Statistics are calculated based on {selectedTransactions.length} selected
                transactions
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">EV/Revenue Multiple</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mean:</span>
                    <span className="font-medium">{stats.mean.evRevenue.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Median:</span>
                    <span className="font-medium text-primary">
                      {stats.median.evRevenue.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Range:</span>
                    <span className="font-medium">
                      {stats.min.evRevenue.toFixed(1)}x - {stats.max.evRevenue.toFixed(1)}x
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">EV/EBITDA Multiple</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mean:</span>
                    <span className="font-medium">{stats.mean.evEbitda.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Median:</span>
                    <span className="font-medium text-primary">
                      {stats.median.evEbitda.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Range:</span>
                    <span className="font-medium">
                      {stats.min.evEbitda.toFixed(1)}x - {stats.max.evEbitda.toFixed(1)}x
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Selected Multiples for Valuation</CardTitle>
                <CardDescription>
                  These median multiples will be applied to your subject company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">EV/Revenue Multiple</div>
                    <div className="text-2xl font-bold">{stats.median.evRevenue.toFixed(1)}x</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">EV/EBITDA Multiple</div>
                    <div className="text-2xl font-bold">
                      {stats.median.evEbitda > 0 ? `${stats.median.evEbitda.toFixed(1)}x` : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deal Characteristics */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Characteristics</CardTitle>
                <CardDescription>Summary of selected transaction characteristics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Deal Types</p>
                    {['Strategic', 'Financial', 'Management Buyout'].map((type) => {
                      const count = selectedTransactions.filter((t) => t.dealType === type).length
                      return (
                        <div key={type} className="mb-1 flex justify-between text-sm">
                          <span>{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Time Period</p>
                    {selectedTransactions.length > 0 ? (
                      <>
                        <p className="text-sm">
                          Earliest:{' '}
                          {new Date(
                            Math.min(...selectedTransactions.map((t) => new Date(t.date).getTime()))
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-sm">
                          Latest:{' '}
                          {new Date(
                            Math.max(...selectedTransactions.map((t) => new Date(t.date).getTime()))
                          ).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm">No transactions selected</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Deal Size Range</p>
                    {selectedTransactions.length > 0 ? (
                      <>
                        <p className="text-sm">
                          Min: $
                          {(
                            Math.min(...selectedTransactions.map((t) => t.dealValue)) / 1000
                          ).toFixed(1)}
                          B
                        </p>
                        <p className="text-sm">
                          Max: $
                          {(
                            Math.max(...selectedTransactions.map((t) => t.dealValue)) / 1000
                          ).toFixed(1)}
                          B
                        </p>
                      </>
                    ) : (
                      <p className="text-sm">No transactions selected</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Timeline</CardTitle>
              <CardDescription>Visual timeline of selected M&A transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction, index) => (
                    <div key={transaction.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'h-3 w-3 rounded-full',
                            transaction.dealType === 'Strategic' ? 'bg-primary' : 'bg-secondary'
                          )}
                        />
                        {index < selectedTransactions.length - 1 && (
                          <div className="w-0.5 flex-1 bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {transaction.acquirer} acquires {transaction.target}
                            </p>
                            <div className="mt-1 flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString()}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.dealType}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {transaction.industry}
                              </Badge>
                            </div>
                            {transaction.notes && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {transaction.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              ${(transaction.dealValue / 1000).toFixed(1)}B
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.evRevenue.toFixed(1)}x Revenue
                            </p>
                            {transaction.evEbitda > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {transaction.evEbitda.toFixed(1)}x EBITDA
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {selectedTransactions.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No transactions selected. Select transactions from the table to view the
                    timeline.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function cn(...inputs: (string | boolean | undefined)[]) {
  return inputs.filter(Boolean).join(' ')
}
