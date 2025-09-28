'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { TemplateEditor } from '@/components/templates/TemplateEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, FileText, Calculator, Building2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import type { ReportTemplate, TemplateVariable } from '@/lib/templates/types'
import draftService from '@/services/draftService'
import { TemplatePersistenceService } from '@/lib/templates/templatePersistenceService'
import { Clear409ABlocksInitializer } from '@/components/templates/Clear409ABlocksInitializer'

// Create a sample template based on the 409A template structure
const createSampleTemplate = (templateId?: string, templateName?: string): ReportTemplate => {
  const defaultVariables: TemplateVariable[] = [
    // Company variables
    { id: 'company.name', name: 'Company Name', type: 'text', required: true, category: 'Company' },
    {
      id: 'company.description',
      name: 'Company Description',
      type: 'text',
      required: false,
      category: 'Company',
    },
    {
      id: 'company.incorporation_year',
      name: 'Incorporation Year',
      type: 'number',
      required: true,
      category: 'Company',
    },
    {
      id: 'company.headquarters',
      name: 'Headquarters Location',
      type: 'text',
      required: true,
      category: 'Company',
    },
    {
      id: 'company.business_model',
      name: 'Business Model',
      type: 'text',
      required: false,
      category: 'Company',
    },

    // Valuation variables
    {
      id: 'valuation.date',
      name: 'Valuation Date',
      type: 'date',
      required: true,
      category: 'Valuation',
    },
    {
      id: 'valuation.fair_market_value',
      name: 'Fair Market Value per Share',
      type: 'currency',
      required: true,
      category: 'Valuation',
    },
    {
      id: 'valuation.security_type',
      name: 'Security Type',
      type: 'text',
      required: true,
      category: 'Valuation',
      defaultValue: 'Common Stock',
    },
    {
      id: 'valuation.backsolve_equity_value',
      name: 'Backsolve Equity Value',
      type: 'currency',
      required: false,
      category: 'Valuation',
    },
    {
      id: 'valuation.volatility',
      name: 'Volatility',
      type: 'percentage',
      required: false,
      category: 'Valuation',
    },

    // Management variables
    {
      id: 'management.member_1_name',
      name: 'CEO Name',
      type: 'text',
      required: false,
      category: 'Management',
    },
    {
      id: 'management.member_1_title',
      name: 'CEO Title',
      type: 'text',
      required: false,
      category: 'Management',
    },
    {
      id: 'management.member_2_name',
      name: 'CTO Name',
      type: 'text',
      required: false,
      category: 'Management',
    },
    {
      id: 'management.member_2_title',
      name: 'CTO Title',
      type: 'text',
      required: false,
      category: 'Management',
    },

    // Financing variables
    {
      id: 'financing.last_round_date',
      name: 'Last Financing Round Date',
      type: 'date',
      required: false,
      category: 'Financing',
    },
    {
      id: 'financing.last_round_security',
      name: 'Last Round Security Type',
      type: 'text',
      required: false,
      category: 'Financing',
    },
    {
      id: 'financing.last_round_pps',
      name: 'Last Round Price per Share',
      type: 'currency',
      required: false,
      category: 'Financing',
    },

    // DLOM variables
    {
      id: 'dlom.concluded_dlom',
      name: 'Concluded DLOM',
      type: 'percentage',
      required: false,
      category: 'DLOM',
    },
    {
      id: 'dlom.chaffe_dlom',
      name: 'Chaffe DLOM',
      type: 'percentage',
      required: false,
      category: 'DLOM',
    },
    {
      id: 'dlom.finnerty_dlom',
      name: 'Finnerty DLOM',
      type: 'percentage',
      required: false,
      category: 'DLOM',
    },

    // Appraiser variables
    {
      id: 'appraiser.first_name',
      name: 'Appraiser First Name',
      type: 'text',
      required: true,
      category: 'Appraiser',
      defaultValue: 'Value8',
    },
    {
      id: 'appraiser.last_name',
      name: 'Appraiser Last Name',
      type: 'text',
      required: true,
      category: 'Appraiser',
      defaultValue: 'AI',
    },
    {
      id: 'appraiser.title',
      name: 'Appraiser Title',
      type: 'text',
      required: true,
      category: 'Appraiser',
      defaultValue: 'Senior Valuation Analyst',
    },
  ]

  return {
    id: templateId || `template_${Date.now()}`,
    name: templateName || 'Custom 409A Template',
    description: 'A customizable 409A valuation report template with dynamic content blocks.',
    category: 'financial',
    version: '1.0.0',
    variables: defaultVariables,
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        blocks: [
          {
            id: 'summary_header',
            type: 'header',
            content: 'Executive Summary',
            styling: {
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              margin: '0 0 20px 0',
            },
          },
          {
            id: 'summary_paragraph',
            type: 'paragraph',
            content:
              'We have performed a valuation of the common stock of {{company.name}} as of {{valuation.date}} for purposes of determining the fair market value per share for 409A compliance. Based on our analysis, we have determined the fair market value to be ${{valuation.fair_market_value}} per share.',
            styling: {
              fontSize: 14,
              textAlign: 'justify',
              margin: '10px 0',
            },
          },
        ],
      },
      {
        id: 'company_overview',
        title: 'Company Overview',
        blocks: [
          {
            id: 'company_header',
            type: 'header',
            content: 'Company Overview',
            styling: {
              fontSize: 20,
              fontWeight: 'bold',
              margin: '20px 0 15px 0',
            },
          },
          {
            id: 'company_description',
            type: 'paragraph',
            content:
              '{{company.name}} is a {{company.business_model}} company founded in {{company.incorporation_year}} and headquartered in {{company.headquarters}}. {{company.description}}',
            styling: {
              fontSize: 14,
              textAlign: 'justify',
              margin: '10px 0',
            },
          },
        ],
      },
      {
        id: 'valuation_approach',
        title: 'Valuation Approach',
        blocks: [
          {
            id: 'approach_header',
            type: 'header',
            content: 'Valuation Approach',
            styling: {
              fontSize: 20,
              fontWeight: 'bold',
              margin: '20px 0 15px 0',
            },
          },
          {
            id: 'approach_paragraph',
            type: 'paragraph',
            content:
              "Our valuation approach incorporates multiple methodologies including the income approach, market approach, and asset approach as appropriate. We have considered the company's financial performance, market conditions, and risk factors in our analysis.",
            styling: {
              fontSize: 14,
              textAlign: 'justify',
              margin: '10px 0',
            },
          },
        ],
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        blocks: [
          {
            id: 'conclusion_header',
            type: 'header',
            content: 'Valuation Conclusion',
            styling: {
              fontSize: 20,
              fontWeight: 'bold',
              margin: '20px 0 15px 0',
            },
          },
          {
            id: 'conclusion_paragraph',
            type: 'paragraph',
            content:
              "Based on our comprehensive analysis of {{company.name}}, we have determined the fair market value of the {{valuation.security_type}} to be ${{valuation.fair_market_value}} per share as of {{valuation.date}}. This valuation reflects our assessment of the company's current financial position, growth prospects, and market conditions.",
            styling: {
              fontSize: 14,
              textAlign: 'justify',
              margin: '10px 0',
            },
          },
        ],
      },
    ],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Template Editor',
      tags: ['409A', 'valuation', 'custom'],
    },
    settings: {
      paperSize: 'letter',
      orientation: 'portrait',
      margins: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in',
      },
      watermark: {
        enabled: false,
        text: 'DRAFT',
        opacity: 0.1,
      },
      // theme: 'value8', // Theme settings moved to branding config
      // themeColors: { // Theme colors moved to branding config
      //   background: '#f6f7f6',
      //   text: '#2e3944',
      //   primary: '#124e66',
      //   accent: '#74bd92',
      // },
    },
  }
}

function TemplateEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [templateInfo, setTemplateInfo] = useState<any>(null)
  const [valuationInfo, setValuationInfo] = useState<any>(null)

  const templateId = searchParams.get('templateId')
  const templateName = searchParams.get('templateName')
  const valuationId = searchParams.get('valuationId')
  const reportName = searchParams.get('reportName')

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      // Load template info if templateId exists
      if (templateId) {
        try {
          // In real app, fetch from API
          const templateData = {
            id: templateId,
            name: 'Standard 409A Valuation Report',
            description: 'Comprehensive 409A valuation report template',
            category: 'financial',
            author: 'Bridgeland Advisors',
          }
          setTemplateInfo(templateData)
        } catch (error) {}
      }

      // Load valuation info if valuationId exists
      if (valuationId) {
        try {
          const response = await fetch(`/api/valuations/${valuationId}`)
          if (response.ok) {
            const valuation = await response.json()
            // Get client name
            const clientResponse = await fetch(`/api/companies/${valuation.companyId}`)
            const client = clientResponse.ok ? await clientResponse.json() : null
            setValuationInfo({
              ...valuation,
              clientName: client?.name || 'Unknown Client',
            })
          }
        } catch (error) {}
      }

      // Simulate loading template data
      await new Promise((resolve) => setTimeout(resolve, 500))

      const loadedTemplate = createSampleTemplate(
        templateId || undefined,
        templateName || undefined
      )
      setTemplate(loadedTemplate)
      setIsLoading(false)
    }

    loadData()
  }, [templateId, templateName, valuationId])

  const handleSave = async (updatedTemplate: ReportTemplate) => {
    try {
      // Save to Supabase database using TemplatePersistenceService
      const result = await TemplatePersistenceService.saveTemplate(updatedTemplate)

      if (result.success && result.id) {
        console.log('Template saved successfully')
        // Update template with new ID if it was a new template
        if (!updatedTemplate.id || updatedTemplate.id.startsWith('template_')) {
          setTemplate({ ...updatedTemplate, id: result.id })
        }
      } else {
        console.error('Failed to save template:', result.error)
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const handleCancel = () => {
    // Navigate back to appropriate page
    if (valuationId) {
      router.push(`/valuations/${valuationId}`)
    } else if (templateId) {
      router.push('/reports/template-library')
    } else {
      router.push('/reports')
    }
  }

  const handlePreview = (previewTemplate: ReportTemplate) => {
    // Preview is handled in the Preview tab now
  }

  if (isLoading || !template) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading template editor...</span>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Clear409ABlocksInitializer />
      <div className="h-full bg-background">
        {/* Enhanced Header with Context */}
        <div className="bg-card/50 border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>
                    {valuationId ? 'Back to Valuation' : templateId ? 'Back to Library' : 'Back'}
                  </span>
                </Button>

                {/* Context Information */}
                <div className="flex items-center space-x-4">
                  {/* Template Info */}
                  {(templateInfo || templateId) && (
                    <div className="flex items-center space-x-2">
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">
                          {templateInfo?.name || template?.name || 'Template Editor'}
                        </h2>
                        {templateInfo?.description && (
                          <p className="text-xs text-muted-foreground">
                            {templateInfo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  {templateInfo && valuationInfo && <div className="h-8 w-px bg-border" />}

                  {/* Valuation Context */}
                  {valuationInfo && (
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <Calculator className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{valuationInfo.title}</p>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{valuationInfo.clientName}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Default header if no context */}
                  {!templateInfo && !valuationInfo && (
                    <div>
                      <h1 className="text-xl font-bold">Template Editor</h1>
                      <p className="text-xs text-muted-foreground">
                        {reportName
                          ? `Creating ${reportName}`
                          : 'Create and customize report templates'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="h-[calc(100vh-140px)]">
          <TemplateEditor
            template={template}
            onSave={handleSave}
            onPreview={handlePreview}
            className="h-full"
          />
        </div>
      </div>
    </AppLayout>
  )
}

export default function TemplateEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <TemplateEditorContent />
    </Suspense>
  )
}
