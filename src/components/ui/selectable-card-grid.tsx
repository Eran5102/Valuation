import React from 'react'
import { LucideIcon, ChevronRight } from 'lucide-react'

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
    case 'success': return 'bg-green-100 text-green-800'
    case 'warning': return 'bg-yellow-100 text-yellow-800'
    case 'destructive': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function SelectableCardGrid({
  title,
  description,
  items,
  onItemSelect,
  loading = false,
  emptyState,
  backAction
}: SelectableCardGridProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {emptyState?.title || 'No items found'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {emptyState?.description || 'There are no items to display.'}
          </p>
          {emptyState?.action}
        </div>
      ) : (
        <div className="grid gap-4 max-w-4xl mx-auto">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                onClick={() => onItemSelect(item)}
                className="border border-border rounded-lg p-6 hover:border-primary cursor-pointer transition-colors hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.meta && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.meta}
                        </div>
                      )}
                      {item.extraInfo && (
                        <div className="mt-2">
                          {item.extraInfo}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses(item.badge.variant)}`}>
                        {item.badge.text}
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {backAction.text}
          </button>
        </div>
      )}
    </div>
  )
}