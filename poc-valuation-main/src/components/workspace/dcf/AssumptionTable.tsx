import React from 'react'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AssumptionRow } from './AssumptionRow'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface AssumptionTableProps {
  title: string
  yearLabels: string[]
  assumptions: string[]
  values: Record<string, number[]>
  onChange: (label: string, values: number[]) => void
  showTooltips?: boolean
  disabled?: boolean
  showTerminalColumn?: boolean
}

const assumptionTooltips: Record<string, string> = {
  'Sales Growth (%)': 'Year-over-year revenue growth rate',
  'COGS (% of Sales)': 'Cost of goods sold as a percentage of revenue',
  'SG&A (% of Sales)': 'Selling, general & administrative expenses as a percentage of revenue',
  'Depreciation (% of Sales)': 'Depreciation expense as a percentage of revenue',
  'CapEx (% of Sales)': 'Capital expenditure as a percentage of revenue',
  'Days Sales Outstanding (DSO)': 'Average number of days to collect payment after a sale',
  'Days Inventory Held (DIH)': 'Average number of days inventory is held before being sold',
  'Days Payable Outstanding (DPO)': 'Average number of days the company takes to pay suppliers',
  'Prepaid & Other Curr Assets (% Sales)':
    'Prepaid expenses and other current assets as a percentage of revenue',
  'Accrued Liabilities (% Sales)': 'Accrued liabilities as a percentage of revenue',
}

export function AssumptionTable({
  title,
  yearLabels,
  assumptions,
  values,
  onChange,
  showTooltips = false,
  disabled = false,
  showTerminalColumn = true,
}: AssumptionTableProps) {
  // Add safety check for assumptions and values
  if (!assumptions || !values || assumptions.length === 0) {
    console.warn(`AssumptionTable: Missing assumptions or values for ${title}`)
    return (
      <Card className="p-4">
        <h3 className="mb-4 text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground">No assumption data available</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="mb-4 text-lg font-medium">{title}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] text-left font-medium">Assumption</TableHead>
              {yearLabels.map((year, index) => (
                <TableHead key={index} className="w-[120px] text-right font-medium">
                  {year}
                </TableHead>
              ))}
              {showTerminalColumn && (
                <TableHead className="w-[120px] text-right font-medium">Terminal</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assumptions.map((assumption) => (
              <TableRow key={assumption}>
                <TableCell className="flex w-[200px] items-center gap-2 font-medium">
                  {assumption}
                  {showTooltips && assumptionTooltips[assumption] && (
                    <TooltipProvider>
                      <Tooltip content={assumptionTooltips[assumption]}>
                        <span className="cursor-help">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </span>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <AssumptionRow
                  values={values[assumption] || new Array(yearLabels.length).fill(0)}
                  onChange={(newValues) => onChange(assumption, newValues)}
                  total={yearLabels.length}
                  disabled={disabled}
                />
                {/* Terminal year row - showing same value as last year */}
                {showTerminalColumn && (
                  <TableCell className="w-[120px] p-1 text-right">
                    <div className="flex h-8 items-center justify-end text-center">
                      {values[assumption]?.length > 0
                        ? values[assumption][values[assumption].length - 1]
                        : 0}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
