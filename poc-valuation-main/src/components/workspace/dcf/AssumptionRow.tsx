import React from 'react'
import { Input } from '@/components/ui/input'
import { TableCell } from '@/components/ui/table'

interface AssumptionRowProps {
  values: number[]
  onChange: (values: number[]) => void
  total: number
  disabled?: boolean
}

export function AssumptionRow({ values, onChange, total, disabled = false }: AssumptionRowProps) {
  const handleChange = (index: number, value: string) => {
    const numericValue = parseFloat(value) || 0
    const newValues = [...values]
    newValues[index] = numericValue
    onChange(newValues)
  }

  // If values length is less than total, fill with the last value or 0
  const filledValues = [...values]
  if (filledValues.length < total) {
    const lastValue = filledValues.length > 0 ? filledValues[filledValues.length - 1] : 0
    for (let i = filledValues.length; i < total; i++) {
      filledValues.push(lastValue)
    }
  }

  return (
    <>
      {filledValues.slice(0, total).map((value, index) => (
        <TableCell key={index} className="w-[120px] p-1 text-right">
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            className="h-8 text-center"
            disabled={disabled}
          />
        </TableCell>
      ))}
    </>
  )
}
