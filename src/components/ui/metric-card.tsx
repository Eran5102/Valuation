import React from 'react'
import { cn } from '@/lib/utils'
import { MetricCardProps } from '@/types'

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}) => {
  const getColorClasses = () => {
    if (trend === 'up') return 'bg-green-50 text-green-600'
    if (trend === 'down') return 'bg-red-50 text-red-600'
    return 'bg-primary/10 text-primary'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return '↗'
    if (trend === 'down') return '↘'
    return null
  }

  return (
    <div className={cn('rounded-lg p-4 text-center', getColorClasses(), className)}>
      {Icon && (
        <div className="mb-2 flex justify-center">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex items-center justify-center gap-1">
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {getTrendIcon() && <span className="text-lg">{getTrendIcon()}</span>}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{title}</div>
      {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
    </div>
  )
}
