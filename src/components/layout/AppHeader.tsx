'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  TrendingUp,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Command,
  Sun,
  Moon,
  Laptop,
  Plus,
  Calculator,
  FileText,
  Users,
  Building2,
  Activity,
  ChevronDown,
  Sparkles,
  Zap,
  Shield,
  Check,
  ChevronsUpDown,
  PlusCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: 'info' | 'warning' | 'success' | 'error'
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { currentOrganization, organizations, switchOrganization } = useOrganization()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Valuation Completed',
      description: 'TechCorp 409A valuation has been finalized',
      time: '5 minutes ago',
      read: false,
      type: 'success',
    },
    {
      id: '2',
      title: 'Report Generated',
      description: 'Q4 2024 portfolio report is ready',
      time: '1 hour ago',
      read: false,
      type: 'info',
    },
  ])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Command palette shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth/')) {
    return null
  }

  return (
    <>
      <header
        className="fixed left-64 right-0 top-0 z-30 border-b border-gray-600"
        style={{ backgroundColor: '#2E3944' }}
      >
        <div className="flex h-14 items-center px-6">
          {/* Left side - Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-200 hover:bg-gray-700 hover:text-white"
              onClick={() => router.push('/valuations/new')}
            >
              <Plus className="h-4 w-4" />
              New Valuation
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-200 hover:bg-gray-700 hover:text-white"
              onClick={() => setOpen(true)}
            >
              <Search className="h-4 w-4" />
              Search
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-600 bg-gray-700 px-1.5 font-mono text-[10px] font-medium text-gray-300 opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          {/* Center - Organization Switcher */}
          <div className="flex flex-1 items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  role="combobox"
                  className="w-[240px] justify-between text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-700">
                      <Building2 className="h-4 w-4 text-gray-300" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {currentOrganization?.name || 'Select Organization'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {currentOrganization?.plan || 'No plan'}
                      </div>
                    </div>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[240px]">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    className="flex items-center gap-2 p-2"
                    onClick={() => switchOrganization(org.id)}
                  >
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-lg',
                        currentOrganization?.id === org.id
                          ? 'bg-primary/10'
                          : 'bg-gray-100 dark:bg-gray-800'
                      )}
                    >
                      <Building2
                        className={cn(
                          'h-4 w-4',
                          currentOrganization?.id === org.id
                            ? 'text-primary'
                            : 'text-gray-600 dark:text-gray-400'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{org.name}</div>
                      <div className="text-xs text-muted-foreground">{org.plan || 'Free Plan'}</div>
                    </div>
                    {currentOrganization?.id === org.id && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Organization</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Manage Organizations</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {process.env.NODE_ENV === 'development' && (
              <Badge
                variant="secondary"
                className="ml-2 gap-1 border-yellow-800 bg-yellow-900/50 text-yellow-200"
              >
                <Zap className="h-3 w-3" />
                Dev
              </Badge>
            )}
          </div>

          {/* Right side - User actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                    <div className="flex w-full items-center gap-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          notification.type === 'success' && 'bg-green-500',
                          notification.type === 'error' && 'bg-red-500',
                          notification.type === 'warning' && 'bg-yellow-500',
                          notification.type === 'info' && 'bg-primary'
                        )}
                      />
                      <span className="text-sm font-medium">{notification.title}</span>
                      {!notification.read && (
                        <Badge variant="secondary" className="ml-auto px-1 py-0 text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {notification.description}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">{notification.time}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-center">
                  <Link href="/notifications" className="text-sm">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!mounted) return
                      setTheme(theme === 'dark' ? 'light' : 'dark')
                    }}
                    className="h-9 w-9 text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    {mounted ? (
                      theme === 'dark' ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="mx-2 h-6 bg-gray-600" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 gap-2 px-2 text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                    <AvatarFallback>
                      {user?.email?.slice(0, 2)?.toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start lg:flex">
                    <span className="text-sm font-medium text-gray-100">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {user?.user_metadata?.role || 'Appraiser'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/billing')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Billing & Plan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                router.push('/valuations/new')
                setOpen(false)
              }}
            >
              <Calculator className="mr-2 h-4 w-4" />
              <span>New Valuation</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/clients/new')
                setOpen(false)
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>New Client</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/reports/generate')
                setOpen(false)
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Generate Report</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                router.push('/')
                setOpen(false)
              }}
            >
              <Activity className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/valuations')
                setOpen(false)
              }}
            >
              <Calculator className="mr-2 h-4 w-4" />
              <span>Valuations</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/clients')
                setOpen(false)
              }}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Clients</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/reports')
                setOpen(false)
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => {
                router.push('/settings')
                setOpen(false)
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push('/profile')
                setOpen(false)
              }}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
