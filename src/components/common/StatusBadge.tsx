'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { StatusBadgeProps } from '@/types/common'
import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      variant: {
        default: '',
        outline: 'bg-transparent',
        secondary: 'bg-gray-50',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2 py-1 text-xs',
        lg: 'px-2.5 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

// Status color mappings
const statusStyles = {
  // Valuation statuses
  draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  in_progress: 'bg-primary/10 text-primary ring-primary/20',
  under_review: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  on_hold: 'bg-red-50 text-red-700 ring-red-600/10',

  // Share class types
  common: 'bg-purple-50 text-purple-700 ring-purple-700/10',
  preferred: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10',

  // Option types
  options: 'bg-orange-50 text-orange-700 ring-orange-700/10',
  warrants: 'bg-amber-50 text-amber-700 ring-amber-700/10',
  rsus: 'bg-pink-50 text-pink-700 ring-pink-700/10',

  // Generic statuses
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  inactive: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  pending: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  approved: 'bg-green-50 text-green-700 ring-green-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/10',
  cancelled: 'bg-gray-50 text-gray-700 ring-gray-600/20',

  // Financial statuses
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  unpaid: 'bg-red-50 text-red-700 ring-red-600/10',
  overdue: 'bg-red-50 text-red-700 ring-red-600/10',
  partial: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
} as const

export function StatusBadge({
  status,
  variant = 'default',
  size = 'md',
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  const statusStyle = statusStyles[normalizedStatus as keyof typeof statusStyles]

  // If no specific status style is found, use a default gray style
  const defaultStyle = 'bg-gray-50 text-gray-700 ring-gray-600/20'
  const appliedStyle = statusStyle || defaultStyle

  return (
    <span
      className={cn(
        statusBadgeVariants({ variant, size }),
        variant === 'default' && appliedStyle,
        variant === 'outline' &&
          `border ${appliedStyle.replace('bg-', 'border-').replace(/text-\w+-\d+/, 'text-current')}`,
        className
      )}
    >
      {formatStatusText(status)}
    </span>
  )
}

function formatStatusText(status: string): string {
  return status
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Utility function to get status color class for custom usage
export function getStatusColorClass(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  return statusStyles[normalizedStatus as keyof typeof statusStyles] || statusStyles.inactive
}

// Available status types for TypeScript
export type StatusType = keyof typeof statusStyles

// Re-export types for convenience
export type { StatusBadgeProps }
