'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { ShareClass, OptionsWarrants, OptionsType } from '@/types'
import dynamic from 'next/dynamic'

const OptimizedDataTable = dynamic(
  () =>
    import('@/components/ui/optimized-data-table').then((mod) => ({
      default: mod.OptimizedDataTable,
    })),
  {
    loading: () => <LoadingSpinner size="md" className="p-4" />,
    ssr: false,
  }
)
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Edit3, Edit, Check, Save, Trash2, Plus, DollarSign, Calendar } from 'lucide-react'
import {
  formatNumber,
  formatPercentage,
  enhanceShareClassesWithCalculations,
} from '@/lib/capTableCalculations'
import { formatCurrency } from '@/lib/utils'

interface CapTableProps {
  valuationId: string
  onSave?: (data: { shareClasses: ShareClass[]; options: OptionsWarrants[] }) => void
}

export function ImprovedCapTable({ valuationId, onSave }: CapTableProps) {
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([])
  const [options, setOptions] = useState<OptionsWarrants[]>([])
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set())
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load cap table data
  useEffect(() => {
    const loadCapTableData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/valuations/${valuationId}/cap-table`)
        if (response.ok) {
          const data = await response.json()
          const enhancedShareClasses = enhanceShareClassesWithCalculations(data.shareClasses || [])
          setShareClasses(enhancedShareClasses)
          setOptions(data.options || [])
        }
      } catch (error) {
        console.error('Error loading cap table data:', error)
        setSaveError('Failed to load cap table data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCapTableData()
  }, [valuationId])

  // Save cap table data
  const saveCapTable = useCallback(async () => {
    if (!hasChanges || isSaving) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/valuations/${valuationId}/cap-table`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareClasses, options }),
      })

      if (response.ok) {
        setHasChanges(false)
        onSave?.({ shareClasses, options })
      } else {
        const error = await response.json()
        setSaveError(error.message || 'Failed to save cap table')
      }
    } catch (error) {
      console.error('Error saving cap table:', error)
      setSaveError('Network error: Failed to save cap table')
    } finally {
      setIsSaving(false)
    }
  }, [valuationId, shareClasses, options, hasChanges, onSave, isSaving])

  // Auto-save with debouncing
  useEffect(() => {
    if (!hasChanges) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (2 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      saveCapTable()
    }, 2000)

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [hasChanges, saveCapTable])

  // Update share class on blur (when user leaves the field)
  const updateShareClass = useCallback(
    (id: string, field: keyof ShareClass, value: any) => {
      // Validation for share type changes
      if (field === 'shareType' && value === 'common') {
        const hasOtherCommon = shareClasses.some((sc) => sc.shareType === 'common' && sc.id !== id)
        if (hasOtherCommon) {
          alert('Only one common share class is allowed')
          return
        }
      }

      // Additional validation for numeric fields
      if (field === 'sharesOutstanding' && value < 0) {
        alert('Shares outstanding cannot be negative')
        return
      }
      if (field === 'pricePerShare' && value < 0) {
        alert('Price per share cannot be negative')
        return
      }
      if (field === 'lpMultiple' && value <= 0) {
        alert('Liquidation preference multiple must be greater than 0')
        return
      }
      if (field === 'conversionRatio' && value <= 0) {
        alert('Conversion ratio must be greater than 0')
        return
      }
      if (field === 'dividendsRate' && (value < 0 || value > 100)) {
        alert('Dividend rate must be between 0 and 100')
        return
      }

      setHasChanges(true)

      // Update state and run calculations immediately on blur
      setShareClasses((prev) => {
        const updated = prev.map((sc) => (sc.id === id ? { ...sc, [field]: value } : sc))
        return enhanceShareClassesWithCalculations(updated)
      })
    },
    [shareClasses]
  )

  // Validation function for seniority
  const validateSeniority = useCallback(
    (newSeniority: number, currentId: string) => {
      // Minimum seniority for preferred shares is 0 (most senior position)
      if (newSeniority < 0) {
        alert('Minimum seniority for preferred shares is 0 (most senior position)')
        return false
      }

      // Allow multiple preferred classes to have the same seniority (pari passu)
      // No additional validation needed - multiple classes can rank equally

      return true
    },
    [shareClasses]
  )

  // Toggle row editing
  const toggleRowEdit = (id: string) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Add new share class
  const addShareClass = useCallback(() => {
    // Prevent adding while loading
    if (isLoading) return

    const commonClassExists = shareClasses.some((sc) => sc.shareType === 'common')
    const preferredCount = shareClasses.filter((sc) => sc.shareType === 'preferred').length

    // Generate unique ID with timestamp and random component to prevent collisions
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newShareClass: ShareClass = {
      id: uniqueId,
      companyId: 1,
      shareType: !commonClassExists ? 'common' : 'preferred',
      name: !commonClassExists
        ? 'Common Stock'
        : `Preferred Series ${String.fromCharCode(65 + preferredCount)}`,
      roundDate: new Date().toISOString().split('T')[0],
      sharesOutstanding: 0,
      pricePerShare: 0,
      preferenceType: 'non-participating',
      lpMultiple: 1.0,
      seniority: preferredCount + 1,
      participationCap: null,
      conversionRatio: 1.0,
      dividendsDeclared: false,
      dividendsRate: null,
      dividendsType: null,
      pik: false,
    }

    const enhancedShareClasses = enhanceShareClassesWithCalculations([
      ...shareClasses,
      newShareClass,
    ])
    setShareClasses(enhancedShareClasses)
    setHasChanges(true)
  }, [shareClasses, isLoading])

  // Delete share class
  const deleteShareClass = useCallback((id: string) => {
    setShareClasses((prev) => {
      const filtered = prev.filter((sc) => sc.id !== id)
      return enhanceShareClassesWithCalculations(filtered)
    })
    setEditingRows((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    setHasChanges(true)
  }, [])

  // Options/Warrants Management Functions
  const addOption = useCallback(() => {
    // Prevent adding while loading
    if (isLoading) return

    // Generate unique ID with timestamp and random component
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newOption: OptionsWarrants = {
      id: uniqueId,
      numOptions: 0,
      exercisePrice: 0,
      type: 'Options',
    }

    setOptions((prev) => [...prev, newOption])
    setHasChanges(true)
  }, [isLoading])

  const updateOption = useCallback((id: string, field: keyof OptionsWarrants, value: any) => {
    // Validation for numeric fields
    if (field === 'numOptions' && value < 0) {
      alert('Number of options cannot be negative')
      return
    }
    if (field === 'exercisePrice' && value < 0) {
      alert('Exercise price cannot be negative')
      return
    }

    setHasChanges(true)
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt)))
  }, [])

  const deleteOption = useCallback((id: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== id))
    setEditingRows((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    setHasChanges(true)
  }, [])

  // Options/Warrants Table Columns
  const optionsColumns: ColumnDef<OptionsWarrants>[] = [
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

  // Enhanced Share Class Columns with improved styling
  const shareClassColumns: ColumnDef<ShareClass>[] = [
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

    // 7. Preference Type
    {
      id: 'preferenceType',
      accessorKey: 'preferenceType',
      header: 'Preference Type',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Select
              value={shareClass.preferenceType}
              onValueChange={(
                value: 'non-participating' | 'participating' | 'participating-with-cap'
              ) => updateShareClass(shareClass.id, 'preferenceType', value)}
            >
              <SelectTrigger className="w-40 border-primary/20 bg-background focus:border-primary focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-primary/20 bg-card">
                <SelectItem value="non-participating">Non-Participating</SelectItem>
                <SelectItem value="participating">Participating</SelectItem>
                <SelectItem value="participating-with-cap">Participating w/ Cap</SelectItem>
              </SelectContent>
            </Select>
          )
        }

        const prefTypeDisplay = {
          'non-participating': 'Non-Part',
          participating: 'Part',
          'participating-with-cap': 'Part w/ Cap',
        }[shareClass.preferenceType]

        return <span className="text-sm text-foreground">{prefTypeDisplay}</span>
      },
    },

    // 8. LP Multiple (x)
    {
      id: 'lpMultiple',
      accessorKey: 'lpMultiple',
      header: 'LP Multiple (x)',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Input
              type="number"
              step="0.1"
              min="0"
              defaultValue={shareClass.lpMultiple}
              onBlur={(e) =>
                updateShareClass(shareClass.id, 'lpMultiple', parseFloat(e.target.value) || 1.0)
              }
              className="w-20 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="1.0"
            />
          )
        }

        return (
          <span className="font-medium text-foreground">{shareClass.lpMultiple.toFixed(1)}x</span>
        )
      },
    },

    // 9. Total LP (calculation)
    {
      id: 'totalLP',
      accessorKey: 'totalLP',
      header: 'Total LP',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        return (
          <span className="font-medium text-accent">{formatCurrency(shareClass.totalLP || 0)}</span>
        )
      },
    },

    // 10. Seniority
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
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Input
              type="number"
              min="0"
              defaultValue={shareClass.seniority}
              onBlur={(e) => {
                const newValue = parseInt(e.target.value) || 0
                if (validateSeniority(newValue, shareClass.id)) {
                  updateShareClass(shareClass.id, 'seniority', newValue)
                }
              }}
              className="w-20 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0"
            />
          )
        }

        return (
          <div className="text-center">
            <Badge
              variant={shareClass.seniority === 1 ? 'default' : 'secondary'}
              className={
                shareClass.seniority === 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }
            >
              {shareClass.seniority}
            </Badge>
          </div>
        )
      },
    },

    // 11. Participation Cap (only for "Participating with Cap")
    {
      id: 'participationCap',
      accessorKey: 'participationCap',
      header: 'Participation Cap',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'
        const showCap = shareClass.preferenceType === 'participating-with-cap'

        if (isCommon || !showCap) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Input
              type="number"
              step="0.01"
              min="0"
              defaultValue={shareClass.participationCap || ''}
              onBlur={(e) =>
                updateShareClass(
                  shareClass.id,
                  'participationCap',
                  parseFloat(e.target.value) || null
                )
              }
              className="w-28 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0.00"
            />
          )
        }

        return (
          <span className="font-medium text-foreground">
            {shareClass.participationCap ? formatCurrency(shareClass.participationCap) : '-'}
          </span>
        )
      },
    },

    // 12. Conversion Ratio
    {
      id: 'conversionRatio',
      accessorKey: 'conversionRatio',
      header: 'Conversion Ratio',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Input
              type="number"
              step="0.01"
              min="0"
              defaultValue={shareClass.conversionRatio}
              onBlur={(e) =>
                updateShareClass(
                  shareClass.id,
                  'conversionRatio',
                  parseFloat(e.target.value) || 1.0
                )
              }
              className="w-20 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="1.0"
            />
          )
        }

        return (
          <span className="font-medium text-foreground">
            {shareClass.conversionRatio.toFixed(2)}
          </span>
        )
      },
    },

    // 13. As Converted Shares (calculation)
    {
      id: 'asConvertedShares',
      accessorKey: 'asConvertedShares',
      header: 'As Converted Shares',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        return (
          <span className="font-medium text-foreground">
            {formatNumber(shareClass.asConvertedShares || 0)}
          </span>
        )
      },
    },

    // 14. Dividends Declared (Yes/No)
    {
      id: 'dividendsDeclared',
      accessorKey: 'dividendsDeclared',
      header: 'Dividends Declared',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Switch
              checked={shareClass.dividendsDeclared}
              onCheckedChange={(checked) =>
                updateShareClass(shareClass.id, 'dividendsDeclared', checked)
              }
            />
          )
        }

        return (
          <Badge variant={shareClass.dividendsDeclared ? 'default' : 'secondary'}>
            {shareClass.dividendsDeclared ? 'Yes' : 'No'}
          </Badge>
        )
      },
    },

    // 15. Dividends Rate
    {
      id: 'dividendsRate',
      accessorKey: 'dividendsRate',
      header: 'Dividends Rate',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'
        const showRate = shareClass.dividendsDeclared

        if (isCommon || !showRate) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Input
              type="number"
              step="0.01"
              min="0"
              defaultValue={shareClass.dividendsRate || ''}
              onBlur={(e) =>
                updateShareClass(shareClass.id, 'dividendsRate', parseFloat(e.target.value) || null)
              }
              className="w-20 border-primary/20 bg-background focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0.00"
            />
          )
        }

        return (
          <span className="font-medium text-foreground">
            {shareClass.dividendsRate ? `${shareClass.dividendsRate.toFixed(2)}%` : '-'}
          </span>
        )
      },
    },

    // 16. Dividends Type (Cumulative/Non-Cumulative when declared)
    {
      id: 'dividendsType',
      accessorKey: 'dividendsType',
      header: 'Dividends Type',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'
        const showType = shareClass.dividendsDeclared

        if (isCommon || !showType) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Select
              value={shareClass.dividendsType || ''}
              onValueChange={(value: 'cumulative' | 'non-cumulative' | '') =>
                updateShareClass(shareClass.id, 'dividendsType', value || null)
              }
            >
              <SelectTrigger className="w-32 border-primary/20 bg-background focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="border-primary/20 bg-card">
                <SelectItem value="cumulative">Cumulative</SelectItem>
                <SelectItem value="non-cumulative">Non-Cumulative</SelectItem>
              </SelectContent>
            </Select>
          )
        }

        return (
          <span className="text-sm text-foreground">
            {shareClass.dividendsType
              ? shareClass.dividendsType.charAt(0).toUpperCase() + shareClass.dividendsType.slice(1)
              : '-'}
          </span>
        )
      },
    },

    // 17. PIK (Yes/No)
    {
      id: 'pik',
      accessorKey: 'pik',
      header: 'PIK',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isEditing = editingRows.has(shareClass.id)
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        if (isEditing) {
          return (
            <Switch
              checked={shareClass.pik}
              onCheckedChange={(checked) => updateShareClass(shareClass.id, 'pik', checked)}
            />
          )
        }

        return (
          <Badge variant={shareClass.pik ? 'default' : 'secondary'}>
            {shareClass.pik ? 'Yes' : 'No'}
          </Badge>
        )
      },
    },

    // 18. Total Dividends (calculation from round date to present)
    {
      id: 'totalDividends',
      accessorKey: 'totalDividends',
      header: 'Total Dividends',
      enableSorting: true,
      cell: ({ row }) => {
        const shareClass = row.original
        const isCommon = shareClass.shareType === 'common'

        if (isCommon) {
          return <span className="text-muted-foreground">N/A</span>
        }

        return (
          <span className="font-medium text-accent">
            {formatCurrency(shareClass.totalDividends || 0)}
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

  // Calculate totals for summary
  const totals = {
    totalShares: shareClasses.reduce((sum, sc) => sum + sc.sharesOutstanding, 0),
    totalInvested: shareClasses.reduce((sum, sc) => sum + (sc.amountInvested || 0), 0),
    totalLP: shareClasses.reduce((sum, sc) => sum + (sc.totalLP || 0), 0),
    totalDividends: shareClasses.reduce((sum, sc) => sum + (sc.totalDividends || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-primary/20 bg-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{shareClasses.length}</div>
            <p className="text-sm text-muted-foreground">Share Classes</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {formatNumber(totals.totalShares)}
            </div>
            <p className="text-sm text-muted-foreground">Total Shares</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(totals.totalInvested)}
            </div>
            <p className="text-sm text-muted-foreground">Total Invested</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">{formatCurrency(totals.totalLP)}</div>
            <p className="text-sm text-muted-foreground">Total LP</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="border-b border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cap Table Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Manage share classes and their properties
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={addShareClass} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Share Class
              </Button>
              {hasChanges && (
                <Button
                  onClick={saveCapTable}
                  variant="secondary"
                  size="sm"
                  title="Save all changes to database (row edit buttons only update local state)"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <OptimizedDataTable
            key="share-classes-table"
            tableId="share-classes-table"
            columns={shareClassColumns as any}
            data={shareClasses}
            enableColumnReordering={true}
            enableColumnVisibility={true}
            enableSorting={true}
            enablePagination={false}
            enableColumnFilters={true}
            enableColumnPinning={true}
            enableRowReordering={true}
            onRowReorder={(fromIndex, toIndex) => {
              const newShareClasses = [...shareClasses]
              const [movedShareClass] = newShareClasses.splice(fromIndex, 1)
              newShareClasses.splice(toIndex, 0, movedShareClass)
              setShareClasses(newShareClasses)
              setHasChanges(true)
            }}
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Options/Warrants Table */}
      <Card className="border-primary/20 bg-card">
        <CardHeader className="border-b border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Options & Warrants</h3>
              <p className="text-sm text-muted-foreground">
                Manage employee stock options and warrants
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={addOption}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option/Warrant
              </Button>
              {hasChanges && (
                <Button
                  onClick={saveCapTable}
                  variant="secondary"
                  size="sm"
                  title="Save all changes to database (row edit buttons only update local state)"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {options.length > 0 ? (
            <div>
              <OptimizedDataTable
                key="options-table"
                tableId="options-table"
                columns={optionsColumns as any}
                data={options}
                enableColumnReordering={true}
                enableColumnVisibility={true}
                enableSorting={true}
                enablePagination={false}
                enableColumnFilters={true}
                enableColumnPinning={true}
                enableRowReordering={true}
                onRowReorder={(fromIndex, toIndex) => {
                  const newOptions = [...options]
                  const [movedOption] = newOptions.splice(fromIndex, 1)
                  newOptions.splice(toIndex, 0, movedOption)
                  setOptions(newOptions)
                  setHasChanges(true)
                }}
                initialState={{
                  columnVisibility: {
                    type: true,
                    numOptions: true,
                    exercisePrice: true,
                    actions: true,
                  },
                  columnOrder: ['type', 'numOptions', 'exercisePrice', 'actions'],
                }}
                className="border-0"
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="mb-4 text-muted-foreground">No options or warrants added yet</p>
              <Button
                onClick={addOption}
                variant="outline"
                className="border-primary/20 hover:bg-primary/5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Option/Warrant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ImprovedCapTable
