import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  icon?: ReactNode
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, icon, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 border-b px-6 pb-4 pt-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-teal flex items-center gap-2 text-2xl font-bold tracking-tight">
            {icon && <span className="text-teal">{icon}</span>}
            {title}
          </h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
