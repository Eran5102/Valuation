'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { calculateVirtualItems } from '@/lib/performance-utils'
import { LoadingSpinner } from './loading-spinner'

interface VirtualTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  rowHeight?: number
  containerHeight?: number
  overscan?: number
  loading?: boolean
  className?: string
  onRowClick?: (row: T) => void
  enableSorting?: boolean
  enableFiltering?: boolean
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 600,
  overscan = 3,
  loading = false,
  className,
  onRowClick,
  enableSorting = true,
  enableFiltering = false
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // React Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: enableSorting ? sorting : undefined,
      columnFilters: enableFiltering ? columnFilters : undefined
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined
  })

  const rows = table.getRowModel().rows

  // Calculate visible items
  const virtualItems = useMemo(() => {
    return calculateVirtualItems(rows, {
      itemHeight: rowHeight,
      containerHeight,
      buffer: overscan,
      getScrollTop: () => scrollTop,
      setScrollHeight: () => {} // Not needed for this implementation
    })
  }, [rows, rowHeight, containerHeight, overscan, scrollTop])

  // Handle scroll with throttling
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Use passive listener for better performance
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Total height for virtual scrolling
  const totalHeight = rows.length * rowHeight

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: containerHeight }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto relative", className)}
      style={{ height: containerHeight }}
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "font-medium",
                    header.column.getCanSort() && "cursor-pointer select-none hover:bg-muted/50"
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {header.column.getIsSorted() && (
                    <span className="ml-2">
                      {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {/* Virtual spacer for items above viewport */}
          {virtualItems.offsetY > 0 && (
            <tr>
              <td colSpan={columns.length} style={{ height: virtualItems.offsetY }} />
            </tr>
          )}

          {/* Render visible rows */}
          {virtualItems.visibleItems.map((row) => (
            <TableRow
              key={row.id}
              style={{ height: rowHeight }}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50",
                "transition-colors"
              )}
              onClick={() => onRowClick?.(row.original)}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}

          {/* Virtual spacer for items below viewport */}
          {virtualItems.endIndex < rows.length - 1 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  height: (rows.length - virtualItems.endIndex - 1) * rowHeight
                }}
              />
            </tr>
          )}
        </TableBody>
      </Table>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  )
}

// Memoized version for better performance
export const MemoizedVirtualTable = React.memo(VirtualTable) as typeof VirtualTable