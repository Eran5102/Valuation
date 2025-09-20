'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  TrendingUp,
  Menu,
  X,
  Home,
  Users,
  Calculator,
  FileText,
  BarChart3,
  LogOut,
  Palette,
  ChevronDown,
  ChevronRight,
  Library,
  HelpCircle,
  Settings,
  Database,
  Calendar,
  Activity,
} from 'lucide-react'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Reports'])
  const pathname = usePathname()

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar with white background */}
      <div
        className={`${isSidebarOpen ? 'w-64' : 'w-16'} flex flex-col border-r border-sidebar-border bg-sidebar shadow-lg transition-all duration-300`}
      >
        {/* Sidebar Header */}
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-sidebar-foreground">Value8</h2>
                  <p className="text-xs text-muted-foreground">409A Platform</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-md p-1.5 text-sidebar-foreground transition-colors hover:bg-muted"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const hasSubmenu = 'submenu' in item && item.submenu
            const isExpanded = expandedMenus.includes(item.name)
            const isSubmenuActive =
              hasSubmenu && item.submenu?.some((subItem) => pathname === subItem.href)

            return (
              <div key={item.name}>
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive || isSubmenuActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-sidebar-foreground hover:bg-accent/10 hover:text-accent'
                    } `}
                  >
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
                      {isSidebarOpen && <span>{item.name}</span>}
                    </div>
                    {isSidebarOpen &&
                      (isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ))}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-sidebar-foreground hover:bg-accent/10 hover:text-accent'
                    } `}
                  >
                    <Icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                )}

                {hasSubmenu && isExpanded && isSidebarOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = pathname === subItem.href

                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? 'border-l-2 border-primary bg-primary/20 text-primary'
                              : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
                          } `}
                        >
                          <SubIcon className="mr-3 h-4 w-4" />
                          <span>{subItem.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border p-4">
          {isSidebarOpen && (
            <div className="mb-3 text-xs text-muted-foreground">Professional 409A Valuations</div>
          )}
          <button className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-background">{children}</div>
    </div>
  )
}
