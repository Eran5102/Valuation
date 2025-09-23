import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface EditableCellProps {
  value: number
  isEdited?: boolean
  isEditing: boolean
  editValue: string
  onEdit: (value: string) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  field: string
  suffix?: string
  tooltip?: string // Add tooltip prop
}

export function EditableCell({
  value,
  isEdited,
  isEditing,
  editValue,
  onEdit,
  onBlur,
  onKeyDown,
  field,
  suffix = '',
  tooltip,
}: EditableCellProps) {
  const formatValue = () => {
    if (field.toLowerCase().includes('margin') || field.toLowerCase().includes('growth')) {
      return `${value.toFixed(1)}%`
    } else if (
      field.toLowerCase().includes('ratio') ||
      (field.toLowerCase().includes('ev') && field.toLowerCase().includes('to'))
    ) {
      return `${value.toFixed(1)}x`
    } else {
      return value.toLocaleString()
    }
  }

  // Updated to use accent color with lower opacity for edited values
  const className = `cursor-pointer ${isEdited ? 'bg-accent/10 border-l-2 border-l-accent' : ''}`

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => onEdit(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoFocus
        className="h-8 w-full p-1 focus-visible:ring-accent"
      />
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-end gap-1">
        <span>
          {formatValue()}
          {suffix}
        </span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="inline-flex">
              <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
