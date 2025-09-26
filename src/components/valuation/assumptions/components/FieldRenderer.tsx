import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AssumptionField } from '../types'

interface FieldRendererProps {
  field: AssumptionField
  sectionId: string
  assumptions: Record<string, any>
  handleFieldChange: (sectionId: string, fieldId: string, value: any) => void
}

export function FieldRenderer({
  field,
  sectionId,
  assumptions,
  handleFieldChange,
}: FieldRendererProps) {
  const fieldKey = `${sectionId}.${field.id}`
  const value = assumptions[fieldKey] || field.value

  return (
    <div className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {field.type === 'select' ? (
        <Select
          value={value}
          onValueChange={(value) => handleFieldChange(sectionId, field.id, value)}
        >
          <SelectTrigger id={field.id} className="mt-1">
            <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'textarea' ? (
        <textarea
          id={field.id}
          value={value}
          onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          placeholder={field.placeholder}
        />
      ) : (
        <Input
          id={field.id}
          type={field.type === 'percentage' ? 'number' : field.type}
          value={value}
          onChange={(e) => handleFieldChange(sectionId, field.id, e.target.value)}
          className="mt-1"
          placeholder={field.placeholder}
        />
      )}
    </div>
  )
}