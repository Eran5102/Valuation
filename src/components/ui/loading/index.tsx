/**
 * Unified Loading Component System
 * Consolidates all loading states into a single, reusable system
 */

import React from 'react'
import { cn } from '@/lib/utils'

// Re-export skeleton for compatibility
export { Skeleton } from '../skeleton'

// ================== Core Loading Spinner ==================
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  label?: string
  fullScreen?: boolean
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn('animate-spin rounded-full border-b-2 border-primary', sizeClasses[size])}
        role="status"
        aria-label={label}
      />
      {label && label !== 'Loading...' && <span className="sr-only">{label}</span>}
    </div>
  )

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{spinner}</div>
  }

  return spinner
}

// ================== Loading Overlay ==================
export function LoadingOverlay({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" label={label} />
    </div>
  )
}

// ================== Skeleton Components ==================
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'table' | 'form' | 'metric' | 'list' | 'avatar'
  lines?: number
  showActions?: boolean
}

export function LoadingSkeleton({
  variant = 'default',
  lines = 3,
  className,
  showActions = false,
  ...props
}: SkeletonProps) {
  switch (variant) {
    case 'card':
      return <LoadingCard rows={lines} showActions={showActions} className={className} />
    case 'table':
      return <LoadingTableRow columns={lines} />
    case 'form':
      return <LoadingFormField />
    case 'metric':
      return <LoadingMetric />
    case 'list':
      return <LoadingList items={lines} />
    case 'avatar':
      return <LoadingAvatar className={className} />
    default:
      return (
        <div className={cn('animate-pulse space-y-2', className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 rounded bg-muted',
                i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      )
  }
}

// ================== Specialized Loading Components ==================
function LoadingCard({
  className,
  rows = 3,
  showAvatar = false,
  showActions = false,
}: {
  className?: string
  rows?: number
  showAvatar?: boolean
  showActions?: boolean
}) {
  return (
    <div className={cn('animate-pulse rounded-lg border bg-card p-6', className)}>
      {showAvatar && (
        <div className="mb-4 flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-muted"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 rounded bg-muted"></div>
            <div className="h-3 w-1/3 rounded bg-muted"></div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div
              className={cn(
                'h-4 rounded bg-muted',
                index === 0 ? 'w-3/4' : index === rows - 1 ? 'w-2/3' : 'w-full'
              )}
            />
            {index === 0 && <div className="h-3 w-1/2 rounded bg-muted" />}
          </div>
        ))}
      </div>

      {showActions && (
        <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
          <div className="h-8 w-16 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
        </div>
      )}
    </div>
  )
}

function LoadingTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="whitespace-nowrap px-6 py-4">
          <div
            className={cn(
              'h-4 rounded bg-muted',
              index === 0 ? 'w-3/4' : index === columns - 1 ? 'w-1/2' : 'w-full'
            )}
          />
        </td>
      ))}
    </tr>
  )
}

function LoadingFormField() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 w-1/4 rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
    </div>
  )
}

function LoadingMetric() {
  return (
    <div className="animate-pulse rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-8 w-16 rounded bg-muted" />
        </div>
        <div className="h-8 w-8 rounded bg-muted" />
      </div>
      <div className="mt-4">
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  )
}

function LoadingList({ items = 5 }: { items?: number }) {
  return (
    <div className="divide-y rounded-lg border bg-card">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse p-4">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
            <div className="h-6 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingAvatar({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="h-10 w-10 rounded-full bg-muted" />
    </div>
  )
}

// ================== Loading State Wrapper ==================
interface LoadingWrapperProps {
  loading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  fullScreen?: boolean
  overlay?: boolean
}

export function LoadingWrapper({
  loading,
  children,
  skeleton,
  fullScreen = false,
  overlay = false,
}: LoadingWrapperProps) {
  if (!loading) return <>{children}</>

  if (overlay) return <LoadingOverlay />
  if (fullScreen) return <LoadingSpinner fullScreen />
  if (skeleton) return <>{skeleton}</>

  return <LoadingSkeleton />
}

// ================== Suspense Fallback ==================
export function SuspenseFallback({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingSpinner label={message} />
    </div>
  )
}

// Export all components for backward compatibility
export { LoadingCard, LoadingTableRow, LoadingFormField, LoadingMetric, LoadingList }
