import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Edit, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ClientFormDialog } from '@/components/clients/ClientFormDialog'
import { ViewToggle } from '@/components/shared/ViewToggle'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Mock data for initial development
const mockClients = [
  {
    id: 1,
    name: 'Acme Corporation',
    primaryContact: 'John Smith',
    companiesCount: 3,
    activeProjects: 2,
    dateAdded: '2024-04-15',
  },
  {
    id: 2,
    name: 'Beta Industries',
    primaryContact: 'Sarah Johnson',
    companiesCount: 1,
    activeProjects: 1,
    dateAdded: '2024-04-10',
  },
]

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isClientFormOpen, setIsClientFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  const sortedClients = [...mockClients].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof a]

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1
    }
    return aValue < bValue ? 1 : -1
  })

  const filteredClients = sortedClients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openEditForm = (client: any) => {
    setSelectedClient(client)
    setIsClientFormOpen(true)
  }

  const openAddForm = () => {
    setSelectedClient(null)
    setIsClientFormOpen(true)
  }

  const ClientCard = ({ client }: { client: any }) => {
    return (
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{client.name}</CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Primary Contact:</span>{' '}
              {client.primaryContact}
            </p>
            <p>
              <span className="font-medium text-foreground">Associated Companies:</span>{' '}
              {client.companiesCount}
            </p>
            <p>
              <span className="font-medium text-foreground">Active Projects:</span>{' '}
              {client.activeProjects}
            </p>
            <p>
              <span className="font-medium text-foreground">Date Added:</span>{' '}
              {new Date(client.dateAdded).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
        <div className="mt-2 flex justify-end border-t p-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/clients/${client.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openEditForm(client)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search Clients by Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} />
          <Button onClick={openAddForm}>+ Add New Client</Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('name')}
                >
                  Client Name{' '}
                  {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead>Associated Companies</TableHead>
                <TableHead>Active Projects</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('dateAdded')}
                >
                  Date Added{' '}
                  {sortConfig.key === 'dateAdded' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.primaryContact}</TableCell>
                  <TableCell>{client.companiesCount}</TableCell>
                  <TableCell>{client.activeProjects}</TableCell>
                  <TableCell>{new Date(client.dateAdded).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/clients/${client.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditForm(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientFormDialog
        open={isClientFormOpen}
        onOpenChange={setIsClientFormOpen}
        client={selectedClient}
      />
    </div>
  )
}
