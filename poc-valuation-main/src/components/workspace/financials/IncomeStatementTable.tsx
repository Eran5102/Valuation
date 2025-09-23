import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/utils/formatters'

interface IncomeStatementTableProps {
  incomeStatement: any
  years: string[]
  unitMultiplier?: number
  currency?: string
  showGrowthRates?: boolean
}

export const IncomeStatementTable: React.FC<IncomeStatementTableProps> = ({
  incomeStatement,
  years,
  unitMultiplier = 1,
  currency = 'USD',
  showGrowthRates = false,
}) => {
  // Calculate growth rates if needed
  const calculateGrowth = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0
    return (current - previous) / previous
  }

  const rows = [
    { label: 'Revenue', data: incomeStatement.revenue },
    { label: 'Cost of Goods Sold', data: incomeStatement.cogs, isNegative: true },
    { label: 'Gross Profit', data: incomeStatement.grossProfit, isBold: true },
    { label: 'SG&A Expenses', data: incomeStatement.sgaExpense, isNegative: true },
    { label: 'EBITDA', data: incomeStatement.ebitda, isBold: true },
    { label: 'Depreciation & Amortization', data: incomeStatement.depreciation, isNegative: true },
    { label: 'EBIT', data: incomeStatement.ebit, isBold: true },
    { label: 'Interest Expense', data: incomeStatement.interestExpense, isNegative: true },
    { label: 'EBT', data: incomeStatement.ebt, isBold: true },
    { label: 'Income Taxes', data: incomeStatement.taxes, isNegative: true },
    { label: 'Net Income', data: incomeStatement.netIncome, isBold: true, isHighlighted: true },
  ]

  // Common margin calculations
  const margins = [
    {
      label: 'Gross Margin',
      data: incomeStatement.grossProfit.map(
        (gp: number, i: number) => gp / (incomeStatement.revenue[i] || 1)
      ),
    },
    {
      label: 'EBITDA Margin',
      data: incomeStatement.ebitda.map(
        (ebitda: number, i: number) => ebitda / (incomeStatement.revenue[i] || 1)
      ),
    },
    {
      label: 'EBIT Margin',
      data: incomeStatement.ebit.map(
        (ebit: number, i: number) => ebit / (incomeStatement.revenue[i] || 1)
      ),
    },
    {
      label: 'Net Margin',
      data: incomeStatement.netIncome.map(
        (ni: number, i: number) => ni / (incomeStatement.revenue[i] || 1)
      ),
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
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex} className={row.isHighlighted ? 'bg-muted/30' : ''}>
              <TableCell className={`font-${row.isBold ? 'bold' : 'normal'}`}>
                {row.label}
              </TableCell>
              {row.data.map((value: number, i: number) => {
                const displayValue = row.isNegative ? -value : value
                return (
                  <TableCell key={i} className="text-right">
                    {formatCurrency(displayValue / unitMultiplier, currency)}

                    {showGrowthRates && i > 0 && row.label === 'Revenue' && (
                      <div className="text-xs text-muted-foreground">
                        {formatPercent(
                          calculateGrowth(
                            displayValue,
                            row.isNegative ? -row.data[i - 1] : row.data[i - 1]
                          ),
                          1
                        )}
                      </div>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}

          {/* Margin section */}
          <TableRow className="border-t-2">
            <TableCell colSpan={years.length + 1} className="pt-4 font-bold">
              Margins
            </TableCell>
          </TableRow>

          {margins.map((margin, marginIndex) => (
            <TableRow key={`margin-${marginIndex}`}>
              <TableCell>{margin.label}</TableCell>
              {margin.data.map((value: number, i: number) => (
                <TableCell key={i} className="text-right">
                  {formatPercent(value, 1)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
