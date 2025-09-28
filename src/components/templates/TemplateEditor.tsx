'use client'

import React, { useState, useCallback, lazy, Suspense } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Save,
  Eye,
  Settings,
  Plus,
  Copy,
  FolderPlus,
  Upload,
  MoreHorizontal,
  Edit2,
  Trash2,
  GripVertical,
  Library,
} from 'lucide-react'
import type { ReportTemplate, TemplateBlock, TemplateSection } from '@/lib/templates/types'
import savedBlocksService from '@/lib/templates/savedBlocksService'
import { initialize409ABlocks } from '@/lib/templates/409a-blocks-initializer'
import { TemplatePersistenceService } from '@/lib/templates/templatePersistenceService'

import { BlockLibrary } from './BlockLibrary'
import { TemplateCanvas } from './TemplateCanvas'
import { VariablePicker } from './VariablePicker'
import { SaveBlockModal } from './SaveBlockModal'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

// Lazy load heavy components for better performance
const DraggableFieldPicker = lazy(() =>
  import('./DraggableFieldPicker').then((mod) => ({ default: mod.DraggableFieldPicker }))
)
const SavedBlocksManager = lazy(() =>
  import('./SavedBlocksManager').then((mod) => ({ default: mod.SavedBlocksManager }))
)
const TemplatePreview = lazy(() =>
  import('./TemplatePreview').then((mod) => ({ default: mod.TemplatePreview }))
)
const TemplateSettings = lazy(() =>
  import('./TemplateSettings').then((mod) => ({ default: mod.TemplateSettings }))
)

interface TemplateEditorProps {
  template: ReportTemplate
  onSave: (template: ReportTemplate) => void
  onPreview?: (template: ReportTemplate) => void
  className?: string
}

export function TemplateEditor({ template, onSave, onPreview, className }: TemplateEditorProps) {
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate>(template)
  const [selectedSection, setSelectedSection] = useState<string>(template.sections[0]?.id || '')
  const [activeTab, setActiveTab] = useState<'settings' | 'editor' | 'preview'>('settings')
  const [draggedBlock, setDraggedBlock] = useState<TemplateBlock | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveBlockModalOpen, setSaveBlockModalOpen] = useState(false)
  const [blockToSave, setBlockToSave] = useState<TemplateBlock | null>(null)

  // Check for auto-saved template on mount and initialize 409A blocks
  React.useEffect(() => {
    // Initialize standard 409A blocks (force reset on first load for debugging)
    initialize409ABlocks(true)

    // Load template from database if it has an ID
    if (template.id && template.id !== 'new') {
      TemplatePersistenceService.loadTemplate(template.id)
        .then((loadedTemplate) => {
          if (loadedTemplate) {
            setCurrentTemplate(loadedTemplate)
            setLastSaved(new Date(loadedTemplate.metadata?.updatedAt || new Date()))
          }
        })
        .catch((error) => {
          console.error('Failed to load template:', error)
        })
    }

    // Cleanup on unmount
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [template.id])

  // Dialog states
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [dialogInputValue, setDialogInputValue] = useState('')
  const [currentSectionId, setCurrentSectionId] = useState<string>('')

  const currentSection = currentTemplate.sections.find((s) => s.id === selectedSection)

  const handleSave = useCallback(() => {
    onSave(currentTemplate)
    setIsDirty(false)
  }, [currentTemplate, onSave])

  const handleSaveAs = useCallback(() => {
    setDialogInputValue(`${currentTemplate.name} (Copy)`)
    setShowSaveAsDialog(true)
  }, [currentTemplate.name])

  const handleSaveAsConfirm = useCallback(() => {
    if (dialogInputValue && dialogInputValue.trim()) {
      const newTemplate = {
        ...currentTemplate,
        id: `template_${Date.now()}`,
        name: dialogInputValue.trim(),
        metadata: {
          ...currentTemplate.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
      onSave(newTemplate)
      setCurrentTemplate(newTemplate)
      setIsDirty(false)
      setShowSaveAsDialog(false)
      setDialogInputValue('')
    }
  }, [currentTemplate, onSave, dialogInputValue])

  const handleClone = useCallback(() => {
    setDialogInputValue(`${currentTemplate.name} (Clone)`)
    setShowCloneDialog(true)
  }, [currentTemplate.name])

  const handleCloneConfirm = useCallback(() => {
    if (dialogInputValue && dialogInputValue.trim()) {
      const clonedTemplate = {
        ...currentTemplate,
        id: `template_${Date.now()}`,
        name: dialogInputValue.trim(),
        metadata: {
          ...currentTemplate.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
      onSave(clonedTemplate)
      setShowCloneDialog(false)
      setDialogInputValue('')
      // Template created successfully
    }
  }, [currentTemplate, onSave, dialogInputValue])

  const handleExportTemplate = useCallback(() => {
    const dataStr = JSON.stringify(currentTemplate, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${currentTemplate.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [currentTemplate])

  const handleImportTemplate = useCallback(() => {
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
            setCurrentTemplate(imported)
            setIsDirty(true)
            // Template imported successfully
          } catch (error) {
            console.error('Error importing template:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [])

  const handleTemplateChange = useCallback(
    (updatedTemplate: ReportTemplate) => {
      setCurrentTemplate(updatedTemplate)
      setIsDirty(true)

      // Auto-save with debouncing (5 seconds)
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      const timer = setTimeout(() => {
        // Auto-save to database
        TemplatePersistenceService.autoSaveTemplate(updatedTemplate)
          .then(() => {
            setLastSaved(new Date())
            console.log('Template auto-saved')
          })
          .catch((error) => {
            console.error('Auto-save failed:', error)
          })
      }, 5000)
      setAutoSaveTimer(timer)
    },
    [autoSaveTimer]
  )

  const handleSectionUpdate = useCallback(
    (sectionId: string, updates: Partial<TemplateSection>) => {
      const updatedSections = currentTemplate.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )

      handleTemplateChange({
        ...currentTemplate,
        sections: updatedSections,
      })
    },
    [currentTemplate, handleTemplateChange]
  )

  const handleBlockUpdate = useCallback(
    (sectionId: string, blockId: string, updates: Partial<TemplateBlock>) => {
      const updatedSections = currentTemplate.sections.map((section) => {
        if (section.id !== sectionId) return section

        const updatedBlocks = section.blocks.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block
        )

        return { ...section, blocks: updatedBlocks }
      })

      handleTemplateChange({
        ...currentTemplate,
        sections: updatedSections,
      })
    },
    [currentTemplate, handleTemplateChange]
  )

  const handleBlockAdd = useCallback(
    (sectionId: string, newBlock: TemplateBlock, index?: number) => {
      const updatedSections = currentTemplate.sections.map((section) => {
        if (section.id !== sectionId) return section

        const blocks = [...section.blocks]
        if (index !== undefined) {
          blocks.splice(index, 0, newBlock)
        } else {
          blocks.push(newBlock)
        }

        return { ...section, blocks }
      })

      handleTemplateChange({
        ...currentTemplate,
        sections: updatedSections,
      })
    },
    [currentTemplate, handleTemplateChange]
  )

  const handleBlockDelete = useCallback(
    (sectionId: string, blockId: string) => {
      const updatedSections = currentTemplate.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          blocks: section.blocks.filter((block) => block.id !== blockId),
        }
      })

      handleTemplateChange({
        ...currentTemplate,
        sections: updatedSections,
      })
    },
    [currentTemplate, handleTemplateChange]
  )

  const handleBlockDuplicate = useCallback(
    (sectionId: string, blockId: string) => {
      const updatedSections = currentTemplate.sections.map((section) => {
        if (section.id !== sectionId) return section

        const blockIndex = section.blocks.findIndex((block) => block.id === blockId)
        if (blockIndex === -1) return section

        const originalBlock = section.blocks[blockIndex]
        const duplicatedBlock = {
          ...originalBlock,
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: originalBlock.content,
        }

        const updatedBlocks = [
          ...section.blocks.slice(0, blockIndex + 1),
          duplicatedBlock,
          ...section.blocks.slice(blockIndex + 1),
        ]

        return { ...section, blocks: updatedBlocks }
      })

      handleTemplateChange({
        ...currentTemplate,
        sections: updatedSections,
      })
    },
    [currentTemplate, handleTemplateChange]
  )

  const handleSectionRename = useCallback(
    (sectionId: string) => {
      const section = currentTemplate.sections.find((s) => s.id === sectionId)
      if (!section) return

      setCurrentSectionId(sectionId)
      setDialogInputValue(section.title)
      setShowRenameDialog(true)
    },
    [currentTemplate.sections]
  )

  const handleSectionRenameConfirm = useCallback(() => {
    if (dialogInputValue && dialogInputValue.trim() && currentSectionId) {
      handleSectionUpdate(currentSectionId, { title: dialogInputValue.trim() })
      setShowRenameDialog(false)
      setDialogInputValue('')
      setCurrentSectionId('')
    }
  }, [handleSectionUpdate, dialogInputValue, currentSectionId])

  const handleDialogCancel = useCallback(() => {
    setShowSaveAsDialog(false)
    setShowCloneDialog(false)
    setShowRenameDialog(false)
    setDialogInputValue('')
    setCurrentSectionId('')
  }, [])

  const handleSectionDelete = useCallback(
    (sectionId: string) => {
      if (currentTemplate.sections.length <= 1) {
        console.warn('Cannot delete the last section. Templates must have at least one section.')
        return
      }

      const section = currentTemplate.sections.find((s) => s.id === sectionId)
      if (!section) return

      // For now, just delete directly. In a real app, you might want a confirmation dialog
      const updatedSections = currentTemplate.sections.filter((s) => s.id !== sectionId)

      handleTemplateChange({
        ...currentTemplate,
        sections: updatedSections,
      })

      // If we're deleting the currently selected section, switch to the first remaining one
      if (selectedSection === sectionId) {
        setSelectedSection(updatedSections[0]?.id || '')
      }
    },
    [currentTemplate, handleTemplateChange, selectedSection]
  )

  const handleSectionReorder = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const sections = [...currentTemplate.sections]
      const draggedSection = sections[dragIndex]

      sections.splice(dragIndex, 1)
      sections.splice(hoverIndex, 0, draggedSection)

      handleTemplateChange({
        ...currentTemplate,
        sections,
      })
    },
    [currentTemplate, handleTemplateChange]
  )

  const handleSectionAdd = useCallback(() => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      blocks: [],
      pageBreakBefore: false,
      pageBreakAfter: false,
    }

    handleTemplateChange({
      ...currentTemplate,
      sections: [...currentTemplate.sections, newSection],
    })

    setSelectedSection(newSection.id)
  }, [currentTemplate, handleTemplateChange])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const blockData = active.data.current

    if (blockData?.block) {
      setDraggedBlock(blockData.block)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedBlock(null)

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Get the section ID and index from either drop zones or section drops
    const targetSectionId = overData?.sectionId
    const targetIndex = overData?.index !== undefined ? overData.index : undefined

    if (!targetSectionId) return

    // Handle dropping a new block from the library
    if (activeData?.blockType) {
      const newBlock: TemplateBlock = {
        id: `block_${Date.now()}`,
        type: activeData.blockType,
        content: activeData.defaultContent || '',
        styling: activeData.defaultStyling || {},
      }

      handleBlockAdd(targetSectionId, newBlock, targetIndex)
    }

    // Handle dropping a field from the data fields panel
    if (activeData?.type === 'field' && activeData?.variable) {
      const variable = activeData.variable
      const newBlock: TemplateBlock = {
        id: `block_${Date.now()}_${variable.id}`,
        type: 'paragraph', // Default to paragraph for field blocks
        content: `{{${variable.id}}}`, // Insert the field reference
        styling: {
          fontSize: 14,
          margin: '10px 0',
        },
      }

      handleBlockAdd(targetSectionId, newBlock, targetIndex)
    }

    // Handle reordering existing blocks
    // This would need more complex logic for different sections
  }

  return (
    <div className={`flex h-full flex-col bg-background ${className}`}>
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Template Editor</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Editing: {currentTemplate.name}</span>
              {isDirty && <span className="text-amber-600">• Unsaved changes</span>}
              {lastSaved && (
                <span className="text-green-600">
                  • Auto-saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty}
              className="bg-primary text-primary-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSaveAs}>
                  <Copy className="mr-2 h-4 w-4" />
                  Save As New...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClone}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Clone Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportTemplate}>
                  <Upload className="mr-2 h-4 w-4" />
                  Export Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportTemplate}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="flex h-full flex-col"
        >
          <TabsList className="h-12 w-auto justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Edit2 className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="m-0 flex-1 overflow-hidden p-0">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex h-full overflow-hidden">
                {/* Left Sidebar - Block Library and Saved Blocks */}
                <div className="flex h-full w-64 flex-col overflow-hidden border-r border-border bg-card">
                  <Tabs defaultValue="library" className="flex h-full flex-col">
                    <TabsList className="bg-muted/50 grid w-full grid-cols-2">
                      <TabsTrigger value="library" className="flex items-center gap-2">
                        <Library className="h-3 w-3" />
                        Library
                      </TabsTrigger>
                      <TabsTrigger value="saved" className="flex items-center gap-2">
                        <FolderPlus className="h-3 w-3" />
                        Saved
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="library" className="flex-1 overflow-hidden p-3">
                      <BlockLibrary />
                    </TabsContent>
                    <TabsContent value="saved" className="flex-1 overflow-hidden p-3">
                      <Suspense
                        fallback={
                          <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                              <p className="text-sm text-muted-foreground">
                                Loading saved blocks...
                              </p>
                            </div>
                          </div>
                        }
                      >
                        <SavedBlocksManager
                          currentBlock={null}
                          onBlockSelect={(block) => {
                            if (currentSection) {
                              handleBlockAdd(currentSection.id, block)
                            }
                          }}
                        />
                      </Suspense>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Main Canvas */}
                <div className="bg-muted/20 flex flex-1 flex-col overflow-hidden">
                  {/* Section Tabs */}
                  <div className="border-b border-border bg-background">
                    <div className="flex items-center overflow-x-auto">
                      {currentTemplate.sections.map((section, index) => (
                        <div
                          key={section.id}
                          className={`group flex items-center border-b-2 transition-colors ${
                            selectedSection === section.id ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <button
                            onClick={() => setSelectedSection(section.id)}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${
                              selectedSection === section.id
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {section.title}
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="bottom">
                              <DropdownMenuItem onClick={() => handleSectionRename(section.id)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Rename Section
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSectionDelete(section.id)}
                                className="text-destructive focus:text-destructive"
                                disabled={currentTemplate.sections.length <= 1}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Section
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleSectionReorder(index, Math.max(0, index - 1))}
                                disabled={index === 0}
                              >
                                <GripVertical className="mr-2 h-4 w-4" />
                                Move Up
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSectionReorder(
                                    index,
                                    Math.min(currentTemplate.sections.length - 1, index + 1)
                                  )
                                }
                                disabled={index === currentTemplate.sections.length - 1}
                              >
                                <GripVertical className="mr-2 h-4 w-4" />
                                Move Down
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}

                      <button
                        onClick={handleSectionAdd}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Template Canvas */}
                  <div className="flex-1 overflow-y-auto">
                    {currentSection && (
                      <TemplateCanvas
                        section={currentSection}
                        onBlockSelect={() => {}}
                        onBlockUpdate={(blockId, updates) =>
                          handleBlockUpdate(selectedSection, blockId, updates)
                        }
                        onBlockDelete={(blockId) => handleBlockDelete(selectedSection, blockId)}
                        onBlockDuplicate={(blockId) =>
                          handleBlockDuplicate(selectedSection, blockId)
                        }
                        onSectionUpdate={(updates) => handleSectionUpdate(selectedSection, updates)}
                        onSaveBlockToLibrary={(block) => {
                          setBlockToSave(block)
                          setSaveBlockModalOpen(true)
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Right Sidebar - Data Fields */}
                <div className="h-full w-72 overflow-y-auto border-l border-border bg-card">
                  <div className="p-3">
                    <Suspense
                      fallback={
                        <div className="flex h-64 items-center justify-center">
                          <div className="text-center">
                            <div className="border-3 mx-auto h-6 w-6 animate-spin rounded-full border-primary border-t-transparent" />
                            <p className="mt-2 text-xs text-muted-foreground">Loading fields...</p>
                          </div>
                        </div>
                      }
                    >
                      <DraggableFieldPicker
                        useFieldMappings={true}
                        onFieldSelect={(variable) => {}}
                        className="h-full"
                      />
                    </Suspense>
                  </div>
                </div>
              </div>

              <DragOverlay>
                {draggedBlock && (
                  <div className="rounded border border-border bg-card p-2 opacity-80 shadow-lg">
                    {draggedBlock.type}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="m-0 flex-1 overflow-y-auto p-0">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              }
            >
              <TemplatePreview template={currentTemplate} />
            </Suspense>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto p-4">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading settings...</p>
                  </div>
                </div>
              }
            >
              <TemplateSettings template={currentTemplate} onChange={handleTemplateChange} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save As Dialog */}
      <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Template As New</DialogTitle>
            <DialogDescription>Enter a name for the new template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-name" className="text-right">
                Name
              </Label>
              <Input
                id="template-name"
                value={dialogInputValue}
                onChange={(e) => setDialogInputValue(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveAsConfirm()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    handleDialogCancel()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Template</DialogTitle>
            <DialogDescription>Enter a name for the cloned template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clone-name" className="text-right">
                Name
              </Label>
              <Input
                id="clone-name"
                value={dialogInputValue}
                onChange={(e) => setDialogInputValue(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCloneConfirm()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    handleDialogCancel()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleCloneConfirm}>Clone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Section Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Section</DialogTitle>
            <DialogDescription>Enter a new title for the section.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section-title" className="text-right">
                Title
              </Label>
              <Input
                id="section-title"
                value={dialogInputValue}
                onChange={(e) => setDialogInputValue(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSectionRenameConfirm()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    handleDialogCancel()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleSectionRenameConfirm}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Block Modal */}
      {blockToSave && (
        <SaveBlockModal
          open={saveBlockModalOpen}
          onOpenChange={setSaveBlockModalOpen}
          block={blockToSave}
          onSave={async (name, description, tags) => {
            try {
              await savedBlocksService.saveBlock({
                name,
                category: tags?.[0] || 'Custom',
                description,
                tags: tags || [],
                block: blockToSave,
              })
              setSaveBlockModalOpen(false)
              setBlockToSave(null)
            } catch (error) {
              console.error('Failed to save block:', error)
            }
          }}
        />
      )}
    </div>
  )
}
