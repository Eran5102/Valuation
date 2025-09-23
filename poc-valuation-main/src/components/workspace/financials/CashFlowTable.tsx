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

interface CashFlowTableProps {
  cashFlow: any
  years: string[]
  unitMultiplier?: number
  currency?: string
}

export const CashFlowTable: React.FC<CashFlowTableProps> = ({
  cashFlow,
  years,
  unitMultiplier = 1,
  currency = 'USD',
}) => {
  const rows = [
    { label: 'Operating Activities', isHeader: true },
    { label: 'Net Income', data: cashFlow.netIncome },
    { label: 'Depreciation & Amortization', data: cashFlow.depreciation },
    { label: 'Changes in Working Capital:', isSubheader: true },
    { label: 'Change in Accounts Receivable', data: cashFlow.changeInAccountsReceivable },
    { label: 'Change in Inventory', data: cashFlow.changeInInventory },
    { label: 'Change in Accounts Payable', data: cashFlow.changeInAccountsPayable },
    { label: 'Change in Other Working Capital', data: cashFlow.changeInOtherWorkingCapital },
    {
      label: 'Net Cash from Operating Activities',
      data: cashFlow.netCashFromOperations,
      isBold: true,
    },

    { label: 'Investing Activities', isHeader: true },
    { label: 'Capital Expenditures', data: cashFlow.capitalExpenditures },
    {
      label: 'Net Cash from Investing Activities',
      data: cashFlow.netCashFromInvesting,
      isBold: true,
    },

    { label: 'Financing Activities', isHeader: true },
    { label: 'Net Change in Debt', data: cashFlow.netChangeInDebt },
    { label: 'Dividends Paid', data: cashFlow.dividendsPaid },
    {
      label: 'Net Cash from Financing Activities',
      data: cashFlow.netCashFromFinancing,
      isBold: true,
    },

    { label: 'Net Change in Cash', data: cashFlow.netChangeInCash, isBold: true },
    { label: 'Beginning Cash Balance', data: cashFlow.beginningCashBalance },
    {
      label: 'Ending Cash Balance',
      data: cashFlow.endingCashBalance,
      isBold: true,
      isHighlighted: true,
    },
  ]

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Item</TableHead>
            {years.map((year, index) => (
              <TableHead key={year} className="text-right">
                {year}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => {
            if (row.isHeader) {
              return (
                <TableRow key={`cf-header-${rowIndex}`} className="border-t">
                  <TableCell colSpan={years.length + 1} className="text-lg font-bold">
                    {row.label}
                  </TableCell>
                </TableRow>
              )
            }

            if (row.isSubheader) {
              return (
                <TableRow key={`cf-subheader-${rowIndex}`}>
                  <TableCell colSpan={years.length + 1} className="pl-2 font-semibold">
                    {row.label}
                  </TableCell>
                </TableRow>
              )
            }

            return (
              <TableRow
                key={`cf-row-${rowIndex}`}
                className={row.isHighlighted ? 'bg-muted/30' : ''}
              >
                <TableCell
                  className={cn(
                    row.isBold ? 'font-bold' : '',
                    !row.isSubheader && !row.isHeader ? 'pl-4' : ''
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
        </TableBody>
      </Table>
    </div>
  )
}
