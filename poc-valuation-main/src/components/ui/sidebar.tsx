import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'class-variance-authority'
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Minus,
} from 'lucide-react'
import { useMemo, useEffect, useState, useContext, createContext, useCallback } from 'react'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'

// Sidebar context
type SidebarState = 'expanded' | 'collapsed'

interface SidebarContextValue {
  state: SidebarState
  setState: React.Dispatch<React.SetStateAction<SidebarState>>
  toggleSidebar: () => void
  isMobile: boolean
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// SidebarProvider component for context
export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode
  defaultCollapsed?: boolean
}) {
  // Determine if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Handle sidebar state
  const [state, setState] = useState<SidebarState>(defaultCollapsed ? 'collapsed' : 'expanded')

  // Toggle sidebar state
  const toggleSidebar = useCallback(() => {
    setState((prev) => (prev === 'expanded' ? 'collapsed' : 'expanded'))
  }, [])

  // Context value
  const contextValue = useMemo(
    () => ({
      state,
      setState,
      toggleSidebar,
      isMobile,
    }),
    [state, toggleSidebar, isMobile]
  )

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>
}

// Sidebar variants
const sidebarVariants = cva(
  'relative flex flex-col h-full overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-background border-r',
        sidebar: 'bg-[#212A31] text-white',
      },
      collapsible: {
        none: '',
        icon: 'w-[var(--sidebar-width)]',
        full: 'w-[var(--sidebar-width)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      collapsible: 'none',
    },
  }
)

// Sidebar component
interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  defaultState?: SidebarState
  defaultCollapsed?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({
  className,
  variant,
  collapsible = 'none',
  defaultState,
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
  ...props
}: SidebarProps) {
  // Use the context from SidebarProvider
  const { state, setState, isMobile } = useSidebar()

  // Sync with controlled state
  useEffect(() => {
    if (collapsed !== undefined) {
      setState(collapsed ? 'collapsed' : 'expanded')
    }
  }, [collapsed, setState])

  // Calculate sidebar width based on state
  useEffect(() => {
    if (collapsible === 'none') return

    const root = document.documentElement
    const width = state === 'expanded' ? '240px' : '64px'
    root.style.setProperty('--sidebar-width', width)
  }, [state, collapsible])

  return (
    <div
      className={cn(sidebarVariants({ variant, collapsible, className }))}
      data-sidebar="sidebar"
      data-state={state}
      {...props}
    />
  )
}

// Sidebar content
export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-full flex-col', className)} {...props} />
}

// Sidebar header
export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-14 items-center border-b px-4', className)} {...props} />
}

// Sidebar footer
export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-14 items-center border-t px-4', className)} {...props} />
}

// Sidebar group
export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col', className)} {...props} />
}

// Sidebar group label
export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useSidebar()

  if (state === 'collapsed') {
    return null
  }

  return (
    <div
      className={cn('px-2 py-1 text-xs font-medium', className)}
      data-sidebar="group-label"
      {...props}
    />
  )
}

// Sidebar group content
export function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col', className)} {...props} />
}

// Sidebar menu
export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('flex flex-col gap-0.5 py-1', className)} role="menu" {...props} />
}

// Sidebar menu item
export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('flex flex-col', className)} role="menuitem" {...props} />
}

// Sidebar menu button
interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
}

export function SidebarMenuButton({
  className,
  asChild = false,
  isActive = false,
  tooltip,
  ...props
}: SidebarMenuButtonProps) {
  const { state, isMobile } = useSidebar()
  const Comp = asChild ? Slot : 'button'

  return (
    <TooltipWrapper tooltip={tooltip} state={state} isMobile={isMobile}>
      <Comp
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive && 'bg-accent/10 text-accent',
          className
        )}
        data-sidebar="menu-button"
        data-active={isActive}
        {...props}
      />
    </TooltipWrapper>
  )
}

// Tooltip wrapper
function TooltipWrapper({
  children,
  tooltip,
  state,
  isMobile,
}: {
  children: React.ReactNode
  tooltip?: string
  state: 'expanded' | 'collapsed'
  isMobile: boolean
}) {
  // If there's no tooltip or the sidebar is expanded or we're on mobile, just render the children
  if (!tooltip || state !== 'collapsed' || isMobile) {
    return <>{children}</>
  }

  // Otherwise, wrap the children in a Tooltip
  return (
    <Tooltip content={tooltip} side="right" align="center">
      {children}
    </Tooltip>
  )
}

// Sidebar menu sub
export function SidebarMenuSub({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('flex flex-col gap-0.5 pl-4', className)} role="menu" {...props} />
}

// Sidebar menu sub item
export function SidebarMenuSubItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('flex', className)} role="menuitem" {...props} />
}

// Sidebar menu sub button
interface SidebarMenuSubButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
}

export function SidebarMenuSubButton({
  className,
  asChild = false,
  isActive = false,
  ...props
}: SidebarMenuSubButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-accent/10 text-accent',
        className
      )}
      data-active={isActive}
      {...props}
    />
  )
}

// Sidebar trigger
export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar, state } = useSidebar()

  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      onClick={toggleSidebar}
      {...props}
    >
      {state === 'expanded' ? (
        <ChevronsLeft className="h-4 w-4" />
      ) : (
        <ChevronsRight className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

// Sidebar overlay
export function SidebarOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { state, toggleSidebar } = useSidebar()

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300',
        state === 'expanded' ? 'opacity-100' : 'pointer-events-none opacity-0',
        className
      )}
      onClick={toggleSidebar}
      {...props}
    />
  )
}
