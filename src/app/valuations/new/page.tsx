'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calculator, FileText, DollarSign } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import {
  FormCard,
  FormSection,
  FormGrid,
  FormField,
  FormSelect,
  FormTextarea,
  FormActions,
  SubmitButton
} from '@/components/ui/form-components'
import { Button } from '@/components/ui/button'

export default function NewValuationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    valuationType: '409A',
    valuationDate: '',
    purpose: '',
    methodology: 'DCF',
    shares: '',
    preferences: '',
    notes: '',
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
      console.log('Saving valuation:', formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect back to valuations page
      router.push('/valuations')
    } catch (error) {
      console.error('Failed to save valuation:', error)
    } finally {
      setLoading(false)
    }
  }

  // Options for form selects
  const clientOptions = [
    { value: 'TechStart Inc.', label: 'TechStart Inc.' },
    { value: 'InnovateCorp', label: 'InnovateCorp' },
    { value: 'StartupXYZ', label: 'StartupXYZ' },
    { value: 'NextGen Solutions', label: 'NextGen Solutions' }
  ]

  const valuationTypeOptions = [
    { value: '409A', label: '409A Valuation' },
    { value: 'Pre-Money', label: 'Pre-Money Valuation' },
    { value: 'Post-Money', label: 'Post-Money Valuation' },
    { value: 'Fairness Opinion', label: 'Fairness Opinion' }
  ]

  const methodologyOptions = [
    { value: 'DCF', label: 'Discounted Cash Flow' },
    { value: 'Market', label: 'Market Approach' },
    { value: 'Asset', label: 'Asset Approach' },
    { value: 'Hybrid', label: 'Hybrid Approach' }
  ]

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/valuations" className="rounded-md p-2 transition-colors hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">New Valuation</h1>
            <p className="mt-1 text-muted-foreground">Create a new 409A or financial valuation</p>
          </div>
        </div>

        {/* Form */}
        <FormCard onSubmit={handleSubmit}>
          <FormSection title="Valuation Details" icon={Calculator}>
            <FormGrid columns={2}>
              <FormSelect
                label="Client/Company"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                options={clientOptions}
                placeholder="Select client"
                required
              />

              <FormSelect
                label="Valuation Type"
                id="valuationType"
                name="valuationType"
                value={formData.valuationType}
                onChange={handleInputChange}
                options={valuationTypeOptions}
                required
              />

              <FormField
                label="Valuation Date"
                id="valuationDate"
                name="valuationDate"
                type="text"
                value={formData.valuationDate}
                onChange={handleInputChange}
                placeholder="2024-01-15"
                required
              />

              <FormSelect
                label="Methodology"
                id="methodology"
                name="methodology"
                value={formData.methodology}
                onChange={handleInputChange}
                options={methodologyOptions}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Additional Information" icon={FileText}>
            <FormGrid columns={1}>
              <FormTextarea
                label="Purpose"
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Describe the purpose of this valuation..."
                rows={3}
              />

              <FormTextarea
                label="Notes"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional notes or comments..."
                rows={4}
              />
            </FormGrid>
          </FormSection>

          <FormSection title="Share Structure" icon={DollarSign}>
            <FormGrid columns={2}>
              <FormField
                label="Outstanding Shares"
                id="shares"
                name="shares"
                type="number"
                value={formData.shares}
                onChange={handleInputChange}
                placeholder="1000000"
              />

              <FormField
                label="Liquidation Preferences"
                id="preferences"
                name="preferences"
                value={formData.preferences}
                onChange={handleInputChange}
                placeholder="1x non-participating"
              />
            </FormGrid>
          </FormSection>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/valuations')}
              disabled={loading}
            >
              Cancel
            </Button>
            <SubmitButton loading={loading}>
              Create Valuation
            </SubmitButton>
          </FormActions>
        </FormCard>
      </div>
    </AppLayout>
  )
}