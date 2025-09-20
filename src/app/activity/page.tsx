'use client'

import React from 'react'
import { Clock, Building2, Calculator, FileText } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function ActivityPage() {
  const activities = [
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
  ]

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
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity</h1>
          <p className="mt-1 text-muted-foreground">
            View all recent activity and updates across the platform
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow">
          <div className="border-b border-border px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-card-foreground">Recent Activity</h3>
            <p className="mt-1 text-sm text-muted-foreground">Latest updates and completed tasks</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {activities.map((activity) => {
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
                        <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
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
      </div>
    </AppLayout>
  )
}
