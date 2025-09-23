import React from 'react'
import { StandardTable, TableColumn } from '@/components/shared/StandardTable'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart2, FileBarChart } from 'lucide-react'

interface ValuationMethod {
  name: string
  category: string // e.g. "Public Company Comparables", "Precedent Transactions", etc.
  description?: string // Additional details about the method
  metricName?: string // e.g. "EV/Revenue", "EV/EBITDA", etc.
  metricValue?: number // Subject company's value for the metric
  multipleLow?: number // Low multiple
  multipleHigh?: number // High multiple
  valueLow: number // Low end of valuation range
  valueHigh: number // High end of valuation range
  weight: number // Weight in final valuation (0-100)
  weightedValue: number // Weighted contribution
}

interface SummaryValuationTableProps {
  methods: ValuationMethod[]
  unitMultiplier: number
  currency: string
  valueType: 'EV' | 'EquityV' // Enterprise Value or Equity Value
  showSharePrices?: boolean
  sharesOutstanding?: number
  currentSharePrice?: number
}

export function SummaryValuationTable({
  methods,
  unitMultiplier,
  currency,
  valueType,
  showSharePrices = false,
  sharesOutstanding = 1,
  currentSharePrice,
}: SummaryValuationTableProps) {
  // Group methods by category
  const groupedMethods = methods.reduce(
    (groups, method) => {
      if (!groups[method.category]) {
        groups[method.category] = []
      }
      groups[method.category].push(method)
      return groups
    },
    {} as Record<string, ValuationMethod[]>
  )

  // Calculate total weight and weighted value
  const totalWeight = methods.reduce((sum, method) => sum + method.weight, 0)
  const totalWeightedValue = methods.reduce((sum, method) => sum + method.weightedValue, 0)

  // Calculate implied share price if needed
  const impliedSharePriceLow =
    showSharePrices && sharesOutstanding > 0
      ? methods.reduce((sum, method) => sum + (method.valueLow * method.weight) / 100, 0) /
        sharesOutstanding
      : 0

  const impliedSharePriceHigh =
    showSharePrices && sharesOutstanding > 0
      ? methods.reduce((sum, method) => sum + (method.valueHigh * method.weight) / 100, 0) /
        sharesOutstanding
      : 0

  // Format values based on whether we're showing share prices
  const formatValue = (value: number) => {
    if (showSharePrices && sharesOutstanding > 0) {
      return formatCurrency(value / sharesOutstanding, { unitMultiplier: 1, currency, decimals: 2 })
    }
    return formatCurrency(value, { unitMultiplier, currency })
  }

  // Table columns
  const columns: TableColumn<ValuationMethod>[] = [
    {
      id: 'name',
      header: 'Valuation Method',
      cell: (method) => {
        return (
          <div>
            <div className="font-medium">{method.name}</div>
            {method.description && (
              <div className="text-xs text-muted-foreground">{method.description}</div>
            )}
          </div>
        )
      },
      className: 'min-w-[200px]',
    },
    {
      id: 'metric',
      header: 'Applied Metric',
      cell: (method) => {
        if (!method.metricName) return null

        return (
          <div>
            <div>{method.metricName}</div>
            {method.metricValue && method.multipleLow && method.multipleHigh && (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(method.metricValue, { unitMultiplier, currency })} ×{' '}
                {method.multipleLow.toFixed(2)}x-{method.multipleHigh.toFixed(2)}x
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'range',
      header: showSharePrices ? 'Implied Share Price Range' : `Implied ${valueType} Range`,
      cell: (method) => (
        <div className="flex items-center space-x-1">
          <span>{formatValue(method.valueLow)}</span>
          <span>-</span>
          <span>{formatValue(method.valueHigh)}</span>
        </div>
      ),
      isNumeric: true,
    },
    {
      id: 'weight',
      header: 'Weight',
      cell: (method) => formatPercent(method.weight / 100),
      isNumeric: true,
    },
    {
      id: 'weightedValue',
      header: 'Weighted Value',
      cell: (method) => formatCurrency(method.weightedValue, { unitMultiplier, currency }),
      footer: formatCurrency(totalWeightedValue, { unitMultiplier, currency }),
      isNumeric: true,
    },
  ]

  // Prepare data for display
  const tableData: ValuationMethod[] = []

  // For each category, add a header and then the methods
  Object.entries(groupedMethods).forEach(([category, methods]) => {
    // Add category header
    tableData.push({
      name: category,
      category: '',
      valueLow: 0,
      valueHigh: 0,
      weight: 0,
      weightedValue: 0,
    })

    // Add methods in this category
    methods.forEach((method) => {
      tableData.push(method)
    })
  })

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileBarChart className="h-5 w-5 text-primary" />
            Valuation Summary
          </CardTitle>
          <CardDescription>
            Weighted valuation results across multiple methodologies
          </CardDescription>
        </div>

        {showSharePrices && (
          <div className="flex flex-col items-end space-y-1">
            <Badge variant="outline" className="bg-primary/5 px-3 py-1 text-sm">
              Implied Share Price:{' '}
              {formatCurrency(impliedSharePriceLow, { unitMultiplier: 1, currency })} -{' '}
              {formatCurrency(impliedSharePriceHigh, { unitMultiplier: 1, currency })}
            </Badge>
            {currentSharePrice && (
              <Badge variant="outline" className="bg-red-500/5 text-xs">
                Current Share Price:{' '}
                {formatCurrency(currentSharePrice, { unitMultiplier: 1, currency })}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <StandardTable
          columns={columns}
          data={tableData}
          bordered={true}
          striped={true}
          compact={true}
          emptyMessage="No valuation methods with weights available."
        />

        {totalWeight !== 100 && (
          <div className="mt-2 text-sm text-red-500">
            Note: Total weights should equal 100% for a properly weighted conclusion of value.
            Current total weight: {totalWeight}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}
