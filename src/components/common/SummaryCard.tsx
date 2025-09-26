'use client'

import React from 'react'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react'
import { SummaryCardProps } from '@/types/common'
import { cn } from '@/lib/utils'

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  action,
  className,
}: SummaryCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null

    switch (trend.direction) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 text-red-600" />
      case 'neutral':
      default:
        return <MinusIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''

    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format numbers with commas for readability
      return val.toLocaleString()
    }
    return val
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-medium text-gray-600">{title}</p>
              {Icon && (
                <div className="flex-shrink-0">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>

            <div className="mt-2">
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{formatValue(value)}</p>
                {trend && (
                  <div className={cn('ml-2 flex items-center text-sm', getTrendColor())}>
                    {getTrendIcon()}
                    <span className="ml-1">{trend.value}</span>
                    {trend.label && <span className="ml-1 text-gray-500">{trend.label}</span>}
                  </div>
                )}
              </div>
            </div>

            {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
          </div>
        </div>

        {action && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Variants for different use cases
export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: Omit<SummaryCardProps, 'action'>) {
  return (
    <SummaryCard
      title={title}
      value={value}
      description={description}
      icon={icon}
      trend={trend}
      className={className}
    />
  )
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  className,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ElementType
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  className?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-6', className)}>
      <div className="flex items-center">
        {icon && (
          <div className={cn('rounded-md p-2', colorClasses[color])}>
            {React.createElement(icon, { className: "h-6 w-6" })}
          </div>
        )}
        <div className={cn('flex-1', icon && 'ml-4')}>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

// Utility function for formatting values
function formatValue(val: string | number): string {
  if (typeof val === 'number') {
    return val.toLocaleString()
  }
  return val
}

// Additional variants from card-patterns.tsx
export { StatCard as StatsCard } from '../ui/card-patterns'
export { InfoCard } from '../ui/card-patterns'
export { ClickableCard } from '../ui/card-patterns'
export { EmptyStateCard } from '../ui/card-patterns'
export { TimelineCard } from '../ui/card-patterns'
export { CardGrid } from '../ui/card-patterns'
export { SectionCard as SectionCardAdvanced } from '../ui/card-patterns'

// Re-export types for convenience
export type { SummaryCardProps }
