export interface TeamMember {
  id: string
  name: string
  title: string
}

export interface Investor {
  id: string
  name: string
  type: string
}

export interface AssumptionField {
  id: string
  name: string
  value: string | number | TeamMember[] | Investor[]
  type:
    | 'text'
    | 'number'
    | 'percentage'
    | 'currency'
    | 'date'
    | 'select'
    | 'textarea'
    | 'team'
    | 'investors'
  options?: string[]
  description?: string
  required?: boolean
  placeholder?: string
}

export interface AssumptionSection {
  id: string
  name: string
  icon: React.ElementType
  fields: AssumptionField[]
  description?: string
}

export interface ValuationAssumptionsProps {
  valuationId: string
}

export interface FormState {
  assumptions: Record<string, any>
  expandedSections: string[]
  managementTeam: TeamMember[]
  keyInvestors: Investor[]
  searchQuery: string
  filterStatus: 'all' | 'required' | 'incomplete'
  hasChanges: boolean
  isSaving: boolean
  isLoading: boolean
  activeSection: string | null
}