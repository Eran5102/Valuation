'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  CreditCard,
  Shield,
  Building2,
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  Plus,
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
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/contexts/PermissionsContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { SharedSidebar, SidebarNavItem } from '@/components/ui/shared-sidebar'
import { useTheme } from 'next-themes'

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
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { isSuperAdmin, role } = usePermissions()
  const { currentOrganization } = useOrganization()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    )
  }

  // Convert navigation to SidebarNavItem format
  const sidebarItems: SidebarNavItem[] = useMemo(() => {
    const items: SidebarNavItem[] = []

    // Add Super Admin link if applicable
    if (isSuperAdmin) {
      items.push({
        id: 'admin',
        name: 'Admin Panel',
        href: '/admin',
        icon: Shield,
        badge: (
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
            Super
          </Badge>
        ),
        isActive: pathname === '/admin',
      })
    }

    // Add regular navigation items
    navigation.forEach((item) => {
      items.push({
        id: item.name,
        name: item.name,
        href: item.href,
        icon: item.icon,
        isActive:
          (item.href === '/'
            ? pathname === '/' || pathname === '/dashboard'
            : pathname === item.href) ||
          (item.submenu && item.submenu.some((sub) => pathname === sub.href)),
        submenu: item.submenu?.map((subItem) => ({
          id: subItem.name,
          name: subItem.name,
          href: subItem.href,
          icon: subItem.icon,
          isActive: pathname === subItem.href,
        })),
      })
    })

    return items
  }, [pathname, isSuperAdmin])

  const sidebarHeader = (
    <div>
      <Link href="/" className="flex items-center gap-2 font-semibold text-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        {!isSidebarCollapsed && <span className="text-lg">Value8</span>}
      </Link>
    </div>
  )

  const sidebarFooter = null // Remove user menu from sidebar since it's in header

  return (
    <div className="flex h-screen bg-background">
      {/* Main App Sidebar using SharedSidebar */}
      <SharedSidebar
        isCollapsed={isSidebarCollapsed}
        position="left"
        items={sidebarItems}
        expandedMenus={expandedMenus}
        onExpandMenu={toggleSubmenu}
        showToggleButton={false}
        width="w-64"
        collapsedWidth="w-20"
        header={sidebarHeader}
        footer={sidebarFooter}
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
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="text-gray-200 hover:bg-gray-700 hover:text-white"
              >
                {isSidebarCollapsed ? (
                  <Menu className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>

              {/* Show logo when sidebar is collapsed */}
              {isSidebarCollapsed && (
                <Link href="/" className="flex items-center gap-2 font-semibold text-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                    <TrendingUp className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg">Value8</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
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
                  {(role === 'org_owner' || role === 'org_admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/settings/team" className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Team Management
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                  {(role === 'org_owner' || role === 'org_admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/settings/team" className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Team Management
                      </Link>
                    </DropdownMenuItem>
                  )}
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
