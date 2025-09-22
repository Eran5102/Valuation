'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  TrendingUp,
  Home,
  Users,
  Calculator,
  FileText,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronRight,
  Library,
  HelpCircle,
  Settings,
  Database,
  Activity,
  PanelLeft,
  PanelLeftClose,
  User,
  Building2,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Valuations', href: '/valuations', icon: Calculator },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    submenu: [
      { name: 'All Reports', href: '/reports', icon: FileText },
      { name: 'Template Library', href: '/reports/template-library', icon: Library },
      { name: 'Template Editor', href: '/reports/template-editor', icon: Settings },
      { name: 'Field Mapping', href: '/reports/field-mapping', icon: Database },
    ],
  },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Activity', href: '/activity', icon: Activity },
  {
    name: 'Help & Admin',
    href: '/help',
    icon: HelpCircle,
    submenu: [
      { name: 'Field Mapping Help', href: '/help/field-mapping', icon: HelpCircle },
      { name: 'Field Mappings Admin', href: '/admin/field-mappings', icon: Settings },
    ],
  },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()
  const { user, organization, organizations, signOut, switchOrganization } = useAuth()

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    )
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar Container */}
        <div className="relative flex">
          {/* Main Sidebar */}
          <div
            className={cn(
              'flex flex-col border-r bg-sidebar shadow-sm transition-all duration-300',
              isSidebarCollapsed ? 'w-20' : 'w-64'
            )}
          >
            {/* Sidebar Header */}
            <div className="border-b p-4">
              <div
                className={cn(
                  'flex items-center',
                  isSidebarCollapsed ? 'justify-center' : 'space-x-3'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-accent">
                          <h2 className="truncate text-sm font-semibold">
                            {organization?.name || 'My Organization'}
                          </h2>
                          <p className="text-xs text-muted-foreground">409A Platform</p>
                        </button>
                      </DropdownMenuTrigger>
                      {organizations.length > 1 && (
                        <DropdownMenuContent align="start" className="w-56">
                          <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {organizations.map((org) => (
                            <DropdownMenuItem
                              key={org.id}
                              onClick={() => switchOrganization(org.id)}
                              className="cursor-pointer"
                            >
                              <Building2 className="mr-2 h-4 w-4" />
                              <span className="flex-1">{org.name}</span>
                              {org.id === organization?.id && (
                                <Badge variant="secondary" className="ml-2">
                                  Current
                                </Badge>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const hasSubmenu = 'submenu' in item && item.submenu
                const isExpanded = expandedMenus.includes(item.name)
                const isSubmenuActive =
                  hasSubmenu && item.submenu?.some((subItem) => pathname === subItem.href)

                if (hasSubmenu) {
                  // Menu with submenu
                  const menuButton = (
                    <button
                      onClick={() => !isSidebarCollapsed && toggleSubmenu(item.name)}
                      className={cn(
                        'group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive || isSubmenuActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-accent hover:text-accent-foreground',
                        isSidebarCollapsed && 'justify-center px-0 py-3'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                            isActive || isSubmenuActive ? 'bg-primary-foreground/10' : 'bg-muted'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5',
                              isActive || isSubmenuActive
                                ? 'text-primary-foreground'
                                : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        {!isSidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            !isExpanded && '-rotate-90'
                          )}
                        />
                      )}
                    </button>
                  )

                  return (
                    <div key={item.name}>
                      {isSidebarCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                          <TooltipContent side="right">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.submenu && (
                                <div className="mt-1 space-y-1">
                                  {item.submenu.map((subItem) => (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      className="block text-xs hover:text-primary"
                                    >
                                      {subItem.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        menuButton
                      )}

                      {hasSubmenu && isExpanded && !isSidebarCollapsed && (
                        <div className="ml-3 mt-2 space-y-1 border-l-2 border-muted pl-3">
                          {item.submenu?.map((subItem) => {
                            const SubIcon = subItem.icon
                            const isSubActive = pathname === subItem.href

                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all duration-200',
                                  isSubActive
                                    ? 'bg-primary/10 font-medium text-primary'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <div
                                  className={cn(
                                    'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                                    isSubActive ? 'bg-primary/20' : 'bg-muted/50'
                                  )}
                                >
                                  <SubIcon
                                    className={cn(
                                      'h-3.5 w-3.5',
                                      isSubActive ? 'text-primary' : 'text-muted-foreground'
                                    )}
                                  />
                                </div>
                                <span>{subItem.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                } else {
                  // Regular menu item
                  const menuLink = (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-accent hover:text-accent-foreground',
                        isSidebarCollapsed && 'justify-center px-0 py-3'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                          isActive ? 'bg-primary-foreground/10' : 'bg-muted'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      {!isSidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  )

                  if (isSidebarCollapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>{menuLink}</TooltipTrigger>
                        <TooltipContent side="right">{item.name}</TooltipContent>
                      </Tooltip>
                    )
                  }

                  return <div key={item.name}>{menuLink}</div>
                }
              })}
            </nav>

            {/* Sidebar Footer - User Menu */}
            <div className="border-t p-4">
              {!isSidebarCollapsed && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="truncate font-medium">
                          {(() => {
                            const metadata = user.user_metadata
                            if (metadata?.first_name) {
                              return `${metadata.first_name} ${metadata.last_name || ''}`.trim()
                            }
                            if (metadata?.full_name) {
                              return metadata.full_name
                            }
                            return 'User'
                          })()}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div>
                        <p className="font-medium">
                          {(() => {
                            const metadata = user.user_metadata
                            if (metadata?.first_name) {
                              return `${metadata.first_name} ${metadata.last_name || ''}`.trim()
                            }
                            if (metadata?.full_name) {
                              return metadata.full_name
                            }
                            return 'User'
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
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
              )}
              {isSidebarCollapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      className="flex w-full items-center justify-center rounded-lg p-3 text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Toggle Button - Outside the sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              'absolute -right-3 top-9 z-50 h-6 w-6 rounded-md border bg-background shadow-sm transition-all hover:shadow-md'
            )}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="h-3 w-3" />
            ) : (
              <PanelLeftClose className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-background">{children}</div>
      </div>
    </TooltipProvider>
  )
}
