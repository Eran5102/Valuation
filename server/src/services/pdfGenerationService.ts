import puppeteer, { Browser, Page } from 'puppeteer';

interface PDFOptions {
  includeHeader?: boolean;
  includeFooter?: boolean;
  watermark?: string;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export class PdfGenerationService {
  private browser: Browser | null = null;

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async generatePDF(htmlContent: string, options: PDFOptions = {}): Promise<Buffer> {
    // Use fresh browser instance for each request to avoid connection issues
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Launch fresh browser instance with additional Windows-specific args
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        timeout: 60000
      });

      page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Set content with reduced timeout for better reliability
      await page.setContent(htmlContent, {
        waitUntil: ['domcontentloaded'],
        timeout: 20000
      });

      // Wait for content to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF with options
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: options.includeHeader || options.includeFooter,
        headerTemplate: options.includeHeader ? this.getHeaderTemplate() : '',
        footerTemplate: options.includeFooter ? this.getFooterTemplate() : '',
        preferCSSPageSize: false,
        timeout: 20000
      });

      console.log('✅ PDF generated successfully with Puppeteer');
      return Buffer.from(pdfBuffer as Uint8Array);

    } catch (error) {
      console.error('❌ Puppeteer PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up resources
      try {
        if (page) {
          await page.close();
        }
        if (browser) {
          await browser.close();
        }
      } catch (cleanupError) {
        console.error('❌ PDF cleanup error:', cleanupError);
      }
    }
  }

  private getHeaderTemplate(): string {
    return `
      <div style="font-size: 12px; width: 100%; text-align: center; color: #666; margin-top: 10px;">
        <span style="font-weight: bold;">409A Valuation Report</span>
      </div>
    `;
  }

  private getFooterTemplate(): string {
    return `
      <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-bottom: 10px;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        <span style="margin-left: 20px;">Generated on ${new Date().toLocaleDateString()}</span>
      </div>
    `;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔄 Browser closed');
    }
  }

  // Cleanup method for graceful shutdown
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}