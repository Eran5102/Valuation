'use client'

import { useState, useMemo } from 'react'
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
  CreditCard,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/contexts/PermissionsContext'
import { Badge } from '@/components/ui/badge'
import { SharedSidebar, SidebarNavItem } from '@/components/ui/shared-sidebar'

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
  const { user, signOut } = useAuth()
  const { isSuperAdmin, role } = usePermissions()

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
          pathname === item.href ||
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
      <div className={cn('flex items-center', isSidebarCollapsed ? 'justify-center' : 'space-x-3')}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-6 w-6 text-primary-foreground" />
        </div>
        {!isSidebarCollapsed && (
          <div className="flex-1">
            <h2 className="text-sm font-bold">Value8</h2>
            <p className="text-xs text-muted-foreground">Valuation Platform</p>
          </div>
        )}
      </div>
    </div>
  )

  const sidebarFooter = (
    <div>
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
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Main App Sidebar using SharedSidebar */}
      <SharedSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        position="left"
        items={sidebarItems}
        expandedMenus={expandedMenus}
        onExpandMenu={toggleSubmenu}
        showToggleButton={true}
        width="w-64"
        collapsedWidth="w-20"
        header={sidebarHeader}
        footer={sidebarFooter}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-background">{children}</div>
    </div>
  )
}
