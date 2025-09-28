import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Check, X, Plus, Trash2 } from 'lucide-react'
import { RichTextEditor } from '../RichTextEditor'
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
} from './SpecialBlockEditors'

interface BlockEditModeProps {
  block: any
  editingContent: any
  setEditingContent: (content: any) => void
  saveEdit: () => void
  cancelEdit: () => void
  handleKeyDown?: (e: React.KeyboardEvent) => void
  tempListItems?: string[]
  setTempListItems?: (items: string[]) => void
  updateTempListItem?: (index: number, value: string) => void
  addTempListItem?: () => void
  removeTempListItem?: (index: number) => void
}

export function getBlockEditMode({
  block,
  editingContent,
  setEditingContent,
  saveEdit,
  cancelEdit,
  handleKeyDown,
  tempListItems = [],
  setTempListItems = () => {},
  updateTempListItem = () => {},
  addTempListItem = () => {},
  removeTempListItem = () => {},
}: BlockEditModeProps) {
  switch (block.type) {
    case 'signatureBlock':
      return (
        <div className="space-y-2">
          <SignatureBlockEditor content={editingContent} onChange={setEditingContent} />
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

    case 'dateBlock':
      return (
        <div className="space-y-2">
          <DateBlockEditor content={editingContent} onChange={setEditingContent} />
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

    case 'quote':
      return (
        <div className="space-y-2">
          <QuoteBlockEditor content={editingContent} onChange={setEditingContent} />
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

    case 'separator':
      return (
        <div className="space-y-2">
          <SeparatorEditor content={editingContent} onChange={setEditingContent} />
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

    case 'coverPage':
      return (
        <div className="space-y-2">
          <CoverPageEditor content={editingContent} onChange={setEditingContent} />
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

    case 'footnote':
      return (
        <div className="space-y-2">
          <FootnoteEditor content={editingContent} onChange={setEditingContent} />
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

    case 'tableOfContents':
      return (
        <div className="space-y-2">
          <TOCEditor content={editingContent} onChange={setEditingContent} />
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

    case 'executiveSummary':
      return (
        <div className="space-y-2">
          <ExecutiveSummaryEditor content={editingContent} onChange={setEditingContent} />
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

    case 'glossary':
      return (
        <div className="space-y-2">
          <GlossaryEditor content={editingContent} onChange={setEditingContent} />
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

    case 'valuationSummary':
      return (
        <div className="space-y-2">
          <ValuationSummaryEditor content={editingContent} onChange={setEditingContent} />
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

    case 'appendix':
    case 'bibliography':
      return (
        <div className="space-y-2">
          <GenericRichTextEditor
            content={editingContent}
            onChange={setEditingContent}
            placeholder={
              block.type === 'appendix'
                ? 'Enter appendix content...'
                : 'Enter bibliography entries...'
            }
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

    // Keep existing list handler for now
    case 'list':
      return (
        <div className="space-y-2">
          {tempListItems.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateTempListItem(index, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Item ${index + 1}`}
                autoFocus={index === tempListItems.length - 1}
              />
              {tempListItems.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => removeTempListItem(index)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addTempListItem}>
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

    // Use RichTextEditor for text-based blocks
    case 'text':
    case 'paragraph':
    case 'pageBreak':
      return (
        <div className="space-y-2">
          <RichTextEditor
            value={typeof editingContent === 'string' ? editingContent : ''}
            onChange={setEditingContent}
            placeholder="Enter content..."
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
      // For any unhandled block types, use generic rich text editor
      return (
        <div className="space-y-2">
          <GenericRichTextEditor
            content={editingContent}
            onChange={setEditingContent}
            placeholder="Enter content..."
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

// Display mode renderers for special blocks
export function getBlockDisplayMode(block: any) {
  switch (block.type) {
    case 'signatureBlock':
      const sigData = block.content || { signers: [] }
      return (
        <div className="space-y-4">
          {sigData.signers?.map((signer: any, i: number) => (
            <div key={i} className="border-t pt-4">
              <div className="mb-8">____________________</div>
              <div className="font-medium">{signer.name || 'Name'}</div>
              <div className="text-sm text-muted-foreground">{signer.title || 'Title'}</div>
              {signer.showDate && (
                <div className="mt-1 text-sm text-muted-foreground">Date: ___________</div>
              )}
            </div>
          ))}
        </div>
      )

    case 'dateBlock':
      const dateData = block.content || {
        format: 'MMMM DD, YYYY',
        prefix: 'Date: ',
        useCurrentDate: true,
      }
      const today = new Date()
      const formattedDate = dateData.useCurrentDate
        ? today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '{{report.date}}'
      return (
        <div className="text-sm">
          {dateData.prefix}
          {formattedDate}
        </div>
      )

    case 'quote':
      const quoteData =
        typeof block.content === 'string'
          ? { text: block.content, author: '', source: '' }
          : block.content || { text: 'Quote text', author: '', source: '' }
      return (
        <blockquote className="border-l-4 pl-4 italic">
          <p>"{quoteData.text}"</p>
          {(quoteData.author || quoteData.source) && (
            <footer className="mt-2 text-sm text-muted-foreground">
              {quoteData.author && <span>— {quoteData.author}</span>}
              {quoteData.source && <span>, {quoteData.source}</span>}
            </footer>
          )}
        </blockquote>
      )

    case 'separator':
      const sepData = block.content || { style: 'solid', thickness: 1, color: '#e5e7eb' }
      if (sepData.style === 'decorative') {
        return <div className="py-2 text-center text-muted-foreground">⁕ ⁕ ⁕</div>
      }
      return (
        <hr
          style={{
            borderStyle: sepData.style,
            borderWidth: `${sepData.thickness}px`,
            borderColor: sepData.color,
            borderBottomWidth: 0,
          }}
        />
      )

    case 'coverPage':
      const coverData = block.content || {
        title: 'Report Title',
        subtitle: '',
        companyName: 'Company Name',
        reportType: 'Valuation Report',
        date: new Date().toLocaleDateString(),
        preparedBy: 'Prepared By',
        preparedFor: 'Prepared For',
      }
      return (
        <div className="space-y-4 py-8 text-center">
          {coverData.logoUrl && (
            <div className="text-sm text-muted-foreground">[Logo: {coverData.logoUrl}]</div>
          )}
          <h1 className="text-2xl font-bold">{coverData.title}</h1>
          {coverData.subtitle && <h2 className="text-xl">{coverData.subtitle}</h2>}
          <div className="text-lg">{coverData.companyName}</div>
          <div className="text-sm text-muted-foreground">{coverData.reportType}</div>
          <div className="text-sm">{coverData.date}</div>
          <div className="mt-8 border-t pt-8">
            <div className="text-sm">Prepared by: {coverData.preparedBy}</div>
            <div className="text-sm">Prepared for: {coverData.preparedFor}</div>
          </div>
        </div>
      )

    case 'footnote':
      const footnoteData =
        typeof block.content === 'string'
          ? { text: block.content, number: 1, symbol: 'number' }
          : block.content || { text: 'Footnote text', number: 1, symbol: 'number' }
      let symbol = String(footnoteData.number)
      if (footnoteData.symbol === 'asterisk') {
        symbol = '*'.repeat(Math.min(footnoteData.number || 1, 3))
      } else if (footnoteData.symbol === 'dagger') {
        const symbols = ['†', '‡', '§', '‖', '¶']
        symbol = symbols[(footnoteData.number - 1) % symbols.length]
      } else if (footnoteData.symbol === 'letter') {
        symbol = String.fromCharCode(96 + (footnoteData.number || 1))
      } else if (footnoteData.symbol === 'roman') {
        const romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
        symbol = romans[(footnoteData.number - 1) % romans.length]
      }
      return (
        <div className="text-sm text-muted-foreground">
          <sup>{symbol}</sup> {footnoteData.text}
        </div>
      )

    case 'tableOfContents':
      const tocData = block.content || { title: 'Table of Contents' }
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{tocData.title}</h2>
          <div className="text-sm text-muted-foreground">
            [Table of contents will be generated from document headings]
          </div>
        </div>
      )

    case 'executiveSummary':
      const summaryData =
        typeof block.content === 'string'
          ? { content: block.content }
          : block.content || { content: 'Executive summary content...' }
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Executive Summary</h2>
          <div dangerouslySetInnerHTML={{ __html: summaryData.content }} />
        </div>
      )

    case 'glossary':
      const glossaryData = block.content || { terms: [] }
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Glossary</h2>
          <dl className="space-y-2">
            {glossaryData.terms?.map((item: any, i: number) => (
              <div key={i}>
                <dt className="font-medium">{item.term}</dt>
                <dd className="ml-4 text-sm text-muted-foreground">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      )

    case 'valuationSummary':
      const valData = block.content || {
        companyName: 'Company Name',
        valuationDate: 'Valuation Date',
        valuationAmount: 'Amount',
        methodology: 'Methodology',
        purpose: 'Purpose',
        keyMetrics: [],
      }
      return (
        <div className="space-y-2 rounded border p-4">
          <h3 className="font-semibold">Valuation Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Company: {valData.companyName}</div>
            <div>Date: {valData.valuationDate}</div>
            <div>Amount: {valData.valuationAmount}</div>
            <div>Method: {valData.methodology}</div>
            <div className="col-span-2">Purpose: {valData.purpose}</div>
          </div>
          {valData.keyMetrics?.length > 0 && (
            <div className="border-t pt-2">
              <div className="mb-1 text-sm font-medium">Key Metrics:</div>
              {valData.keyMetrics.map((metric: any, i: number) => (
                <div key={i} className="text-sm">
                  {metric.label}: {metric.value}
                </div>
              ))}
            </div>
          )}
        </div>
      )

    case 'appendix':
      const appendixData =
        typeof block.content === 'string'
          ? block.content
          : block.content?.text || 'Appendix content...'
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Appendix</h2>
          <div dangerouslySetInnerHTML={{ __html: appendixData }} />
        </div>
      )

    case 'bibliography':
      const bibData =
        typeof block.content === 'string'
          ? block.content
          : block.content?.text || 'Bibliography entries...'
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Bibliography</h2>
          <div dangerouslySetInnerHTML={{ __html: bibData }} />
        </div>
      )

    default:
      return null
  }
}
