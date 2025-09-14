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
  LogOut
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Valuations', href: '/valuations', icon: Calculator },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar with white background */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-sidebar border-r border-sidebar-border shadow-lg flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-sidebar-border">
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
              className="p-1.5 rounded-md text-sidebar-foreground hover:bg-muted transition-colors"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-sidebar-foreground hover:bg-accent/10 hover:text-accent'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border">
          {isSidebarOpen && (
            <div className="text-xs text-muted-foreground mb-3">
              Professional 409A Valuations
            </div>
          )}
          <button
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-sidebar-foreground rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  )
}