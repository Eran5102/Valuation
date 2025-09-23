import React from 'react'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { generateHistoricalFiscalYearLabels } from '@/utils/fiscalYearUtils'

interface DCFHistoricalInputsProps {
  historicals: any
  setHistoricals: (historicals: any) => void
  settings: any
}

export function DCFHistoricalInputs({
  historicals,
  setHistoricals,
  settings,
}: DCFHistoricalInputsProps) {
  const historicalYears = settings.historicalYears || 3
  const fiscalYearLabels = generateHistoricalFiscalYearLabels(
    settings.mostRecentFiscalYearEnd || '2024-12-31',
    historicalYears
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">DCF Historical Inputs</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              {fiscalYearLabels.map((year) => (
                <TableHead key={year}>{year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Revenue</TableCell>
              {Array.from({ length: historicalYears }).map((_, index) => (
                <TableCell key={index}>
                  {formatCurrency(historicals?.revenue?.[index] || 0, { decimals: 0 })}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">EBITDA</TableCell>
              {Array.from({ length: historicalYears }).map((_, index) => (
                <TableCell key={index}>
                  {formatCurrency(historicals?.ebitda?.[index] || 0, { decimals: 0 })}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">EBITDA Margin</TableCell>
              {Array.from({ length: historicalYears }).map((_, index) => {
                const revenue = historicals?.revenue?.[index] || 0
                const ebitda = historicals?.ebitda?.[index] || 0
                const margin = revenue ? ebitda / revenue : 0
                return <TableCell key={index}>{formatPercent(margin)}</TableCell>
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
