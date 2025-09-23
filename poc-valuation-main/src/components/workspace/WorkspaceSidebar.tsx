import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useMethodology } from '@/contexts/MethodologyContext'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  LayoutDashboard,
  Settings,
  FileText,
  Database,
  Calculator,
  Layers,
  ChevronDown,
  ChevronRight,
  BarChart2,
  CheckSquare,
  Building,
  PieChart,
  Activity,
  FileChartPie,
  ChartBar,
  ChartPie,
  History,
  ChevronLeft,
  LineChart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WorkspaceSidebarProps {
  projectId: string
}

export function WorkspaceSidebar({ projectId }: WorkspaceSidebarProps) {
  const location = useLocation()
  const { methodologies } = useMethodology()
  const [refreshKey, setRefreshKey] = useState(0)
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    // All categories start as collapsed (false)
    setup: false,
    schedules: false,
    valuation: false,
  })

  // Force refresh the sidebar when the route changes
  useEffect(() => {
    setRefreshKey((prevKey) => prevKey + 1)

    // When route changes, determine if we need to expand a category based on the current path
    const currentPath = location.pathname

    // Check if path matches any items in the categories and expand only that category
    const expandedCategory = determineExpandedCategoryFromPath(currentPath)
    if (expandedCategory) {
      setExpandedCategories((prev) => {
        // Reset all to collapsed first
        const reset = Object.keys(prev).reduce(
          (acc, key) => {
            acc[key] = false
            return acc
          },
          {} as Record<string, boolean>
        )

        // Only expand the matching category
        return {
          ...reset,
          [expandedCategory]: true,
        }
      })
    }
  }, [location.pathname])

  // Used when opening in a new tab - check path on first load
  useEffect(() => {
    const currentPath = location.pathname
    const expandedCategory = determineExpandedCategoryFromPath(currentPath)
    if (expandedCategory) {
      setExpandedCategories((prev) => ({
        ...prev,
        [expandedCategory]: true,
      }))
    }
  }, [])

  // Helper function to determine which category to expand based on the current path
  const determineExpandedCategoryFromPath = (path: string): string | null => {
    // Check setup items
    for (const item of setupCategory.items) {
      if (path.includes(item.path)) {
        return setupCategory.id
      }
    }

    // Check schedules items
    for (const item of schedulesCategory.items) {
      if (path.includes(item.path)) {
        return schedulesCategory.id
      }
    }

    // Check valuation approach items (more complex structure)
    for (const subcategory of valuationCategory.subcategories) {
      for (const item of subcategory.items) {
        if (path.includes(item.path)) {
          return valuationCategory.id
        }
      }
    }

    return null
  }

  // Function to toggle a single category expansion and collapse others
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newState = Object.keys(prev).reduce(
        (acc, key) => {
          // Close all categories
          acc[key] = false
          return acc
        },
        {} as Record<string, boolean>
      )

      // Toggle the clicked category
      newState[categoryId] = !prev[categoryId]
      return newState
    })
  }

  // Get all enabled methodology IDs for filtering
  const enabledMethodologyIds = methodologies
    .flatMap((group) => group.methods)
    .filter((method) => method.enabled)
    .map((method) => method.id)

  // Debug - log all enabled methodology IDs to help us understand what's being selected
  useEffect(() => {
    console.log('Enabled methodology IDs:', enabledMethodologyIds)
  }, [enabledMethodologyIds])

  // Check if any method in a methodology group is enabled
  const isMethodologyGroupEnabled = (methodIds: string[]): boolean => {
    return methodIds.some((id) => enabledMethodologyIds.includes(id))
  }

  // Direct links
  const directLinks = [
    {
      id: 'overview',
      title: 'Project Summary',
      path: `/workspace/${projectId}`,
      icon: LayoutDashboard,
    },
    {
      id: 'back',
      title: 'Back to Projects',
      path: '/projects',
      icon: ArrowLeft,
      position: 'top',
    },
    // Added Valuation Results as a direct link
    {
      id: 'valuation-summary',
      title: 'Valuation Results',
      path: `/workspace/${projectId}/valuation-summary`,
      icon: Activity,
    },
    {
      id: 'reporting',
      title: 'Reporting',
      path: `/workspace/${projectId}/report`,
      icon: FileText,
    },
    {
      id: 'history',
      title: 'Project History',
      path: `/workspace/${projectId}/history`,
      icon: History,
    },
    {
      id: 'settings',
      title: 'Project Settings',
      path: `/workspace/${projectId}/settings`,
      icon: Settings,
      position: 'bottom',
    },
  ]

  // Setup & Inputs category
  const setupCategory = {
    id: 'setup',
    title: 'Setup & Inputs',
    icon: Settings,
    items: [
      {
        id: 'core-assumptions',
        title: 'Core Assumptions',
        path: `/workspace/${projectId}/core-assumptions`,
      },
      {
        id: 'methodology-scope',
        title: 'Methodology Scope',
        path: `/workspace/${projectId}/methodology-scope`,
      },
      { id: 'company-data', title: 'Company Data', path: `/workspace/${projectId}/company-data` },
      { id: 'cap-table', title: 'Cap Table', path: `/workspace/${projectId}/cap-table` },
      {
        id: 'scenario-manager',
        title: 'Scenario Manager',
        path: `/workspace/${projectId}/scenarios`,
      },
      { id: 'qualitative', title: 'Qualitative', path: `/workspace/${projectId}/qualitative` },
      { id: 'wacc', title: 'WACC Calculator', path: `/workspace/${projectId}/wacc` },
      { id: 'documents', title: 'Documents', path: `/workspace/${projectId}/documents` },
    ],
  }

  // Supporting Schedules category
  const schedulesCategory = {
    id: 'schedules',
    title: 'Supporting Schedules',
    icon: Layers,
    items: [
      {
        id: 'working-capital',
        title: 'Working Capital',
        path: `/workspace/${projectId}/working-capital`,
      },
      {
        id: 'depreciation-capex',
        title: 'Depreciation & CapEx',
        path: `/workspace/${projectId}/depreciation-capex`,
      },
      {
        id: 'debt-schedule',
        title: 'Debt Schedule',
        path: `/workspace/${projectId}/debt-schedule`,
      },
      {
        id: 'projected-financials',
        title: 'Projected Financials',
        path: `/workspace/${projectId}/projected-financials`,
      },
    ],
  }

  // Valuation Approaches category with methodology-dependent subcategories
  const valuationCategory = {
    id: 'valuation',
    title: 'Valuation Approaches',
    icon: Calculator,
    subcategories: [
      {
        id: 'income',
        title: 'Income Approach',
        methodIds: [
          'dcf',
          'cap-earnings',
          'income-multiplier',
          'ddm',
          'earnings-based',
          'eva',
          'residual-income',
        ],
        items: [
          { id: 'dcf', title: 'DCF', path: `/workspace/${projectId}/dcf`, methodId: 'dcf' },
          {
            id: 'cap-earnings',
            title: 'Cap. Earnings',
            path: `/workspace/${projectId}/cap-earnings`,
            methodId: 'cap-earnings',
          },
          {
            id: 'income-multiplier',
            title: 'Income Multiplier',
            path: `/workspace/${projectId}/income-multiplier`,
            methodId: 'income-multiplier',
          },
          {
            id: 'dividend-discount',
            title: 'Dividend Discount',
            path: `/workspace/${projectId}/dividend-discount`,
            methodId: 'ddm',
          },
          {
            id: 'earnings-based',
            title: 'Earnings-Based',
            path: `/workspace/${projectId}/earnings-based`,
            methodId: 'earnings-based',
          },
          {
            id: 'eva-valuation',
            title: 'EVA',
            path: `/workspace/${projectId}/eva-valuation`,
            methodId: 'eva',
          },
          {
            id: 'residual-income',
            title: 'Residual Income',
            path: `/workspace/${projectId}/residual-income`,
            methodId: 'residual-income',
          },
        ],
      },
      {
        id: 'market',
        title: 'Market Approach',
        methodIds: ['public-comps', 'precedent-transactions', 'opm'],
        items: [
          {
            id: 'public-comps',
            title: 'Public Comps',
            path: `/workspace/${projectId}/public-comps`,
            methodId: 'public-comps',
          },
          {
            id: 'precedent-transactions',
            title: 'Precedent Trans.',
            path: `/workspace/${projectId}/precedent-transactions`,
            methodId: 'precedent-transactions',
          },
          {
            id: 'opm-backsolve',
            title: 'OPM Backsolve',
            path: `/workspace/${projectId}/opm-backsolve`,
            methodId: 'opm',
          },
        ],
      },
      {
        id: 'asset',
        title: 'Asset Approach',
        methodIds: ['adjusted-book-value', 'cost-approach', 'liquidation-value'],
        items: [
          {
            id: 'adjusted-book-value',
            title: 'Adjusted BV',
            path: `/workspace/${projectId}/adjusted-book-value`,
            methodId: 'adjusted-book-value',
          },
          {
            id: 'cost-approach',
            title: 'Cost Approach',
            path: `/workspace/${projectId}/cost-approach`,
            methodId: 'cost-approach',
          },
          {
            id: 'liquidation-value',
            title: 'Liquidation',
            path: `/workspace/${projectId}/liquidation-value`,
            methodId: 'liquidation-value',
          },
        ],
      },
      {
        id: 'other',
        title: 'Other / Specialized',
        methodIds: [
          'lbo',
          'vc-method',
          'sotp',
          'real-options',
          'contingent-claim',
          'intangible-asset',
          'option-pricing',
          'real-estate',
          'greenfield',
        ],
        items: [
          { id: 'lbo', title: 'LBO', path: `/workspace/${projectId}/lbo`, methodId: 'lbo' },
          {
            id: 'vc-method',
            title: 'VC Method',
            path: `/workspace/${projectId}/vc-method`,
            methodId: 'vc-method',
          },
          { id: 'sotp', title: 'SOTP', path: `/workspace/${projectId}/sotp`, methodId: 'sotp' },
          {
            id: 'real-options',
            title: 'Real Options',
            path: `/workspace/${projectId}/real-options`,
            methodId: 'real-options',
          },
          {
            id: 'contingent-claim',
            title: 'Contingent Claim',
            path: `/workspace/${projectId}/contingent-claim`,
            methodId: 'contingent-claim',
          },
          {
            id: 'intangible-asset',
            title: 'Intangible Asset',
            path: `/workspace/${projectId}/intangible-asset`,
            methodId: 'intangible-asset',
          },
          {
            id: 'option-pricing',
            title: 'Option Pricing',
            path: `/workspace/${projectId}/option-pricing`,
            methodId: 'option-pricing',
          },
          {
            id: 'real-estate',
            title: 'Real Estate',
            path: `/workspace/${projectId}/real-estate`,
            methodId: 'real-estate',
          },
          {
            id: 'greenfield',
            title: 'Greenfield',
            path: `/workspace/${projectId}/greenfield`,
            methodId: 'greenfield',
          },
        ],
      },
    ],
  }

  // Get the appropriate icon for a category
  const getCategoryIcon = (icon: React.ElementType) => {
    return React.createElement(icon, { className: 'h-4 w-4' })
  }

  // Render a direct link item
  const renderDirectLink = (item: any) => {
    return (
      <SidebarMenuItem key={`${item.id}-${refreshKey}`}>
        <SidebarMenuButton
          asChild
          isActive={location.pathname === item.path}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-2.5',
            isCollapsed && 'justify-center px-0'
          )}
          tooltip={isCollapsed ? item.title : undefined}
        >
          <Link to={item.path}>
            <item.icon className="h-4 w-4" />
            {!isCollapsed && <span>{item.title}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Render a category with simple items
  const renderCategory = (category: any) => {
    return (
      <SidebarGroup key={`${category.id}-${refreshKey}`}>
        <div
          className="flex cursor-pointer items-center justify-between px-4 py-1"
          onClick={() => toggleCategory(category.id)}
        >
          <div className="flex items-center gap-3 text-sm text-white">
            <category.icon className="h-4 w-4" />
            <span>{!isCollapsed && category.title}</span>
          </div>
          {!isCollapsed && (
            <span>
              {expandedCategories[category.id] ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </span>
          )}
        </div>
        {expandedCategories[category.id] && !isCollapsed && (
          <SidebarGroupContent>
            <SidebarMenu>
              {category.items.map((item: any) => (
                <SidebarMenuItem key={`${item.id}-${refreshKey}`}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    className="flex w-full items-center gap-3 px-4 py-2.5 pl-10"
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link to={item.path}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>
    )
  }

  // Render a category with subcategories and methodology-dependent items
  const renderValuationCategory = (category: any) => {
    return (
      <SidebarGroup key={`${category.id}-${refreshKey}`}>
        <div
          className="flex cursor-pointer items-center justify-between px-4 py-1"
          onClick={() => toggleCategory(category.id)}
        >
          <div className="flex items-center gap-3 text-sm text-white">
            <category.icon className="h-4 w-4" />
            {!isCollapsed && <span>{category.title}</span>}
          </div>
          {!isCollapsed && (
            <span>
              {expandedCategories[category.id] ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </span>
          )}
        </div>
        {expandedCategories[category.id] && !isCollapsed && (
          <SidebarGroupContent>
            <SidebarMenu>
              {category.subcategories.map((subcategory: any) => {
                // Only show subcategory if at least one of its methods is enabled
                const enabledItems = subcategory.items.filter((item: any) =>
                  enabledMethodologyIds.includes(item.methodId)
                )

                if (enabledItems.length === 0) return null

                return (
                  <SidebarMenuItem key={`${subcategory.id}-${refreshKey}`}>
                    <div className="px-4 py-1 pl-10 text-sm text-muted-foreground">
                      {subcategory.title}
                    </div>
                    <SidebarMenuSub>
                      {subcategory.items.map((item: any) => {
                        // Only show item if its methodology is enabled
                        if (item.methodId && !enabledMethodologyIds.includes(item.methodId)) {
                          return null
                        }

                        return (
                          <SidebarMenuSubItem key={`${item.id}-${refreshKey}`}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location.pathname === item.path}
                              className="pl-14"
                            >
                              <Link to={item.path}>{item.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>
    )
  }

  // Top navigation items (Back to Projects)
  const topNavItems = directLinks.filter((item) => item.position === 'top')

  // Main navigation items
  const mainNavItems = [
    ...directLinks.filter((item) => !item.position),
    setupCategory,
    schedulesCategory,
    valuationCategory,
  ]

  // Bottom navigation items (Project Settings)
  const bottomNavItems = directLinks.filter((item) => item.position === 'bottom')

  return (
    <Sidebar
      className="h-full border-r border-border"
      variant="sidebar"
      collapsible="icon"
      key={`sidebar-${refreshKey}`}
    >
      <SidebarContent>
        {/* Sidebar Header with Collapse Button */}
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && <div className="text-xl font-bold text-white">Project</div>}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto text-white"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Top navigation */}
        <SidebarGroup key="top-nav">
          <SidebarGroupContent>
            <SidebarMenu>{topNavItems.map(renderDirectLink)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Direct links and categories */}
        {mainNavItems.map((item: any) => {
          if (item.items) {
            return renderCategory(item)
          } else if (item.subcategories) {
            return renderValuationCategory(item)
          } else {
            return (
              <SidebarGroup key={`${item.id}-group-${refreshKey}`}>
                <SidebarGroupContent>
                  <SidebarMenu>{renderDirectLink(item)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          }
        })}

        {/* Bottom navigation */}
        <SidebarGroup key="bottom-nav" className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>{bottomNavItems.map(renderDirectLink)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
