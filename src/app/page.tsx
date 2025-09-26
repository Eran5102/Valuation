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
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

interface DashboardStats {
  totalClients: number
  activeProjects: number
  completedValuations: number
  pendingReports: number
  recentActivity: ActivityItem[]
  upcomingDeadlines: DeadlineItem[]
}

interface ActivityItem {
  id: number
  type: 'valuation' | 'report' | 'client'
  title: string
  client: string
  timestamp: string
  status: 'completed' | 'in_progress' | 'draft'
}

interface DeadlineItem {
  id: number
  title: string
  client: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  type: 'valuation' | 'report'
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeProjects: 0,
    completedValuations: 0,
    pendingReports: 0,
    recentActivity: [],
    upcomingDeadlines: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Mock some dashboard data - in a real app this would fetch from Supabase
      const mockStats: DashboardStats = {
        totalClients: 24,
        activeProjects: 36,
        completedValuations: 55,
        pendingReports: 19,
        recentActivity: [
          {
            id: 1,
            type: 'valuation',
            title: 'Series A 409A Valuation',
            client: 'TechStart Inc.',
            timestamp: '2 hours ago',
            status: 'completed',
          },
          {
            id: 2,
            type: 'report',
            title: 'Annual Valuation Report',
            client: 'InnovateCorp',
            timestamp: '4 hours ago',
            status: 'in_progress',
          },
          {
            id: 3,
            type: 'client',
            title: 'New Client Onboarded',
            client: 'StartupXYZ',
            timestamp: '1 day ago',
            status: 'completed',
          },
          {
            id: 4,
            type: 'valuation',
            title: 'Pre-Money Valuation Analysis',
            client: 'TechStart Inc.',
            timestamp: '2 days ago',
            status: 'draft',
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
          },
          {
            id: 2,
            title: 'Board Report Submission',
            client: 'InnovateCorp',
            dueDate: '2024-01-20',
            priority: 'medium',
            type: 'report',
          },
          {
            id: 3,
            title: 'Annual Compliance Report',
            client: 'StartupXYZ',
            dueDate: '2024-01-25',
            priority: 'low',
            type: 'report',
          },
        ],
      }

      setStats(mockStats)
    } catch (error) {
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome to your 409A valuation management platform
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Clients Card */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-primary/10 p-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <p className="truncate text-sm font-medium text-muted-foreground">
                    Total Clients
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-card-foreground">
                      {stats.totalClients}
                    </p>
                    <ArrowUpRight className="ml-2 h-4 w-4 text-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Projects Card */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-accent/10 p-3">
                    <BarChart3 className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <p className="truncate text-sm font-medium text-muted-foreground">
                    Active Projects
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-card-foreground">
                      {stats.activeProjects}
                    </p>
                    <ArrowUpRight className="ml-2 h-4 w-4 text-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completed Valuations Card */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-chart-2/10 p-3">
                    <Calculator className="h-6 w-6 text-chart-2" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <p className="truncate text-sm font-medium text-muted-foreground">
                    Completed Valuations
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-card-foreground">
                      {stats.completedValuations}
                    </p>
                    <TrendingUp className="ml-2 h-4 w-4 text-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Reports Card */}
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
                    Pending Reports
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-card-foreground">
                      {stats.pendingReports}
                    </p>
                    <Clock className="ml-2 h-4 w-4 text-chart-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="rounded-lg border border-border bg-card shadow">
            <div className="border-b border-border px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-card-foreground">
                    Recent Activity
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Latest updates and completed tasks
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
                        <p className="mt-1 text-sm text-muted-foreground">{activity.client}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-lg border border-border bg-card shadow">
            <div className="border-b border-border px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-card-foreground">
                    Upcoming Deadlines
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tasks and deliverables due soon
                  </p>
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
                {stats.upcomingDeadlines.map((deadline) => {
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

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card shadow">
          <div className="border-b border-border px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-card-foreground">Quick Actions</h3>
            <p className="mt-1 text-sm text-muted-foreground">Common tasks to get you started</p>
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
