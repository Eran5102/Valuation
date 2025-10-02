'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Calculator,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  BarChart3,
  Plus,
  User,
  Briefcase,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StatCard, ClickableCard } from '@/components/ui/card-patterns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardStats {
  myActiveValuations: number
  myClients: number
  myPendingReports: number
  teamValuations: number
  totalClients: number
  completedThisMonth: number
  recentActivity: ActivityItem[]
  upcomingDeadlines: DeadlineItem[]
}

interface ActivityItem {
  id: number
  type: 'valuation' | 'report' | 'client' | 'assignment'
  title: string
  client: string
  timestamp: string
  status: 'completed' | 'in_progress' | 'draft'
  user?: string
}

interface DeadlineItem {
  id: number
  title: string
  client: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  type: 'valuation' | 'report'
  assignedTo?: string
}

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading, refreshSession } = useAuth()
  const { currentOrganization, loading: orgLoading } = useOrganization()

  // Debug logging
  console.log('Dashboard render - user:', user)
  console.log('Dashboard render - authLoading:', authLoading)
  console.log('Dashboard render - currentOrganization:', currentOrganization)

  const [firstName, setFirstName] = useState<string>('there')
  const [stats, setStats] = useState<DashboardStats>({
    myActiveValuations: 0,
    myClients: 0,
    myPendingReports: 0,
    teamValuations: 0,
    totalClients: 0,
    completedThisMonth: 0,
    recentActivity: [],
    upcomingDeadlines: [],
  })
  const [loading, setLoading] = useState(false) // Changed to false by default

  // Refresh session on mount to ensure we have the latest auth state
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[Dashboard] Checking authentication state...')

      // Check server-side session status
      try {
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()
        console.log('[Dashboard] Server session status:', sessionData)
      } catch (error) {
        console.error('[Dashboard] Error checking server session:', error)
      }

      // Also refresh client-side session
      try {
        await refreshSession()
        console.log('[Dashboard] Client session refreshed')
      } catch (error) {
        console.error('[Dashboard] Error refreshing client session:', error)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    // Reset loading state on mount/update
    let cancelled = false

    // Always try to fetch data if user exists
    if (user) {
      console.log('[Dashboard] User authenticated, fetching dashboard data')
      fetchDashboardData(cancelled)
    } else if (!authLoading) {
      // If no user and auth is done, set loading to false
      console.log('[Dashboard] No user found after auth loading completed')
      if (!cancelled) {
        setLoading(false)
      }
    }

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      cancelled = true
    }
  }, [user, currentOrganization, authLoading])

  // Add shorter timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !authLoading) {
        console.warn('Dashboard loading timeout - forcing completion')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [loading, authLoading])

  const fetchDashboardData = async (cancelled?: boolean) => {
    if (cancelled) return

    console.log('Dashboard - User data:', user)
    console.log('Dashboard - Organization:', currentOrganization)

    setLoading(true) // Ensure loading is set at start
    try {
      // Detailed logging of user object
      console.log('[Dashboard] Full user object:', user)
      console.log('[Dashboard] User metadata:', user?.user_metadata)
      console.log('[Dashboard] User email:', user?.email)

      // Handle both first_name and full_name formats
      let extractedFirstName = user?.user_metadata?.first_name
      if (!extractedFirstName && user?.user_metadata?.full_name) {
        extractedFirstName = user.user_metadata.full_name.split(' ')[0]
      }

      // Try from raw user metadata
      if (!extractedFirstName && user?.user_metadata) {
        // Check for name, given_name, or any name-like field
        const metadata = user.user_metadata
        extractedFirstName =
          metadata.name?.split(' ')[0] ||
          metadata.given_name ||
          metadata.firstName ||
          metadata.fname
      }

      // Also check email for name
      if (!extractedFirstName && user?.email) {
        // Try to extract name from email (e.g., eran.bareket@... -> Eran)
        const emailParts = user.email.split('@')[0]
        // Handle both dot and underscore separators
        const nameParts = emailParts.split(/[._-]/)
        extractedFirstName =
          nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase()
      }

      extractedFirstName = extractedFirstName || 'there'
      console.log('[Dashboard] Final extracted name:', extractedFirstName)
      setFirstName(extractedFirstName)

      // Fetch real data from APIs with better error handling
      let valuations = []
      let companies = []
      let reports = []

      try {
        const valuationsRes = await fetch(`/api/valuations?t=${Date.now()}`)
        if (valuationsRes.ok) {
          const data = await valuationsRes.json()
          valuations = data.data || []
          console.log('[Dashboard] Fetched valuations:', valuations)
          console.log('[Dashboard] Current user ID:', user?.id)
        }
      } catch (err) {
        console.error('Error fetching valuations:', err)
      }

      try {
        const companiesRes = await fetch(`/api/companies?t=${Date.now()}`)
        if (companiesRes.ok) {
          const data = await companiesRes.json()
          companies = data.data || []
        }
      } catch (err) {
        console.error('Error fetching companies:', err)
      }

      try {
        const reportsRes = await fetch(`/api/reports?t=${Date.now()}`)
        if (reportsRes.ok) {
          const data = await reportsRes.json()
          reports = data.data || []
        }
      } catch (err) {
        console.error('Error fetching reports:', err)
      }

      // Calculate real stats based on actual data
      console.log('[Dashboard] Filtering valuations with user ID:', user?.id)
      const myActiveValuations = valuations.filter((v: any) => {
        console.log(
          '[Dashboard] Valuation:',
          v.id,
          'assigned_to:',
          v.assigned_to,
          'status:',
          v.status
        )
        return v.assigned_to === user?.id && (v.status === 'in_progress' || v.status === 'draft')
      }).length
      console.log('[Dashboard] My active valuations count:', myActiveValuations)

      const myClients = companies.filter((c: any) => c.assigned_to === user?.id).length

      const myPendingReports = reports.filter(
        (r: any) => r.assigned_to === user?.id && r.status === 'pending'
      ).length

      const teamValuations = valuations.filter((v: any) =>
        v.team_members?.includes(user?.id)
      ).length

      const totalClients = companies.length

      // Count valuations completed this month
      const now = new Date()
      const completedThisMonth = valuations.filter((v: any) => {
        if (v.status !== 'completed' || !v.completed_at) return false
        const completedDate = new Date(v.completed_at)
        return (
          completedDate.getMonth() === now.getMonth() &&
          completedDate.getFullYear() === now.getFullYear()
        )
      }).length

      // Create recent activity from real data
      const recentActivity: ActivityItem[] = []

      // Add recent valuations
      valuations
        .sort(
          (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 2)
        .forEach((v: any, index: number) => {
          const company = companies.find((c: any) => c.id === v.company_id)
          recentActivity.push({
            id: index + 1,
            type: 'valuation',
            title: v.title || `${v.valuation_type || '409A'} Valuation`,
            client: company?.name || 'Unknown Client',
            timestamp: getRelativeTime(v.updated_at),
            status: v.status || 'draft',
            user: v.assigned_to === user?.id ? extractedFirstName : 'Team',
          })
        })

      // Add recent reports if any
      reports
        .sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 2)
        .forEach((r: any, index: number) => {
          recentActivity.push({
            id: recentActivity.length + index + 1,
            type: 'report',
            title: r.title || 'Report',
            client: r.client_name || 'Unknown Client',
            timestamp: getRelativeTime(r.created_at),
            status: r.status || 'draft',
            user: r.assigned_to === user?.id ? extractedFirstName : 'Team',
          })
        })

      // Create upcoming deadlines from valuations with next_review dates
      const upcomingDeadlines: DeadlineItem[] = valuations
        .filter((v: any) => v.next_review)
        .map((v: any, index: number) => {
          const company = companies.find((c: any) => c.id === v.company_id)
          return {
            id: index + 1,
            title: v.title || 'Valuation Review',
            client: company?.name || 'Unknown Client',
            dueDate: new Date(v.next_review).toISOString().split('T')[0],
            priority: getDuePriority(v.next_review),
            type: 'valuation' as const,
            assignedTo: v.assigned_to === user?.id ? extractedFirstName : 'Team',
          }
        })
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3)

      setStats({
        myActiveValuations,
        myClients,
        myPendingReports,
        teamValuations,
        totalClients,
        completedThisMonth,
        recentActivity,
        upcomingDeadlines,
      })
    } catch (error) {
      console.error('Dashboard data fetch error:', error)
      // Set empty stats on error
      setStats({
        myActiveValuations: 0,
        myClients: 0,
        myPendingReports: 0,
        teamValuations: 0,
        totalClients: 0,
        completedThisMonth: 0,
        recentActivity: [],
        upcomingDeadlines: [],
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return 'Just now'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return '1 day ago'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  // Helper function to determine priority based on due date
  const getDuePriority = (dueDate: string): 'high' | 'medium' | 'low' => {
    const date = new Date(dueDate)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days < 7) return 'high'
    if (days < 30) return 'medium'
    return 'low'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'valuation':
        return Calculator
      case 'report':
        return FileText
      case 'client':
        return Building2
      case 'assignment':
        return Briefcase
      default:
        return Clock
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-accent bg-accent/10 border-accent/30'
      case 'in_progress':
        return 'text-primary bg-primary/10 border-primary/30'
      case 'draft':
        return 'text-chart-3 bg-chart-3/10 border-chart-3/30'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive bg-destructive/10 border-destructive/30'
      case 'medium':
        return 'text-chart-1 bg-chart-1/10 border-chart-1/30'
      case 'low':
        return 'text-accent bg-accent/10 border-accent/30'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  // Show loading only during initial auth check
  if (authLoading && !user) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // If user is null and we're not loading auth, redirect to login
  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Please log in to continue</p>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Personalized Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {firstName}!</h1>
            <p className="mt-1 text-muted-foreground">
              {currentOrganization?.name} • Here's what you can do today
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* PROMINENT Quick Actions - Moved to top */}
        <div className="border-primary/20 from-primary/5 to-primary/10 rounded-xl border-2 bg-gradient-to-r shadow-lg">
          <div className="border-primary/20 border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Get Started</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose an action below to begin your work
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Add New Client */}
              <ClickableCard
                title="Add New Client"
                description="Onboard a company for valuation services"
                icon={PlusCircle}
                href="/clients/new"
                badge="2 min"
                badgeVariant="outline"
              />

              {/* Create Valuation */}
              <ClickableCard
                title="Start Valuation"
                description="409A, M&A, or LBO valuation models"
                icon={Calculator}
                href="/valuations/new"
                badge="Most used"
                badgeVariant="default"
                className="border-primary/30 from-primary/10 to-primary/5 bg-gradient-to-br"
              />

              {/* Generate Report */}
              <ClickableCard
                title="Generate Report"
                description="Export professional PDF reports"
                icon={FileSpreadsheet}
                href="/reports/new"
                badge="Automated"
                badgeVariant="outline"
              />
            </div>

            {/* Secondary actions */}
            <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-4">
              <Link
                href="/valuations"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Browse existing valuations →
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/clients"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                View all clients →
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/templates"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Use templates →
              </Link>
            </div>
          </div>
        </div>

        {/* Personal Stats */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">My Work</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* My Active Valuations */}
            <StatCard
              title="My Active Valuations"
              value={stats.myActiveValuations}
              icon={Calculator}
              variant="primary"
              onClick={() => router.push('/my-valuations')}
            />

            {/* My Clients */}
            <StatCard
              title="My Clients"
              value={stats.myClients}
              icon={Users}
              variant="success"
              onClick={() => router.push('/my-clients')}
            />

            {/* Pending Reports */}
            <StatCard
              title="My Pending Reports"
              value={stats.myPendingReports}
              icon={FileText}
              variant="warning"
              onClick={() => router.push('/reports')}
            />
          </div>
        </div>

        {/* Team Overview (if organization has multiple members) */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Team Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard
              title="Team Valuations"
              value={stats.teamValuations}
              icon={BarChart3}
              variant="default"
            />

            <StatCard
              title="Total Clients"
              value={stats.totalClients}
              icon={Building2}
              variant="primary"
            />

            <StatCard
              title="Completed This Month"
              value={stats.completedThisMonth}
              icon={TrendingUp}
              variant="success"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Activity - Now personalized */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your latest updates and team activity
                  </p>
                </div>
                <Link
                  href="/activity"
                  className="hover:text-accent/80 text-sm font-medium text-accent transition-colors"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  const isMyActivity = activity.user === user?.user_metadata?.first_name

                  return (
                    <div key={activity.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-card-foreground">
                            {activity.title}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(activity.status)}`}
                          >
                            {activity.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.client} {isMyActivity && '• You'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* My Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Deadlines</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Tasks assigned to you</p>
                </div>
                <Link
                  href="/deadlines"
                  className="hover:text-accent/80 text-sm font-medium text-accent transition-colors"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.upcomingDeadlines
                  .filter((deadline) => deadline.assignedTo === user?.user_metadata?.first_name)
                  .map((deadline) => {
                    const Icon = deadline.type === 'valuation' ? Calculator : FileText
                    return (
                      <div key={deadline.id} className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="rounded-lg bg-muted p-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-card-foreground">
                              {deadline.title}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityStyle(deadline.priority)}`}
                            >
                              {deadline.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{deadline.client}</p>
                          <div className="mt-1 flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            Due {deadline.dueDate}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
