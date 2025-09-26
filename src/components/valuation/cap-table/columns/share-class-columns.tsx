import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit3, Save, Trash2, DollarSign, Calendar } from 'lucide-react'
import { ShareClass } from '../types'
import { formatNumber, formatCurrency } from '@/lib/utils'

export function createShareClassColumns(
  editingRows: Set<string>,
  updateShareClass: (id: string, field: keyof ShareClass, value: any) => void,
  validateSeniority: (newSeniority: number, currentId: string) => boolean,
  toggleRowEdit: (id: string) => void,
  deleteShareClass: (id: string) => void
): ColumnDef<ShareClass>[] {
  return [
    // 1. Type
    {
      id: 'shareType',
      accessorKey: 'shareType',
      header: 'Type',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        if (isEditing) {
          return (
            <Select
              value={shareClass.shareType}
              onValueChange={(value: 'common' | 'preferred') =>
                updateShareClass(shareClass.id, 'shareType', value)
              }
            >
              <SelectTrigger className="w-28 border-primary/20 bg-background focus:border-primary focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-primary/20 bg-card">
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
              </SelectContent>
            </Select>
          )
        }

        return (
          <Badge
            variant={shareClass.shareType === 'preferred' ? 'default' : 'secondary'}
            className={
              shareClass.shareType === 'preferred'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
            }
          >
            {shareClass.shareType === 'common' ? 'Common' : 'Preferred'}
          </Badge>
        )
      },
    },

    // 2. Class Name
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Class Name',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        if (isEditing) {
          return (
            <Input
              defaultValue={shareClass.name}
              onBlur={(e) => updateShareClass(shareClass.id, 'name', e.target.value)}
              className="w-40 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter class name"
            />
          )
        }

        return <span className="font-medium text-foreground">{shareClass.name}</span>
      },
    },

    // 3. Round Date
    {
      id: 'roundDate',
      accessorKey: 'roundDate',
      header: 'Round Date',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        if (isEditing) {
          return (
            <DatePicker
              value={shareClass.roundDate ? new Date(shareClass.roundDate) : undefined}
              onChange={(date) =>
                updateShareClass(
                  shareClass.id,
                  'roundDate',
                  date?.toISOString().split('T')[0] || ''
                )
              }
              className="w-36 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
            />
          )
        }

        return (
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            {new Date(shareClass.roundDate).toLocaleDateString()}
          </div>
        )
      },
    },

    // 4. # Shares
    {
      id: 'sharesOutstanding',
      accessorKey: 'sharesOutstanding',
      header: '# Shares',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        if (isEditing) {
          return (
            <Input
              type="number"
              min="0"
              defaultValue={shareClass.sharesOutstanding}
              onBlur={(e) =>
                updateShareClass(shareClass.id, 'sharesOutstanding', parseInt(e.target.value) || 0)
              }
              className="w-32 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0"
            />
          )
        }

        return <span className="font-medium">{formatNumber(shareClass.sharesOutstanding)}</span>
      },
    },

    // 5. Price/Share
    {
      id: 'pricePerShare',
      accessorKey: 'pricePerShare',
      header: 'Price/Share',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        if (isEditing) {
          return (
            <Input
              type="number"
              step="0.01"
              min="0"
              defaultValue={shareClass.pricePerShare}
              onBlur={(e) =>
                updateShareClass(shareClass.id, 'pricePerShare', parseFloat(e.target.value) || 0)
              }
              className="w-28 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0.00"
            />
          )
        }

        return (
          <div className="flex items-center text-accent">
            <DollarSign className="mr-1 h-4 w-4" />
            <span className="font-medium">{shareClass.pricePerShare.toFixed(2)}</span>
          </div>
        )
      },
    },

    // 6. Amount Invested (calculated)
    {
      id: 'amountInvested',
      accessorKey: 'amountInvested',
      header: 'Amount Invested',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        return (
          <span className="font-medium text-primary">
            {formatCurrency(shareClass.amountInvested || 0)}
          </span>
        )
      },
    },

    // Actions column
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleRowEdit(shareClass.id)}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              {isEditing ? (
                <Save className="h-4 w-4 text-primary" />
              ) : (
                <Edit3 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteShareClass(shareClass.id)}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]
}