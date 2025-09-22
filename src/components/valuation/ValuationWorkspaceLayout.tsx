'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calculator,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  TrendingUp,
  DollarSign,
  Percent,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  GitBranch,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface ValuationWorkspaceLayoutProps {
  children: React.ReactNode
  valuationId: string
  valuationData: {
    company_name: string
    valuation_date: string
    type: '409a' | 'purchase_price' | 'tender_offer' | 'ma' | 'litigation'
    status: 'draft' | 'in_progress' | 'review' | 'completed'
    fair_market_value?: number
    selected_methodologies?: {
      enterprise?: string[]
      allocation?: string
      discounts?: string[]
    }
  }
}

const valuationNavigation = {
  '409a': [
    {
      name: 'Overview',
      href: 'overview',
      icon: FileText,
      description: 'Valuation summary and key metrics',
    },
    {
      name: 'Company Information',
      href: 'company',
      icon: Building2,
      description: 'Company details and financials',
    },
    {
      name: 'Enterprise Valuation',
      href: 'enterprise',
      icon: TrendingUp,
      description: 'Market, Income, and Asset approaches',
      submenu: [
        { name: 'Market Approach', href: 'enterprise/market', icon: BarChart3 },
        { name: 'Income Approach', href: 'enterprise/income', icon: DollarSign },
        { name: 'Asset Approach', href: 'enterprise/asset', icon: FileSpreadsheet },
      ],
    },
    {
      name: 'Equity Allocation',
      href: 'allocation',
      icon: Layers,
      description: 'Allocate value across share classes',
      submenu: [
        { name: 'Option Pricing Model', href: 'allocation/opm', icon: Calculator },
        { name: 'PWERM', href: 'allocation/pwerm', icon: GitBranch },
        { name: 'Current Value Method', href: 'allocation/cvm', icon: DollarSign },
        { name: 'Hybrid Method', href: 'allocation/hybrid', icon: Layers },
      ],
    },
    {
      name: 'Discounts',
      href: 'discounts',
      icon: Percent,
      description: 'DLOM and minority discounts',
      submenu: [
        { name: 'DLOM Analysis', href: 'discounts/dlom', icon: Shield },
        { name: 'Minority Discount', href: 'discounts/minority', icon: Percent },
      ],
    },
    {
      name: 'Report',
      href: 'report',
      icon: FileText,
      description: 'Generate valuation report',
    },
    {
      name: 'Settings',
      href: 'settings',
      icon: Settings,
      description: 'Valuation settings and assumptions',
    },
  ],
  purchase_price: [
    {
      name: 'Overview',
      href: 'overview',
      icon: FileText,
    },
    {
      name: 'Transaction Details',
      href: 'transaction',
      icon: DollarSign,
    },
    {
      name: 'Comparable Analysis',
      href: 'comparables',
      icon: BarChart3,
    },
    {
      name: 'Report',
      href: 'report',
      icon: FileText,
    },
  ],
  tender_offer: [
    {
      name: 'Overview',
      href: 'overview',
      icon: FileText,
    },
    {
      name: 'Offer Details',
      href: 'offer',
      icon: DollarSign,
    },
    {
      name: 'Valuation Analysis',
      href: 'valuation',
      icon: Calculator,
    },
    {
      name: 'Report',
      href: 'report',
      icon: FileText,
    },
  ],
  ma: [
    {
      name: 'Overview',
      href: 'overview',
      icon: FileText,
    },
    {
      name: 'Deal Structure',
      href: 'deal',
      icon: GitBranch,
    },
    {
      name: 'Valuation',
      href: 'valuation',
      icon: Calculator,
    },
    {
      name: 'Report',
      href: 'report',
      icon: FileText,
    },
  ],
  litigation: [
    {
      name: 'Overview',
      href: 'overview',
      icon: FileText,
    },
    {
      name: 'Case Details',
      href: 'case',
      icon: Shield,
    },
    {
      name: 'Valuation',
      href: 'valuation',
      icon: Calculator,
    },
    {
      name: 'Report',
      href: 'report',
      icon: FileText,
    },
  ],
}

export default function ValuationWorkspaceLayout({
  children,
  valuationId,
  valuationData,
}: ValuationWorkspaceLayoutProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()

  const navigation =
    valuationNavigation[valuationData.type || '409a'] || valuationNavigation['409a']
  const currentSection = pathname.split(`/valuations/${valuationId}/`)[1] || 'overview'

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'review':
        return 'text-yellow-600 bg-yellow-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'review':
        return <AlertCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Valuation Sidebar */}
        <div className="flex w-80 flex-col border-r bg-sidebar">
          {/* Sidebar Header */}
          <div className="border-b p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/valuations')}
              className="-ml-2 mb-3"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Valuations
            </Button>

            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">{valuationData.company_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {(valuationData.type || '409a').replace('_', ' ').toUpperCase()} Valuation
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={cn('gap-1', getStatusColor(valuationData.status))}>
                  {getStatusIcon(valuationData.status)}
                  {valuationData.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(valuationData.valuation_date).toLocaleDateString()}
                </span>
              </div>

              {valuationData.fair_market_value && (
                <div className="rounded-lg bg-primary/5 p-2">
                  <p className="text-xs text-muted-foreground">Fair Market Value</p>
                  <p className="text-lg font-semibold text-primary">
                    ${valuationData.fair_market_value.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive =
                  currentSection === item.href || currentSection.startsWith(`${item.href}/`)
                const hasSubmenu = 'submenu' in item && item.submenu
                const isExpanded = expandedMenus.includes(item.name)

                return (
                  <div key={item.name}>
                    {hasSubmenu ? (
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={cn(
                          'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            !isExpanded && '-rotate-90'
                          )}
                        />
                      </button>
                    ) : (
                      <Link
                        href={`/valuations/${valuationId}/${item.href}`}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )}

                    {hasSubmenu && isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-3">
                        {item.submenu?.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = currentSection === subItem.href

                          return (
                            <Link
                              key={subItem.name}
                              href={`/valuations/${valuationId}/${subItem.href}`}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all',
                                isSubActive
                                  ? 'bg-primary/10 font-medium text-primary'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              )}
                            >
                              <SubIcon className="h-3.5 w-3.5" />
                              <span>{subItem.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}

                    {'description' in item && item.description && !hasSubmenu && (
                      <p className="ml-7 mt-0.5 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Sidebar Footer - Progress Indicator */}
          <div className="border-t p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[65%] bg-primary transition-all" />
              </div>
              <p className="text-xs text-muted-foreground">
                Complete enterprise valuation to continue
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </TooltipProvider>
  )
}
