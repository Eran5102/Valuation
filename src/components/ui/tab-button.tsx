import React from 'react'
import { cn } from '@/lib/utils'

export interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon?: React.ElementType
  children: React.ReactNode
  disabled?: boolean
}

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon: Icon,
  children,
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )}
  >
    {Icon && <Icon className="mr-2 h-4 w-4" />}
    {children}
  </button>
)
