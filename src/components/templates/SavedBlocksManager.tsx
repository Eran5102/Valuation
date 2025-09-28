'use client'

import React, { useState, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Bookmark,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Tag,
  Folder,
  MoreVertical,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { TemplateBlock } from '@/lib/templates/types'
import savedBlocksServiceDB, { type SavedBlock } from '@/lib/templates/savedBlocksServiceDB'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { RichTextEditor } from './RichTextEditor'

interface SavedBlocksManagerProps {
  onBlockSelect?: (block: TemplateBlock) => void
  currentBlock?: TemplateBlock | null
  className?: string
}

interface DraggableSavedBlockProps {
  savedBlock: SavedBlock
  onEdit: (block: SavedBlock) => void
  onDelete: (block: SavedBlock) => void
  onDuplicate: (block: SavedBlock) => void
}

function DraggableSavedBlock({
  savedBlock,
  onEdit,
  onDelete,
  onDuplicate,
}: DraggableSavedBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `saved-${savedBlock.id}`,
    data: {
      blockType: savedBlock.block.type,
      defaultContent: savedBlock.block.content,
      defaultStyling: savedBlock.block.styling,
      isSavedBlock: true,
      savedBlockId: savedBlock.id,
    },
  })

  const getBlockTypeIcon = (type: string) => {
    switch (type) {
      case 'header':
        return 'H'
      case 'paragraph':
        return 'P'
      case 'table':
        return 'T'
      case 'list':
        return 'L'
      case 'chart':
        return 'C'
      case 'image':
        return 'I'
      default:
        return 'B'
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'hover:border-primary/50 hover:bg-accent/50 group relative cursor-grab rounded-lg border border-border p-3 transition-all active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-xs font-bold text-primary">
          {getBlockTypeIcon(savedBlock.block.type)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium">{savedBlock.name}</h4>
              {savedBlock.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {savedBlock.description}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="outline" className="px-1 py-0 text-xs">
                  {savedBlock.block.type}
                </Badge>
                {savedBlock.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-1 py-0 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicate(savedBlock)
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(savedBlock)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(savedBlock)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SavedBlocksManager({
  onBlockSelect,
  currentBlock,
  className,
}: SavedBlocksManagerProps) {
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingBlock, setEditingBlock] = useState<SavedBlock | null>(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [categoryAction, setCategoryAction] = useState<'create' | 'rename' | 'delete'>('create')
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')

  // Delete confirmation states
  const [deleteBlockConfirmOpen, setDeleteBlockConfirmOpen] = useState(false)
  const [blockToDelete, setBlockToDelete] = useState<SavedBlock | null>(null)
  const [deleteCategoryConfirmOpen, setDeleteCategoryConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  // Form states
  const [blockName, setBlockName] = useState('')
  const [blockDescription, setBlockDescription] = useState('')
  const [blockCategory, setBlockCategory] = useState('')
  const [blockTags, setBlockTags] = useState('')
  const [blockContent, setBlockContent] = useState('')

  useEffect(() => {
    loadSavedBlocks()
  }, [])

  const loadSavedBlocks = async () => {
    setIsLoading(true)
    try {
      // Initialize the service (will fetch from database or localStorage)
      await savedBlocksServiceDB.initialize()

      // Create default blocks if none exist
      await savedBlocksServiceDB.createDefaultBlocks()

      const blocks = await savedBlocksServiceDB.getSavedBlocks()
      setSavedBlocks(blocks)

      const cats = await savedBlocksServiceDB.getCategories()
      setCategories(cats)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCurrentBlock = async () => {
    if (!currentBlock || !blockName.trim()) return

    try {
      const newBlock = await savedBlocksServiceDB.saveBlock({
        name: blockName.trim(),
        description: blockDescription.trim(),
        category: blockCategory || 'Uncategorized',
        tags: blockTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        block: currentBlock,
      })

      setSavedBlocks((prev) => [newBlock, ...prev])

      // Update categories if new
      if (!categories.includes(newBlock.category)) {
        setCategories((prev) => [...prev, newBlock.category].sort())
      }

      // Reset form
      setShowSaveDialog(false)
      setBlockName('')
      setBlockDescription('')
      setBlockCategory('')
      setBlockTags('')
    } catch (error) {}
  }

  const handleEditBlock = async () => {
    if (!editingBlock || !blockName.trim()) return

    try {
      const updatedBlock = {
        ...editingBlock.block,
        content: blockContent,
      }

      const updated = await savedBlocksServiceDB.updateBlock(editingBlock.id, {
        name: blockName.trim(),
        description: blockDescription.trim(),
        category: blockCategory || 'Uncategorized',
        tags: blockTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        block: updatedBlock,
      })

      if (updated) {
        setSavedBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
        await loadSavedBlocks() // Reload to update categories
      }

      setShowEditDialog(false)
      setEditingBlock(null)
      resetForm()
    } catch (error) {}
  }

  const handleDeleteBlock = (block: SavedBlock) => {
    setBlockToDelete(block)
    setDeleteBlockConfirmOpen(true)
  }

  const confirmDeleteBlock = async () => {
    if (!blockToDelete) return

    try {
      const deleted = await savedBlocksServiceDB.deleteBlock(blockToDelete.id)
      if (deleted) {
        setSavedBlocks((prev) => prev.filter((b) => b.id !== blockToDelete.id))
      }
    } catch (error) {
    } finally {
      setDeleteBlockConfirmOpen(false)
      setBlockToDelete(null)
    }
  }

  const handleDuplicateBlock = async (block: SavedBlock) => {
    try {
      const duplicated = await savedBlocksServiceDB.saveBlock({
        name: `${block.name} (Copy)`,
        description: block.description,
        category: block.category,
        tags: block.tags,
        block: { ...block.block, id: `block_${Date.now()}` },
      })

      setSavedBlocks((prev) => [duplicated, ...prev])
    } catch (error) {}
  }

  const openEditDialog = (block: SavedBlock) => {
    setEditingBlock(block)
    setBlockName(block.name)
    setBlockDescription(block.description || '')
    setBlockCategory(block.category)
    setBlockTags(block.tags.join(', '))
    // Keep content as-is for proper editing
    setBlockContent(
      typeof block.block.content === 'string' ? block.block.content : block.block.content
    )
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setBlockName('')
    setBlockDescription('')
    setBlockCategory('')
    setBlockTags('')
    setBlockContent('')
  }

  // Category management functions
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    const categoryExists = categories.includes(newCategoryName.trim())
    if (categoryExists) {
      console.log('Category already exists')
      return
    }

    setCategories((prev) => [...prev, newCategoryName.trim()].sort())
    setShowCategoryDialog(false)
    setNewCategoryName('')
  }

  const handleRenameCategory = async () => {
    if (!newCategoryName.trim() || !selectedCategoryForAction) return

    // Update all blocks with the old category name
    const blocksToUpdate = savedBlocks.filter(
      (block) => block.category === selectedCategoryForAction
    )

    for (const block of blocksToUpdate) {
      await savedBlocksServiceDB.updateBlock(block.id, {
        ...block,
        category: newCategoryName.trim(),
      })
    }

    // Reload blocks and categories
    await loadSavedBlocks()

    setShowCategoryDialog(false)
    setNewCategoryName('')
    setSelectedCategoryForAction('')
  }

  const handleDeleteCategory = () => {
    if (!selectedCategoryForAction) return
    setCategoryToDelete(selectedCategoryForAction)
    setDeleteCategoryConfirmOpen(true)
  }

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return

    // Move blocks to Uncategorized
    const blocksToUpdate = savedBlocks.filter((block) => block.category === categoryToDelete)

    for (const block of blocksToUpdate) {
      await savedBlocksServiceDB.updateBlock(block.id, {
        ...block,
        category: 'Uncategorized',
      })
    }

    // Reload blocks and categories
    await loadSavedBlocks()

    setShowCategoryDialog(false)
    setSelectedCategoryForAction('')
    setDeleteCategoryConfirmOpen(false)
    setCategoryToDelete(null)
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Filter blocks
  const filteredBlocks = savedBlocks.filter((block) => {
    const matchesSearch =
      !searchTerm ||
      block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group blocks by category
  const groupedBlocks = filteredBlocks.reduce(
    (acc, block) => {
      const category = block.category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(block)
      return acc
    },
    {} as Record<string, SavedBlock[]>
  )

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved Blocks
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCategoryAction('create')
                      setNewCategoryName('')
                      setShowCategoryDialog(true)
                    }}
                  >
                    <Folder className="h-4 w-4" />
                    <Plus className="ml-1 h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage Categories</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {currentBlock && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBlockCategory(categories[0] || 'Uncategorized')
                  setShowSaveDialog(true)
                }}
              >
                <Save className="mr-2 h-3 w-3" />
                Save Current
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-hidden p-3">
        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved blocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Saved Blocks List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading saved blocks...</div>
          ) : Object.keys(groupedBlocks).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bookmark className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No saved blocks found</p>
              {searchTerm && <p className="mt-1 text-xs">Try adjusting your search</p>}
            </div>
          ) : (
            Object.entries(groupedBlocks).map(([category, blocks]) => (
              <div key={category}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex flex-1 items-center gap-2 rounded-md p-2 text-left text-sm font-medium transition-colors hover:bg-accent"
                  >
                    {expandedCategories.has(category) || searchTerm !== '' ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder className="h-4 w-4" />
                    <span className="flex-1">{category}</span>
                    {blocks.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {blocks.length}
                      </Badge>
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setCategoryAction('rename')
                          setSelectedCategoryForAction(category)
                          setNewCategoryName(category)
                          setShowCategoryDialog(true)
                        }}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      {category !== 'Uncategorized' && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setCategoryAction('delete')
                            setSelectedCategoryForAction(category)
                            setShowCategoryDialog(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {(expandedCategories.has(category) || searchTerm !== '') && (
                  <div className="mt-1 space-y-2 pl-6">
                    {blocks.map((block) => (
                      <DraggableSavedBlock
                        key={block.id}
                        savedBlock={block}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteBlock}
                        onDuplicate={handleDuplicateBlock}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Block as Template</DialogTitle>
            <DialogDescription>Save this block for reuse in other templates</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="block-name">Name *</Label>
              <Input
                id="block-name"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="e.g., Executive Summary Header"
              />
            </div>

            <div>
              <Label htmlFor="block-description">Description</Label>
              <Textarea
                id="block-description"
                value={blockDescription}
                onChange={(e) => setBlockDescription(e.target.value)}
                placeholder="Describe what this block is for..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="block-category">Category</Label>
              <Select value={blockCategory} onValueChange={setBlockCategory}>
                <SelectTrigger id="block-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ New Category...</SelectItem>
                </SelectContent>
              </Select>
              {blockCategory === 'new' && (
                <Input
                  className="mt-2"
                  placeholder="Enter new category name"
                  onChange={(e) => setBlockCategory(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label htmlFor="block-tags">Tags</Label>
              <Input
                id="block-tags"
                value={blockTags}
                onChange={(e) => setBlockTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
              <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCurrentBlock} disabled={!blockName.trim()}>
              Save Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Saved Block</DialogTitle>
            <DialogDescription>Update the saved block details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="Block name"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={blockDescription}
                onChange={(e) => setBlockDescription(e.target.value)}
                placeholder="Block description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={blockCategory} onValueChange={setBlockCategory}>
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-tags">Tags</Label>
              <Input
                id="edit-tags"
                value={blockTags}
                onChange={(e) => setBlockTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Content</Label>
              <div className="mt-1 rounded-md border">
                {editingBlock && (
                  <RichTextEditor
                    value={blockContent}
                    onChange={setBlockContent}
                    placeholder="Edit block content... Use variables like {{company.name}}"
                  />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                You can use template variables like {`{{company.name}}`} in the content
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBlock} disabled={!blockName.trim()}>
              Update Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoryAction === 'create' && 'Create New Category'}
              {categoryAction === 'rename' && `Rename Category "${selectedCategoryForAction}"`}
              {categoryAction === 'delete' && `Delete Category "${selectedCategoryForAction}"`}
            </DialogTitle>
            <DialogDescription>
              {categoryAction === 'create' && 'Add a new category to organize your saved blocks'}
              {categoryAction === 'rename' && 'Enter a new name for this category'}
              {categoryAction === 'delete' &&
                'Blocks in this category will be moved to "Uncategorized"'}
            </DialogDescription>
          </DialogHeader>

          {categoryAction !== 'delete' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">
                  {categoryAction === 'create' ? 'Category Name' : 'New Name'} *
                </Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false)
                setNewCategoryName('')
                setSelectedCategoryForAction('')
              }}
            >
              Cancel
            </Button>
            {categoryAction === 'create' && (
              <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Create Category
              </Button>
            )}
            {categoryAction === 'rename' && (
              <Button onClick={handleRenameCategory} disabled={!newCategoryName.trim()}>
                Rename Category
              </Button>
            )}
            {categoryAction === 'delete' && (
              <Button variant="destructive" onClick={handleDeleteCategory}>
                Delete Category
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Block Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteBlockConfirmOpen}
        onOpenChange={setDeleteBlockConfirmOpen}
        title="Delete Block"
        description={`Are you sure you want to delete "${blockToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteBlock}
        icon="delete"
      />

      {/* Delete Category Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteCategoryConfirmOpen}
        onOpenChange={setDeleteCategoryConfirmOpen}
        title="Delete Category"
        description={`Delete category "${categoryToDelete}"? Blocks will be moved to "Uncategorized".`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteCategory}
        icon="delete"
      />
    </Card>
  )
}
