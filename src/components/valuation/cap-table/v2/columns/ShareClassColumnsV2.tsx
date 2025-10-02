import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit3, Save, Trash2, DollarSign, Calendar } from 'lucide-react'
import { ShareClass } from '../../types'
import { formatNumber, formatCurrency } from '@/lib/utils'
import {
  EditableInputCell,
  EditableNumberInput,
  EditableCurrencyInput,
  EditablePercentageInput,
} from '../components/EditableInputCell'
import { InlineEditableDatePicker } from '../components/EditableDatePicker'

export function createShareClassColumnsV2(
  editingRows: Set<string>,
  updateShareClass: (id: string, field: keyof ShareClass, value: any) => void,
  toggleRowEdit: (id: string) => void,
  deleteShareClass: (id: string) => void
): ColumnDef<ShareClass>[] {
  return [
    // ACTIONS COLUMN - FIRST POSITION
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleRowEdit(shareClass.id)}
              className="hover:bg-primary/10 h-7 w-7 p-0"
            >
              {isEditing ? (
                <Save className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteShareClass(shareClass.id)}
              className="hover:bg-destructive/10 h-7 w-7 p-0"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        )
      },
    },

    // TYPE
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
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
              </SelectContent>
            </Select>
          )
        }

        return (
          <Badge
            variant={shareClass.shareType === 'preferred' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {shareClass.shareType === 'common' ? 'Common' : 'Preferred'}
          </Badge>
        )
      },
    },

    // CLASS NAME
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
            <EditableInputCell
              value={shareClass.name}
              onChange={(value) => updateShareClass(shareClass.id, 'name', value)}
              className="w-32"
              placeholder="Enter class name"
            />
          )
        }

        return <span className="text-sm font-medium">{shareClass.name}</span>
      },
    },

    // ROUND DATE
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
            <InlineEditableDatePicker
              value={shareClass.roundDate}
              onChange={(value) => updateShareClass(shareClass.id, 'roundDate', value)}
            />
          )
        }

        return (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {shareClass.roundDate ? new Date(shareClass.roundDate).toLocaleDateString() : '-'}
          </div>
        )
      },
    },

    // SHARES OUTSTANDING
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
            <EditableNumberInput
              value={shareClass.sharesOutstanding}
              onChange={(value) => updateShareClass(shareClass.id, 'sharesOutstanding', value)}
              min={0}
              className="w-28"
              placeholder="0"
            />
          )
        }

        return (
          <span className="text-sm font-medium">{formatNumber(shareClass.sharesOutstanding)}</span>
        )
      },
    },

    // PRICE PER SHARE
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
            <EditableCurrencyInput
              value={shareClass.pricePerShare}
              onChange={(value) => updateShareClass(shareClass.id, 'pricePerShare', value)}
              min={0}
              className="w-24"
              placeholder="$0.00"
            />
          )
        }

        return (
          <div className="flex items-center text-sm text-accent">
            <DollarSign className="mr-0.5 h-3 w-3" />
            <span className="font-medium">{shareClass.pricePerShare.toFixed(4)}</span>
          </div>
        )
      },
    },

    // AMOUNT INVESTED (CALCULATED)
    {
      id: 'amountInvested',
      accessorKey: 'amountInvested',
      header: 'Amount Invested',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-sm text-muted-foreground">N/A</span>
        }

        return (
          <span className="text-sm font-medium text-primary">
            {formatCurrency(shareClass.amountInvested || 0)}
          </span>
        )
      },
    },

    // LIQUIDATION PREFERENCE MULTIPLE (Preferred only)
    {
      id: 'lpMultiple',
      accessorKey: 'lpMultiple',
      header: 'LP Multiple',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        if (isEditing) {
          return (
            <EditableNumberInput
              value={shareClass.lpMultiple}
              onChange={(value) => updateShareClass(shareClass.id, 'lpMultiple', value)}
              min={0}
              className="w-20"
              placeholder="1.0"
            />
          )
        }

        return <span className="text-sm">{shareClass.lpMultiple}x</span>
      },
    },

    // PREFERENCE TYPE (Preferred only)
    {
      id: 'preferenceType',
      accessorKey: 'preferenceType',
      header: 'Preference',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        if (isEditing) {
          return (
            <Select
              value={shareClass.preferenceType}
              onValueChange={(value) => updateShareClass(shareClass.id, 'preferenceType', value)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non-participating">Non-Participating</SelectItem>
                <SelectItem value="participating">Participating</SelectItem>
                <SelectItem value="participating-with-cap">Participating w/ Cap</SelectItem>
              </SelectContent>
            </Select>
          )
        }

        const typeMap = {
          'non-participating': 'Non-Part.',
          participating: 'Participating',
          'participating-with-cap': 'Part. w/ Cap',
        }

        return (
          <Badge variant="outline" className="text-xs">
            {typeMap[shareClass.preferenceType] || shareClass.preferenceType}
          </Badge>
        )
      },
    },

    // SENIORITY (Preferred only)
    {
      id: 'seniority',
      accessorKey: 'seniority',
      header: 'Seniority',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        if (isEditing) {
          return (
            <EditableNumberInput
              value={shareClass.seniority}
              onChange={(value) => updateShareClass(shareClass.id, 'seniority', value)}
              min={0}
              className="w-16"
              placeholder="0"
            />
          )
        }

        return <span className="text-sm">{shareClass.seniority}</span>
      },
    },

    // CONVERSION RATIO
    {
      id: 'conversionRatio',
      accessorKey: 'conversionRatio',
      header: 'Conv. Ratio',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)

        if (isEditing) {
          return (
            <EditableNumberInput
              value={shareClass.conversionRatio}
              onChange={(value) => updateShareClass(shareClass.id, 'conversionRatio', value)}
              min={0}
              className="w-20"
              placeholder="1.0"
            />
          )
        }

        return <span className="text-sm">{shareClass.conversionRatio}</span>
      },
    },

    // DIVIDENDS DECLARED
    {
      id: 'dividendsDeclared',
      accessorKey: 'dividendsDeclared',
      header: 'Dividends',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        if (isEditing) {
          return (
            <Switch
              checked={shareClass.dividendsDeclared}
              onCheckedChange={(checked) =>
                updateShareClass(shareClass.id, 'dividendsDeclared', checked)
              }
              className="h-5 w-9"
            />
          )
        }

        return (
          <Badge
            variant={shareClass.dividendsDeclared ? 'default' : 'secondary'}
            className="text-xs"
          >
            {shareClass.dividendsDeclared ? 'Yes' : 'No'}
          </Badge>
        )
      },
    },

    // DIVIDEND RATE (if dividends declared)
    {
      id: 'dividendsRate',
      accessorKey: 'dividendsRate',
      header: 'Div. Rate',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon || !shareClass.dividendsDeclared) {
          return <span className="text-sm text-muted-foreground">-</span>
        }

        if (isEditing && shareClass.dividendsDeclared) {
          return (
            <EditablePercentageInput
              value={shareClass.dividendsRate}
              onChange={(value) => updateShareClass(shareClass.id, 'dividendsRate', value)}
              min={0}
              max={100}
              className="w-20"
              placeholder="0%"
            />
          )
        }

        return <span className="text-sm">{shareClass.dividendsRate || 0}%</span>
      },
    },
  ]
}
