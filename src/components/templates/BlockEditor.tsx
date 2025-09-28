'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Settings, Palette, Eye, EyeOff } from 'lucide-react'
import type { TemplateBlock, TemplateVariable } from '@/lib/templates/types'

import { VariablePicker } from './VariablePicker'
import { LightweightTableEditor } from './LightweightTableEditor'
import { RichTextEditor } from './RichTextEditor'
import {
  SignatureBlockEditor,
  DateBlockEditor,
  QuoteBlockEditor,
  SeparatorEditor,
  CoverPageEditor,
  FootnoteEditor,
  TOCEditor,
  ExecutiveSummaryEditor,
  GlossaryEditor,
  ValuationSummaryEditor,
  GenericRichTextEditor,
} from './block-editors/SpecialBlockEditors'

interface BlockEditorProps {
  block: TemplateBlock
  variables: TemplateVariable[]
  onChange: (updates: Partial<TemplateBlock>) => void
}

export function BlockEditor({ block, variables, onChange }: BlockEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'conditions'>('content')

  const handleContentChange = (content: string | any) => {
    onChange({ content })
  }

  const handleStyleChange = (property: string, value: any) => {
    const newStyling = { ...block.styling, [property]: value }
    onChange({ styling: newStyling })
  }

  const handleConditionalChange = (field: string, value: any) => {
    const newConditional = { ...block.conditionalDisplay, [field]: value } as any
    onChange({ conditionalDisplay: newConditional })
  }

  const addConditionalDisplay = () => {
    onChange({
      conditionalDisplay: {
        variable: '',
        condition: 'exists',
      },
    })
  }

  const removeConditionalDisplay = () => {
    onChange({ conditionalDisplay: undefined })
  }

  const insertVariable = (variable: TemplateVariable) => {
    if (block.type === 'paragraph' || block.type === 'header') {
      const currentContent = typeof block.content === 'string' ? block.content : ''
      const placeholder = ` {{${variable.id}}} `
      // For rich text editor, we need to append HTML
      handleContentChange(currentContent + placeholder)
    }
  }

  const renderContentEditor = () => {
    switch (block.type) {
      case 'header':
      case 'paragraph':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                value={typeof block.content === 'string' ? block.content : ''}
                onChange={handleContentChange}
                placeholder={`Enter ${block.type} content... Use variables like {{company.name}}`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use double curly braces for variables, e.g. {`{{company.name}}`}
              </p>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Quick Insert Variables</Label>
              <VariablePicker variables={variables} onVariableSelect={insertVariable} compact />
            </div>
          </div>
        )

      case 'list':
        const listItems = Array.isArray(block.content) ? block.content : ['']
        return (
          <div className="space-y-4">
            <div>
              <Label>List Items</Label>
              <div className="mt-2 space-y-3">
                {listItems.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{index + 1}.</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newItems = listItems.filter((_, i) => i !== index)
                          handleContentChange(newItems)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <RichTextEditor
                      value={item}
                      onChange={(value) => {
                        const newItems = [...listItems]
                        newItems[index] = value
                        handleContentChange(newItems)
                      }}
                      placeholder={`List item ${index + 1}...`}
                      className="ml-6"
                    />
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleContentChange([...listItems, ''])}
                className="mt-2"
              >
                Add Item
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Each list item supports rich text formatting. Use the toolbar to format text.
              </p>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Quick Insert Variables</Label>
              <VariablePicker
                variables={variables}
                onVariableSelect={(variable) => {
                  // Add to last item or create new if empty
                  const lastIndex = listItems.length - 1
                  if (lastIndex >= 0) {
                    const newItems = [...listItems]
                    newItems[lastIndex] = newItems[lastIndex] + ` {{${variable.id}}} `
                    handleContentChange(newItems)
                  }
                }}
                compact
              />
            </div>
          </div>
        )

      case 'table':
        return (
          <div className="space-y-4">
            <LightweightTableEditor
              value={block.content}
              onChange={handleContentChange}
              variables={variables.map((v) => ({ id: v.id, name: v.name }))}
            />
          </div>
        )

      case 'chart':
        return (
          <div className="space-y-4">
            <div className="rounded border-2 border-dashed border-border p-4 text-center">
              <p className="text-muted-foreground">
                Chart editor with Chart.js integration coming soon
              </p>
            </div>
          </div>
        )

      case 'signatureBlock':
        return <SignatureBlockEditor content={block.content} onChange={handleContentChange} />

      case 'dateBlock':
        return <DateBlockEditor content={block.content} onChange={handleContentChange} />

      case 'quote':
        return <QuoteBlockEditor content={block.content} onChange={handleContentChange} />

      case 'separator':
        return <SeparatorEditor content={block.content} onChange={handleContentChange} />

      case 'coverPage':
        return <CoverPageEditor content={block.content} onChange={handleContentChange} />

      case 'footnote':
        return <FootnoteEditor content={block.content} onChange={handleContentChange} />

      case 'tableOfContents':
        return <TOCEditor content={block.content} onChange={handleContentChange} />

      case 'executiveSummary':
        return <ExecutiveSummaryEditor content={block.content} onChange={handleContentChange} />

      case 'glossary':
        return <GlossaryEditor content={block.content} onChange={handleContentChange} />

      case 'valuationSummary':
        return <ValuationSummaryEditor content={block.content} onChange={handleContentChange} />

      case 'appendix':
      case 'bibliography':
        return (
          <GenericRichTextEditor
            content={block.content}
            onChange={handleContentChange}
            placeholder={
              block.type === 'appendix'
                ? 'Enter appendix content...'
                : 'Enter bibliography entries...'
            }
          />
        )

      case 'text':
      case 'pageBreak':
      case 'dynamicTable':
      case 'breakpointsTable':
      case 'managementTable':
      default:
        return (
          <GenericRichTextEditor
            content={block.content}
            onChange={handleContentChange}
            placeholder="Enter content..."
          />
        )
    }
  }

  const renderStyleEditor = () => (
    <div className="space-y-4">
      {/* Typography */}
      <div>
        <Label className="mb-2 block text-sm font-medium">Typography</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="fontSize" className="text-xs">
              Font Size
            </Label>
            <Input
              id="fontSize"
              type="number"
              value={block.styling?.fontSize || ''}
              onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || undefined)}
              placeholder="16"
            />
          </div>
          {/* Font Weight - Hide for text blocks that use RichTextEditor */}
          {block.type !== 'paragraph' && block.type !== 'header' && block.type !== 'text' && (
            <div>
              <Label htmlFor="fontWeight" className="text-xs">
                Font Weight
              </Label>
              <Select
                value={block.styling?.fontWeight || 'normal'}
                onValueChange={(value) => handleStyleChange('fontWeight', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Alignment */}
      <div>
        <Label htmlFor="textAlign" className="text-xs">
          Text Alignment
        </Label>
        <Select
          value={block.styling?.textAlign || 'left'}
          onValueChange={(value) => handleStyleChange('textAlign', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="color" className="text-xs">
            Text Color
          </Label>
          <Input
            id="color"
            type="color"
            value={block.styling?.color || '#000000'}
            onChange={(e) => handleStyleChange('color', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="backgroundColor" className="text-xs">
            Background
          </Label>
          <Input
            id="backgroundColor"
            type="color"
            value={block.styling?.backgroundColor || '#ffffff'}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
          />
        </div>
      </div>

      {/* Spacing */}
      <div>
        <Label className="mb-2 block text-sm font-medium">Spacing</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="margin" className="text-xs">
              Margin
            </Label>
            <Input
              id="margin"
              value={block.styling?.margin || ''}
              onChange={(e) => handleStyleChange('margin', e.target.value)}
              placeholder="10px 0"
            />
          </div>
          <div>
            <Label htmlFor="padding" className="text-xs">
              Padding
            </Label>
            <Input
              id="padding"
              value={block.styling?.padding || ''}
              onChange={(e) => handleStyleChange('padding', e.target.value)}
              placeholder="10px"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderConditionsEditor = () => (
    <div className="space-y-4">
      {block.conditionalDisplay ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Conditional Display</Label>
            <Button size="sm" variant="outline" onClick={removeConditionalDisplay}>
              <EyeOff className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>

          <div>
            <Label htmlFor="variable" className="text-xs">
              Variable
            </Label>
            <Select
              value={block.conditionalDisplay.variable}
              onValueChange={(value) => handleConditionalChange('variable', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select variable" />
              </SelectTrigger>
              <SelectContent>
                {variables.map((variable) => (
                  <SelectItem key={variable.id} value={variable.id}>
                    {variable.name} ({variable.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="condition" className="text-xs">
              Condition
            </Label>
            <Select
              value={block.conditionalDisplay.condition}
              onValueChange={(value) => handleConditionalChange('condition', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exists">Exists</SelectItem>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="notEquals">Not Equals</SelectItem>
                <SelectItem value="greaterThan">Greater Than</SelectItem>
                <SelectItem value="lessThan">Less Than</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {['equals', 'notEquals', 'greaterThan', 'lessThan'].includes(
            block.conditionalDisplay.condition
          ) && (
            <div>
              <Label htmlFor="value" className="text-xs">
                Value
              </Label>
              <Input
                id="value"
                value={block.conditionalDisplay.value || ''}
                onChange={(e) => handleConditionalChange('value', e.target.value)}
                placeholder="Comparison value"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <Eye className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">No conditional display rules</p>
          <Button onClick={addConditionalDisplay}>
            <Eye className="mr-2 h-4 w-4" />
            Add Condition
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <Settings className="mr-2 h-4 w-4" />
          Block Editor
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{block.type}</Badge>
          <Badge variant="outline" className="text-xs">
            #{block.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: 'content', label: 'Content', icon: Settings },
            { id: 'style', label: 'Style', icon: Palette },
            { id: 'conditions', label: 'Rules', icon: Eye },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="mr-1 inline h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'content' && renderContentEditor()}
          {activeTab === 'style' && renderStyleEditor()}
          {activeTab === 'conditions' && renderConditionsEditor()}
        </div>
      </CardContent>
    </Card>
  )
}
