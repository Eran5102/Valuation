'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PercentageInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  decimals?: number
}

const PercentageInput = React.forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ className, value, onChange, min = 0, max = 100, step = 0.1, decimals = 1, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value?.toString() || '')

    React.useEffect(() => {
      setLocalValue(value?.toString() || '')
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setLocalValue(newValue)

      if (newValue === '') {
        onChange?.(0)
        return
      }

      const numValue = parseFloat(newValue)
      if (!isNaN(numValue)) {
        // Clamp value between min and max
        const clampedValue = Math.max(min, Math.min(max, numValue))
        onChange?.(clampedValue)
      }
    }

    const handleBlur = () => {
      if (localValue === '') {
        setLocalValue('0')
        onChange?.(0)
        return
      }

      const numValue = parseFloat(localValue)
      if (!isNaN(numValue)) {
        // Round to specified decimals and clamp
        const rounded = parseFloat(numValue.toFixed(decimals))
        const clamped = Math.max(min, Math.min(max, rounded))
        setLocalValue(clamped.toString())
        onChange?.(clamped)
      }
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={cn('pr-8', className)}
          {...props}
        />
        <Percent className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
    )
  }
)
PercentageInput.displayName = 'PercentageInput'

export { PercentageInput }
