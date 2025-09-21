'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  Download,
  Upload,
  Eye,
  Calendar,
  Tag,
  User,
  ArrowLeft,
  Calculator,
  Building2,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import type { ReportTemplate, TemplateCategory } from '@/lib/templates/types'

// Sample templates data - in real app this would come from API
const sampleTemplates: ReportTemplate[] = [
  {
    id: 'template_409a_standard',
    name: 'Standard 409A Valuation Report',
    description:
      'Comprehensive 409A valuation report template with all required sections for compliance.',
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
  {
    id: 'template_cap_table_summary',
    name: 'Cap Table Summary Report',
    description:
      'Detailed capitalization table summary with ownership percentages and dilution analysis.',
    category: 'financial',
    version: '1.8.0',
    sections: [],
    variables: [],
    metadata: {
      createdAt: '2024-01-10T14:20:00Z',
      updatedAt: '2024-03-01T10:15:00Z',
      author: 'Bridgeland Advisors',
      tags: ['cap-table', 'ownership', 'dilution', 'financial'],
    },
  },
]

export default function TemplateLibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const valuationId = searchParams?.get('valuationId')
  const [templates, setTemplates] = useState<ReportTemplate[]>(sampleTemplates)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [filteredTemplates, setFilteredTemplates] = useState<ReportTemplate[]>(sampleTemplates)
  const [valuationProject, setValuationProject] = useState<any>(null)

  // Load valuation details when valuationId is present
  useEffect(() => {
    if (valuationId) {
      const fetchValuationDetails = async () => {
        try {
          const response = await fetch(`/api/valuations/${valuationId}`)
          if (response.ok) {
            const valuation = await response.json()

            // Get client name
            const clientResponse = await fetch(`/api/companies/${valuation.companyId}`)
            const client = clientResponse.ok ? await clientResponse.json() : null

            setValuationProject({
              ...valuation,
              clientName: client?.name || 'Unknown Client',
            })
          }
        } catch (error) {
          console.error('Error fetching valuation details:', error)
        }
      }

      fetchValuationDetails()
    }
  }, [valuationId])

  useEffect(() => {
    let filtered = templates

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.metadata?.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    setFilteredTemplates(filtered)
  }, [templates, searchQuery, selectedCategory])

  const handleCreateNew = () => {
    const params = new URLSearchParams({ templateName: 'New Template' })
    if (valuationId) params.set('valuationId', valuationId)
    router.push(`/reports/template-editor?${params.toString()}`)
  }

  const handleEditTemplate = (templateId: string) => {
    const params = new URLSearchParams({ templateId })
    if (valuationId) params.set('valuationId', valuationId)
    router.push(`/reports/template-editor?${params.toString()}`)
  }

  const handleUseTemplate = (templateId: string) => {
    const params = new URLSearchParams({ templateId })
    if (valuationId) params.set('valuationId', valuationId)
    router.push(`/reports/generator?${params.toString()}`)
  }

  const handleCloneTemplate = (template: ReportTemplate) => {
    const clonedTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`,
      metadata: {
        ...template.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    setTemplates((prev) => [...prev, clonedTemplate])
    alert(`Template "${clonedTemplate.name}" has been created successfully!`)
  }

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    const confirmed = confirm(
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
    )
    if (confirmed) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    }
  }

  const handleExportTemplate = (template: ReportTemplate) => {
    const dataStr = JSON.stringify(template, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImportTemplate = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string)
            imported.id = `template_${Date.now()}`
            imported.metadata = {
              ...imported.metadata,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            setTemplates((prev) => [...prev, imported])
            alert('Template imported successfully!')
          } catch (error) {
            alert('Error importing template. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString()
  }

  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case 'financial':
        return 'bg-blue-100 text-blue-800'
      case 'legal':
        return 'bg-green-100 text-green-800'
      case 'operational':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Back navigation for valuation context */}
          {valuationId && (
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/valuations/${valuationId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Valuation
              </Button>
              {valuationProject && (
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{valuationProject.title}</h2>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{valuationProject.clientName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {valuationId ? 'Choose a Template' : 'Template Library'}
              </h1>
              <p className="text-muted-foreground">
                {valuationId
                  ? 'Select a template to create a report for this valuation'
                  : 'Manage and organize your report templates'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!valuationId && (
                <Button variant="outline" onClick={handleImportTemplate}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              )}
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                {valuationId ? 'Create Custom Template' : 'Create New Template'}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Category: {selectedCategory === 'all' ? 'All' : selectedCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedCategory('financial')}>
                Financial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory('legal')}>
                Legal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory('operational')}>
                Operational
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-lg">{template.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">v{template.version}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCloneTemplate(template)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Clone
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportTemplate(template)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>

                {/* Tags */}
                {template.metadata?.tags && (
                  <div className="flex flex-wrap gap-1">
                    {template.metadata.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                    {template.metadata.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.metadata.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    {template.metadata?.author || 'Unknown'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Updated {formatDate(template.metadata?.updatedAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template.id)}
                    className="flex-1"
                  >
                    <Edit2 className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseTemplate(template.id)}
                    className="flex-1"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    {valuationId ? 'Use for Report' : 'Use Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No templates found</h3>
            <p className="mb-4 text-muted-foreground">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first template.'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Template
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
