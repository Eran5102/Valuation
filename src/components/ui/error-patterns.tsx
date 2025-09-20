'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, XCircle, AlertTriangle, Info, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorPage
          title="Something went wrong"
          description={this.state.error?.message || "An unexpected error occurred"}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}

// Error Alert Component
interface ErrorAlertProps {
  title?: string
  message: string
  variant?: 'default' | 'destructive' | 'warning'
  onRetry?: () => void
  className?: string
}

export function ErrorAlert({
  title = 'Error',
  message,
  variant = 'destructive',
  onRetry,
  className
}: ErrorAlertProps) {
  const variantConfig = {
    default: {
      icon: AlertCircle,
      alertVariant: 'default' as const
    },
    destructive: {
      icon: XCircle,
      alertVariant: 'destructive' as const
    },
    warning: {
      icon: AlertTriangle,
      alertVariant: 'default' as const
    }
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <Alert variant={config.alertVariant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Inline Error Message Component
interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn("flex items-center gap-1 text-sm text-destructive", className)}>
      <AlertCircle className="h-3 w-3" />
      <span>{message}</span>
    </div>
  )
}

// Error Card Component
interface ErrorCardProps {
  title?: string
  message: string
  details?: string
  onRetry?: () => void
  showHomeButton?: boolean
  className?: string
}

export function ErrorCard({
  title = 'An error occurred',
  message,
  details,
  onRetry,
  showHomeButton = false,
  className
}: ErrorCardProps) {
  return (
    <Card className={cn("border-destructive", className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1 text-destructive">
              {message}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {details && (
        <CardContent>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
            {details}
          </pre>
        </CardContent>
      )}
      {(onRetry || showHomeButton) && (
        <CardContent className="flex gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Full Page Error Component
interface ErrorPageProps {
  title?: string
  description?: string
  statusCode?: number
  onReset?: () => void
  showHomeButton?: boolean
  className?: string
}

export function ErrorPage({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again later.',
  statusCode,
  onReset,
  showHomeButton = true,
  className
}: ErrorPageProps) {
  return (
    <div className={cn("flex min-h-[400px] items-center justify-center p-4", className)}>
      <div className="text-center max-w-md">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        {statusCode && (
          <div className="mb-2 text-4xl font-bold text-muted-foreground">
            {statusCode}
          </div>
        )}
        <h1 className="mb-2 text-2xl font-bold">{title}</h1>
        <p className="mb-6 text-muted-foreground">{description}</p>
        <div className="flex justify-center gap-3">
          {onReset && (
            <Button onClick={onReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Link href="/">
              <Button variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// Form Error Summary Component
interface FormErrorSummaryProps {
  errors: Record<string, string | string[]>
  title?: string
  className?: string
}

export function FormErrorSummary({
  errors,
  title = 'Please correct the following errors:',
  className
}: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, value]) => value)

  if (errorEntries.length === 0) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {errorEntries.map(([field, message]) => (
            <li key={field}>
              <strong className="capitalize">{field.replace(/_/g, ' ')}:</strong>{' '}
              {Array.isArray(message) ? message.join(', ') : message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

// API Error Handler Component
interface APIErrorProps {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function APIError({ error, onRetry, className }: APIErrorProps) {
  let message = 'An unexpected error occurred'
  let statusCode: number | undefined

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'object' && error !== null) {
    const err = error as any
    if (err.message) message = err.message
    if (err.statusCode) statusCode = err.statusCode
    if (err.status) statusCode = err.status
  } else if (typeof error === 'string') {
    message = error
  }

  return (
    <ErrorAlert
      title={statusCode ? `Error ${statusCode}` : 'API Error'}
      message={message}
      variant="destructive"
      onRetry={onRetry}
      className={className}
    />
  )
}

// Empty State with Error
interface EmptyErrorStateProps {
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyErrorState({
  title = 'No data found',
  description = 'Unable to load the requested data',
  icon: Icon = Info,
  action,
  className
}: EmptyErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
      <div className="rounded-full bg-muted p-3 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Network Error Component
interface NetworkErrorProps {
  onRetry?: () => void
  className?: string
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorAlert
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      variant="warning"
      onRetry={onRetry}
      className={className}
    />
  )
}

// Validation Error Component
interface ValidationErrorProps {
  errors: string[]
  title?: string
  className?: string
}

export function ValidationError({
  errors,
  title = 'Validation Failed',
  className
}: ValidationErrorProps) {
  if (errors.length === 0) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {errors.length === 1 ? (
          errors[0]
        ) : (
          <ul className="mt-2 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Not Found Error Component
interface NotFoundErrorProps {
  itemType?: string
  itemId?: string
  showHomeButton?: boolean
  className?: string
}

export function NotFoundError({
  itemType = 'Page',
  itemId,
  showHomeButton = true,
  className
}: NotFoundErrorProps) {
  return (
    <ErrorPage
      title={`${itemType} not found`}
      description={itemId ? `The ${itemType.toLowerCase()} with ID "${itemId}" could not be found.` : `The requested ${itemType.toLowerCase()} could not be found.`}
      statusCode={404}
      showHomeButton={showHomeButton}
      className={className}
    />
  )
}

// Permission Error Component
interface PermissionErrorProps {
  resource?: string
  action?: string
  showHomeButton?: boolean
  className?: string
}

export function PermissionError({
  resource,
  action = 'access',
  showHomeButton = true,
  className
}: PermissionErrorProps) {
  return (
    <ErrorPage
      title="Permission Denied"
      description={resource ? `You do not have permission to ${action} this ${resource}.` : `You do not have permission to ${action} this resource.`}
      statusCode={403}
      showHomeButton={showHomeButton}
      className={className}
    />
  )
}