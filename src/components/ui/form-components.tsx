import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FormFieldProps {
  label: string
  id: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'url'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  error?: string
}

export function FormField({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className,
  disabled = false,
  error
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-card-foreground"
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive focus:border-destructive focus:ring-destructive'
        )}
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

interface FormSelectProps {
  label: string
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  error?: string
}

export function FormSelect({
  label,
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  className,
  disabled = false,
  error
}: FormSelectProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-card-foreground"
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive focus:border-destructive focus:ring-destructive'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

interface FormTextareaProps {
  label: string
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  rows?: number
  error?: string
}

export function FormTextarea({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  className,
  disabled = false,
  rows = 3,
  error
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-card-foreground"
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className={cn(
          'w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring resize-y',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive focus:border-destructive focus:ring-destructive'
        )}
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

interface FormSectionProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, icon: Icon, children, className }: FormSectionProps) {
  return (
    <div className={className}>
      <h3 className="mb-4 flex items-center text-lg font-medium text-card-foreground">
        <Icon className="mr-2 h-5 w-5" />
        {title}
      </h3>
      {children}
    </div>
  )
}

interface FormCardProps {
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  className?: string
}

export function FormCard({ children, onSubmit, className }: FormCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card shadow', className)}>
      <form onSubmit={onSubmit} className="space-y-6 p-6">
        {children}
      </form>
    </div>
  )
}

interface FormGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  )
}

interface SubmitButtonProps {
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'destructive'
  className?: string
}

export function SubmitButton({
  loading = false,
  disabled = false,
  children,
  variant = 'primary',
  className
}: SubmitButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  }

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className
      )}
    >
      {loading ? (
        <>
          <LoadingSpinner size="xs" className="mr-2" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  alignment?: 'left' | 'center' | 'right'
  className?: string
}

export function FormActions({ children, alignment = 'right', className }: FormActionsProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }

  return (
    <div className={cn('flex items-center space-x-3', alignmentClasses[alignment], className)}>
      {children}
    </div>
  )
}