/**
 * Core Template System Types
 * Defines the structure for report templates with variable placeholders
 */

export type TemplateCategory = 'financial' | 'legal' | 'operational'
export type BlockType =
  | 'text'
  | 'header'
  | 'paragraph'
  | 'table'
  | 'chart'
  | 'list'
  | 'pageBreak'
  | 'image'
  | 'separator'
  | 'quote'
  | 'dynamicTable'
  | 'breakpointsTable'
  | 'managementTable'
  | 'valuationSummary'
  | 'dateBlock'
  | 'footnote'
  | 'tableOfContents'
  | 'coverPage'
  | 'executiveSummary'
  | 'appendix'
  | 'bibliography'
  | 'glossary'
  | 'signatureBlock'
  | 'footer'
  | 'capitalStructureTable'
  | 'rightsPreferencesTable'
  | 'opmBreakpointsTable'
  | 'dlomTable'
  | 'comparableCompaniesTable'
  | 'transactionCompsTable'
  | 'financialProjectionsTable'
  | 'weightedAverageTable'
  | 'sensitivityAnalysisTable'
  | 'optionPoolTable'
export type VariableType = 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean'

export interface TemplateVariable {
  id: string
  name: string
  type: VariableType
  required: boolean
  defaultValue?: any
  format?: string // For dates, numbers, etc.
  description?: string
  category?: string // For grouping in UI
}

export interface BlockStyling {
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  color?: string
  backgroundColor?: string
  padding?: string
  margin?: string
  textDecoration?: 'none' | 'underline'
}

export interface TemplateBlock {
  id: string
  type: BlockType
  content: string | any
  styling?: BlockStyling
  children?: TemplateBlock[]
  conditionalDisplay?: {
    variable: string
    condition: 'exists' | 'equals' | 'notEquals' | 'greaterThan' | 'lessThan'
    value?: any
  }
}

export interface TemplateSection {
  id: string
  title: string
  blocks: TemplateBlock[]
  pageBreakBefore?: boolean
  pageBreakAfter?: boolean
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  version: string
  sections: TemplateSection[]
  variables: TemplateVariable[]
  metadata?: {
    createdAt?: string
    updatedAt?: string
    author?: string
    tags?: string[]
    lastVersion?: string
  }
  settings?: {
    paperSize?: 'letter' | 'legal' | 'a4'
    orientation?: 'portrait' | 'landscape'
    margins?: {
      top: string
      right: string
      bottom: string
      left: string
    }
    watermark?: {
      enabled: boolean
      text: string
      opacity: number
      angle?: number
      fontSize?: number
      position?: string
    }
  }
}

export interface GeneratedReport {
  id: string
  templateId: string
  valuationId?: string
  generatedAt: string
  data: Record<string, any>
  html: string
  status: 'draft' | 'final'
  watermark: boolean
}
