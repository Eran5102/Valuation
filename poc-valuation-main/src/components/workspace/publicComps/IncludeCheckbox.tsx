import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'

interface IncludeCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function IncludeCheckbox({ checked, onChange }: IncludeCheckboxProps) {
  return <Checkbox checked={checked} onCheckedChange={(checked) => onChange(!!checked)} />
}
