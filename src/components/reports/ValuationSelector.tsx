'use client'

import { useState, useEffect } from 'react'
import { Search, Building2, Calculator, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

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

interface Client {
  id: number
  name: string
  industry?: string
  location?: string
  valuations?: Valuation[]
}

interface Props {
  selectedValuation: Valuation | null
  onValuationSelect: (valuation: Valuation) => void
}

export function ValuationSelector({ selectedValuation, onValuationSelect }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [valuations, setValuations] = useState<Valuation[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'clients' | 'valuations'>('clients')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mock data - in real app this would fetch from your API
      const mockValuations: Valuation[] = [
        {
          id: 1,
          clientName: 'TechStart Inc.',
          valuationType: '409A',
          status: 'completed',
          value: 15000000,
          createdDate: '2024-01-01',
          completedDate: '2024-01-10',
          nextReview: '2024-04-01',
        },
        {
          id: 2,
          clientName: 'InnovateCorp',
          valuationType: '409A',
          status: 'completed',
          value: 8500000,
          createdDate: '2024-01-05',
          completedDate: '2024-01-15',
        },
        {
          id: 3,
          clientName: 'StartupXYZ',
          valuationType: '409A',
          status: 'completed',
          value: 3200000,
          createdDate: '2023-12-10',
          completedDate: '2023-12-20',
        },
        {
          id: 5,
          clientName: 'TechStart Inc.',
          valuationType: '409A',
          status: 'completed',
          value: 12000000,
          createdDate: '2023-10-01',
          completedDate: '2023-10-15',
        },
      ]

      const mockClients: Client[] = [
        {
          id: 1,
          name: 'TechStart Inc.',
          industry: 'Technology',
          location: 'San Francisco, CA',
          valuations: mockValuations.filter((v) => v.clientName === 'TechStart Inc.'),
        },
        {
          id: 2,
          name: 'InnovateCorp',
          industry: 'SaaS',
          location: 'Austin, TX',
          valuations: mockValuations.filter((v) => v.clientName === 'InnovateCorp'),
        },
        {
          id: 3,
          name: 'StartupXYZ',
          industry: 'FinTech',
          location: 'New York, NY',
          valuations: mockValuations.filter((v) => v.clientName === 'StartupXYZ'),
        },
      ]

      setValuations(mockValuations.filter((v) => v.status === 'completed'))
      setClients(mockClients.filter((c) => c.valuations && c.valuations.length > 0))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredValuations = valuations.filter(
    (valuation) =>
      valuation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      valuation.valuationType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading valuations...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Select Valuation for Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Clients or Valuations</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by client name, industry, or valuation type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex w-fit space-x-2 rounded-lg bg-muted p-1">
          <Button
            variant={viewMode === 'clients' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('clients')}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            By Client
          </Button>
          <Button
            variant={viewMode === 'valuations' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('valuations')}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            All Valuations
          </Button>
        </div>

        {/* Selected Valuation Display */}
        {selectedValuation && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">{selectedValuation.clientName}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedValuation.valuationType} • {formatCurrency(selectedValuation.value)} •{' '}
                  {formatDate(selectedValuation.completedDate || selectedValuation.createdDate)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onValuationSelect(null as any)}>
                Change
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {!selectedValuation && (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {viewMode === 'clients' ? (
              // Client view
              <>
                {filteredClients.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No clients with completed 409A valuations found
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div key={client.id} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{client.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {client.industry} • {client.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {client.valuations?.length} Valuations
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {client.valuations?.map((valuation) => (
                          <div
                            key={valuation.id}
                            className="flex cursor-pointer items-center justify-between rounded-md border bg-background p-3 transition-colors hover:bg-accent/50"
                            onClick={() => onValuationSelect(valuation)}
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {valuation.valuationType} Valuation
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(valuation.completedDate || valuation.createdDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(valuation.value)}
                              </p>
                              <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              // All valuations view
              <>
                {filteredValuations.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No completed 409A valuations found
                  </div>
                ) : (
                  filteredValuations.map((valuation) => (
                    <div
                      key={valuation.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                      onClick={() => onValuationSelect(valuation)}
                    >
                      <div>
                        <h4 className="font-medium text-foreground">{valuation.clientName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {valuation.valuationType} •{' '}
                          {formatDate(valuation.completedDate || valuation.createdDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(valuation.value)}</p>
                        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
