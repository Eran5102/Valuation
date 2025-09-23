import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useFormContext } from 'react-hook-form'

// Types for the different field configurations
interface BaseFieldProps {
  label?: string
  description?: string
  required?: boolean
  disabled?: boolean
  className?: string
  labelClassName?: string
  inputClassName?: string
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea'
  placeholder?: string
  rows?: number
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select'
  options: { value: string; label: string }[]
  placeholder?: string
}

interface CheckboxFieldProps extends BaseFieldProps {
  type: 'checkbox'
  checkboxLabel?: string
}

interface SwitchFieldProps extends BaseFieldProps {
  type: 'switch'
  switchLabel?: string
}

interface DateFieldProps extends BaseFieldProps {
  type: 'date'
  placeholder?: string
}

type FieldProps =
  | TextFieldProps
  | TextareaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps
  | SwitchFieldProps
  | DateFieldProps

export function FormFieldComponent({ name, ...props }: { name: string } & FieldProps) {
  const form = useFormContext()

  if (!form) {
    throw new Error('FormField must be used within a Form component')
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={props.className}>
          {props.label && (
            <FormLabel className={cn(props.labelClassName)} required={props.required}>
              {props.label}
            </FormLabel>
          )}
          <FormControl>
            <FieldInput field={field} {...props} />
          </FormControl>
          {props.description && (
            <p className="text-sm text-muted-foreground">{props.description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function FieldInput({ field, ...props }: any) {
  switch (props.type) {
    case 'textarea':
      return (
        <Textarea
          {...field}
          placeholder={props.placeholder}
          disabled={props.disabled}
          rows={props.rows || 4}
          className={props.inputClassName}
          required={props.required}
        />
      )
    case 'select':
      return (
        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={props.disabled}>
          <SelectTrigger className={props.inputClassName} required={props.required}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={props.disabled}
            id={field.name}
            className={props.inputClassName}
          />
          {props.checkboxLabel && (
            <label htmlFor={field.name} className="cursor-pointer text-sm font-medium leading-none">
              {props.checkboxLabel}
            </label>
          )}
        </div>
      )
    case 'switch':
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={props.disabled}
            id={field.name}
            className={props.inputClassName}
          />
          {props.switchLabel && (
            <Label htmlFor={field.name} className="cursor-pointer">
              {props.switchLabel}
            </Label>
          )}
        </div>
      )
    case 'date':
      return (
        <DatePicker
          date={field.value ? new Date(field.value) : undefined}
          setDate={(date) => field.onChange(date)}
          disabled={props.disabled}
          className={props.inputClassName}
        />
      )
    case 'number':
      return (
        <Input
          {...field}
          type="number"
          placeholder={props.placeholder}
          disabled={props.disabled}
          className={props.inputClassName}
          required={props.required}
          onChange={(e) => field.onChange(e.target.valueAsNumber || null)}
        />
      )
    default:
      return (
        <Input
          {...field}
          type={props.type}
          placeholder={props.placeholder}
          disabled={props.disabled}
          className={props.inputClassName}
          required={props.required}
        />
      )
  }
}

// Standalone field components for use outside of forms
export function InputField({
  label,
  description,
  required,
  disabled,
  className,
  labelClassName,
  inputClassName,
  ...props
}: Omit<TextFieldProps, 'type'> & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = React.useId()

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className={labelClassName} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={id}
        disabled={disabled}
        required={required}
        className={inputClassName}
        {...props}
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

export function TextareaField({
  label,
  description,
  required,
  disabled,
  className,
  labelClassName,
  inputClassName,
  ...props
}: Omit<TextareaFieldProps, 'type'> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = React.useId()

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className={labelClassName} required={required}>
          {label}
        </Label>
      )}
      <Textarea
        id={id}
        disabled={disabled}
        required={required}
        className={inputClassName}
        rows={props.rows || 4}
        {...props}
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

export function SelectField({
  label,
  description,
  required,
  disabled,
  className,
  labelClassName,
  inputClassName,
  options,
  placeholder,
  value,
  onChange,
}: Omit<SelectFieldProps, 'type'> & {
  value?: string
  onChange?: (value: string) => void
}) {
  const id = React.useId()

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className={labelClassName} required={required}>
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={inputClassName} id={id} required={required}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
