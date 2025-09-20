'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, User } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    industry: '',
    website: '',
    description: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real app, this would save to Supabase
      // TODO: Implement actual API call to save client

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect back to clients page
      router.push('/clients')
    } catch (error) {
      // TODO: Implement user notification for failed save
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/clients" className="rounded-md p-2 transition-colors hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Client</h1>
            <p className="mt-1 text-muted-foreground">
              Create a new client profile for 409A valuations
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-border bg-card shadow">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Company Information */}
            <div>
              <h3 className="mb-4 flex items-center text-lg font-medium text-card-foreground">
                <Building2 className="mr-2 h-5 w-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="companyName"
                    className="mb-1 block text-sm font-medium text-card-foreground"
                  >
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="industry"
                    className="mb-1 block text-sm font-medium text-card-foreground"
                  >
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="website"
                    className="mb-1 block text-sm font-medium text-card-foreground"
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="mb-4 flex items-center text-lg font-medium text-card-foreground">
                <User className="mr-2 h-5 w-5" />
                Primary Contact
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="contactName"
                    className="mb-1 block text-sm font-medium text-card-foreground"
                  >
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    required
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-card-foreground"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-sm font-medium text-card-foreground"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="mb-4 flex items-center text-lg font-medium text-card-foreground">
                <MapPin className="mr-2 h-5 w-5" />
                Business Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="address"
                    className="mb-1 block text-sm font-medium text-card-foreground"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="123 Business St"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-1 block text-sm font-medium text-card-foreground"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="state"
                      className="mb-1 block text-sm font-medium text-card-foreground"
                    >
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="zipCode"
                      className="mb-1 block text-sm font-medium text-card-foreground"
                    >
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="94105"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-card-foreground"
              >
                Company Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Brief description of the company and business model..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 border-t border-border pt-4">
              <Link
                href="/clients"
                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
