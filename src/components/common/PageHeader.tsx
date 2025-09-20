'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { PageHeaderProps, BreadcrumbItem } from '@/types/common'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs = [],
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 border-b border-gray-200 pb-5', className)}>
      {breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-500 transition-colors hover:text-gray-700"
                  >
                    {item.icon && <item.icon className="mr-1 inline h-4 w-4" />}
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">
                    {item.icon && <item.icon className="mr-1 inline h-4 w-4" />}
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="mt-4 flex md:ml-4 md:mt-0">{actions}</div>}
      </div>
    </div>
  )
}

// Re-export types for convenience
export type { PageHeaderProps, BreadcrumbItem }
