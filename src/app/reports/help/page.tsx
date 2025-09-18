'use client';

import React, { useState } from 'react';
import {
  FileText,
  Edit,
  Download,
  Link,
  Play,
  CheckCircle,
  ArrowRight,
  Table,
  BarChart,
  Type,
  Eye,
  Save,
  Plus
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function ReportHelpPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: FileText },
    { id: 'workflow', title: 'Complete Workflow', icon: Play },
    { id: 'templates', title: 'Template Management', icon: Edit },
    { id: 'variables', title: 'Variable System', icon: Link },
    { id: 'editing', title: 'Content Editing', icon: Type },
    { id: 'export', title: 'PDF Export', icon: Download }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-card-foreground mb-2">
              Report Generator Help
            </h1>
            <p className="text-muted-foreground">
              Complete guide to creating professional 409A valuation reports
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-8">
          {/* Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6">
              <nav className="space-y-1">
                {sections.map(section => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-card-foreground">System Overview</h2>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">What is the Report Generator?</h3>
                  <p className="text-blue-800">
                    A comprehensive system for creating professional 409A valuation reports with
                    real-time data integration, template management, and PDF export capabilities.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Template System
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Block-based templates with professional 409A content, drag-and-drop editing,
                      and comprehensive variable mapping.
                    </p>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                      <Link className="w-5 h-5 text-primary" />
                      Data Integration
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Automatic population of variables from valuation data, including company info,
                      management team, and financial metrics.
                    </p>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                      <Edit className="w-5 h-5 text-primary" />
                      Visual Editor
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      WYSIWYG editor with Visual/HTML modes, variable insertion helpers,
                      and real-time preview capabilities.
                    </p>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                      <Download className="w-5 h-5 text-primary" />
                      PDF Export
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Professional PDF generation with proper formatting, page breaks,
                      and corporate branding elements.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'workflow' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-card-foreground">Complete Workflow</h2>

                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground mb-2">
                          Start from Valuation or Template Library
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p><strong>Option A:</strong> From a valuation page → click "Generate Report" button</p>
                          <p><strong>Option B:</strong> Go to Reports → Generator → Select existing template</p>
                          <p><strong>Option C:</strong> Reports → Library → Browse all templates</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground mb-2">
                          Choose or Create Template
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>• <strong>Standard 409A Template:</strong> Pre-loaded comprehensive template</p>
                          <p>• <strong>Custom Templates:</strong> Create from scratch or duplicate existing</p>
                          <p>• <strong>Template Types:</strong> 409A, Board Deck, Cap Table, Investor Update</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground mb-2">
                          Edit Content & Insert Variables
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>• <strong>Visual Mode:</strong> Edit like a Word document</p>
                          <p>• <strong>HTML Mode:</strong> Advanced formatting and styling</p>
                          <p>• <strong>Variable Bank:</strong> Drag variables from right sidebar</p>
                          <p>• <strong>Block System:</strong> Add text, tables, charts, sections</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        4
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground mb-2">
                          Preview with Real Data
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>• <strong>Preview Tab:</strong> See how report looks with real valuation data</p>
                          <p>• <strong>Sample Data:</strong> When no valuation is attached</p>
                          <p>• <strong>Variable Population:</strong> Automatic data mapping</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        5
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground mb-2">
                          Save & Export PDF
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>• <strong>Save Template:</strong> Click Save button (always enabled after changes)</p>
                          <p>• <strong>Export PDF:</strong> Generate professional PDF with real data</p>
                          <p>• <strong>Download:</strong> PDF automatically downloads to your device</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Pro Tips
                  </h3>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Variables automatically populate when you attach a valuation</li>
                    <li>• Use the Variable Bank to quickly insert common variables</li>
                    <li>• Save frequently to avoid losing changes</li>
                    <li>• Preview mode shows exactly how the PDF will look</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'templates' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-card-foreground">Template Management</h2>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-card-foreground">Creating Templates</h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Plus className="w-5 h-5 text-primary" />
                        <span className="font-medium">New Template Button → Choose template type → Enter name</span>
                      </div>
                      <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                        <p><strong>409A Valuation:</strong> Comprehensive professional template</p>
                        <p><strong>Board Deck:</strong> Executive summary format</p>
                        <p><strong>Cap Table:</strong> Shareholder information focus</p>
                        <p><strong>Custom:</strong> Start from blank template</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-card-foreground">Template Library</h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        Access all templates from <strong>Reports → Library</strong>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border rounded p-3">
                          <h4 className="font-medium mb-1">Search & Filter</h4>
                          <p className="text-sm text-muted-foreground">Find templates by name or type</p>
                        </div>
                        <div className="border border-border rounded p-3">
                          <h4 className="font-medium mb-1">Duplicate Templates</h4>
                          <p className="text-sm text-muted-foreground">Create copies to customize</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-card-foreground">Attaching to Valuations</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-amber-900">How to Associate Templates with Valuations</h4>
                      <ol className="text-amber-800 text-sm space-y-1 list-decimal list-inside">
                        <li>Go to a specific valuation page</li>
                        <li>Look for "Generate Report" or "Reports" section</li>
                        <li>Select template from dropdown</li>
                        <li>Template will auto-populate with valuation data</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'variables' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-card-foreground">Variable System</h2>

                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-3">Available Variable Categories</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { category: 'Company', vars: ['{{company.name}}', '{{company.description}}', '{{company.headquarters}}'] },
                        { category: 'Valuation', vars: ['{{valuation.date}}', '{{valuation.fair_market_value}}', '{{valuation.security_type}}'] },
                        { category: 'Management', vars: ['{{management.member_1_name}}', '{{management.member_1_title}}'] },
                        { category: 'Financing', vars: ['{{financing.last_round_date}}', '{{financing.last_round_pps}}'] }
                      ].map(group => (
                        <div key={group.category} className="border border-border rounded p-3">
                          <h4 className="font-medium text-primary mb-2">{group.category}</h4>
                          <div className="space-y-1">
                            {group.vars.map(variable => (
                              <code key={variable} className="block text-xs bg-background px-2 py-1 rounded">
                                {variable}
                              </code>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-3">Variable Formats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <code className="bg-background px-2 py-1 rounded">{'{{variable}}'}</code>
                        <span className="text-muted-foreground">Raw value</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="bg-background px-2 py-1 rounded">{'{{variable | currency}}'}</code>
                        <span className="text-muted-foreground">$1,234.56 format</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="bg-background px-2 py-1 rounded">{'{{variable | percentage}}'}</code>
                        <span className="text-muted-foreground">12.34% format</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <code className="bg-background px-2 py-1 rounded">{'{{variable | date}}'}</code>
                        <span className="text-muted-foreground">January 1, 2024 format</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'editing' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-card-foreground">Content Editing</h2>

                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-3">Editing Modes</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Eye className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">Visual Mode</h4>
                          <p className="text-sm text-muted-foreground">
                            Edit content like a Word document. Perfect for text editing and basic formatting.
                            HTML is automatically converted to plain text for easy editing.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">HTML Mode</h4>
                          <p className="text-sm text-muted-foreground">
                            Advanced editing with full HTML/CSS support. Use for complex formatting,
                            tables, and professional layouts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-3">Block Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { icon: Type, name: 'Text Block', desc: 'Regular paragraphs and content' },
                        { icon: FileText, name: 'Section', desc: 'Sections with titles and content' },
                        { icon: Table, name: 'Table', desc: 'Data tables from your valuations' },
                        { icon: BarChart, name: 'Chart', desc: 'Graphs and visualizations' }
                      ].map(block => (
                        <div key={block.name} className="flex items-center gap-3 p-2 border border-border rounded">
                          <block.icon className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-medium text-sm">{block.name}</div>
                            <div className="text-xs text-muted-foreground">{block.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Save Button Fix</h3>
                    <p className="text-green-800 text-sm">
                      <strong>Issue Resolved:</strong> Save button is now always enabled when you make changes.
                      The template automatically saves your edits, and you'll see a confirmation message.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'export' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-card-foreground">PDF Export</h2>

                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-3">Export Process</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                          <h4 className="font-medium">Click Export PDF Button</h4>
                          <p className="text-sm text-muted-foreground">
                            Available in the header toolbar when editing templates
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                          <h4 className="font-medium">PDF Generation</h4>
                          <p className="text-sm text-muted-foreground">
                            System processes template with real valuation data and generates professional PDF
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                          <h4 className="font-medium">Automatic Download</h4>
                          <p className="text-sm text-muted-foreground">
                            PDF automatically downloads to your default download folder
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-semibold text-card-foreground mb-3">PDF Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-primary">Professional Formatting</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• A4 page size</li>
                          <li>• Proper margins and spacing</li>
                          <li>• Theme colors and branding</li>
                          <li>• Page breaks where needed</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-primary">Content Features</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Real valuation data</li>
                          <li>• Formatted numbers and dates</li>
                          <li>• Tables and charts</li>
                          <li>• Headers and footers</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      New PDF Export Feature
                    </h3>
                    <p className="text-blue-800 text-sm">
                      <strong>Now Available:</strong> Professional PDF generation and export.
                      Export comprehensive 409A reports with proper formatting and real data integration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}