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
  Copy,
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
  Bookmark,
  FileUp,
  FileDown,
  Folder,
  BookOpen,
  Book,
  PenTool,
  FileText,
  Calculator,
} from 'lucide-react'
import type { TemplateBlock } from '@/lib/templates/types'
import { LightweightTableEditor } from './LightweightTableEditor'
import { RichTextEditor } from './RichTextEditor'
import { getBlockEditMode, getBlockDisplayMode } from './block-editors/BlockVisualEditors'

const blockIcons = {
  text: Type,
  header: FileUp,
  footer: FileDown,
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
  footnote: Bookmark,
  tableOfContents: List,
  coverPage: FileText,
  executiveSummary: FileText,
  appendix: Folder,
  bibliography: BookOpen,
  glossary: Book,
  signatureBlock: PenTool,
  capitalStructureTable: Table,
}

interface SortableBlockProps {
  block: TemplateBlock
  index: number
  onClick: () => void
  onUpdate: (updates: Partial<TemplateBlock>) => void
  onDelete: () => void
  onDuplicate?: () => void
  onSaveToLibrary?: (block: TemplateBlock) => void
}

export function SortableBlock({
  block,
  index,
  onClick,
  onUpdate,
  onDelete,
  onDuplicate,
  onSaveToLibrary,
}: SortableBlockProps) {
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
    <div className="bg-muted/50 flex flex-wrap items-center gap-2 rounded border border-border p-2">
      {/* Font Size */}
      <Input
        type="number"
        value={block.styling?.fontSize || ''}
        onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || undefined)}
        placeholder="Size"
        className="h-7 w-16 text-xs"
        title="Font size"
      />

      {/* Font Weight - Only show for non-text blocks since text blocks use RichTextEditor */}
      {block.type !== 'paragraph' && block.type !== 'header' && block.type !== 'text' && (
        <>
          <Button
            size="sm"
            variant={block.styling?.fontWeight === 'bold' ? 'default' : 'outline'}
            onClick={() =>
              handleStyleChange(
                'fontWeight',
                block.styling?.fontWeight === 'bold' ? 'normal' : 'bold'
              )
            }
            className="h-7 w-7 p-0"
            title="Bold (applies to entire block)"
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Separator orientation="vertical" className="h-4" />
        </>
      )}

      {/* Alignment controls remain for all blocks */}

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

      {/* Margins */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Margin:</span>
        <Input
          type="text"
          value={(block.styling as any)?.margin || ''}
          onChange={(e) => handleStyleChange('margin', e.target.value)}
          placeholder="10px 0"
          className="h-7 w-20 text-xs"
          title="Margin (e.g., 10px or 10px 20px)"
        />
      </div>

      {/* Padding */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Padding:</span>
        <Input
          type="text"
          value={(block.styling as any)?.padding || ''}
          onChange={(e) => handleStyleChange('padding', e.target.value)}
          placeholder="5px"
          className="h-7 w-20 text-xs"
          title="Padding (e.g., 5px or 5px 10px)"
        />
      </div>
    </div>
  )

  const renderBlockContent = () => {
    if (isEditing) {
      switch (block.type) {
        case 'header':
          const headerData =
            typeof editingContent === 'object'
              ? editingContent
              : {
                  logoUrl: '',
                  companyName: '{{company.name}}',
                  reportTitle: '409A Valuation Report',
                  showDate: true,
                }
          return (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium">Logo URL or Upload</label>
                <div className="flex gap-2">
                  <Input
                    value={headerData.logoUrl || ''}
                    onChange={(e) => setEditingContent({ ...headerData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png or upload"
                  />
                  <Button size="sm" variant="outline" title="Upload Logo">
                    <Upload className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Company Name</label>
                <Input
                  value={headerData.companyName || ''}
                  onChange={(e) =>
                    setEditingContent({ ...headerData, companyName: e.target.value })
                  }
                  placeholder="{{company.name}}"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Report Title</label>
                <Input
                  value={headerData.reportTitle || ''}
                  onChange={(e) =>
                    setEditingContent({ ...headerData, reportTitle: e.target.value })
                  }
                  placeholder="409A Valuation Report"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={headerData.showDate || false}
                  onChange={(e) => setEditingContent({ ...headerData, showDate: e.target.checked })}
                />
                <label className="text-xs">Show Date</label>
              </div>
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

        case 'footer':
          const footerData =
            typeof editingContent === 'object'
              ? editingContent
              : {
                  leftContent: '{{company.name}} - {{report.name}}',
                  centerContent: 'Page {{page}} of {{totalPages}}',
                  rightContent: '{{report.date}}',
                  showConfidentiality: true,
                  confidentialityText: 'CONFIDENTIAL - PROPRIETARY INFORMATION',
                }
          return (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium">Left Content</label>
                <Input
                  value={footerData.leftContent || ''}
                  onChange={(e) =>
                    setEditingContent({ ...footerData, leftContent: e.target.value })
                  }
                  placeholder="{{company.name}} - {{report.name}}"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Center Content (Page Numbers)</label>
                <Input
                  value={footerData.centerContent || ''}
                  onChange={(e) =>
                    setEditingContent({ ...footerData, centerContent: e.target.value })
                  }
                  placeholder="Page {{page}} of {{totalPages}}"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Right Content</label>
                <Input
                  value={footerData.rightContent || ''}
                  onChange={(e) =>
                    setEditingContent({ ...footerData, rightContent: e.target.value })
                  }
                  placeholder="{{report.date}}"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={footerData.showConfidentiality || false}
                  onChange={(e) =>
                    setEditingContent({ ...footerData, showConfidentiality: e.target.checked })
                  }
                />
                <label className="text-xs">Show Confidentiality Notice</label>
              </div>
              {footerData.showConfidentiality && (
                <div>
                  <label className="text-xs font-medium">Confidentiality Text</label>
                  <Input
                    value={footerData.confidentialityText || ''}
                    onChange={(e) =>
                      setEditingContent({ ...footerData, confidentialityText: e.target.value })
                    }
                    placeholder="CONFIDENTIAL - PROPRIETARY INFORMATION"
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

        case 'paragraph':
          return (
            <div className="space-y-2">
              <RichTextEditor
                value={typeof editingContent === 'string' ? editingContent : ''}
                onChange={(value) => setEditingContent(value)}
                placeholder="Enter paragraph content..."
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

        case 'table':
          return (
            <div className="space-y-2">
              <LightweightTableEditor
                value={editingContent}
                onChange={(value) => setEditingContent(value)}
                variables={[]} // You can pass variables here if needed
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

        default:
          // Use the visual editor for all other block types
          return getBlockEditMode({
            block,
            editingContent,
            setEditingContent,
            saveEdit,
            cancelEdit,
            handleKeyDown,
            tempListItems,
            setTempListItems,
            updateTempListItem: updateListItem,
            addTempListItem: addListItem,
            removeTempListItem: removeListItem,
          })
      }
    }

    // Display mode
    switch (block.type) {
      case 'header':
        const headerContent =
          typeof block.content === 'object'
            ? block.content
            : {
                logoUrl: '',
                companyName: 'Company Name',
                reportTitle: 'Report Title',
                showDate: true,
              }
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded border border-dashed border-border px-3 py-2 transition-colors"
            onClick={startEditing}
            style={block.styling}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {headerContent.logoUrl && (
                  <img src={headerContent.logoUrl} alt="Logo" className="h-8 w-auto" />
                )}
                <div>
                  <div className="font-semibold">{headerContent.companyName || 'Company'}</div>
                  <div className="text-xs text-muted-foreground">
                    {headerContent.reportTitle || 'Report'}
                  </div>
                </div>
              </div>
              {headerContent.showDate && (
                <div className="text-xs text-muted-foreground">Date: {'{{report.date}}'}</div>
              )}
            </div>
          </div>
        )

      case 'paragraph':
        return (
          <div
            className="hover:bg-muted/30 line-clamp-2 cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
            className="hover:bg-muted/30 cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
            className="hover:bg-muted/30 cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Breakpoints Analysis Table
            </div>
          </div>
        )

      case 'capitalStructureTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Table className="mr-2 h-4 w-4" />
              Capital Structure Table
            </div>
          </div>
        )

      case 'rightsPreferencesTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Table className="mr-2 h-4 w-4" />
              Rights & Preferences Table
            </div>
          </div>
        )

      case 'opmBreakpointsTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              OPM Breakpoints Table
            </div>
          </div>
        )

      case 'dlomTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              DLOM Analysis Table
            </div>
          </div>
        )

      case 'comparableCompaniesTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Comparable Companies Table
            </div>
          </div>
        )

      case 'transactionCompsTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Transaction Comps Table
            </div>
          </div>
        )

      case 'financialProjectionsTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Financial Projections Table
            </div>
          </div>
        )

      case 'weightedAverageTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Calculator className="mr-2 h-4 w-4" />
              Valuation Weighting Table
            </div>
          </div>
        )

      case 'sensitivityAnalysisTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Sensitivity Analysis Table
            </div>
          </div>
        )

      case 'optionPoolTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Option Pool Table
            </div>
          </div>
        )

      case 'managementTable':
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
        const tableContent =
          typeof block.content === 'object' && 'headers' in block.content
            ? block.content
            : { headers: ['Column 1', 'Column 2'], rows: [['Data 1', 'Data 2']] }
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
            onClick={startEditing}
          >
            <div className="mb-2 flex items-center">
              <Table className="mr-2 h-4 w-4" />
              Table ({tableContent.headers.length} columns × {tableContent.rows.length} rows)
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {tableContent.headers.slice(0, 3).map((header: string, i: number) => (
                      <th key={i} className="px-1 py-0.5 text-left font-medium">
                        {header}
                      </th>
                    ))}
                    {tableContent.headers.length > 3 && (
                      <th className="px-1 py-0.5 text-left text-muted-foreground">...</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableContent.rows.slice(0, 2).map((row: string[], i: number) => (
                    <tr key={i} className="border-b">
                      {row.slice(0, 3).map((cell: string, j: number) => (
                        <td key={j} className="px-1 py-0.5">
                          {cell}
                        </td>
                      ))}
                      {row.length > 3 && <td className="px-1 py-0.5 text-muted-foreground">...</td>}
                    </tr>
                  ))}
                  {tableContent.rows.length > 2 && (
                    <tr>
                      <td
                        colSpan={Math.min(tableContent.headers.length, 4)}
                        className="px-1 py-0.5 text-center text-muted-foreground"
                      >
                        ... {tableContent.rows.length - 2} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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

      case 'footer':
        const footerContent =
          typeof block.content === 'object'
            ? block.content
            : {
                leftContent: 'Company Name',
                centerContent: 'Page 1 of 1',
                rightContent: 'Date',
                showConfidentiality: true,
                confidentialityText: 'CONFIDENTIAL',
              }
        return (
          <div
            className="hover:bg-muted/30 cursor-pointer rounded border border-dashed border-border px-3 py-2 transition-colors"
            onClick={startEditing}
            style={block.styling}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>{footerContent.leftContent || 'Left'}</div>
                <div>{footerContent.centerContent || 'Center'}</div>
                <div>{footerContent.rightContent || 'Right'}</div>
              </div>
              {footerContent.showConfidentiality && (
                <div className="border-t pt-1 text-center text-xs font-semibold text-destructive">
                  {footerContent.confidentialityText || 'CONFIDENTIAL'}
                </div>
              )}
            </div>
          </div>
        )

      case 'pageBreak':
        return (
          <div className="relative w-full py-3">
            <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="relative flex items-center justify-center">
              <div className="flex items-center rounded-full border-2 border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Minus className="mr-1.5 h-3 w-3" />
                Page Break
              </div>
            </div>
          </div>
        )

      default:
        // Try to render with specialized display mode first
        const specialDisplay = getBlockDisplayMode(block)
        if (specialDisplay) {
          return (
            <div
              className="hover:bg-muted/30 cursor-text rounded px-2 py-1 text-sm transition-colors"
              onClick={startEditing}
            >
              {specialDisplay}
            </div>
          )
        }
        // Fallback for truly unknown block types
        return (
          <div
            className="hover:bg-muted/30 cursor-text rounded px-2 py-1 text-sm text-muted-foreground transition-colors"
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
    onDelete()
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
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded text-primary">
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
            <div className="text-muted-foreground/50 text-xs">#{block.id}</div>
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

            {onDuplicate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDuplicate}
                className="h-8 w-8 p-0"
                title="Duplicate block"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}

            {onSaveToLibrary && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSaveToLibrary(block)}
                className="h-8 w-8 p-0 hover:text-primary"
                title="Save to library"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="hover:bg-destructive/10 h-8 w-8 p-0 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
