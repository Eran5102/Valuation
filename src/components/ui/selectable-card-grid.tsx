import React from 'react'
import { LucideIcon, ChevronRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface SelectableCard {
  id: string | number
  title: string
  description?: string
  meta?: string
  icon: LucideIcon
  badge?: {
    text: string
    variant: 'default' | 'success' | 'warning' | 'destructive'
  }
  extraInfo?: React.ReactNode
}

interface SelectableCardGridProps {
  title: string
  description: string
  items: SelectableCard[]
  onItemSelect: (item: SelectableCard) => void
  loading?: boolean
  emptyState?: {
    title: string
    description: string
    action?: React.ReactNode
  }
  backAction?: {
    text: string
    onClick: () => void
  }
}

const getBadgeClasses = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'bg-green-100 text-green-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'destructive':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function SelectableCardGrid({
  title,
  description,
  items,
  onItemSelect,
  loading = false,
  emptyState,
  backAction,
}: SelectableCardGridProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="py-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            {emptyState?.title || 'No items found'}
          </h3>
          <p className="mb-6 text-muted-foreground">
            {emptyState?.description || 'There are no items to display.'}
          </p>
          {emptyState?.action}
        </div>
      ) : (
        <div className="mx-auto grid max-w-4xl gap-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                onClick={() => onItemSelect(item)}
                className="cursor-pointer rounded-lg border border-border p-6 transition-colors hover:border-primary hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      {item.meta && (
                        <div className="mt-1 text-sm text-muted-foreground">{item.meta}</div>
                      )}
                      {item.extraInfo && <div className="mt-2">{item.extraInfo}</div>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getBadgeClasses(item.badge.variant)}`}
                      >
                        {item.badge.text}
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {backAction && (
        <div className="text-center">
          <button
            onClick={backAction.onClick}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {backAction.text}
          </button>
        </div>
      )}
    </div>
  )
}
