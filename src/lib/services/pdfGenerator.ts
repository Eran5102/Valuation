import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  quality?: number;
  filename?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  filename?: string;
  error?: string;
}

export class PDFGenerator {
  /**
   * Generate PDF from HTML element
   * Simple conversion - all document structure should already be in the template
   */
  static async generateFromElement(
    element: HTMLElement,
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      const {
        orientation = 'portrait',
        format = 'a4',
        quality = 2,
        filename = 'report.pdf'
      } = options;

      // Convert HTML element to canvas with high quality
      const canvas = await html2canvas(element, {
        scale: quality,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      // Create PDF with specified format
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: format.toLowerCase() as 'a4' | 'letter'
      });

      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit page
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      // Handle multi-page documents
      let position = 0;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        const currentPageHeight = Math.min(pageHeight, remainingHeight);

        // Add image to current page
        pdf.addImage(
          imgData,
          'PNG',
          0,
          -position,
          imgWidth,
          imgHeight
        );

        remainingHeight -= pageHeight;
        position += pageHeight;

        // Add new page if there's more content
        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }

      // Download the PDF
      pdf.save(filename);

      return {
        success: true,
        filename
      };

    } catch (error) {
      console.error('PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate PDF from HTML string
   * Creates temporary element and converts it
   */
  static async generateFromHTML(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      // Create temporary container
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '20px';
      tempContainer.style.boxSizing = 'border-box';

      // Add to DOM temporarily
      document.body.appendChild(tempContainer);

      // Wait for fonts and images to load
      await this.waitForContent(tempContainer);

      // Generate PDF
      const result = await this.generateFromElement(tempContainer, options);

      // Clean up
      document.body.removeChild(tempContainer);

      return result;
    } catch (error) {
      console.error('PDF generation from HTML failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Wait for images and fonts to load
   */
  private static async waitForContent(element: HTMLElement): Promise<void> {
    const promises: Promise<void>[] = [];

    // Wait for images
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.complete) {
        promises.push(
          new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Resolve even on error
          })
        );
      }
    });

    // Wait for fonts (simple check)
    promises.push(new Promise(resolve => setTimeout(resolve, 100)));

    await Promise.all(promises);
  }

  /**
   * Get suggested filename based on template and date
   */
  static generateFilename(templateName: string, companyName: string): string {
    const date = new Date().toISOString().split('T')[0];
    const cleanTemplateName = templateName.replace(/[^a-z0-9]/gi, '_');
    const cleanCompanyName = companyName.replace(/[^a-z0-9]/gi, '_');

    return `${cleanTemplateName}-${cleanCompanyName}-${date}.pdf`;
  }
}

export default PDFGenerator;