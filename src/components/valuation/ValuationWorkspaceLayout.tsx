'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import {
  Calculator,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
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
  Table,
  Sliders,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  CreditCard,
  Users,
  Bell,
  Search,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SharedSidebar, SidebarNavItem } from '@/components/ui/shared-sidebar'
import { useMethodologyStore } from '@/hooks/useMethodologyStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

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
      name: 'Assumptions',
      href: 'assumptions',
      icon: Sliders,
      description: 'Configure valuation assumptions',
    },
    {
      name: 'Cap Table',
      href: 'cap-table',
      icon: Table,
      description: 'Manage share classes and options',
    },
    // Enterprise Valuation and Equity Allocation are dynamically added based on selected methodologies
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { methodologies } = useMethodologyStore()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { currentOrganization } = useOrganization()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Build dynamic navigation based on selected methodologies
  const navigation = useMemo(() => {
    const baseNav =
      (valuationNavigation as any)[valuationData.type?.toLowerCase() || '409a'] ||
      valuationNavigation['409a']

    // For non-409a valuations, return the base navigation
    // For 409a valuations (or when type is not set), build dynamic nav
    const normalizedType = valuationData.type?.toLowerCase()
    if (normalizedType && normalizedType !== '409a') {
      return baseNav
    }

    // Get enabled methodologies from store
    const enabledMethodologies = methodologies.filter((m) => m.enabled)

    // Build dynamic navigation
    const dynamicNav = []

    // Always include these core items
    dynamicNav.push(
      baseNav.find((item: any) => item.name === 'Overview'),
      baseNav.find((item: any) => item.name === 'Assumptions'),
      baseNav.find((item: any) => item.name === 'Cap Table')
    )

    // Group methodologies by category
    const hasIncome = enabledMethodologies.some((m) => m.category === 'income')
    const hasMarket = enabledMethodologies.some((m) => m.category === 'market')
    const hasAsset = enabledMethodologies.some((m) => m.category === 'asset')

    // Add Enterprise Valuation with dynamic submenu
    if (hasIncome || hasMarket || hasAsset) {
      const enterpriseSubmenu = []

      // Add methodology-specific pages
      enabledMethodologies.forEach((method) => {
        if (method.category === 'income' && method.route) {
          // DCF gets special treatment with additional schedules
          if (method.id === 'dcf') {
            enterpriseSubmenu.push({
              name: 'DCF Analysis',
              href: `enterprise/${method.route}`,
              icon: Calculator,
            })
            // DCF supporting schedules are now accessible via tabs within the DCF Analysis page
            // No need to add them separately to the sidebar
          } else {
            enterpriseSubmenu.push({
              name: method.name,
              href: `enterprise/${method.route}`,
              icon: TrendingUp,
            })
          }
        } else if (method.category === 'market' && method.route) {
          // Special handling for OPM Backsolve - put it at the root level
          if (method.id === 'opm_backsolve') {
            // This will be added directly to dynamicNav later
          } else {
            enterpriseSubmenu.push({
              name: method.name,
              href: `enterprise/${method.route}`,
              icon: BarChart3,
            })
          }
        } else if (method.category === 'asset' && method.route) {
          enterpriseSubmenu.push({
            name: method.name,
            href: `enterprise/${method.route}`,
            icon: FileSpreadsheet,
          })
        }
      })

      // Add category summaries if there are multiple methods in a category
      if (hasMarket && enabledMethodologies.filter((m) => m.category === 'market').length > 1) {
        enterpriseSubmenu.unshift({
          name: 'Market Approach Summary',
          href: 'enterprise/market',
          icon: BarChart3,
        })
      }
      if (hasIncome && enabledMethodologies.filter((m) => m.category === 'income').length > 1) {
        enterpriseSubmenu.unshift({
          name: 'Income Approach Summary',
          href: 'enterprise/income',
          icon: DollarSign,
        })
      }
      if (hasAsset && enabledMethodologies.filter((m) => m.category === 'asset').length > 1) {
        enterpriseSubmenu.unshift({
          name: 'Asset Approach Summary',
          href: 'enterprise/asset',
          icon: FileSpreadsheet,
        })
      }

      dynamicNav.push({
        name: 'Enterprise Valuation',
        href: 'enterprise',
        icon: TrendingUp,
        description: 'Selected valuation methodologies',
        submenu: enterpriseSubmenu,
      })
    }

    // Add OPM Backsolve to main nav if selected (it's now under Market Approach)
    const opmBacksolve = enabledMethodologies.find((m) => m.id === 'opm_backsolve')
    if (opmBacksolve && opmBacksolve.enabled) {
      dynamicNav.push({
        name: 'OPM Backsolve',
        href: 'allocation/opm',
        icon: Calculator,
        description: 'Option Pricing Model backsolve from recent transaction',
      })
    }

    // Add allocation methods dynamically based on selection
    const allocationMethodologies = enabledMethodologies.filter((m) => m.category === 'allocation')

    if (allocationMethodologies.length > 0) {
      const allocationSubmenu: any[] = []

      // Add each selected allocation methodology
      allocationMethodologies.forEach((method) => {
        if (method.id === 'opm') {
          // Add OPM to submenu (not PWERM, which goes to main nav)
          allocationSubmenu.push({
            name: 'Option Pricing Model',
            href: 'allocation/opm',
            icon: Calculator,
          })
        } else if (method.id === 'pwerm') {
          // Add PWERM/Breakpoints directly to main nav (not in submenu)
          dynamicNav.push({
            name: 'Breakpoints (PWERM)',
            href: 'allocation/pwerm',
            icon: GitBranch,
            description: 'Probability-weighted scenarios',
          })
        } else if (method.id === 'cvm') {
          allocationSubmenu.push({
            name: 'Current Value Method',
            href: 'allocation/cvm',
            icon: DollarSign,
          })
        } else if (method.id === 'hybrid') {
          allocationSubmenu.push({
            name: 'Hybrid Method',
            href: 'allocation/hybrid',
            icon: Layers,
          })
        }
      })

      // Only add Equity Allocation submenu if there are non-PWERM methods
      if (allocationSubmenu.length > 0) {
        dynamicNav.push({
          name: 'Equity Allocation',
          href: 'allocation',
          icon: Layers,
          description: 'Allocate value across share classes',
          submenu: allocationSubmenu,
        })
      }
    }

    // Add Discounts section
    dynamicNav.push(baseNav.find((item: any) => item.name === 'Discounts'))

    // Always include Report and Settings
    dynamicNav.push(
      baseNav.find((item: any) => item.name === 'Report'),
      baseNav.find((item: any) => item.name === 'Settings')
    )

    // Filter out any undefined items
    return dynamicNav.filter(Boolean)
  }, [valuationData.type, methodologies])

  const currentSection = pathname.split(`/valuations/${valuationId}/`)[1] || 'overview'

  const toggleSubmenu = (itemName: string) => {
    if (!isCollapsed) {
      setExpandedMenus((prev) =>
        prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
      )
    }
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

  // Convert navigation to SidebarNavItem format
  const sidebarItems: SidebarNavItem[] = useMemo(() => {
    const items = navigation.map((item: any) => ({
      id: item.name,
      name: item.name,
      href: `/valuations/${valuationId}/${item.href}`,
      icon: item.icon,
      isActive: currentSection === item.href || currentSection.startsWith(`${item.href}/`),
      tooltip: item.description,
      submenu: item.submenu?.map((subItem: { name: string; href: string; icon: any }) => ({
        id: subItem.name,
        name: subItem.name,
        href: `/valuations/${valuationId}/${subItem.href}`,
        icon: subItem.icon,
        isActive: currentSection === subItem.href,
      })),
    }))
    return items
  }, [navigation, valuationId, currentSection])

  return (
    <div className="flex h-screen bg-background">
      {/* Valuation Sidebar using SharedSidebar */}
      <SharedSidebar
        isCollapsed={isCollapsed}
        position="left"
        items={sidebarItems}
        expandedMenus={expandedMenus}
        onExpandMenu={toggleSubmenu}
        showToggleButton={false}
        width="w-64"
        collapsedWidth="w-20"
        header={
          <div>
            {/* Back to Main App Button */}
            <div className="mb-4">
              <Link href="/valuations">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {!isCollapsed && <span>Back to Valuations</span>}
                </Button>
              </Link>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-semibold text-gray-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                  <TrendingUp className="h-5 w-5 text-primary-foreground" />
                </div>
                {!isCollapsed && <span className="text-lg">Value8</span>}
              </Link>
            </div>

            {!isCollapsed && (
              <div className="mt-3 space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{valuationData.company_name}</h2>
                  <p className="text-sm text-gray-400">
                    {(valuationData.type || '409a').replace('_', ' ').toUpperCase()} Valuation
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={cn('gap-1', getStatusColor(valuationData.status))}>
                    {getStatusIcon(valuationData.status)}
                    {valuationData.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {valuationData.valuation_date ? new Date(valuationData.valuation_date).toLocaleDateString() : 'No date'}
                  </span>
                </div>

                {valuationData.fair_market_value && (
                  <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                    <p className="text-xs text-gray-400">Fair Market Value</p>
                    <p className="text-lg font-semibold text-primary">
                      ${valuationData.fair_market_value.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        }
        footer={
          !isCollapsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Completion</span>
                <span className="font-medium text-white">65%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[65%] bg-primary transition-all" />
              </div>
              <p className="text-xs text-white/70">Complete enterprise valuation to continue</p>
            </div>
          )
        }
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex h-16 flex-shrink-0 items-center border-b border-gray-600 px-4 shadow-sm"
          style={{ backgroundColor: '#2E3944' }}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-200 hover:bg-gray-700 hover:text-white"
              >
                {isCollapsed ? (
                  <Menu className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>

              {/* Show logo and company when sidebar is collapsed */}
              {isCollapsed && (
                <div className="flex items-center gap-4">
                  <Link href="/" className="flex items-center gap-2 font-semibold text-gray-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                      <TrendingUp className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-lg">Value8</span>
                  </Link>
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">{valuationData.company_name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search valuation..."
                  className="border-gray-600 bg-gray-700 pl-8 text-gray-200 placeholder-gray-400 focus:bg-gray-600"
                />
              </div>

              {/* New Valuation Button */}
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/valuations/new')}
                className="hover:bg-primary/90 bg-primary"
              >
                <Plus className="mr-1 h-4 w-4" />
                New Valuation
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-200 hover:bg-gray-700 hover:text-white"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>

              {/* Organization Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="font-medium">{currentOrganization?.name || 'My Organization'}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Organization</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/organization" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Organization Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/team" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Team Management
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/billing" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing & Plan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Switch Organization
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="text-gray-200 hover:bg-gray-700 hover:text-white"
              >
                {mounted ? (
                  theme === 'light' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )
                ) : (
                  <div className="h-5 w-5" />
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">
                        {(() => {
                          const metadata = user?.user_metadata
                          if (metadata?.first_name) {
                            return `${metadata.first_name} ${metadata.last_name || ''}`.trim()
                          }
                          if (metadata?.full_name) {
                            return metadata.full_name
                          }
                          return 'User'
                        })()}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/team" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Team Management
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/organization" className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      Organization Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/billing" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing & Plan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
