import { ReactNode, useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { WorkspaceHeader } from '../workspace/WorkspaceHeader'
import { WorkspaceSidebar } from '../workspace/WorkspaceSidebar'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: ReactNode
}

function MainContent({ children, isWorkspace }: { children: ReactNode; isWorkspace: boolean }) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <main
      className={cn(
        'h-full flex-1 overflow-auto transition-all duration-200',
        // No need for extra padding here since the workspace component handles its positioning
        !isWorkspace && 'w-full pl-0'
      )}
    >
      {children}
    </main>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const isWorkspace = location.pathname.startsWith('/workspace/')
  const [layoutKey, setLayoutKey] = useState(0)

  // Get page title and subtitle based on route
  const getPageInfo = () => {
    const path = location.pathname
    if (path === '/') {
      return {
        title: 'Dashboard',
        subtitle: 'Overview of your valuation projects and activities',
      }
    }
    if (path === '/clients') {
      return {
        title: 'Clients',
        subtitle: 'Manage client relationships and contacts',
      }
    }
    if (path === '/companies') {
      return {
        title: 'Companies',
        subtitle: 'Maintain company profiles and financial data',
      }
    }
    if (path === '/projects') {
      return {
        title: 'Projects',
        subtitle: 'Track and manage all valuation engagements',
      }
    }
    if (path === '/reports') {
      return {
        title: 'Reports',
        subtitle: 'Generate and export valuation reports',
      }
    }
    if (path === '/settings') {
      return {
        title: 'Settings',
        subtitle: 'Configure your account preferences and firm details',
      }
    }
    if (path === '/wacc-calculator') {
      return {
        title: 'WACC Calculator',
        subtitle: 'Calculate weighted average cost of capital',
      }
    }
    return { title: '', subtitle: '' }
  }

  // Update layout key when location changes or when financial data changes
  useEffect(() => {
    setLayoutKey((prev) => prev + 1)

    // Listen for financial data updates
    const handleFinancialDataUpdate = (event: StorageEvent) => {
      if (
        event.key === 'companyFinancialData' ||
        event.key === 'companiesData' ||
        event.key === 'clientsData'
      ) {
        setLayoutKey((prev) => prev + 1)
      }
    }

    window.addEventListener('storage', handleFinancialDataUpdate)

    return () => {
      window.removeEventListener('storage', handleFinancialDataUpdate)
    }
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-finance-primary h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  // For workspace routes, just render the children directly (ValuationWorkspace handles its own layout)
  if (isWorkspace) {
    return (
      <SidebarProvider key={`sidebar-provider-${layoutKey}`}>
        <div className="bg-finance-background h-screen w-full overflow-hidden">
          {children}
          <Toaster />
        </div>
      </SidebarProvider>
    )
  }

  const { title, subtitle } = getPageInfo()

  // Regular app pages with AppSidebar and the new AppHeader
  return (
    <SidebarProvider key={`sidebar-provider-${layoutKey}`}>
      <div className="bg-finance-background flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader title={title} subtitle={subtitle} />
          <MainContent isWorkspace={false}>{children}</MainContent>
          <Toaster />
        </div>
      </div>
    </SidebarProvider>
  )
}
