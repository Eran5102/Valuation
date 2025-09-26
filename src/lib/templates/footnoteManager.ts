/**
 * FootnoteManager Service
 * Manages footnotes across a report template including numbering, references, and dynamic content
 */

import type { TemplateBlock } from './types'

export interface Footnote {
  id: string
  number: number
  content: string
  isDynamic: boolean
  variables?: string[] // Variables used in dynamic content
  referenceBlockId?: string // ID of the block containing the reference
  type: 'footnote' | 'endnote'
}

export class FootnoteManager {
  private footnotes: Map<string, Footnote> = new Map()
  private currentNumber: number = 1
  private footnoteReferences: Map<string, string[]> = new Map() // Maps block IDs to footnote IDs

  /**
   * Reset the manager for a new document
   */
  reset(): void {
    this.footnotes.clear()
    this.footnoteReferences.clear()
    this.currentNumber = 1
  }

  /**
   * Add a new footnote
   */
  addFootnote(
    content: string,
    referenceBlockId?: string,
    type: 'footnote' | 'endnote' = 'footnote'
  ): Footnote {
    const id = `fn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const isDynamic = this.checkIfDynamic(content)
    const variables = this.extractVariables(content)

    const footnote: Footnote = {
      id,
      number: this.currentNumber++,
      content,
      isDynamic,
      variables,
      referenceBlockId,
      type,
    }

    this.footnotes.set(id, footnote)

    // Track reference
    if (referenceBlockId) {
      const refs = this.footnoteReferences.get(referenceBlockId) || []
      refs.push(id)
      this.footnoteReferences.set(referenceBlockId, refs)
    }

    return footnote
  }

  /**
   * Get all footnotes
   */
  getAllFootnotes(): Footnote[] {
    return Array.from(this.footnotes.values()).sort((a, b) => a.number - b.number)
  }

  /**
   * Get footnotes for a specific block
   */
  getFootnotesForBlock(blockId: string): Footnote[] {
    const footnoteIds = this.footnoteReferences.get(blockId) || []
    return footnoteIds.map(id => this.footnotes.get(id)!).filter(Boolean)
  }

  /**
   * Get footnotes by type
   */
  getFootnotesByType(type: 'footnote' | 'endnote'): Footnote[] {
    return this.getAllFootnotes().filter(fn => fn.type === type)
  }

  /**
   * Update footnote content
   */
  updateFootnote(id: string, content: string): void {
    const footnote = this.footnotes.get(id)
    if (footnote) {
      footnote.content = content
      footnote.isDynamic = this.checkIfDynamic(content)
      footnote.variables = this.extractVariables(content)
    }
  }

  /**
   * Delete a footnote
   */
  deleteFootnote(id: string): void {
    const footnote = this.footnotes.get(id)
    if (footnote) {
      // Remove from references
      if (footnote.referenceBlockId) {
        const refs = this.footnoteReferences.get(footnote.referenceBlockId)
        if (refs) {
          const index = refs.indexOf(id)
          if (index > -1) {
            refs.splice(index, 1)
          }
        }
      }

      this.footnotes.delete(id)
      this.renumberFootnotes()
    }
  }

  /**
   * Renumber all footnotes after deletion
   */
  private renumberFootnotes(): void {
    const footnotes = this.getAllFootnotes()
    this.currentNumber = 1
    footnotes.forEach(fn => {
      fn.number = this.currentNumber++
    })
  }

  /**
   * Check if content contains dynamic variables
   */
  private checkIfDynamic(content: string): boolean {
    return /{{[^}]+}}/.test(content)
  }

  /**
   * Extract variables from content
   */
  private extractVariables(content: string): string[] {
    const matches = content.match(/{{([^}]+)}}/g) || []
    return matches.map(match => match.replace(/[{}]/g, '').trim())
  }

  /**
   * Process dynamic footnote content with data
   */
  processFootnoteContent(footnote: Footnote, data: Record<string, any>): string {
    if (!footnote.isDynamic) {
      return footnote.content
    }

    let processedContent = footnote.content
    footnote.variables?.forEach(variable => {
      const value = this.getNestedValue(data, variable)
      processedContent = processedContent.replace(
        new RegExp(`{{\\s*${variable}\\s*}}`, 'g'),
        value !== undefined ? String(value) : `[${variable}]`
      )
    })

    return processedContent
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Generate HTML for footnote references (superscript numbers)
   */
  generateReferenceHTML(footnoteId: string): string {
    const footnote = this.footnotes.get(footnoteId)
    if (!footnote) return ''

    return `<sup class="footnote-ref"><a href="#fn-${footnote.number}" id="fnref-${footnote.number}">[${footnote.number}]</a></sup>`
  }

  /**
   * Generate HTML for footnotes section
   */
  generateFootnotesHTML(data: Record<string, any>, type: 'footnote' | 'endnote' = 'footnote'): string {
    const footnotes = this.getFootnotesByType(type)
    if (footnotes.length === 0) return ''

    const title = type === 'footnote' ? 'Footnotes' : 'Endnotes'
    const footnotesHTML = footnotes.map(fn => {
      const content = this.processFootnoteContent(fn, data)
      return `
        <div class="footnote-item" id="fn-${fn.number}">
          <span class="footnote-number">${fn.number}.</span>
          <span class="footnote-content">${content}</span>
          <a href="#fnref-${fn.number}" class="footnote-backref">↩</a>
        </div>
      `
    }).join('\n')

    return `
      <div class="footnotes-section">
        <hr class="footnotes-separator" />
        <h3 class="footnotes-title">${title}</h3>
        <div class="footnotes-list">
          ${footnotesHTML}
        </div>
      </div>
    `
  }

  /**
   * Get CSS styles for footnotes
   */
  static getFootnoteStyles(): string {
    return `
      .footnote-ref {
        font-size: 0.85em;
        vertical-align: super;
        line-height: 0;
      }

      .footnote-ref a {
        text-decoration: none;
        color: #007acc;
      }

      .footnote-ref a:hover {
        text-decoration: underline;
      }

      .footnotes-section {
        margin-top: 40px;
        padding-top: 20px;
        font-size: 0.9em;
      }

      .footnotes-separator {
        border: none;
        border-top: 1px solid #ddd;
        margin: 20px 0;
      }

      .footnotes-title {
        font-size: 1.1em;
        font-weight: 600;
        margin-bottom: 15px;
      }

      .footnote-item {
        display: flex;
        margin-bottom: 10px;
      }

      .footnote-number {
        min-width: 25px;
        font-weight: 600;
      }

      .footnote-content {
        flex: 1;
        padding-right: 10px;
      }

      .footnote-backref {
        color: #007acc;
        text-decoration: none;
        padding-left: 5px;
      }

      .footnote-backref:hover {
        text-decoration: underline;
      }

      @media print {
        .footnotes-section {
          page-break-inside: avoid;
        }

        .footnote-backref {
          display: none;
        }
      }
    `
  }

  /**
   * Export footnotes data for persistence
   */
  exportData(): {
    footnotes: Array<Footnote & { id: string }>
    references: Array<{ blockId: string; footnoteIds: string[] }>
  } {
    return {
      footnotes: Array.from(this.footnotes.entries()).map(([id, footnote]) => ({
        ...footnote,
        id,
      })),
      references: Array.from(this.footnoteReferences.entries()).map(([blockId, footnoteIds]) => ({
        blockId,
        footnoteIds,
      })),
    }
  }

  /**
   * Import footnotes data
   */
  importData(data: ReturnType<FootnoteManager['exportData']>): void {
    this.reset()

    // Restore footnotes
    data.footnotes.forEach(footnote => {
      this.footnotes.set(footnote.id, footnote)
      this.currentNumber = Math.max(this.currentNumber, footnote.number + 1)
    })

    // Restore references
    data.references.forEach(({ blockId, footnoteIds }) => {
      this.footnoteReferences.set(blockId, footnoteIds)
    })
  }
}

// Singleton instance
export const footnoteManager = new FootnoteManager()