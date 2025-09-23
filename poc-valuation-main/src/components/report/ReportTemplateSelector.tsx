import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Save, Plus, Info, Upload, Trash, Edit, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface TemplateContent {
  id: string
  name: string
  description: string
  content: string
  lastModified?: string
  isDefault?: boolean
  valuationType?: string // New field for valuation type
}

export const VALUATION_TYPES = [
  { label: 'DCF Analysis', value: 'dcf' },
  { label: 'Market Approach', value: 'market' },
  { label: 'Cost Approach', value: 'cost' },
  { label: 'Income Approach', value: 'income' },
  { label: 'Executive Summary', value: 'summary' },
  { label: 'Full Report', value: 'full' },
  { label: 'Other', value: 'other' },
]

interface ReportTemplateSelectorProps {
  templates: TemplateContent[]
  selectedTemplateId: string | null
  onTemplateSelect: (templateId: string) => void
  onSaveAsTemplate: () => void
  currentContent: string
  onTemplatesChange?: (templates: TemplateContent[]) => void // New callback for template changes
  onUploadTemplate?: (htmlContent: string) => void // New callback for uploaded templates
}

export function ReportTemplateSelector({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onSaveAsTemplate,
  currentContent,
  onTemplatesChange,
  onUploadTemplate,
}: ReportTemplateSelectorProps) {
  // State for template management dialogs
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [tempTemplateData, setTempTemplateData] = useState<Partial<TemplateContent>>({})
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileUploadError, setFileUploadError] = useState<string | null>(null)

  // Filter templates by valuation type
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredTemplates =
    typeFilter === 'all' ? templates : templates.filter((t) => t.valuationType === typeFilter)

  const handleSaveAsTemplate = () => {
    if (!currentContent.trim()) {
      toast.error('Cannot save an empty template')
      return
    }

    onSaveAsTemplate()
  }

  const handleTemplateChange = (value: string) => {
    // Directly call the parent handler to ensure template content is loaded
    onTemplateSelect(value)
  }

  // Find the currently selected template
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  // Ensure visual feedback when template is selected
  useEffect(() => {
    if (selectedTemplateId) {
      const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
      if (selectedTemplate) {
        toast.success(`Template "${selectedTemplate.name}" selected`)
      }
    }
  }, [selectedTemplateId, templates])

  // Function to update template properties
  const handleTemplateEdit = () => {
    if (!tempTemplateData.id) return

    const updatedTemplates = templates.map((template) => {
      if (template.id === tempTemplateData.id) {
        return {
          ...template,
          name: tempTemplateData.name || template.name,
          description: tempTemplateData.description || template.description,
          valuationType: tempTemplateData.valuationType || template.valuationType,
          lastModified: new Date().toISOString(),
        }
      }
      return template
    })

    if (onTemplatesChange) {
      onTemplatesChange(updatedTemplates)
    }

    setShowEditDialog(false)
    toast.success('Template updated successfully')
  }

  // Function to delete a template
  const handleTemplateDelete = () => {
    if (!tempTemplateData.id) return

    // Check if we're deleting the currently selected template
    if (selectedTemplateId === tempTemplateData.id) {
      onTemplateSelect('') // Clear selection
    }

    const updatedTemplates = templates.filter((template) => template.id !== tempTemplateData.id)
    if (onTemplatesChange) {
      onTemplatesChange(updatedTemplates)
    }

    setShowDeleteDialog(false)
    toast.success('Template deleted successfully')
  }

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null)
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.name.endsWith('.html') && !file.name.endsWith('.txt')) {
      setFileUploadError('Only HTML and TXT files are supported')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setFileContent(content)

      // Try to extract a title from the content
      const titleMatch =
        content.match(/<title>(.*?)<\/title>/i) || content.match(/<h1[^>]*>(.*?)<\/h1>/i)
      if (titleMatch && titleMatch[1]) {
        setTempTemplateData((prev) => ({ ...prev, name: titleMatch[1].trim() }))
      } else {
        setTempTemplateData((prev) => ({ ...prev, name: file.name.replace(/\.(html|txt)$/, '') }))
      }
    }
    reader.onerror = () => {
      setFileUploadError('Failed to read file')
    }
    reader.readAsText(file)
  }

  // Handle template upload
  const handleUploadTemplate = () => {
    if (!fileContent || !tempTemplateData.name) {
      toast.error('Missing template content or name')
      return
    }

    if (onUploadTemplate) {
      onUploadTemplate(fileContent)
    }

    setShowUploadDialog(false)
    setFileContent(null)
    setTempTemplateData({})
  }

  // Function to open the edit dialog
  const openEditDialog = (template: TemplateContent) => {
    if (template.isDefault) {
      toast.error('Default templates cannot be modified')
      return
    }

    setTempTemplateData({
      id: template.id,
      name: template.name,
      description: template.description,
      valuationType: template.valuationType,
    })
    setShowEditDialog(true)
  }

  // Function to open the delete dialog
  const openDeleteDialog = (template: TemplateContent) => {
    if (template.isDefault) {
      toast.error('Default templates cannot be deleted')
      return
    }

    setTempTemplateData({
      id: template.id,
      name: template.name,
    })
    setShowDeleteDialog(true)
  }

  // For the sections with tooltips, make sure they have the right structure:
  const renderDefaultTemplateTooltip = () => (
    <TooltipProvider>
      <Tooltip content="This is a built-in template that includes standard sections and dynamic content.">
        <div className="flex items-center text-xs text-muted-foreground">
          <Info className="mr-1 h-3.5 w-3.5" />
          <span>Default template</span>
        </div>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            Templates
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" /> New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSaveAsTemplate}>
                  <Save className="mr-2 h-4 w-4" /> Save Current Layout
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Upload Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Filter Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {VALUATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Select Template</label>
              <Select value={selectedTemplateId || ''} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.length === 0 ? (
                    <div className="p-2 text-sm italic text-muted-foreground">
                      No templates found
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault && (
                          <span className="ml-2 rounded bg-muted px-1 py-0.5 text-xs">Default</span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTemplate && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium">{selectedTemplate.name}</h3>
                  {selectedTemplate.valuationType && (
                    <Badge variant="outline" className="mt-1">
                      {VALUATION_TYPES.find((t) => t.value === selectedTemplate.valuationType)
                        ?.label || selectedTemplate.valuationType}
                    </Badge>
                  )}
                </div>

                {!selectedTemplate.isDefault && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(selectedTemplate)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(selectedTemplate)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>

              {selectedTemplate.lastModified && (
                <p className="text-xs text-muted-foreground">
                  Last modified: {new Date(selectedTemplate.lastModified).toLocaleDateString()}
                </p>
              )}

              {selectedTemplate.isDefault && renderDefaultTemplateTooltip()}
            </div>
          )}

          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Templates include both layout and dynamic content elements. Save your current report
              as a template or upload HTML documents to create new templates.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update the details of your template</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={tempTemplateData.name || ''}
                onChange={(e) => setTempTemplateData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Template name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={tempTemplateData.description || ''}
                onChange={(e) =>
                  setTempTemplateData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of this template"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valuation Type</label>
              <Select
                value={tempTemplateData.valuationType || ''}
                onValueChange={(value) =>
                  setTempTemplateData((prev) => ({ ...prev, valuationType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTemplateEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="font-medium">{tempTemplateData.name}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleTemplateDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Template Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Template</DialogTitle>
            <DialogDescription>
              Upload an HTML or text document to use as a template
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <div className="flex w-full items-center justify-center">
                <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 hover:bg-muted/80">
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">HTML or TXT files only</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".html,.txt"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {fileUploadError && <p className="text-sm text-destructive">{fileUploadError}</p>}

              {fileContent && (
                <div className="mt-4 space-y-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template Name</label>
                    <Input
                      value={tempTemplateData.name || ''}
                      onChange={(e) =>
                        setTempTemplateData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Template name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={tempTemplateData.description || ''}
                      onChange={(e) =>
                        setTempTemplateData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Brief description"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valuation Type</label>
                    <Select
                      value={tempTemplateData.valuationType || ''}
                      onValueChange={(value) =>
                        setTempTemplateData((prev) => ({ ...prev, valuationType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preview</label>
                    <div className="rounded-md border p-2">
                      <ScrollArea className="h-[200px] w-full">
                        <div className="p-2 text-sm">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: fileContent.substring(0, 500) + '...',
                            }}
                          />
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false)
                setFileContent(null)
                setTempTemplateData({})
                setFileUploadError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadTemplate}
              disabled={!fileContent || !tempTemplateData.name}
            >
              Upload Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
