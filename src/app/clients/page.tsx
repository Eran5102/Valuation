'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Building2,
  Plus,
  Calculator,
  Users as UsersIcon,
  MapPin,
  Mail,
  TrendingUp,
  User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import { getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/ui/page-header'
import { TableActionButtons } from '@/components/ui/table-action-buttons'
import { StatusSelector } from '@/components/ui/status-selector'
import { AssignmentSelector } from '@/components/assignment/AssignmentSelector'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

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

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery] = useState('')
  const [statusFilter] = useState<'all' | 'active' | 'inactive' | 'prospect'>('all')
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'team'>('all')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const result = await response.json()
        // The API returns { data: [], pagination: {} }, so we need to access result.data
        const companies = result.data || []

        // Transform the data to use actual database values
        const transformedClients: Client[] = companies.map((company: any) => ({
          id: company.id,
          name: company.name,
          industry: company.industry,
          location:
            company.city && company.state ? `${company.city}, ${company.state}` : company.location,
          email: company.email,
          phone: company.phone,
          contactPerson: company.contact_name,
          valuationCount: company.valuation_count || 0,
          reportCount: company.report_count || 0,
          lastActivity: company.updated_at || company.created_at,
          status: company.status || 'active',
          createdAt: company.created_at || new Date().toISOString(),
          assignedTo: company.assigned_to || null,
          teamMembers: company.team_members || [],
        }))

        setClients(transformedClients)
      } else {
        // Fallback to mock data if API is not available
        const mockClients: Client[] = [
          {
            id: 1,
            name: 'TechStart Inc.',
            industry: 'Technology',
            location: 'San Francisco, CA',
            email: 'contact@techstart.com',
            phone: '+1 (555) 123-4567',
            contactPerson: 'John Smith',
            valuationCount: 3,
            reportCount: 2,
            lastActivity: '2024-01-15',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 2,
            name: 'InnovateCorp',
            industry: 'Healthcare',
            location: 'Boston, MA',
            email: 'info@innovatecorp.com',
            phone: '+1 (555) 987-6543',
            contactPerson: 'Sarah Johnson',
            valuationCount: 2,
            reportCount: 1,
            lastActivity: '2024-01-12',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 3,
            name: 'StartupXYZ',
            industry: 'FinTech',
            location: 'New York, NY',
            email: 'hello@startupxyz.com',
            phone: '+1 (555) 456-7890',
            contactPerson: 'Mike Wilson',
            valuationCount: 1,
            reportCount: 1,
            lastActivity: '2024-01-10',
            status: 'prospect',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ]
        setClients(mockClients)
      }
    } catch (error) {
      // Error handled by displaying mock data
      // Set mock data on error
      const mockClients: Client[] = [
        {
          id: 1,
          name: 'TechStart Inc.',
          industry: 'Technology',
          location: 'San Francisco, CA',
          email: 'contact@techstart.com',
          phone: '+1 (555) 123-4567',
          contactPerson: 'John Smith',
          valuationCount: 3,
          reportCount: 2,
          lastActivity: '2024-01-15',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      setClients(mockClients)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter

    // Filter by assignment
    let matchesAssignment = true
    if (viewMode === 'my') {
      matchesAssignment = client.assignedTo === user?.id
    } else if (viewMode === 'team') {
      matchesAssignment = client.teamMembers?.includes(user?.id || '') || false
    }

    return matchesSearch && matchesStatus && matchesAssignment
  })

  const deleteClient = useCallback(
    async (clientId: number) => {
      if (confirm('Are you sure you want to delete this client?')) {
        try {
          await fetch(`/api/companies/${clientId}`, {
            method: 'DELETE',
          })
          fetchClients() // Refresh the list
        } catch (error) {
          // TODO: Implement user notification for failed deletion
        }
      }
    },
    [fetchClients]
  )

  const handleClientStatusChange = useCallback(async (clientId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/companies/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update the local state to reflect the change
        setClients((prev) =>
          prev.map((client) =>
            client.id === clientId
              ? { ...client, status: newStatus as 'active' | 'inactive' | 'prospect' }
              : client
          )
        )
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      // TODO: Implement user notification for failed status update
      throw error
    }
  }, [])

  // Calculate metrics for summary cards
  const metrics = useMemo(() => {
    const totalClients = clients.length
    const activeClients = clients.filter((c) => c.status === 'active').length
    const newThisMonth = clients.filter((c) => {
      const createdDate = new Date(c.createdAt)
      const now = new Date()
      return (
        createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
      )
    }).length
    const totalValuations = clients.reduce((sum, c) => sum + (c.valuationCount || 0), 0)

    return { totalClients, activeClients, newThisMonth, totalValuations }
  }, [clients])

  const summaryCards: SummaryCard[] = useMemo(
    () => [
      {
        icon: UsersIcon,
        iconColor: 'primary',
        label: 'Total Clients',
        value: metrics.totalClients,
      },
      {
        icon: UsersIcon,
        iconColor: 'accent',
        label: 'Active Clients',
        value: metrics.activeClients,
      },
      {
        icon: TrendingUp,
        iconColor: 'chart-1',
        label: 'New This Month',
        value: metrics.newThisMonth,
      },
      {
        icon: Calculator,
        iconColor: 'chart-2',
        label: 'Total Valuations',
        value: metrics.totalValuations,
      },
    ],
    [metrics]
  )

  // Define columns for DataTable
  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      {
        id: 'client',
        header: 'Client',
        accessorKey: 'name',
        enableSorting: true,
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{client.name}</div>
                <div className="text-sm text-muted-foreground">{client.industry}</div>
              </div>
            </div>
          )
        },
      },
      {
        id: 'contact',
        header: 'Contact',
        accessorKey: 'contactPerson',
        enableSorting: true,
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="text-sm">
              <div className="font-medium text-foreground">{client.contactPerson}</div>
              <div className="mt-1 flex items-center text-muted-foreground">
                <Mail className="mr-1 h-3 w-3" />
                {client.email}
              </div>
            </div>
          )
        },
      },
      {
        id: 'location',
        header: 'Location',
        accessorKey: 'location',
        enableSorting: true,
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="flex items-center text-sm text-foreground">
              <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
              {client.location}
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
          const client = row.original
          return (
            <StatusSelector
              currentStatus={client.status}
              statusType="client"
              onStatusChange={(newStatus) => handleClientStatusChange(client.id, newStatus)}
            />
          )
        },
      },
      {
        id: 'assignment',
        header: 'Assignment',
        accessorKey: 'assignedTo',
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original
          return (
            <AssignmentSelector
              assignedTo={client.assignedTo}
              teamMembers={client.teamMembers || []}
              onAssignmentChange={async (assignedTo, teamMembers) => {
                // Update client assignment
                try {
                  const response = await fetch(`/api/companies/${client.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ assigned_to: assignedTo, team_members: teamMembers }),
                  })
                  if (response.ok) {
                    setClients((prev) =>
                      prev.map((c) => (c.id === client.id ? { ...c, assignedTo, teamMembers } : c))
                    )
                  }
                } catch (error) {
                  console.error('Failed to update assignment:', error)
                }
              }}
              entityType="client"
            />
          )
        },
      },
      {
        id: 'projects',
        header: 'Projects',
        accessorKey: 'valuationCount',
        enableSorting: true,
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="text-sm">
              <div className="flex items-center justify-between text-foreground">
                <span>{client.valuationCount} Valuations</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-muted-foreground">
                <span>{client.reportCount} Reports</span>
              </div>
            </div>
          )
        },
      },
      {
        id: 'lastActivity',
        header: 'Last Activity',
        accessorKey: 'lastActivity',
        enableSorting: true,
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className="text-sm text-foreground">
              {formatDate(client.lastActivity || client.createdAt)}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original
          return (
            <TableActionButtons
              itemId={client.id}
              viewHref={`/clients/${client.id}`}
              editHref={`/clients/${client.id}/edit`}
              onDelete={() => deleteClient(client.id)}
            />
          )
        },
      },
    ],
    [deleteClient, handleClientStatusChange]
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading clients...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <PageHeader
          title="Client Management"
          description="Manage your clients and their valuation projects"
          actionButton={{
            href: '/clients/new',
            icon: Plus,
            text: 'Add Client',
          }}
        >
          <div className="flex items-center gap-2">
            <Badge
              variant={viewMode === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('all')}
            >
              All Clients
            </Badge>
            <Badge
              variant={viewMode === 'my' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('my')}
            >
              <User className="mr-1 h-3 w-3" />
              My Clients
            </Badge>
            <Badge
              variant={viewMode === 'team' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setViewMode('team')}
            >
              <UsersIcon className="mr-1 h-3 w-3" />
              Team Clients
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
              data={filteredClients}
              searchPlaceholder="Search clients..."
              tableId="clients-table"
              enableColumnFilters
              enableSorting
              enableColumnVisibility
              enableColumnReordering
              enableColumnPinning
              enableRowReordering
              onRowReorder={(fromIndex, toIndex) => {
                // Reorder the clients array
                const reorderedClients = [...filteredClients]
                const [movedClient] = reorderedClients.splice(fromIndex, 1)
                reorderedClients.splice(toIndex, 0, movedClient)
                setClients(reorderedClients)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
