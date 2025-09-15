# 409A Valuation Report Template Integration Guide

This guide explains how to integrate the 409A valuation report template with TinyMCE editor and Puppeteer for PDF generation.

## Files Overview

1. **409a-valuation-template.html** - The complete HTML template with CSS styling
2. **409a-template-helpers.js** - JavaScript helper functions and utilities
3. **409A-TEMPLATE-INTEGRATION-GUIDE.md** - This documentation file

## Template Features

- **Professional Layout**: Print-ready CSS optimized for A4 PDF generation
- **Template Variables**: 70+ placeholder variables using `{{VARIABLE_NAME}}` syntax
- **Responsive Design**: Works in both editor and PDF formats
- **TinyMCE Compatible**: Styled for rich text editing
- **Section-based Structure**: Organized into logical sections matching the original PDF

## Template Variables

All template variables use the format `{{VARIABLE_NAME}}`. Key categories:

### Company Information
- `{{COMPANY_NAME}}` - Company name
- `{{SECURITY}}` - Security type (e.g., "Ordinary Shares")
- `{{VALUATION_DATE}}` - Date of valuation
- `{{FMV}}` - Fair market value result

### Contact Information
- `{{DESIGNEE_FIRST_NAME}}`, `{{DESIGNEE_LAST_NAME}}` - Report recipient
- `{{DESIGNEE_TITLE}}` - Title of recipient

### Business Details
- `{{BUSINESS_DESCRIPTION}}` - Company description
- `{{MARKET_DESCRIPTION}}` - Market focus
- `{{PRODUCTS}}` - Product descriptions

### Valuation Data
- `{{BACKSOLVE_EQUITY_VALUE}}` - Equity value from backsolve
- `{{VOLATILITY}}` - Volatility percentage
- `{{OPM_TIME_TO_LIQUIDITY}}` - Time to liquidity event

## Integration with TinyMCE

### 1. Basic Setup

```javascript
import { TINYMCE_CONFIG, replaceTemplateVariables } from './409a-template-helpers.js';

// Initialize TinyMCE with 409A template configuration
tinymce.init({
  ...TINYMCE_CONFIG,
  selector: '#report-editor',
  setup: function(editor) {
    // Add custom button for variable insertion
    editor.ui.registry.addButton('insertvariable', {
      text: 'Insert Variable',
      onAction: function() {
        // Show variable picker dialog
        showVariablePicker(editor);
      }
    });
  }
});

// Load template into editor
async function loadTemplate() {
  const response = await fetch('./409a-valuation-template.html');
  const template = await response.text();
  tinymce.get('report-editor').setContent(template);
}
```

### 2. Variable Management

```javascript
// Create a new report instance
const report = create409AReport({
  COMPANY_NAME: 'TechCorp Inc.',
  VALUATION_DATE: 'December 31, 2023',
  FMV: '$3.25'
});

// Update template variables
report.setData({
  DESIGNEE_FIRST_NAME: 'John',
  DESIGNEE_LAST_NAME: 'Smith',
  BUSINESS_DESCRIPTION: 'AI-powered SaaS platform'
});

// Generate HTML with variables replaced
const htmlContent = tinymce.get('report-editor').getContent();
const populatedHTML = replaceTemplateVariables(htmlContent, report.getData());
```

### 3. Variable Picker Component (React Example)

```jsx
import React, { useState } from 'react';

const VariablePicker = ({ onInsert, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('company');

  const variableCategories = {
    company: ['COMPANY_NAME', 'SECURITY', 'VALUATION_DATE'],
    contact: ['DESIGNEE_FIRST_NAME', 'DESIGNEE_LAST_NAME'],
    business: ['BUSINESS_DESCRIPTION', 'PRODUCTS'],
    valuation: ['FMV', 'BACKSOLVE_EQUITY_VALUE']
  };

  return (
    <div className="variable-picker">
      <div className="categories">
        {Object.keys(variableCategories).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? 'active' : ''}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="variables">
        {variableCategories[selectedCategory].map(variable => (
          <div
            key={variable}
            className="variable-item"
            onClick={() => onInsert(`{{${variable}}}`)}
          >
            {variable}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## PDF Generation with Puppeteer

### 1. Server-side Implementation (Node.js)

```javascript
const puppeteer = require('puppeteer');
const { replaceTemplateVariables } = require('./409a-template-helpers.js');
const fs = require('fs').promises;

async function generate409APDF(reportData, outputPath) {
  try {
    // Load HTML template
    const templateHTML = await fs.readFile('./409a-valuation-template.html', 'utf8');

    // Replace template variables
    const populatedHTML = replaceTemplateVariables(templateHTML, reportData);

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content and generate PDF
    await page.setContent(populatedHTML, {
      waitUntil: 'networkidle0'
    });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 1in;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });

    await browser.close();

    // Save PDF
    await fs.writeFile(outputPath, pdf);

    return { success: true, path: outputPath };

  } catch (error) {
    console.error('PDF generation failed:', error);
    return { success: false, error: error.message };
  }
}

// Usage
const reportData = {
  COMPANY_NAME: 'TechCorp Inc.',
  VALUATION_DATE: 'December 31, 2023',
  FMV: '$3.25',
  // ... other variables
};

generate409APDF(reportData, './output/valuation-report.pdf');
```

### 2. API Endpoint (Express.js)

```javascript
const express = require('express');
const app = express();

app.post('/api/generate-409a-report', async (req, res) => {
  try {
    const reportData = req.body;

    // Validate required fields
    const validation = validateTemplateVariables(reportData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Missing required variables',
        missingVariables: validation.missingVariables
      });
    }

    // Generate PDF
    const result = await generate409APDF(reportData, `./temp/report-${Date.now()}.pdf`);

    if (result.success) {
      // Send PDF file
      res.download(result.path, '409a-valuation-report.pdf', (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up temp file
        fs.unlink(result.path).catch(console.error);
      });
    } else {
      res.status(500).json({ error: result.error });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Next.js Integration

### 1. Pages/API Route

```javascript
// pages/api/generate-report.js
import { generate409APDF, validateTemplateVariables } from '../../lib/409a-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const reportData = req.body;

    const validation = validateTemplateVariables(reportData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        missing: validation.missingVariables
      });
    }

    const pdfBuffer = await generate409APDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=409a-report.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 2. React Component

```jsx
// components/ReportEditor.jsx
import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { create409AReport, TINYMCE_CONFIG } from '../lib/409a-helpers';

export default function ReportEditor() {
  const editorRef = useRef(null);
  const [reportData, setReportData] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);

    try {
      const editorContent = editorRef.current.getContent();

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          htmlContent: editorContent
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '409a-valuation-report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="report-editor">
      <div className="toolbar">
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </button>
      </div>

      <Editor
        ref={editorRef}
        init={{
          ...TINYMCE_CONFIG,
          height: 600
        }}
      />
    </div>
  );
}
```

## Styling Considerations

### Print-Specific CSS
The template includes print-specific styles for PDF generation:

```css
@page {
  size: A4;
  margin: 1in;
}

@media print {
  .page-break {
    page-break-before: always;
  }

  .section {
    page-break-inside: avoid;
  }
}
```

### Template Variable Highlighting
Variables are highlighted in the editor for easy identification:

```css
.template-var {
  background: #fef3c7;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
  color: #92400e;
}
```

## Best Practices

1. **Validation**: Always validate template data before PDF generation
2. **Error Handling**: Implement proper error handling for missing variables
3. **Performance**: Cache template HTML to avoid file reads on each generation
4. **Security**: Sanitize user input before template replacement
5. **Testing**: Test PDF output with various data combinations

## Troubleshooting

### Common Issues

1. **Missing Variables**: Use `validateTemplateVariables()` to check for required fields
2. **PDF Formatting**: Ensure CSS is print-friendly and test with different data lengths
3. **Memory Issues**: Use Puppeteer pool for high-volume PDF generation
4. **Font Issues**: Include web-safe fonts or embed custom fonts

### Debug Mode

```javascript
// Enable debug mode for template variable tracking
const debugHTML = replaceTemplateVariables(template, data, { debug: true });
console.log('Unreplaced variables:', extractTemplateVariables(debugHTML));
```

This integration provides a complete solution for editing and generating professional 409A valuation reports using TinyMCE and Puppeteer.