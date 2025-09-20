'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ className, children, open, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open || false)

    React.useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open)
      }
    }, [open])

    const handleToggle = () => {
      const newState = !isOpen
      setIsOpen(newState)
      onOpenChange?.(newState)
    }

    return (
      <div ref={ref} className={cn('', className)} data-state={isOpen ? 'open' : 'closed'}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child) && child.type === CollapsibleTrigger
            ? React.cloneElement(child, { onClick: handleToggle } as any)
            : child
        )}
      </div>
    )
  }
)
Collapsible.displayName = 'Collapsible'

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex w-full items-center justify-between py-2 font-medium transition-all hover:underline',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, ...props }, ref) => {
    const collapsibleElement = React.useContext(CollapsibleContext)
    const isOpen = collapsibleElement?.getAttribute('data-state') === 'open'

    if (!isOpen) return null

    return (
      <div ref={ref} className={cn('overflow-hidden transition-all', className)} {...props}>
        {children}
      </div>
    )
  }
)
CollapsibleContent.displayName = 'CollapsibleContent'

const CollapsibleContext = React.createContext<HTMLDivElement | null>(null)

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
