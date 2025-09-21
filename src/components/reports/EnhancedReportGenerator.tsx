'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Download,
  Eye,
  Building2,
  Palette,
  Save,
  Settings,
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import dynamic from 'next/dynamic'

const OptimizedDataTable = dynamic(
  () =>
    import('@/components/ui/optimized-data-table').then((mod) => ({
      default: mod.OptimizedDataTable,
    })),
  {
    loading: () => <LoadingSpinner size="md" className="p-4" />,
    ssr: false,
  }
)
import { PageHeader } from '@/components/ui/page-header'
import { ColumnDef } from '@tanstack/react-table'
import type { ReportTemplate } from '@/lib/templates/types'
import { getStatusColor, formatDate } from '@/lib/utils'
import { TemplatePreview } from '@/components/templates/TemplatePreview'
// PDFGenerator will be dynamically imported to prevent SSR issues

interface Valuation {
  id: number
  company_name: string
  valuation_date: string
  fair_market_value_per_share: number
  status: string
}

interface GeneratedReport {
  id: string
  name: string
  valuationId: number
  templateId: string
  status: 'draft' | 'final'
  createdAt: string
  updatedAt: string
  customizations?: any
}

interface EnhancedReportGeneratorProps {
  preselectedValuationId?: number
  templateId?: string
  valuationId?: number
}

const sampleTemplates: ReportTemplate[] = [
  {
    id: 'template_409a_standard',
    name: 'Standard 409A Valuation Report',
    description: 'Comprehensive 409A valuation report with all required sections for compliance.',
    category: 'financial',
    version: '2.1.0',
    sections: [],
    variables: [],
    metadata: {
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-02-20T14:45:00Z',
      author: 'Bridgeland Advisors',
      tags: ['409A', 'valuation', 'compliance', 'standard'],
    },
  },
  {
    id: 'template_409a_startup',
    name: 'Early Stage Startup 409A Template',
    description:
      'Simplified 409A template optimized for early-stage startups with limited financial history.',
    category: 'financial',
    version: '1.5.0',
    sections: [],
    variables: [],
    metadata: {
      createdAt: '2024-02-01T09:15:00Z',
      updatedAt: '2024-02-28T16:20:00Z',
      author: 'Bridgeland Advisors',
      tags: ['409A', 'startup', 'early-stage', 'simplified'],
    },
  },
  {
    id: 'template_board_resolutions',
    name: 'Board Resolutions Template',
    description:
      'Standard template for board resolutions related to equity transactions and corporate actions.',
    category: 'legal',
    version: '1.2.0',
    sections: [],
    variables: [],
    metadata: {
      createdAt: '2024-01-20T11:00:00Z',
      updatedAt: '2024-02-15T13:30:00Z',
      author: 'Legal Team',
      tags: ['legal', 'board', 'resolutions', 'equity'],
    },
  },
]

export function EnhancedReportGenerator({
  preselectedValuationId,
  templateId,
  valuationId,
}: EnhancedReportGeneratorProps) {
  const router = useRouter()
  const [step, setStep] = useState<'selectValuation' | 'selectTemplate' | 'customize' | 'preview'>(
    'selectValuation'
  )
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [customizedTemplate, setCustomizedTemplate] = useState<ReportTemplate | null>(null)
  const [reportStatus, setReportStatus] = useState<'draft' | 'final'>('draft')
  const [reportName, setReportName] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showWatermark, setShowWatermark] = useState(true)
  const [savedReport, setSavedReport] = useState<GeneratedReport | null>(null)
  const [valuationData, setValuationData] = useState<any>(null)
  const [capTableData, setCapTableData] = useState<any>(null)
  const [isLoadingValuationData, setIsLoadingValuationData] = useState(false)

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

  // Load valuation data when valuationId is provided
  useEffect(() => {
    if (valuationId) {
      const loadValuationData = async () => {
        setIsLoadingValuationData(true)
        try {
          // Load valuation details
          const valuationResponse = await fetch(`/api/valuations/${valuationId}`)
          if (valuationResponse.ok) {
            const valuation = await valuationResponse.json()
            setValuationData(valuation)

            // Load company details
            const companyResponse = await fetch(`/api/companies/${valuation.companyId}`)
            const company = companyResponse.ok ? await companyResponse.json() : null

            // Load cap table data
            const capTableResponse = await fetch(`/api/valuations/${valuationId}/cap-table`)
            const capTable = capTableResponse.ok ? await capTableResponse.json() : null
            setCapTableData(capTable)

            // Create valuation object for the selector
            const valuationForSelector = {
              id: valuation.id,
              company_name: company?.name || 'Unknown Company',
              valuation_date: valuation.valuationDate,
              fair_market_value_per_share: valuation.fairMarketValuePerShare || 0,
              status: valuation.status || 'draft',
            }

            setSelectedValuation(valuationForSelector)
            setReportName(`${company?.name || 'Company'} - 409A Report`)
            setStep('selectTemplate')
          }
        } catch (error) {
          console.error('Error loading valuation data:', error)
        } finally {
          setIsLoadingValuationData(false)
        }
      }

      loadValuationData()
    }
  }, [valuationId])

  useEffect(() => {
    if (preselectedValuationId && !valuationId) {
      const valuation = mockValuations.find((v) => v.id === preselectedValuationId)
      if (valuation) {
        setSelectedValuation(valuation)
        setReportName(`${valuation.company_name} - 409A Report`)
        setStep('selectTemplate')
      }
    }
    if (templateId) {
      const template = sampleTemplates.find((t) => t.id === templateId)
      if (template) {
        setSelectedTemplate(template)
        setCustomizedTemplate(template)
        setStep('customize')
      }
    }
  }, [preselectedValuationId, templateId, mockValuations])

  // Auto-inject valuation data into template
  const injectValuationData = (template: ReportTemplate) => {
    if (!valuationData || !template) return template

    // Create a copy of the template with injected data
    const injectedTemplate = { ...template }

    // Create data context for injection
    const dataContext = {
      valuation: {
        id: valuationData.id,
        title: valuationData.title,
        date: valuationData.valuationDate,
        status: valuationData.status,
        fairMarketValue: valuationData.fairMarketValuePerShare || 0,
        assumptions: valuationData.assumptions || {},
        discountRate: valuationData.discountingConvention || 'mid_year',
        taxRate: valuationData.taxRate || 21,
        currency: valuationData.currency || 'USD',
      },
      capTable: capTableData || {},
      company: {
        name: selectedValuation?.company_name || 'Company Name',
        id: valuationData.companyId,
      },
      reportDate: new Date().toISOString().split('T')[0],
      reportName: reportName || 'Valuation Report',
    }

    // Inject data into template sections
    if (injectedTemplate.sections) {
      injectedTemplate.sections = injectedTemplate.sections.map((section) => {
        if (section.blocks) {
          return {
            ...section,
            blocks: section.blocks.map((block) => {
              // Auto-populate dynamic data blocks
              if (block.type === 'dynamicTable' && block.content?.dataSource) {
                const [source, field] = block.content.dataSource.split('.')
                if (
                  source === 'valuation' &&
                  dataContext.valuation[field as keyof typeof dataContext.valuation]
                ) {
                  return {
                    ...block,
                    content: {
                      ...block.content,
                      data: dataContext.valuation[field as keyof typeof dataContext.valuation],
                    },
                  }
                }
              }

              // Auto-populate date blocks
              if (block.type === 'dateBlock' && block.content?.dateField) {
                const [source, field] = block.content.dateField.split('.')
                if (source === 'valuation' && field === 'date') {
                  return {
                    ...block,
                    content: {
                      ...block.content,
                      value: dataContext.valuation.date,
                    },
                  }
                }
              }

              // Replace variable placeholders in text blocks
              if (block.type === 'paragraph' || block.type === 'header') {
                let content = block.content
                if (typeof content === 'string') {
                  // Replace {{variable}} patterns with actual data
                  content = content.replace(/\{\{company\.name\}\}/g, dataContext.company.name)
                  content = content.replace(/\{\{valuation\.date\}\}/g, dataContext.valuation.date)
                  content = content.replace(
                    /\{\{valuation\.fairMarketValue\}\}/g,
                    dataContext.valuation.fairMarketValue.toString()
                  )
                  content = content.replace(/\{\{reportDate\}\}/g, dataContext.reportDate)
                  content = content.replace(/\{\{reportName\}\}/g, dataContext.reportName)

                  return {
                    ...block,
                    content,
                  }
                }
              }

              return block
            }),
          }
        }
        return section
      })
    }

    return injectedTemplate
  }

  const handleValuationSelect = (valuationId: number) => {
    const valuation = mockValuations.find((v) => v.id === valuationId)
    if (valuation) {
      setSelectedValuation(valuation)
      setReportName(`${valuation.company_name} - 409A Report`)
      setStep('selectTemplate')
    }
  }

  const handleTemplateSelect = async (template: ReportTemplate) => {
    if (!selectedValuation) return

    setSelectedTemplate(template)

    // Auto-inject valuation data into the template if available
    const injectedTemplate = valuationId ? injectValuationData(template) : template
    setCustomizedTemplate(injectedTemplate)

    // Create a new draft report with valuation data injected
    const newDraft = {
      id: `draft_${Date.now()}`,
      name: `${selectedValuation.company_name} - ${template.name}`,
      clientName: selectedValuation.company_name,
      valuationId: selectedValuation.id,
      templateId: template.id,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      template: injectedTemplate,
      // Store additional valuation context
      valuationData: valuationId
        ? {
            id: valuationData?.id,
            companyName: selectedValuation.company_name,
            date: valuationData?.valuationDate,
            fairMarketValue: valuationData?.fairMarketValuePerShare,
            capTable: capTableData,
          }
        : null,
    }

    // Save draft (in real app this would save to database)
    console.log('Creating report draft with auto-injected data:', newDraft)

    // Save the draft (using a simple approach for now)
    try {
      // In a real app, this would be an API call
      const savedDrafts = JSON.parse(localStorage.getItem('savedReports') || '[]')
      savedDrafts.push({
        id: newDraft.id,
        name: newDraft.name,
        clientName: newDraft.clientName,
        type: '409A Template',
        status: newDraft.status,
        createdDate: newDraft.createdAt.split('T')[0],
        fileSize: '2.1 KB',
        isDraft: true,
        draftData: newDraft,
      })
      localStorage.setItem('savedReports', JSON.stringify(savedDrafts))

      // Continue to customization step instead of redirecting immediately
      setStep('customize')
    } catch (error) {
      console.error('Error creating draft:', error)
      alert('Error creating report. Please try again.')
    }
  }

  const handleCustomizeTemplate = () => {
    if (!selectedTemplate || !selectedValuation) return

    const params = new URLSearchParams({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      valuationId: selectedValuation.id.toString(),
      reportName: reportName,
    })

    router.push(`/reports/template-editor?${params.toString()}`)
  }

  const handleSaveReport = async () => {
    if (!selectedValuation || !customizedTemplate) return

    const report: GeneratedReport = {
      id: `report_${Date.now()}`,
      name: reportName,
      valuationId: selectedValuation.id,
      templateId: customizedTemplate.id,
      status: reportStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customizations: { notes: reportNotes },
    }

    // Save to localStorage (in real app, this would be an API call)
    const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]')
    savedReports.push(report)
    localStorage.setItem('savedReports', JSON.stringify(savedReports))

    setSavedReport(report)
    alert('Report saved successfully!')
  }

  const handleGeneratePDF = async (withWatermark: boolean = true) => {
    if (!selectedValuation || !customizedTemplate) return

    setIsGenerating(true)
    try {
      // Create HTML content with actual template data and proper styling
      const htmlContent = `
        <html>
          <head>
            <title>${reportName}</title>
            <style>
              body {
                font-family: 'Times New Roman', serif;
                margin: 0;
                padding: 40px;
                line-height: 1.6;
                color: #333;
                background: white;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 72px;
                color: rgba(0,0,0,0.1);
                z-index: -1;
                pointer-events: none;
                ${withWatermark ? '' : 'display: none;'}
              }
              .header {
                text-align: center;
                border-bottom: 3px solid #1e40af;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              h1 {
                color: #1e40af;
                font-size: 24px;
                margin: 0;
                font-weight: bold;
              }
              h2 {
                color: #1e40af;
                font-size: 18px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
                margin-top: 30px;
              }
              .section {
                margin: 25px 0;
                page-break-inside: avoid;
              }
              .company-info {
                background: #f8fafc;
                padding: 20px;
                border-left: 4px solid #1e40af;
                margin: 20px 0;
              }
              .valuation-summary {
                border: 2px solid #1e40af;
                padding: 20px;
                margin: 20px 0;
                background: #f0f7ff;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              th, td {
                border: 1px solid #d1d5db;
                padding: 10px;
                text-align: left;
              }
              th {
                background: #f3f4f6;
                font-weight: bold;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
              }
              @media print {
                body { margin: 0; padding: 20mm; }
                .watermark { position: fixed; }
              }
            </style>
          </head>
          <body>
            ${withWatermark ? '<div class="watermark">DRAFT</div>' : ''}

            <div class="header">
              <h1>409A Valuation Report</h1>
              <p>Fair Market Value Analysis</p>
            </div>

            <div class="company-info">
              <h2>Company Information</h2>
              <table>
                <tr><td><strong>Company Name:</strong></td><td>${selectedValuation.company_name}</td></tr>
                <tr><td><strong>Valuation Date:</strong></td><td>${new Date(selectedValuation.valuation_date).toLocaleDateString()}</td></tr>
                <tr><td><strong>Report Date:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
                <tr><td><strong>Valuation Status:</strong></td><td>${selectedValuation.status}</td></tr>
              </table>
            </div>

            <div class="valuation-summary">
              <h2>Valuation Summary</h2>
              <table>
                <tr><td><strong>Fair Market Value per Share:</strong></td><td>$${selectedValuation.fair_market_value_per_share.toFixed(2)}</td></tr>
                <tr><td><strong>Template Used:</strong></td><td>${customizedTemplate.name}</td></tr>
                <tr><td><strong>Version:</strong></td><td>${customizedTemplate.version || '1.0.0'}</td></tr>
                <tr><td><strong>Report Status:</strong></td><td>${reportStatus.toUpperCase()}</td></tr>
              </table>
            </div>

            <div class="section">
              <h2>Valuation Methodology</h2>
              <p>This 409A valuation has been prepared in accordance with the requirements of Section 409A
              of the Internal Revenue Code and applicable Treasury Regulations. The valuation considers
              multiple approaches including the income approach, market approach, and asset approach as applicable.</p>
            </div>

            ${
              reportNotes
                ? `
            <div class="section">
              <h2>Additional Notes</h2>
              <p>${reportNotes}</p>
            </div>
            `
                : ''
            }

            <div class="footer">
              <p>This report was generated on ${new Date().toLocaleDateString()} using the Bridgeland Advisors platform.</p>
              <p>Report ID: ${customizedTemplate.id} | Status: ${withWatermark ? 'DRAFT' : 'FINAL'}</p>
            </div>
          </body>
        </html>
      `

      // Dynamically import PDFGenerator to prevent SSR issues
      const { default: PDFGenerator } = await import('@/lib/services/pdfGenerator')

      // Generate filename
      const filename = PDFGenerator.generateFilename(
        customizedTemplate.name,
        selectedValuation.company_name
      )

      // Use our PDF generator service
      const result = await PDFGenerator.generateFromHTML(htmlContent, {
        orientation: 'portrait',
        format: 'letter',
        quality: 2,
        filename: filename,
      })

      if (result.success) {
        // Show success message
        alert(`PDF generated successfully: ${result.filename}`)
      } else {
        throw new Error(result.error || 'PDF generation failed')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const getStepColor = (stepName: string) => {
    const steps = ['selectValuation', 'selectTemplate']
    const currentIndex = steps.indexOf(step)
    const stepIndex = steps.indexOf(stepName)

    if (stepIndex < currentIndex) return 'bg-primary text-primary-foreground'
    if (stepIndex === currentIndex) return 'bg-accent text-accent-foreground'
    return 'bg-muted text-muted-foreground'
  }

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center space-x-4">
      {[
        { key: 'selectValuation', label: 'Select Valuation', icon: Building2 },
        { key: 'selectTemplate', label: 'Choose Template', icon: FileText },
      ].map((stepItem, index) => {
        const Icon = stepItem.icon
        return (
          <div key={stepItem.key} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${getStepColor(stepItem.key)}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="ml-2 text-sm font-medium">{stepItem.label}</span>
            {index < 1 && <div className="mx-4 h-0.5 w-8 bg-border" />}
          </div>
        )
      })}
    </div>
  )

  const valuationColumns: ColumnDef<Valuation>[] = useMemo(
    () => [
      {
        id: 'company_name',
        header: 'Company Name',
        accessorKey: 'company_name',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">{row.getValue('company_name')}</span>
          </div>
        ),
      },
      {
        id: 'valuation_date',
        header: 'Valuation Date',
        accessorKey: 'valuation_date',
        enableSorting: true,
        cell: ({ row }) => (
          <span>{new Date(row.getValue('valuation_date')).toLocaleDateString()}</span>
        ),
      },
      {
        id: 'fair_market_value_per_share',
        header: 'Fair Market Value',
        accessorKey: 'fair_market_value_per_share',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">
            ${row.getValue<number>('fair_market_value_per_share').toFixed(2)} per share
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        enableSorting: true,
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          return <Badge className={getStatusColor(status)}>{status}</Badge>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button size="sm" onClick={() => handleValuationSelect(row.original.id)}>
            Select
          </Button>
        ),
      },
    ],
    []
  )

  const renderValuationSelection = () => (
    <div className="space-y-6">
      {renderStepIndicator()}

      <Card>
        <CardContent className="p-6">
          <OptimizedDataTable
            columns={valuationColumns as any}
            data={mockValuations}
            searchPlaceholder="Search companies..."
            tableId="valuation-selection"
            enableColumnFilters
            enableSorting
            enableColumnVisibility
          />
        </CardContent>
      </Card>
    </div>
  )

  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Choose Template for {selectedValuation?.company_name}
        </h2>
        <Button variant="outline" onClick={() => router.push('/reports/template-library')}>
          Browse Template Library
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sampleTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">{template.description}</p>
              <div className="mb-4 flex flex-wrap gap-1">
                {template.metadata?.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Version {template.version} • by {template.metadata?.author}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setStep('selectValuation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Valuations
        </Button>
      </div>
    </div>
  )

  const renderCustomization = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Customize Template</h2>
        <p className="text-muted-foreground">
          Configure your report settings and make any necessary customizations
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Report Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>

            <div>
              <Label htmlFor="reportStatus">Status</Label>
              <Select
                value={reportStatus}
                onValueChange={(value: 'draft' | 'final') => setReportStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Draft
                    </div>
                  </SelectItem>
                  <SelectItem value="final">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Final
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reportNotes">Notes</Label>
              <Textarea
                id="reportNotes"
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Add any notes or special instructions..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="watermark">Include watermark for drafts</Label>
              <Switch id="watermark" checked={showWatermark} onCheckedChange={setShowWatermark} />
            </div>

            <Alert>
              <AlertDescription>
                Template: <strong>{selectedTemplate?.name}</strong>
                <br />
                Company: <strong>{selectedValuation?.company_name}</strong>
                <br />
                Valuation Date:{' '}
                <strong>
                  {selectedValuation &&
                    new Date(selectedValuation.valuation_date).toLocaleDateString()}
                </strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customizedTemplate && (
              <div className="min-h-[400px] rounded-lg border bg-muted p-4">
                <div className="space-y-4 text-center">
                  <h3 className="text-xl font-bold">{customizedTemplate.name}</h3>
                  <p className="text-muted-foreground">{customizedTemplate.description}</p>

                  <div className="rounded border bg-background p-4 text-left">
                    <h4 className="mb-2 font-semibold">Template Structure:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Executive Summary</li>
                      <li>• Company Overview</li>
                      <li>• Valuation Methodology</li>
                      <li>• Financial Analysis</li>
                      <li>• Conclusion</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => setStep('selectTemplate')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        <Button variant="outline" onClick={handleCustomizeTemplate}>
          <Edit className="mr-2 h-4 w-4" />
          Advanced Editor
        </Button>
        <Button onClick={() => setStep('preview')}>Continue to Preview</Button>
      </div>
    </div>
  )

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Preview & Generate Report</h2>
        <p className="text-muted-foreground">Review your settings and generate the final report</p>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground">Report Name:</span>
                  <div className="font-medium">{reportName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <div className="font-medium">{selectedValuation?.company_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <div className="font-medium">{selectedTemplate?.name}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(reportStatus)}>{reportStatus}</Badge>
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
            </div>
            {reportNotes && (
              <div className="mt-4 border-t pt-4">
                <span className="text-muted-foreground">Notes:</span>
                <div className="mt-1 rounded bg-muted p-3 text-sm">{reportNotes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => setStep('customize')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>

          <Button variant="outline" onClick={handleSaveReport}>
            <Save className="mr-2 h-4 w-4" />
            Save Report
          </Button>

          <Button variant="outline" onClick={() => handleGeneratePDF(true)} disabled={isGenerating}>
            {isGenerating ? (
              <LoadingSpinner size="xs" className="mr-2" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Generate Draft PDF
          </Button>

          <Button
            onClick={() => handleGeneratePDF(false)}
            disabled={isGenerating || reportStatus !== 'final'}
          >
            {isGenerating ? (
              <LoadingSpinner size="xs" className="mr-2" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Generate Final PDF
          </Button>
        </div>

        {savedReport && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Report saved successfully! You can access it from the Reports list.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {step === 'selectValuation' && renderValuationSelection()}
      {step === 'selectTemplate' && renderTemplateSelection()}
    </div>
  )
}
