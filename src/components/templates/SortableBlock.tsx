'use client'

import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  GripVertical,
  Edit,
  Trash2,
  Type,
  Heading1,
  List,
  Table,
  BarChart3,
  Minus,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  ImageIcon,
  Quote,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Upload,
} from 'lucide-react'
import type { TemplateBlock } from '@/lib/templates/types'

const blockIcons = {
  text: Type,
  header: Heading1,
  paragraph: Type,
  list: List,
  table: Table,
  chart: BarChart3,
  pageBreak: Minus,
  image: ImageIcon,
  separator: AlignCenter,
  quote: Quote,
  dynamicTable: Table,
  breakpointsTable: TrendingUp,
  managementTable: Users,
  valuationSummary: DollarSign,
  dateBlock: Calendar,
}

interface SortableBlockProps {
  block: TemplateBlock
  index: number
  onClick: () => void
  onUpdate: (updates: Partial<TemplateBlock>) => void
  onDelete: () => void
}

export function SortableBlock({ block, index, onClick, onUpdate, onDelete }: SortableBlockProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingContent, setEditingContent] = useState(block.content)
  const [tempListItems, setTempListItems] = useState<string[]>(
    Array.isArray(block.content) ? block.content : ['']
  )
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = blockIcons[block.type] || Type

  const startEditing = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setIsEditing(true)
    setEditingContent(block.content)
    if (Array.isArray(block.content)) {
      setTempListItems(block.content)
    }
  }

  const saveEdit = () => {
    if (block.type === 'list') {
      onUpdate({ content: tempListItems.filter((item) => item.trim() !== '') })
    } else {
      onUpdate({ content: editingContent })
    }
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditingContent(block.content)
    setTempListItems(Array.isArray(block.content) ? block.content : [''])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const addListItem = () => {
    setTempListItems([...tempListItems, ''])
  }

  const removeListItem = (index: number) => {
    setTempListItems(tempListItems.filter((_, i) => i !== index))
  }

  const updateListItem = (index: number, value: string) => {
    const newItems = [...tempListItems]
    newItems[index] = value
    setTempListItems(newItems)
  }

  const handleStyleChange = (property: string, value: any) => {
    onUpdate({
      styling: {
        ...block.styling,
        [property]: value,
      },
    })
  }

  const renderMiniStyleToolbar = () => (
    <div className="flex items-center gap-2 rounded border border-border bg-muted/50 p-2">
      {/* Font Size */}
      <Input
        type="number"
        value={block.styling?.fontSize || ''}
        onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || undefined)}
        placeholder="Size"
        className="h-7 w-16 text-xs"
      />

      {/* Font Weight */}
      <Button
        size="sm"
        variant={block.styling?.fontWeight === 'bold' ? 'default' : 'outline'}
        onClick={() =>
          handleStyleChange('fontWeight', block.styling?.fontWeight === 'bold' ? 'normal' : 'bold')
        }
        className="h-7 w-7 p-0"
      >
        <Bold className="h-3 w-3" />
      </Button>

      <Separator orientation="vertical" className="h-4" />

      {/* Text Alignment */}
      <Button
        size="sm"
        variant={
          block.styling?.textAlign === 'left' || !block.styling?.textAlign ? 'default' : 'outline'
        }
        onClick={() => handleStyleChange('textAlign', 'left')}
        className="h-7 w-7 p-0"
      >
        <AlignLeft className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant={block.styling?.textAlign === 'center' ? 'default' : 'outline'}
        onClick={() => handleStyleChange('textAlign', 'center')}
        className="h-7 w-7 p-0"
      >
        <AlignCenter className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant={block.styling?.textAlign === 'right' ? 'default' : 'outline'}
        onClick={() => handleStyleChange('textAlign', 'right')}
        className="h-7 w-7 p-0"
      >
        <AlignRight className="h-3 w-3" />
      </Button>

      <Separator orientation="vertical" className="h-4" />

      {/* Text Color */}
      <Input
        type="color"
        value={block.styling?.color || '#000000'}
        onChange={(e) => handleStyleChange('color', e.target.value)}
        className="h-7 w-8 cursor-pointer border-0 p-0"
        title="Text Color"
      />

      {/* Background Color */}
      <Input
        type="color"
        value={block.styling?.backgroundColor || '#ffffff'}
        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
        className="h-7 w-8 cursor-pointer border-0 p-0"
        title="Background Color"
      />

      <Separator orientation="vertical" className="h-4" />

      {/* Advanced Options */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onClick()}
        className="h-7 px-2 text-xs"
        title="More styling options"
      >
        <Palette className="mr-1 h-3 w-3" />
        More
      </Button>
    </div>
  )

  const renderBlockContent = () => {
    if (isEditing) {
      switch (block.type) {
        case 'header':
          return (
            <div className="space-y-2">
              <Input
                value={typeof editingContent === 'string' ? editingContent : ''}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter header text..."
                className="text-lg font-bold"
                autoFocus
                style={{
                  fontSize: block.styling?.fontSize || 18,
                  fontWeight: block.styling?.fontWeight || 'bold',
                  textAlign: block.styling?.textAlign || 'left',
                  color: block.styling?.color || '#000000',
                  backgroundColor: block.styling?.backgroundColor || 'transparent',
                }}
              />
              {renderMiniStyleToolbar()}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          )

        case 'paragraph':
          return (
            <div className="space-y-2">
              <Textarea
                value={typeof editingContent === 'string' ? editingContent : ''}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter paragraph content..."
                rows={3}
                autoFocus
                style={{
                  fontSize: block.styling?.fontSize || 14,
                  fontWeight: block.styling?.fontWeight || 'normal',
                  textAlign: block.styling?.textAlign || 'left',
                  color: block.styling?.color || '#000000',
                  backgroundColor: block.styling?.backgroundColor || 'transparent',
                }}
              />
              {renderMiniStyleToolbar()}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          )

        case 'list':
          return (
            <div className="space-y-2">
              {tempListItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem(index, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeListItem(index)}
                    disabled={tempListItems.length === 1}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={addListItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          )

        case 'image':
          const imageContent =
            typeof block.content === 'object'
              ? block.content
              : { src: '', alt: 'Image', caption: '' }
          return (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const updatedContent = {
                          ...imageContent,
                          src: e.target?.result as string,
                          alt: file.name,
                        }
                        setEditingContent(updatedContent)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" title="Upload Image">
                  <Upload className="h-3 w-3" />
                </Button>
              </div>

              <Input
                value={imageContent.alt || ''}
                onChange={(e) => setEditingContent({ ...imageContent, alt: e.target.value })}
                placeholder="Alt text for accessibility"
              />

              <Input
                value={imageContent.caption || ''}
                onChange={(e) => setEditingContent({ ...imageContent, caption: e.target.value })}
                placeholder="Image caption (optional)"
              />

              {imageContent.src && (
                <div className="mt-2 rounded border p-2">
                  <img
                    src={imageContent.src}
                    alt={imageContent.alt}
                    className="h-auto max-h-32 max-w-full object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          )

        default:
          return (
            <div className="space-y-2">
              <Textarea
                value={
                  typeof editingContent === 'string'
                    ? editingContent
                    : JSON.stringify(editingContent, null, 2)
                }
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter content..."
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          )
      }
    }

    // Display mode
    switch (block.type) {
      case 'header':
        return (
          <div
            className="line-clamp-1 cursor-text rounded px-2 py-1 text-lg font-bold text-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
            style={{
              fontSize: block.styling?.fontSize || 18,
              fontWeight: block.styling?.fontWeight || 'bold',
              textAlign: block.styling?.textAlign || 'left',
              color: block.styling?.color || 'inherit',
              backgroundColor: block.styling?.backgroundColor || 'transparent',
              margin: (block.styling as any)?.margin || 'inherit',
              padding: (block.styling as any)?.padding || 'inherit',
            }}
          >
            {typeof block.content === 'string' ? block.content : 'Header Block'}
          </div>
        )

      case 'paragraph':
        return (
          <div
            className="line-clamp-2 cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
            style={{
              fontSize: block.styling?.fontSize || 14,
              fontWeight: block.styling?.fontWeight || 'normal',
              textAlign: block.styling?.textAlign || 'left',
              color: block.styling?.color || 'inherit',
              backgroundColor: block.styling?.backgroundColor || 'transparent',
              margin: (block.styling as any)?.margin || 'inherit',
              padding: (block.styling as any)?.padding || 'inherit',
            }}
          >
            {typeof block.content === 'string' ? block.content : 'Paragraph content'}
          </div>
        )

      case 'list':
        const listItems = Array.isArray(block.content) ? block.content : ['List item']
        return (
          <div
            className="cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            <ul className="list-inside list-disc space-y-1">
              {listItems.slice(0, 3).map((item, i) => (
                <li key={i} className="line-clamp-1">
                  {item}
                </li>
              ))}
              {listItems.length > 3 && (
                <li className="text-xs">... and {listItems.length - 3} more items</li>
              )}
            </ul>
          </div>
        )

      case 'image':
        const imageData =
          typeof block.content === 'object' ? block.content : { src: '', alt: 'Image', caption: '' }
        return (
          <div
            className="cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            {imageData.src ? (
              <div className="text-center">
                <img
                  src={imageData.src}
                  alt={imageData.alt}
                  className="mx-auto h-auto max-h-24 max-w-full rounded border object-contain"
                  style={{
                    maxWidth: (block.styling as any)?.maxWidth || '300px',
                    ...block.styling,
                  }}
                />
                {imageData.caption && (
                  <p className="mt-1 text-xs text-muted-foreground">{imageData.caption}</p>
                )}
              </div>
            ) : (
              <div className="flex h-16 items-center justify-center rounded border-2 border-dashed border-border">
                <div className="text-center">
                  <ImageIcon className="mx-auto mb-1 h-6 w-6 opacity-50" />
                  <p className="text-xs">Click to add image</p>
                </div>
              </div>
            )}
          </div>
        )

      case 'separator':
        return (
          <div
            className="my-4 h-px cursor-pointer bg-border transition-colors hover:bg-muted"
            onClick={startEditing}
            style={block.styling}
          />
        )

      case 'quote':
        return (
          <div
            className="cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
            style={{
              fontStyle: (block.styling as any)?.fontStyle || 'italic',
              borderLeft: (block.styling as any)?.borderLeft || '4px solid #007acc',
              paddingLeft: (block.styling as any)?.paddingLeft || '20px',
              margin: (block.styling as any)?.margin || '20px 0',
              ...block.styling,
            }}
          >
            {typeof block.content === 'string' ? block.content : 'Quote content'}
          </div>
        )

      case 'dynamicTable':
        return (
          <div
            className="cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Table className="mr-2 h-4 w-4" />
              Dynamic Table:{' '}
              {typeof block.content === 'object' ? block.content.dataSource : 'No data source'}
            </div>
          </div>
        )

      case 'breakpointsTable':
        return (
          <div
            className="cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Breakpoints Analysis Table
            </div>
          </div>
        )

      case 'managementTable':
        return (
          <div
            className="cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Management Ownership Table
            </div>
          </div>
        )

      case 'valuationSummary':
        return (
          <div
            className="cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Valuation Summary Block
            </div>
          </div>
        )

      case 'dateBlock':
        return (
          <div
            className="cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Date:{' '}
              {typeof block.content === 'object' ? new Date().toLocaleDateString() : 'Dynamic Date'}
            </div>
          </div>
        )

      case 'table':
        return (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <Table className="mr-2 h-4 w-4" />
              Table with data (use Block Editor for advanced editing)
            </div>
          </div>
        )

      case 'chart':
        return (
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Chart visualization (use Block Editor for configuration)
            </div>
          </div>
        )

      case 'pageBreak':
        return (
          <div className="flex items-center text-sm text-muted-foreground">
            <Minus className="mr-2 h-4 w-4" />
            Page break
          </div>
        )

      default:
        return (
          <div
            className="cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
            onClick={startEditing}
          >
            {typeof block.content === 'string' ? block.content : 'Block content'}
          </div>
        )
    }
  }

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate({
      conditionalDisplay: block.conditionalDisplay
        ? undefined
        : { variable: '', condition: 'exists' },
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this block?')) {
      onDelete()
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isHovered ? 'border-primary/50 shadow-md' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        if (!isEditing) {
          onClick()
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab rounded p-1 transition-colors hover:bg-muted active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Block Icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>

          {/* Block Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {block.type}
              </Badge>
              {block.conditionalDisplay && (
                <Badge variant="outline" className="text-xs">
                  conditional
                </Badge>
              )}
            </div>

            <div className="mb-2">{renderBlockContent()}</div>

            {/* Block ID for debugging */}
            <div className="text-xs text-muted-foreground/50">#{block.id}</div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex items-center gap-1 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleVisibility}
              className="h-8 w-8 p-0"
            >
              {block.conditionalDisplay ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={startEditing}
              className="h-8 w-8 p-0"
              title="Edit inline"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
