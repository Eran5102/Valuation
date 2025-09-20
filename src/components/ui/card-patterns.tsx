import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  LucideIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Stat Card for displaying metrics
interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  loading?: boolean
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  loading = false,
  variant = 'default',
  className,
  onClick
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/20 bg-primary/5',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50'
  }

  const isPositiveChange = change && change > 0
  const ChangeIcon = isPositiveChange ? ArrowUpRight : ArrowDownRight

  return (
    <Card
      className={cn(
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {change !== undefined && (
              <div className="flex items-center space-x-1 text-xs">
                <ChangeIcon
                  className={cn(
                    "h-3 w-3",
                    isPositiveChange ? "text-green-600" : "text-red-600"
                  )}
                />
                <span className={isPositiveChange ? "text-green-600" : "text-red-600"}>
                  {Math.abs(change)}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Info Card for displaying information with an icon
interface InfoCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  children?: React.ReactNode
  actions?: React.ReactNode
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error'
  className?: string
}

export function InfoCard({
  title,
  description,
  icon: Icon,
  iconColor,
  children,
  actions,
  variant = 'default',
  className
}: InfoCardProps) {
  const variantConfig = {
    default: {
      icon: Info,
      iconColor: 'text-primary',
      borderColor: 'border-border'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      borderColor: 'border-red-200'
    }
  }

  const config = variantConfig[variant]
  const IconComponent = Icon || config.icon

  return (
    <Card className={cn(config.borderColor, className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <IconComponent className={cn("h-5 w-5 mt-0.5", iconColor || config.iconColor)} />
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      {actions && <CardFooter>{actions}</CardFooter>}
    </Card>
  )
}

// Clickable Card with hover effects
interface ClickableCardProps {
  title: string
  description?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  icon?: LucideIcon
  onClick?: () => void
  href?: string
  className?: string
  children?: React.ReactNode
}

export function ClickableCard({
  title,
  description,
  badge,
  badgeVariant = 'default',
  icon: Icon,
  onClick,
  href,
  className,
  children
}: ClickableCardProps) {
  const handleClick = () => {
    if (href) {
      window.location.href = href
    } else if (onClick) {
      onClick()
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {badge && (
            <Badge variant={badgeVariant}>{badge}</Badge>
          )}
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      <CardFooter className="flex justify-end">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardFooter>
    </Card>
  )
}

// Empty State Card
interface EmptyStateCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyStateCard({
  title,
  description,
  icon: Icon,
  action,
  className
}: EmptyStateCardProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            className="mt-4"
            variant="outline"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Timeline Card for showing status/progress
interface TimelineCardProps {
  title: string
  items: {
    label: string
    description?: string
    timestamp?: string
    status?: 'completed' | 'current' | 'upcoming'
    icon?: LucideIcon
  }[]
  className?: string
}

export function TimelineCard({ title, items, className }: TimelineCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            const statusConfig = {
              completed: {
                iconColor: 'text-green-600',
                bgColor: 'bg-green-100',
                lineColor: 'bg-green-200'
              },
              current: {
                iconColor: 'text-blue-600',
                bgColor: 'bg-blue-100',
                lineColor: 'bg-gray-200'
              },
              upcoming: {
                iconColor: 'text-gray-400',
                bgColor: 'bg-gray-100',
                lineColor: 'bg-gray-200'
              }
            }

            const config = statusConfig[item.status || 'upcoming']

            return (
              <div key={index} className="flex gap-3">
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    config.bgColor
                  )}>
                    {item.icon ? (
                      <item.icon className={cn("h-4 w-4", config.iconColor)} />
                    ) : item.status === 'completed' ? (
                      <CheckCircle className={cn("h-4 w-4", config.iconColor)} />
                    ) : item.status === 'current' ? (
                      <Clock className={cn("h-4 w-4", config.iconColor)} />
                    ) : (
                      <div className={cn("h-2 w-2 rounded-full", config.iconColor.replace('text-', 'bg-'))} />
                    )}
                  </div>
                  {!isLast && (
                    <div className={cn("w-0.5 h-16 mt-2", config.lineColor)} />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <p className="font-medium text-sm">{item.label}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  )}
                  {item.timestamp && (
                    <p className="mt-1 text-xs text-muted-foreground">{item.timestamp}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Grid Card Layout
interface CardGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function CardGrid({ children, columns = 3, className }: CardGridProps) {
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

// Section Card for grouping related content
interface SectionCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  children: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  className?: string
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <div>
              <CardTitle
                className={cn(
                  "text-lg",
                  collapsible && "cursor-pointer select-none"
                )}
                onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
              >
                {title}
              </CardTitle>
              {description && !isCollapsed && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
          </div>
          {actions}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>{children}</CardContent>
      )}
    </Card>
  )
}