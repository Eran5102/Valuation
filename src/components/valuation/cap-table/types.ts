export interface ShareClass {
  id: string
  companyId?: number // Made optional - API will add it if missing
  shareType: 'common' | 'preferred'
  name: string
  roundDate: string
  sharesOutstanding: number
  pricePerShare: number
  preferenceType: 'non-participating' | 'participating' | 'participating-with-cap'
  lpMultiple: number
  seniority: number
  participationCap?: number | null
  conversionRatio: number
  dividendsDeclared: boolean
  dividendsRate: number | null
  dividendsType: 'cumulative' | 'non-cumulative' | null
  pik: boolean
  // Calculated fields
  amountInvested?: number
  totalLP?: number
  asConvertedShares?: number
  totalDividends?: number
}

export interface OptionsWarrants {
  id: string
  numOptions: number
  exercisePrice: number
  type: OptionsType
}

export type OptionsType = 'Options' | 'Warrants' | 'RSUs'

export interface CapTableProps {
  valuationId: string
  onSave?: (data: { shareClasses: ShareClass[]; options: OptionsWarrants[] }) => void
}

export interface CapTableTotals {
  totalShares: number
  totalInvested: number
  totalLP: number
  totalDividends: number
}
