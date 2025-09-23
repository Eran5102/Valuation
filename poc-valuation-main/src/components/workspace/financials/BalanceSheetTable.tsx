import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/lib/utils'

interface BalanceSheetTableProps {
  balanceSheet: any
  years: string[]
  unitMultiplier?: number
  currency?: string
}

export const BalanceSheetTable: React.FC<BalanceSheetTableProps> = ({
  balanceSheet,
  years,
  unitMultiplier = 1,
  currency = 'USD',
}) => {
  const assetRows = [
    { label: 'Assets', isHeader: true },
    { label: 'Current Assets', isSubheader: true },
    { label: 'Cash & Cash Equivalents', data: balanceSheet.cashAndEquivalents },
    { label: 'Accounts Receivable', data: balanceSheet.accountsReceivable },
    { label: 'Inventory', data: balanceSheet.inventory },
    { label: 'Other Current Assets', data: balanceSheet.otherCurrentAssets },
    { label: 'Total Current Assets', data: balanceSheet.totalCurrentAssets, isBold: true },
    { label: 'Non-Current Assets', isSubheader: true },
    { label: 'Property, Plant & Equipment, Net', data: balanceSheet.netPpe },
    { label: 'Goodwill & Intangible Assets', data: balanceSheet.goodwillAndIntangibles },
    { label: 'Other Non-Current Assets', data: balanceSheet.otherNonCurrentAssets },
    { label: 'Total Non-Current Assets', data: balanceSheet.totalNonCurrentAssets, isBold: true },
    { label: 'Total Assets', data: balanceSheet.totalAssets, isBold: true, isHighlighted: true },
  ]

  const liabEquityRows = [
    { label: 'Liabilities & Equity', isHeader: true },
    { label: 'Current Liabilities', isSubheader: true },
    { label: 'Accounts Payable', data: balanceSheet.accountsPayable },
    { label: 'Short-Term Debt', data: balanceSheet.shortTermDebt },
    { label: 'Other Current Liabilities', data: balanceSheet.otherCurrentLiabilities },
    {
      label: 'Total Current Liabilities',
      data: balanceSheet.totalCurrentLiabilities,
      isBold: true,
    },
    { label: 'Non-Current Liabilities', isSubheader: true },
    { label: 'Long-Term Debt', data: balanceSheet.longTermDebt.slice(1) }, // Skip initial value which is prior period
    { label: 'Other Non-Current Liabilities', data: balanceSheet.otherNonCurrentLiabilities },
    {
      label: 'Total Non-Current Liabilities',
      data: balanceSheet.totalNonCurrentLiabilities,
      isBold: true,
    },
    { label: 'Total Liabilities', data: balanceSheet.totalLiabilities, isBold: true },
    { label: 'Equity', isSubheader: true },
    { label: 'Common Stock', data: balanceSheet.commonStock },
    { label: 'Retained Earnings', data: balanceSheet.retainedEarnings.slice(1) }, // Skip initial value
    { label: 'Total Equity', data: balanceSheet.totalEquity, isBold: true },
    {
      label: 'Total Liabilities & Equity',
      data: balanceSheet.totalLiabilities.map(
        (val: number, i: number) => val + balanceSheet.totalEquity[i]
      ),
      isBold: true,
      isHighlighted: true,
    },
  ]

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="sticky left-0 z-20 w-[200px] bg-background">Item</TableHead>
            {years.map((year, index) => (
              <TableHead key={year} className="text-right">
                {year}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Assets Section */}
          {assetRows.map((row, rowIndex) => {
            if (row.isHeader) {
              return (
                <TableRow key={`asset-header-${rowIndex}`}>
                  <TableCell
                    colSpan={years.length + 1}
                    className="sticky left-0 bg-background text-lg font-bold"
                  >
                    {row.label}
                  </TableCell>
                </TableRow>
              )
            }

            if (row.isSubheader) {
              return (
                <TableRow key={`asset-subheader-${rowIndex}`}>
                  <TableCell
                    colSpan={years.length + 1}
                    className="sticky left-0 bg-background pl-2 font-semibold"
                  >
                    {row.label}
                  </TableCell>
                </TableRow>
              )
            }

            return (
              <TableRow
                key={`asset-${rowIndex}`}
                className={row.isHighlighted ? 'bg-muted/30' : ''}
              >
                <TableCell
                  className={cn(
                    row.isBold ? 'font-bold' : '',
                    !row.isSubheader && !row.isHeader ? 'pl-4' : '',
                    'sticky left-0 bg-background'
                  )}
                >
                  {row.label}
                </TableCell>
                {row.data.map((value: number, i: number) => (
                  <TableCell key={i} className="text-right">
                    {formatCurrency(value / unitMultiplier, currency)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}

          {/* Liabilities & Equity Section */}
          <TableRow>
            <TableCell
              colSpan={years.length + 1}
              className="sticky left-0 h-4 bg-background"
            ></TableCell>
          </TableRow>

          {liabEquityRows.map((row, rowIndex) => {
            if (row.isHeader) {
              return (
                <TableRow key={`liab-header-${rowIndex}`}>
                  <TableCell
                    colSpan={years.length + 1}
                    className="sticky left-0 bg-background text-lg font-bold"
                  >
                    {row.label}
                  </TableCell>
                </TableRow>
              )
            }

            if (row.isSubheader) {
              return (
                <TableRow key={`liab-subheader-${rowIndex}`}>
                  <TableCell
                    colSpan={years.length + 1}
                    className="sticky left-0 bg-background pl-2 font-semibold"
                  >
                    {row.label}
                  </TableCell>
                </TableRow>
              )
            }

            return (
              <TableRow key={`liab-${rowIndex}`} className={row.isHighlighted ? 'bg-muted/30' : ''}>
                <TableCell
                  className={cn(
                    row.isBold ? 'font-bold' : '',
                    !row.isSubheader && !row.isHeader ? 'pl-4' : '',
                    'sticky left-0 bg-background'
                  )}
                >
                  {row.label}
                </TableCell>
                {row.data.map((value: number, i: number) => (
                  <TableCell key={i} className="text-right">
                    {formatCurrency(value / unitMultiplier, currency)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}

          {/* Balance Check Row */}
          <TableRow className="border-t-2">
            <TableCell className="sticky left-0 bg-background font-bold">
              Balance Check (Assets - Liab - Equity)
            </TableCell>
            {balanceSheet.balanceCheck.map((value: number, i: number) => {
              const isBalanced = Math.abs(value) < 0.01
              return (
                <TableCell
                  key={i}
                  className={cn(
                    'text-right font-semibold',
                    isBalanced ? 'text-green-600' : 'bg-red-50 text-red-600'
                  )}
                >
                  {formatCurrency(value / unitMultiplier, currency, 2)}
                </TableCell>
              )
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
