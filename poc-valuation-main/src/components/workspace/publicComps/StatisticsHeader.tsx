import React from 'react'
import { TableHeader, TableRow, TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'

interface HeaderColumn {
  label: string
  tooltip?: string
}

interface StatisticsHeaderProps {
  columns?: HeaderColumn[] | string[]
  className?: string
  alignRight?: boolean
  showTargetCompany?: boolean
}

export function StatisticsHeader({
  columns = [
    { label: 'Metric', tooltip: 'Statistical measure being reported' },
    { label: 'Mean', tooltip: 'Average of all values' },
    { label: '25th Percentile', tooltip: 'Value below which 25% of observations fall' },
    { label: 'Median', tooltip: 'Middle value (50th percentile)' },
    { label: '75th Percentile', tooltip: 'Value below which 75% of observations fall' },
  ],
  className,
  alignRight = true,
  showTargetCompany = false,
}: StatisticsHeaderProps) {
  // Handle both string[] and HeaderColumn[] types
  const normalizedColumns = columns.map((column) =>
    typeof column === 'string' ? { label: column } : column
  )

  // Insert Target Company column after the metric column if requested
  let displayColumns = [...normalizedColumns]
  if (showTargetCompany) {
    displayColumns = [
      displayColumns[0],
      { label: 'Target Company', tooltip: 'Values for the target company being valued' },
      ...displayColumns.slice(1),
    ]
  }

  return (
    <TableHeader className={cn('bg-muted/20', className)}>
      <TableRow className="border-b border-t">
        {displayColumns.map((column, index) => (
          <TableHead
            key={`stat-header-${index}`}
            className={cn(
              index > 0 && alignRight ? 'text-right' : '',
              index === 0 ? 'min-w-[200px]' : '',
              'py-3'
            )}
          >
            <div
              className={cn(
                'flex items-center',
                index === 0 ? 'justify-start' : 'justify-end gap-1'
              )}
            >
              <span>{column.label}</span>
              {column.tooltip && <InfoTooltip text={column.tooltip} />}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}
