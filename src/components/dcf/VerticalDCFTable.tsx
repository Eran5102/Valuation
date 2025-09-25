'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EditableCell } from '@/components/ui/editable-data-table'
import { cn } from '@/lib/utils'

interface DCFProjectionData {
  revenue: number[]
  ebitda: number[]
  depreciation: number[]
  ebit: number[]
  taxes: number[]
  capex: number[]
  workingCapitalChange: number[]
}

interface DCFResults {
  presentValueOfCashFlows: number
  terminalValue: number
  presentValueOfTerminalValue: number
  enterpriseValue: number
  discountFactors: number[]
  discountedCashFlows: number[]
}

interface VerticalDCFTableProps {
  projections: DCFProjectionData
  results: DCFResults | null
  forecastPeriod: number
  onUpdateProjection: (field: keyof DCFProjectionData, index: number, value: number) => void
  isCalculating?: boolean
  showTerminalYear?: boolean
  terminalYearData?: {
    revenue: number
    ebitda: number
    ebit: number
    nopat: number
    depreciation: number
    capex: number
    changeInNWC: number
    fcf: number
  }
}

interface DCFLineItem {
  id: string
  label: string
  field?: keyof DCFProjectionData
  isCalculated?: boolean
  isSubtotal?: boolean
  isTotal?: boolean
  indent?: number
  showPercentage?: boolean
  calculateValue?: (data: DCFProjectionData, index: number) => number
}

export function VerticalDCFTable({
  projections,
  results,
  forecastPeriod,
  onUpdateProjection,
  isCalculating = false,
  showTerminalYear = true,
  terminalYearData,
}: VerticalDCFTableProps) {
  // Define P&L structure with calculations
  const dcfLineItems: DCFLineItem[] = [
    // Income Statement Section
    { id: 'revenue', label: 'Revenue', field: 'revenue' },
    { id: 'ebitda', label: 'EBITDA', field: 'ebitda', showPercentage: true },
    {
      id: 'depreciation',
      label: 'Less: Depreciation & Amortization',
      field: 'depreciation',
      indent: 1,
    },
    {
      id: 'ebit',
      label: 'EBIT',
      field: 'ebit',
      isSubtotal: true,
      calculateValue: (data, i) => (data.ebitda[i] || 0) - (data.depreciation[i] || 0),
    },
    { id: 'taxes', label: 'Less: Taxes', field: 'taxes', indent: 1 },
    {
      id: 'nopat',
      label: 'NOPAT (Net Operating Profit After Tax)',
      isSubtotal: true,
      calculateValue: (data, i) => (data.ebit[i] || 0) - (data.taxes[i] || 0),
    },

    // Cash Flow Adjustments
    { id: 'separator1', label: 'Cash Flow Adjustments', isSubtotal: true },
    {
      id: 'add_depreciation',
      label: 'Add back: Depreciation & Amortization',
      indent: 1,
      calculateValue: (data, i) => data.depreciation[i] || 0,
    },
    { id: 'capex', label: 'Less: Capital Expenditures', field: 'capex', indent: 1 },
    {
      id: 'nwc_change',
      label: 'Less: Change in Net Working Capital',
      field: 'workingCapitalChange',
      indent: 1,
    },

    // Free Cash Flow
    {
      id: 'fcf',
      label: 'Free Cash Flow',
      isTotal: true,
      calculateValue: (data, i) => {
        const nopat = (data.ebit[i] || 0) - (data.taxes[i] || 0)
        return (
          nopat +
          (data.depreciation[i] || 0) -
          (data.capex[i] || 0) -
          (data.workingCapitalChange[i] || 0)
        )
      },
    },

    // Valuation Section
    { id: 'separator2', label: 'Valuation', isSubtotal: true },
    {
      id: 'discount_factor',
      label: 'Discount Factor',
      indent: 1,
      calculateValue: (data, i) => results?.discountFactors[i] || 0,
    },
    {
      id: 'pv_fcf',
      label: 'Present Value of FCF',
      isTotal: true,
      calculateValue: (data, i) => results?.discountedCashFlows[i] || 0,
    },
  ]

  // Generate year headers
  const years = Array.from({ length: forecastPeriod }, (_, i) => `Year ${i + 1}`)
  if (showTerminalYear) {
    years.push('Terminal')
  }

  // Format currency
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  // Format percentage
  const formatPercentage = (value: number, baseValue: number) => {
    if (!baseValue || baseValue === 0) return ''
    return `${((value / baseValue) * 100).toFixed(1)}%`
  }

  // Render cell content
  const renderCell = (item: DCFLineItem, yearIndex: number) => {
    const isTerminal = showTerminalYear && yearIndex === forecastPeriod
    let value = 0

    // Handle terminal year data
    if (isTerminal && terminalYearData) {
      switch (item.id) {
        case 'revenue':
          value = terminalYearData.revenue
          break
        case 'ebitda':
          value = terminalYearData.ebitda
          break
        case 'ebit':
          value = terminalYearData.ebit
          break
        case 'nopat':
          value = terminalYearData.nopat
          break
        case 'add_depreciation':
          value = terminalYearData.depreciation
          break
        case 'depreciation':
          value = terminalYearData.depreciation
          break
        case 'capex':
          value = terminalYearData.capex
          break
        case 'nwc_change':
          value = terminalYearData.changeInNWC
          break
        case 'fcf':
          value = terminalYearData.fcf
          break
        default:
          if (item.calculateValue && !isTerminal) {
            value = item.calculateValue(projections, yearIndex)
          }
      }
    } else if (!isTerminal) {
      if (item.calculateValue) {
        value = item.calculateValue(projections, yearIndex)
      } else if (item.field) {
        value = projections[item.field][yearIndex] || 0
      }
    }

    // Separator rows
    if (item.id.startsWith('separator')) {
      return (
        <div className="border-t pt-2 text-sm font-medium text-muted-foreground">{item.label}</div>
      )
    }

    // Editable cells (not for terminal year)
    if (item.field && !item.isCalculated && !isTerminal) {
      return (
        <div className="flex items-center justify-between">
          <EditableCell
            value={value}
            onChange={(newValue) => onUpdateProjection(item.field!, yearIndex, newValue)}
            type="currency"
            editable={true}
          />
          {item.showPercentage && (
            <span className="ml-2 text-xs text-muted-foreground">
              {formatPercentage(value, projections.revenue[yearIndex] || 0)}
            </span>
          )}
        </div>
      )
    }

    // Read-only calculated cells
    return (
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'font-mono',
            item.isTotal && 'text-lg font-bold',
            item.isSubtotal && 'font-semibold'
          )}
        >
          {formatCurrency(value)}
        </span>
        {item.showPercentage && (
          <span className="ml-2 text-xs text-muted-foreground">
            {formatPercentage(value, projections.revenue[yearIndex] || 0)}
          </span>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          DCF Cash Flow Model
          {isCalculating && (
            <Badge variant="outline" className="animate-pulse">
              Calculating...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px] p-6">
            {/* Table Header */}
            <div
              className="mb-4 grid gap-2 border-b border-border pb-4"
              style={{
                gridTemplateColumns: `300px repeat(${years.length}, minmax(120px, 1fr))`,
              }}
            >
              <div className="font-semibold">Line Item</div>
              {years.map((year) => (
                <div key={year} className="text-center font-semibold">
                  {year}
                </div>
              ))}
            </div>

            {/* Table Body */}
            <div className="space-y-2">
              {dcfLineItems.map((item) => {
                // Handle separator rows
                if (item.id.startsWith('separator')) {
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[300px_repeat(auto-fit,120px)] gap-2 py-2"
                    >
                      <div className="col-span-full">
                        <div className="border-t pt-2 text-sm font-medium text-muted-foreground">
                          {item.label}
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'grid min-h-[40px] items-center gap-2 py-1.5',
                      item.isTotal && 'rounded-md border bg-muted/50 px-2 py-2',
                      item.isSubtotal && 'rounded-md bg-muted/20 px-2 py-1',
                      'transition-colors hover:bg-muted/30'
                    )}
                    style={{
                      gridTemplateColumns: `300px repeat(${years.length}, minmax(120px, 1fr))`,
                    }}
                  >
                    <div
                      className={cn(
                        'flex items-center',
                        item.indent && `ml-${item.indent * 4}`,
                        item.isTotal && 'font-bold',
                        item.isSubtotal && 'font-semibold'
                      )}
                    >
                      {item.label}
                    </div>
                    {years.map((year, yearIndex) => (
                      <div
                        key={yearIndex}
                        className={cn(
                          'text-right',
                          year === 'Terminal' && 'rounded bg-primary/5 px-2'
                        )}
                      >
                        {renderCell(item, yearIndex)}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Terminal Value Row */}
            {results && (
              <div className="mt-6 border-t pt-4">
                <div className="grid grid-cols-[300px_repeat(auto-fit,120px)] gap-2 rounded-md bg-primary/5 px-2 py-2">
                  <div className="font-bold">Terminal Value (PV)</div>
                  <div className="text-right font-mono text-lg font-bold">
                    {formatCurrency(results.presentValueOfTerminalValue)}
                  </div>
                  <div className="col-span-full"></div>
                </div>

                <div className="mt-2 grid grid-cols-[300px_repeat(auto-fit,120px)] gap-2 rounded-md border-2 border-primary/20 bg-primary/10 px-2 py-2">
                  <div className="text-lg font-bold">Enterprise Value</div>
                  <div className="text-right font-mono text-xl font-bold">
                    {formatCurrency(results.enterpriseValue)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
