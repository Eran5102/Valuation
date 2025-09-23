// Add this function at the top of the file, right after the imports section
function addHeaderFooter(
  doc: any,
  headerText: string,
  footerText: string,
  pageNumber: number,
  totalPages: number
) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // Set font styles for header and footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)

  // Add header
  doc.text(headerText, pageWidth / 2, 10, { align: 'center' })

  // Add footer with page numbers
  doc.text(`${footerText} | Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
    align: 'center',
  })
}

import React from 'react'
import { Button } from '@/components/ui/button'
import { useReportExporter } from '@/hooks/useReportExporter'
import { HeaderFooterConfig } from './HeaderFooterSettings'
import { TypographyOptions, PageMarginOptions, WatermarkOptions } from './DynamicContentFormatting'
import { Download } from 'lucide-react'

interface ReportExporterProps {
  reportRef: React.RefObject<HTMLDivElement>
  reportContent: string
  projectName: string
  headerFooterConfig?: HeaderFooterConfig
  watermarkOptions?: WatermarkOptions
  pageMarginOptions?: PageMarginOptions
  typographyOptions?: TypographyOptions
}

export function ReportExporter({
  reportRef,
  reportContent,
  projectName,
  headerFooterConfig,
  watermarkOptions,
  pageMarginOptions,
  typographyOptions,
}: ReportExporterProps) {
  const { exportAsPDF } = useReportExporter()

  const handleExportPDF = () => {
    exportAsPDF({
      reportRef,
      reportContent,
      projectName,
      headerFooterConfig,
      watermarkOptions,
      pageMargins: pageMarginOptions,
      typography: typographyOptions,
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-2 text-sm font-medium">Export Options</h3>
      <div className="flex flex-col space-y-2">
        <Button
          onClick={handleExportPDF}
          variant="secondary"
          size="sm"
          className="flex w-full items-center"
        >
          <Download className="mr-2 h-4 w-4" />
          Download as PDF
        </Button>
      </div>
    </div>
  )
}
