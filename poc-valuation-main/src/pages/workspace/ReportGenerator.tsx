import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useParams } from 'react-router-dom'
import { ReportEditor } from '@/components/report/ReportEditor'
import { ReportSettings } from '@/components/report/ReportSettings'
import { ReportExporter } from '@/components/report/ReportExporter'
import {
  ReportTemplateSelector,
  TemplateContent,
  VALUATION_TYPES,
} from '@/components/report/ReportTemplateSelector'
import { DynamicContentPanel } from '@/components/report/DynamicContentPanel'
import { HeaderFooterSettings, HeaderFooterConfig } from '@/components/report/HeaderFooterSettings'
import { toast } from 'sonner'
import { FileText, Database, Clock, Layout } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Import the ThemeBranding type
import { ThemeBranding } from '@/components/report/ReportSettings'
import { LogoOptions } from '@/components/report/DynamicContentFormatting'

export default function ReportGenerator() {
  const { projectId = 'new' } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<string>('editor')
  const [reportContent, setReportContent] = useState<string>('')
  const [branding, setBranding] = useState<ThemeBranding>({
    logo: undefined,
    logoOptions: {
      placement: 'header-left',
      size: 'medium',
    },
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#3b82f6',
    bodyText: '#334155',
    pageBackground: '#ffffff',
    tableHeaderBg: '#0f172a',
    tableHeaderText: '#ffffff',
    tableAltRowBg: '#f8fafc',
    tableBorderColor: '#e2e8f0',
    chartColors: [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#6366f1',
      '#ec4899',
      '#8b5cf6',
      '#06b6d4',
      '#84cc16',
      '#d946ef',
    ],
    tableOptions: {
      headerBold: true,
      useAltRowShading: true,
    },
    powerPointTemplate: {
      templateFile: null,
      templateName: undefined,
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
    },
    pageMargins: {
      top: 1,
      bottom: 1,
      left: 1,
      right: 1,
      unit: 'inches',
    },
  })
  const [headerFooterConfig, setHeaderFooterConfig] = useState<HeaderFooterConfig>({
    header: { left: '', center: '[Title]', right: '[Date]' },
    footer: { left: '[Company]', center: '', right: 'Page [Page] of [TotalPages]' },
    showOnFirstPage: true,
  })
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TemplateContent[]>([
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      description: 'A concise overview of key findings and valuation results',
      isDefault: true,
      lastModified: '2025-04-01',
      valuationType: 'summary',
      content: `
        <h1 style="text-align: center;">EXECUTIVE SUMMARY</h1>
        <h2>1. Introduction</h2>
        <p>This report presents the findings of a valuation analysis conducted for [Company Name] as of [Valuation Date].</p>
        
        <h2>2. Valuation Approach</h2>
        <p>Multiple valuation methodologies were employed to determine a reasonable range of values for the company. These included:</p>
        <ul>
          <li>Discounted Cash Flow Analysis</li>
          <li>Comparable Public Companies Analysis</li>
          <li>Precedent Transactions Analysis</li>
        </ul>
        
        <h2>3. Valuation Summary</h2>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="valuation-synthesis" data-content-name="Valuation Synthesis Table" data-content-category="Valuation Summaries"></div>
        
        <h2>4. Qualitative Factors</h2>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="text" data-content-id="qualitative-assessment" data-content-name="Qualitative Assessment" data-content-category="Qualitative"></div>
        
        <h2>5. Conclusion</h2>
        <p>Based on our analysis, the indicated enterprise value range for [Company Name] is <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="final-ev-range" data-content-name="Final Enterprise Value Range" data-content-category="Valuation Summaries"></span>, with a most likely value of <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="final-ev-mid" data-content-name="Final Enterprise Value Midpoint" data-content-category="Valuation Summaries"></span>.</p>
      `,
    },
    {
      id: 'detailed-dcf',
      name: 'Detailed DCF Report',
      description: 'Comprehensive analysis of DCF methodology and results',
      isDefault: true,
      lastModified: '2025-04-01',
      valuationType: 'dcf',
      content: `
        <h1 style="text-align: center;">DETAILED DCF VALUATION ANALYSIS</h1>
        
        <h2>1. Overview</h2>
        <p>This report presents a detailed analysis of the Discounted Cash Flow (DCF) valuation conducted for [Company Name].</p>
        
        <h2>2. DCF Methodology</h2>
        <p>The DCF analysis estimates the value of the company based on its expected future cash flows, discounted to present value using an appropriate discount rate that reflects the time value of money and the risks associated with the cash flows.</p>
        
        <h2>3. Key Assumptions</h2>
        <h3>Cost of Capital (WACC)</h3>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="wacc-table" data-content-name="WACC Calculation" data-content-category="Key Assumptions"></div>
        
        <h3>Forecast Assumptions</h3>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="forecast-assumptions" data-content-name="Forecast Assumptions" data-content-category="Key Assumptions"></div>
        
        <h2>4. DCF Results</h2>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="dcf-summary" data-content-name="DCF Summary" data-content-category="Methodology Tables"></div>
        
        <h2>5. Sensitivity Analysis</h2>
        <p>The following sensitivity chart illustrates how changes in key variables impact the enterprise value.</p>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="chart" data-content-id="sensitivity-tornado" data-content-name="Sensitivity Tornado Chart" data-content-category="Charts"></div>
        
        <h2>6. Conclusion</h2>
        <p>Based on our DCF analysis, the indicated enterprise value for [Company Name] is <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="dcf-ev" data-content-name="DCF Enterprise Value" data-content-category="Methodology Tables"></span>.</p>
      `,
    },
    {
      id: 'market-approach',
      name: 'Market Approach Report',
      description: 'Analysis using comparable companies and transactions',
      isDefault: true,
      lastModified: '2025-04-01',
      valuationType: 'market',
      content: `
        <h1 style="text-align: center;">MARKET APPROACH VALUATION ANALYSIS</h1>
        
        <h2>1. Overview</h2>
        <p>This report presents a detailed analysis of the Market Approach valuation conducted for [Company Name], including both Comparable Public Companies Analysis and Precedent Transaction Analysis.</p>
        
        <h2>2. Comparable Public Companies Analysis</h2>
        <p>This methodology involves identifying publicly traded companies that are similar to the subject company and analyzing their trading multiples.</p>
        
        <h3>Selected Peer Group</h3>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="cca-peer-table" data-content-name="CCA Peer Table" data-content-category="Methodology Tables"></div>
        
        <h3>Trading Multiples</h3>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="chart" data-content-id="cca-multiples-chart" data-content-name="CCA Multiples Chart" data-content-category="Charts"></div>
        
        <h2>3. Precedent Transactions Analysis</h2>
        <p>This methodology examines the acquisition prices paid for similar companies in the same industry.</p>
        
        <h3>Selected Transactions</h3>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="pta-transactions" data-content-name="PTA Transactions Table" data-content-category="Methodology Tables"></div>
        
        <h3>Transaction Multiples</h3>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="chart" data-content-id="pta-multiples-chart" data-content-name="PTA Multiples Chart" data-content-category="Charts"></div>
        
        <h2>4. Market Approach Conclusion</h2>
        <p>Based on our market approach analysis, the indicated enterprise value range for [Company Name] is <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="market-approach-range" data-content-name="Market Approach Value Range" data-content-category="Methodology Tables"></span>.</p>
        
        <h2>5. Football Field Chart</h2>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="chart" data-content-id="football-field" data-content-name="Football Field Chart" data-content-category="Charts"></div>
      `,
    },
    {
      id: 'full-valuation-report',
      name: 'Full Valuation Report',
      description: 'Comprehensive report with all methodologies and findings',
      isDefault: true,
      lastModified: '2025-04-01',
      valuationType: 'full',
      content: `
        <h1 style="text-align: center;">COMPREHENSIVE VALUATION REPORT</h1>
        <h2 style="text-align: center;">For [Company Name]</h2>
        <p style="text-align: center;">As of <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="valuation-date" data-content-name="Valuation Date" data-content-category="Project & Company Info"></span></p>
        
        <h2>EXECUTIVE SUMMARY</h2>
        <p>This report presents the findings of a comprehensive valuation analysis conducted for [Company Name]. The purpose of this valuation is to determine the fair market value of the company's equity as of the valuation date.</p>
        
        <h3>Key Findings</h3>
        <p>Based on our analysis and the application of multiple valuation methodologies, we have determined that the indicated enterprise value of [Company Name] is in the range of <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="final-ev-range" data-content-name="Final Enterprise Value Range" data-content-category="Valuation Summaries"></span>.</p>
        
        <div data-type="dynamic-content" contenteditable="false" data-content-type="chart" data-content-id="football-field" data-content-name="Football Field Chart" data-content-category="Charts"></div>
        
        <h2>COMPANY OVERVIEW</h2>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="text" data-content-id="company-overview" data-content-name="Company Overview" data-content-category="Project & Company Info"></div>
        
        <h2>VALUATION METHODOLOGIES</h2>
        
        <h3>Discounted Cash Flow Analysis</h3>
        <p>The DCF method values the subject company based on its expected future cash flow generation, discounted to present value using an appropriate discount rate.</p>
        
        <h4>Key Assumptions</h4>
        <ul>
          <li>Discount Rate (WACC): <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="wacc-rate" data-content-name="WACC Rate" data-content-category="Key Assumptions"></span></li>
          <li>Terminal Growth Rate: <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="terminal-growth-rate" data-content-name="Terminal Growth Rate" data-content-category="Key Assumptions"></span></li>
          <li>Exit Multiple: <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="exit-multiple" data-content-name="Exit Multiple" data-content-category="Key Assumptions"></span></li>
        </ul>
        
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="dcf-summary" data-content-name="DCF Summary" data-content-category="Methodology Tables"></div>
        
        <h3>Market Approach - Comparable Companies Analysis</h3>
        <p>This methodology values the subject company based on market multiples observed for similar publicly traded companies.</p>
        
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="cca-summary" data-content-name="CCA Summary" data-content-category="Methodology Tables"></div>
        
        <h3>Market Approach - Precedent Transactions Analysis</h3>
        <p>This methodology values the subject company based on multiples paid in acquisitions of similar companies.</p>
        
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="pta-summary" data-content-name="PTA Summary" data-content-category="Methodology Tables"></div>
        
        <h3>Cost Approach (Adjusted Book Value)</h3>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="cost-approach-summary" data-content-name="Cost Approach Summary" data-content-category="Methodology Tables"></div>
        
        <h2>VALUATION SYNTHESIS</h2>
        <p>The table below summarizes the results of our various valuation methodologies and presents our concluded value range after applying appropriate weightings to each approach.</p>
        
        <div data-type="dynamic-content" contenteditable="false" data-content-type="table" data-content-id="valuation-synthesis" data-content-name="Valuation Synthesis Table" data-content-category="Valuation Summaries"></div>
        
        <h2>QUALITATIVE FACTORS</h2>
        <div data-type="dynamic-content" contenteditable="false" data-content-type="text" data-content-id="qualitative-assessment" data-content-name="Qualitative Assessment" data-content-category="Qualitative"></div>
        
        <h2>CONCLUSION</h2>
        <p>Based on our comprehensive analysis, we have determined that the fair market value of [Company Name]'s equity is <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="final-equity-value" data-content-name="Final Equity Value" data-content-category="Valuation Summaries"></span> as of the valuation date.</p>
        
        <p>This equates to <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="price-per-share" data-content-name="Price Per Share" data-content-category="Valuation Summaries"></span> per share, based on <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="fully-diluted-shares" data-content-name="Fully Diluted Shares" data-content-category="Capitalization"></span> fully diluted shares outstanding.</p>
        
        <div style="margin-top: 60px;">
          <p style="text-align: center; font-style: italic;">This report was prepared by [Your Firm Name]</p>
          <p style="text-align: center; font-style: italic;">Generated on <span data-type="dynamic-content" contenteditable="false" data-content-type="value" data-content-id="report-date" data-content-name="Report Date" data-content-category="Project & Company Info"></span></p>
        </div>
      `,
    },
  ])
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateType, setNewTemplateType] = useState('')
  const [showHeaderFooterDialog, setShowHeaderFooterDialog] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)

  // Project data - typically would be fetched based on projectId
  const projectData = {
    name: 'Q4 2025 Valuation',
    company: 'Acme Corporation',
    client: 'John Smith',
    valuationDate: '2025-04-01',
    purpose: 'Annual Review',
  }

  useEffect(() => {
    // Load saved report content and branding from localStorage
    const loadSavedReport = () => {
      try {
        const savedReport = localStorage.getItem(`report_${projectId}`)
        const savedBranding = localStorage.getItem(`report_branding_${projectId}`)
        const savedActiveTab = localStorage.getItem(`report_tab_${projectId}`)
        const savedTemplateId = localStorage.getItem(`report_template_id_${projectId}`)
        const savedHeaderFooter = localStorage.getItem(`report_header_footer_${projectId}`)

        if (savedReport) {
          setReportContent(savedReport)
        }

        if (savedBranding) {
          setBranding(JSON.parse(savedBranding))
        }

        if (savedActiveTab) {
          setActiveTab(savedActiveTab)
        }

        if (savedHeaderFooter) {
          setHeaderFooterConfig(JSON.parse(savedHeaderFooter))
        }

        if (savedTemplateId) {
          setSelectedTemplateId(savedTemplateId)

          // When loading a saved template ID, also load its content
          const templateWithId = templates.find((t) => t.id === savedTemplateId)
          if (templateWithId && (!savedReport || savedReport.trim() === '')) {
            setReportContent(templateWithId.content)
          }
        }
      } catch (error) {
        console.error('Error loading saved report:', error)
      }
    }

    // Load saved templates from localStorage
    const loadSavedTemplates = () => {
      try {
        const savedTemplates = localStorage.getItem(`report_templates_${projectId}`)

        if (savedTemplates) {
          // Merge default templates with saved custom templates
          const customTemplates = JSON.parse(savedTemplates)
          const defaultTemplates = templates.filter((t) => t.isDefault)

          setTemplates([...defaultTemplates, ...customTemplates])
        }
      } catch (error) {
        console.error('Error loading saved templates:', error)
      }
    }

    loadSavedReport()
    loadSavedTemplates()
  }, [projectId])

  // Save report content, branding, and active tab to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(`report_${projectId}`, reportContent)
      localStorage.setItem(`report_branding_${projectId}`, JSON.stringify(branding))
      localStorage.setItem(`report_tab_${projectId}`, activeTab)
      localStorage.setItem(`report_header_footer_${projectId}`, JSON.stringify(headerFooterConfig))
      if (selectedTemplateId) {
        localStorage.setItem(`report_template_id_${projectId}`, selectedTemplateId)
      }
    } catch (error) {
      console.error('Error saving report:', error)
    }
  }, [reportContent, branding, headerFooterConfig, projectId, activeTab, selectedTemplateId])

  // Save templates whenever they change
  useEffect(() => {
    try {
      // Filter out default templates before saving to localStorage
      const customTemplates = templates.filter((t) => !t.isDefault)
      if (customTemplates.length > 0) {
        localStorage.setItem(`report_templates_${projectId}`, JSON.stringify(customTemplates))
      }
    } catch (error) {
      console.error('Error saving templates:', error)
    }
  }, [templates, projectId])

  const handleContentChange = (content: string) => {
    setReportContent(content)
  }

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId(null)
      return
    }

    const selectedTemplate = templates.find((t) => t.id === templateId)
    if (selectedTemplate) {
      // Ask for confirmation if there's existing content
      if (reportContent.trim()) {
        if (window.confirm('Loading a template will replace your current content. Continue?')) {
          setReportContent(selectedTemplate.content)
          setSelectedTemplateId(templateId)

          // Force editor to reload with new content
          if (editorRef.current && editorRef.current.editor) {
            editorRef.current.editor.commands.setContent(selectedTemplate.content)
          }

          toast.success(`Applied template: ${selectedTemplate.name}`)
        }
      } else {
        setReportContent(selectedTemplate.content)
        setSelectedTemplateId(templateId)

        // Force editor to reload with new content
        if (editorRef.current && editorRef.current.editor) {
          editorRef.current.editor.commands.setContent(selectedTemplate.content)
        }

        toast.success(`Applied template: ${selectedTemplate.name}`)
      }
    }
  }

  const handleSaveAsTemplate = () => {
    setShowSaveTemplateDialog(true)
  }

  const handleTemplatesChange = (updatedTemplates: TemplateContent[]) => {
    setTemplates(updatedTemplates)
  }

  const handleUploadTemplate = (htmlContent: string) => {
    if (!newTemplateName.trim()) {
      toast.error('Please provide a template name')
      return
    }

    const newTemplate: TemplateContent = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription || 'Uploaded template',
      valuationType: newTemplateType || undefined,
      content: htmlContent,
      lastModified: new Date().toISOString(),
      isDefault: false,
    }

    // Add the new template to the list
    setTemplates((prev) => [...prev, newTemplate])
    setSelectedTemplateId(newTemplate.id)

    // Set the content in the editor
    setReportContent(htmlContent)
    if (editorRef.current && editorRef.current.editor) {
      editorRef.current.editor.commands.setContent(htmlContent)
    }

    toast.success('Template uploaded successfully')
  }

  const saveNewTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please provide a template name')
      return
    }

    const newTemplate: TemplateContent = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription || 'Custom template',
      valuationType: newTemplateType || undefined,
      content: reportContent,
      lastModified: new Date().toISOString(),
      isDefault: false,
    }

    // Add the new template to the list
    setTemplates((prev) => [...prev, newTemplate])
    setSelectedTemplateId(newTemplate.id)
    setShowSaveTemplateDialog(false)
    setNewTemplateName('')
    setNewTemplateDescription('')
    setNewTemplateType('')

    toast.success('Template saved successfully')
  }

  // Handler for when images are added to the report
  const handleAddImage = (url: string) => {
    // Optional: You could track images used in reports here
    console.log(`Image added to report: ${url}`)
  }

  // Handler for inserting dynamic content from the sidebar
  const handleInsertDynamicContent = (item: any) => {
    console.log('Attempting to insert dynamic content:', item)

    // Set the tab to editor first to make sure the editor is active
    setActiveTab('editor')

    // Force update to ensure the editor is available
    setTimeout(() => {
      if (window.tiptapEditor) {
        try {
          window.tiptapEditor
            .chain()
            .focus()
            .insertContent({
              type: 'dynamicContent',
              attrs: {
                type: item.type,
                contentId: item.id,
                name: item.name,
                category: item.category,
              },
            })
            .run()

          toast.success(`Inserted ${item.name}`)
        } catch (error) {
          console.error('Error inserting dynamic content:', error)
          toast.error('Failed to insert content. Please try again.')
        }
      } else {
        console.error('Editor not available for inserting content')
        toast.error('Editor not ready. Please try again in a moment.')
      }
    }, 500) // Increase timeout to ensure editor is ready
  }

  // Handler for header/footer configuration changes
  const handleHeaderFooterChange = (newConfig: HeaderFooterConfig) => {
    setHeaderFooterConfig(newConfig)
  }

  // Handler for branding changes
  const handleBrandingChange = (newBranding: ThemeBranding) => {
    setBranding(newBranding)
  }

  // Toolbar buttons
  const renderToolbarButtons = () => (
    <div className="flex items-center space-x-2 pb-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHeaderFooterDialog(true)}
        className="flex items-center"
      >
        <Layout className="mr-2 h-4 w-4" />
        Header & Footer
      </Button>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col">
      <div className="flex-none space-y-2 px-4 py-2">
        <h1 className="text-teal flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileText className="h-5 w-5" />
          Report Generator
        </h1>
        <p className="text-muted-foreground">
          Create and customize valuation reports for {projectData.company}
        </p>
        {renderToolbarButtons()}
      </div>

      <div className="grid flex-1 gap-4 overflow-hidden px-4 py-2 md:grid-cols-[280px_1fr]">
        <div className="flex flex-col space-y-4 overflow-auto">
          {/* Tabs for sidebar panels */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 grid grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-0">
              <ReportTemplateSelector
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onTemplateSelect={handleTemplateSelect}
                onSaveAsTemplate={handleSaveAsTemplate}
                currentContent={reportContent}
                onTemplatesChange={handleTemplatesChange}
                onUploadTemplate={handleUploadTemplate}
              />
            </TabsContent>

            <TabsContent value="dynamic" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <DynamicContentPanel
                    onInsert={handleInsertDynamicContent}
                    projectId={projectId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <ReportSettings branding={branding} onBrandingChange={handleBrandingChange} />
            </TabsContent>
          </Tabs>

          <ReportExporter
            reportContent={reportContent}
            projectName={projectData.name}
            reportRef={reportRef}
            headerFooterConfig={headerFooterConfig}
            typographyOptions={branding.typography}
            pageMarginOptions={branding.pageMargins}
            watermarkOptions={branding.watermark}
          />
        </div>

        <div className="flex-1 overflow-hidden rounded-lg border" ref={reportRef}>
          <ReportEditor
            content={reportContent}
            onChange={handleContentChange}
            onAddImage={handleAddImage}
            ref={editorRef}
          />
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current report layout as a reusable template. This will include all text
              content and dynamic elements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Detailed Valuation Report"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Brief description of this template"
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Valuation Type</Label>
              <Select value={newTemplateType} onValueChange={setNewTemplateType}>
                <SelectTrigger id="template-type">
                  <SelectValue placeholder="Select a valuation type" />
                </SelectTrigger>
                <SelectContent>
                  {VALUATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-3 text-xs text-muted-foreground">
              <p>This template will include:</p>
              <ul className="mt-1 list-disc pl-4">
                <li>All text content from your current report</li>
                <li>All dynamic content elements and placeholders</li>
                <li>All formatting and structure</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveNewTemplate}>Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header & Footer Dialog */}
      <Dialog open={showHeaderFooterDialog} onOpenChange={setShowHeaderFooterDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Header & Footer Settings</DialogTitle>
            <DialogDescription>
              Customize headers and footers to appear on each page of your exported reports
            </DialogDescription>
          </DialogHeader>

          <HeaderFooterSettings
            config={headerFooterConfig}
            onConfigChange={handleHeaderFooterChange}
            projectName={projectData.name}
            companyName={projectData.company}
            valuationDate={projectData.valuationDate}
            reportTitle="Valuation Report"
          />

          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowHeaderFooterDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success('Header & footer settings saved')
                setShowHeaderFooterDialog(false)
              }}
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add a global type for the editor so it can be accessed from the window object
declare global {
  interface Window {
    tiptapEditor: any
  }
}
