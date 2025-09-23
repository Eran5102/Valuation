import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface TableColumn<T> {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
  headerClassName?: string
  cellClassName?: string
  isNumeric?: boolean
  tooltip?: string
  sticky?: boolean
  footer?: string | React.ReactNode
}

interface StandardTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  emptyMessage?: string
  footer?: React.ReactNode
  stickyHeader?: boolean
  bordered?: boolean
  striped?: boolean
  highlightOnHover?: boolean
  compact?: boolean
  className?: string
  headerClassName?: string
  bodyClassName?: string
  rowClassName?: string
  onRowClick?: (item: T) => void
}

export function StandardTable<T>({
  columns,
  data,
  emptyMessage = 'No data available',
  footer,
  stickyHeader = true,
  bordered = true,
  striped = false,
  highlightOnHover = true,
  compact = false,
  className,
  headerClassName,
  bodyClassName,
  rowClassName,
  onRowClick,
}: StandardTableProps<T>) {
  return (
    <div className={cn('w-full', className)}>
      <Table>
        <TableHeader
          className={cn({ 'sticky top-0 z-10 bg-background': stickyHeader }, headerClassName)}
        >
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  column.isNumeric && 'text-right',
                  column.sticky && 'sticky left-0 z-20 bg-background',
                  compact && 'py-2',
                  column.headerClassName,
                  column.className
                )}
              >
                <div
                  className={cn(
                    'flex',
                    column.isNumeric ? 'justify-end' : 'justify-start',
                    'items-center'
                  )}
                >
                  {column.header}
                  {column.tooltip && (
                    <TooltipProvider>
                      <Tooltip content={column.tooltip}>
                        <Info className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className={bodyClassName}>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, rowIndex) => (
              <TableRow
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  onRowClick ? 'cursor-pointer' : undefined,
                  striped && rowIndex % 2 === 1 ? 'bg-muted/30' : '',
                  highlightOnHover ? 'hover:bg-muted/50' : '',
                  rowClassName
                )}
              >
                {columns.map((column) => (
                  <TableCell
                    key={`${rowIndex}-${column.id}`}
                    className={cn(
                      column.isNumeric && 'text-right',
                      column.sticky && 'sticky left-0 z-20 bg-background',
                      compact && 'py-2',
                      column.cellClassName,
                      column.className
                    )}
                  >
                    {column.cell
                      ? column.cell(item)
                      : column.accessorKey
                        ? (item[column.accessorKey] as React.ReactNode)
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        {(footer || columns.some((col) => col.footer)) && (
          <TableFooter>
            {footer || (
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={`footer-${column.id}`}
                    className={cn(
                      column.isNumeric && 'text-right',
                      column.sticky && 'sticky left-0 z-20 bg-background',
                      column.className
                    )}
                  >
                    {column.footer}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableFooter>
        )}
      </Table>
    </div>
  )
}
