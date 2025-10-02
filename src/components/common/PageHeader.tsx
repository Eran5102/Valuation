'use client'

import Link from 'next/link'
import { PageHeaderProps, BreadcrumbItem } from '@/types/common'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

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
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <span key={index} className="flex items-center">
                <BreadcrumbItemUI>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.href} className="flex items-center">
                        {item.icon && <item.icon className="mr-1 h-4 w-4" />}
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="flex items-center">
                      {item.icon && <item.icon className="mr-1 h-4 w-4" />}
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItemUI>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
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
