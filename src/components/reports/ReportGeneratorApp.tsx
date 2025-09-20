'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Eye, Download, Plus, Edit, Save } from 'lucide-react'
import { useTemplateEngine } from '@/hooks/useTemplateEngine'
import { TemplateEditor } from '@/components/templates'
import draftService from '@/services/draftService'
import { useSearchParams } from 'next/navigation'
import type { ReportTemplate } from '@/lib/templates/types'

interface ReportGeneratorAppProps {
  valuationId?: number
}

export function ReportGeneratorApp({ valuationId }: ReportGeneratorAppProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'editor' | 'preview'>('templates')
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [clientName, setClientName] = useState('')
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const draftIdParam = searchParams.get('draft')

  const { generateReport, validateData, getTemplate, getSampleData, isProcessing, error } =
    useTemplateEngine()

  const template = getTemplate()
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate | null>(template)
  const [generatedHTML, setGeneratedHTML] = useState<string>('')
  const [currentData, setCurrentData] = useState(getSampleData())

  const handleGeneratePreview = async () => {
    if (!currentTemplate) return

    try {
      const sampleData = getSampleData()
      const report = await generateReport(currentTemplate, sampleData, {
        status: 'draft',
        watermark: true,
      })
      setGeneratedHTML(report.html)
      setActiveTab('preview')
    } catch (err) {
      console.error('Error generating preview:', err)
    }
  }

  const handleSelectTemplate = (template: ReportTemplate) => {
    setCurrentTemplate(template)
    setActiveTab('editor')
  }

  const handleExportPDF = async () => {
    if (!currentTemplate) return

    try {
      const report = await generateReport(currentTemplate, currentData, {
        status: 'final',
        watermark: false,
      })

      // Create a new window with the HTML content for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(report.html)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  const handleSaveDraft = async () => {
    if (!currentTemplate || !draftName.trim()) return

    try {
      const savedDraft = draftService.saveDraft({
        id: currentDraftId || undefined,
        name: draftName,
        template: currentTemplate,
        data: currentData,
        generatedHTML,
        status: 'draft',
        clientName: clientName || undefined,
      })

      setCurrentDraftId(savedDraft.id)
      setShowSaveDraftDialog(false)
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Error saving draft. Please try again.')
    }
  }

  // Load draft if draft ID is provided in URL
  useEffect(() => {
    if (draftIdParam) {
      const draft = draftService.getDraft(draftIdParam)
      if (draft) {
        setCurrentTemplate(draft.template)
        setCurrentData(draft.data)
        setGeneratedHTML(draft.generatedHTML || '')
        setCurrentDraftId(draft.id)
        setDraftName(draft.name)
        setClientName(draft.clientName || '')
        setActiveTab('editor')
      }
    }
  }, [draftIdParam])

  // Update current data when sample data changes
  useEffect(() => {
    if (!currentDraftId) {
      setCurrentData(getSampleData())
    }
  }, [currentDraftId, getSampleData])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Report Generator</h1>
            <p className="text-muted-foreground">Create and manage professional 409A reports</p>
          </div>

          <div className="flex items-center gap-3">
            {currentTemplate && (
              <>
                <button
                  onClick={() => setShowSaveDraftDialog(true)}
                  className="flex items-center gap-2 rounded border border-border px-4 py-2 transition-colors hover:bg-accent/10"
                >
                  <Save className="h-4 w-4" />
                  {currentDraftId ? 'Update Draft' : 'Save Draft'}
                </button>
                <button
                  onClick={handleGeneratePreview}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" />
                  {isProcessing ? 'Generating...' : 'Generate Preview'}
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded border border-border px-4 py-2 transition-colors hover:bg-accent/10 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('templates')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="mr-2 inline h-4 w-4" />
            Template
          </button>

          {currentTemplate && (
            <>
              <button
                onClick={() => setActiveTab('editor')}
                className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit className="mr-2 inline h-4 w-4" />
                Edit Template
              </button>

              {generatedHTML && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="mr-2 inline h-4 w-4" />
                  Preview
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isProcessing && (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Processing template...</div>
          </div>
        )}

        {error && (
          <div className="border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Template Info Tab */}
        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="mx-auto max-w-4xl">
              {currentTemplate ? (
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h3 className="mb-2 text-2xl font-semibold text-card-foreground">
                        {currentTemplate.name}
                      </h3>
                      <p className="mb-4 text-muted-foreground">{currentTemplate.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Category: {currentTemplate.category}</span>
                        <span>Version: {currentTemplate.version}</span>
                        <span>Sections: {currentTemplate.sections.length}</span>
                        <span>Variables: {currentTemplate.variables.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">Template Sections</h4>
                      <div className="space-y-2">
                        {currentTemplate.sections.map((section, index) => (
                          <div
                            key={section.id}
                            className="flex items-center justify-between rounded border bg-background p-3"
                          >
                            <div>
                              <div className="font-medium">{section.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {section.blocks.length} blocks
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">Section {index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-lg font-semibold">Required Variables</h4>
                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        {currentTemplate.variables
                          .filter((v) => v.required)
                          .map((variable) => (
                            <div key={variable.id} className="rounded border bg-background p-3">
                              <div className="font-medium">{variable.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Type: {variable.type} | ID: {variable.id}
                              </div>
                              {variable.description && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {variable.description}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                    No Template Selected
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    The 409A template is available for preview and generation.
                  </p>
                  <button
                    onClick={() => setCurrentTemplate(template)}
                    className="rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Load 409A Template
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Editor Tab */}
        {activeTab === 'editor' && currentTemplate && (
          <div className="h-full">
            <TemplateEditor
              template={currentTemplate}
              onSave={(updatedTemplate) => {
                setCurrentTemplate(updatedTemplate)
                // In a real app, this would save to backend
                console.log('Template saved:', updatedTemplate)
              }}
              onPreview={(template) => {
                setCurrentTemplate(template)
                handleGeneratePreview()
              }}
              className="h-full"
            />
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && generatedHTML && (
          <div className="p-6">
            <div className="mx-auto max-w-6xl">
              <div className="mb-4 rounded border border-primary/20 bg-primary/10 p-3">
                <p className="text-sm text-primary">
                  <strong>Preview Mode:</strong> This shows how your 409A report will look with
                  sample data. Click "Export PDF" to generate a printable version.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div
                  className="report-preview"
                  dangerouslySetInnerHTML={{ __html: generatedHTML }}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: '#1f2937',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Draft Dialog */}
      {showSaveDraftDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              {currentDraftId ? 'Update Draft' : 'Save Draft'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Draft Name *
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded border border-border bg-background p-2 text-foreground transition-colors focus:border-primary focus:ring-2 focus:ring-primary"
                  placeholder="Enter draft name..."
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Client Name (Optional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded border border-border bg-background p-2 text-foreground transition-colors focus:border-primary focus:ring-2 focus:ring-primary"
                  placeholder="Enter client name..."
                />
              </div>

              {currentDraftId && (
                <div className="rounded bg-muted p-2 text-sm text-muted-foreground">
                  <strong>Note:</strong> This will update the existing draft.
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={!draftName.trim()}
                className="flex-1 rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="mr-2 inline h-4 w-4" />
                {currentDraftId ? 'Update' : 'Save'} Draft
              </button>
              <button
                onClick={() => {
                  setShowSaveDraftDialog(false)
                  if (!currentDraftId) {
                    setDraftName('')
                    setClientName('')
                  }
                }}
                className="rounded border border-border px-4 py-2 transition-colors hover:bg-accent/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
