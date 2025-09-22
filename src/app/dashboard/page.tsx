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
    if (!authLoading && user) {
      fetchDashboardData()
    }
  }, [user, organization, authLoading])

  const fetchDashboardData = async () => {
    try {
      // In a real app, this would fetch user-specific data from Supabase
      // Handle both first_name and full_name formats
      let extractedFirstName = user?.user_metadata?.first_name
      if (!extractedFirstName && user?.user_metadata?.full_name) {
        extractedFirstName = user.user_metadata.full_name.split(' ')[0]
      }
      extractedFirstName = extractedFirstName || 'there'
      setFirstName(extractedFirstName)

      const orgName = organization?.name || 'Organization'

      const mockStats: DashboardStats = {
        myActiveValuations: 8,
        myClients: 12,
        myPendingReports: 5,
        teamValuations: 24,
        totalClients: 36,
        completedThisMonth: 7,
        recentActivity: [
          {
            id: 1,
            type: 'valuation',
            title: 'Series A 409A Valuation',
            client: 'TechStart Inc.',
            timestamp: '2 hours ago',
            status: 'completed',
            user: extractedFirstName,
          },
          {
            id: 2,
            type: 'assignment',
            title: 'New Valuation Assigned',
            client: 'InnovateCorp',
            timestamp: '4 hours ago',
            status: 'in_progress',
            user: 'System',
          },
          {
            id: 3,
            type: 'report',
            title: 'Quarterly Report Generated',
            client: 'StartupXYZ',
            timestamp: '1 day ago',
            status: 'completed',
            user: extractedFirstName,
          },
          {
            id: 4,
            type: 'client',
            title: 'Client Information Updated',
            client: 'TechStart Inc.',
            timestamp: '2 days ago',
            status: 'completed',
            user: extractedFirstName,
          },
        ],
        upcomingDeadlines: [
          {
            id: 1,
            title: 'Quarterly 409A Update',
            client: 'TechStart Inc.',
            dueDate: '2024-01-15',
            priority: 'high',
            type: 'valuation',
            assignedTo: firstName,
          },
          {
            id: 2,
            title: 'Board Report Submission',
            client: 'InnovateCorp',
            dueDate: '2024-01-20',
            priority: 'medium',
            type: 'report',
            assignedTo: firstName,
          },
          {
            id: 3,
            title: 'Annual Compliance Report',
            client: 'StartupXYZ',
            dueDate: '2024-01-25',
            priority: 'low',
            type: 'report',
            assignedTo: 'Team',
          },
        ],
      }

      setStats(mockStats)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
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

  const firstName = user?.user_metadata?.first_name || 'there'

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
