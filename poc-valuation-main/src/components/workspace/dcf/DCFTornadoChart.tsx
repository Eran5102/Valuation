import React, { useState } from 'react'
import { formatCurrency } from '@/utils/formatters'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface DCFTornadoChartProps {
  unitMultiplier: number
  currency: string
  baseResult: number
  sensitivityData: {
    labels: string[]
    values: number[]
    baseIndex: number
  }
  paramLabels?: Record<string, string>
  tornadoResults?: Array<{
    variableName: string
    lowOutputValue: number
    highOutputValue: number
    baseOutputValue: number
    swing: number
  }>
}

export function DCFTornadoChart({
  unitMultiplier,
  currency,
  baseResult,
  sensitivityData,
  paramLabels = {},
  tornadoResults,
}: DCFTornadoChartProps) {
  // If we have tornadoResults, use that for the enhanced tornado chart
  if (tornadoResults && tornadoResults.length > 0) {
    return (
      <EnhancedTornadoChart
        unitMultiplier={unitMultiplier}
        currency={currency}
        baseResult={baseResult}
        results={tornadoResults}
      />
    )
  }

  // Otherwise fall back to the original tornado chart implementation
  const { labels, values, baseIndex } = sensitivityData
  const baseValue = values[baseIndex]

  // Calculate deltas from base case
  const deltas = values.map((value) => value - baseValue)

  // Find max absolute delta for scaling
  const maxDelta = Math.max(...deltas.map((d) => Math.abs(d)))

  // Prepare data for visualization
  const barHeight = 40
  const barPadding = 15
  const chartWidth = 1000 // Increased for longer bars
  const chartPadding = 150
  const effectiveWidth = chartWidth - chartPadding * 2

  // Handle edge case of zero maxDelta to avoid division by zero
  const scale = maxDelta === 0 ? 1 : effectiveWidth / maxDelta / 2

  // Chart explanation content
  const chartExplanation =
    'A tornado chart shows how changes in each input parameter affect the valuation result. Longer bars indicate more sensitivity to that parameter.'
  const howToReadExplanation =
    'The center line represents the base case value. Each parameter is varied one at a time while keeping all others constant. The bars show the range of possible valuation outcomes when varying each parameter.'
  const impactExplanation =
    'Red bars show negative impact (decrease in value), while green bars show positive impact (increase in value).'

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1050px]">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">Negative Impact</div>

          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">
              Base Value: {formatCurrency(baseValue, { unitMultiplier, currency })}
            </div>

            <TooltipProvider>
              <Tooltip
                content={
                  <div>
                    <p className="text-sm">{chartExplanation}</p>
                    <p className="mt-2 text-sm">{howToReadExplanation}</p>
                    <p className="mt-2 text-sm">{impactExplanation}</p>
                  </div>
                }
              >
                <button className="inline-flex items-center justify-center text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="text-sm font-medium text-muted-foreground">Positive Impact</div>
        </div>

        <div className="relative w-full">
          {/* Center axis line with label */}
          <div
            className="absolute bottom-0 top-0 border-l border-dashed border-muted-foreground/50"
            style={{
              left: `${chartWidth / 2}px`,
              height: `${(barHeight + barPadding) * labels.length + 30}px`,
            }}
          />

          {/* Base value label at center line */}
          <div
            className="absolute text-xs font-medium text-muted-foreground"
            style={{
              left: `${chartWidth / 2 - 50}px`,
              top: `-20px`,
              width: '100px',
              textAlign: 'center',
            }}
          >
            Base Value
          </div>

          <svg width={chartWidth} height={(barHeight + barPadding) * labels.length + 40}>
            {/* Parameter bars */}
            {labels.map((label, i) => {
              const delta = deltas[i]
              const barWidth = Math.abs(delta) * scale
              const x = delta < 0 ? chartWidth / 2 - barWidth : chartWidth / 2
              const y = i * (barHeight + barPadding) + 10

              // Determine colors based on impact direction
              const fillColor = delta < 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'
              const strokeColor = delta < 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'

              return (
                <g key={i}>
                  {/* Add tooltips to bars */}
                  <title>
                    {`${paramLabels[label] || label}: ${formatCurrency(values[i], { unitMultiplier, currency })}`}
                    {`\nDifference from base: ${delta > 0 ? '+' : ''}${formatCurrency(delta, { unitMultiplier, currency })}`}
                    {`\nChange in value: ${((delta / baseValue) * 100).toFixed(1)}%`}
                  </title>

                  <rect
                    x={x}
                    y={y}
                    width={barWidth || 1} // Ensure at least 1px wide for visibility
                    height={barHeight}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={1}
                    rx={4}
                  />

                  {/* Parameter label */}
                  <text
                    x={delta < 0 ? x - 8 : x + barWidth + 8}
                    y={y + barHeight / 2}
                    textAnchor={delta < 0 ? 'end' : 'start'}
                    alignmentBaseline="middle"
                    className="text-xs font-medium"
                    fill="currentColor"
                  >
                    {paramLabels[label] || label}:{' '}
                    {formatCurrency(values[i], { unitMultiplier, currency })}
                  </text>

                  {/* Parameter delta */}
                  <text
                    x={chartWidth / 2}
                    y={y + barHeight + 5}
                    textAnchor="middle"
                    className="text-xs font-medium"
                    fill="currentColor"
                  >
                    {delta > 0 ? '+' : ''}
                    {formatCurrency(delta, { unitMultiplier, currency })}
                  </text>
                </g>
              )
            })}

            {/* Add a base value marker line */}
            <line
              x1={chartWidth / 2}
              y1={-5}
              x2={chartWidth / 2}
              y2={(barHeight + barPadding) * labels.length}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          </svg>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>How to read this chart:</strong> Longer bars indicate higher sensitivity to that
            parameter. The center line represents the base case value.
          </p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center">
              <div className="mr-1 h-4 w-4 rounded border border-red-500 bg-red-500/50"></div>
              <span>Negative impact (reduces value)</span>
            </div>
            <div className="flex items-center">
              <div className="mr-1 h-4 w-4 rounded border border-green-500 bg-green-500/50"></div>
              <span>Positive impact (increases value)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Tornado Chart component using the more detailed results format
function EnhancedTornadoChart({
  unitMultiplier,
  currency,
  baseResult,
  results,
}: {
  unitMultiplier: number
  currency: string
  baseResult: number
  results: Array<{
    variableName: string
    lowOutputValue: number
    highOutputValue: number
    baseOutputValue: number
    swing: number
  }>
}) {
  // Configuration for visualization
  const barHeight = 40
  const barPadding = 15
  const chartWidth = 1000
  const chartPadding = 150
  const effectiveWidth = chartWidth - chartPadding * 2

  // Calculate the base value (should be same for all results)
  const baseValue = results[0]?.baseOutputValue || baseResult

  // Find min and max values to determine scale
  const allValues = results.flatMap((r) => [r.lowOutputValue, r.highOutputValue])
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const valueRange = maxValue - minValue

  // Calculate scale to fit the chart
  const scale = valueRange === 0 ? 1 : effectiveWidth / valueRange

  // Position for the base value line
  const baseX = chartPadding + (baseValue - minValue) * scale

  // Chart explanation content
  const chartExplanation =
    'A tornado chart shows how changes in each input parameter affect the valuation result. Longer bars indicate more sensitivity to that parameter.'
  const howToReadExplanation =
    'The center line represents the base case value. Each parameter is varied one at a time while keeping all others constant. The bars show the range of possible valuation outcomes when varying each parameter.'
  const impactExplanation =
    'Red bars show negative impact (decrease in value), while green bars show positive impact (increase in value).'

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1050px]">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">Lowest Value</div>

          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">
              Base Value: {formatCurrency(baseResult, { unitMultiplier, currency })}
            </div>

            <TooltipProvider>
              <Tooltip
                content={
                  <div>
                    <p className="text-sm">{chartExplanation}</p>
                    <p className="mt-2 text-sm">{howToReadExplanation}</p>
                    <p className="mt-2 text-sm">{impactExplanation}</p>
                  </div>
                }
              >
                <button className="inline-flex items-center justify-center text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="text-sm font-medium text-muted-foreground">Highest Value</div>
        </div>

        <div className="relative w-full">
          {/* Base value line */}
          <div
            className="absolute bottom-0 top-0 border-l border-dashed border-primary"
            style={{
              left: `${baseX}px`,
              height: `${(barHeight + barPadding) * results.length + 30}px`,
              zIndex: 10,
            }}
          />

          {/* Base value label */}
          <div
            className="absolute text-xs font-medium text-primary"
            style={{
              left: `${baseX - 50}px`,
              top: `-20px`,
              width: '100px',
              textAlign: 'center',
            }}
          >
            Base Value
          </div>

          <svg width={chartWidth} height={(barHeight + barPadding) * results.length + 40}>
            {/* Value scale on top of the chart */}
            <line
              x1={chartPadding}
              y1={0}
              x2={chartWidth - chartPadding}
              y2={0}
              stroke="currentColor"
              strokeWidth={1}
            />

            {/* Scale markers */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const x = chartPadding + effectiveWidth * ratio
              const value = minValue + valueRange * ratio

              return (
                <g key={`scale-${ratio}`}>
                  <line x1={x} y1={-5} x2={x} y2={5} stroke="currentColor" strokeWidth={1} />
                  <text x={x} y={15} textAnchor="middle" className="text-xs" fill="currentColor">
                    {formatCurrency(value, { unitMultiplier, currency })}
                  </text>
                </g>
              )
            })}

            {/* Parameter bars */}
            {results.map((result, i) => {
              const { variableName, lowOutputValue, highOutputValue, baseOutputValue } = result

              // Calculate bar position and dimensions
              const x1 = chartPadding + (lowOutputValue - minValue) * scale
              const x2 = chartPadding + (highOutputValue - minValue) * scale
              const y = i * (barHeight + barPadding) + 30 // Add extra space for the scale on top

              // Determine colors based on impact direction
              // For visualization purposes, consider if the overall effect is positive or negative
              const isPositiveImpact = highOutputValue > lowOutputValue
              const fillColor = isPositiveImpact
                ? 'rgba(34, 197, 94, 0.5)'
                : 'rgba(239, 68, 68, 0.5)'
              const strokeColor = isPositiveImpact ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'

              // For parameters like WACC, a higher value has a negative impact (lower EV)
              // For parameters like growth rate, a higher value has a positive impact (higher EV)

              return (
                <g key={i}>
                  {/* Bar */}
                  <rect
                    x={Math.min(x1, x2)}
                    y={y}
                    width={Math.abs(x2 - x1) || 1} // Ensure at least 1px wide
                    height={barHeight}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={1}
                    rx={4}
                  >
                    {/* Add tooltip */}
                    <title>
                      {`${variableName}`}
                      {`\nLow Value: ${formatCurrency(lowOutputValue, { unitMultiplier, currency })}`}
                      {`\nHigh Value: ${formatCurrency(highOutputValue, { unitMultiplier, currency })}`}
                      {`\nBase Value: ${formatCurrency(baseOutputValue, { unitMultiplier, currency })}`}
                      {`\nRange: ${formatCurrency(Math.abs(highOutputValue - lowOutputValue), { unitMultiplier, currency })}`}
                    </title>
                  </rect>

                  {/* Parameter name */}
                  <text
                    x={chartPadding - 10}
                    y={y + barHeight / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-sm font-medium"
                    fill="currentColor"
                  >
                    {variableName}
                  </text>

                  {/* Value labels at the ends of bars */}
                  <text
                    x={Math.min(x1, x2) - 5}
                    y={y + barHeight / 2}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs"
                    fill="currentColor"
                  >
                    {formatCurrency(Math.min(lowOutputValue, highOutputValue), {
                      unitMultiplier,
                      currency,
                    })}
                  </text>

                  <text
                    x={Math.max(x1, x2) + 5}
                    y={y + barHeight / 2}
                    textAnchor="start"
                    alignmentBaseline="middle"
                    className="text-xs"
                    fill="currentColor"
                  >
                    {formatCurrency(Math.max(lowOutputValue, highOutputValue), {
                      unitMultiplier,
                      currency,
                    })}
                  </text>
                </g>
              )
            })}

            {/* Base value vertical line */}
            <line
              x1={baseX}
              y1={20}
              x2={baseX}
              y2={(barHeight + barPadding) * results.length + 30}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />
          </svg>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>How to read this chart:</strong> Longer bars indicate higher sensitivity to that
            parameter. Variables are sorted by their impact on the valuation (largest impact at
            top).
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <div className="mr-1 h-4 w-4 rounded border border-red-500 bg-red-500/50"></div>
              <span>Parameters with negative correlation (e.g., higher WACC = lower value)</span>
            </div>
            <div className="flex items-center">
              <div className="mr-1 h-4 w-4 rounded border border-green-500 bg-green-500/50"></div>
              <span>Parameters with positive correlation (e.g., higher growth = higher value)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
