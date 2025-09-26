'use client'

import React, { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PanelLeftClose, PanelLeft, ChevronDown, ChevronRight, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface SidebarNavItem {
  id: string
  name: string
  href?: string
  icon?: LucideIcon
  badge?: string | ReactNode
  submenu?: SidebarNavItem[]
  onClick?: () => void
  isActive?: boolean
  disabled?: boolean
  tooltip?: string
}

export interface SharedSidebarProps {
  isCollapsed: boolean
  onToggle?: () => void
  position?: 'left' | 'right'
  className?: string
  width?: string
  collapsedWidth?: string
  showToggleButton?: boolean
  header?: ReactNode
  footer?: ReactNode
  items: SidebarNavItem[]
  expandedMenus?: string[]
  onExpandMenu?: (menuId: string) => void
  variant?: 'default' | 'compact'
}

export function SharedSidebar({
  isCollapsed,
  onToggle,
  position = 'left',
  className,
  width = 'w-64',
  collapsedWidth = 'w-20',
  showToggleButton = true,
  header,
  footer,
  items,
  expandedMenus: externalExpandedMenus,
  onExpandMenu: externalOnExpandMenu,
  variant = 'default',
}: SharedSidebarProps) {
  const pathname = usePathname()
  const [internalExpandedMenus, setInternalExpandedMenus] = useState<string[]>([])

  // Use external state if provided, otherwise use internal state
  const expandedMenus = externalExpandedMenus ?? internalExpandedMenus
  const toggleSubmenu =
    externalOnExpandMenu ??
    ((itemId: string) => {
      setInternalExpandedMenus((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      )
    })

  const renderNavItem = (item: SidebarNavItem, depth = 0) => {
    const Icon = item.icon
    const isActive = item.isActive ?? (item.href ? pathname === item.href : false)
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedMenus.includes(item.id)
    const isSubmenuActive =
      hasSubmenu &&
      item.submenu?.some(
        (subItem) => subItem.isActive ?? (subItem.href ? pathname === subItem.href : false)
      )

    // Compact variant styling for nested items
    const isCompact = variant === 'compact'
    const itemPadding = isCompact ? 'px-2 py-1.5' : 'px-3 py-2.5'
    const iconSize = isCompact ? 'h-4 w-4' : 'h-5 w-5'
    const iconContainerSize = isCompact ? 'h-7 w-7' : 'h-9 w-9'
    const fontSize = isCompact ? 'text-sm' : 'text-sm'

    if (hasSubmenu) {
      // Menu with submenu
      const menuButton = (
        <button
          onClick={() => !isCollapsed && toggleSubmenu(item.id)}
          disabled={item.disabled}
          className={cn(
            'group flex w-full items-center justify-between rounded-lg font-medium transition-all duration-200',
            itemPadding,
            fontSize,
            isActive || isSubmenuActive
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-gray-200 hover:bg-gray-700 hover:text-white',
            item.disabled && 'cursor-not-allowed opacity-50',
            isCollapsed && 'justify-center px-0 py-3',
            depth > 0 && 'ml-3'
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className={cn(
                  'flex items-center justify-center rounded-lg transition-colors',
                  iconContainerSize,
                  isActive || isSubmenuActive ? 'bg-primary-foreground/10' : 'bg-gray-700'
                )}
              >
                <Icon
                  className={cn(
                    iconSize,
                    isActive || isSubmenuActive ? 'text-primary-foreground' : 'text-gray-300'
                  )}
                />
              </div>
            )}
            {!isCollapsed && <span>{item.name}</span>}
          </div>
          {!isCollapsed && (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                !isExpanded && '-rotate-90'
              )}
            />
          )}
        </button>
      )

      return (
        <div key={item.id}>
          {isCollapsed && item.tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
              <TooltipContent side={position === 'right' ? 'left' : 'right'}>
                <div>
                  <div className="font-medium">{item.name}</div>
                  {item.submenu && (
                    <div className="mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <div key={subItem.id} className="text-xs hover:text-primary">
                          {subItem.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            menuButton
          )}

          {hasSubmenu && isExpanded && !isCollapsed && (
            <div className="ml-3 mt-2 space-y-1 border-l-2 border-gray-600 pl-3">
              {item.submenu?.map((subItem) => renderNavItem(subItem, depth + 1))}
            </div>
          )}
        </div>
      )
    } else {
      // Regular menu item
      const itemContent = (
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                'flex items-center justify-center rounded-lg transition-colors',
                iconContainerSize,
                isActive ? 'bg-primary-foreground/10' : 'bg-gray-700'
              )}
            >
              <Icon
                className={cn(iconSize, isActive ? 'text-primary-foreground' : 'text-gray-300')}
              />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex flex-1 items-center gap-2">
              <span>{item.name}</span>
              {item.badge &&
                (typeof item.badge === 'string' ? (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                ) : (
                  item.badge
                ))}
            </div>
          )}
        </div>
      )

      const itemClasses = cn(
        'relative flex items-center rounded-lg font-medium transition-all duration-200',
        itemPadding,
        fontSize,
        isActive
          ? 'before:bg-primary-foreground/60 bg-primary text-primary-foreground shadow-sm before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-r-full'
          : 'text-gray-200 hover:bg-gray-700 hover:text-white',
        item.disabled && 'cursor-not-allowed opacity-50',
        isCollapsed && 'justify-center px-0 py-3',
        depth > 0 &&
          cn(
            'ml-2',
            isActive
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          )
      )

      const menuItem = item.href ? (
        <Link
          href={item.href}
          className={itemClasses}
          onClick={item.onClick}
          aria-disabled={item.disabled}
        >
          {itemContent}
        </Link>
      ) : (
        <button
          onClick={item.onClick}
          disabled={item.disabled}
          className={cn(itemClasses, 'w-full')}
        >
          {itemContent}
        </button>
      )

      if (isCollapsed && item.tooltip) {
        return (
          <div key={item.id}>
            <Tooltip>
              <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
              <TooltipContent side={position === 'right' ? 'left' : 'right'}>
                {item.tooltip || item.name}
              </TooltipContent>
            </Tooltip>
          </div>
        )
      }

      return <div key={item.id}>{menuItem}</div>
    }
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex h-screen flex-shrink-0 flex-col border-r border-gray-600 shadow-sm transition-all duration-300',
          isCollapsed ? collapsedWidth : width,
          position === 'right' && 'border-l border-r-0',
          className
        )}
        style={{ backgroundColor: '#2E3944' }}
      >
        {/* Header */}
        {header && <div className="border-b border-gray-600 p-4 text-gray-100">{header}</div>}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => renderNavItem(item))}
        </nav>

        {/* Footer */}
        {footer && <div className="border-t border-gray-600 p-4 text-gray-100">{footer}</div>}
      </div>
    </TooltipProvider>
  )
}
