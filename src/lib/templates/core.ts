import type { ReportTemplate, TemplateBlock, TemplateVariable, GeneratedReport } from './types';

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
      status?: 'draft' | 'final';
      watermark?: boolean;
    } = {}
  ): GeneratedReport {
    const processedSections = template.sections.map(section => ({
      ...section,
      blocks: this.processBlocks(section.blocks, data, template.variables)
    }));

    const html = this.generateHTML({
      ...template,
      sections: processedSections
    }, options);

    return {
      id: this.generateId(),
      templateId: template.id,
      generatedAt: new Date().toISOString(),
      data,
      html,
      status: options.status || 'draft',
      watermark: options.watermark || false
    };
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
      .filter(block => this.shouldDisplayBlock(block, data))
      .map(block => ({
        ...block,
        content: this.processContent(block.content, data, variables),
        children: block.children ? this.processBlocks(block.children, data, variables) : undefined
      }));
  }

  /**
   * Determines if a block should be displayed based on conditional display rules
   */
  private static shouldDisplayBlock(block: TemplateBlock, data: Record<string, any>): boolean {
    if (!block.conditionalDisplay) return true;

    const { variable, condition, value } = block.conditionalDisplay;
    const dataValue = data[variable];

    switch (condition) {
      case 'exists':
        return dataValue !== undefined && dataValue !== null && dataValue !== '';
      case 'equals':
        return dataValue === value;
      case 'notEquals':
        return dataValue !== value;
      case 'greaterThan':
        return typeof dataValue === 'number' && typeof value === 'number' && dataValue > value;
      case 'lessThan':
        return typeof dataValue === 'number' && typeof value === 'number' && dataValue < value;
      default:
        return true;
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
        return content.map(item => this.processContent(item, data, variables));
      }
      return content;
    }

    // Replace template variables in the format {{variable_name}}
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const variable = variables.find(v => v.id === variableName.trim());
      const value = data[variableName.trim()];

      if (value === undefined || value === null) {
        return variable?.defaultValue || match; // Keep placeholder if no value
      }

      return this.formatValue(value, variable);
    });
  }

  /**
   * Formats a value based on its variable type and format specification
   */
  private static formatValue(value: any, variable?: TemplateVariable): string {
    if (!variable) return String(value);

    switch (variable.type) {
      case 'currency':
        return this.formatCurrency(value);
      case 'percentage':
        return this.formatPercentage(value);
      case 'date':
        return this.formatDate(value, variable.format);
      case 'number':
        return this.formatNumber(value);
      default:
        return String(value);
    }
  }

  /**
   * Formats currency values
   */
  private static formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }

  /**
   * Formats percentage values
   */
  private static formatPercentage(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);

    // If value is already in percentage format (like 30), divide by 100
    const percentValue = numValue > 1 ? numValue / 100 : numValue;
    
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentValue);
  }

  /**
   * Formats date values
   */
  private static formatDate(value: string | Date, format?: string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);

    if (!format) {
      return date.toLocaleDateString('en-US');
    }

    // Simple format mapping
    switch (format) {
      case 'MMMM DD, YYYY':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'MM/DD/YYYY':
        return date.toLocaleDateString('en-US');
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString('en-US');
    }
  }

  /**
   * Formats number values
   */
  private static formatNumber(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);

    return new Intl.NumberFormat('en-US').format(numValue);
  }

  /**
   * Generates HTML from a processed template
   */
  private static generateHTML(template: ReportTemplate, options: { status?: 'draft' | 'final'; watermark?: boolean } = {}): string {
    const { watermark = false } = options;
    const watermarkHTML = watermark && template.settings?.watermark?.enabled ? `
      <div class="watermark" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72px;
        color: rgba(0, 0, 0, ${template.settings.watermark.opacity || 0.1});
        z-index: -1;
        pointer-events: none;
        user-select: none;
      ">
        ${template.settings.watermark.text || 'DRAFT'}
      </div>
    ` : '';

    const sectionsHTML = template.sections.map(section => {
      const sectionClass = section.pageBreakBefore ? 'page-break-before' : '';
      const pageBreakAfter = section.pageBreakAfter ? 'page-break-after' : '';
      
      const blocksHTML = section.blocks.map(block => this.generateBlockHTML(block)).join('\n');
      
      return `
        <section class="template-section ${sectionClass} ${pageBreakAfter}">
          ${blocksHTML}
        </section>
      `;
    }).join('\n');

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
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates HTML for individual blocks
   */
  private static generateBlockHTML(block: TemplateBlock): string {
    const styles = this.getBlockStyles(block.styling);
    const styleAttr = styles ? ` style="${styles}"` : '';
    const blockId = block.id ? ` id="${block.id}"` : '';
    
    switch (block.type) {
      case 'header':
        return `<h1 class="template-header"${blockId}${styleAttr}>${block.content}</h1>`;
      
      case 'paragraph':
        const paragraphContent = String(block.content).replace(/\n/g, '<br>');
        return `<p class="template-paragraph"${blockId}${styleAttr}>${paragraphContent}</p>`;
      
      case 'list':
        if (Array.isArray(block.content)) {
          const listItems = block.content.map(item => `<li>${item}</li>`).join('\n');
          return `<ul class="template-list"${blockId}${styleAttr}>${listItems}</ul>`;
        }
        return `<div class="template-list"${blockId}${styleAttr}>${block.content}</div>`;
      
      case 'table':
        return `<div class="template-table"${blockId}${styleAttr}>[Table content will be implemented]</div>`;
      
      case 'chart':
        return `<div class="template-chart"${blockId}${styleAttr}>[Chart will be implemented]</div>`;
      
      case 'pageBreak':
        return `<div class="page-break"${blockId}></div>`;
      
      default:
        return `<div class="template-text"${blockId}${styleAttr}>${block.content}</div>`;
    }
  }

  /**
   * Converts block styling object to CSS string
   */
  private static getBlockStyles(styling?: any): string {
    if (!styling) return '';
    
    const styles: string[] = [];
    
    if (styling.fontSize) styles.push(`font-size: ${styling.fontSize}px`);
    if (styling.fontFamily) styles.push(`font-family: ${styling.fontFamily}`);
    if (styling.fontWeight) styles.push(`font-weight: ${styling.fontWeight}`);
    if (styling.fontStyle) styles.push(`font-style: ${styling.fontStyle}`);
    if (styling.textAlign) styles.push(`text-align: ${styling.textAlign}`);
    if (styling.color) styles.push(`color: ${styling.color}`);
    if (styling.backgroundColor) styles.push(`background-color: ${styling.backgroundColor}`);
    if (styling.padding) styles.push(`padding: ${styling.padding}`);
    if (styling.margin) styles.push(`margin: ${styling.margin}`);
    if (styling.textDecoration) styles.push(`text-decoration: ${styling.textDecoration}`);
    
    return styles.join('; ');
  }

  /**
   * Returns default CSS styles for the report
   */
  private static getDefaultStyles(template: ReportTemplate): string {
    const margins = template.settings?.margins || {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in'
    };

    return `
      @page {
        size: ${template.settings?.paperSize || 'letter'} ${template.settings?.orientation || 'portrait'};
        margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: #1f2937;
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
      
      .page-break-before {
        page-break-before: always;
      }
      
      .page-break-after {
        page-break-after: always;
      }
      
      .page-break {
        page-break-after: always;
      }
      
      .template-header {
        margin: 1rem 0;
        font-weight: bold;
      }
      
      .template-paragraph {
        margin: 0.5rem 0;
        text-align: justify;
      }
      
      .template-list {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }
      
      .template-list li {
        margin: 0.25rem 0;
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
      }
    `;
  }

  /**
   * Generates a unique ID for reports
   */
  private static generateId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validates template data against variable requirements
   */
  static validateData(template: ReportTemplate, data: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    template.variables.forEach(variable => {
      if (variable.required && (data[variable.id] === undefined || data[variable.id] === null || data[variable.id] === '')) {
        errors.push(`Required variable '${variable.name}' (${variable.id}) is missing`);
      }
    });

    // Type validation
    template.variables.forEach(variable => {
      const value = data[variable.id];
      if (value !== undefined && value !== null && value !== '') {
        if (variable.type === 'number' && isNaN(Number(value))) {
          warnings.push(`Variable '${variable.name}' should be a number but got: ${value}`);
        }
        if (variable.type === 'date' && isNaN(Date.parse(value))) {
          warnings.push(`Variable '${variable.name}' should be a valid date but got: ${value}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default TemplateEngine;