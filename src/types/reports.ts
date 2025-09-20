// =============================================
// REPORT SYSTEM TYPE DEFINITIONS
// =============================================

// Block Types for Template Builder
export type BlockType =
  | 'text'
  | 'header'
  | 'section'
  | 'table'
  | 'chart'
  | 'keyValue'
  | 'pageBreak'
  | 'image'
  | 'conditional'
  | 'loop'

// Base Block Interface
export interface BaseBlock {
  id: string
  type: BlockType
  style?: {
    fontSize?: string
    fontWeight?: string
    color?: string
    backgroundColor?: string
    padding?: string
    margin?: string
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    border?: string
  }
}

// Text Block
export interface TextBlock extends BaseBlock {
  type: 'text'
  content: string // Can include Handlebars variables {{company.name}}
}

// Header Block
export interface HeaderBlock extends BaseBlock {
  type: 'header'
  content: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

// Section Block (with title and content)
export interface SectionBlock extends BaseBlock {
  type: 'section'
  title: string
  content: string
  numbered?: boolean
}

// Table Block (references saved DataTable views)
export interface TableBlock extends BaseBlock {
  type: 'table'
  viewId?: string // Reference to saved_table_views
  dataSource?: 'valuations' | 'assumptions' | 'breakpoints' | 'shareholders'
  title?: string
  showHeaders?: boolean
  maxRows?: number
  columns?: string[] // Specific columns to show
}

// Chart Block
export interface ChartBlock extends BaseBlock {
  type: 'chart'
  chartType: 'pie' | 'bar' | 'line' | 'waterfall' | 'scatter'
  dataSource: string
  title?: string
  config?: {
    xAxis?: string
    yAxis?: string
    series?: string[]
    colors?: string[]
  }
}

// Key-Value Pairs Block
export interface KeyValueBlock extends BaseBlock {
  type: 'keyValue'
  items: Array<{
    label: string
    value: string // Can include variables
    style?: any
  }>
  layout?: 'horizontal' | 'vertical' | 'grid'
}

// Page Break Block
export interface PageBreakBlock extends BaseBlock {
  type: 'pageBreak'
}

// Conditional Block
export interface ConditionalBlock extends BaseBlock {
  type: 'conditional'
  condition: string // Handlebars condition: {{#if isPreRevenue}}
  blocks: TemplateBlock[] // Nested blocks
  elseBlocks?: TemplateBlock[] // Optional else blocks
}

// Loop Block
export interface LoopBlock extends BaseBlock {
  type: 'loop'
  iterator: string // {{#each investors}}
  blocks: TemplateBlock[] // Nested blocks to repeat
}

// Union type for all blocks
export type TemplateBlock =
  | TextBlock
  | HeaderBlock
  | SectionBlock
  | TableBlock
  | ChartBlock
  | KeyValueBlock
  | PageBreakBlock
  | ConditionalBlock
  | LoopBlock

// =============================================
// SAVED TABLE VIEW TYPES
// =============================================

export interface SavedTableView {
  id: string
  name: string
  tableId: string
  config: {
    columnVisibility: Record<string, boolean>
    columnOrder: string[]
    pinnedColumns: {
      left: string[]
      right: string[]
    }
    sorting: Array<{
      id: string
      desc: boolean
    }>
    columnFilters: Array<{
      id: string
      value: any
    }>
    pageSize: number
  }
  dataSource?: string
  valuationId?: number
  isGlobal: boolean
  isDefault?: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// =============================================
// REPORT TEMPLATE TYPES
// =============================================

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  type: '409a' | 'board_deck' | 'cap_table' | 'investor_update' | 'custom'
  isSystem: boolean
  isActive: boolean
  ownerId?: string
  organizationId?: string
  blocks: TemplateBlock[]
  variablesSchema: VariableSchema
  branding: BrandingConfig
  createdAt: string
  updatedAt: string
  version: number
}

// Variable Schema Definition
export interface VariableSchema {
  [category: string]: {
    [field: string]: {
      type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage'
      required?: boolean
      default?: any
      format?: string
      description?: string
    }
  }
}

// Branding Configuration
export interface BrandingConfig {
  logo?: string
  primaryColor: string
  secondaryColor?: string
  fontFamily: string
  fontSize?: string
  headerEnabled: boolean
  footerEnabled: boolean
  headerTemplate?: string
  footerTemplate?: string
  watermark?: string
}

// =============================================
// GENERATED REPORT TYPES
// =============================================

export interface GeneratedReport {
  id: string
  templateId: string
  valuationId: number
  renderedHtml?: string
  renderedData?: any
  pdfUrl?: string
  wordUrl?: string
  generatedBy: string
  generatedAt: string
  expiresAt?: string
  status: 'generating' | 'completed' | 'failed' | 'expired'
  errorMessage?: string
}

// =============================================
// VARIABLE MAPPING TYPES
// =============================================

export interface VariableMapping {
  id: string
  templateId: string
  variablePath: string // e.g., 'company.name'
  dataSource: 'valuation' | 'assumptions' | 'computed' | 'manual'
  sourceField?: string // Database field
  transform?: 'currency' | 'date' | 'percentage' | 'number' | 'uppercase' | 'lowercase'
  defaultValue?: any
}

// =============================================
// REPORT GENERATION TYPES
// =============================================

export interface ReportGenerationRequest {
  templateId: string
  valuationId: number
  variables?: Record<string, any> // Override variables
  outputFormat?: 'pdf' | 'word' | 'both'
  preview?: boolean // Generate preview only
}

export interface ReportPreviewData {
  html: string
  variables: Record<string, any>
  tables: Record<string, any[]>
  charts?: Record<string, any>
}

// =============================================
// TEMPLATE EDITOR TYPES
// =============================================

export interface TemplateEditorState {
  template: ReportTemplate
  selectedBlockId?: string
  isDragging: boolean
  previewMode: boolean
  sampleData?: Record<string, any>
  availableViews: SavedTableView[]
  availableVariables: string[]
}

export interface BlockEditorProps {
  block: TemplateBlock
  onUpdate: (block: TemplateBlock) => void
  onDelete: () => void
  onDuplicate: () => void
  isSelected: boolean
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface TemplateListResponse {
  templates: ReportTemplate[]
  total: number
  page: number
  pageSize: number
}

export interface SaveViewRequest {
  name: string
  tableId: string
  config: SavedTableView['config']
  dataSource?: string
  valuationId?: number
  isGlobal?: boolean
  isDefault?: boolean
}

export interface SaveViewResponse {
  view: SavedTableView
  success: boolean
  message?: string
}
