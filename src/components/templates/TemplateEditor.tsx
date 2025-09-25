'use client'

import React, { useState, useCallback } from 'react'
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
} from 'lucide-react'
import type { ReportTemplate, TemplateBlock, TemplateSection } from '@/lib/templates/types'

import { BlockLibrary } from './BlockLibrary'
import { TemplateCanvas } from './TemplateCanvas'
import { BlockEditor } from './BlockEditor'
import { VariablePicker } from './VariablePicker'
import { EnhancedFieldPicker } from './EnhancedFieldPicker'
import { SavedBlocksManager } from './SavedBlocksManager'
import { TemplatePreview } from './TemplatePreview'
import { TemplateSettings } from './TemplateSettings'

interface TemplateEditorProps {
  template: ReportTemplate
  onSave: (template: ReportTemplate) => void
  onPreview?: (template: ReportTemplate) => void
  className?: string
}

export function TemplateEditor({ template, onSave, onPreview, className }: TemplateEditorProps) {
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate>(template)
  const [selectedSection, setSelectedSection] = useState<string>(template.sections[0]?.id || '')
  const [selectedBlock, setSelectedBlock] = useState<TemplateBlock | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'settings'>('editor')
  const [draggedBlock, setDraggedBlock] = useState<TemplateBlock | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Check for auto-saved template on mount
  React.useEffect(() => {
    try {
      const autosaved = localStorage.getItem('template_autosave')
      const autosaveTime = localStorage.getItem('template_autosave_time')

      if (autosaved && autosaveTime) {
        const savedTemplate = JSON.parse(autosaved)
        const savedTime = new Date(autosaveTime)
        const timeDiff = Date.now() - savedTime.getTime()

        // If auto-save is less than 24 hours old and different from current
        if (timeDiff < 24 * 60 * 60 * 1000 && savedTemplate.id === template.id) {
          if (
            confirm(
              `Found an auto-saved version from ${savedTime.toLocaleString()}. Would you like to restore it?`
            )
          ) {
            setCurrentTemplate(savedTemplate)
            setLastSaved(savedTime)
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore auto-saved template:', error)
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
      // Show success message in a less intrusive way
      console.log(`Template "${dialogInputValue}" has been created successfully!`)
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
            console.log('Template imported successfully!')
          } catch (error) {
            console.error('Error importing template. Please check the file format.')
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
        // Store in localStorage as backup
        try {
          localStorage.setItem('template_autosave', JSON.stringify(updatedTemplate))
          const now = new Date()
          localStorage.setItem('template_autosave_time', now.toISOString())
          setLastSaved(now)
        } catch (error) {
          console.error('Failed to auto-save template:', error)
        }
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

    // Handle dropping a new block from the library
    if (activeData?.blockType && overData?.sectionId) {
      const newBlock: TemplateBlock = {
        id: `block_${Date.now()}`,
        type: activeData.blockType,
        content: activeData.defaultContent || '',
        styling: activeData.defaultStyling || {},
      }

      handleBlockAdd(overData.sectionId, newBlock, overData.index)
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
              variant="outline"
              size="sm"
              onClick={() => onPreview?.(currentTemplate)}
              disabled={!onPreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                  <Plus className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSave} disabled={!isDirty}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </DropdownMenuItem>
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

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty}
              className="bg-primary text-primary-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
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
          <TabsList className="rounded-none border-b border-border">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
          <TabsContent value="editor" className="m-0 flex-1 overflow-hidden p-0">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex h-full overflow-hidden">
                {/* Left Sidebar - Block Library and Saved Blocks */}
                <div className="bg-card/50 flex h-full w-64 flex-col overflow-hidden border-r border-border">
                  <Tabs defaultValue="library" className="flex h-full flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="library">Library</TabsTrigger>
                      <TabsTrigger value="saved">Saved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="library" className="flex-1 overflow-hidden p-3">
                      <BlockLibrary />
                    </TabsContent>
                    <TabsContent value="saved" className="flex-1 overflow-hidden p-3">
                      <SavedBlocksManager
                        currentBlock={selectedBlock}
                        onBlockSelect={(block) => {
                          if (currentSection) {
                            handleBlockAdd(currentSection.id, block)
                          }
                        }}
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="flex-shrink-0 border-t border-border">
                    <EnhancedFieldPicker
                      variables={currentTemplate.variables}
                      onFieldSelect={(variable) => {
                        // Copy field reference to clipboard
                        navigator.clipboard.writeText(`{{${variable.id}}}`)
                        console.log('Field copied:', variable)
                      }}
                      className="h-64"
                    />
                  </div>
                </div>

                {/* Main Canvas */}
                <div className="flex flex-1 flex-col overflow-hidden">
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
                        onBlockSelect={setSelectedBlock}
                        onBlockUpdate={(blockId, updates) =>
                          handleBlockUpdate(selectedSection, blockId, updates)
                        }
                        onBlockDelete={(blockId) => handleBlockDelete(selectedSection, blockId)}
                        onSectionUpdate={(updates) => handleSectionUpdate(selectedSection, updates)}
                      />
                    )}
                  </div>
                </div>

                {/* Right Sidebar - Block Editor */}
                <div className="bg-card/50 h-full w-72 overflow-y-auto border-l border-border">
                  <div className="p-3">
                    {selectedBlock ? (
                      <BlockEditor
                        block={selectedBlock}
                        variables={currentTemplate.variables}
                        onChange={(updates) => {
                          if (selectedBlock) {
                            handleBlockUpdate(selectedSection, selectedBlock.id, updates)
                            setSelectedBlock({ ...selectedBlock, ...updates })
                          }
                        }}
                      />
                    ) : (
                      <div className="py-6 text-center text-muted-foreground">
                        <Settings className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        <p className="text-sm">Select a block to edit its properties</p>
                      </div>
                    )}
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
            <TemplatePreview template={currentTemplate} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto p-4">
            <TemplateSettings template={currentTemplate} onChange={handleTemplateChange} />
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
    </div>
  )
}
