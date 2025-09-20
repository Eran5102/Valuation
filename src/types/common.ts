// Common utility and component type definitions

import { ReactNode, ElementType, ComponentProps } from 'react'

// Utility types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>
export type Nullable<T> = T | null
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Loading state types
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface AsyncState<T> extends LoadingState {
  data: T | null
}

// Form types
export interface FormState<T = Record<string, unknown>> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
}

export interface FormFieldProps<T = string> {
  label: string
  value: T
  onChange: (value: T) => void
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helperText?: string
}

// Component props types
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

export interface ClickableProps {
  onClick?: () => void
  disabled?: boolean
}

export interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  className?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  className?: string
}

export interface LoadingCardProps {
  className?: string
  rows?: number
  showAvatar?: boolean
  showActions?: boolean
}

export interface SummaryCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ElementType
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string | number
    label?: string
  }
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon?: ElementType
  children: ReactNode
  disabled?: boolean
  badge?: string | number
}

// Table types
export interface TableColumn<T = Record<string, unknown>> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: unknown, record: T, index: number) => ReactNode
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
}

export interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    onChange: (page: number, limit: number) => void
  }
  selection?: {
    selectedKeys: string[]
    onSelectionChange: (keys: string[]) => void
    getRowKey: (record: T) => string
  }
  onRowClick?: (record: T, index: number) => void
  className?: string
}

// Modal and dialog types
export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  width?: string | number
  closable?: boolean
  maskClosable?: boolean
  className?: string
}

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
}

// Navigation types
export interface NavItem {
  key: string
  label: string
  href?: string
  icon?: ElementType
  children?: NavItem[]
  badge?: string | number
  disabled?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: ElementType
}

// Search and filter types
export interface SearchConfig {
  placeholder?: string
  searchKeys?: string[]
  debounceMs?: number
}

export interface FilterOption {
  key: string
  label: string
  value: string | number
  count?: number
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'daterange' | 'numberrange'
  options?: FilterOption[]
  placeholder?: string
}

// Error handling types
export interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
}

export interface ErrorReportContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, unknown>
}

// Theme and styling types
export interface ThemeConfig {
  mode: 'light' | 'dark'
  primaryColor: string
  borderRadius: number
  fontFamily: string
}

export interface StyleVariants {
  [key: string]: string | Record<string, string>
}

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void
export type ClickHandler = (event?: Event) => void
export type SubmitHandler<T = Record<string, unknown>> = (data: T) => void | Promise<void>

// Generic component props
export type PolymorphicProps<T extends ElementType> = {
  as?: T
} & ComponentProps<T>

// Data transformation types
export type DataTransformer<TInput, TOutput> = (input: TInput) => TOutput
export type DataValidator<T> = (data: T) => { isValid: boolean; errors: string[] }

// Storage types
export interface StorageProvider {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

// API client types
export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  defaultHeaders?: Record<string, string>
  retryAttempts?: number
  retryDelay?: number
}
