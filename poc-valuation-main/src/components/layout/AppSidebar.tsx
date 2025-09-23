import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Building,
} from 'lucide-react'

export function AppSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const menuItems = [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboard,
      showFor: ['individual', 'firm'],
    },
    {
      title: 'My Company',
      url: '/company',
      icon: Building,
      showFor: ['individual'],
    },
    {
      title: 'Clients',
      url: '/clients',
      icon: Users,
      showFor: ['firm'],
    },
    {
      title: 'Companies',
      url: '/companies',
      icon: Briefcase,
      showFor: ['individual', 'firm'],
    },
    {
      title: 'Valuation Projects',
      url: '/projects',
      icon: Briefcase,
      showFor: ['individual', 'firm'],
    },
    {
      title: 'Reports',
      url: '/reports',
      icon: FileText,
      showFor: ['individual', 'firm'],
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
      showFor: ['individual', 'firm'],
    },
  ]

  const filteredMenuItems = user
    ? menuItems.filter((item) => item.showFor.includes(user.organizationType))
    : menuItems

  return (
    <Sidebar className="border-finance-border z-20 border-r" variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-4">
        {!isCollapsed && <div className="text-finance-primary text-xl font-bold">Value8</div>}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5',
                      isCollapsed && 'justify-center px-0'
                    )}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link to={item.url}>
                      <item.icon size={20} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          className={cn(
            'hover:bg-dark/10 flex w-full items-center justify-start gap-2 text-white hover:text-white',
            isCollapsed && 'justify-center'
          )}
          onClick={logout}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
        {!isCollapsed && user && (
          <div className="mt-4 text-sm text-white">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-white/70">{user.email}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
