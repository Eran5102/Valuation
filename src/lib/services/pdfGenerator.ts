// Client-side only PDF generation service
// This file should only be imported dynamically with ssr: false

export interface PDFOptions {
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
  quality?: number
  filename?: string
}

export interface PDFGenerationResult {
  success: boolean
  filename?: string
  error?: string
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
      // Dynamic import to prevent SSR issues
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const {
        orientation = 'portrait',
        format = 'a4',
        quality = 2,
        filename = 'document.pdf',
      } = options

      // Create temporary container for isolated rendering
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.width = '1024px'
      tempContainer.style.backgroundColor = 'white'

      // Clone the element to avoid affecting the original
      const clonedElement = element.cloneNode(true) as HTMLElement
      tempContainer.appendChild(clonedElement)
      document.body.appendChild(tempContainer)

      try {
        // Convert HTML to canvas with high quality
        const canvas = await html2canvas(clonedElement, {
          scale: quality,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
          width: 1024,
        })

        // Calculate dimensions for PDF
        const imgWidth = orientation === 'portrait' ? 210 : 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        const pageHeight = orientation === 'portrait' ? 297 : 210

        // Create PDF
        const pdf = new jsPDF({
          orientation,
          unit: 'mm',
          format,
        })

        let position = 0

        // Add pages as needed for long content
        while (position < imgHeight) {
          if (position > 0) {
            pdf.addPage()
          }

          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = (pageHeight * canvas.width) / imgWidth

          const pageContext = pageCanvas.getContext('2d')
          if (pageContext) {
            pageContext.drawImage(
              canvas,
              0,
              (position * canvas.width) / imgWidth,
              canvas.width,
              pageCanvas.height,
              0,
              0,
              canvas.width,
              pageCanvas.height
            )

            const pageData = pageCanvas.toDataURL('image/jpeg', 0.95)
            pdf.addImage(
              pageData,
              'JPEG',
              0,
              0,
              imgWidth,
              Math.min(pageHeight, imgHeight - position)
            )
          }

          position += pageHeight
        }

        // Save the PDF
        pdf.save(filename)

        return {
          success: true,
          filename,
        }
      } finally {
        // Clean up temporary container
        document.body.removeChild(tempContainer)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      }
    }
  }

  /**
   * Generate PDF from HTML string
   * Allows custom HTML templates
   */
  static async generateFromHTML(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      // Create temporary element from HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.padding = '20px'
      tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

      // Use generateFromElement
      return await PDFGenerator.generateFromElement(tempDiv, options)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation from HTML failed',
      }
    }
  }

  /**
   * Generate filename for download
   */
  static generateFilename(templateName: string, companyName: string): string {
    const date = new Date().toISOString().split('T')[0]
    const cleanTemplateName = templateName.replace(/[^a-z0-9]/gi, '_')
    const cleanCompanyName = companyName.replace(/[^a-z0-9]/gi, '_')

    return `${cleanTemplateName}-${cleanCompanyName}-${date}.pdf`
  }
}

export default PDFGenerator
