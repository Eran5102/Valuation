'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Calculator,
  FileText,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AppLayout from '@/components/layout/AppLayout'
import { getStatusColor, formatDate, formatCurrency } from '@/lib/utils'
import { StatusSelector } from '@/components/ui/status-selector'

interface Client {
  id: number
  name: string
  industry?: string
  location?: string
  email?: string
  phone?: string
  contactPerson?: string
  status: 'active' | 'inactive' | 'prospect'
  createdAt: string
  updatedAt?: string
}

interface Valuation {
  id: string
  title: string
  valuation_date: string
  status: string
  equity_value?: number
  common_share_price?: number
  created_at: string
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [valuations, setValuations] = useState<Valuation[]>([])
  const [loading, setLoading] = useState(true)
  const [valuationsLoading, setValuationsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      fetchClient()
      fetchValuations()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/companies/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our client interface
        const transformedClient: Client = {
          id: data.id,
          name: data.name,
          industry: data.industry || 'Technology',
          location: data.location || 'San Francisco, CA',
          email: data.email || `contact@${data.name.toLowerCase().replace(/\\s+/g, '')}.com`,
          phone: data.phone || '+1 (555) 123-4567',
          contactPerson: data.contact_person || 'John Smith',
          status: data.status || 'active',
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at,
        }
        setClient(transformedClient)
      } else if (response.status === 404) {
        setError('Client not found')
      } else {
        setError('Failed to fetch client details')
      }
    } catch (error) {
      setError('Failed to fetch client details')
    } finally {
      setLoading(false)
    }
  }

  const fetchValuations = async () => {
    try {
      setValuationsLoading(true)
      const response = await fetch(`/api/valuations?company_id=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        // API might return { data: [...] } or just [...]
        setValuations(Array.isArray(data) ? data : data?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch valuations:', error)
      setValuations([])
    } finally {
      setValuationsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!client) return

    try {
      const response = await fetch(`/api/companies/${client.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedClient = await response.json()
        setClient((prev) =>
          prev
            ? { ...prev, status: updatedClient.status, updatedAt: updatedClient.updated_at }
            : null
        )
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      throw error
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading client details...</div>
        </div>
      </AppLayout>
    )
  }

  if (error || !client) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="mb-6 flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Client Not Found</h1>
              <p className="text-muted-foreground">
                The client you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </div>
          <Link href="/clients">
            <Button>Back to Clients</Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/clients')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                <div className="mt-1 flex items-center space-x-2">
                  <StatusSelector
                    currentStatus={client.status}
                    statusType="client"
                    onStatusChange={handleStatusChange}
                  />
                  <span className="text-muted-foreground">{client.industry}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Client
              </Button>
            </Link>
            <Link href={`/valuations?client=${client.id}`}>
              <Button>
                <Calculator className="mr-2 h-4 w-4" />
                View Valuations
              </Button>
            </Link>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{client.location}</p>
                </div>
              </div>
              {client.contactPerson && (
                <div className="flex items-center space-x-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Contact Person</p>
                    <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Client Since</p>
                  <p className="text-sm text-muted-foreground">{formatDate(client.createdAt)}</p>
                </div>
              </div>
              {client.updatedAt && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">{formatDate(client.updatedAt)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Industry</p>
                  <p className="text-sm text-muted-foreground">{client.industry}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Valuations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Valuations
              </div>
              <Link href={`/valuations/new?client=${client.id}`}>
                <Button size="sm">Create New</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {valuationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading valuations...</div>
              </div>
            ) : valuations.length === 0 ? (
              <div className="py-8 text-center">
                <Calculator className="text-muted-foreground/50 mx-auto h-12 w-12" />
                <p className="mt-2 text-sm text-muted-foreground">No valuations yet</p>
                <Link href={`/valuations/new?client=${client.id}`}>
                  <Button variant="outline" size="sm" className="mt-4">
                    Create First Valuation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {valuations.map((valuation) => (
                  <Link key={valuation.id} href={`/valuations/${valuation.id}`} className="block">
                    <div className="group rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium transition-colors group-hover:text-primary">
                            {valuation.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(valuation.valuation_date)}
                            </span>
                            {valuation.equity_value && (
                              <span>Equity Value: {formatCurrency(valuation.equity_value)}</span>
                            )}
                            {valuation.common_share_price && (
                              <span>
                                Share Price: {formatCurrency(valuation.common_share_price)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(valuation.status)}>{valuation.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                {valuations.length > 0 && (
                  <Link href={`/valuations?client=${client.id}`}>
                    <Button variant="outline" className="w-full">
                      View All Valuations ({valuations.length})
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href={`/valuations/new?client=${client.id}`}>
                <Button variant="outline">
                  <Calculator className="mr-2 h-4 w-4" />
                  Create New Valuation
                </Button>
              </Link>
              <Link href={`/reports?client=${client.id}`}>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.open(`mailto:${client.email}`)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
