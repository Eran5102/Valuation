'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Calculator,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  User,
  Users as UsersIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import dynamic from 'next/dynamic'
import { ColumnDef } from '@tanstack/react-table'

const OptimizedDataTable = dynamic(
  () => import('@/components/ui/optimized-data-table').then((mod) => mod.OptimizedDataTable),
  {
    loading: () => <LoadingSpinner size="lg" className="p-8" />,
    ssr: false,
  }
)
import AppLayout from '@/components/layout/AppLayout'
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/ui/page-header'
import { TableActionButtons } from '@/components/ui/table-action-buttons'
import { AssignmentSelector } from '@/components/assignment/AssignmentSelector'
import { useAuth } from '@/contexts/AuthContext'

interface Valuation {
  id: string | number
  clientName: string
  valuationType: string
  status: 'draft' | 'in_progress' | 'completed' | 'review'
  value: number
  createdDate: string
  completedDate?: string
  nextReview?: string
  title?: string
  purpose?: string
  methodology?: string
  assignedAppraiser?: string | null
  teamMembers?: string[]
}

export default function ValuationsPage() {
  const { user } = useAuth()
  const [valuations, setValuations] = useState<Valuation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm] = useState('')
  const [statusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'team'>('my')

  useEffect(() => {
    fetchValuations()
  }, [])

  const fetchValuations = async () => {
    try {
      // Fetch real valuations from the API
      const response = await fetch('/api/valuations')
      if (response.ok) {
        const result = await response.json()
        const dbValuations = result.data || []

        // Also fetch companies to get their names
        const companiesResponse = await fetch('/api/companies')
        const companiesData = await companiesResponse.json()
        const companies = companiesData.data || []
        const companyMap = new Map(companies.map((c: any) => [c.id, c.name]))

        // Transform database valuations to match the interface
        const transformedValuations: Valuation[] = dbValuations.map((val: any) => ({
          id: val.id,
          clientName: companyMap.get(val.company_id) || val.client_name || 'Unknown Client',
          valuationType: val.valuation_type || val.project_type || '409A',
          status: val.status || 'draft',
          value: val.value || val.equity_value || val.enterprise_value || 0,
          createdDate: val.valuation_date
            ? new Date(val.valuation_date).toISOString().split('T')[0]
            : val.created_at
              ? new Date(val.created_at).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
          completedDate: val.completed_at
            ? new Date(val.completed_at).toISOString().split('T')[0]
            : undefined,
          nextReview: val.next_review
            ? new Date(val.next_review).toISOString().split('T')[0]
            : undefined,
          title: val.title,
          purpose: val.purpose,
          methodology: val.methodology,
          assignedAppraiser: val.assigned_appraiser || null,
          teamMembers: val.team_members || [],
        }))

        setValuations(transformedValuations)
      } else {
        // Fallback to empty array if API fails
        setValuations([])
      }
    } catch (error) {
      console.error('Error fetching valuations:', error)
      // Set empty array on error
      setValuations([])
    } finally {
      setLoading(false)
    }
  }

  const filteredValuations = valuations.filter((valuation) => {
    const matchesSearch =
      valuation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      valuation.valuationType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || valuation.status === statusFilter

    // Filter by assignment
    let matchesAssignment = true
    if (viewMode === 'my') {
      matchesAssignment = valuation.assignedAppraiser === user?.id
    } else if (viewMode === 'team') {
      matchesAssignment = valuation.teamMembers?.includes(user?.id || '') || false
    }

    return matchesSearch && matchesStatus && matchesAssignment
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'review':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Calculate metrics for summary cards
  const metrics = useMemo(() => {
    const totalValuations = valuations.length
    const inProgress = valuations.filter((v) => v.status === 'in_progress').length
    const completed = valuations.filter((v) => v.status === 'completed').length
    const totalValue = valuations
      .filter((v) => v.status === 'completed')
      .reduce((sum, v) => sum + v.value, 0)

    return { totalValuations, inProgress, completed, totalValue }
  }, [valuations])

  const summaryCards: SummaryCard[] = useMemo(
    () => [
      {
        icon: Calculator,
        iconColor: 'primary',
        label: 'Total Valuations',
        value: metrics.totalValuations,
      },
      {
        icon: Clock,
        iconColor: 'chart-1',
        label: 'In Progress',
        value: metrics.inProgress,
      },
      {
        icon: CheckCircle,
        iconColor: 'accent',
        label: 'Completed',
        value: metrics.completed,
      },
      {
        icon: DollarSign,
        iconColor: 'chart-2',
        label: 'Total Value',
        value: formatCurrency(metrics.totalValue),
      },
    ],
    [metrics]
  )

  // Define columns for DataTable
  const columns: ColumnDef<Valuation>[] = useMemo(
    () => [
      {
        id: 'client',
        header: 'Client & Type',
        accessorKey: 'clientName',
        enableSorting: true,
        cell: ({ row }) => {
          const valuation = row.original
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{valuation.clientName}</div>
                <div className="text-sm text-muted-foreground">
                  {valuation.valuationType} Valuation
                </div>
              </div>
            </div>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        enableSorting: true,
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge className={getStatusColor(status)}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(status)}
                <span className="capitalize">{status.replace('_', ' ')}</span>
              </div>
            </Badge>
          )
        },
      },
      {
        id: 'value',
        header: 'Value',
        accessorKey: 'value',
        enableSorting: true,
        cell: ({ row }) => {
          const valuation = row.original
          return (
            <div className="text-sm font-medium text-foreground">
              {valuation.value > 0 ? formatCurrency(valuation.value) : '-'}
            </div>
          )
        },
      },
      {
        id: 'created',
        header: 'Created',
        accessorKey: 'createdDate',
        enableSorting: true,
        cell: ({ row }) => {
          const valuation = row.original
          return <div className="text-sm text-foreground">{formatDate(valuation.createdDate)}</div>
        },
      },
      {
        id: 'assignment',
        header: 'Assigned To',
        accessorKey: 'assignedAppraiser',
        enableSorting: false,
        cell: ({ row }) => {
          const valuation = row.original
          return (
            <AssignmentSelector
              assignedTo={valuation.assignedAppraiser}
              teamMembers={valuation.teamMembers || []}
              onAssignmentChange={async (assignedTo, teamMembers) => {
                // Update valuation assignment
                try {
                  const response = await fetch(`/api/valuations/${valuation.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      assigned_appraiser: assignedTo,
                      team_members: teamMembers,
                    }),
                  })
                  if (response.ok) {
                    setValuations((prev) =>
                      prev.map((v) =>
                        v.id === valuation.id
                          ? { ...v, assignedAppraiser: assignedTo, teamMembers }
                          : v
                      )
                    )
                  }
                } catch (error) {
                  console.error('Failed to update assignment:', error)
                }
              }}
              entityType="valuation"
            />
          )
        },
      },
      {
        id: 'nextReview',
        header: 'Next Review',
        accessorKey: 'nextReview',
        enableSorting: true,
        cell: ({ row }) => {
          const valuation = row.original
          return (
            <div className="text-sm text-foreground">
              {valuation.nextReview ? formatDate(valuation.nextReview) : '-'}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const valuation = row.original
          return (
            <TableActionButtons
              itemId={valuation.id}
              viewHref={`/valuations/${valuation.id}`}
              showEdit={false}
              onDelete={() => {
                /* TODO: Implement delete functionality */
              }}
            />
          )
        },
      },
    ],
    []
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading valuations...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <PageHeader
          title="Valuations"
          description="Manage 409A valuations and financial assessments"
          actionButton={{
            href: '/valuations/new',
            icon: Plus,
            text: 'New Valuation',
          }}
        >
          <div className="flex items-center gap-2">
            <Badge
              variant={viewMode === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('all')}
            >
              All Valuations
            </Badge>
            <Badge
              variant={viewMode === 'my' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('my')}
            >
              <User className="mr-1 h-3 w-3" />
              My Valuations
            </Badge>
            <Badge
              variant={viewMode === 'team' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('team')}
            >
              <UsersIcon className="mr-1 h-3 w-3" />
              Team Valuations
            </Badge>
          </div>
        </PageHeader>

        {/* Summary Cards */}
        <SummaryCardsGrid cards={summaryCards} />

        {/* DataTable */}
        <Card>
          <CardContent className="p-6">
            <OptimizedDataTable
              columns={columns as any}
              data={filteredValuations}
              searchPlaceholder="Search valuations..."
              tableId="valuations-table"
              enableColumnFilters
              enableSorting
              enableColumnVisibility
              enableColumnReordering
              enableRowReordering
              onRowReorder={(fromIndex, toIndex) => {
                // TODO: Implement actual row reordering logic
                // Handle row reordering logic here
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
