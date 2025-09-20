'use client'

import React, { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { FileText, Download, Eye, Building2, Palette } from 'lucide-react'
import { use409ATemplates } from '@/hooks/useTableTemplates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { TableTemplate } from '@/data/tableTemplates'

// Dynamic imports for heavy components
const PageHeader = dynamic(
  () => import('@/components/ui/page-header').then((mod) => ({ default: mod.PageHeader })),
  {
    loading: () => <div className="h-16 animate-pulse rounded bg-muted" />,
  }
)

const SimpleTable = dynamic(
  () => import('@/components/ui/simple-table').then((mod) => ({ default: mod.SimpleTable })),
  {
    loading: () => <div className="h-64 animate-pulse rounded bg-muted" />,
  }
)

const SelectableCardGrid = dynamic(
  () =>
    import('@/components/ui/selectable-card-grid').then((mod) => ({
      default: mod.SelectableCardGrid,
    })),
  {
    loading: () => <div className="h-48 animate-pulse rounded bg-muted" />,
  }
)

const StepIndicator = dynamic(
  () => import('@/components/ui/step-indicator').then((mod) => ({ default: mod.StepIndicator })),
  {
    loading: () => <div className="h-12 animate-pulse rounded bg-muted" />,
  }
)

// Removed heavy TableActionButtons - using simple Button instead

// Lightweight table column interface

interface Valuation {
  id: number
  company_name: string
  valuation_date: string
  fair_market_value_per_share: number
  status: string
}

interface ReportGenerationAppProps {
  preselectedValuationId?: number
}

export function ReportGenerationApp({ preselectedValuationId }: ReportGenerationAppProps) {
  const [step, setStep] = useState<'selectValuation' | 'selectTemplate' | 'preview' | 'generate'>(
    'selectValuation'
  )
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TableTemplate | null>(null)
  const [valuationData, setValuationData] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [mockValuations] = useState<Valuation[]>([
    {
      id: 1,
      company_name: 'Acme Technology Inc.',
      valuation_date: '2024-09-15',
      fair_market_value_per_share: 12.5,
      status: 'Draft',
    },
    {
      id: 2,
      company_name: 'InnovateCorp',
      valuation_date: '2024-08-30',
      fair_market_value_per_share: 8.75,
      status: 'Final',
    },
    {
      id: 3,
      company_name: 'TechStart Solutions',
      valuation_date: '2024-07-20',
      fair_market_value_per_share: 15.25,
      status: 'Final',
    },
  ])

  const { templates, isLoading: templatesLoading } = use409ATemplates()

  useEffect(() => {
    if (preselectedValuationId) {
      const valuation = mockValuations.find((v) => v.id === preselectedValuationId)
      if (valuation) {
        setSelectedValuation(valuation)
        setStep('selectTemplate')
      }
    }
  }, [preselectedValuationId, mockValuations])

  const fetchValuationData = async (valuationId: number) => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/template-data`)
      if (response.ok) {
        const result = await response.json()
        setValuationData(result.data || result)
      } else {
        // Use sample data from template engine
        const { sampleValuationData } = await import('@/lib/templates')
        setValuationData(sampleValuationData)
      }
    } catch (error) {
      console.error('Error fetching valuation data:', error)
      // Use sample data from template engine
      const { sampleValuationData } = await import('@/lib/templates')
      setValuationData(sampleValuationData)
    }
  }

  const handleValuationSelect = async (valuationId: number) => {
    const valuation = mockValuations.find((v) => v.id === valuationId)
    if (valuation) {
      setSelectedValuation(valuation)
      await fetchValuationData(valuation.id)
      setStep('selectTemplate')
    }
  }

  const handleTemplateSelect = (item: any) => {
    const template = templates.find((t) => t.id === item.id)
    if (template) {
      setSelectedTemplate(template)
      setStep('preview')
    }
  }

  const generatePDF = async () => {
    if (!selectedTemplate || !valuationData) return

    setIsGenerating(true)
    try {
      // Use new template engine for PDF generation
      const { TemplateEngine, standard409ATemplate } = await import('@/lib/templates')
      const report = TemplateEngine.processTemplate(
        (selectedTemplate || standard409ATemplate) as any,
        valuationData,
        {
          status: 'final',
          watermark: false,
        }
      )

      // Create a new window with the HTML content for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(report.html)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const steps = [
    { key: 'selectValuation', label: 'Select Valuation', icon: Building2 },
    { key: 'selectTemplate', label: 'Choose Template', icon: FileText },
    { key: 'preview', label: 'Preview & Generate', icon: Eye },
  ]

  const completedSteps = useMemo(() => {
    const completed: string[] = []
    if (selectedValuation) completed.push('selectValuation')
    if (selectedTemplate) completed.push('selectTemplate')
    return completed
  }, [selectedValuation, selectedTemplate])

  // Simple table columns for valuation selection
  const valuationColumns = [
    {
      key: 'company_name',
      header: 'Company',
      render: (valuation: Valuation) => (
        <div className="flex items-center space-x-3">
          <div className="rounded bg-primary/10 p-2">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{valuation.company_name}</div>
            <div className="text-sm text-muted-foreground">
              ${valuation.fair_market_value_per_share.toFixed(2)} per share
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'valuation_date',
      header: 'Valuation Date',
      render: (valuation: Valuation) => (
        <div className="text-sm text-foreground">
          {new Date(valuation.valuation_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (valuation: Valuation) => (
        <Badge
          className={
            valuation.status === 'Final'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }
        >
          {valuation.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (valuation: Valuation) => (
        <Button
          size="sm"
          onClick={() => handleValuationSelect(valuation.id)}
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Select Template</span>
        </Button>
      ),
    },
  ]

  // Convert templates to selectable cards
  const templateCards = useMemo(() => {
    return templates.map((template) => ({
      id: template.id,
      title: template.name,
      description: template.description || 'Professional 409A table template',
      meta: `${template.columns?.length || 0} columns`,
      icon: FileText,
    }))
  }, [templates])

  const getPageTitle = () => {
    switch (step) {
      case 'selectValuation':
        return 'Report Generator'
      case 'selectTemplate':
        return 'Choose Template'
      case 'preview':
        return 'Generate Report'
      default:
        return 'Report Generator'
    }
  }

  const getPageDescription = () => {
    switch (step) {
      case 'selectValuation':
        return 'Select a valuation to generate a professional 409A report'
      case 'selectTemplate':
        return `Select the best template for ${selectedValuation?.company_name}`
      case 'preview':
        return 'Review your selections and generate the final report'
      default:
        return 'Generate professional 409A valuation reports for your clients'
    }
  }

  const renderValuationSelection = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <SimpleTable
            data={mockValuations}
            columns={valuationColumns as any}
            emptyState={{
              title: 'No valuations found',
              description: 'Create a valuation to generate reports.',
              action: (
                <Button onClick={() => (window.location.href = '/valuations/new')}>
                  Create Valuation
                </Button>
              ),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <SelectableCardGrid
        title="Choose Template"
        description={`Select a 409A template for ${selectedValuation?.company_name}`}
        items={templateCards}
        onItemSelect={handleTemplateSelect}
        loading={templatesLoading}
        backAction={{
          text: '← Back to valuation selection',
          onClick: () => setStep('selectValuation'),
        }}
      />
    </div>
  )

  const renderPreviewAndGenerate = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Generate Report</h2>
        <p className="text-muted-foreground">
          Ready to generate your 409A report for <strong>{selectedValuation?.company_name}</strong>{' '}
          using the <strong>{selectedTemplate?.name}</strong> template
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground">Report Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Company:</span>
                <div className="font-medium">{selectedValuation?.company_name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Template:</span>
                <div className="font-medium">{selectedTemplate?.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Valuation Date:</span>
                <div className="font-medium">
                  {selectedValuation &&
                    new Date(selectedValuation.valuation_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Fair Market Value:</span>
                <div className="font-medium">
                  ${selectedValuation?.fair_market_value_per_share.toFixed(2)} per share
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => setStep('selectTemplate')}>
            ← Back to templates
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams({
                templateId: selectedTemplate?.id || '',
                templateName: selectedTemplate?.name || 'Custom Template',
                valuationId: selectedValuation?.id.toString() || '',
              })
              window.location.href = `/reports/template-editor?${params.toString()}`
            }}
            className="flex items-center space-x-2"
          >
            <Palette className="h-4 w-4" />
            <span>Customize Template</span>
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Generate PDF Report</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title={getPageTitle()} description={getPageDescription()} />

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={step} completedSteps={completedSteps} />

      {/* Content based on current step */}
      {step === 'selectValuation' && renderValuationSelection()}
      {step === 'selectTemplate' && renderTemplateSelection()}
      {step === 'preview' && renderPreviewAndGenerate()}
    </div>
  )
}
