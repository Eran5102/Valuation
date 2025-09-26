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
import { getStatusColor, formatDate } from '@/lib/utils'
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

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      fetchClient()
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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
