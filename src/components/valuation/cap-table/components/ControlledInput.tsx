'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import debounce from 'lodash/debounce'

interface ControlledInputProps {
  value: string | number | null | undefined
  onChange: (value: string | number) => void
  type?: 'text' | 'number'
  min?: number
  max?: number
  step?: number | string
  placeholder?: string
  className?: string
  disabled?: boolean
  debounceMs?: number
  formatter?: (value: string | number) => string
  parser?: (value: string) => string | number
}

export function ControlledInput({
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
  placeholder,
  className,
  disabled = false,
  debounceMs = 500,
  formatter,
  parser,
}: ControlledInputProps) {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorPositionRef = useRef<number | null>(null)

  // Initialize local value from prop
  useEffect(() => {
    if (!isFocused) {
      const formatted = formatter ? formatter(value ?? '') : String(value ?? '')
      setLocalValue(formatted)
    }
  }, [value, formatter, isFocused])

  // Debounced onChange handler
  const debouncedOnChange = useRef(
    debounce((newValue: string) => {
      if (type === 'number') {
        const parsed = parser ? parser(newValue) : parseFloat(newValue)
        if (!isNaN(parsed as number)) {
          // Apply min/max constraints
          let finalValue = parsed as number
          if (min !== undefined && finalValue < min) finalValue = min
          if (max !== undefined && finalValue > max) finalValue = max
          onChange(finalValue)
        } else if (newValue === '') {
          onChange(0)
        }
      } else {
        const parsed = parser ? parser(newValue) : newValue
        onChange(parsed)
      }
    }, debounceMs)
  ).current

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      const cursorPos = e.target.selectionStart

      // Store cursor position
      cursorPositionRef.current = cursorPos

      // Update local state immediately for responsive UI
      setLocalValue(newValue)

      // Debounce the actual onChange callback
      debouncedOnChange(newValue)
    },
    [debouncedOnChange]
  )

  // Restore cursor position after value changes
  useEffect(() => {
    if (inputRef.current && cursorPositionRef.current !== null && isFocused) {
      const position = Math.min(cursorPositionRef.current, localValue.length)
      inputRef.current.setSelectionRange(position, position)
    }
  }, [localValue, isFocused])

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    // Select all text on focus for number inputs
    if (type === 'number' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.select()
      }, 0)
    }
  }, [type])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    cursorPositionRef.current = null

    // Final validation on blur
    if (type === 'number') {
      const parsed = parser ? parser(localValue) : parseFloat(localValue)
      if (!isNaN(parsed as number)) {
        let finalValue = parsed as number
        if (min !== undefined && finalValue < min) finalValue = min
        if (max !== undefined && finalValue > max) finalValue = max

        // Update immediately on blur without debounce
        onChange(finalValue)
        const formatted = formatter ? formatter(finalValue) : String(finalValue)
        setLocalValue(formatted)
      } else if (localValue === '') {
        onChange(0)
        setLocalValue('0')
      }
    }
  }, [type, parser, localValue, min, max, onChange, formatter])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Arrow up/down for number inputs
      if (type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        const currentValue = parseFloat(localValue) || 0
        const stepValue = typeof step === 'number' ? step : parseFloat(step || '1')
        const newValue = e.key === 'ArrowUp' ? currentValue + stepValue : currentValue - stepValue

        let finalValue = newValue
        if (min !== undefined && finalValue < min) finalValue = min
        if (max !== undefined && finalValue > max) finalValue = max

        const formatted = formatter ? formatter(finalValue) : String(finalValue)
        setLocalValue(formatted)
        onChange(finalValue)
      }

      // Enter key to blur
      if (e.key === 'Enter') {
        inputRef.current?.blur()
      }

      // Escape key to reset
      if (e.key === 'Escape') {
        const formatted = formatter ? formatter(value ?? '') : String(value ?? '')
        setLocalValue(formatted)
        inputRef.current?.blur()
      }
    },
    [type, localValue, step, min, max, formatter, value, onChange]
  )

  return (
    <Input
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'transition-all duration-150',
        isFocused && 'ring-2 ring-primary ring-offset-1',
        className
      )}
    />
  )
}

// Specialized number input with formatting
export function ControlledNumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = '0',
  className,
  disabled = false,
  debounceMs = 500,
  decimals = 0,
}: {
  value: number | null | undefined
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  debounceMs?: number
  decimals?: number
}) {
  const formatter = useCallback(
    (val: string | number) => {
      const num = typeof val === 'number' ? val : parseFloat(val)
      if (isNaN(num)) return '0'
      return decimals > 0 ? num.toFixed(decimals) : String(Math.round(num))
    },
    [decimals]
  )

  const parser = useCallback((val: string) => {
    return parseFloat(val) || 0
  }, [])

  return (
    <ControlledInput
      value={value}
      onChange={onChange}
      type="number"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      debounceMs={debounceMs}
      formatter={formatter}
      parser={parser}
    />
  )
}

// Specialized currency input
export function ControlledCurrencyInput({
  value,
  onChange,
  min = 0,
  placeholder = '$0.00',
  className,
  disabled = false,
  debounceMs = 500,
}: {
  value: number | null | undefined
  onChange: (value: number) => void
  min?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  debounceMs?: number
}) {
  return (
    <ControlledNumberInput
      value={value}
      onChange={onChange}
      min={min}
      step={0.01}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      debounceMs={debounceMs}
      decimals={2}
    />
  )
}

// Specialized percentage input
export function ControlledPercentageInput({
  value,
  onChange,
  min = 0,
  max = 100,
  placeholder = '0%',
  className,
  disabled = false,
  debounceMs = 500,
}: {
  value: number | null | undefined
  onChange: (value: number) => void
  min?: number
  max?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  debounceMs?: number
}) {
  return (
    <ControlledNumberInput
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={0.1}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      debounceMs={debounceMs}
      decimals={1}
    />
  )
}
