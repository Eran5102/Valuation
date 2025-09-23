import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'textarea'
  placeholder?: string
  required?: boolean
  validator?: (schema: any) => any
  colSpan?: number
}

interface AddItemFormProps {
  title: string
  fields: FormField[]
  onSubmit: (data: any) => void
  submitButtonText: string
  secondaryButton?: React.ReactNode
  columnLayout?: number
}

export function AddItemForm({
  title,
  fields,
  onSubmit,
  submitButtonText = 'Add Item',
  secondaryButton,
  columnLayout = 3,
}: AddItemFormProps) {
  // Dynamically create the schema based on field definitions
  const schema = generateSchemaFromFields(fields)

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: generateDefaultValues(fields),
  })

  const handleSubmit = (data: any) => {
    onSubmit(data)
    form.reset()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className={`grid grid-cols-1 md:grid-cols-${columnLayout} gap-4`}>
            {fields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem className={field.colSpan ? `md:col-span-${field.colSpan}` : ''}>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>{renderFormControl(field, formField)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              {submitButtonText}
            </Button>
            {secondaryButton}
          </div>
        </form>
      </Form>
    </div>
  )
}

// Helper functions
function generateSchemaFromFields(fields: FormField[]): z.ZodObject<any> {
  const schemaMap: Record<string, any> = {}

  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny

    // Base schema based on field type
    switch (field.type) {
      case 'number':
        fieldSchema = z.number({
          required_error: `${field.label} is required`,
          invalid_type_error: 'Must be a number',
        })
        break
      case 'date':
        fieldSchema = z.date({
          required_error: `${field.label} is required`,
        })
        break
      default: // text and textarea
        fieldSchema = z.string()
        break
    }

    // Apply required if specified
    if (field.required) {
      if (field.type === 'text' || field.type === 'textarea') {
        fieldSchema = fieldSchema.refine((val) => val.trim().length > 0, {
          message: `${field.label} is required`,
        })
      }
    } else {
      fieldSchema = fieldSchema.optional()
    }

    // Apply custom validator if provided
    if (field.validator) {
      fieldSchema = field.validator(fieldSchema)
    }

    schemaMap[field.name] = fieldSchema
  })

  return z.object(schemaMap)
}

function generateDefaultValues(fields: FormField[]): Record<string, any> {
  const defaultValues: Record<string, any> = {}

  fields.forEach((field) => {
    switch (field.type) {
      case 'number':
        defaultValues[field.name] = undefined
        break
      case 'date':
        defaultValues[field.name] = undefined
        break
      case 'text':
      case 'textarea':
        defaultValues[field.name] = ''
        break
    }
  })

  return defaultValues
}

function renderFormControl(field: FormField, formField: any) {
  const { type, placeholder } = field

  switch (type) {
    case 'number':
      return (
        <input
          type="number"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          {...formField}
          onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
        />
      )
    case 'textarea':
      return (
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          {...formField}
        />
      )
    case 'date':
      // For date fields, we'll need custom date picker implementation
      // This is a simplified version - real implementation would use a date picker
      return (
        <input
          type="date"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...formField}
          value={formField.value ? new Date(formField.value).toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            formField.onChange(date)
          }}
        />
      )
    default: // 'text'
      return (
        <input
          type="text"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
          {...formField}
        />
      )
  }
}
