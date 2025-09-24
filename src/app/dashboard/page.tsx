'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
  const { user, organization, loading: authLoading } = useAuth()
  console.log('Dashboard render - authLoading:', authLoading, 'user:', !!user)
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchDashboardData()
      } else {
        // If no user, still set loading to false
        setLoading(false)
      }
    }
  }, [user, organization, authLoading])

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data...')
    try {
      // Handle both first_name and full_name formats
      let extractedFirstName = user?.user_metadata?.first_name
      if (!extractedFirstName && user?.user_metadata?.full_name) {
        extractedFirstName = user.user_metadata.full_name.split(' ')[0]
      }
      extractedFirstName = extractedFirstName || 'there'
      setFirstName(extractedFirstName)

      // Fetch real data from APIs with better error handling
      let valuations = []
      let companies = []
      let reports = []

      try {
        const valuationsRes = await fetch('/api/valuations')
        if (valuationsRes.ok) {
          const data = await valuationsRes.json()
          valuations = data.data || []
        }
      } catch (err) {
        console.log('Failed to fetch valuations:', err)
      }

      try {
        const companiesRes = await fetch('/api/companies')
        if (companiesRes.ok) {
          const data = await companiesRes.json()
          companies = data.data || []
        }
      } catch (err) {
        console.log('Failed to fetch companies:', err)
      }

      try {
        const reportsRes = await fetch('/api/reports')
        if (reportsRes.ok) {
          const data = await reportsRes.json()
          reports = data.data || []
        }
      } catch (err) {
        console.log('Failed to fetch reports:', err)
      }

      // Calculate real stats based on actual data
      const myActiveValuations = valuations.filter(
        (v: any) => v.assigned_appraiser === user?.id && v.status === 'in_progress'
      ).length

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
            user: v.assigned_appraiser === user?.id ? extractedFirstName : 'Team',
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
            assignedTo: v.assigned_appraiser === user?.id ? extractedFirstName : 'Team',
          }
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
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
      console.error('Failed to fetch dashboard data:', error)
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

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
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
              {organization?.name} • Here's your valuation activity overview
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href="/clients/new"
              className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Link>
            <Link
              href="/valuations/new"
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Calculator className="mr-2 h-4 w-4" />
              New Valuation
            </Link>
          </div>
        </div>

        {/* Personal Stats */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">My Work</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* My Active Valuations */}
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-md bg-primary/10 p-3">
                      <Calculator className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      My Active Valuations
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-card-foreground">
                        {stats.myActiveValuations}
                      </p>
                      <Link
                        href="/my-valuations"
                        className="ml-2 text-sm text-primary hover:text-primary/80"
                      >
                        View all →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Clients */}
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-md bg-accent/10 p-3">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">My Clients</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-card-foreground">
                        {stats.myClients}
                      </p>
                      <Link
                        href="/my-clients"
                        className="ml-2 text-sm text-accent hover:text-accent/80"
                      >
                        Manage →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Reports */}
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-md bg-chart-1/10 p-3">
                      <FileText className="h-6 w-6 text-chart-1" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      My Pending Reports
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-card-foreground">
                        {stats.myPendingReports}
                      </p>
                      <Link
                        href="/reports"
                        className="ml-2 text-sm text-chart-1 hover:text-chart-1/80"
                      >
                        Generate →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Overview (if organization has multiple members) */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Team Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-md bg-chart-2/10 p-3">
                      <BarChart3 className="h-6 w-6 text-chart-2" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      Team Valuations
                    </p>
                    <p className="text-2xl font-semibold text-card-foreground">
                      {stats.teamValuations}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-md bg-primary/10 p-3">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      Total Clients
                    </p>
                    <p className="text-2xl font-semibold text-card-foreground">
                      {stats.totalClients}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-md bg-accent/10 p-3">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      Completed This Month
                    </p>
                    <p className="text-2xl font-semibold text-card-foreground">
                      {stats.completedThisMonth}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Activity - Now personalized */}
          <div className="rounded-lg border border-border bg-card shadow">
            <div className="border-b border-border px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-card-foreground">
                    Recent Activity
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your latest updates and team activity
                  </p>
                </div>
                <Link
                  href="/activity"
                  className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
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
            </div>
          </div>

          {/* My Upcoming Deadlines */}
          <div className="rounded-lg border border-border bg-card shadow">
            <div className="border-b border-border px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-card-foreground">
                    My Deadlines
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">Tasks assigned to you</p>
                </div>
                <Link
                  href="/deadlines"
                  className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
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
            </div>
          </div>
        </div>

        {/* Quick Actions - Personalized */}
        <div className="rounded-lg border border-border bg-card shadow">
          <div className="border-b border-border px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-card-foreground">Quick Actions</h3>
            <p className="mt-1 text-sm text-muted-foreground">Common tasks for your workflow</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                href="/clients/new"
                className="relative flex items-center space-x-3 rounded-lg border border-border bg-card px-6 py-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
              >
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-card-foreground">Add New Client</p>
                  <p className="truncate text-sm text-muted-foreground">Onboard a new client</p>
                </div>
              </Link>

              <Link
                href="/valuations/new"
                className="relative flex items-center space-x-3 rounded-lg border border-border bg-card px-6 py-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
              >
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-accent/10 p-3">
                    <Calculator className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-card-foreground">Create Valuation</p>
                  <p className="truncate text-sm text-muted-foreground">
                    Start a new 409A valuation
                  </p>
                </div>
              </Link>

              <Link
                href="/reports/new"
                className="relative flex items-center space-x-3 rounded-lg border border-border bg-card px-6 py-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
              >
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-chart-2/10 p-3">
                    <FileText className="h-6 w-6 text-chart-2" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-card-foreground">Generate Report</p>
                  <p className="truncate text-sm text-muted-foreground">
                    Create professional report
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
