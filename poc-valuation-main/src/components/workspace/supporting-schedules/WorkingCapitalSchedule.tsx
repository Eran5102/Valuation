import React, { useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { formatCurrency, formatNumber } from '@/utils/formatters'

interface WorkingCapitalScheduleProps {
  workingCapitalData: any
  projectionYearLabels: string[]
  forecastPeriod: number
  unitMultiplier: number
  currency: string
  assumptions: any
}

export function WorkingCapitalSchedule({
  workingCapitalData,
  projectionYearLabels,
  forecastPeriod,
  unitMultiplier,
  currency,
  assumptions,
}: WorkingCapitalScheduleProps) {
  useEffect(() => {
    console.log('WorkingCapitalSchedule component received data:', {
      workingCapitalData,
      projectionYearLabels,
      forecastPeriod,
      unitMultiplier,
      currency,
      assumptions,
    })
  }, [
    workingCapitalData,
    projectionYearLabels,
    forecastPeriod,
    unitMultiplier,
    currency,
    assumptions,
  ])

  // Early return with error message if data is missing
  if (
    !workingCapitalData ||
    !workingCapitalData.revenue ||
    workingCapitalData.revenue.length === 0
  ) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-red-500">Data Error</h3>
        <p className="text-muted-foreground">
          Working capital data could not be loaded. Please check your assumptions.
        </p>
      </div>
    )
  }

  // Helper function to get assumption values for all forecast periods
  // This ensures we have values for all years by using the last available value
  const getAssumptionValues = (category: string, key: string): number[] => {
    const values = assumptions[category][key] || []
    const result: number[] = []

    for (let i = 0; i < forecastPeriod; i++) {
      // If we have a value for this period, use it
      // Otherwise use the last available value (or 0 if none available)
      if (i < values.length) {
        result.push(values[i])
      } else if (values.length > 0) {
        // Use the last available value if we've run out
        result.push(values[values.length - 1])
      } else {
        result.push(0)
      }
    }

    return result
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full border-collapse">
        <TableHeader className="bg-muted/20">
          <TableRow>
            <TableHead className="sticky left-0 z-20 min-w-[220px] bg-background text-left font-semibold">
              Description
            </TableHead>
            {projectionYearLabels.slice(0, forecastPeriod).map((label, i) => (
              <TableHead key={i} className="min-w-[120px] text-right font-semibold">
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Key Drivers Section */}
          <TableRow className="bg-muted/10">
            <TableCell colSpan={forecastPeriod + 1} className="font-bold text-primary">
              Working Capital Drivers
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Days Sales Outstanding (DSO)
                <Tooltip content="Average number of days to collect payment">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {getAssumptionValues('balanceSheet', 'Days Sales Outstanding (DSO)').map(
              (value: number, i: number) => (
                <TableCell key={i} className="text-right font-medium">
                  {value.toFixed(1)}
                </TableCell>
              )
            )}
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Days Inventory Held (DIH)
                <Tooltip content="Average number of days inventory is held">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {getAssumptionValues('balanceSheet', 'Days Inventory Held (DIH)').map(
              (value: number, i: number) => (
                <TableCell key={i} className="text-right font-medium">
                  {value.toFixed(1)}
                </TableCell>
              )
            )}
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Days Payable Outstanding (DPO)
                <Tooltip content="Average number of days to pay suppliers">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {getAssumptionValues('balanceSheet', 'Days Payable Outstanding (DPO)').map(
              (value: number, i: number) => (
                <TableCell key={i} className="text-right font-medium">
                  {value.toFixed(1)}
                </TableCell>
              )
            )}
          </TableRow>

          {/* Income Statement Base Values */}
          <TableRow className="bg-muted/10">
            <TableCell colSpan={forecastPeriod + 1} className="font-bold text-primary">
              Base Financial Projections
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">Revenue</TableCell>
            {workingCapitalData.revenue.slice(0, forecastPeriod).map((value: number, i: number) => (
              <TableCell key={i} className="text-right">
                {formatCurrency(value, { unitMultiplier, currency })}
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              Cost of Goods Sold (COGS)
            </TableCell>
            {workingCapitalData.cogs.slice(0, forecastPeriod).map((value: number, i: number) => (
              <TableCell key={i} className="text-right">
                {formatCurrency(value, { unitMultiplier, currency })}
              </TableCell>
            ))}
          </TableRow>

          {/* Current Assets Section */}
          <TableRow className="bg-muted/10">
            <TableCell colSpan={forecastPeriod + 1} className="font-bold text-primary">
              Current Assets
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Accounts Receivable
                <Tooltip content="Revenue × (DSO / 365)">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {workingCapitalData.accountsReceivable
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Inventory
                <Tooltip content="COGS × (DIH / 365)">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {workingCapitalData.inventory
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Prepaid & Other Current Assets
                <Tooltip content="Revenue × (Prepaid & Other % of Sales)">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {workingCapitalData.otherCurrentAssets
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          <TableRow className="bg-muted/5">
            <TableCell className="sticky left-0 z-10 bg-muted/5 font-medium">
              Total Current Assets
            </TableCell>
            {workingCapitalData.totalCurrentAssets
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right font-medium">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          {/* Current Liabilities Section */}
          <TableRow className="bg-muted/10">
            <TableCell colSpan={forecastPeriod + 1} className="font-bold text-primary">
              Current Liabilities
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Accounts Payable
                <Tooltip content="COGS × (DPO / 365)">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {workingCapitalData.accountsPayable
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-medium">
              <div className="flex items-center gap-1">
                Accrued & Other Current Liabilities
                <Tooltip content="Revenue × (Accrued Liabilities % of Sales)">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {workingCapitalData.otherCurrentLiabilities
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          <TableRow className="bg-muted/5">
            <TableCell className="sticky left-0 z-10 bg-muted/5 font-medium">
              Total Current Liabilities
            </TableCell>
            {workingCapitalData.totalCurrentLiabilities
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right font-medium">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          {/* Net Working Capital Section */}
          <TableRow className="bg-muted/10">
            <TableCell colSpan={forecastPeriod + 1} className="font-bold text-primary">
              Working Capital Summary
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="sticky left-0 z-20 bg-background font-semibold">
              Net Working Capital
            </TableCell>
            {workingCapitalData.netWorkingCapital
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right font-medium">
                  {formatCurrency(value, { unitMultiplier, currency })}
                </TableCell>
              ))}
          </TableRow>

          <TableRow className="border-t-2 border-primary/20 bg-primary/5">
            <TableCell className="sticky left-0 z-10 bg-primary/5 font-bold text-primary">
              <div className="flex items-center gap-1">
                Change in Net Working Capital
                <Tooltip content="NWC Current Year - NWC Previous Year (Used in FCF calculation)">
                  <span className="inline-flex">
                    <Info className="h-3.5 w-3.5 cursor-help text-primary" />
                  </span>
                </Tooltip>
              </div>
            </TableCell>
            {workingCapitalData.nwcChange
              .slice(0, forecastPeriod)
              .map((value: number, i: number) => (
                <TableCell key={i} className="text-right font-bold text-primary">
                  {formatCurrency(value, { unitMultiplier, currency })}
                  <Badge
                    className={`ml-2 ${value > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                  >
                    {value > 0 ? 'Cash Use' : 'Cash Source'}
                  </Badge>
                </TableCell>
              ))}
          </TableRow>

          <TableRow className="bg-muted/5">
            <TableCell
              colSpan={forecastPeriod + 1}
              className="pl-4 text-sm italic text-muted-foreground"
            >
              Note: An increase in Net Working Capital represents a cash outflow in the DCF model.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
