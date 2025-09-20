import fs from 'fs/promises';
import path from 'path';

export class TemplateService {
  private templateCache: Map<string, string> = new Map();

  async generateHTML(templateVariables: Record<string, any>, customContent?: string): Promise<string> {
    try {
      // Load the base template
      const baseTemplate = await this.loadTemplate('409a-valuation-template.html');

      // Substitute template variables
      let htmlContent = this.substituteVariables(baseTemplate, templateVariables);

      // Insert custom content if provided
      if (customContent) {
        htmlContent = htmlContent.replace('{{CUSTOM_CONTENT}}', customContent);
      } else {
        htmlContent = htmlContent.replace('{{CUSTOM_CONTENT}}', '');
      }

      return htmlContent;
    } catch (error) {
      console.error('❌ Template generation error:', error);
      throw new Error(`Template generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Look in the project root directory for the template
      const templatePath = path.join(__dirname, '..', '..', '..', templateName);
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      // If template file doesn't exist, create a default one
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('📝 Creating default template...');
        const defaultTemplate = this.getDefaultTemplate();
        await this.saveTemplate(templateName, defaultTemplate);
        this.templateCache.set(templateName, defaultTemplate);
        return defaultTemplate;
      }
      throw error;
    }
  }

  private async saveTemplate(templateName: string, content: string): Promise<void> {
    const templatesDir = path.join(__dirname, '..', 'templates');
    const templatePath = path.join(templatesDir, templateName);

    // Ensure the templates directory exists
    try {
      await fs.mkdir(templatesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    await fs.writeFile(templatePath, content, 'utf-8');
  }

  private substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    // Replace all variables in format {{VARIABLE_NAME}}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key.toUpperCase()}}}`, 'g');
      const formattedValue = this.formatValue(value);
      result = result.replace(placeholder, formattedValue);
    }

    // Handle complex object properties like {{COMPANY.NAME}}
    result = this.substituteNestedVariables(result, variables);

    return result;
  }

  private substituteNestedVariables(template: string, variables: Record<string, any>): string {
    const nestedPattern = /{{([A-Z_]+)\.([A-Z_]+)(?:\.([A-Z_]+))?}}/g;

    return template.replace(nestedPattern, (match, obj, prop, subProp) => {
      try {
        const objValue = variables[obj.toLowerCase()];
        if (!objValue || typeof objValue !== 'object') {
          return match; // Keep original if object not found
        }

        let value = objValue[prop.toLowerCase()];
        if (subProp && value && typeof value === 'object') {
          value = value[subProp.toLowerCase()];
        }

        return this.formatValue(value) || match;
      } catch {
        return match; // Keep original on error
      }
    });
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      // Format numbers with commas for currency/large numbers
      return value.toLocaleString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (Array.isArray(value)) {
      return value.map(item => this.formatValue(item)).join(', ');
    }

    return String(value);
  }

  private getDefaultTemplate(): string {
    const templateParts = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '    <meta charset="UTF-8">',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '    <title>409A Valuation Report</title>',
      '    <style>',
      '        * {',
      '            margin: 0;',
      '            padding: 0;',
      '            box-sizing: border-box;',
      '        }',
      '',
      '        body {',
      '            font-family: \'Times New Roman\', Times, serif;',
      '            line-height: 1.6;',
      '            color: #333;',
      '            font-size: 12pt;',
      '        }',
      '',
      '        .header {',
      '            text-align: center;',
      '            margin-bottom: 40px;',
      '            border-bottom: 2px solid #2c3e50;',
      '            padding-bottom: 20px;',
      '        }',
      '',
      '        .header h1 {',
      '            font-size: 24pt;',
      '            font-weight: bold;',
      '            margin-bottom: 10px;',
      '            color: #2c3e50;',
      '        }',
      '',
      '        .header .subtitle {',
      '            font-size: 16pt;',
      '            color: #34495e;',
      '            margin-bottom: 5px;',
      '        }',
      '',
      '        .section {',
      '            margin-bottom: 30px;',
      '            page-break-inside: avoid;',
      '        }',
      '',
      '        .section-title {',
      '            font-size: 16pt;',
      '            font-weight: bold;',
      '            color: #2c3e50;',
      '            border-bottom: 1px solid #bdc3c7;',
      '            padding-bottom: 5px;',
      '            margin-bottom: 15px;',
      '        }',
      '',
      '        .info-grid {',
      '            display: grid;',
      '            grid-template-columns: 1fr 1fr;',
      '            gap: 20px;',
      '            margin-bottom: 20px;',
      '        }',
      '',
      '        .info-item {',
      '            display: flex;',
      '            justify-content: space-between;',
      '            margin-bottom: 8px;',
      '            padding: 5px 0;',
      '            border-bottom: 1px dotted #ecf0f1;',
      '        }',
      '',
      '        .info-label {',
      '            font-weight: bold;',
      '            color: #2c3e50;',
      '        }',
      '',
      '        .info-value {',
      '            color: #34495e;',
      '            text-align: right;',
      '        }',
      '',
      '        .table {',
      '            width: 100%;',
      '            border-collapse: collapse;',
      '            margin: 20px 0;',
      '        }',
      '',
      '        .table th,',
      '        .table td {',
      '            border: 1px solid #bdc3c7;',
      '            padding: 12px;',
      '            text-align: left;',
      '        }',
      '',
      '        .table th {',
      '            background-color: #ecf0f1;',
      '            font-weight: bold;',
      '            color: #2c3e50;',
      '        }',
      '',
      '        .table tr:nth-child(even) {',
      '            background-color: #f8f9fa;',
      '        }',
      '',
      '        .highlight {',
      '            background-color: #fff3cd;',
      '            padding: 15px;',
      '            border-left: 4px solid #ffc107;',
      '            margin: 20px 0;',
      '        }',
      '',
      '        .custom-content {',
      '            margin: 30px 0;',
      '            padding: 20px;',
      '            background-color: #f8f9fa;',
      '            border-radius: 5px;',
      '        }',
      '',
      '        @media print {',
      '            body {',
      '                margin: 0;',
      '            }',
      '',
      '            .section {',
      '                page-break-inside: avoid;',
      '            }',
      '',
      '            .table {',
      '                font-size: 10pt;',
      '            }',
      '        }',
      '    </style>',
      '</head>',
      '<body>',
      '    <div class="header">',
      '        <h1>409A Valuation Report</h1>',
      '        <div class="subtitle">Fair Market Value Assessment</div>',
      '        <div class="subtitle">{{COMPANY.NAME}}</div>',
      '        <div>Report Date: {{VALUATION_DATE}}</div>',
      '    </div>',
      '',
      '    <div class="section">',
      '        <h2 class="section-title">Executive Summary</h2>',
      '        <div class="highlight">',
      '            <p><strong>Fair Market Value per Share:</strong> ${{FAIR_MARKET_VALUE}}</p>',
      '            <p><strong>Valuation Date:</strong> {{VALUATION_DATE}}</p>',
      '            <p><strong>Total Equity Value:</strong> ${{TOTAL_EQUITY_VALUE}}</p>',
      '        </div>',
      '    </div>',
      '',
      '    <div class="section">',
      '        <h2 class="section-title">Company Information</h2>',
      '        <div class="info-grid">',
      '            <div>',
      '                <div class="info-item">',
      '                    <span class="info-label">Company Name:</span>',
      '                    <span class="info-value">{{COMPANY.NAME}}</span>',
      '                </div>',
      '                <div class="info-item">',
      '                    <span class="info-label">State of Incorporation:</span>',
      '                    <span class="info-value">{{COMPANY.STATE}}</span>',
      '                </div>',
      '                <div class="info-item">',
      '                    <span class="info-label">Business Description:</span>',
      '                    <span class="info-value">{{COMPANY.DESCRIPTION}}</span>',
      '                </div>',
      '            </div>',
      '            <div>',
      '                <div class="info-item">',
      '                    <span class="info-label">Total Shares Outstanding:</span>',
      '                    <span class="info-value">{{TOTAL_SHARES}}</span>',
      '                </div>',
      '                <div class="info-item">',
      '                    <span class="info-label">Valuation Method:</span>',
      '                    <span class="info-value">{{VALUATION_METHOD}}</span>',
      '                </div>',
      '                <div class="info-item">',
      '                    <span class="info-label">Report Date:</span>',
      '                    <span class="info-value">{{REPORT_DATE}}</span>',
      '                </div>',
      '            </div>',
      '        </div>',
      '    </div>',
      '',
      '    <div class="section">',
      '        <h2 class="section-title">Financial Summary</h2>',
      '        <table class="table">',
      '            <thead>',
      '                <tr>',
      '                    <th>Metric</th>',
      '                    <th>Value</th>',
      '                    <th>Notes</th>',
      '                </tr>',
      '            </thead>',
      '            <tbody>',
      '                <tr>',
      '                    <td>Revenue (Latest 12 Months)</td>',
      '                    <td>${{REVENUE}}</td>',
      '                    <td>{{REVENUE_NOTES}}</td>',
      '                </tr>',
      '                <tr>',
      '                    <td>EBITDA</td>',
      '                    <td>${{EBITDA}}</td>',
      '                    <td>{{EBITDA_NOTES}}</td>',
      '                </tr>',
      '                <tr>',
      '                    <td>Total Assets</td>',
      '                    <td>${{TOTAL_ASSETS}}</td>',
      '                    <td>{{ASSETS_NOTES}}</td>',
      '                </tr>',
      '                <tr>',
      '                    <td>Total Liabilities</td>',
      '                    <td>${{TOTAL_LIABILITIES}}</td>',
      '                    <td>{{LIABILITIES_NOTES}}</td>',
      '                </tr>',
      '            </tbody>',
      '        </table>',
      '    </div>',
      '',
      '    <div class="section">',
      '        <h2 class="section-title">Valuation Analysis</h2>',
      '        <p>This valuation was conducted using the {{VALUATION_METHOD}} approach, considering multiple factors including financial performance, market conditions, and comparable company analysis.</p>',
      '',
      '        <div class="highlight">',
      '            <p><strong>Key Valuation Assumptions:</strong></p>',
      '            <ul>',
      '                <li>Discount Rate: {{DISCOUNT_RATE}}%</li>',
      '                <li>Terminal Growth Rate: {{TERMINAL_GROWTH_RATE}}%</li>',
      '                <li>Market Multiple: {{MARKET_MULTIPLE}}x</li>',
      '            </ul>',
      '        </div>',
      '    </div>',
      '',
      '    <div class="section custom-content">',
      '        <h2 class="section-title">Additional Analysis</h2>',
      '        {{CUSTOM_CONTENT}}',
      '    </div>',
      '',
      '    <div class="section">',
      '        <h2 class="section-title">Conclusion</h2>',
      '        <p>Based on our analysis, the fair market value of {{COMPANY.NAME}} common stock as of {{VALUATION_DATE}} is <strong>${{FAIR_MARKET_VALUE}} per share</strong>.</p>',
      '',
      '        <p style="margin-top: 20px;">This valuation is based on information available as of the valuation date and is subject to the assumptions and limitations outlined in this report.</p>',
      '    </div>',
      '',
      '    <div class="section" style="margin-top: 40px; font-size: 10pt; color: #666;">',
      '        <p><em>This report was generated using the 409A Report Generator Module. Report prepared on {{REPORT_GENERATION_DATE}}.</em></p>',
      '    </div>',
      '</body>',
      '</html>'
    ];

    return templateParts.join('\n');
  }

  clearCache(): void {
    this.templateCache.clear();
  }
}