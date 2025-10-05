'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Building2, Plus, Calculator, TrendingUp, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import dynamic from 'next/dynamic'
import { ColumnDef } from '@tanstack/react-table'
import AppLayout from '@/components/layout/AppLayout'
import { getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'

// Lazy load OptimizedDataTable with SSR enabled
const OptimizedDataTable = dynamic(
  () => import('@/components/ui/optimized-data-table').then((mod) => mod.OptimizedDataTable),
  {
    loading: () => <LoadingSpinner size="lg" className="p-8" />,
    ssr: true, // OPTIMIZED: Enable SSR
  }
)

interface Client {
  id: number
  name: string
  industry?: string
  location?: string
  email?: string
  phone?: string
  contactPerson?: string
  valuationCount?: number
  reportCount?: number
  lastActivity?: string
  status: 'active' | 'inactive' | 'prospect'
  createdAt: string
  assignedTo?: string | null
  teamMembers?: string[]
}

interface ClientsClientProps {
  initialClients: Client[]
  userId: string
}

export default function ClientsClient({ initialClients, userId }: ClientsClientProps) {
  const [clients] = useState<Client[]>(initialClients)
  const [searchQuery] = useState('')
  const [statusFilter] = useState<'all' | 'active' | 'inactive' | 'prospect'>('all')
  const [viewMode] = useState<'all' | 'my' | 'team'>('all')

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter

    // Filter by assignment
    let matchesAssignment = true
    if (viewMode === 'my') {
      matchesAssignment = client.assignedTo === userId
    } else if (viewMode === 'team') {
      matchesAssignment = client.teamMembers?.includes(userId || '') || false
    }

    return matchesSearch && matchesStatus && matchesAssignment
  })

  // Calculate metrics for summary cards
  const metrics = useMemo(() => {
    const totalClients = clients.length
    const activeClients = clients.filter((c) => c.status === 'active').length
    const totalValuations = clients.reduce((sum, c) => sum + (c.valuationCount || 0), 0)
    const totalReports = clients.reduce((sum, c) => sum + (c.reportCount || 0), 0)

    return { totalClients, activeClients, totalValuations, totalReports }
  }, [clients])

  const summaryCards: SummaryCard[] = useMemo(
    () => [
      {
        icon: Building2,
        iconColor: 'primary',
        label: 'Total Clients',
        value: metrics.totalClients,
      },
      {
        icon: TrendingUp,
        iconColor: 'accent',
        label: 'Active Clients',
        value: metrics.activeClients,
      },
      {
        icon: Calculator,
        iconColor: 'chart-1',
        label: 'Total Valuations',
        value: metrics.totalValuations,
      },
      {
        icon: User,
        iconColor: 'chart-2',
        label: 'Total Reports',
        value: metrics.totalReports,
      },
    ],
    [metrics]
  )

  // Define columns for DataTable
  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      {
        id: 'name',
        header: 'Client',
        accessorKey: 'name',
        enableSorting: true,
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{client.name}</div>
                <div className="text-sm text-muted-foreground">{client.industry || 'N/A'}</div>
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
            <Badge className={getStatusColor(status)} variant="outline">
              <span className="capitalize">{status}</span>
            </Badge>
          )
        },
      },
      {
        id: 'location',
        header: 'Location',
        accessorKey: 'location',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">{row.original.location || 'N/A'}</div>
        ),
      },
      {
        id: 'valuationCount',
        header: 'Valuations',
        accessorKey: 'valuationCount',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-sm font-medium text-foreground">
            {row.original.valuationCount || 0}
          </div>
        ),
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorKey: 'createdAt',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</div>
        ),
      },
    ],
    []
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Clients"
          description="Manage your client companies"
          action={
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                New Client
              </Link>
            </Button>
          }
        />

        <SummaryCardsGrid cards={summaryCards} />

        <Card>
          <CardContent className="p-6">
            <OptimizedDataTable columns={columns} data={filteredClients} searchable sortable />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
