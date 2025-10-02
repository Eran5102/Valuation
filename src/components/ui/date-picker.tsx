'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function formatDate(date: Date | undefined) {
  if (!date) {
    return ''
  }
  return format(date, 'MMMM dd, yyyy')
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export type DatePickerProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  fromDate?: Date
  toDate?: Date
  disabledDates?: Date[]
  disabledDays?: Array<Date | { from: Date; to: Date } | { before: Date } | { after: Date }>
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className,
  align = 'end',
  side = 'bottom',
  fromDate,
  toDate,
  disabledDates,
  disabledDays,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(value)
  const [inputValue, setInputValue] = React.useState(formatDate(value))

  // Sync input value when value prop changes
  React.useEffect(() => {
    setInputValue(formatDate(value))
    if (value) {
      setMonth(value)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    // Try to parse the input as a date
    const date = new Date(val)
    if (isValidDate(date)) {
      onChange?.(date)
      setMonth(date)
    }
  }

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    setInputValue(formatDate(date))
    if (date) {
      setMonth(date)
    }
    setOpen(false)
  }

  return (
    <div className={cn('relative flex', className)}>
      <Input
        value={inputValue}
        placeholder={placeholder}
        className="pr-10"
        disabled={disabled}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled}
            className="absolute right-2 top-1/2 size-6 -translate-y-1/2 p-0"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align={align}
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={handleSelect}
            disabled={disabledDays || disabledDates}
            fromDate={fromDate}
            toDate={toDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Date Range Picker variant
export type DateRangePickerProps = {
  value?: { from: Date | undefined; to: Date | undefined }
  onChange?: (dateRange: { from: Date | undefined; to: Date | undefined } | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  align?: 'start' | 'center' | 'end'
  numberOfMonths?: number
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  disabled = false,
  className,
  align = 'start',
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (range: any) => {
    onChange?.(range)
    if (range?.from && range?.to) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
              </>
            ) : (
              format(value.from, 'LLL dd, y')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="range"
          selected={value}
          onSelect={handleSelect}
          numberOfMonths={numberOfMonths}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
