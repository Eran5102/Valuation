import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatters'

interface FootballFieldChartProps {
  dcf: any
  settings: any
}

export default function FootballFieldChart({ dcf, settings }: FootballFieldChartProps) {
  // Using a placeholder implementation since this would typically use a chart library
  const unitMultiplier = 1000000 // Default to millions
  const currency = settings?.currency || 'USD'

  const enterpriseValue = dcf?.projections?.totalPV || 0

  // Generate some example comparison valuations
  const comparisons = [
    {
      name: 'DCF Valuation',
      low: enterpriseValue * 0.9,
      high: enterpriseValue * 1.1,
      primary: true,
    },
    { name: 'Comparable Companies', low: enterpriseValue * 0.85, high: enterpriseValue * 1.15 },
    { name: 'Precedent Transactions', low: enterpriseValue * 0.8, high: enterpriseValue * 1.2 },
    { name: 'LBO Analysis', low: enterpriseValue * 0.75, high: enterpriseValue * 1.05 },
  ]

  // Find the overall min and max for scaling
  const minValue = Math.min(...comparisons.map((c) => c.low))
  const maxValue = Math.max(...comparisons.map((c) => c.high))
  const range = maxValue - minValue

  // Function to calculate position percentage
  const getPositionPercentage = (value: number) => {
    return ((value - minValue) / range) * 100
  }

  return (
    <div className="w-full space-y-4">
      <div className="mb-4 text-center text-sm text-muted-foreground">
        Range of valuation outcomes across different methodologies
      </div>

      <div className="relative h-64">
        {/* Horizontal axis */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"></div>

        {/* Value markers */}
        <div className="absolute bottom-4 left-0 text-xs text-gray-500">
          {formatCurrency(minValue, { unitMultiplier, currency })}
        </div>
        <div className="absolute bottom-4 right-0 text-xs text-gray-500">
          {formatCurrency(maxValue, { unitMultiplier, currency })}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform text-xs text-gray-500">
          {formatCurrency((minValue + maxValue) / 2, { unitMultiplier, currency })}
        </div>

        {/* Bars for each valuation method */}
        {comparisons.map((comp, index) => {
          const leftPos = getPositionPercentage(comp.low)
          const width = getPositionPercentage(comp.high) - leftPos

          return (
            <div
              key={index}
              className="absolute flex h-8 items-center"
              style={{
                bottom: 8 + index * 40,
                left: `${leftPos}%`,
                width: `${width}%`,
              }}
            >
              <div
                className={`h-6 w-full rounded-sm ${comp.primary ? 'bg-primary/70' : 'bg-gray-300'}`}
              ></div>
              <div className="absolute -left-4 -translate-x-full transform whitespace-nowrap text-sm">
                {comp.name}
              </div>
              <div className="absolute left-1 text-xs text-white">
                {formatCurrency(comp.low, { unitMultiplier, currency, decimals: 1 })}
              </div>
              <div className="absolute right-1 text-xs text-white">
                {formatCurrency(comp.high, { unitMultiplier, currency, decimals: 1 })}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        This is a simplified football field chart. In a complete implementation, it would use a more
        sophisticated charting library.
      </p>
    </div>
  )
}
