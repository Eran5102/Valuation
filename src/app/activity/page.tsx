'use client'

import React from 'react'
import { Clock, Building2, Calculator, FileText } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineTitle,
  TimelineIcon,
  TimelineDescription,
  TimelineContent,
} from '@/components/ui/timeline'
import { Badge } from '@/components/ui/badge'

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

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      default:
        return 'outline'
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
            <Timeline>
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <TimelineItem key={activity.id}>
                    {index < activities.length - 1 && <TimelineConnector />}
                    <TimelineHeader>
                      <TimelineIcon>
                        <Icon className="h-4 w-4" />
                      </TimelineIcon>
                      <TimelineTitle>{activity.title}</TimelineTitle>
                      <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                    </TimelineHeader>
                    <TimelineContent>
                      <TimelineDescription className="flex items-center gap-2">
                        {activity.client}
                        <Badge variant={getStatusVariant(activity.status)}>
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      </TimelineDescription>
                    </TimelineContent>
                  </TimelineItem>
                )
              })}
            </Timeline>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
