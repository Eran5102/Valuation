'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative space-y-8', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Timeline.displayName = 'Timeline'

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, active, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-start gap-4',
          active && 'font-semibold',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineItem.displayName = 'TimelineItem'

interface TimelinePointProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const TimelinePoint = React.forwardRef<HTMLDivElement, TimelinePointProps>(
  ({ className, active, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative z-10 flex h-3 w-3 flex-shrink-0 rounded-full border-2 bg-background',
          {
            'border-primary': variant === 'default',
            'border-green-500': variant === 'success',
            'border-yellow-500': variant === 'warning',
            'border-red-500': variant === 'error',
            'h-4 w-4': active,
          },
          className
        )}
        {...props}
      />
    )
  }
)
TimelinePoint.displayName = 'TimelinePoint'

interface TimelineConnectorProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'absolute left-[5px] top-3 h-full w-0.5 bg-border -z-10',
          className
        )}
        {...props}
      />
    )
  }
)
TimelineConnector.displayName = 'TimelineConnector'

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-grow space-y-2', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineContent.displayName = 'TimelineContent'

interface TimelineHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineHeader = React.forwardRef<HTMLDivElement, TimelineHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineHeader.displayName = 'TimelineHeader'

interface TimelineBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const TimelineBody = React.forwardRef<HTMLDivElement, TimelineBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineBody.displayName = 'TimelineBody'

const TimelineIcon = TimelinePoint
const TimelineTitle = TimelineHeader
const TimelineDescription = TimelineBody

export {
  Timeline,
  TimelineItem,
  TimelinePoint,
  TimelineConnector,
  TimelineContent,
  TimelineHeader,
  TimelineBody,
  TimelineIcon,
  TimelineTitle,
  TimelineDescription,
}