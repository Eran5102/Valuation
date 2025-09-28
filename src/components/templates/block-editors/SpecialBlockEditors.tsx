import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { RichTextEditor } from '../RichTextEditor'

// Signature Block Editor
export function SignatureBlockEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = content || { signers: [{ name: '', title: '', showDate: true }] }

  const addSigner = () => {
    onChange({
      ...data,
      signers: [...data.signers, { name: '', title: '', showDate: true }],
    })
  }

  const removeSigner = (index: number) => {
    onChange({
      ...data,
      signers: data.signers.filter((_: any, i: number) => i !== index),
    })
  }

  const updateSigner = (index: number, field: string, value: any) => {
    const newSigners = [...data.signers]
    newSigners[index] = { ...newSigners[index], [field]: value }
    onChange({ ...data, signers: newSigners })
  }

  return (
    <div className="space-y-4">
      <Label>Signature Blocks</Label>
      {data.signers.map((signer: any, index: number) => (
        <div key={index} className="space-y-2 rounded border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Signer {index + 1}</span>
            {data.signers.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => removeSigner(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="Name or {{variable}}"
            value={signer.name}
            onChange={(e) => updateSigner(index, 'name', e.target.value)}
          />
          <Input
            placeholder="Title or {{variable}}"
            value={signer.title}
            onChange={(e) => updateSigner(index, 'title', e.target.value)}
          />
          <div className="flex items-center space-x-2">
            <Switch
              checked={signer.showDate}
              onCheckedChange={(checked) => updateSigner(index, 'showDate', checked)}
            />
            <Label>Show signature date</Label>
          </div>
        </div>
      ))}
      <Button onClick={addSigner} variant="outline" size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Signer
      </Button>
    </div>
  )
}

// Date Block Editor
export function DateBlockEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = content || { format: 'MMMM DD, YYYY', prefix: 'Date: ', useCurrentDate: true }

  return (
    <div className="space-y-4">
      <div>
        <Label>Date Format</Label>
        <Select value={data.format} onValueChange={(value) => onChange({ ...data, format: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MMMM DD, YYYY">January 1, 2024</SelectItem>
            <SelectItem value="MM/DD/YYYY">01/01/2024</SelectItem>
            <SelectItem value="DD/MM/YYYY">01/01/2024</SelectItem>
            <SelectItem value="YYYY-MM-DD">2024-01-01</SelectItem>
            <SelectItem value="MMM DD, YYYY">Jan 1, 2024</SelectItem>
            <SelectItem value="DD MMM YYYY">1 Jan 2024</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Prefix Text</Label>
        <Input
          value={data.prefix}
          onChange={(e) => onChange({ ...data, prefix: e.target.value })}
          placeholder="e.g., 'Date: ' or 'As of '"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={data.useCurrentDate}
          onCheckedChange={(checked) => onChange({ ...data, useCurrentDate: checked })}
        />
        <Label>Use current date (or use {`{{report.date}}`} variable)</Label>
      </div>
    </div>
  )
}

// Quote Block Editor
export function QuoteBlockEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data =
    typeof content === 'string'
      ? { text: content, author: '', source: '' }
      : content || { text: '', author: '', source: '' }

  return (
    <div className="space-y-4">
      <div>
        <Label>Quote Text</Label>
        <Textarea
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Enter the quote text..."
          rows={3}
        />
      </div>
      <div>
        <Label>Author</Label>
        <Input
          value={data.author}
          onChange={(e) => onChange({ ...data, author: e.target.value })}
          placeholder="Quote author (optional)"
        />
      </div>
      <div>
        <Label>Source</Label>
        <Input
          value={data.source}
          onChange={(e) => onChange({ ...data, source: e.target.value })}
          placeholder="Source or publication (optional)"
        />
      </div>
    </div>
  )
}

// Separator Editor
export function SeparatorEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = content || { style: 'solid', thickness: 1, color: '#e5e7eb' }

  return (
    <div className="space-y-4">
      <div>
        <Label>Style</Label>
        <Select value={data.style} onValueChange={(value) => onChange({ ...data, style: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid Line</SelectItem>
            <SelectItem value="dashed">Dashed Line</SelectItem>
            <SelectItem value="dotted">Dotted Line</SelectItem>
            <SelectItem value="double">Double Line</SelectItem>
            <SelectItem value="decorative">Decorative (⁕ ⁕ ⁕)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.style !== 'decorative' && (
        <>
          <div>
            <Label>Thickness</Label>
            <Select
              value={String(data.thickness)}
              onValueChange={(value) => onChange({ ...data, thickness: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Thin (1px)</SelectItem>
                <SelectItem value="2">Medium (2px)</SelectItem>
                <SelectItem value="3">Thick (3px)</SelectItem>
                <SelectItem value="4">Extra Thick (4px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={data.color}
                onChange={(e) => onChange({ ...data, color: e.target.value })}
                className="w-20"
              />
              <Input
                value={data.color}
                onChange={(e) => onChange({ ...data, color: e.target.value })}
                placeholder="#e5e7eb"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Cover Page Editor
export function CoverPageEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = content || {
    title: '{{report.title}}',
    subtitle: '',
    companyName: '{{company.name}}',
    reportType: 'Valuation Report',
    date: '{{report.date}}',
    logoUrl: '{{company.logo}}',
    preparedBy: '{{company.name}}',
    preparedFor: '{{client.name}}',
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Report Title</Label>
        <Input
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="{{report.title}}"
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input
          value={data.subtitle}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          placeholder="Optional subtitle"
        />
      </div>
      <div>
        <Label>Company Name</Label>
        <Input
          value={data.companyName}
          onChange={(e) => onChange({ ...data, companyName: e.target.value })}
          placeholder="{{company.name}}"
        />
      </div>
      <div>
        <Label>Report Type</Label>
        <Input
          value={data.reportType}
          onChange={(e) => onChange({ ...data, reportType: e.target.value })}
          placeholder="e.g., Valuation Report, Financial Analysis"
        />
      </div>
      <div>
        <Label>Date</Label>
        <Input
          value={data.date}
          onChange={(e) => onChange({ ...data, date: e.target.value })}
          placeholder="{{report.date}}"
        />
      </div>
      <div>
        <Label>Logo URL</Label>
        <Input
          value={data.logoUrl}
          onChange={(e) => onChange({ ...data, logoUrl: e.target.value })}
          placeholder="{{company.logo}}"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Prepared By</Label>
          <Input
            value={data.preparedBy}
            onChange={(e) => onChange({ ...data, preparedBy: e.target.value })}
            placeholder="{{company.name}}"
          />
        </div>
        <div>
          <Label>Prepared For</Label>
          <Input
            value={data.preparedFor}
            onChange={(e) => onChange({ ...data, preparedFor: e.target.value })}
            placeholder="{{client.name}}"
          />
        </div>
      </div>
    </div>
  )
}

// Footnote Editor
export function FootnoteEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data =
    typeof content === 'string'
      ? { text: content, number: 1, symbol: 'number' }
      : content || { text: '', number: 1, symbol: 'number' }

  return (
    <div className="space-y-4">
      <div>
        <Label>Footnote Style</Label>
        <Select value={data.symbol} onValueChange={(value) => onChange({ ...data, symbol: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Numbers (1, 2, 3...)</SelectItem>
            <SelectItem value="asterisk">Asterisks (*, **, ***)</SelectItem>
            <SelectItem value="dagger">Symbols (†, ‡, §)</SelectItem>
            <SelectItem value="letter">Letters (a, b, c...)</SelectItem>
            <SelectItem value="roman">Roman (i, ii, iii...)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.symbol === 'number' && (
        <div>
          <Label>Footnote Number</Label>
          <Input
            type="number"
            value={data.number}
            onChange={(e) => onChange({ ...data, number: parseInt(e.target.value) || 1 })}
            min="1"
          />
        </div>
      )}
      <div>
        <Label>Footnote Text</Label>
        <Textarea
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="Enter footnote text..."
          rows={3}
        />
      </div>
    </div>
  )
}

// Table of Contents Editor
export function TOCEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = content || {
    title: 'Table of Contents',
    maxDepth: 3,
    showPageNumbers: true,
    includeAppendices: true,
    numberingStyle: 'decimal',
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Table of Contents"
        />
      </div>
      <div>
        <Label>Maximum Depth</Label>
        <Select
          value={String(data.maxDepth)}
          onValueChange={(value) => onChange({ ...data, maxDepth: Number(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Level 1 only</SelectItem>
            <SelectItem value="2">Levels 1-2</SelectItem>
            <SelectItem value="3">Levels 1-3</SelectItem>
            <SelectItem value="4">All levels</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Numbering Style</Label>
        <Select
          value={data.numberingStyle}
          onValueChange={(value) => onChange({ ...data, numberingStyle: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="decimal">1, 1.1, 1.1.1</SelectItem>
            <SelectItem value="roman">I, A, 1, a</SelectItem>
            <SelectItem value="none">No numbering</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={data.showPageNumbers}
            onCheckedChange={(checked) => onChange({ ...data, showPageNumbers: checked })}
          />
          <Label>Show page numbers</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={data.includeAppendices}
            onCheckedChange={(checked) => onChange({ ...data, includeAppendices: checked })}
          />
          <Label>Include appendices</Label>
        </div>
      </div>
    </div>
  )
}

// Executive Summary Editor
export function ExecutiveSummaryEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = typeof content === 'string' ? { content: content } : content || { content: '' }

  return (
    <div className="space-y-4">
      <Label>Executive Summary Content</Label>
      <div className="rounded-md border">
        <RichTextEditor
          value={data.content}
          onChange={(value) => onChange({ ...data, content: value })}
          placeholder="Write your executive summary here. Use variables like {{company.name}}, {{valuation.amount}}, etc."
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: Keep it concise (1-2 pages). Include key findings, methodology, and conclusions.
      </p>
    </div>
  )
}

// Glossary Editor
export function GlossaryEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = content || { terms: [{ term: '', definition: '' }] }

  const addTerm = () => {
    onChange({
      ...data,
      terms: [...data.terms, { term: '', definition: '' }],
    })
  }

  const removeTerm = (index: number) => {
    onChange({
      ...data,
      terms: data.terms.filter((_: any, i: number) => i !== index),
    })
  }

  const updateTerm = (index: number, field: string, value: string) => {
    const newTerms = [...data.terms]
    newTerms[index] = { ...newTerms[index], [field]: value }
    onChange({ ...data, terms: newTerms })
  }

  return (
    <div className="space-y-4">
      <Label>Glossary Terms</Label>
      {data.terms.map((item: any, index: number) => (
        <div key={index} className="space-y-2 rounded border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Term {index + 1}</span>
            {data.terms.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => removeTerm(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="Term"
            value={item.term}
            onChange={(e) => updateTerm(index, 'term', e.target.value)}
          />
          <Textarea
            placeholder="Definition"
            value={item.definition}
            onChange={(e) => updateTerm(index, 'definition', e.target.value)}
            rows={2}
          />
        </div>
      ))}
      <Button onClick={addTerm} variant="outline" size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Term
      </Button>
    </div>
  )
}

// Valuation Summary Editor
export function ValuationSummaryEditor({
  content,
  onChange,
}: {
  content: any
  onChange: (content: any) => void
}) {
  const data = content || {
    companyName: '{{company.name}}',
    valuationDate: '{{valuation.date}}',
    valuationAmount: '{{valuation.amount}}',
    methodology: '{{valuation.methodology}}',
    purpose: '{{valuation.purpose}}',
    keyMetrics: [],
  }

  const addMetric = () => {
    onChange({
      ...data,
      keyMetrics: [...(data.keyMetrics || []), { label: '', value: '' }],
    })
  }

  const removeMetric = (index: number) => {
    onChange({
      ...data,
      keyMetrics: data.keyMetrics.filter((_: any, i: number) => i !== index),
    })
  }

  const updateMetric = (index: number, field: string, value: string) => {
    const newMetrics = [...data.keyMetrics]
    newMetrics[index] = { ...newMetrics[index], [field]: value }
    onChange({ ...data, keyMetrics: newMetrics })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Company Name</Label>
        <Input
          value={data.companyName}
          onChange={(e) => onChange({ ...data, companyName: e.target.value })}
          placeholder="{{company.name}}"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Valuation Date</Label>
          <Input
            value={data.valuationDate}
            onChange={(e) => onChange({ ...data, valuationDate: e.target.value })}
            placeholder="{{valuation.date}}"
          />
        </div>
        <div>
          <Label>Valuation Amount</Label>
          <Input
            value={data.valuationAmount}
            onChange={(e) => onChange({ ...data, valuationAmount: e.target.value })}
            placeholder="{{valuation.amount}}"
          />
        </div>
      </div>
      <div>
        <Label>Methodology</Label>
        <Input
          value={data.methodology}
          onChange={(e) => onChange({ ...data, methodology: e.target.value })}
          placeholder="{{valuation.methodology}}"
        />
      </div>
      <div>
        <Label>Purpose</Label>
        <Input
          value={data.purpose}
          onChange={(e) => onChange({ ...data, purpose: e.target.value })}
          placeholder="{{valuation.purpose}}"
        />
      </div>

      <div>
        <Label>Key Metrics</Label>
        {data.keyMetrics?.map((metric: any, index: number) => (
          <div key={index} className="mt-2 flex gap-2">
            <Input
              placeholder="Metric label"
              value={metric.label}
              onChange={(e) => updateMetric(index, 'label', e.target.value)}
            />
            <Input
              placeholder="Value or {{variable}}"
              value={metric.value}
              onChange={(e) => updateMetric(index, 'value', e.target.value)}
            />
            <Button size="sm" variant="ghost" onClick={() => removeMetric(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button onClick={addMetric} variant="outline" size="sm" className="mt-2">
          <Plus className="mr-2 h-4 w-4" />
          Add Metric
        </Button>
      </div>
    </div>
  )
}

// Generic Rich Text Editor for blocks that just need rich text
export function GenericRichTextEditor({
  content,
  onChange,
  placeholder = 'Enter content...',
}: {
  content: any
  onChange: (content: any) => void
  placeholder?: string
}) {
  const textContent = typeof content === 'string' ? content : content?.text || ''

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <RichTextEditor
          value={textContent}
          onChange={(value) =>
            onChange(typeof content === 'string' ? value : { ...content, text: value })
          }
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
