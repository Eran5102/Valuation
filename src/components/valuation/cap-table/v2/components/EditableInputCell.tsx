'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditableInputCellProps {
  value: string | number | null | undefined
  onChange: (value: string | number) => void
  type?: 'text' | 'number' | 'currency'
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  formatter?: (value: any) => string
  parser?: (value: string) => string | number
}

export function EditableInputCell({
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
  placeholder,
  className,
  disabled = false,
  formatter,
  parser,
}: EditableInputCellProps) {
  // Local state to maintain value during typing
  const [localValue, setLocalValue] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize local value from props
  useEffect(() => {
    if (!isFocused) {
      // Only update local value if not currently editing
      if (formatter) {
        setLocalValue(formatter(value ?? ''))
      } else if (type === 'currency' && typeof value === 'number') {
        setLocalValue(value.toFixed(2))
      } else {
        setLocalValue(String(value ?? ''))
      }
    }
  }, [value, formatter, type, isFocused])

  // Handle input changes - update local state only
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // For number/currency types, allow typing without immediate validation
    // This prevents cursor jumping and allows incomplete numbers like "5."
  }

  // Handle blur - parse and send final value to parent
  const handleBlur = () => {
    setIsFocused(false)

    let finalValue: string | number = localValue

    if (type === 'number' || type === 'currency') {
      // Handle empty input
      if (localValue === '' || localValue === '-') {
        finalValue = 0
      } else {
        // Parse the number
        const parsed = parseFloat(localValue.replace(/[^0-9.-]/g, ''))
        if (!isNaN(parsed)) {
          // Apply min/max constraints
          finalValue = parsed
          if (min !== undefined && parsed < min) finalValue = min
          if (max !== undefined && parsed > max) finalValue = max
        } else {
          finalValue = 0
        }
      }
    } else if (parser) {
      finalValue = parser(localValue)
    } else {
      finalValue = localValue
    }

    // Only trigger onChange if value actually changed
    if (finalValue !== value) {
      onChange(finalValue)
    }
  }

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true)
    // Select all text on focus for easier editing
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }

  // Handle Enter key to blur
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      inputRef.current?.blur()
    }
  }

  // Determine input type attribute
  const inputType = type === 'currency' || type === 'number' ? 'text' : 'text'

  return (
    <Input
      ref={inputRef}
      type={inputType}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'h-8 px-2 py-1 text-sm',
        'focus:ring-1 focus:ring-primary',
        'transition-all duration-200',
        className
      )}
    />
  )
}

// Specialized number input
export function EditableNumberInput({
  value,
  onChange,
  min = 0,
  max,
  placeholder = '0',
  className,
  disabled = false,
}: {
  value: number | null | undefined
  onChange: (value: number) => void
  min?: number
  max?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <EditableInputCell
      value={value}
      onChange={onChange}
      type="number"
      min={min}
      max={max}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  )
}

// Specialized currency input
export function EditableCurrencyInput({
  value,
  onChange,
  min = 0,
  placeholder = '$0.00',
  className,
  disabled = false,
}: {
  value: number | null | undefined
  onChange: (value: number) => void
  min?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <EditableInputCell
      value={value}
      onChange={onChange}
      type="currency"
      min={min}
      step={0.01}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      formatter={(val) => {
        if (val === null || val === undefined || val === '') return ''
        const num = typeof val === 'number' ? val : parseFloat(val)
        return isNaN(num) ? '' : num.toFixed(2)
      }}
    />
  )
}

// Specialized percentage input
export function EditablePercentageInput({
  value,
  onChange,
  min = 0,
  max = 100,
  placeholder = '0%',
  className,
  disabled = false,
}: {
  value: number | null | undefined
  onChange: (value: number) => void
  min?: number
  max?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <EditableInputCell
      value={value}
      onChange={onChange}
      type="number"
      min={min}
      max={max}
      step={0.1}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      formatter={(val) => {
        if (val === null || val === undefined || val === '') return ''
        return String(val)
      }}
    />
  )
}
