'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AppLayout from '@/components/layout/AppLayout'

interface ClientFormData {
  name: string
  industry: string
  location: string
  email: string
  phone: string
  contactPerson: string
  status: 'active' | 'inactive' | 'prospect'
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    industry: '',
    location: '',
    email: '',
    phone: '',
    contactPerson: '',
    status: 'active',
  })

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
        setFormData({
          name: data.name || '',
          industry: data.industry || 'Technology',
          location: data.location || 'San Francisco, CA',
          email: data.email || `contact@${data.name?.toLowerCase().replace(/\\s+/g, '')}.com`,
          phone: data.phone || '+1 (555) 123-4567',
          contactPerson: data.contact_person || 'John Smith',
          status: data.status || 'active',
        })
      } else if (response.status === 404) {
        setError('Client not found')
      } else {
        setError('Failed to fetch client details')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      setError('Failed to fetch client details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          industry: formData.industry,
          location: formData.location,
          email: formData.email,
          phone: formData.phone,
          contact_person: formData.contactPerson,
          status: formData.status,
        }),
      })

      if (response.ok) {
        router.push(`/clients/${clientId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update client')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      setError('Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
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

  if (error && !formData.name) {
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
                The client you're trying to edit doesn't exist or has been removed.
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
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/clients/${clientId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Client</h1>
              <p className="text-muted-foreground">Update client information and status</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                    disabled={saving}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleChange('industry', value)}
                    disabled={saving}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="FinTech">FinTech</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="SaaS">SaaS</SelectItem>
                      <SelectItem value="Biotech">Biotech</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Consumer">Consumer</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    disabled={saving}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    disabled={saving}
                    placeholder="e.g., John Smith"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={saving}
                    placeholder="contact@company.com"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={saving}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/clients/${clientId}`)}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
