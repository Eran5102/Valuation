'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Building2,
  Calculator,
  Filter,
  Plus
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

interface Deadline {
  id: number
  title: string
  description: string
  clientName: string
  type: 'valuation' | 'report' | 'filing' | 'meeting'
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  assignee?: string
  estimatedHours: number
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchDeadlines()
  }, [])

  const fetchDeadlines = async () => {
    try {
      const mockDeadlines: Deadline[] = [
        {
          id: 1,
          title: '409A Valuation Report Due',
          description: 'Complete Series A 409A valuation and deliver final report',
          clientName: 'TechStart Inc.',
          type: 'valuation',
          dueDate: '2024-01-18',
          priority: 'high',
          status: 'in_progress',
          assignee: 'Sarah Johnson',
          estimatedHours: 16
        },
        {
          id: 2,
          title: 'Board Meeting Presentation',
          description: 'Prepare valuation summary for board meeting',
          clientName: 'InnovateCorp',
          type: 'meeting',
          dueDate: '2024-01-20',
          priority: 'high',
          status: 'pending',
          assignee: 'Michael Chen',
          estimatedHours: 8
        },
        {
          id: 3,
          title: 'SEC Filing Deadline',
          description: 'Submit required financial disclosures',
          clientName: 'StartupXYZ',
          type: 'filing',
          dueDate: '2024-01-15',
          priority: 'high',
          status: 'overdue',
          assignee: 'David Wilson',
          estimatedHours: 4
        },
        {
          id: 4,
          title: 'Quarterly Valuation Update',
          description: 'Update existing valuation with Q4 financials',
          clientName: 'NextGen Solutions',
          type: 'valuation',
          dueDate: '2024-01-25',
          priority: 'medium',
          status: 'pending',
          assignee: 'Sarah Johnson',
          estimatedHours: 12
        },
        {
          id: 5,
          title: 'Annual Report Generation',
          description: 'Generate comprehensive annual valuation report',
          clientName: 'GrowthCo',
          type: 'report',
          dueDate: '2024-01-30',
          priority: 'medium',
          status: 'pending',
          assignee: 'Michael Chen',
          estimatedHours: 20
        }
      ]
      setDeadlines(mockDeadlines)
    } catch (error) {
      console.error('Failed to fetch deadlines:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDeadlines = deadlines.filter(deadline => {
    if (filter === 'all') return true
    if (filter === 'overdue') return deadline.status === 'overdue'
    if (filter === 'urgent') return deadline.priority === 'high' && deadline.status !== 'completed'
    if (filter === 'pending') return deadline.status === 'pending'
    return true
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'valuation':
        return Calculator
      case 'report':
        return FileText
      case 'filing':
        return Building2
      case 'meeting':
        return Calendar
      default:
        return Clock
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-accent bg-accent/10 border-accent/30'
      case 'in_progress':
        return 'text-primary bg-primary/10 border-primary/30'
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'pending':
        return 'text-muted-foreground bg-muted border-border'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading deadlines...</div>
        </div>
      </AppLayout>
    )
  }

  const overdueTasks = deadlines.filter(d => d.status === 'overdue').length
  const urgentTasks = deadlines.filter(d => d.priority === 'high' && d.status !== 'completed').length
  const totalHours = deadlines.filter(d => d.status !== 'completed').reduce((sum, d) => sum + d.estimatedHours, 0)

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Deadlines</h1>
            <p className="mt-1 text-muted-foreground">
              Track and manage upcoming deadlines and deliverables
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Deadline
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-md">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">{overdueTasks}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-md">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">{urgentTasks}</p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 rounded-md">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">{deadlines.length}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-accent/10 rounded-md">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-card-foreground">{totalHours}h</p>
                <p className="text-sm text-muted-foreground">Est. Hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-card-foreground">Filter:</span>
          </div>
          <div className="flex space-x-2">
            {['all', 'overdue', 'urgent', 'pending'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  filter === filterOption
                    ? 'text-primary bg-primary/10 border-primary/30'
                    : 'text-muted-foreground bg-card border-border hover:bg-muted/30'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Deadlines List */}
        <div className="space-y-4">
          {filteredDeadlines.map((deadline) => {
            const Icon = getTypeIcon(deadline.type)
            const daysUntil = getDaysUntilDue(deadline.dueDate)
            
            return (
              <div key={deadline.id} className="bg-card shadow rounded-lg border border-border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-muted rounded-lg">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-card-foreground">{deadline.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityStyle(deadline.priority)}`}>
                          {deadline.priority}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(deadline.status)}`}>
                          {deadline.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-2">{deadline.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {deadline.clientName}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {deadline.dueDate}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {deadline.estimatedHours}h
                        </span>
                        {deadline.assignee && (
                          <span>Assigned to: {deadline.assignee}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-sm font-medium ${
                      daysUntil < 0 ? 'text-red-600' : 
                      daysUntil <= 3 ? 'text-yellow-600' : 
                      'text-muted-foreground'
                    }`}>
                      {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                       daysUntil === 0 ? 'Due today' :
                       daysUntil === 1 ? 'Due tomorrow' :
                       `${daysUntil} days left`}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredDeadlines.length === 0 && (
          <div className="bg-card shadow rounded-lg border border-border p-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No deadlines found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'No deadlines to display.' : `No ${filter} deadlines found.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}