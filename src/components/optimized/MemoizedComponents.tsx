'use client'

import React, { memo } from 'react'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'

// Memoized DataTable for large datasets
export const MemoizedDataTable = memo(
  function MemoizedDataTable<TData, TValue>({
    columns,
    data,
    className,
    ...props
  }: {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    className?: string
    [key: string]: any
  }) {
    return <DataTable columns={columns} data={data} className={className} {...props} />
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if data or columns change
    return (
      prevProps.data === nextProps.data &&
      prevProps.columns === nextProps.columns &&
      prevProps.className === nextProps.className
    )
  }
)

// Memoized EditableDataTable for editable tables
export const MemoizedEditableDataTable = memo(
  function MemoizedEditableDataTable<TData, TValue>({
    columns,
    data,
    onUpdate,
    className,
    ...props
  }: {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onUpdate?: (rowIndex: number, field: string, value: any) => void
    className?: string
    [key: string]: any
  }) {
    return (
      <EditableDataTable
        columns={columns}
        data={data}
        onUpdate={onUpdate}
        className={className}
        {...props}
      />
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if data, columns, or onUpdate changes
    return (
      prevProps.data === nextProps.data &&
      prevProps.columns === nextProps.columns &&
      prevProps.onUpdate === nextProps.onUpdate
    )
  }
)

// Memoized Chart wrapper for expensive chart renders
export const MemoizedChart = memo(
  function MemoizedChart({
    children,
    data,
    ...props
  }: {
    children: React.ReactNode
    data: any[]
    [key: string]: any
  }) {
    return <div {...props}>{children}</div>
  },
  (prevProps, nextProps) => {
    // Only re-render if data changes
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  }
)

// Memoized Heavy Calculation Display
export const MemoizedCalculation = memo(
  function MemoizedCalculation({
    value,
    formatter,
    className,
  }: {
    value: number | string
    formatter?: (value: any) => string
    className?: string
  }) {
    const displayValue = formatter ? formatter(value) : value
    return <div className={className}>{displayValue}</div>
  },
  (prevProps, nextProps) => {
    // Only re-render if value changes
    return prevProps.value === nextProps.value
  }
)

// Memoized Financial Metric Card
export const MemoizedMetricCard = memo(
  function MemoizedMetricCard({
    title,
    value,
    change,
    trend,
    icon: Icon,
    className,
  }: {
    title: string
    value: string | number
    change?: number
    trend?: 'up' | 'down' | 'neutral'
    icon?: React.ComponentType<{ className?: string }>
    className?: string
  }) {
    return (
      <div className={`rounded-lg border bg-card p-6 ${className || ''}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p
                className={`text-sm ${
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change}%
              </p>
            )}
          </div>
          {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if value or change updates
    return (
      prevProps.value === nextProps.value &&
      prevProps.change === nextProps.change &&
      prevProps.title === nextProps.title
    )
  }
)

// Export a hook for using memoized calculations
export function useMemoizedValue<T>(computeFn: () => T, deps: React.DependencyList): T {
  return React.useMemo(computeFn, deps)
}

// Export a hook for expensive string formatting
export function useMemoizedFormat(
  value: number | string,
  formatter: (value: any) => string,
  deps: React.DependencyList = [value]
): string {
  return React.useMemo(() => formatter(value), deps)
}
