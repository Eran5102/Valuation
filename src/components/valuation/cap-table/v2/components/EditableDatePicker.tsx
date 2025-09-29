'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'

interface EditableDatePickerProps {
  value: string // ISO date string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

export function EditableDatePicker({
  value,
  onChange,
  className,
  disabled = false,
  placeholder = 'Select date',
}: EditableDatePickerProps) {
  // Convert ISO string to Date object for the DatePicker
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (value) {
      try {
        return new Date(value)
      } catch {
        return undefined
      }
    }
    return undefined
  })

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      try {
        const newDate = new Date(value)
        if (!isNaN(newDate.getTime())) {
          setSelectedDate(newDate)
        }
      } catch {
        // Invalid date string
      }
    } else {
      setSelectedDate(undefined)
    }
  }, [value])

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    // Convert Date to ISO string for storage
    if (date) {
      const isoString = format(date, 'yyyy-MM-dd')
      onChange(isoString)
    } else {
      onChange('')
    }
  }

  return (
    <DatePicker
      value={selectedDate}
      onChange={handleDateChange}
      disabled={disabled}
      placeholder={placeholder}
      className={cn('h-8 w-36', className)}
    />
  )
}

// For inline editing in tables with smaller size
export function InlineEditableDatePicker({
  value,
  onChange,
  disabled = false,
}: EditableDatePickerProps) {
  return (
    <EditableDatePicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="h-8 w-32 text-xs [&_button]:h-8 [&_button]:px-2 [&_button]:text-xs [&_svg]:h-3 [&_svg]:w-3"
      placeholder="Pick date"
    />
  )
}
