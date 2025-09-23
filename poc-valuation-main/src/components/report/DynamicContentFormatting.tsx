import { ThemeBranding } from './ReportSettings'

export interface TableFormatOptions {
  headerStyle?: string[] // Array of styles like "bold", "shaded", "centered"
  footerStyle?: string[] // Array of styles like "bold", "shaded", "centered"
  alignment?: 'left' | 'center' | 'right'
  numberFormat?: 'plain' | 'currency' | 'percentage' | 'decimal' | 'multiple'
  decimals?: number
  borderColor?: string
  useBorders?: boolean
}

export interface ChartFormatOptions {
  size?: 'small' | 'medium' | 'large' | 'full'
  alignment?: 'left' | 'center' | 'right'
  showLegend?: boolean
  showTitle?: boolean
  showGrid?: boolean
  caption?: string
  height?: number
}

export interface LogoOptions {
  placement?:
    | 'header-left'
    | 'header-center'
    | 'header-right'
    | 'footer-left'
    | 'footer-center'
    | 'footer-right'
    | 'title-page'
    | 'none'
  size?: 'small' | 'medium' | 'large'
}

export interface PowerPointTemplateOptions {
  templateFile?: File | null
  templateName?: string
  titleSlideLayout?: string
  contentSlideLayout?: string
  chartSlideLayout?: string
  tableSlideLayout?: string
}

export interface WatermarkOptions {
  type: 'none' | 'text' | 'image'
  text?: string
  imageUrl?: string
  opacity: number
  rotation: number
  fontSize?: number
  color?: string
}

export interface TypographyOptions {
  headingFont: string
  bodyFont: string
}

export interface PageMarginOptions {
  top: number
  bottom: number
  left: number
  right: number
  unit: 'inches' | 'cm'
}

export interface FormatOptions {
  table?: TableFormatOptions
  chart?: ChartFormatOptions
  textColor?: string
  format?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    color?: string
    size?: string
  }
  themeBranding?: ThemeBranding // Add theme branding to format options
  logo?: LogoOptions
  powerPointTemplate?: PowerPointTemplateOptions
  watermark?: WatermarkOptions
  typography?: TypographyOptions
  pageMargins?: PageMarginOptions
}
