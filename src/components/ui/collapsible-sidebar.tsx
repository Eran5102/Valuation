'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PanelLeftClose, PanelLeft, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CollapsibleSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  position?: 'left' | 'right'
  className?: string
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  width?: string
  collapsedWidth?: string
  showToggleButton?: boolean
}

export function CollapsibleSidebar({
  isCollapsed,
  onToggle,
  position = 'left',
  className,
  children,
  header,
  footer,
  width = 'w-80',
  collapsedWidth = 'w-16',
  showToggleButton = true,
}: CollapsibleSidebarProps) {
  const isRight = position === 'right'

  return (
    <TooltipProvider>
      <div className="relative flex">
        {/* Sidebar */}
        <div
          className={cn(
            'flex flex-col transition-all duration-300 ease-in-out',
            isCollapsed ? collapsedWidth : width,
            className
          )}
        >
          <div className="h-full overflow-y-auto">
            {/* Header */}
            {header && <div className="sticky top-0 z-10 border-b bg-inherit p-4">{header}</div>}

            {/* Content */}
            <div className={cn('flex-1', isCollapsed && 'px-2')}>{children}</div>

            {/* Footer */}
            {footer && <div className="border-t bg-inherit p-4">{footer}</div>}
          </div>
        </div>

        {/* Toggle Button - Outside the sidebar */}
        {showToggleButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              'absolute top-3 z-50 h-7 w-7 rounded-md border bg-background shadow-sm transition-all hover:shadow-md',
              position === 'right'
                ? isCollapsed
                  ? 'right-14'
                  : `right-[${width.replace('w-', '')}]`
                : isCollapsed
                  ? 'left-14'
                  : 'left-[15rem]'
            )}
          >
            {position === 'right' ? (
              isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )
            ) : isCollapsed ? (
              <PanelLeftClose className="h-4 w-4 rotate-180" />
            ) : (
              <PanelLeft className="h-4 w-4 rotate-180" />
            )}
          </Button>
        )}
      </div>
    </TooltipProvider>
  )
}

export interface SidebarItemProps {
  icon: React.ElementType
  label: string
  isActive?: boolean
  isCollapsed?: boolean
  onClick?: () => void
  href?: string
  badge?: ReactNode
  tooltip?: string
}

export function SidebarItem({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  onClick,
  badge,
  tooltip,
}: SidebarItemProps) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-accent',
        isActive && 'bg-accent shadow-sm',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <div className="rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      {!isCollapsed && (
        <>
          <div className="flex-1">
            <div className="font-medium">{label}</div>
          </div>
          {badge}
        </>
      )}
    </button>
  )

  if (isCollapsed && tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}
