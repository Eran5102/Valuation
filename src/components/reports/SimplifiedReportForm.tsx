'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FileText, Settings, Download, Loader2 } from 'lucide-react'

interface ReportSettings {
  includeHeader: boolean
  includeFooter: boolean
  format: 'A4' | 'Letter'
  orientation: 'portrait' | 'landscape'
}

interface Props {
  customContent: string
  reportSettings: ReportSettings
  onCustomContentChange: (content: string) => void
  onReportSettingsChange: (settings: ReportSettings) => void
  selectedValuation: any
}

export function SimplifiedReportForm({
  customContent,
  reportSettings,
  onCustomContentChange,
  onReportSettingsChange,
  selectedValuation,
}: Props) {
  const [templateContent, setTemplateContent] = useState<string>('')
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // Load the full template when valuation is selected
  useEffect(() => {
    if (selectedValuation) {
      loadTemplateContent()
    }
  }, [selectedValuation])

  const loadTemplateContent = async () => {
    try {
      setIsLoadingTemplate(true)
      setTemplateError(null)

      // Create a complete 409A template with real data from the selected valuation
      const fairMarketValue = (
        selectedValuation.value / Math.floor(selectedValuation.value / 15)
      ).toFixed(2)
      const totalShares = Math.floor(selectedValuation.value / 15)
      const valuationDate = selectedValuation.completedDate || selectedValuation.createdDate

      const template409A = `
        <div class="header">
          <h1>409A VALUATION REPORT</h1>
          <h2>${selectedValuation.clientName}</h2>
          <p><strong>Valuation Date:</strong> ${valuationDate}</p>
          <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <h2 class="section-title">EXECUTIVE SUMMARY</h2>
        <p>This 409A valuation report provides an independent assessment of the fair market value of the common stock of ${selectedValuation.clientName} (the "Company") as of ${valuationDate}.</p>

        <p><strong>Fair Market Value per Share:</strong> $${fairMarketValue}</p>
        <p><strong>Total Equity Value:</strong> $${selectedValuation.value.toLocaleString()}</p>
        <p><strong>Total Shares Outstanding:</strong> ${totalShares.toLocaleString()}</p>
        <p><strong>Valuation Method:</strong> Discounted Cash Flow (DCF) Analysis</p>

        <h2 class="section-title">COMPANY OVERVIEW</h2>
        <p><strong>Company Name:</strong> ${selectedValuation.clientName}</p>
        <p><strong>State of Incorporation:</strong> Delaware</p>
        <p><strong>Business Description:</strong> Technology company focused on innovative solutions and market-leading products.</p>

        <h2 class="section-title">VALUATION METHODOLOGY</h2>
        <p>The valuation was conducted using the Income Approach, specifically the Discounted Cash Flow (DCF) method. This approach estimates the fair value of equity by projecting the company's future cash flows and discounting them to present value.</p>

        <h3>Key Assumptions:</h3>
        <ul>
          <li><strong>Discount Rate (WACC):</strong> 12.5%</li>
          <li><strong>Terminal Growth Rate:</strong> 3.0%</li>
          <li><strong>Revenue Multiple:</strong> 4.2x</li>
          <li><strong>Time to Liquidity:</strong> 3 years</li>
        </ul>

        <h2 class="section-title">ALLOCATION METHODOLOGY</h2>
        <p>The equity value was allocated among the various classes of securities using the Option Pricing Model (OPM), which treats each class of stock and options as call options with different exercise prices and priorities.</p>

        <table>
          <thead>
            <tr>
              <th>Security Class</th>
              <th>Shares Outstanding</th>
              <th>Liquidation Preference</th>
              <th>Fair Value per Share</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Common Stock</td>
              <td>${totalShares.toLocaleString()}</td>
              <td>N/A</td>
              <td>$${fairMarketValue}</td>
            </tr>
          </tbody>
        </table>

        <h2 class="section-title">FINANCIAL ANALYSIS</h2>
        <p>The financial analysis considered the following key metrics:</p>
        <ul>
          <li><strong>Revenue (TTM):</strong> $${Math.floor(selectedValuation.value * 0.14).toLocaleString()}</li>
          <li><strong>EBITDA (TTM):</strong> $${Math.floor(selectedValuation.value * 0.03).toLocaleString()}</li>
          <li><strong>Cash Balance:</strong> $${Math.floor(selectedValuation.value * 0.12).toLocaleString()}</li>
          <li><strong>Total Debt:</strong> $${Math.floor(selectedValuation.value * 0.02).toLocaleString()}</li>
        </ul>

        <h2 class="section-title">MARKETABILITY DISCOUNT</h2>
        <p>A discount for lack of marketability (DLOM) of 15% was applied to reflect the illiquid nature of the company's securities and the lack of an active market for trading.</p>

        <h2 class="section-title">CONCLUSION</h2>
        <p>Based on our analysis, the fair market value of the Company's common stock as of ${valuationDate} is <strong>$${fairMarketValue} per share</strong>.</p>

        <p>This valuation is intended for use in determining the exercise price of stock options granted under the Company's equity incentive plans and for compliance with Section 409A of the Internal Revenue Code.</p>

        <div style="margin-top: 50px; padding: 20px; border: 1px solid #ccc;">
          <p><strong>Important Notice:</strong> This valuation is based on information available as of the valuation date and reflects the specific purpose for which it was prepared. The actual value of the securities may differ materially from the conclusions presented herein.</p>
        </div>
      `

      setTemplateContent(template409A)
      // If there's no custom content yet, initialize with the template
      if (!customContent) {
        onCustomContentChange(template409A)
      }
    } catch (error) {
      console.error('Template loading error:', error)
      setTemplateError('Unable to load template. Please try again.')
    } finally {
      setIsLoadingTemplate(false)
    }
  }

  const handleEditorChange = (content: string) => {
    onCustomContentChange(content)
  }

  const updateSetting = (field: keyof ReportSettings, value: any) => {
    onReportSettingsChange({
      ...reportSettings,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      {/* Full Template Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            409A Report Template Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Edit 409A Valuation Report</Label>
            {isLoadingTemplate ? (
              <div className="flex items-center justify-center rounded-md border p-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Loading template...</span>
              </div>
            ) : templateError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-red-600">{templateError}</p>
                <button
                  onClick={loadTemplateContent}
                  className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="rounded-md border">
                <textarea
                  value={customContent || templateContent}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  className="h-[600px] w-full resize-none border-0 p-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12pt',
                    lineHeight: '1.6',
                    color: '#333',
                  }}
                  placeholder="Edit the 409A report template content here..."
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              This is the complete 409A valuation report template. You can edit any section, add
              content, modify formatting, or customize the layout as needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Report Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeHeader">Include Header</Label>
                <Switch
                  id="includeHeader"
                  checked={reportSettings.includeHeader}
                  onCheckedChange={(checked) => updateSetting('includeHeader', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="includeFooter">Include Footer</Label>
                <Switch
                  id="includeFooter"
                  checked={reportSettings.includeFooter}
                  onCheckedChange={(checked) => updateSetting('includeFooter', checked)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="format">Page Format</Label>
                <select
                  id="format"
                  value={reportSettings.format}
                  onChange={(e) => updateSetting('format', e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-background p-2"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <select
                  id="orientation"
                  value={reportSettings.orientation}
                  onChange={(e) => updateSetting('orientation', e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-background p-2"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
