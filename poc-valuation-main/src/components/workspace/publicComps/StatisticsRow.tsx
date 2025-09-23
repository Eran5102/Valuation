import React from 'react'
import { TableRow, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface StatisticData {
  mean: number | null
  median: number | null
  percentile25: number | null
  percentile75: number | null
}

interface StatisticsRowProps {
  label: string
  data: StatisticData
  targetValue?: number | null
  format?: (value: number | null) => string
  highlightOutliers?: boolean
  className?: string
  cellClassName?: string
  labelClassName?: string
  valueClassName?: string
  targetClassName?: string
  compact?: boolean
  striped?: boolean
  index?: number
}

export function StatisticsRow({
  label,
  data,
  targetValue,
  format,
  highlightOutliers = false,
  className,
  cellClassName,
  labelClassName,
  valueClassName,
  targetClassName,
  compact = false,
  striped = true,
  index = 0,
}: StatisticsRowProps) {
  const formatter =
    format ||
    ((value: number | null) => {
      if (value === null || value === undefined) return 'N/A'
      return `${value.toFixed(1)}x`
    })

  const isOutlier = (value: number | null, mean: number | null): boolean => {
    if (!highlightOutliers || value === null || mean === null) return false
    // Highlight values that are more than 50% away from the mean
    return Math.abs(value - mean) > mean * 0.5
  }

  const isTargetOutlier = targetValue && data.mean ? isOutlier(targetValue, data.mean) : false

  if (compact) {
    return (
      <TableRow className={cn(striped && index % 2 === 0 ? 'bg-muted/10' : '', className)}>
        <TableCell className={cn('font-medium', labelClassName)}>{label}</TableCell>
        {targetValue !== undefined && (
          <TableCell
            className={cn(
              'text-right',
              cellClassName,
              targetClassName,
              isTargetOutlier ? 'font-semibold text-amber-600' : ''
            )}
          >
            {formatter(targetValue)}
          </TableCell>
        )}
        <TableCell
          className={cn(
            'text-right',
            cellClassName,
            valueClassName,
            isOutlier(data.median, data.mean) ? 'font-semibold text-amber-600' : ''
          )}
        >
          {formatter(data.median)}
        </TableCell>
        <TableCell className={cn('text-right', cellClassName, valueClassName)}>
          {formatter(data.mean)}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow className={cn(striped && index % 2 === 0 ? 'bg-muted/10' : '', className)}>
      <TableCell className={cn('py-4 font-medium', labelClassName)}>{label}</TableCell>
      {targetValue !== undefined && (
        <TableCell
          className={cn(
            'py-4 text-right',
            cellClassName,
            targetClassName,
            isTargetOutlier ? 'font-semibold text-amber-600' : ''
          )}
        >
          {formatter(targetValue)}
        </TableCell>
      )}
      <TableCell className={cn('py-4 text-right', cellClassName, valueClassName)}>
        {formatter(data.mean)}
      </TableCell>
      <TableCell className={cn('py-4 text-right', cellClassName, valueClassName)}>
        {formatter(data.percentile25)}
      </TableCell>
      <TableCell
        className={cn(
          'py-4 text-right',
          cellClassName,
          valueClassName,
          isOutlier(data.median, data.mean) ? 'font-semibold text-amber-600' : ''
        )}
      >
        {formatter(data.median)}
      </TableCell>
      <TableCell className={cn('py-4 text-right', cellClassName, valueClassName)}>
        {formatter(data.percentile75)}
      </TableCell>
    </TableRow>
  )
}
