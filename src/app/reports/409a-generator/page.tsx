'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ValuationSelector } from '@/components/reports/ValuationSelector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { FileText, Eye, Download } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

// Dynamic imports for heavy components that don't need to load immediately
const SimplifiedReportForm = dynamic(
  () => import('@/components/reports/SimplifiedReportForm').then(mod => ({ default: mod.SimplifiedReportForm })),
  {
    loading: () => <div className="p-6 animate-pulse">Loading report form...</div>,
    ssr: false
  }
)

const ReportPreview = dynamic(
  () => import('@/components/reports/ReportPreview').then(mod => ({ default: mod.ReportPreview })),
  {
    loading: () => <div className="p-6 animate-pulse">Loading preview...</div>,
    ssr: false
  }
)

interface Valuation {
  id: number
  clientName: string
  valuationType: '409A' | 'Pre-Money' | 'Post-Money'
  status: 'draft' | 'in_progress' | 'completed' | 'review'
  value: number
  createdDate: string
  completedDate?: string
  nextReview?: string
}

interface ReportSettings {
  includeHeader: boolean
  includeFooter: boolean
  format: 'A4' | 'Letter'
  orientation: 'portrait' | 'landscape'
}

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
  reportSettings: ReportSettings
}

export default function ReportGeneratorPage() {
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null)
  const [customContent, setCustomContent] = useState('')
  const [reportSettings, setReportSettings] = useState<ReportSettings>({
    includeHeader: true,
    includeFooter: true,
    format: 'A4',
    orientation: 'portrait'
  })

  // Helper function to generate mock assumptions from selected valuation
  const getMockAssumptions = () => {
    if (!selectedValuation) return null

    return {
      // Company Information
      company_name: selectedValuation.clientName,
      state_incorporation: 'Delaware',
      business_description: 'Technology company focused on innovative solutions',
      industry: 'Technology',
      employees_count: 50,

      // Financial Data
      revenue_current: Math.floor(selectedValuation.value * 0.14),
      ebitda_current: Math.floor(selectedValuation.value * 0.03),
      cash_balance: Math.floor(selectedValuation.value * 0.12),
      debt_outstanding: Math.floor(selectedValuation.value * 0.02),

      // Valuation Methodology
      dcf_weight: 50,
      market_approach_weight: 30,
      asset_approach_weight: 10,
      backsolve_weight: 10,
      primary_method: 'DCF',

      // Allocation Methodology
      opm_weight: 40,
      pwerm_weight: 30,
      cvm_weight: 20,
      hybrid_weight: 10,
      primary_allocation_method: 'OPM',

      // Discount Rates & Assumptions
      wacc: 12.5,
      terminal_growth_rate: 3.0,
      risk_free_rate: 4.5,
      equity_volatility: 60,
      time_to_liquidity: 3,
      revenue_multiple: 4.2,

      // Management & Ownership
      ceo_name: 'John Smith',
      shares_outstanding: Math.floor(selectedValuation.value / 15),
      option_pool_size: 15,
      total_funding_raised: Math.floor(selectedValuation.value * 0.8),
    }
  }

  // Convert selected valuation to report data format for preview and PDF generation
  const getReportData = (): ReportData | null => {
    if (!selectedValuation) return null

    // Note: In a full implementation, this would pull from the valuation's saved assumptions
    // For now, using mock data with placeholders for the newly added fields
    const mockAssumptions = {
      // Company Information
      company_name: selectedValuation.clientName,
      state_incorporation: 'Delaware',
      business_description: 'Technology company focused on innovative solutions',
      industry: 'Technology',
      employees_count: 50,

      // Financial Data
      revenue_current: Math.floor(selectedValuation.value * 0.14),
      ebitda_current: Math.floor(selectedValuation.value * 0.03),
      cash_balance: Math.floor(selectedValuation.value * 0.12),
      debt_outstanding: Math.floor(selectedValuation.value * 0.02),

      // Valuation Methodology
      dcf_weight: 50,
      market_approach_weight: 30,
      asset_approach_weight: 10,
      backsolve_weight: 10,
      primary_method: 'DCF',

      // Allocation Methodology
      opm_weight: 40,
      pwerm_weight: 30,
      cvm_weight: 20,
      hybrid_weight: 10,
      primary_allocation_method: 'OPM',

      // Discount Rates & Assumptions
      wacc: 12.5,
      terminal_growth_rate: 3.0,
      risk_free_rate: 4.5,
      equity_volatility: 60,
      time_to_liquidity: 3,
      revenue_multiple: 4.2,

      // Management & Ownership
      ceo_name: 'John Smith',
      shares_outstanding: Math.floor(selectedValuation.value / 15),
      option_pool_size: 15,
      total_funding_raised: Math.floor(selectedValuation.value * 0.8),
    }

    return {
      company: {
        name: mockAssumptions.company_name,
        state: mockAssumptions.state_incorporation,
        description: mockAssumptions.business_description
      },
      financials: {
        revenue: mockAssumptions.revenue_current,
        ebitda: mockAssumptions.ebitda_current,
        totalAssets: mockAssumptions.cash_balance,
        totalLiabilities: mockAssumptions.debt_outstanding,
        revenueNotes: 'Based on trailing 12 months from valuation assumptions',
        ebitdaNotes: 'Adjusted for one-time expenses',
        assetsNotes: 'Including cash and receivables',
        liabilitiesNotes: 'Current and long-term debt'
      },
      valuation: {
        fairMarketValue: selectedValuation.value / mockAssumptions.shares_outstanding,
        valuationDate: selectedValuation.completedDate || selectedValuation.createdDate,
        totalEquityValue: selectedValuation.value,
        totalShares: mockAssumptions.shares_outstanding,
        valuationMethod: mockAssumptions.primary_method,
        discountRate: mockAssumptions.wacc,
        terminalGrowthRate: mockAssumptions.terminal_growth_rate,
        marketMultiple: mockAssumptions.revenue_multiple
      },
      customContent,
      reportSettings
    }
  }

  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePDF = async () => {
    if (!selectedValuation) {
      alert('Please select a valuation first.')
      return
    }

    if (!customContent || !customContent.includes('<')) {
      alert('Please customize the report template first in the "Customize Report" tab.')
      return
    }

    setIsGenerating(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3024'

      // Send the customized HTML content directly for PDF generation
      const response = await fetch(`${apiUrl}/api/generate-pdf-from-html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: customContent,
          reportSettings: reportSettings,
          fileName: `409A-Valuation-Report-${selectedValuation.clientName || 'Company'}-${new Date().toISOString().split('T')[0]}`
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `409A-Valuation-Report-${selectedValuation.clientName || 'Company'}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('✅ PDF downloaded successfully')
      } else {
        const errorData = await response.text()
        console.error('PDF generation failed:', errorData)

        // Fallback to original method if the new endpoint doesn't exist
        console.log('Trying fallback PDF generation method...')
        const fallbackResponse = await fetch(`${apiUrl}/api/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            htmlContent: customContent,
            reportSettings: reportSettings
          })
        })

        if (fallbackResponse.ok) {
          const blob = await fallbackResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `409A-Valuation-Report-${selectedValuation.clientName || 'Company'}-${new Date().toISOString().split('T')[0]}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          console.log('✅ PDF downloaded successfully (fallback)')
        } else {
          alert('Failed to generate PDF. Please ensure the backend server is running.')
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('An error occurred while generating the PDF. Please check the console and ensure the backend server is running.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            409A Report Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create professional 409A valuation reports with customizable content and templates
          </p>
        </div>

      {!selectedValuation ? (
        <ValuationSelector
          selectedValuation={selectedValuation}
          onValuationSelect={setSelectedValuation}
        />
      ) : (
        <Tabs defaultValue="customize" className="space-y-6">
          <TabsList className="w-fit">
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Customize Report
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Generate PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customize">
            <div className="space-y-6">
              <Card className="p-4 bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Selected: {selectedValuation.clientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedValuation.valuationType} • ${(selectedValuation.value / 1000000).toFixed(1)}M • {selectedValuation.completedDate || selectedValuation.createdDate}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedValuation(null)}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Change Valuation
                  </button>
                </div>
              </Card>
              <SimplifiedReportForm
                customContent={customContent}
                reportSettings={reportSettings}
                onCustomContentChange={setCustomContent}
                onReportSettingsChange={setReportSettings}
                selectedValuation={selectedValuation}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="p-6">
              {getReportData() && <ReportPreview reportData={getReportData()!} />}
            </Card>
          </TabsContent>

          <TabsContent value="generate">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-2">Generate PDF Report</h3>
                  <p className="text-muted-foreground mb-4">
                    Click the button below to generate your 409A valuation report as a PDF document.
                  </p>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Generate PDF Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      </div>
    </AppLayout>
  )
}