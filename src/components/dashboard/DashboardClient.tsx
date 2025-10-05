'use client'

import React from 'react'
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
  BarChart3,
  Sparkles,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, ClickableCard } from '@/components/ui/card-patterns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

interface DashboardClientProps {
  firstName: string
  organizationName: string | null
  currentDate: string
  stats: DashboardStats
  userId: string
  userFirstNameFromMetadata: string | null
}

export default function DashboardClient({
  firstName,
  organizationName,
  currentDate,
  stats,
  userId,
  userFirstNameFromMetadata,
}: DashboardClientProps) {
  const router = useRouter()

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

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Personalized Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {firstName}!</h1>
            <p className="mt-1 text-muted-foreground">
              {organizationName} • Here's what you can do today
            </p>
          </div>
          <div className="text-sm text-muted-foreground">{currentDate}</div>
        </div>

        {/* PROMINENT Quick Actions */}
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
              <ClickableCard
                title="Add New Client"
                description="Onboard a company for valuation services"
                icon={PlusCircle}
                href="/clients/new"
                badge="2 min"
                badgeVariant="outline"
              />

              <ClickableCard
                title="Start Valuation"
                description="409A, M&A, or LBO valuation models"
                icon={Calculator}
                href="/valuations/new"
                badge="Most used"
                badgeVariant="default"
                className="border-primary/30 from-primary/10 to-primary/5 bg-gradient-to-br"
              />

              <ClickableCard
                title="Generate Report"
                description="Export professional PDF reports"
                icon={FileSpreadsheet}
                href="/reports/new"
                badge="Automated"
                badgeVariant="outline"
              />
            </div>

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
            <StatCard
              title="My Active Valuations"
              value={stats.myActiveValuations}
              icon={Calculator}
              variant="primary"
              onClick={() => router.push('/my-valuations')}
            />

            <StatCard
              title="My Clients"
              value={stats.myClients}
              icon={Users}
              variant="success"
              onClick={() => router.push('/my-clients')}
            />

            <StatCard
              title="My Pending Reports"
              value={stats.myPendingReports}
              icon={FileText}
              variant="warning"
              onClick={() => router.push('/reports')}
            />
          </div>
        </div>

        {/* Team Overview */}
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
          {/* Recent Activity */}
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
                  const isMyActivity = activity.user === userFirstNameFromMetadata

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
                  .filter((deadline) => deadline.assignedTo === userFirstNameFromMetadata)
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
