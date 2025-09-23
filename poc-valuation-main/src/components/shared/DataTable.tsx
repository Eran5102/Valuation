import React from 'react'
import { StandardTable, type TableColumn } from './StandardTable'

export type { TableColumn }

interface DataTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  emptyMessage?: string
  footer?: React.ReactNode
  stickyHeader?: boolean
  className?: string
  onRowClick?: (item: T) => void
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data available',
  footer,
  stickyHeader = true,
  className,
  onRowClick,
}: DataTableProps<T>) {
  // This component now acts as a compatibility layer for existing code
  // Just delegating to StandardTable with defaults that match the original behavior
  return (
    <StandardTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      footer={footer}
      stickyHeader={stickyHeader}
      bordered={true}
      highlightOnHover={true}
      className={className}
      onRowClick={onRowClick}
    />
  )
}
