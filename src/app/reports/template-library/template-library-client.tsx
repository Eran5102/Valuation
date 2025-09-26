'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FormDialog } from '@/components/ui/modal-patterns'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { toast } from 'sonner'

// Templates will be fetched from the API

export default function TemplateLibraryClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'financial' as TemplateCategory,
    tags: '',
  })

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/report-templates')
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
    const preselectedValuation = searchParams.get('valuationId')
    if (preselectedValuation) {
    }
  }, [searchParams, fetchTemplates])

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateTemplate = async () => {
    try {
      const template = {
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        version: '1.0.0',
        sections: [],
        variables: [],
        metadata: {
          tags: newTemplate.tags.split(',').map((t) => t.trim()),
        },
      }

      const response = await fetch('/api/report-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })

      if (!response.ok) {
        throw new Error('Failed to create template')
      }

      const createdTemplate = await response.json()
      setTemplates([...templates, createdTemplate])
      toast.success('Template created successfully')
      setIsCreateOpen(false)
      setNewTemplate({ name: '', description: '', category: 'financial', tags: '' })
    } catch (error) {
      toast.error('Failed to create template')
    }
  }

  const handleTemplateAction = (action: string, template: ReportTemplate) => {
    const valuationId = searchParams.get('valuationId')

    switch (action) {
      case 'use':
        if (valuationId) {
          router.push(`/reports/generator?valuationId=${valuationId}&templateId=${template.id}`)
        } else {
          router.push(`/reports/generator?templateId=${template.id}`)
        }
        break
      case 'edit':
        router.push(`/reports/template-editor?templateId=${template.id}`)
        break
      case 'preview':
        alert('Preview functionality coming soon')
        break
      case 'duplicate':
        handleDuplicateTemplate(template)
        break
      case 'delete':
        handleDeleteTemplate(template)
        break
    }
  }

  const handleDuplicateTemplate = async (template: ReportTemplate) => {
    try {
      const response = await fetch('/api/report-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', templateId: template.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate template')
      }

      const duplicatedTemplate = await response.json()
      setTemplates([...templates, duplicatedTemplate])
      toast.success('Template duplicated successfully')
    } catch (error) {
      toast.error('Failed to duplicate template')
    }
  }

  const handleDeleteTemplate = async (template: ReportTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/report-templates?id=${template.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      setTemplates(templates.filter((t) => t.id !== template.id))
      toast.success('Template deleted successfully')
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/reports')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Template Library</h1>
              <p className="text-muted-foreground">Browse and manage report templates</p>
            </div>
          </div>
          <FormDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            title="Create Template"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            }
            onSubmit={handleCreateTemplate}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Describe the template"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(value: TemplateCategory) =>
                    setNewTemplate({ ...newTemplate, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={newTemplate.tags}
                  onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                  placeholder="409A, valuation, compliance"
                />
              </div>
            </div>
          </FormDialog>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTemplateAction('use', template)}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Use Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTemplateAction('edit', template)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTemplateAction('preview', template)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleTemplateAction('duplicate', template)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleTemplateAction('delete', template)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-4">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{template.description}</p>
                <div className="mb-4 flex flex-wrap gap-1">
                  {template.metadata?.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="mr-1 h-2 w-2" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    {template.metadata?.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {template.metadata?.updatedAt &&
                      new Date(template.metadata.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateAction('use', template)}
                  >
                    <Building2 className="mr-2 h-3 w-3" />
                    Use
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateAction('edit', template)}
                  >
                    <Edit2 className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first template to get started'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
