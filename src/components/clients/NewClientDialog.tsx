'use client'

import React, { useState } from 'react'
import { Building2, MapPin, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  FormSection,
  FormGrid,
  FormField,
  FormTextarea,
  FormActions,
  SubmitButton,
} from '@/components/ui/form-components'

interface NewClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientCreated?: (client: { id: string; name: string }) => void
}

export function NewClientDialog({ open, onOpenChange, onClientCreated }: NewClientDialogProps) {
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
      const locationInfo = [formData.address, formData.city, formData.state, formData.zipCode]
        .filter(Boolean)
        .join(', ')

      const companyData: any = {
        name: formData.companyName,
        legal_name: formData.companyName,
        industry: formData.industry,
        state_of_incorporation: formData.state || null,
        location: locationInfo || null,
      }

      // Only add new fields if they're not empty
      if (formData.contactName) companyData.contact_name = formData.contactName
      if (formData.email) companyData.email = formData.email
      if (formData.phone) companyData.phone = formData.phone
      if (formData.website) companyData.website = formData.website
      if (formData.description) companyData.description = formData.description
      if (formData.address) companyData.address = formData.address
      if (formData.city) companyData.city = formData.city
      if (formData.state) companyData.state = formData.state
      if (formData.zipCode) companyData.zip_code = formData.zipCode

      // Call API to create company
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(
          'Server error: Unable to process request. Please ensure Supabase environment variables are configured.'
        )
      }

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('A company with this name already exists')
        } else if (response.status === 500 && responseData.error === 'Configuration Error') {
          throw new Error(
            'Database configuration error. Please ensure environment variables are properly configured.'
          )
        } else {
          throw new Error(responseData.message || 'Failed to create client')
        }
      }

      // Notify parent component
      if (onClientCreated) {
        onClientCreated(responseData.data)
      }

      // Reset form and close dialog
      setFormData({
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
      onOpenChange(false)
    } catch (error) {

      let errorMessage = 'Failed to create client. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
        if (error.message.includes('Failed to execute') || error.message.includes('JSON')) {
          errorMessage =
            'Connection error: Unable to reach the server. Please check your configuration.'
        }
      }
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <FormSection title="Company Information" icon={Building2}>
            <FormGrid columns={2}>
              <FormField
                label="Company Name"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                required
              />
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
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-card-foreground hover:border-[#74BD92]/50 focus:border-[#74BD92] focus:outline-none focus:ring-2 focus:ring-[#74BD92]"
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
            </FormGrid>
            <FormField
              label="Website"
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </FormSection>

          {/* Contact Information */}
          <FormSection title="Primary Contact" icon={User}>
            <FormGrid columns={2}>
              <FormField
                label="Contact Name"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                placeholder="Enter contact name"
                required
              />
              <FormField
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@company.com"
                required
              />
            </FormGrid>
            <FormField
              label="Phone Number"
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 123-4567"
            />
          </FormSection>

          {/* Address Information */}
          <FormSection title="Business Address" icon={MapPin}>
            <FormField
              label="Street Address"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Business St"
            />
            <FormGrid columns={3}>
              <FormField
                label="City"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="San Francisco"
              />
              <FormField
                label="State"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="CA"
              />
              <FormField
                label="ZIP Code"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="94105"
              />
            </FormGrid>
          </FormSection>

          {/* Description */}
          <FormTextarea
            label="Company Description"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of the company and business model..."
            rows={3}
          />

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <SubmitButton loading={loading}>Create Client</SubmitButton>
          </FormActions>
        </form>
      </DialogContent>
    </Dialog>
  )
}
