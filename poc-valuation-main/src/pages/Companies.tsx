import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Edit, Search, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import CompanyFormDialog from '@/components/companies/CompanyFormDialog'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ViewToggle } from '@/components/shared/ViewToggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCompanyManagement, Company } from '@/hooks/useCompanyManagement'

export default function Companies() {
  const { companies, clients, saveCompany } = useCompanyManagement()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string>('all')
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  const filteredAndSortedCompanies = [...companies]
    .filter((company) => {
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClient = selectedClientId === 'all' || company.clientId === selectedClientId
      return matchesSearch && matchesClient
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a]
      const bValue = b[sortConfig.key as keyof typeof b]

      if (aValue && bValue) {
        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1
        }
        return aValue < bValue ? 1 : -1
      }
      return 0
    })

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setDialogOpen(true)
  }

  const handleSaveCompany = (companyData: Partial<Company>) => {
    saveCompany(companyData)
    setDialogOpen(false)
  }

  const CompanyCard = ({ company }: { company: Company }) => (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{company.name}</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Client:</span>{' '}
            {company.clientName || 'None'}
          </p>
          <p>
            <span className="font-medium text-foreground">Industry:</span>{' '}
            {company.industry || 'Not specified'}
          </p>
          <p>
            <span className="font-medium text-foreground">Added:</span>{' '}
            {new Date(company.dateAdded).toLocaleDateString()}
          </p>
          <p>
            <span className="font-medium text-foreground">Currency:</span>{' '}
            {company.currency || 'Not specified'}
          </p>
          <p>
            <span className="font-medium text-foreground">FY End:</span>{' '}
            {company.fyEnd
              ? `${company.fyEnd.split('-')[1]}-${company.fyEnd.split('-')[0]}`
              : 'Not specified'}
          </p>
        </div>
      </CardContent>
      <div className="mt-2 flex justify-end gap-2 border-t p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/companies/${company.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/workspace/${company.id}/company-data`}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} />
          <Button
            onClick={() => {
              setEditingCompany(null)
              setDialogOpen(true)
            }}
          >
            + Add New Company
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
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
                  Company Name{' '}
                  {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('clientName')}
                >
                  Client
                </TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>FY End</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary"
                  onClick={() => handleSort('dateAdded')}
                >
                  Date Added
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.clientName || 'None'}</TableCell>
                  <TableCell>{company.industry || 'Not specified'}</TableCell>
                  <TableCell>{company.currency || 'Not specified'}</TableCell>
                  <TableCell>
                    {company.fyEnd
                      ? `${company.fyEnd.split('-')[1]}-${company.fyEnd.split('-')[0]}`
                      : 'Not specified'}
                  </TableCell>
                  <TableCell>{new Date(company.dateAdded).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/companies/${company.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/workspace/${company.id}/company-data`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCompany={editingCompany || undefined}
        clients={clients}
        onSave={handleSaveCompany}
      />
    </div>
  )
}
