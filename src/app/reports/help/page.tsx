'use client'

import React, { useState } from 'react'
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
  Plus,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function ReportHelpPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', title: 'Overview', icon: FileText },
    { id: 'workflow', title: 'Complete Workflow', icon: Play },
    { id: 'templates', title: 'Template Management', icon: Edit },
    { id: 'variables', title: 'Variable System', icon: Link },
    { id: 'editing', title: 'Content Editing', icon: Type },
    { id: 'export', title: 'PDF Export', icon: Download },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="mb-2 text-3xl font-bold text-card-foreground">Report Generator Help</h1>
            <p className="text-muted-foreground">
              Complete guide to creating professional 409A valuation reports
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl p-6">
          <div className="flex gap-8">
            {/* Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-6">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.title}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">System Overview</h2>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h3 className="mb-2 font-semibold text-blue-900">
                      What is the Report Generator?
                    </h3>
                    <p className="text-blue-800">
                      A comprehensive system for creating professional 409A valuation reports with
                      real-time data integration, template management, and PDF export capabilities.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-card-foreground">
                        <FileText className="h-5 w-5 text-primary" />
                        Template System
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Block-based templates with professional 409A content, drag-and-drop editing,
                        and comprehensive variable mapping.
                      </p>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-card-foreground">
                        <Link className="h-5 w-5 text-primary" />
                        Data Integration
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Automatic population of variables from valuation data, including company
                        info, management team, and financial metrics.
                      </p>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-card-foreground">
                        <Edit className="h-5 w-5 text-primary" />
                        Visual Editor
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        WYSIWYG editor with Visual/HTML modes, variable insertion helpers, and
                        real-time preview capabilities.
                      </p>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-card-foreground">
                        <Download className="h-5 w-5 text-primary" />
                        PDF Export
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Professional PDF generation with proper formatting, page breaks, and
                        corporate branding elements.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'workflow' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Complete Workflow</h2>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          1
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 font-semibold text-card-foreground">
                            Start from Valuation or Template Library
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              <strong>Option A:</strong> From a valuation page → click "Generate
                              Report" button
                            </p>
                            <p>
                              <strong>Option B:</strong> Go to Reports → Generator → Select existing
                              template
                            </p>
                            <p>
                              <strong>Option C:</strong> Reports → Library → Browse all templates
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          2
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 font-semibold text-card-foreground">
                            Choose or Create Template
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              • <strong>Standard 409A Template:</strong> Pre-loaded comprehensive
                              template
                            </p>
                            <p>
                              • <strong>Custom Templates:</strong> Create from scratch or duplicate
                              existing
                            </p>
                            <p>
                              • <strong>Template Types:</strong> 409A, Board Deck, Cap Table,
                              Investor Update
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          3
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 font-semibold text-card-foreground">
                            Edit Content & Insert Variables
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              • <strong>Visual Mode:</strong> Edit like a Word document
                            </p>
                            <p>
                              • <strong>HTML Mode:</strong> Advanced formatting and styling
                            </p>
                            <p>
                              • <strong>Variable Bank:</strong> Drag variables from right sidebar
                            </p>
                            <p>
                              • <strong>Block System:</strong> Add text, tables, charts, sections
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          4
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 font-semibold text-card-foreground">
                            Preview with Real Data
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              • <strong>Preview Tab:</strong> See how report looks with real
                              valuation data
                            </p>
                            <p>
                              • <strong>Sample Data:</strong> When no valuation is attached
                            </p>
                            <p>
                              • <strong>Variable Population:</strong> Automatic data mapping
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          5
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-2 font-semibold text-card-foreground">
                            Save & Export PDF
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              • <strong>Save Template:</strong> Click Save button (always enabled
                              after changes)
                            </p>
                            <p>
                              • <strong>Export PDF:</strong> Generate professional PDF with real
                              data
                            </p>
                            <p>
                              • <strong>Download:</strong> PDF automatically downloads to your
                              device
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-900">
                      <CheckCircle className="h-5 w-5" />
                      Pro Tips
                    </h3>
                    <ul className="space-y-1 text-sm text-green-800">
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
                    <h3 className="text-lg font-semibold text-card-foreground">
                      Creating Templates
                    </h3>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Plus className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            New Template Button → Choose template type → Enter name
                          </span>
                        </div>
                        <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                          <p>
                            <strong>409A Valuation:</strong> Comprehensive professional template
                          </p>
                          <p>
                            <strong>Board Deck:</strong> Executive summary format
                          </p>
                          <p>
                            <strong>Cap Table:</strong> Shareholder information focus
                          </p>
                          <p>
                            <strong>Custom:</strong> Start from blank template
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-card-foreground">Template Library</h3>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="space-y-3">
                        <p className="text-muted-foreground">
                          Access all templates from <strong>Reports → Library</strong>
                        </p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="rounded border border-border p-3">
                            <h4 className="mb-1 font-medium">Search & Filter</h4>
                            <p className="text-sm text-muted-foreground">
                              Find templates by name or type
                            </p>
                          </div>
                          <div className="rounded border border-border p-3">
                            <h4 className="mb-1 font-medium">Duplicate Templates</h4>
                            <p className="text-sm text-muted-foreground">
                              Create copies to customize
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-card-foreground">
                      Attaching to Valuations
                    </h3>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-amber-900">
                          How to Associate Templates with Valuations
                        </h4>
                        <ol className="list-inside list-decimal space-y-1 text-sm text-amber-800">
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
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 font-semibold text-card-foreground">
                        Available Variable Categories
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          {
                            category: 'Company',
                            vars: [
                              '{{company.name}}',
                              '{{company.description}}',
                              '{{company.headquarters}}',
                            ],
                          },
                          {
                            category: 'Valuation',
                            vars: [
                              '{{valuation.date}}',
                              '{{valuation.fair_market_value}}',
                              '{{valuation.security_type}}',
                            ],
                          },
                          {
                            category: 'Management',
                            vars: ['{{management.member_1_name}}', '{{management.member_1_title}}'],
                          },
                          {
                            category: 'Financing',
                            vars: ['{{financing.last_round_date}}', '{{financing.last_round_pps}}'],
                          },
                        ].map((group) => (
                          <div key={group.category} className="rounded border border-border p-3">
                            <h4 className="mb-2 font-medium text-primary">{group.category}</h4>
                            <div className="space-y-1">
                              {group.vars.map((variable) => (
                                <code
                                  key={variable}
                                  className="block rounded bg-background px-2 py-1 text-xs"
                                >
                                  {variable}
                                </code>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 font-semibold text-card-foreground">Variable Formats</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                          <code className="rounded bg-background px-2 py-1">{'{{variable}}'}</code>
                          <span className="text-muted-foreground">Raw value</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="rounded bg-background px-2 py-1">
                            {'{{variable | currency}}'}
                          </code>
                          <span className="text-muted-foreground">$1,234.56 format</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="rounded bg-background px-2 py-1">
                            {'{{variable | percentage}}'}
                          </code>
                          <span className="text-muted-foreground">12.34% format</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="rounded bg-background px-2 py-1">
                            {'{{variable | date}}'}
                          </code>
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
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 font-semibold text-card-foreground">Editing Modes</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Eye className="mt-0.5 h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium">Visual Mode</h4>
                            <p className="text-sm text-muted-foreground">
                              Edit content like a Word document. Perfect for text editing and basic
                              formatting. HTML is automatically converted to plain text for easy
                              editing.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium">HTML Mode</h4>
                            <p className="text-sm text-muted-foreground">
                              Advanced editing with full HTML/CSS support. Use for complex
                              formatting, tables, and professional layouts.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 font-semibold text-card-foreground">Block Types</h3>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {[
                          {
                            icon: Type,
                            name: 'Text Block',
                            desc: 'Regular paragraphs and content',
                          },
                          {
                            icon: FileText,
                            name: 'Section',
                            desc: 'Sections with titles and content',
                          },
                          { icon: Table, name: 'Table', desc: 'Data tables from your valuations' },
                          { icon: BarChart, name: 'Chart', desc: 'Graphs and visualizations' },
                        ].map((block) => (
                          <div
                            key={block.name}
                            className="flex items-center gap-3 rounded border border-border p-2"
                          >
                            <block.icon className="h-4 w-4 text-primary" />
                            <div>
                              <div className="text-sm font-medium">{block.name}</div>
                              <div className="text-xs text-muted-foreground">{block.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <h3 className="mb-2 font-semibold text-green-900">Save Button Fix</h3>
                      <p className="text-sm text-green-800">
                        <strong>Issue Resolved:</strong> Save button is now always enabled when you
                        make changes. The template automatically saves your edits, and you'll see a
                        confirmation message.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'export' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">PDF Export</h2>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 font-semibold text-card-foreground">Export Process</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">Click Export PDF Button</h4>
                            <p className="text-sm text-muted-foreground">
                              Available in the header toolbar when editing templates
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">PDF Generation</h4>
                            <p className="text-sm text-muted-foreground">
                              System processes template with real valuation data and generates
                              professional PDF
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">Automatic Download</h4>
                            <p className="text-sm text-muted-foreground">
                              PDF automatically downloads to your default download folder
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <h3 className="mb-3 font-semibold text-card-foreground">PDF Features</h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h4 className="font-medium text-primary">Professional Formatting</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• A4 page size</li>
                            <li>• Proper margins and spacing</li>
                            <li>• Theme colors and branding</li>
                            <li>• Page breaks where needed</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-primary">Content Features</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• Real valuation data</li>
                            <li>• Formatted numbers and dates</li>
                            <li>• Tables and charts</li>
                            <li>• Headers and footers</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
                        <Download className="h-5 w-5" />
                        New PDF Export Feature
                      </h3>
                      <p className="text-sm text-blue-800">
                        <strong>Now Available:</strong> Professional PDF generation and export.
                        Export comprehensive 409A reports with proper formatting and real data
                        integration.
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
  )
}
