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
  Trash2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OptimizedDataTable as DataTable } from '@/components/ui/optimized-data-table'
import { ColumnDef } from '@tanstack/react-table'
import AppLayout from '@/components/layout/AppLayout'
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/ui/page-header'
import { TableActionButtons } from '@/components/ui/table-action-buttons'

interface Valuation {
  id: number
  clientName: string
  valuationType: '409A' | 'Pre-Money' | 'Post-Money'
  status: 'draft' | 'in_progress' | 'completed' | 'review'
  value: number
  createdDate: string
  completedDate?: string
  nextReview?: string
}

export default function ValuationsPage() {
  const [valuations, setValuations] = useState<Valuation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm] = useState('')
  const [statusFilter] = useState<string>('all')

  useEffect(() => {
    fetchValuations()
  }, [])

  const fetchValuations = async () => {
    try {
      // Mock data - in a real app this would fetch from Supabase
      const mockValuations: Valuation[] = [
        {
          id: 1,
          clientName: 'TechStart Inc.',
          valuationType: '409A',
          status: 'completed',
          value: 15000000,
          createdDate: '2024-01-01',
          completedDate: '2024-01-10',
          nextReview: '2024-04-01'
        },
        {
          id: 2,
          clientName: 'InnovateCorp',
          valuationType: 'Pre-Money',
          status: 'in_progress',
          value: 8500000,
          createdDate: '2024-01-05',
          nextReview: '2024-02-15'
        },
        {
          id: 3,
          clientName: 'StartupXYZ',
          valuationType: '409A',
          status: 'review',
          value: 3200000,
          createdDate: '2023-12-10',
          completedDate: '2023-12-20',
          nextReview: '2024-03-20'
        },
        {
          id: 4,
          clientName: 'NextGen Solutions',
          valuationType: 'Post-Money',
          status: 'draft',
          value: 0,
          createdDate: '2024-01-12'
        },
        {
          id: 5,
          clientName: 'TechStart Inc.',
          valuationType: '409A',
          status: 'completed',
          value: 12000000,
          createdDate: '2023-10-01',
          completedDate: '2023-10-15',
          nextReview: '2024-01-15'
        }
      ]
      setValuations(mockValuations)
    } catch (error) {
      // Error handled with mock data
    } finally {
      setLoading(false)
    }
  }

  const filteredValuations = valuations.filter(valuation => {
    const matchesSearch = valuation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         valuation.valuationType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || valuation.status === statusFilter
    return matchesSearch && matchesStatus
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
    const inProgress = valuations.filter(v => v.status === 'in_progress').length
    const completed = valuations.filter(v => v.status === 'completed').length
    const totalValue = valuations
      .filter(v => v.status === 'completed')
      .reduce((sum, v) => sum + v.value, 0)
    
    return { totalValuations, inProgress, completed, totalValue }
  }, [valuations])

  const summaryCards: SummaryCard[] = useMemo(() => [
    {
      icon: Calculator,
      iconColor: 'primary',
      label: 'Total Valuations',
      value: metrics.totalValuations
    },
    {
      icon: Clock,
      iconColor: 'chart-1',
      label: 'In Progress',
      value: metrics.inProgress
    },
    {
      icon: CheckCircle,
      iconColor: 'accent',
      label: 'Completed',
      value: metrics.completed
    },
    {
      icon: DollarSign,
      iconColor: 'chart-2',
      label: 'Total Value',
      value: formatCurrency(metrics.totalValue)
    }
  ], [metrics])

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
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {valuation.clientName}
                </div>
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
            <div className="text-sm text-foreground font-medium">
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
          return (
            <div className="text-sm text-foreground">
              {formatDate(valuation.createdDate)}
            </div>
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
              editHref={`/valuations/${valuation.id}/edit`}
              onDelete={() => {/* TODO: Implement delete functionality */}}
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
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading valuations...</div>
        </div>
      </AppLayout>
    )
  }


  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader 
          title="Valuations"
          description="Manage 409A valuations and financial assessments"
          actionButton={{
            href: "/valuations/new",
            icon: Plus,
            text: "New Valuation"
          }}
        />

        {/* Summary Cards */}
        <SummaryCardsGrid cards={summaryCards} />

        {/* DataTable */}
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
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