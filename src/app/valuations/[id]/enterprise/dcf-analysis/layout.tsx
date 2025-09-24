'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator,
  TrendingUp,
  CreditCard,
  DollarSign,
  LineChart,
  BarChart3,
  FileText,
  Settings,
  Percent,
  Clock,
  GitBranch,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface DCFLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default function DCFLayout({ children, params }: DCFLayoutProps) {
  const pathname = usePathname()
  const [valuationId, setValuationId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => setValuationId(id))
  }, [params])

  const dcfNavItems = [
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis`,
      value: 'overview',
      label: 'Overview',
      icon: LineChart,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/history`,
      value: 'history',
      label: 'Historical',
      icon: Clock,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/projections`,
      value: 'projections',
      label: 'Projections',
      icon: TrendingUp,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/wacc`,
      value: 'wacc',
      label: 'WACC',
      icon: Percent,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/working-capital`,
      value: 'working-capital',
      label: 'Working Capital',
      icon: DollarSign,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/capex`,
      value: 'capex',
      label: 'CapEx',
      icon: Settings,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/debt`,
      value: 'debt',
      label: 'Debt',
      icon: CreditCard,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/scenarios`,
      value: 'scenarios',
      label: 'Scenarios',
      icon: GitBranch,
    },
    {
      href: `/valuations/${valuationId}/enterprise/dcf-analysis/qualitative`,
      value: 'qualitative',
      label: 'Qualitative',
      icon: Shield,
    },
  ]

  // Determine the current tab based on pathname
  const getCurrentTab = () => {
    if (pathname.includes('/history')) return 'history'
    if (pathname.includes('/projections')) return 'projections'
    if (pathname.includes('/wacc')) return 'wacc'
    if (pathname.includes('/working-capital')) return 'working-capital'
    if (pathname.includes('/capex')) return 'capex'
    if (pathname.includes('/debt')) return 'debt'
    if (pathname.includes('/scenarios')) return 'scenarios'
    if (pathname.includes('/qualitative')) return 'qualitative'
    return 'overview'
  }

  const currentTab = getCurrentTab()

  if (!valuationId) {
    return <div>{children}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* DCF Navigation Tabs */}
      <Tabs value={currentTab} className="w-full">
        <TabsList className="h-auto w-full justify-start bg-muted/50 p-1">
          {dcfNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.value} href={item.href} className="contents">
                <TabsTrigger
                  value={item.value}
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                </TabsTrigger>
              </Link>
            )
          })}
        </TabsList>
      </Tabs>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  )
}
