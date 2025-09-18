'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, Plus, Edit, Save } from 'lucide-react';
import { useTemplateEngine } from '@/hooks/useTemplateEngine';
import { TemplateEditor } from '@/components/templates';
import draftService from '@/services/draftService';
import { useSearchParams } from 'next/navigation';
import type { ReportTemplate } from '@/lib/templates/types';

interface ReportGeneratorAppProps {
  valuationId?: number;
}

export function ReportGeneratorApp({ valuationId }: ReportGeneratorAppProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'editor' | 'preview'>('templates');
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [clientName, setClientName] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get('draft');

  const {
    generateReport,
    validateData,
    getTemplate,
    getSampleData,
    isProcessing,
    error
  } = useTemplateEngine();

  const template = getTemplate();
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate | null>(template);
  const [generatedHTML, setGeneratedHTML] = useState<string>('');
  const [currentData, setCurrentData] = useState(getSampleData());

  const handleGeneratePreview = async () => {
    if (!currentTemplate) return;

    try {
      const sampleData = getSampleData();
      const report = await generateReport(currentTemplate, sampleData, { status: 'draft', watermark: true });
      setGeneratedHTML(report.html);
      setActiveTab('preview');
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const handleSelectTemplate = (template: ReportTemplate) => {
    setCurrentTemplate(template);
    setActiveTab('editor');
  };

  const handleExportPDF = async () => {
    if (!currentTemplate) return;

    try {
      const report = await generateReport(currentTemplate, currentData, { status: 'final', watermark: false });

      // Create a new window with the HTML content for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(report.html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleSaveDraft = async () => {
    if (!currentTemplate || !draftName.trim()) return;

    try {
      const savedDraft = draftService.saveDraft({
        id: currentDraftId || undefined,
        name: draftName,
        template: currentTemplate,
        data: currentData,
        generatedHTML,
        status: 'draft',
        clientName: clientName || undefined
      });

      setCurrentDraftId(savedDraft.id);
      setShowSaveDraftDialog(false);
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    }
  };

  // Load draft if draft ID is provided in URL
  useEffect(() => {
    if (draftIdParam) {
      const draft = draftService.getDraft(draftIdParam);
      if (draft) {
        setCurrentTemplate(draft.template);
        setCurrentData(draft.data);
        setGeneratedHTML(draft.generatedHTML || '');
        setCurrentDraftId(draft.id);
        setDraftName(draft.name);
        setClientName(draft.clientName || '');
        setActiveTab('editor');
      }
    }
  }, [draftIdParam]);

  // Update current data when sample data changes
  useEffect(() => {
    if (!currentDraftId) {
      setCurrentData(getSampleData());
    }
  }, [currentDraftId, getSampleData]);



  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
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
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded hover:bg-accent/10 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {currentDraftId ? 'Update Draft' : 'Save Draft'}
                </button>
                <button
                  onClick={handleGeneratePreview}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {isProcessing ? 'Generating...' : 'Generate Preview'}
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded hover:bg-accent/10 disabled:opacity-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Template
          </button>

          {currentTemplate && (
            <>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit Template
              </button>

              {generatedHTML && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
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
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Processing template...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        {/* Template Info Tab */}
        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              {currentTemplate ? (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-semibold text-card-foreground mb-2">
                        {currentTemplate.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {currentTemplate.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Category: {currentTemplate.category}</span>
                        <span>Version: {currentTemplate.version}</span>
                        <span>Sections: {currentTemplate.sections.length}</span>
                        <span>Variables: {currentTemplate.variables.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Template Sections</h4>
                      <div className="space-y-2">
                        {currentTemplate.sections.map((section, index) => (
                          <div key={section.id} className="flex items-center justify-between p-3 bg-background rounded border">
                            <div>
                              <div className="font-medium">{section.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {section.blocks.length} blocks
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Section {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-3">Required Variables</h4>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {currentTemplate.variables.filter(v => v.required).map(variable => (
                          <div key={variable.id} className="p-3 bg-background rounded border">
                            <div className="font-medium">{variable.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {variable.type} | ID: {variable.id}
                            </div>
                            {variable.description && (
                              <div className="text-xs text-muted-foreground mt-1">
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
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">No Template Selected</h3>
                  <p className="text-muted-foreground mb-4">The 409A template is available for preview and generation.</p>
                  <button
                    onClick={() => setCurrentTemplate(template)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
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
                setCurrentTemplate(updatedTemplate);
                // In a real app, this would save to backend
                console.log('Template saved:', updatedTemplate);
              }}
              onPreview={(template) => {
                setCurrentTemplate(template);
                handleGeneratePreview();
              }}
              className="h-full"
            />
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && generatedHTML && (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded">
                <p className="text-primary text-sm">
                  <strong>Preview Mode:</strong> This shows how your 409A report will look with sample data.
                  Click "Export PDF" to generate a printable version.
                </p>
              </div>

              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div
                  className="report-preview"
                  dangerouslySetInnerHTML={{ __html: generatedHTML }}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    color: '#1f2937'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Draft Dialog */}
      {showSaveDraftDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              {currentDraftId ? 'Update Draft' : 'Save Draft'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Draft Name *
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Enter draft name..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Client Name (Optional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Enter client name..."
                />
              </div>

              {currentDraftId && (
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  <strong>Note:</strong> This will update the existing draft.
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={handleSaveDraft}
                disabled={!draftName.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {currentDraftId ? 'Update' : 'Save'} Draft
              </button>
              <button
                onClick={() => {
                  setShowSaveDraftDialog(false);
                  if (!currentDraftId) {
                    setDraftName('');
                    setClientName('');
                  }
                }}
                className="px-4 py-2 border border-border rounded hover:bg-accent/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}