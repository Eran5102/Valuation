'use client'

import React, { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import dynamic from 'next/dynamic'
import { ColumnDef } from '@tanstack/react-table'
import AppLayout from '@/components/layout/AppLayout'
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/common/PageHeader'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useRouter } from 'next/navigation'

// Lazy load OptimizedDataTable with SSR enabled
const OptimizedDataTable = dynamic(
  () => import('@/components/ui/optimized-data-table').then((mod) => mod.OptimizedDataTable),
  {
    loading: () => <LoadingSpinner size="lg" className="p-8" />,
    ssr: true, // OPTIMIZED: Enable SSR
  }
)

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

interface ValuationsClientProps {
  initialValuations: Valuation[]
  userId: string
}

export default function ValuationsClient({ initialValuations, userId }: ValuationsClientProps) {
  const router = useRouter()
  const [valuations, setValuations] = useState<Valuation[]>(initialValuations)
  const [searchTerm] = useState('')
  const [statusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'team'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [valuationToDelete, setValuationToDelete] = useState<Valuation | null>(null)

  const handleDeleteClick = (valuation: Valuation) => {
    setValuationToDelete(valuation)
    setDeleteDialogOpen(true)
  }

  const deleteValuation = async () => {
    if (!valuationToDelete) return

    try {
      await fetch(`/api/valuations/${valuationToDelete.id}`, {
        method: 'DELETE',
      })
      // Refresh the page to get updated data
      router.refresh()
    } catch (error) {
      console.error('Error deleting valuation:', error)
    } finally {
      setDeleteDialogOpen(false)
      setValuationToDelete(null)
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
      matchesAssignment = valuation.assignedAppraiser === userId
    } else if (viewMode === 'team') {
      matchesAssignment = valuation.teamMembers?.includes(userId || '') || false
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
            <ContextMenu>
              <ContextMenuTrigger>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex cursor-pointer items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                          <Calculator className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground transition-colors hover:text-primary">
                          {valuation.clientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {valuation.valuationType} Valuation
                        </div>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">{valuation.clientName}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Valuation Type:</span>
                          <span className="font-medium text-foreground">
                            {valuation.valuationType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className={getStatusColor(valuation.status)} variant="outline">
                            {valuation.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {valuation.value > 0 && (
                          <div className="flex justify-between">
                            <span>Value:</span>
                            <span className="font-medium text-foreground">
                              {formatCurrency(valuation.value)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-medium text-foreground">
                            {formatDate(valuation.createdDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem asChild>
                  <Link href={`/valuations/${valuation.id}`} className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </ContextMenuItem>
                <ContextMenuItem asChild>
                  <Link href={`/valuations/${valuation.id}/overview`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Valuation
                  </Link>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDeleteClick(valuation)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
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
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.original.createdDate)}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const valuation = row.original
          return (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/valuations/${valuation.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/valuations/${valuation.id}/overview`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )
        },
      },
    ],
    [userId]
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Valuations"
          description="Manage all your valuation projects"
          action={
            <Button asChild>
              <Link href="/valuations/new">
                <Plus className="mr-2 h-4 w-4" />
                New Valuation
              </Link>
            </Button>
          }
        />

        <SummaryCardsGrid cards={summaryCards} />

        <Card>
          <CardContent className="p-6">
            <OptimizedDataTable columns={columns} data={filteredValuations} searchable sortable />
          </CardContent>
        </Card>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Valuation"
          description={`Are you sure you want to delete the valuation for "${valuationToDelete?.clientName}"? This action cannot be undone.`}
          onConfirm={deleteValuation}
          confirmText="Delete"
          variant="destructive"
        />
      </div>
    </AppLayout>
  )
}
