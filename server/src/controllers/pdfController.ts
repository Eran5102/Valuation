import { Request, Response } from 'express';
import { PdfGenerationService } from '../services/pdfGenerationService';
import { TemplateService } from '../services/templateService';

interface GeneratePDFRequest {
  templateVariables: Record<string, any>;
  customContent?: string;
  reportSettings?: {
    includeHeader?: boolean;
    includeFooter?: boolean;
    watermark?: string;
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
  };
}

export const pdfController = {
  async generatePDF(req: Request, res: Response) {
    try {
      const { templateVariables, customContent, reportSettings }: GeneratePDFRequest = req.body;

      // Validate required fields
      if (!templateVariables) {
        return res.status(400).json({
          error: 'Template variables are required',
          message: 'Please provide templateVariables object with valuation data'
        });
      }

      console.log('📋 Generating PDF with variables:', Object.keys(templateVariables));

      // Generate HTML content from template
      const templateService = new TemplateService();
      const htmlContent = await templateService.generateHTML(templateVariables, customContent);

      // Generate PDF from HTML
      const pdfService = new PdfGenerationService();
      const pdfBuffer = await pdfService.generatePDF(htmlContent, reportSettings);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="409A-Valuation-Report.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF buffer
      res.send(pdfBuffer);

      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    } catch (error) {
      console.error('❌ PDF generation failed:', error);

      if (error instanceof Error) {
        res.status(500).json({
          error: 'PDF generation failed',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        res.status(500).json({
          error: 'PDF generation failed',
          message: 'An unknown error occurred'
        });
      }
    }
  },

  async generateTemplatePreview(req: Request, res: Response) {
    try {
      const { templateVariables, customContent }: GeneratePDFRequest = req.body;

      // Validate required fields
      if (!templateVariables) {
        return res.status(400).json({
          error: 'Template variables are required',
          message: 'Please provide templateVariables object with valuation data'
        });
      }

      console.log('👁️ Generating template preview with variables:', Object.keys(templateVariables));

      // Generate HTML content from template
      const templateService = new TemplateService();
      const htmlContent = await templateService.generateHTML(templateVariables, customContent);

      // Set response headers for HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      // Send HTML content
      res.send(htmlContent);

      console.log('✅ Template preview generated successfully');

    } catch (error) {
      console.error('❌ Template preview generation failed:', error);

      if (error instanceof Error) {
        res.status(500).json({
          error: 'Template preview generation failed',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      } else {
        res.status(500).json({
          error: 'Template preview generation failed',
          message: 'An unknown error occurred'
        });
      }
    }
  },

  // Generate PDF directly from HTML content
  async generatePDFFromHTML(req: Request, res: Response) {
    try {
      const { htmlContent, reportSettings, fileName } = req.body;

      if (!htmlContent) {
        return res.status(400).json({
          error: 'HTML content is required'
        });
      }

      console.log('📋 Generating PDF from HTML content directly');

      // Use the PDF generation service
      const pdfService = new PdfGenerationService();
      const pdfBuffer = await pdfService.generatePDF(htmlContent, {
        includeHeader: reportSettings?.includeHeader || false,
        includeFooter: reportSettings?.includeFooter || false,
        format: reportSettings?.format || 'A4',
        orientation: reportSettings?.orientation || 'portrait'
      });

      // Set response headers for PDF download
      const filename = fileName || `409A-Report-${new Date().toISOString().split('T')[0]}`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      console.log('✅ PDF generated successfully from HTML');
      res.send(pdfBuffer);

    } catch (error) {
      console.error('❌ PDF generation from HTML failed:', error);
      res.status(500).json({
        error: 'PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};