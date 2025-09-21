export type VolatilitySource = 'manual' | 'damodaran' | 'alpha_vantage'

export interface VolatilityResult {
  value: number // Volatility as percentage
  source: VolatilitySource
  metadata?: {
    fetchDate?: string
    industry?: string
    market?: string
    region?: string
    tickers?: string[]
    timePeriod?: number // in years
    dataPoints?: number
    lastUpdated?: string
  }
}

export interface DamodaranVolatilityData {
  industry: string
  numberOfFirms: number
  averageUnleveredBeta?: number
  averageLeveredBeta?: number
  averageCorrelation?: number
  totalUnleveredBeta?: number
  totalLeveredBeta?: number
  standardDeviation: number // This is the key field we need
  region: 'US' | 'Europe' | 'Asia' | 'Global' | 'China' | 'India' | 'Japan' | 'Emerging'
}

export interface AlphaVantageTimeSeriesData {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjustedClose?: number
  volume: number
}

export interface VolatilityCalculationParams {
  timeSeries: AlphaVantageTimeSeriesData[]
  periodInYears: number
  annualizationFactor?: number // Default 252 for daily, 52 for weekly, 12 for monthly
  frequency?: 'daily' | 'weekly' | 'monthly'
}

export interface VolatilityServiceConfig {
  alphaVantageApiKey?: string
  damodaranDataPath?: string
  cacheEnabled?: boolean
  cacheDuration?: number // in milliseconds
}

export interface IndustryMapping {
  [key: string]: string[] // Maps our industry names to Damodaran industry names
}

export const VOLATILITY_MARKETS = [
  { value: 'US', label: 'United States' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Global', label: 'Global' },
  { value: 'China', label: 'China' },
  { value: 'India', label: 'India' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Emerging', label: 'Emerging Markets' },
  { value: 'Rest', label: 'Rest of World' },
] as const

export const DEFAULT_VOLATILITY_VALUES = {
  equity: 60, // 60% default equity volatility
  asset: 45, // 45% default asset volatility
} as const
