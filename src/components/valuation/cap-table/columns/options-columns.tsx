import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Edit3, Save, Trash2 } from 'lucide-react'
import { OptionsWarrants, OptionsType } from '../types'
import { formatNumber } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

export function createOptionsColumns(
  editingRows: Set<string>,
  updateOption: (id: string, field: keyof OptionsWarrants, value: any) => void,
  toggleRowEdit: (id: string) => void,
  deleteOption: (id: string) => void
): ColumnDef<OptionsWarrants>[] {
  return [
    // Type column
    {
      id: 'type',
      accessorKey: 'type',
      header: 'Type',
      size: 120,
      enableSorting: true,
      cell: ({ row }) => {
        const option = row.original
        const isEditing = editingRows.has(option.id)

        if (isEditing) {
          return (
            <select
              defaultValue={option.type}
              onBlur={(e) => updateOption(option.id, 'type', e.target.value as OptionsType)}
              className="w-full rounded border px-2 py-1 text-sm focus:border-primary focus:ring-2 focus:ring-primary/50"
            >
              <option value="Options">Options</option>
              <option value="Warrants">Warrants</option>
              <option value="RSUs">RSUs</option>
            </select>
          )
        }

        return (
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              option.type === 'Options'
                ? 'bg-blue-100 text-blue-800'
                : option.type === 'Warrants'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
            }`}
          >
            {option.type}
          </span>
        )
      },
    },

    // Number of Options column
    {
      id: 'numOptions',
      accessorKey: 'numOptions',
      header: 'Number of Options',
      size: 150,
      enableSorting: true,
      cell: ({ row }) => {
        const option = row.original
        const isEditing = editingRows.has(option.id)

        if (isEditing) {
          return (
            <input
              type="number"
              defaultValue={option.numOptions}
              onBlur={(e) => updateOption(option.id, 'numOptions', parseFloat(e.target.value) || 0)}
              className="w-full rounded border px-2 py-1 text-sm focus:border-primary focus:ring-2 focus:ring-primary/50"
              placeholder="0"
              min="0"
              step="1"
            />
          )
        }

        return <span className="font-medium">{formatNumber(option.numOptions)}</span>
      },
    },

    // Exercise Price column
    {
      id: 'exercisePrice',
      accessorKey: 'exercisePrice',
      header: 'Exercise Price',
      size: 120,
      enableSorting: true,
      cell: ({ row }) => {
        const option = row.original
        const isEditing = editingRows.has(option.id)

        if (isEditing) {
          return (
            <input
              type="number"
              defaultValue={option.exercisePrice}
              onBlur={(e) =>
                updateOption(option.id, 'exercisePrice', parseFloat(e.target.value) || 0)
              }
              className="w-full rounded border px-2 py-1 text-sm focus:border-primary focus:ring-2 focus:ring-primary/50"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          )
        }

        return <span className="font-medium">{formatCurrency(option.exercisePrice)}</span>
      },
    },

    // Actions column
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const option = row.original
        const isEditing = editingRows.has(option.id)

        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => toggleRowEdit(option.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-primary/10"
              title={isEditing ? 'Save' : 'Edit'}
            >
              {isEditing ? (
                <Save className="h-4 w-4 text-green-600" />
              ) : (
                <Edit3 className="h-4 w-4 text-primary" />
              )}
            </Button>
            <Button
              onClick={() => deleteOption(option.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]
}