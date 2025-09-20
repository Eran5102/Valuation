'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, AlertCircle, Loader2 } from 'lucide-react'

interface ReportData {
  company: {
    name: string
    state: string
    description: string
  }
  financials: {
    revenue: number
    ebitda: number
    totalAssets: number
    totalLiabilities: number
    revenueNotes: string
    ebitdaNotes: string
    assetsNotes: string
    liabilitiesNotes: string
  }
  valuation: {
    fairMarketValue: number
    valuationDate: string
    totalEquityValue: number
    totalShares: number
    valuationMethod: string
    discountRate: number
    terminalGrowthRate: number
    marketMultiple: number
  }
  customContent: string
  reportSettings: {
    includeHeader: boolean
    includeFooter: boolean
    format: 'A4' | 'Letter'
    orientation: 'portrait' | 'landscape'
  }
}

interface Props {
  reportData: ReportData
}

export function ReportPreview({ reportData }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use the custom content directly if it contains HTML, otherwise show simple preview
  const getPreviewContent = () => {
    if (reportData.customContent && reportData.customContent.includes('<')) {
      // It's HTML content from the editor
      return reportData.customContent
    } else {
      // Fallback to simple preview
      return `
        <div style="font-family: Times, serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="font-size: 24px; margin-bottom: 10px;">409A Valuation Report</h1>
            <h2 style="font-size: 18px; color: #666;">Fair Market Value Assessment</h2>
            <h3 style="font-size: 16px; color: #666;">${reportData.company.name || '[Company Name]'}</h3>
            <p>Report Date: ${reportData.valuation.valuationDate || new Date().toLocaleDateString()}</p>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p><strong>Fair Market Value per Share:</strong> $${reportData.valuation.fairMarketValue.toFixed(2)}</p>
            <p><strong>Total Equity Value:</strong> $${reportData.valuation.totalEquityValue.toLocaleString()}</p>
          </div>
          <p style="margin-top: 20px; font-style: italic; color: #666;">
            Please select a valuation and customize the report in the "Customize Report" tab to see the full template preview.
          </p>
          ${
            reportData.customContent
              ? `
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
              <h3>Additional Content</h3>
              <p>${reportData.customContent}</p>
            </div>
          `
              : ''
          }
        </div>
      `
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading full template preview...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
          <div>
            <h3 className="font-medium text-yellow-800">Preview Limited</h3>
            <p className="mt-1 text-sm text-yellow-700">
              {error} The PDF generation will show the complete template.
            </p>
          </div>
        </div>
        <div
          className="rounded-lg border border-gray-200 bg-white p-4"
          dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Eye className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-blue-800">Report Preview</h3>
            <p className="mt-1 text-sm text-blue-700">
              This shows your customized 409A report as it will appear in the PDF.
            </p>
          </div>
        </div>
      </div>

      <div
        className="max-h-[800px] overflow-auto rounded-lg border border-gray-200 bg-white p-4"
        dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
      />

      {/* Report Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            PDF Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <Badge variant={reportData.reportSettings.includeHeader ? 'default' : 'secondary'}>
                {reportData.reportSettings.includeHeader ? 'Header: On' : 'Header: Off'}
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant={reportData.reportSettings.includeFooter ? 'default' : 'secondary'}>
                {reportData.reportSettings.includeFooter ? 'Footer: On' : 'Footer: Off'}
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant="outline">Format: {reportData.reportSettings.format}</Badge>
            </div>
            <div className="text-center">
              <Badge variant="outline">
                {reportData.reportSettings.orientation === 'portrait'
                  ? '📄 Portrait'
                  : '📊 Landscape'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
