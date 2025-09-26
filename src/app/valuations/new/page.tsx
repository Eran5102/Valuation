'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calculator, FileText } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import {
  FormCard,
  FormSection,
  FormGrid,
  FormSelect,
  FormTextarea,
  FormActions,
  SubmitButton,
} from '@/components/ui/form-components'
import { Button } from '@/components/ui/button'
import { ClientSelector } from '@/components/ui/client-selector'
import { NewClientDialog } from '@/components/clients/NewClientDialog'

export default function NewValuationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [formData, setFormData] = useState({
    companyId: '',
    valuationType: '409A',
    purpose: '',
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

  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({
      ...prev,
      companyId: clientId,
    }))
  }

  // Fetch companies on component mount
  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.data || [])
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleClientCreated = (client: { id: string; name: string }) => {
    // Add the new client to the list and select it
    setCompanies((prev) => [...prev, client])
    setFormData((prev) => ({
      ...prev,
      companyId: client.id,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare valuation data for API - only basic fields
      const valuationData: any = {
        company_id: formData.companyId,
        valuation_type: formData.valuationType,
        purpose: formData.purpose,
        status: 'draft',
        title: `${formData.valuationType} Valuation - ${new Date().toLocaleDateString()}`,
        notes: formData.notes,
        valuation_date: new Date().toISOString().split('T')[0], // Default to today, will be set in assumptions tab
        // Store notes in assumptions for backward compatibility
        assumptions: {
          notes: formData.notes,
        },
      }

      // Call API to create valuation
      const response = await fetch('/api/valuations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valuationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create valuation')
      }

      const result = await response.json()
      // Redirect to the new valuation page
      router.push(`/valuations/${result.data.id}`)
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to create valuation. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Prepare company options from fetched data
  const companyOptions = companies.map((company) => ({
    value: company.id,
    label: company.name,
  }))

  const valuationTypeOptions = [
    { value: '409A', label: '409A Valuation' },
    { value: 'Company Valuation', label: 'Company Valuation' },
    { value: 'Other', label: 'Other' },
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
              <ClientSelector
                label="Client/Company"
                value={formData.companyId}
                onChange={handleClientChange}
                clients={companies}
                onAddNew={() => setShowNewClientDialog(true)}
                placeholder="Select client..."
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

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/valuations')}
              disabled={loading}
            >
              Cancel
            </Button>
            <SubmitButton loading={loading}>Create Valuation</SubmitButton>
          </FormActions>
        </FormCard>

        {/* New Client Dialog */}
        <NewClientDialog
          open={showNewClientDialog}
          onOpenChange={setShowNewClientDialog}
          onClientCreated={handleClientCreated}
        />
      </div>
    </AppLayout>
  )
}
