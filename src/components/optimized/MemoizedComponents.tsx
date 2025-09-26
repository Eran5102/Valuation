'use client'

import React, { memo } from 'react'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import OptimizedDataTable from '@/components/ui/optimized-data-table'
import { MetricCard } from '@/components/common/SummaryCard'
import type { ColumnDef } from '@tanstack/react-table'

// Memoized DataTable for large datasets
export const MemoizedDataTable = memo(
  function MemoizedDataTable<TData = any, TValue = unknown>({
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
    return <OptimizedDataTable columns={columns} data={data} className={className} {...props} />
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
  function MemoizedEditableDataTable<TData = Record<string, any>, TValue = unknown>({
    columns,
    data,
    onUpdate,
    className,
    tableId = 'memoized-table',
    ...props
  }: {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onUpdate?: (rowIndex: number, field: string, value: any) => void
    className?: string
    tableId?: string
    [key: string]: any
  }) {
    return (
      <EditableDataTable
        tableId={tableId}
        columns={columns as ColumnDef<Record<string, any>>[]}
        data={data as Record<string, any>[]}
        onCellChange={onUpdate}
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
    icon,
    className,
  }: {
    title: string
    value: string | number
    change?: number
    trend?: 'up' | 'down' | 'neutral'
    icon?: React.ComponentType<{ className?: string }>
    className?: string
  }) {
    const trendData = change !== undefined && trend ? {
      direction: trend,
      value: `${change > 0 ? '+' : ''}${change}%`,
      label: undefined
    } : undefined

    return (
      <MetricCard
        title={title}
        value={value}
        trend={trendData}
        icon={icon}
        className={className}
      />
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
