'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Download,
  Save,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Settings,
  Clock,
  CheckCircle
} from 'lucide-react';
import { getStatusColor, formatDate } from '@/lib/utils';
import draftService, { SavedDraft } from '@/services/draftService';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import type { ReportTemplate, TemplateVariable } from '@/lib/templates/types';

interface ReportData {
  id: string;
  name: string;
  clientName: string;
  valuationId: number;
  templateId: string;
  status: 'draft' | 'final';
  createdAt: string;
  updatedAt: string;
  customizations?: any;
  isDraft?: boolean;
  draftData?: SavedDraft;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'editor'>('overview');

  const reportId = params.reportId as string;

  useEffect(() => {
    loadReport();
  }, [reportId]);

  // Create a sample template for the report
  const createReportTemplate = (reportData: ReportData): ReportTemplate => {
    const defaultVariables: TemplateVariable[] = [
      // Company variables
      { id: 'company.name', name: 'Company Name', type: 'text', required: true, category: 'Company', defaultValue: reportData.clientName },
      { id: 'company.description', name: 'Company Description', type: 'text', required: false, category: 'Company' },
      { id: 'company.incorporation_year', name: 'Incorporation Year', type: 'number', required: true, category: 'Company' },
      { id: 'company.headquarters', name: 'Headquarters Location', type: 'text', required: true, category: 'Company' },

      // Valuation variables
      { id: 'valuation.date', name: 'Valuation Date', type: 'date', required: true, category: 'Valuation', defaultValue: new Date().toISOString().split('T')[0] },
      { id: 'valuation.fair_market_value', name: 'Fair Market Value per Share', type: 'currency', required: true, category: 'Valuation' },
      { id: 'valuation.security_type', name: 'Security Type', type: 'text', required: true, category: 'Valuation', defaultValue: 'Common Stock' },

      // Appraiser variables
      { id: 'appraiser.first_name', name: 'Appraiser First Name', type: 'text', required: true, category: 'Appraiser', defaultValue: 'Value8' },
      { id: 'appraiser.last_name', name: 'Appraiser Last Name', type: 'text', required: true, category: 'Appraiser', defaultValue: 'AI' },
      { id: 'appraiser.title', name: 'Appraiser Title', type: 'text', required: true, category: 'Appraiser', defaultValue: 'Senior Valuation Analyst' },
    ];

    return {
      id: `template_${reportData.id}`,
      name: `${reportData.name} Template`,
      description: `Custom template for ${reportData.clientName} 409A valuation report`,
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
                margin: '0 0 20px 0'
              }
            },
            {
              id: 'summary_paragraph',
              type: 'paragraph',
              content: 'We have performed a valuation of the common stock of {{company.name}} as of {{valuation.date}} for purposes of determining the fair market value per share for 409A compliance. Based on our analysis, we have determined the fair market value to be ${{valuation.fair_market_value}} per share.',
              styling: {
                fontSize: 14,
                textAlign: 'justify',
                margin: '10px 0'
              }
            }
          ]
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
                margin: '20px 0 15px 0'
              }
            },
            {
              id: 'company_description',
              type: 'paragraph',
              content: '{{company.name}} is a company incorporated in {{company.incorporation_year}} and headquartered in {{company.headquarters}}. {{company.description}}',
              styling: {
                fontSize: 14,
                textAlign: 'justify',
                margin: '10px 0'
              }
            }
          ]
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
                margin: '20px 0 15px 0'
              }
            },
            {
              id: 'conclusion_paragraph',
              type: 'paragraph',
              content: 'Based on our comprehensive analysis of {{company.name}}, we have determined the fair market value of the {{valuation.security_type}} to be ${{valuation.fair_market_value}} per share as of {{valuation.date}}. This valuation reflects our assessment of the company\'s current financial position, growth prospects, and market conditions.',
              styling: {
                fontSize: 14,
                textAlign: 'justify',
                margin: '10px 0'
              }
            }
          ]
        }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: reportData.clientName,
        tags: ['409A', 'valuation', 'custom']
      },
      settings: {
        paperSize: 'letter',
        orientation: 'portrait',
        margins: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        },
        watermark: {
          enabled: reportData.status === 'draft',
          text: 'DRAFT',
          opacity: 0.1
        }
      }
    };
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      // Try to load from drafts first
      const savedDraft = draftService.getDraft(reportId);
      if (savedDraft) {
        const reportData = {
          id: savedDraft.id,
          name: savedDraft.name,
          clientName: savedDraft.clientName || 'Unknown Client',
          valuationId: savedDraft.valuationId || 0,
          templateId: savedDraft.templateId || '',
          status: savedDraft.status,
          createdAt: savedDraft.createdAt,
          updatedAt: savedDraft.updatedAt,
          isDraft: true,
          draftData: savedDraft
        };
        setReport(reportData);
        setTemplate(createReportTemplate(reportData));
      } else {
        // Handle non-draft reports (mock data for now)
        const mockReportData = {
          id: reportId,
          name: '409A Valuation Report - Q4 2023',
          clientName: 'TechStart Inc.',
          valuationId: 1,
          templateId: 'template_409a_standard',
          status: 'final',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-12T14:30:00Z'
        };
        setReport(mockReportData);
        setTemplate(createReportTemplate(mockReportData));
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateUpdate = async (updatedTemplate: ReportTemplate) => {
    if (!report) return;

    try {
      setTemplate(updatedTemplate);

      // If this is a draft, save the template changes to the draft
      if (report.isDraft && report.draftData) {
        const updatedDraft = {
          ...report.draftData,
          templateData: updatedTemplate,
          updatedAt: new Date().toISOString()
        };

        // Save to draft service
        draftService.saveDraft(updatedDraft);

        // Update local state
        setReport(prev => prev ? {
          ...prev,
          updatedAt: updatedDraft.updatedAt,
          draftData: updatedDraft
        } : null);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template changes. Please try again.');
    }
  };

  const handleContinueEditing = () => {
    setActiveTab('editor');
  };

  const handleGeneratePDF = async (withWatermark: boolean = true) => {
    if (!report) return;

    setSaving(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a blob with sample content for download
      const htmlContent = `
        <html>
          <head>
            <title>${report.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 72px;
                color: rgba(0,0,0,0.1);
                z-index: -1;
                ${withWatermark && report.status === 'draft' ? '' : 'display: none;'}
              }
              h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
              .section { margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="watermark">DRAFT</div>
            <h1>409A Valuation Report</h1>
            <div class="section">
              <h2>Company Information</h2>
              <p><strong>Company:</strong> ${report.clientName}</p>
              <p><strong>Valuation ID:</strong> ${report.valuationId}</p>
            </div>
            <div class="section">
              <h2>Report Details</h2>
              <p><strong>Template:</strong> ${report.templateId}</p>
              <p><strong>Status:</strong> ${report.status}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}_${withWatermark && report.status === 'draft' ? 'DRAFT' : 'FINAL'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAs = () => {
    if (!report || !report.isDraft) return;

    const duplicated = draftService.duplicateDraft(report.id);
    if (duplicated) {
      router.push(`/reports/${duplicated.id}`);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading report...</div>
        </div>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert>
            <AlertDescription>
              Report not found. <Button variant="link" onClick={() => router.push('/reports')} className="p-0 h-auto">Go back to Reports</Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/reports')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Reports
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{report.name}</h1>
                <p className="text-muted-foreground">
                  {report.clientName} • {formatDate(report.updatedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(report.status)}>
                {report.status === 'draft' ? (
                  <Clock className="w-3 h-3 mr-1" />
                ) : (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full">
            <div className="border-b border-border px-6">
              <TabsList className="bg-transparent p-0">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2">
                  <Eye className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="editor" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 py-2">
                  <Edit className="w-4 h-4 mr-2" />
                  Template Editor
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-6 space-y-6 h-full overflow-auto m-0">
              {/* Report Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-base">
                      <Building2 className="w-4 h-4 mr-2" />
                      Company Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Client:</span>
                        <div className="font-medium">{report.clientName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valuation ID:</span>
                        <div className="font-medium">{report.valuationId}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-base">
                      <FileText className="w-4 h-4 mr-2" />
                      Template Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Template:</span>
                        <div className="font-medium">{report.templateId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Report Type:</span>
                        <div className="font-medium">409A Valuation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-base">
                      <Calendar className="w-4 h-4 mr-2" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <div className="font-medium">{formatDate(report.createdAt)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Modified:</span>
                        <div className="font-medium">{formatDate(report.updatedAt)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Report Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {report.isDraft && (
                      <Button onClick={handleContinueEditing}>
                        <Edit className="w-4 h-4 mr-2" />
                        Continue Editing
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => handleGeneratePDF(true)}
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download Draft
                    </Button>

                    {report.status === 'final' && (
                      <Button
                        variant="outline"
                        onClick={() => handleGeneratePDF(false)}
                        disabled={saving}
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Download Final
                      </Button>
                    )}

                    {report.isDraft && (
                      <Button
                        variant="outline"
                        onClick={handleSaveAs}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save As Copy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Draft-specific alert */}
              {report.isDraft && (
                <Alert>
                  <AlertDescription>
                    This is a draft report. You can continue editing using the Template Editor tab, download a draft version, or save a copy for further modifications.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="editor" className="p-0 h-full m-0">
              {template && (
                <div className="h-full">
                  <TemplateEditor
                    template={template}
                    onSave={handleTemplateUpdate}
                    className="h-full"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}