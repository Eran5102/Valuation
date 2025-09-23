import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Filter, Search, SortDesc, Calendar, Plus, X, Info } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn, calculateStatisticalSummary } from '@/lib/utils'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { AddItemForm, FormField } from '@/components/shared/AddItemForm'
import { z } from 'zod'
import { BarChart2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

interface TransactionData {
  id: string
  announcementDate: Date
  targetName: string
  acquirerName: string
  transactionValue: number
  netDebt: number
  ltmRevenue: number
  ltmEbitda: number
  notes: string
  includeInStats: boolean
}

interface SummaryStatistics {
  evToRevenue: {
    mean: number
    median: number
    percentile25: number
    percentile75: number
  }
  evToEbitda: {
    mean: number
    median: number
    percentile25: number
    percentile75: number
  }
}

export default function PrecedentTransactions() {
  const [transactionsData, setTransactionsData] = useState<TransactionData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<
    keyof TransactionData | 'impliedEV' | 'evToRevenue' | 'evToEbitda' | ''
  >('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [summaryStats, setSummaryStats] = useState<SummaryStatistics>({
    evToRevenue: { mean: 0, median: 0, percentile25: 0, percentile75: 0 },
    evToEbitda: { mean: 0, median: 0, percentile25: 0, percentile75: 0 },
  })

  useEffect(() => {
    calculateSummaryStatistics()
  }, [transactionsData])

  const handleAddTransaction = (data: any) => {
    const newTransaction: TransactionData = {
      id: `transaction-${Date.now()}`,
      announcementDate: data.announcementDate,
      targetName: data.targetName,
      acquirerName: data.acquirerName,
      transactionValue: data.transactionValue,
      netDebt: data.netDebt,
      ltmRevenue: data.ltmRevenue,
      ltmEbitda: data.ltmEbitda,
      notes: data.notes || '',
      includeInStats: true,
    }

    setTransactionsData([...transactionsData, newTransaction])
    toast.success(`Added transaction for ${data.targetName}`, {
      description: `${data.targetName} acquired by ${data.acquirerName} has been added.`,
    })
  }

  const handleRemoveTransaction = (id: string) => {
    setTransactionsData(transactionsData.filter((transaction) => transaction.id !== id))
    toast.info(`Removed transaction`, {
      description: `Transaction has been removed from the analysis.`,
    })
  }

  const handleToggleIncludeInStats = (id: string, include: boolean) => {
    setTransactionsData(
      transactionsData.map((transaction) =>
        transaction.id === id ? { ...transaction, includeInStats: include } : transaction
      )
    )
  }

  const calculateSummaryStatistics = () => {
    const includedTransactions = transactionsData.filter((t) => t.includeInStats)

    if (includedTransactions.length === 0) {
      setSummaryStats({
        evToRevenue: { mean: 0, median: 0, percentile25: 0, percentile75: 0 },
        evToEbitda: { mean: 0, median: 0, percentile25: 0, percentile75: 0 },
      })
      return
    }

    const evToRevenueValues: number[] = []
    const evToEbitdaValues: number[] = []

    includedTransactions.forEach((transaction) => {
      const impliedEV = transaction.transactionValue + transaction.netDebt

      if (transaction.ltmRevenue > 0) {
        const evToRevenue = impliedEV / transaction.ltmRevenue
        evToRevenueValues.push(evToRevenue)
      }

      if (transaction.ltmEbitda !== 0) {
        const evToEbitda = impliedEV / transaction.ltmEbitda
        evToEbitdaValues.push(evToEbitda)
      }
    })

    setSummaryStats({
      evToRevenue: calculateStatisticalSummary(evToRevenueValues),
      evToEbitda: calculateStatisticalSummary(evToEbitdaValues),
    })
  }

  const calculateMetrics = (transaction: TransactionData) => {
    const impliedEV = transaction.transactionValue + transaction.netDebt

    const evToRevenue = transaction.ltmRevenue > 0 ? impliedEV / transaction.ltmRevenue : null

    const evToEbitda = transaction.ltmEbitda !== 0 ? impliedEV / transaction.ltmEbitda : null

    return {
      impliedEV,
      evToRevenue,
      evToEbitda,
    }
  }

  const filteredTransactions = transactionsData.filter(
    (transaction) =>
      transaction.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.acquirerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortField) return 0

    if (sortField === 'impliedEV') {
      const impliedEVA = a.transactionValue + a.netDebt
      const impliedEVB = b.transactionValue + b.netDebt
      return sortDirection === 'asc' ? impliedEVA - impliedEVB : impliedEVB - impliedEVA
    }

    if (sortField === 'evToRevenue') {
      const evToRevenueA = a.ltmRevenue > 0 ? (a.transactionValue + a.netDebt) / a.ltmRevenue : 0
      const evToRevenueB = b.ltmRevenue > 0 ? (b.transactionValue + b.netDebt) / b.ltmRevenue : 0
      return sortDirection === 'asc' ? evToRevenueA - evToRevenueB : evToRevenueB - evToRevenueA
    }

    if (sortField === 'evToEbitda') {
      const evToEbitdaA = a.ltmEbitda !== 0 ? (a.transactionValue + a.netDebt) / a.ltmEbitda : 0
      const evToEbitdaB = b.ltmEbitda !== 0 ? (b.transactionValue + b.netDebt) / b.ltmEbitda : 0
      return sortDirection === 'asc' ? evToEbitdaA - evToEbitdaB : evToEbitdaB - evToEbitdaA
    }

    if (sortField === 'announcementDate') {
      return sortDirection === 'asc'
        ? a.announcementDate.getTime() - b.announcementDate.getTime()
        : b.announcementDate.getTime() - a.announcementDate.getTime()
    }

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  // Define the fields for the transaction form
  const transactionFields: FormField[] = [
    {
      name: 'announcementDate',
      label: 'Announcement Date',
      type: 'date',
      required: true,
    },
    {
      name: 'targetName',
      label: 'Target Company Name',
      type: 'text',
      required: true,
    },
    {
      name: 'acquirerName',
      label: 'Acquirer/Buyer Name',
      type: 'text',
      required: true,
    },
    {
      name: 'transactionValue',
      label: 'Transaction Value (Equity Value, $M)',
      type: 'number',
      required: true,
      validator: (schema: any) => schema.positive('Must be a positive value'),
    },
    {
      name: 'netDebt',
      label: 'Target Net Debt at Acquisition ($M)',
      type: 'number',
      required: true,
    },
    {
      name: 'ltmRevenue',
      label: 'Target LTM Revenue at Announcement ($M)',
      type: 'number',
      required: true,
      validator: (schema: any) => schema.positive('Must be a positive value'),
    },
    {
      name: 'ltmEbitda',
      label: 'Target LTM EBITDA at Announcement ($M)',
      type: 'number',
      required: true,
    },
    {
      name: 'notes',
      label: 'Deal Notes/Source',
      type: 'textarea',
      colSpan: 2,
    },
  ]

  return (
    <div className="w-full">
      <PageHeader
        title="Precedent Transactions"
        icon={<BarChart2 className="h-5 w-5" />}
        description="Analyze comparable M&A transactions to derive valuation multiples"
      />

      <div className="px-4 pb-4">
        <p className="mb-4 text-muted-foreground">
          Analyze historical M&A transactions in similar industries to identify applicable valuation
          multiples. Filter by date, size, and transaction type to establish acquisition value
          references.
        </p>
      </div>

      <Card className="mb-6 p-4 md:p-6">
        <AddItemForm
          title="Add Transaction"
          fields={transactionFields}
          onSubmit={handleAddTransaction}
          submitButtonText="Add Transaction"
          secondaryButton={
            <Button type="button" variant="outline" disabled className="text-muted-foreground">
              Fetch Transaction Data from API (Coming Soon)
            </Button>
          }
          columnLayout={3}
        />
      </Card>

      <Card className="mb-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by Target/Buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value: string) => {
                setSortField(
                  value as keyof TransactionData | 'impliedEV' | 'evToRevenue' | 'evToEbitda'
                )
                toggleSortDirection()
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SortDesc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcementDate">Announcement Date</SelectItem>
                <SelectItem value="targetName">Target Name</SelectItem>
                <SelectItem value="acquirerName">Acquirer Name</SelectItem>
                <SelectItem value="transactionValue">Transaction Value</SelectItem>
                <SelectItem value="impliedEV">Enterprise Value</SelectItem>
                <SelectItem value="evToRevenue">EV/Revenue</SelectItem>
                <SelectItem value="evToEbitda">EV/EBITDA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 w-full overflow-hidden">
          <ScrollArea className="w-full">
            <div className="min-w-[1200px]">
              <Table id="precedentTable">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Actions</TableHead>
                    <TableHead>Announce Date</TableHead>
                    <TableHead>Target Company</TableHead>
                    <TableHead>Acquirer/Buyer</TableHead>
                    <TableHead className="text-right">Transaction Value (Equity, $M)</TableHead>
                    <TableHead className="text-right">Net Debt ($M)</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        Implied EV ($M)
                        <Tooltip content="Calculated as Transaction Value + Net Debt">
                          <Info className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">LTM Revenue ($M)</TableHead>
                    <TableHead className="text-right">LTM EBITDA ($M)</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        EV / LTM Revenue
                        <Tooltip content="Calculated as Implied EV / LTM Revenue">
                          <Info className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        EV / LTM EBITDA
                        <Tooltip content="Calculated as Implied EV / LTM EBITDA">
                          <Info className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>Deal Notes/Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-24 text-center">
                        No transactions added yet. Add your first transaction above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedTransactions.map((transaction) => {
                      const { impliedEV, evToRevenue, evToEbitda } = calculateMetrics(transaction)

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleRemoveTransaction(transaction.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`include-${transaction.id}`}
                                  checked={transaction.includeInStats}
                                  onCheckedChange={(checked) =>
                                    handleToggleIncludeInStats(transaction.id, checked as boolean)
                                  }
                                />
                                <label
                                  htmlFor={`include-${transaction.id}`}
                                  className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Include
                                </label>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(transaction.announcementDate, 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{transaction.targetName}</div>
                          </TableCell>
                          <TableCell>{transaction.acquirerName}</TableCell>
                          <TableCell className="text-right">
                            {transaction.transactionValue.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.netDebt.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {impliedEV.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.ltmRevenue.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.ltmEbitda.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            {evToRevenue !== null ? `${evToRevenue.toFixed(1)}x` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {evToEbitda !== null ? `${evToEbitda.toFixed(1)}x` : 'N/A'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
                <TableFooter className="bg-muted/50">
                  <TableRow>
                    <TableCell colSpan={9} className="font-medium">
                      Summary Statistics (Included Transactions Only)
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Mean</div>
                        <div className="font-medium">
                          {summaryStats.evToRevenue.mean > 0
                            ? `${summaryStats.evToRevenue.mean.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Mean</div>
                        <div className="font-medium">
                          {summaryStats.evToEbitda.mean > 0
                            ? `${summaryStats.evToEbitda.mean.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9}></TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Median</div>
                        <div className="font-medium">
                          {summaryStats.evToRevenue.median > 0
                            ? `${summaryStats.evToRevenue.median.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Median</div>
                        <div className="font-medium">
                          {summaryStats.evToEbitda.median > 0
                            ? `${summaryStats.evToEbitda.median.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9}></TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">25th Percentile</div>
                        <div className="font-medium">
                          {summaryStats.evToRevenue.percentile25 > 0
                            ? `${summaryStats.evToRevenue.percentile25.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">25th Percentile</div>
                        <div className="font-medium">
                          {summaryStats.evToEbitda.percentile25 > 0
                            ? `${summaryStats.evToEbitda.percentile25.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9}></TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">75th Percentile</div>
                        <div className="font-medium">
                          {summaryStats.evToRevenue.percentile75 > 0
                            ? `${summaryStats.evToRevenue.percentile75.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">75th Percentile</div>
                        <div className="font-medium">
                          {summaryStats.evToEbitda.percentile75 > 0
                            ? `${summaryStats.evToEbitda.percentile75.toFixed(1)}x`
                            : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Multiple Range Analysis</h2>
          <p className="text-muted-foreground">
            This analysis will be used in the valuation synthesis to generate a valuation range
            based on the selected multiples.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <h3 className="mb-2 text-lg font-medium">EV/Revenue Multiple Range</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">25th Percentile:</span>
                  <Badge variant="outline" className="font-mono">
                    {summaryStats.evToRevenue.percentile25 > 0
                      ? `${summaryStats.evToRevenue.percentile25.toFixed(2)}x`
                      : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median:</span>
                  <Badge variant="secondary" className="font-mono">
                    {summaryStats.evToRevenue.median > 0
                      ? `${summaryStats.evToRevenue.median.toFixed(2)}x`
                      : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">75th Percentile:</span>
                  <Badge variant="outline" className="font-mono">
                    {summaryStats.evToRevenue.percentile75 > 0
                      ? `${summaryStats.evToRevenue.percentile75.toFixed(2)}x`
                      : 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <h3 className="mb-2 text-lg font-medium">EV/EBITDA Multiple Range</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">25th Percentile:</span>
                  <Badge variant="outline" className="font-mono">
                    {summaryStats.evToEbitda.percentile25 > 0
                      ? `${summaryStats.evToEbitda.percentile25.toFixed(2)}x`
                      : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median:</span>
                  <Badge variant="secondary" className="font-mono">
                    {summaryStats.evToEbitda.median > 0
                      ? `${summaryStats.evToEbitda.median.toFixed(2)}x`
                      : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">75th Percentile:</span>
                  <Badge variant="outline" className="font-mono">
                    {summaryStats.evToEbitda.percentile75 > 0
                      ? `${summaryStats.evToEbitda.percentile75.toFixed(2)}x`
                      : 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
