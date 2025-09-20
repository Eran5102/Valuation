import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SimpleColumn<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
}

interface SimpleTableProps<T> {
  data: T[]
  columns: SimpleColumn<T>[]
  onRowAction?: (item: T, actionKey: string) => void
  emptyState?: {
    title: string
    description: string
    action?: React.ReactNode
  }
}

export function SimpleTable<T extends Record<string, any>>({
  data,
  columns,
  onRowAction,
  emptyState,
}: SimpleTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold text-foreground">{emptyState.title}</h3>
          <p className="text-muted-foreground">{emptyState.description}</p>
        </div>
        {emptyState.action}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-foreground"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id || index} className="border-b last:border-b-0 hover:bg-muted/30">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-foreground">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
