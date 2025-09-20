import React from 'react'
import { cn } from '@/lib/utils'

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
  xl: 'h-12 w-12'
}

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-b-2 border-primary',
          sizeClasses[size]
        )}
        role="status"
        aria-label={label}
      />
      {label && label !== 'Loading...' && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function LoadingOverlay({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" label={label} />
    </div>
  )
}

export function LoadingCard({
  label = 'Loading...',
  className,
  rows = 3,
  showAvatar = false,
  showActions = false
}: {
  label?: string
  className?: string
  rows?: number
  showAvatar?: boolean
  showActions?: boolean
}) {
  return (
    <div className={cn('animate-pulse rounded-lg border border-gray-200 bg-white p-6', className)}>
      {showAvatar && (
        <div className="mb-4 flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/3 rounded bg-gray-200"></div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div
              className={cn(
                'h-4 rounded bg-gray-200',
                index === 0 ? 'w-3/4' : index === rows - 1 ? 'w-2/3' : 'w-full'
              )}
            ></div>
            {index === 0 && <div className="h-3 w-1/2 rounded bg-gray-200"></div>}
          </div>
        ))}
      </div>

      {showActions && (
        <div className="mt-6 flex justify-end space-x-2 border-t border-gray-100 pt-4">
          <div className="h-8 w-16 rounded bg-gray-200"></div>
          <div className="h-8 w-20 rounded bg-gray-200"></div>
        </div>
      )}
    </div>
  )
}

export function LoadingTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="whitespace-nowrap px-6 py-4">
          <div
            className={cn(
              'h-4 rounded bg-gray-200',
              index === 0 ? 'w-3/4' : index === columns - 1 ? 'w-1/2' : 'w-full'
            )}
          ></div>
        </td>
      ))}
    </tr>
  )
}

export function LoadingFormField() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 w-1/4 rounded bg-gray-200"></div>
      <div className="h-10 w-full rounded bg-gray-200"></div>
    </div>
  )
}

export function LoadingMetric() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-gray-200"></div>
          <div className="h-8 w-16 rounded bg-gray-200"></div>
        </div>
        <div className="h-8 w-8 rounded bg-gray-200"></div>
      </div>
      <div className="mt-4">
        <div className="h-3 w-3/4 rounded bg-gray-200"></div>
      </div>
    </div>
  )
}

export function LoadingList({ items = 5 }: { items?: number }) {
  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="animate-pulse p-4">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-3 w-3/4 rounded bg-gray-200"></div>
            </div>
            <div className="h-6 w-16 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  )
}