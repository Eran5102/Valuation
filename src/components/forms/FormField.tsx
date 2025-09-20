import React from 'react'
import { UseFormRegisterReturn, FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface FormFieldProps {
  label: string
  error?: FieldError
  children?: React.ReactNode
  required?: boolean
  description?: string
  className?: string
}

export function FormField({
  label,
  error,
  children,
  required,
  description,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label
        className={cn(
          'text-sm font-medium',
          error && 'text-red-600',
          required && 'after:ml-1 after:text-red-500 after:content-["*"]'
        )}
      >
        {label}
      </Label>

      {description && <p className="text-sm text-gray-500">{description}</p>}

      {children}

      {error && (
        <p className="flex items-start gap-1 text-sm text-red-600">
          <span className="mt-2 block h-1 w-1 flex-shrink-0 rounded-full bg-red-600" />
          {error.message}
        </p>
      )}
    </div>
  )
}

interface TextFieldProps extends FormFieldProps {
  register: UseFormRegisterReturn
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
}

export function TextField({
  label,
  register,
  error,
  type = 'text',
  placeholder,
  disabled,
  required,
  description,
  className,
}: TextFieldProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <Input
        {...register}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
      />
    </FormField>
  )
}

interface SelectFieldProps extends FormFieldProps {
  register: UseFormRegisterReturn
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
}

export function SelectField({
  label,
  register,
  error,
  options,
  placeholder = 'Select an option...',
  disabled,
  required,
  description,
  className,
}: SelectFieldProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <select
        {...register}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

interface TextAreaFieldProps extends FormFieldProps {
  register: UseFormRegisterReturn
  placeholder?: string
  disabled?: boolean
  rows?: number
}

export function TextAreaField({
  label,
  register,
  error,
  placeholder,
  disabled,
  rows = 4,
  required,
  description,
  className,
}: TextAreaFieldProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <textarea
        {...register}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )}
      />
    </FormField>
  )
}

interface CheckboxFieldProps extends FormFieldProps {
  register: UseFormRegisterReturn
  disabled?: boolean
}

export function CheckboxField({
  label,
  register,
  error,
  disabled,
  description,
  className,
}: CheckboxFieldProps) {
  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <input
        {...register}
        type="checkbox"
        disabled={disabled}
        className={cn(
          'mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0',
          error && 'border-red-500 text-red-500 focus:ring-red-500'
        )}
      />
      <div className="space-y-1">
        <Label className={cn('cursor-pointer text-sm font-medium', error && 'text-red-600')}>
          {label}
        </Label>

        {description && <p className="text-sm text-gray-500">{description}</p>}

        {error && <p className="text-sm text-red-600">{error.message}</p>}
      </div>
    </div>
  )
}

interface RadioGroupFieldProps extends FormFieldProps {
  register: UseFormRegisterReturn
  options: Array<{ value: string; label: string; description?: string }>
  disabled?: boolean
}

export function RadioGroupField({
  label,
  register,
  error,
  options,
  disabled,
  required,
  description,
  className,
}: RadioGroupFieldProps) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <input
              {...register}
              type="radio"
              value={option.value}
              disabled={disabled}
              className={cn(
                'mt-1 h-4 w-4 border-gray-300 text-primary focus:ring-primary focus:ring-offset-0',
                error && 'border-red-500 text-red-500 focus:ring-red-500'
              )}
            />
            <div>
              <Label className="cursor-pointer text-sm font-medium">{option.label}</Label>
              {option.description && <p className="text-sm text-gray-500">{option.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </FormField>
  )
}
