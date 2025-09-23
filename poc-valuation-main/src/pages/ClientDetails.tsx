import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, FileCog, UserRound, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientFormDialog } from '@/components/clients/ClientFormDialog'
import { DataTable } from '@/components/shared/DataTable'
import type { TableColumn } from '@/components/shared/StandardTable'

// Mock client data until connected to a backend
const mockClientData = {
  1: {
    id: 1,
    name: 'Acme Corporation',
    primaryContact: 'John Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, New York, NY 10001',
    website: 'www.acmecorp.com',
    industry: 'Technology',
    notes: 'Large enterprise client with multiple subsidiaries.',
    dateAdded: '2024-04-15',
    companies: [
      { id: 1, name: 'Acme Tech Solutions', sector: 'Software', revenue: '$25M' },
      { id: 2, name: 'Acme Manufacturing', sector: 'Manufacturing', revenue: '$42M' },
      { id: 3, name: 'Acme Logistics', sector: 'Transportation', revenue: '$18M' },
    ],
    projects: [
      {
        id: 101,
        name: 'Acme Tech Valuation',
        company: 'Acme Tech Solutions',
        status: 'In Progress',
        date: '2024-04-01',
      },
      {
        id: 102,
        name: 'Acme Manufacturing DCF Analysis',
        company: 'Acme Manufacturing',
        status: 'Completed',
        date: '2024-03-15',
      },
    ],
    contacts: [
      {
        id: 201,
        name: 'John Smith',
        title: 'CEO',
        email: 'john.smith@acmecorp.com',
        phone: '+1 (555) 123-4567',
      },
      {
        id: 202,
        name: 'Sarah Johnson',
        title: 'CFO',
        email: 'sarah.johnson@acmecorp.com',
        phone: '+1 (555) 987-6543',
      },
    ],
  },
  2: {
    id: 2,
    name: 'Beta Industries',
    primaryContact: 'Sarah Johnson',
    email: 'sarah.j@betaindustries.com',
    phone: '+1 (555) 222-3333',
    address: '456 Market Street, San Francisco, CA 94105',
    website: 'www.betaindustries.com',
    industry: 'Manufacturing',
    notes: 'Mid-sized regional manufacturer looking to expand.',
    dateAdded: '2024-04-10',
    companies: [{ id: 4, name: 'Beta Manufacturing', sector: 'Manufacturing', revenue: '$15M' }],
    projects: [
      {
        id: 103,
        name: 'Beta Expansion Analysis',
        company: 'Beta Manufacturing',
        status: 'In Progress',
        date: '2024-04-05',
      },
    ],
    contacts: [
      {
        id: 203,
        name: 'Sarah Johnson',
        title: 'President',
        email: 'sarah.j@betaindustries.com',
        phone: '+1 (555) 222-3333',
      },
    ],
  },
}

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    // In a real app, you would fetch client data from your API
    // For now, we'll use our mock data
    if (clientId && mockClientData[clientId as unknown as keyof typeof mockClientData]) {
      setClient(mockClientData[clientId as unknown as keyof typeof mockClientData])
    }
    setLoading(false)
  }, [clientId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border-finance-primary h-12 w-12 animate-spin rounded-full border-b-2 border-t-2"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <h1 className="mb-4 text-xl font-semibold">Client Not Found</h1>
        <p className="mb-4">
          The client you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link to="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
          </Link>
        </Button>
      </div>
    )
  }

  // Column definitions for the companies table
  const companiesColumns: TableColumn<any>[] = [
    { id: 'name', header: 'Company Name', accessorKey: 'name' },
    { id: 'sector', header: 'Sector', accessorKey: 'sector' },
    { id: 'revenue', header: 'Revenue', accessorKey: 'revenue' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: any } }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/companies/${row.original.id}`}>View Details</Link>
        </Button>
      ),
    },
  ]

  // Column definitions for the projects table
  const projectsColumns: TableColumn<any>[] = [
    { id: 'name', header: 'Project Name', accessorKey: 'name' },
    { id: 'company', header: 'Company', accessorKey: 'company' },
    { id: 'status', header: 'Status', accessorKey: 'status' },
    { id: 'date', header: 'Date Started', accessorKey: 'date' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: any } }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/workspace/${row.original.id}`}>Open Workspace</Link>
        </Button>
      ),
    },
  ]

  // Column definitions for the contacts table
  const contactsColumns: TableColumn<any>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'title', header: 'Title', accessorKey: 'title' },
    { id: 'email', header: 'Email', accessorKey: 'email' },
    { id: 'phone', header: 'Phone', accessorKey: 'phone' },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Back button and actions row */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link to="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Client
          </Button>
          <Button variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Client profile card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <UserRound className="mr-2 h-6 w-6" />
            {client.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-lg font-medium">Contact Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Primary Contact:</span> {client.primaryContact}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {client.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {client.phone}
                </p>
                <p>
                  <span className="font-medium">Address:</span> {client.address}
                </p>
                <p>
                  <span className="font-medium">Website:</span> {client.website}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-medium">Client Details</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Industry:</span> {client.industry}
                </p>
                <p>
                  <span className="font-medium">Date Added:</span>{' '}
                  {new Date(client.dateAdded).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Companies:</span> {client.companies.length}
                </p>
                <p>
                  <span className="font-medium">Projects:</span> {client.projects.length}
                </p>
                <p>
                  <span className="font-medium">Notes:</span> {client.notes}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for associated data */}
      <Tabs defaultValue="companies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Companies
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FileCog className="h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <UserRound className="h-4 w-4" /> Contacts
          </TabsTrigger>
        </TabsList>
        <TabsContent value="companies" className="pt-4">
          <DataTable
            columns={companiesColumns}
            data={client.companies}
            emptyMessage="No companies associated with this client"
          />
          <div className="mt-4">
            <Button>+ Add Company</Button>
          </div>
        </TabsContent>
        <TabsContent value="projects" className="pt-4">
          <DataTable
            columns={projectsColumns}
            data={client.projects}
            emptyMessage="No projects associated with this client"
          />
          <div className="mt-4">
            <Button>+ Create New Project</Button>
          </div>
        </TabsContent>
        <TabsContent value="contacts" className="pt-4">
          <DataTable
            columns={contactsColumns}
            data={client.contacts}
            emptyMessage="No contacts associated with this client"
          />
          <div className="mt-4">
            <Button>+ Add Contact</Button>
          </div>
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        client={client}
      />
    </div>
  )
}
