import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description: string
  actionButton?: {
    href: string
    icon: LucideIcon
    text: string
  }
}

export function PageHeader({ title, description, actionButton }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">
          {description}
        </p>
      </div>
      {actionButton && (
        <Link href={actionButton.href}>
          <Button className="flex items-center space-x-2">
            <actionButton.icon className="h-4 w-4" />
            <span>{actionButton.text}</span>
          </Button>
        </Link>
      )}
    </div>
  )
}