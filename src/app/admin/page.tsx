'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Building2,
  Users,
  Calculator,
  FileText,
  Activity,
  CreditCard,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/contexts/PermissionsContext'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SystemStats {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  totalValuations: number
  totalRevenue: number
  growthRate: number
  recentActivity: SystemActivity[]
  organizationsList: Organization[]
}

interface SystemActivity {
  id: string
  type: 'signup' | 'subscription' | 'valuation' | 'support'
  description: string
  organization: string
  timestamp: string
  status: 'success' | 'warning' | 'info'
}

interface Organization {
  id: string
  name: string
  subscription_plan: string
  subscription_status: string
  user_count: number
  valuation_count: number
  created_at: string
}

export default function AdminDashboard() {
  const { isSuperAdmin, loading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalValuations: 0,
    totalRevenue: 0,
    growthRate: 0,
    recentActivity: [],
    organizationsList: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!permissionsLoading && !isSuperAdmin) {
      router.push('/dashboard')
    } else if (!permissionsLoading && isSuperAdmin) {
      fetchSystemStats()
    }
  }, [isSuperAdmin, permissionsLoading, router])

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Clock className="h-4 w-4 text-primary" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (permissionsLoading || loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (!isSuperAdmin) {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Monitor and manage all organizations and system health
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-800">
            <Shield className="mr-1 h-3 w-3" />
            Super Admin
          </Badge>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground">{stats.activeOrganizations} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Across all organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Valuations</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalValuations}</div>
              <p className="text-xs text-muted-foreground">System-wide valuations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="mr-1 h-3 w-3" />
                {stats.growthRate}% growth
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Organizations Overview</CardTitle>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Manage Plans
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left font-medium">Organization</th>
                    <th className="p-2 text-left font-medium">Plan</th>
                    <th className="p-2 text-left font-medium">Status</th>
                    <th className="p-2 text-left font-medium">Users</th>
                    <th className="p-2 text-left font-medium">Valuations</th>
                    <th className="p-2 text-left font-medium">Created</th>
                    <th className="p-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.organizationsList.map((org) => (
                    <tr key={org.id} className="border-b">
                      <td className="p-2">
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground">{org.id.slice(0, 8)}</div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{org.subscription_plan}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(org.subscription_status)}>
                          {org.subscription_status}
                        </Badge>
                      </td>
                      <td className="p-2">{org.user_count}</td>
                      <td className="p-2">{org.valuation_count}</td>
                      <td className="p-2 text-muted-foreground">{formatDate(org.created_at)}</td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/organizations/${org.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent System Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0">{getStatusIcon(activity.status)}</div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activity.organization} • {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
