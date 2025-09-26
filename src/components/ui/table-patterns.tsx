import React, { useState, useMemo } from 'react'
import { OptimizedDataTable } from '@/components/ui/optimized-data-table'
import { LoadingSpinner, LoadingTableRow } from '@/components/ui/loading-spinner'
import { TableActionButtons } from '@/components/ui/table-action-buttons'
import { CreateButton, RefreshButton, DownloadButton } from '@/components/ui/action-buttons'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

// Simple Data Table with Card Wrapper
interface SimpleTableProps<T> {
  title?: string
  description?: string
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  className?: string
}

export function SimpleTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  loading = false,
  error,
  emptyMessage = 'No data found',
  className
}: SimpleTableProps<T>) {
  if (loading) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <OptimizedDataTable data={data} columns={columns} />
        )}
      </CardContent>
    </Card>
  )
}

// Data Table with Search and Actions
interface SearchableTableProps<T> {
  title?: string
  description?: string
  data: T[]
  columns: ColumnDef<T>[]
  searchField?: keyof T
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onRefresh?: () => void
  onExport?: () => void
  onCreate?: () => void
  createButtonText?: string
  loading?: boolean
  error?: string
  className?: string
}

export function SearchableTable<T extends Record<string, any>>({
  title,
  description,
  data,
  columns,
  searchField,
  searchPlaceholder = 'Search...',
  onSearch,
  onRefresh,
  onExport,
  onCreate,
  createButtonText = 'Create New',
  loading = false,
  error,
  className
}: SearchableTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = useMemo(() => {
    if (!searchQuery || !searchField) return data

    return data.filter(item => {
      const value = item[searchField]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return false
    })
  }, [data, searchQuery, searchField])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <RefreshButton
                onClick={onRefresh}
                loading={loading}
                variant="outline"
                size="sm"
              />
            )}
            {onExport && (
              <DownloadButton
                onClick={onExport}
                variant="outline"
                size="sm"
              >
                Export
              </DownloadButton>
            )}
            {onCreate && (
              <CreateButton
                onClick={onCreate}
                size="sm"
              >
                {createButtonText}
              </CreateButton>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(searchField || onSearch) && (
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive py-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>{searchQuery ? 'No results found' : 'No data available'}</p>
            {onCreate && !searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onCreate}
              >
                {createButtonText}
              </Button>
            )}
          </div>
        ) : (
          <OptimizedDataTable data={filteredData} columns={columns} />
        )}
      </CardContent>
    </Card>
  )
}

// Status Badge Column Helper
interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    completed: 'default',
    success: 'default',
    pending: 'secondary',
    draft: 'secondary',
    in_progress: 'secondary',
    failed: 'destructive',
    error: 'destructive',
    cancelled: 'destructive',
    archived: 'outline',
    disabled: 'outline'
  }

  return (
    <Badge variant={variant || statusVariants[status.toLowerCase()] || 'default'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

// Common Column Definitions
export const commonColumns = {
  // ID Column
  id: (accessor: string = 'id'): ColumnDef<any> => ({
    accessorKey: accessor,
    header: 'ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue(accessor)}</span>
    )
  }),

  // Name Column
  name: (accessor: string = 'name'): ColumnDef<any> => ({
    accessorKey: accessor,
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue(accessor)}</span>
    )
  }),

  // Email Column
  email: (accessor: string = 'email'): ColumnDef<any> => ({
    accessorKey: accessor,
    header: 'Email',
    cell: ({ row }) => (
      <a
        href={`mailto:${row.getValue(accessor)}`}
        className="text-primary hover:underline"
      >
        {row.getValue(accessor)}
      </a>
    )
  }),

  // Date Column
  date: (accessor: string, label: string = 'Date'): ColumnDef<any> => ({
    accessorKey: accessor,
    header: label,
    cell: ({ row }) => {
      const date = row.getValue(accessor) as string
      return date ? new Date(date).toLocaleDateString() : '-'
    }
  }),

  // Currency Column
  currency: (accessor: string, label: string = 'Amount'): ColumnDef<any> => ({
    accessorKey: accessor,
    header: label,
    cell: ({ row }) => {
      const amount = row.getValue(accessor) as number
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0)
    }
  }),

  // Percentage Column
  percentage: (accessor: string, label: string = 'Percentage'): ColumnDef<any> => ({
    accessorKey: accessor,
    header: label,
    cell: ({ row }) => {
      const value = row.getValue(accessor) as number
      return `${(value * 100).toFixed(2)}%`
    }
  }),

  // Status Column
  status: (accessor: string = 'status'): ColumnDef<any> => ({
    accessorKey: accessor,
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={row.getValue(accessor)} />
    )
  }),

  // Actions Column
  actions: (config: {
    onView?: (item: any) => void
    onEdit?: (item: any) => void
    onDelete?: (item: any) => void
    onDownload?: (item: any) => void
    viewHref?: (item: any) => string
    editHref?: (item: any) => string
  }): ColumnDef<any> => ({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const item = row.original
      return (
        <TableActionButtons
          itemId={item.id}
          viewHref={config.viewHref?.(item)}
          editHref={config.editHref?.(item)}
          onView={config.onView ? () => config.onView!(item) : undefined}
          onEdit={config.onEdit ? () => config.onEdit!(item) : undefined}
          onDelete={config.onDelete ? () => config.onDelete!(item) : undefined}
          onDownload={config.onDownload ? () => config.onDownload!(item) : undefined}
          showView={!!(config.onView || config.viewHref)}
          showEdit={!!(config.onEdit || config.editHref)}
          showDelete={!!config.onDelete}
          showDownload={!!config.onDownload}
        />
      )
    }
  })
}

// Table with Bulk Actions
interface BulkActionTableProps<T> {
  title?: string
  description?: string
  data: T[]
  columns: ColumnDef<T>[]
  onBulkDelete?: (items: T[]) => void
  onBulkExport?: (items: T[]) => void
  loading?: boolean
  error?: string
  className?: string
}

export function BulkActionTable<T extends { id: string | number }>({
  title,
  description,
  data,
  columns,
  onBulkDelete,
  onBulkExport,
  loading = false,
  error,
  className
}: BulkActionTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([])

  const enhancedColumns: ColumnDef<T>[] = useMemo(() => {
    const selectColumn: ColumnDef<T> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={selectedItems.length === data.length}
          onChange={(e) => {
            setSelectedItems(e.target.checked ? data : [])
          }}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedItems.some(item => item.id === row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedItems([...selectedItems, row.original])
            } else {
              setSelectedItems(selectedItems.filter(item => item.id !== row.original.id))
            }
          }}
        />
      )
    }

    return [selectColumn, ...columns]
  }, [columns, data, selectedItems])

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {selectedItems.length > 0 && (
          <div className="mb-4 flex items-center gap-2 p-2 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2 ml-auto">
              {onBulkExport && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onBulkExport(selectedItems)}
                >
                  Export Selected
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onBulkDelete(selectedItems)}
                >
                  Delete Selected
                </Button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive py-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No data available
          </div>
        ) : (
          <OptimizedDataTable data={data} columns={enhancedColumns} />
        )}
      </CardContent>
    </Card>
  )
}