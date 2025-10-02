'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calculator, FileText } from 'lucide-react'
import { toast } from 'sonner'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ClientSelector } from '@/components/ui/client-selector'
import { GenericSelector } from '@/components/ui/generic-selector'
import { NewClientDialog } from '@/components/clients/NewClientDialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const valuationSchema = z.object({
  companyId: z.string().min(1, 'Please select a client'),
  valuationType: z.string().min(1, 'Please select a valuation type'),
  purpose: z.string().optional(),
  notes: z.string().optional(),
})

type ValuationFormData = z.infer<typeof valuationSchema>

export default function NewValuationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)

  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      companyId: '',
      valuationType: '409A',
      purpose: '',
      notes: '',
    },
  })

  // Fetch companies on component mount
  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.data || [])
      }
    } catch (error) {}
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleClientCreated = (client: { id: string; name: string }) => {
    // Add the new client to the list and select it
    setCompanies((prev) => [...prev, client])
    form.setValue('companyId', client.id)
  }

  const handleSubmit = async (data: ValuationFormData) => {
    setLoading(true)

    try {
      // Map valuation type to purpose enum
      let purpose = '409a'
      if (data.valuationType === '409A') {
        purpose = '409a'
      } else if (data.valuationType === 'Company Valuation') {
        purpose = 'strategic_planning'
      } else {
        purpose = 'other'
      }

      // Prepare valuation data for API matching the schema
      const valuationData: any = {
        company_id: data.companyId,
        valuation_name: `${data.valuationType} Valuation - ${new Date().toLocaleDateString()}`,
        valuation_date: new Date().toISOString(), // Full ISO datetime
        purpose: purpose,
        status: 'draft',
        notes: data.notes,
        // Store additional fields for backward compatibility
        valuation_type: data.valuationType,
        title: `${data.valuationType} Valuation - ${new Date().toLocaleDateString()}`,
        assumptions: {
          notes: data.notes,
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
      // Show success toast
      toast.success('Valuation created successfully')
      // Redirect to the new valuation page
      router.push(`/valuations/${result.data.id}`)
    } catch (error) {
      // Show error toast
      toast.error(
        error instanceof Error ? error.message : 'Failed to create valuation. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

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
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Valuation Details Section */}
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-medium text-card-foreground">
                    <Calculator className="mr-2 h-5 w-5" />
                    Valuation Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Controller
                      name="companyId"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Client/Company *</FormLabel>
                          <FormControl>
                            <ClientSelector
                              value={field.value}
                              onChange={field.onChange}
                              clients={companies}
                              onAddNew={() => setShowNewClientDialog(true)}
                              placeholder="Select client..."
                              required
                            />
                          </FormControl>
                          <FormMessage>{fieldState.error?.message}</FormMessage>
                        </FormItem>
                      )}
                    />

                    <Controller
                      name="valuationType"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Valuation Type *</FormLabel>
                          <FormControl>
                            <GenericSelector
                              value={field.value}
                              onChange={field.onChange}
                              options={valuationTypeOptions}
                              placeholder="Select valuation type..."
                              searchPlaceholder="Search types..."
                              emptyMessage="No type found."
                              required
                            />
                          </FormControl>
                          <FormMessage>{fieldState.error?.message}</FormMessage>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Additional Information Section */}
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-medium text-card-foreground">
                    <FileText className="mr-2 h-5 w-5" />
                    Additional Information
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the purpose of this valuation..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional notes or comments..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/valuations')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Valuation'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

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
