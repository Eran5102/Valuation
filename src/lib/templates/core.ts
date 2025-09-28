import type { ReportTemplate, TemplateBlock, TemplateVariable, GeneratedReport } from './types'
import { footnoteManager, type Footnote } from './footnoteManager'

/**
 * Core template engine for processing templates and generating reports
 */
export class TemplateEngine {
  /**
   * Processes a template with provided data to generate a report
   */
  static processTemplate(
    template: ReportTemplate,
    data: Record<string, any>,
    options: {
      status?: 'draft' | 'final'
      watermark?: boolean
    } = {}
  ): GeneratedReport {
    const processedSections = template.sections.map((section) => ({
      ...section,
      blocks: this.processBlocks(section.blocks, data, template.variables),
    }))

    const html = this.generateHTML(
      {
        ...template,
        sections: processedSections,
      },
      options,
      data
    )

    return {
      id: this.generateId(),
      templateId: template.id,
      generatedAt: new Date().toISOString(),
      data,
      html,
      status: options.status || 'draft',
      watermark: options.watermark || false,
    }
  }

  /**
   * Processes blocks recursively, substituting variables and applying conditional logic
   */
  private static processBlocks(
    blocks: TemplateBlock[],
    data: Record<string, any>,
    variables: TemplateVariable[]
  ): TemplateBlock[] {
    return blocks
      .filter((block) => this.shouldDisplayBlock(block, data))
      .map((block) => ({
        ...block,
        content: this.processContent(block.content, data, variables),
        children: block.children ? this.processBlocks(block.children, data, variables) : undefined,
      }))
  }

  /**
   * Determines if a block should be displayed based on conditional display rules
   */
  private static shouldDisplayBlock(block: TemplateBlock, data: Record<string, any>): boolean {
    if (!block.conditionalDisplay) return true

    const { variable, condition, value } = block.conditionalDisplay
    const dataValue = data[variable]

    switch (condition) {
      case 'exists':
        return dataValue !== undefined && dataValue !== null && dataValue !== ''
      case 'equals':
        return dataValue === value
      case 'notEquals':
        return dataValue !== value
      case 'greaterThan':
        return typeof dataValue === 'number' && typeof value === 'number' && dataValue > value
      case 'lessThan':
        return typeof dataValue === 'number' && typeof value === 'number' && dataValue < value
      default:
        return true
    }
  }

  /**
   * Processes content by substituting template variables with actual data
   */
  private static processContent(
    content: string | any,
    data: Record<string, any>,
    variables: TemplateVariable[]
  ): string | any {
    if (typeof content !== 'string') {
      if (Array.isArray(content)) {
        return content.map((item) => this.processContent(item, data, variables))
      }
      return content
    }

    // Replace template variables in the format {{variable_name}}
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const variable = variables.find((v) => v.id === variableName.trim())
      const value = data[variableName.trim()]

      if (value === undefined || value === null) {
        return variable?.defaultValue || match // Keep placeholder if no value
      }

      return this.formatValue(value, variable)
    })
  }

  /**
   * Formats a value based on its variable type and format specification
   */
  private static formatValue(value: any, variable?: TemplateVariable): string {
    if (!variable) return String(value)

    switch (variable.type) {
      case 'currency':
        return this.formatCurrency(value)
      case 'percentage':
        return this.formatPercentage(value)
      case 'date':
        return this.formatDate(value, variable.format)
      case 'number':
        return this.formatNumber(value)
      default:
        return String(value)
    }
  }

  /**
   * Formats currency values
   */
  private static formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return String(value)

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue)
  }

  /**
   * Formats percentage values
   */
  private static formatPercentage(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return String(value)

    // If value is already in percentage format (like 30), divide by 100
    const percentValue = numValue > 1 ? numValue / 100 : numValue

    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(percentValue)
  }

  /**
   * Formats date values
   */
  private static formatDate(value: string | Date, format?: string): string {
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) return String(value)

    if (!format) {
      return date.toLocaleDateString('en-US')
    }

    // Simple format mapping
    switch (format) {
      case 'MMMM DD, YYYY':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      case 'MM/DD/YYYY':
        return date.toLocaleDateString('en-US')
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0]
      default:
        return date.toLocaleDateString('en-US')
    }
  }

  /**
   * Formats number values
   */
  private static formatNumber(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return String(value)

    return new Intl.NumberFormat('en-US').format(numValue)
  }

  /**
   * Generates HTML from a processed template
   */
  private static generateHTML(
    template: ReportTemplate,
    options: { status?: 'draft' | 'final'; watermark?: boolean } = {},
    data: Record<string, any> = {}
  ): string {
    // Reset footnote manager for new document
    footnoteManager.reset()
    const { watermark = false } = options
    // Show watermark if either the option is true OR template settings enable it
    const shouldShowWatermark = watermark || template.settings?.watermark?.enabled
    const watermarkSettings = template.settings?.watermark || {}
    const angle = (watermarkSettings as any).angle ?? -45
    const fontSize = (watermarkSettings as any).fontSize || 72
    const opacity = (watermarkSettings as any).opacity || 0.1
    const text = (watermarkSettings as any).text || 'DRAFT'
    const position = (watermarkSettings as any).position || 'center'

    let watermarkHTML = ''
    if (shouldShowWatermark) {
      if (position === 'pattern') {
        // Repeating pattern
        watermarkHTML = `
          <div class="watermark-pattern" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: -1;
            pointer-events: none;
            user-select: none;
            overflow: hidden;
          ">
            ${Array(6)
              .fill(0)
              .map(
                (_, i) => `
              <div style="
                position: absolute;
                top: ${i * 20}%;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-around;
                transform: rotate(${angle}deg);
              ">
                ${Array(3)
                  .fill(0)
                  .map(
                    () => `
                  <span style="
                    font-size: ${fontSize}px;
                    color: rgba(0, 0, 0, ${opacity});
                    font-weight: bold;
                    text-transform: uppercase;
                  ">${text}</span>
                `
                  )
                  .join('')}
              </div>
            `
              )
              .join('')}
          </div>
        `
      } else {
        // Single watermark
        const positionStyles = {
          center: 'top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(' + angle + 'deg);',
          diagonal:
            'top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(' + angle + 'deg);',
          top: 'top: 20%; left: 50%; transform: translateX(-50%) rotate(' + angle + 'deg);',
          bottom: 'bottom: 20%; left: 50%; transform: translateX(-50%) rotate(' + angle + 'deg);',
        }

        watermarkHTML = `
          <div class="watermark" style="
            position: fixed;
            ${positionStyles[position as keyof typeof positionStyles] || positionStyles.center}
            font-size: ${fontSize}px;
            color: rgba(0, 0, 0, ${opacity});
            z-index: -1;
            pointer-events: none;
            user-select: none;
            font-weight: bold;
            text-transform: uppercase;
          ">
            ${text}
          </div>
        `
      }
    }

    const sectionsHTML = template.sections
      .map((section) => {
        const sectionClass = section.pageBreakBefore ? 'page-break-before' : ''
        const pageBreakAfter = section.pageBreakAfter ? 'page-break-after' : ''

        const blocksHTML = section.blocks.map((block) => this.generateBlockHTML(block)).join('\n')

        return `
        <section class="template-section ${sectionClass} ${pageBreakAfter}">
          ${blocksHTML}
        </section>
      `
      })
      .join('\n')

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.name}</title>
        <style>
          ${this.getDefaultStyles(template)}
        </style>
      </head>
      <body>
        ${watermarkHTML}
        <div class="report-container">
          ${sectionsHTML}
          ${footnoteManager.generateFootnotesHTML(data, 'footnote')}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generates HTML for individual blocks
   */
  private static generateBlockHTML(block: TemplateBlock): string {
    const styles = this.getBlockStyles(block.styling)
    const styleAttr = styles ? ` style="${styles}"` : ''
    const blockId = block.id ? ` id="${block.id}"` : ''

    switch (block.type) {
      case 'header':
        return `<h1 class="template-header"${blockId}${styleAttr}>${block.content}</h1>`

      case 'paragraph':
        const paragraphContent = String(block.content).replace(/\n/g, '<br>')
        return `<p class="template-paragraph"${blockId}${styleAttr}>${paragraphContent}</p>`

      case 'list':
        if (Array.isArray(block.content)) {
          const listItems = block.content.map((item) => `<li>${item}</li>`).join('\n')
          return `<ul class="template-list"${blockId}${styleAttr}>${listItems}</ul>`
        }
        return `<div class="template-list"${blockId}${styleAttr}>${block.content}</div>`

      case 'table':
        return `<div class="template-table"${blockId}${styleAttr}>[Table content will be implemented]</div>`

      case 'chart':
        return `<div class="template-chart"${blockId}${styleAttr}>[Chart will be implemented]</div>`

      case 'pageBreak':
        return `<div class="page-break"${blockId}></div>`

      case 'footnote':
        const fnContent = block.content as any
        if (fnContent && typeof fnContent === 'object') {
          const footnote = footnoteManager.addFootnote(
            fnContent.footnoteContent || '',
            block.id,
            fnContent.type || 'footnote'
          )
          const refHTML = footnoteManager.generateReferenceHTML(footnote.id)
          return `<span class="footnote-text"${blockId}${styleAttr}>${fnContent.text || ''}${refHTML}</span>`
        }
        return ''

      case 'tableOfContents':
        return this.generateTableOfContents(block, styleAttr, blockId)

      case 'coverPage':
        return this.generateCoverPage(block, styleAttr, blockId)

      case 'executiveSummary':
        return this.generateExecutiveSummary(block, styleAttr, blockId)

      case 'appendix':
        return this.generateAppendix(block, styleAttr, blockId)

      case 'bibliography':
        return this.generateBibliography(block, styleAttr, blockId)

      case 'glossary':
        return this.generateGlossary(block, styleAttr, blockId)

      case 'signatureBlock':
        return this.generateSignatureBlock(block, styleAttr, blockId)

      default:
        return `<div class="template-text"${blockId}${styleAttr}>${block.content}</div>`
    }
  }

  /**
   * Converts block styling object to CSS string
   */
  private static getBlockStyles(styling?: any): string {
    if (!styling) return ''

    const styles: string[] = []

    if (styling.fontSize) styles.push(`font-size: ${styling.fontSize}px`)
    if (styling.fontFamily) styles.push(`font-family: ${styling.fontFamily}`)
    if (styling.fontWeight) styles.push(`font-weight: ${styling.fontWeight}`)
    if (styling.fontStyle) styles.push(`font-style: ${styling.fontStyle}`)
    if (styling.textAlign) styles.push(`text-align: ${styling.textAlign}`)
    if (styling.color) styles.push(`color: ${styling.color}`)
    if (styling.backgroundColor) styles.push(`background-color: ${styling.backgroundColor}`)
    if (styling.padding) styles.push(`padding: ${styling.padding}`)
    if (styling.margin) styles.push(`margin: ${styling.margin}`)
    if (styling.textDecoration) styles.push(`text-decoration: ${styling.textDecoration}`)

    return styles.join('; ')
  }

  /**
   * Generate Table of Contents HTML
   */
  private static generateTableOfContents(
    block: TemplateBlock,
    styleAttr: string,
    blockId: string
  ): string {
    const content = block.content as any
    const title = content?.title || 'Table of Contents'
    // In a real implementation, this would scan the document for headers
    return `
      <div class="table-of-contents"${blockId}${styleAttr}>
        <h2>${title}</h2>
        <nav>
          <ul class="toc-list">
            <li><a href="#executive-summary">Executive Summary</a></li>
            <li><a href="#valuation-overview">Valuation Overview</a></li>
            <li><a href="#methodology">Methodology</a></li>
            <li><a href="#conclusion">Conclusion</a></li>
          </ul>
        </nav>
      </div>
    `
  }

  /**
   * Generate Cover Page HTML
   */
  private static generateCoverPage(
    block: TemplateBlock,
    styleAttr: string,
    blockId: string
  ): string {
    const content = block.content as any
    const title = content?.title || '409A Valuation Report'
    const subtitle = content?.subtitle || ''
    const confidentialityNotice = content?.includeConfidentiality
      ? '<div class="confidentiality-notice">CONFIDENTIAL - PROPRIETARY INFORMATION</div>'
      : ''

    return `
      <div class="cover-page"${blockId}${styleAttr}>
        <div class="cover-content">
          <h1 class="cover-title">${title}</h1>
          ${subtitle ? `<h2 class="cover-subtitle">${subtitle}</h2>` : ''}
          <div class="cover-company">{{company.name}}</div>
          <div class="cover-date">{{valuation_date}}</div>
          ${confidentialityNotice}
        </div>
      </div>
    `
  }

  /**
   * Generate Executive Summary HTML
   */
  private static generateExecutiveSummary(
    block: TemplateBlock,
    styleAttr: string,
    blockId: string
  ): string {
    const content = block.content as any
    const title = content?.title || 'Executive Summary'

    return `
      <div class="executive-summary"${blockId}${styleAttr}>
        <h2>${title}</h2>
        <div class="summary-content">
          ${content?.content || 'Executive summary content goes here...'}
        </div>
      </div>
    `
  }

  /**
   * Generate Appendix HTML
   */
  private static generateAppendix(
    block: TemplateBlock,
    styleAttr: string,
    blockId: string
  ): string {
    const content = block.content as any
    const title = content?.title || 'Appendix'

    return `
      <div class="appendix"${blockId}${styleAttr}>
        <h2>${title}</h2>
        <div class="appendix-content">
          ${content?.content || ''}
        </div>
      </div>
    `
  }

  /**
   * Generate Bibliography HTML
   */
  private static generateBibliography(
    block: TemplateBlock,
    styleAttr: string,
    blockId: string
  ): string {
    const content = block.content as any
    const title = content?.title || 'References'
    const entries = content?.entries || []

    const entriesHTML = entries
      .map((entry: any) => `<li class="bibliography-entry">${entry}</li>`)
      .join('\n')

    return `
      <div class="bibliography"${blockId}${styleAttr}>
        <h2>${title}</h2>
        <ol class="bibliography-list">
          ${entriesHTML}
        </ol>
      </div>
    `
  }

  /**
   * Generate Glossary HTML
   */
  private static generateGlossary(
    block: TemplateBlock,
    styleAttr: string,
    blockId: string
  ): string {
    const content = block.content as any
    const title = content?.title || 'Glossary'
    const terms = content?.terms || []

    const termsHTML = terms
      .map(
        (item: any) => `
      <dt class="glossary-term">${item.term}</dt>
      <dd class="glossary-definition">${item.definition}</dd>
    `
      )
      .join('\n')

    return `
      <div class="glossary"${blockId}${styleAttr}>
        <h2>${title}</h2>
        <dl class="glossary-list">
          ${termsHTML}
        </dl>
      </div>
    `
  }

  /**
   * Generate Signature Block HTML
   */
  private static generateSignatureBlock(
    block: TemplateBlock,
    styleAttr: string,
    blockId: string
  ): string {
    const content = block.content as any
    const signatories = content?.signatories || []

    const signaturesHTML = signatories
      .map(
        (sig: any) => `
      <div class="signature-item">
        <div class="signature-line"></div>
        <div class="signature-name">${sig.name || ''}</div>
        <div class="signature-title">${sig.title || ''}</div>
        <div class="signature-credentials">${sig.credentials || ''}</div>
        <div class="signature-date">${sig.date || ''}</div>
      </div>
    `
      )
      .join('\n')

    const disclaimer = content?.includeDisclaimer
      ? `
      <div class="signature-disclaimer">
        This valuation report is prepared solely for the use specified herein and may not be relied upon for any other purpose.
      </div>
    `
      : ''

    return `
      <div class="signature-block"${blockId}${styleAttr}>
        <div class="signatures-container">
          ${signaturesHTML}
        </div>
        ${disclaimer}
      </div>
    `
  }

  /**
   * Returns default CSS styles for the report
   */
  private static getDefaultStyles(template: ReportTemplate): string {
    const margins = template.settings?.margins || {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in',
    }

    // Apply theme settings - Check both settings and metadata for theme
    const theme =
      (template.settings as any)?.theme || (template.metadata as any)?.theme || 'default'
    const themeColors =
      (template.settings as any)?.themeColors || (template.metadata as any)?.themeColors

    // Use custom theme colors if available, otherwise use predefined themes
    const themes = {
      default: {
        bgColor: '#ffffff',
        textColor: '#1f2937',
        headerColor: '#111827',
        accentColor: '#3b82f6',
      },
      value8: {
        bgColor: '#f6f7f6',
        textColor: '#2e3944',
        headerColor: '#124e66',
        accentColor: '#74bd92',
      },
      professional: {
        bgColor: '#ffffff',
        textColor: '#1e293b',
        headerColor: '#1e40af',
        accentColor: '#0ea5e9',
      },
      minimal: {
        bgColor: '#ffffff',
        textColor: '#000000',
        headerColor: '#000000',
        accentColor: '#333333',
      },
      corporate: {
        bgColor: '#ffffff',
        textColor: '#111827',
        headerColor: '#b91c1c',
        accentColor: '#dc2626',
      },
      modern: {
        bgColor: '#fafafa',
        textColor: '#1f2937',
        headerColor: '#7c3aed',
        accentColor: '#06b6d4',
      },
      classic: {
        bgColor: '#fffef9',
        textColor: '#3f3f46',
        headerColor: '#27272a',
        accentColor: '#dc2626',
      },
    }

    // If custom theme colors are provided, use them
    const selectedTheme = themeColors
      ? {
          bgColor: themeColors.background || '#ffffff',
          textColor: themeColors.text || '#1f2937',
          headerColor: themeColors.primary || '#111827',
          accentColor: themeColors.accent || '#3b82f6',
        }
      : themes[theme as keyof typeof themes] || themes.default

    return `
      @page {
        size: ${template.settings?.paperSize || 'letter'} ${template.settings?.orientation || 'portrait'};
        margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: ${selectedTheme.textColor};
        background-color: ${selectedTheme.bgColor};
        margin: 0;
        padding: 0;
      }
      
      .report-container {
        max-width: 100%;
        margin: 0 auto;
      }
      
      .template-section {
        margin-bottom: 2rem;
      }
      
      /* Page breaks - Updated for better functionality */
      .page-break-before {
        page-break-before: always;
        break-before: page;
      }

      .page-break-after {
        page-break-after: always;
        break-after: page;
      }

      .page-break {
        page-break-after: always;
        break-after: page;
        display: block;
        height: 0;
        clear: both;
        visibility: hidden;
      }

      /* Visual indicators for screen/preview only */
      @media screen {
        .page-break {
          position: relative;
          height: 40px;
          margin: 40px 0;
          visibility: visible;
        }

        .page-break::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #ccc 10%, #ccc 90%, transparent 100%);
          transform: translateY(-50%);
        }

        .page-break::after {
          content: 'Page Break';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: ${selectedTheme.bgColor};
          padding: 4px 12px;
          color: #999;
          font-size: 11px;
          font-style: italic;
          font-weight: normal;
          letter-spacing: 0.5px;
          border: 1px solid #ddd;
          border-radius: 12px;
        }

        .template-section.page-break-after {
          position: relative;
          padding-bottom: 60px;
        }

        .template-section.page-break-after::after {
          content: 'Page Break After Section';
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: ${selectedTheme.bgColor};
          padding: 4px 12px;
          color: #999;
          font-size: 11px;
          font-style: italic;
          border: 1px solid #ddd;
          border-radius: 12px;
        }

        .template-section.page-break-after::before {
          content: '';
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #ccc 10%, #ccc 90%, transparent 100%);
        }
      }
      
      h1, h2, h3, h4, h5, h6,
      .template-header {
        margin: 1rem 0;
        font-weight: bold;
        color: ${selectedTheme.headerColor};
      }

      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      h4 { font-size: 1.1em; }
      h5 { font-size: 1em; }
      h6 { font-size: 0.9em; }

      .template-paragraph {
        margin: 0.5rem 0;
        text-align: justify;
        color: ${selectedTheme.textColor};
      }

      .template-list {
        margin: 1rem 0;
        padding-left: 1.5rem;
        color: ${selectedTheme.textColor};
      }

      .template-list li {
        margin: 0.25rem 0;
      }

      a {
        color: ${selectedTheme.accentColor};
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      blockquote {
        border-left: 4px solid ${selectedTheme.accentColor};
        padding-left: 1rem;
        margin: 1rem 0;
        font-style: italic;
        color: ${selectedTheme.textColor};
      }
      
      .template-table {
        margin: 1rem 0;
        width: 100%;
      }
      
      .template-chart {
        margin: 1rem 0;
        text-align: center;
      }
      
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72px;
        color: rgba(0, 0, 0, 0.1);
        z-index: -1;
        pointer-events: none;
        user-select: none;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .template-section {
          orphans: 2;
          widows: 2;
        }

        .template-header {
          page-break-after: avoid;
        }

        /* Hide visual page break indicators in print */
        .page-break::before,
        .page-break::after,
        .template-section.page-break-after::before,
        .template-section.page-break-after::after {
          display: none;
        }

        /* Ensure page breaks work in print */
        .page-break {
          page-break-after: always !important;
          break-after: page !important;
          height: 0;
          visibility: hidden;
        }

        .template-section.page-break-after {
          page-break-after: always !important;
          break-after: page !important;
          padding-bottom: 0;
        }

        .template-section.page-break-before {
          page-break-before: always !important;
          break-before: page !important;
        }
      }

      /* Footnote Styles */
      .footnote-ref {
        font-size: 0.85em;
        vertical-align: super;
        line-height: 0;
      }

      .footnote-ref a {
        text-decoration: none;
        color: ${selectedTheme.accentColor};
      }

      .footnote-ref a:hover {
        text-decoration: underline;
      }

      .footnotes-section {
        margin-top: 40px;
        padding-top: 20px;
        font-size: 0.9em;
        border-top: 1px solid #ddd;
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

      /* Table of Contents Styles */
      .table-of-contents {
        margin: 40px 0;
        padding: 20px;
        background: ${selectedTheme.bgColor};
        border: 1px solid #e5e7eb;
      }

      .toc-list {
        list-style: none;
        padding-left: 0;
      }

      .toc-list li {
        margin: 8px 0;
        padding-left: 20px;
      }

      .toc-list a {
        color: ${selectedTheme.accentColor};
        text-decoration: none;
      }

      .toc-list a:hover {
        text-decoration: underline;
      }

      /* Cover Page Styles */
      .cover-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        page-break-after: always;
      }

      .cover-title {
        font-size: 36px;
        color: ${selectedTheme.headerColor};
        margin-bottom: 20px;
      }

      .cover-subtitle {
        font-size: 24px;
        color: ${selectedTheme.textColor};
        margin-bottom: 40px;
      }

      .cover-company {
        font-size: 20px;
        font-weight: 600;
        margin: 20px 0;
        color: ${selectedTheme.accentColor};
      }

      .confidentiality-notice {
        margin-top: 60px;
        padding: 10px;
        background: #fee;
        color: #c00;
        font-weight: bold;
        text-transform: uppercase;
      }

      /* Executive Summary Styles */
      .executive-summary {
        background: ${selectedTheme.bgColor};
        border-left: 4px solid ${selectedTheme.accentColor};
        padding: 20px;
        margin: 30px 0;
      }

      /* Signature Block Styles */
      .signature-block {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
      }

      .signature-item {
        margin: 40px 0;
      }

      .signature-line {
        width: 300px;
        border-bottom: 1px solid #000;
        margin-bottom: 5px;
      }

      .signature-name {
        font-weight: bold;
      }

      .signature-disclaimer {
        margin-top: 30px;
        padding: 15px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        font-size: 10px;
        font-style: italic;
      }
    `
  }

  /**
   * Generates a unique ID for reports
   */
  private static generateId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validates template data against variable requirements
   */
  static validateData(
    template: ReportTemplate,
    data: Record<string, any>
  ): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required variables
    template.variables.forEach((variable) => {
      if (
        variable.required &&
        (data[variable.id] === undefined || data[variable.id] === null || data[variable.id] === '')
      ) {
        errors.push(`Required variable '${variable.name}' (${variable.id}) is missing`)
      }
    })

    // Type validation
    template.variables.forEach((variable) => {
      const value = data[variable.id]
      if (value !== undefined && value !== null && value !== '') {
        if (variable.type === 'number' && isNaN(Number(value))) {
          warnings.push(`Variable '${variable.name}' should be a number but got: ${value}`)
        }
        if (variable.type === 'date' && isNaN(Date.parse(value))) {
          warnings.push(`Variable '${variable.name}' should be a valid date but got: ${value}`)
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

export default TemplateEngine
