'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Building2, 
  Plus, 
  Calculator,
  Users as UsersIcon,
  MapPin,
  Mail,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import AppLayout from '@/components/layout/AppLayout'
import { getStatusColor, formatDate } from '@/lib/utils'
import { SummaryCardsGrid, SummaryCard } from '@/components/ui/summary-cards-grid'
import { PageHeader } from '@/components/ui/page-header'
import { TableActionButtons } from '@/components/ui/table-action-buttons'
import { StatusSelector } from '@/components/ui/status-selector'

interface Client {
  id: number;
  name: string;
  industry?: string;
  location?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  valuationCount?: number;
  reportCount?: number;
  lastActivity?: string;
  status: 'active' | 'inactive' | 'prospect';
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery] = useState('')
  const [statusFilter] = useState<'all' | 'active' | 'inactive' | 'prospect'>('all')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        
        // Transform the data to include additional client information
        const transformedClients: Client[] = data.map((company: unknown) => ({
          id: company.id,
          name: company.name,
          industry: company.industry || 'Technology',
          location: company.location || 'San Francisco, CA',
          email: company.email || `contact@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: company.phone || '+1 (555) 123-4567',
          contactPerson: company.contact_person || 'John Smith',
          valuationCount: Math.floor(Math.random() * 5) + 1,
          reportCount: Math.floor(Math.random() * 3) + 1,
          lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: company.status || 'active', // Use actual status from database, fallback to active
          createdAt: company.created_at || new Date().toISOString()
        }));
        
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
            createdAt: '2024-01-01T00:00:00.000Z'
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
            createdAt: '2024-01-01T00:00:00.000Z'
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
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ];
        setClients(mockClients);
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
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];
      setClients(mockClients);
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })


  const deleteClient = useCallback(async (clientId: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await fetch(`/api/companies/${clientId}`, {
          method: 'DELETE',
        });
        fetchClients(); // Refresh the list
      } catch (error) {
        // TODO: Implement user notification for failed deletion
      }
    }
  }, [fetchClients])

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
        setClients(prev => prev.map(client => 
          client.id === clientId 
            ? { ...client, status: newStatus as 'active' | 'inactive' | 'prospect' }
            : client
        ))
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
    const activeClients = clients.filter(c => c.status === 'active').length
    const newThisMonth = clients.filter(c => {
      const createdDate = new Date(c.createdAt)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && 
             createdDate.getFullYear() === now.getFullYear()
    }).length
    const totalValuations = clients.reduce((sum, c) => sum + (c.valuationCount || 0), 0)
    
    return { totalClients, activeClients, newThisMonth, totalValuations }
  }, [clients])

  const summaryCards: SummaryCard[] = useMemo(() => [
    {
      icon: UsersIcon,
      iconColor: 'primary',
      label: 'Total Clients',
      value: metrics.totalClients
    },
    {
      icon: UsersIcon,
      iconColor: 'accent',
      label: 'Active Clients',
      value: metrics.activeClients
    },
    {
      icon: TrendingUp,
      iconColor: 'chart-1',
      label: 'New This Month',
      value: metrics.newThisMonth
    },
    {
      icon: Calculator,
      iconColor: 'chart-2',
      label: 'Total Valuations',
      value: metrics.totalValuations
    }
  ], [metrics])

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
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {client.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {client.industry}
                </div>
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
              <div className="text-foreground font-medium">{client.contactPerson}</div>
              <div className="text-muted-foreground flex items-center mt-1">
                <Mail className="h-3 w-3 mr-1" />
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
            <div className="text-sm text-foreground flex items-center">
              <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
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
              <div className="flex items-center justify-between text-muted-foreground mt-1">
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
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading clients...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader 
          title="Client Management"
          description="Manage your clients and their valuation projects"
          actionButton={{
            href: "/clients/new",
            icon: Plus,
            text: "Add Client"
          }}
        />

        {/* Summary Cards */}
        <SummaryCardsGrid cards={summaryCards} />

        {/* DataTable */}
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={filteredClients}
              searchPlaceholder="Search clients..."
              tableId="clients-table"
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