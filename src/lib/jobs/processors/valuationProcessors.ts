import JobQueue from '../jobQueue'
import { createClient } from '@/lib/supabase/server'

interface ValuationCalculationData {
  valuationId: number
  companyId: number
  assumptions: {
    discountRate: number
    termYears: number
    volatility: number
    riskFreeRate: number
  }
  shareClasses: Array<{
    id: number
    name: string
    type: string
    liquidationPreference: number
    participationRights: boolean
    conversion?: {
      ratio: number
      autoConvert: boolean
    }
  }>
}

interface ReportGenerationData {
  valuationId: number
  templateId: string
  format: 'pdf' | 'excel' | 'word'
  includeCharts: boolean
  watermark?: string
}

interface DataExportData {
  type: 'companies' | 'valuations' | 'cap-table'
  format: 'csv' | 'excel' | 'json'
  filters?: Record<string, any>
  dateRange?: {
    from: string
    to: string
  }
}

interface EmailNotificationData {
  to: string[]
  template: string
  data: Record<string, any>
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

/**
 * Black-Scholes Option Pricing Model implementation
 */
class BlackScholesCalculator {
  static calculateOptionValue(
    stockPrice: number,
    strikePrice: number,
    timeToExpiration: number,
    riskFreeRate: number,
    volatility: number,
    dividendYield: number = 0
  ): { callValue: number; putValue: number } {
    const d1 =
      (Math.log(stockPrice / strikePrice) +
        (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiration) /
      (volatility * Math.sqrt(timeToExpiration))

    const d2 = d1 - volatility * Math.sqrt(timeToExpiration)

    const callValue =
      stockPrice * Math.exp(-dividendYield * timeToExpiration) * this.normalCDF(d1) -
      strikePrice * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(d2)

    const putValue =
      strikePrice * Math.exp(-riskFreeRate * timeToExpiration) * this.normalCDF(-d2) -
      stockPrice * Math.exp(-dividendYield * timeToExpiration) * this.normalCDF(-d1)

    return { callValue, putValue }
  }

  private static normalCDF(x: number): number {
    // Approximation of the cumulative standard normal distribution
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2.0)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }
}

/**
 * Valuation calculation processor
 */
async function processValuationCalculation(job: any): Promise<any> {
  const { valuationId, companyId, assumptions, shareClasses }: ValuationCalculationData = job.data

  console.log(`Starting valuation calculation for valuation ${valuationId}`)

  // Update job progress
  job.progress = 10

  // Step 1: Validate input data
  if (!assumptions.discountRate || !assumptions.termYears || !assumptions.volatility) {
    throw new Error('Missing required valuation assumptions')
  }

  job.progress = 20

  // Step 2: Calculate enterprise value and equity value
  const enterpriseValue = await calculateEnterpriseValue(companyId, assumptions)
  job.progress = 40

  // Step 3: Calculate per-share values for each share class
  const shareClassValues = await calculateShareClassValues(
    shareClasses,
    enterpriseValue,
    assumptions
  )
  job.progress = 60

  // Step 4: Calculate option values using Black-Scholes
  const optionValues = await calculateOptionValues(shareClasses, enterpriseValue, assumptions)
  job.progress = 80

  // Step 5: Generate valuation results
  const results = {
    valuationId,
    enterpriseValue,
    equityValue: enterpriseValue, // Simplified - in reality, subtract debt
    shareClassValues,
    optionValues,
    fairMarketValue: shareClassValues.common?.pricePerShare || 0,
    calculationDate: new Date().toISOString(),
    assumptions,
  }

  // Step 6: Save results to database
  await saveValuationResults(valuationId, results)
  job.progress = 100

  console.log(`Valuation calculation completed for valuation ${valuationId}`)
  return results
}

/**
 * Report generation processor
 */
async function processReportGeneration(job: any): Promise<any> {
  const { valuationId, templateId, format, includeCharts }: ReportGenerationData = job.data

  console.log(`Generating ${format} report for valuation ${valuationId}`)

  job.progress = 10

  // Step 1: Load valuation data
  const valuation = await loadValuationData(valuationId)
  if (!valuation) {
    throw new Error(`Valuation ${valuationId} not found`)
  }

  job.progress = 30

  // Step 2: Load report template
  const template = await loadReportTemplate(templateId)
  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  job.progress = 50

  // Step 3: Generate charts if requested
  let charts: any[] = []
  if (includeCharts) {
    charts = await generateValuationCharts(valuation)
  }

  job.progress = 70

  // Step 4: Merge data with template
  const reportData = {
    ...valuation,
    charts,
    generatedAt: new Date().toISOString(),
    metadata: {
      template: template.name,
      format,
      version: '1.0',
    },
  }

  job.progress = 90

  // Step 5: Generate final report based on format
  let reportBuffer: Buffer
  let mimeType: string
  let filename: string

  switch (format) {
    case 'pdf':
      reportBuffer = await generatePDFReport(reportData, template)
      mimeType = 'application/pdf'
      filename = `valuation_${valuationId}_report.pdf`
      break
    case 'excel':
      reportBuffer = await generateExcelReport(reportData, template)
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `valuation_${valuationId}_report.xlsx`
      break
    case 'word':
      reportBuffer = await generateWordReport(reportData, template)
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      filename = `valuation_${valuationId}_report.docx`
      break
    default:
      throw new Error(`Unsupported report format: ${format}`)
  }

  job.progress = 100

  const result = {
    reportBuffer: reportBuffer.toString('base64'),
    mimeType,
    filename,
    size: reportBuffer.length,
    generatedAt: new Date().toISOString(),
  }

  console.log(`Report generation completed: ${filename} (${reportBuffer.length} bytes)`)
  return result
}

/**
 * Data export processor
 */
async function processDataExport(job: any): Promise<any> {
  const { type, format, filters, dateRange }: DataExportData = job.data

  console.log(`Exporting ${type} data as ${format}`)

  job.progress = 10

  // Step 1: Query data based on type and filters
  let data: any[]
  switch (type) {
    case 'companies':
      data = await exportCompaniesData(filters, dateRange)
      break
    case 'valuations':
      data = await exportValuationsData(filters, dateRange)
      break
    case 'cap-table':
      data = await exportCapTableData(filters, dateRange)
      break
    default:
      throw new Error(`Unsupported export type: ${type}`)
  }

  job.progress = 50

  // Step 2: Format data based on requested format
  let exportBuffer: Buffer
  let mimeType: string
  let filename: string

  switch (format) {
    case 'csv':
      exportBuffer = await generateCSV(data)
      mimeType = 'text/csv'
      filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
      break
    case 'excel':
      exportBuffer = await generateExcelExport(data, type)
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`
      break
    case 'json':
      exportBuffer = Buffer.from(JSON.stringify(data, null, 2))
      mimeType = 'application/json'
      filename = `${type}_export_${new Date().toISOString().split('T')[0]}.json`
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  job.progress = 100

  const result = {
    exportBuffer: exportBuffer.toString('base64'),
    mimeType,
    filename,
    recordCount: data.length,
    size: exportBuffer.length,
    exportedAt: new Date().toISOString(),
  }

  console.log(
    `Data export completed: ${filename} (${data.length} records, ${exportBuffer.length} bytes)`
  )
  return result
}

/**
 * Email notification processor
 */
async function processEmailNotification(job: any): Promise<any> {
  const { to, template, data, attachments }: EmailNotificationData = job.data

  console.log(`Sending email notification to ${to.length} recipients`)

  job.progress = 20

  // Step 1: Load email template
  const emailTemplate = await loadEmailTemplate(template)
  if (!emailTemplate) {
    throw new Error(`Email template ${template} not found`)
  }

  job.progress = 40

  // Step 2: Render email content
  const renderedEmail = await renderEmailTemplate(emailTemplate, data)

  job.progress = 60

  // Step 3: Send email (in production, use actual email service)
  const emailResult = await sendEmail({
    to,
    subject: renderedEmail.subject,
    html: renderedEmail.html,
    text: renderedEmail.text,
    attachments,
  })

  job.progress = 100

  console.log(`Email notification sent successfully to ${to.length} recipients`)
  return emailResult
}

// Helper functions (simplified implementations)

async function calculateEnterpriseValue(companyId: number, assumptions: any): Promise<number> {
  // Simplified calculation - in reality, use DCF or other valuation methods
  const baseValue = 10000000 // $10M base
  const riskAdjustment = 1 - (assumptions.discountRate - 0.1)
  return baseValue * riskAdjustment
}

async function calculateShareClassValues(
  shareClasses: any[],
  enterpriseValue: number,
  assumptions: any
): Promise<any> {
  // Simplified waterfall calculation
  const totalShares = shareClasses.reduce((sum, sc) => sum + (sc.sharesOutstanding || 1000000), 0)
  const basePrice = enterpriseValue / totalShares

  return {
    common: {
      pricePerShare: basePrice,
      totalValue:
        basePrice * (shareClasses.find((sc) => sc.type === 'common')?.sharesOutstanding || 1000000),
    },
    preferred: shareClasses
      .filter((sc) => sc.type === 'preferred')
      .map((sc) => ({
        class: sc.name,
        pricePerShare: basePrice * (sc.liquidationPreference || 1),
        totalValue: basePrice * (sc.liquidationPreference || 1) * (sc.sharesOutstanding || 100000),
      })),
  }
}

async function calculateOptionValues(
  shareClasses: any[],
  enterpriseValue: number,
  assumptions: any
): Promise<any> {
  const stockPrice = enterpriseValue / 10000000 // Simplified
  const strikePrice = stockPrice * 0.8 // 80% of current value

  const { callValue } = BlackScholesCalculator.calculateOptionValue(
    stockPrice,
    strikePrice,
    assumptions.termYears,
    0.02, // Risk-free rate
    assumptions.volatility
  )

  return {
    optionValue: callValue,
    intrinsicValue: Math.max(0, stockPrice - strikePrice),
    timeValue: callValue - Math.max(0, stockPrice - strikePrice),
  }
}

async function saveValuationResults(valuationId: number, results: any): Promise<void> {
  // Save results to database
  console.log(`Saving valuation results for ${valuationId}`)
}

async function loadValuationData(valuationId: number): Promise<any> {
  // Load from database
  return { id: valuationId /* ... other data */ }
}

async function loadReportTemplate(templateId: string): Promise<any> {
  // Load template from database
  return { id: templateId, name: 'Standard 409A Report' /* ... template data */ }
}

async function generateValuationCharts(valuation: any): Promise<any[]> {
  // Generate charts using chart library
  return []
}

async function generatePDFReport(data: any, template: any): Promise<Buffer> {
  // Generate PDF using library like puppeteer or pdfkit
  return Buffer.from('PDF report content placeholder')
}

async function generateExcelReport(data: any, template: any): Promise<Buffer> {
  // Generate Excel using library like exceljs
  return Buffer.from('Excel report content placeholder')
}

async function generateWordReport(data: any, template: any): Promise<Buffer> {
  // Generate Word doc using library
  return Buffer.from('Word report content placeholder')
}

async function exportCompaniesData(filters: any, dateRange: any): Promise<any[]> {
  const supabase = await createClient()
  let query = supabase.from('companies').select('*')

  if (dateRange?.from) {
    query = query.gte('created_at', dateRange.from)
  }
  if (dateRange?.to) {
    query = query.lte('created_at', dateRange.to)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function exportValuationsData(filters: any, dateRange: any): Promise<any[]> {
  const supabase = await createClient()
  let query = supabase.from('valuations').select('*')

  if (dateRange?.from) {
    query = query.gte('created_at', dateRange.from)
  }
  if (dateRange?.to) {
    query = query.lte('created_at', dateRange.to)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function exportCapTableData(filters: any, dateRange: any): Promise<any[]> {
  const supabase = await createClient()
  // Get valuations with cap table data
  let query = supabase.from('valuations').select('id, company_id, cap_table')

  if (dateRange?.from) {
    query = query.gte('created_at', dateRange.from)
  }
  if (dateRange?.to) {
    query = query.lte('created_at', dateRange.to)
  }

  const { data, error } = await query
  if (error) throw error

  // Extract share classes from cap tables
  const shareClasses: any[] = []
  data?.forEach((val) => {
    if (val.cap_table?.shareClasses) {
      val.cap_table.shareClasses.forEach((sc: any) => {
        shareClasses.push({
          ...sc,
          valuation_id: val.id,
          company_id: val.company_id,
        })
      })
    }
  })

  return shareClasses
}

async function generateCSV(data: any[]): Promise<Buffer> {
  // Convert to CSV format
  const csv = data.map((row) => Object.values(row).join(',')).join('\n')
  return Buffer.from(csv)
}

async function generateExcelExport(data: any[], type: string): Promise<Buffer> {
  // Generate Excel file
  return Buffer.from('Excel export placeholder')
}

async function loadEmailTemplate(template: string): Promise<any> {
  // Load email template
  return { subject: 'Notification', html: '<p>{{message}}</p>', text: '{{message}}' }
}

async function renderEmailTemplate(template: any, data: any): Promise<any> {
  // Render template with data
  return {
    subject: template.subject,
    html: template.html.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || ''),
    text: template.text.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || ''),
  }
}

async function sendEmail(emailData: any): Promise<any> {
  // Send email using service like SendGrid, AWS SES, etc.
  console.log('Email sent (simulated):', emailData.subject)
  return { messageId: 'sim_' + Date.now() }
}

// Register all processors
export function registerValuationProcessors(queue: JobQueue): void {
  queue.process('valuation-calculation', processValuationCalculation)
  queue.process('report-generation', processReportGeneration)
  queue.process('data-export', processDataExport)
  queue.process('email-notification', processEmailNotification)

  console.log('Valuation job processors registered')
}
