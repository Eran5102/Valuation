'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { OptimizedDataTable } from './optimized-data-table'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

interface EditableCellProps {
  value: any
  onChange: (value: any) => void
  onBlur?: () => void
  type?: 'text' | 'number' | 'currency' | 'percentage'
  editable?: boolean
  className?: string
  min?: number
  max?: number
  decimals?: number
}

export function EditableCell({
  value: initialValue,
  onChange,
  onBlur,
  type = 'text',
  editable = true,
  className,
  min,
  max,
  decimals = 2,
}: EditableCellProps) {
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleDoubleClick = () => {
    if (!editable) return
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    if (type === 'number' || type === 'currency' || type === 'percentage') {
      // Allow typing but validate on blur
      setValue(newValue)
    } else {
      setValue(newValue)
    }
  }

  const handleBlur = () => {
    let finalValue = value

    if (type === 'number' || type === 'currency' || type === 'percentage') {
      const numValue = parseFloat(value as string)
      if (!isNaN(numValue)) {
        // Apply min/max constraints
        let constrained = numValue
        if (min !== undefined) constrained = Math.max(min, constrained)
        if (max !== undefined) constrained = Math.min(max, constrained)

        // Round to specified decimals
        finalValue = parseFloat(constrained.toFixed(decimals))
      } else {
        finalValue = 0
      }
    }

    setValue(finalValue)
    onChange(finalValue)
    setIsEditing(false)
    onBlur?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setValue(initialValue)
      setIsEditing(false)
    }
  }

  const formatDisplay = (val: any) => {
    if (val === null || val === undefined) return ''

    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      }).format(val)
    } else if (type === 'percentage') {
      return `${parseFloat(val).toFixed(decimals)}%`
    } else if (type === 'number') {
      return parseFloat(val).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })
    }

    return val.toString()
  }

  if (!editable) {
    return <div className={cn('px-2 py-1', className)}>{formatDisplay(value)}</div>
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn('h-8 px-2 py-1', className)}
        type={type === 'number' || type === 'currency' || type === 'percentage' ? 'number' : 'text'}
        step={type === 'percentage' ? 0.1 : 1}
        min={min}
        max={max}
      />
    )
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={cn(
        'cursor-pointer rounded px-2 py-1 hover:bg-muted/50',
        'transition-colors duration-200',
        className
      )}
      title="Double-click to edit"
    >
      {formatDisplay(value)}
    </div>
  )
}

interface EditableDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onDataChange?: (data: T[]) => void
  onCellChange?: (rowIndex: number, columnId: string, value: any) => void
  tableId: string
  showExport?: boolean
  showColumnVisibility?: boolean
  showPagination?: boolean
  pageSize?: number
  className?: string
  editable?: boolean | string[] // true for all cells, or array of column IDs
}

export function EditableDataTable<T extends Record<string, any>>({
  data,
  columns,
  onDataChange,
  onCellChange,
  tableId,
  showExport = true,
  showColumnVisibility = true,
  showPagination = true,
  pageSize = 10,
  className,
  editable = true,
}: EditableDataTableProps<T>) {
  const [localData, setLocalData] = useState<T[]>(data)

  useEffect(() => {
    setLocalData(data)
  }, [data])

  const handleCellChange = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      const newData = [...localData]
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnId]: value,
      }
      setLocalData(newData)
      onDataChange?.(newData)
      onCellChange?.(rowIndex, columnId, value)
    },
    [localData, onDataChange, onCellChange]
  )

  // Enhance columns with editable cells
  const editableColumns = columns.map((col: any) => {
    const isEditable =
      editable === true || (Array.isArray(editable) && editable.includes(col.id || col.accessorKey))

    if (!isEditable || col.cell) {
      return col // Keep original column if not editable or has custom cell
    }

    return {
      ...col,
      cell: ({ row, column }: any) => {
        const rowIndex = row.index
        const columnId = column.id || col.accessorKey
        const value = row.getValue(columnId)

        return (
          <EditableCell
            value={value}
            onChange={(newValue) => handleCellChange(rowIndex, columnId, newValue)}
            type={col.type || 'text'}
            editable={true}
            min={col.min}
            max={col.max}
            decimals={col.decimals}
          />
        )
      },
    }
  })

  return (
    <OptimizedDataTable
      data={localData}
      columns={editableColumns}
      tableId={tableId}
      showExport={showExport}
      showColumnVisibility={showColumnVisibility}
      showPagination={showPagination}
      pageSize={pageSize}
      className={className}
    />
  )
}
