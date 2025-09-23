import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface FinancialItem {
  item: string
  values: number[]
}

interface NormalizedFinancialsProps {
  years: string[]
  incomeStatementItems: FinancialItem[]
  balanceSheetItems: FinancialItem[]
  cashFlowItems: FinancialItem[]
  adjustments: Array<{
    id: string
    description: string
    lineItem: string
    amounts: { [year: string]: number }
  }>
}

export function NormalizedFinancials({
  years,
  incomeStatementItems,
  balanceSheetItems,
  cashFlowItems,
  adjustments,
}: NormalizedFinancialsProps) {
  const [showComparison, setShowComparison] = useState(false)

  const calculateNormalizedValue = (lineItem: string, originalValue: number, yearIndex: number) => {
    const yearAdjustments = adjustments
      .filter((adj) => adj.lineItem === lineItem)
      .reduce((sum, adj) => sum + (adj.amounts[years[yearIndex]] || 0), 0)

    return originalValue + yearAdjustments
  }

  const renderFinancialTable = (items: FinancialItem[], showOriginal: boolean = false) => (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px] bg-muted/50">Line Item</TableHead>
            {years.map((year) => (
              <TableHead key={year} className="min-w-[120px] text-right">
                {year}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.item}>
              <TableCell className="font-medium">{row.item}</TableCell>
              {row.values.map((value, index) => (
                <TableCell key={`${row.item}-${years[index]}`} className="text-right">
                  {(showOriginal
                    ? value
                    : calculateNormalizedValue(row.item, value, index)
                  ).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <Card className="mt-6 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Normalized Financial Statements</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="comparison-mode"
              checked={showComparison}
              onCheckedChange={setShowComparison}
            />
            <Label htmlFor="comparison-mode">Show Raw vs. Normalized</Label>
          </div>
        </div>

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income">Normalized Income Statement</TabsTrigger>
            <TabsTrigger value="balance">Normalized Balance Sheet</TabsTrigger>
            <TabsTrigger value="cashflow">Normalized Cash Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-4">
            {showComparison ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Raw Income Statement</h4>
                  {renderFinancialTable(incomeStatementItems, true)}
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Normalized Income Statement</h4>
                  {renderFinancialTable(incomeStatementItems)}
                </div>
              </div>
            ) : (
              renderFinancialTable(incomeStatementItems)
            )}
          </TabsContent>

          <TabsContent value="balance" className="mt-4">
            {showComparison ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Raw Balance Sheet</h4>
                  {renderFinancialTable(balanceSheetItems, true)}
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Normalized Balance Sheet</h4>
                  {renderFinancialTable(balanceSheetItems)}
                </div>
              </div>
            ) : (
              renderFinancialTable(balanceSheetItems)
            )}
          </TabsContent>

          <TabsContent value="cashflow" className="mt-4">
            {showComparison ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Raw Cash Flow Statement</h4>
                  {renderFinancialTable(cashFlowItems, true)}
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Normalized Cash Flow Statement</h4>
                  {renderFinancialTable(cashFlowItems)}
                </div>
              </div>
            ) : (
              renderFinancialTable(cashFlowItems)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}
