// Database schema type definitions
// Last updated: 2025-01-29

// ============================================
// User and Organization Types
// ============================================

export type StandardizedRole = 'owner' | 'admin' | 'appraiser' | 'analyst' | 'viewer'

export interface UserProfile {
  id: string
  email?: string | null
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  title?: string | null
  department?: string | null
  timezone: string
  role: 'admin' | 'analyst' | 'client' | 'viewer'
  preferences: Record<string, any>
  is_super_admin: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug?: string | null
  logo_url?: string | null
  website?: string | null
  industry?: string | null
  size?: string | null
  subscription_plan: string
  subscription_status: string
  subscription_expires_at?: string | null
  settings: OrganizationSettings
  owner_id?: string | null
  billing_email?: string | null
  billing_address?: string | null
  max_users?: number | null
  max_clients?: number | null
  max_valuations?: number | null
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  notifications?: {
    email_enabled?: boolean
    valuation_updates?: boolean
    team_changes?: boolean
  }
  defaults?: {
    currency?: string
    tax_rate?: number
    discounting_convention?: string
  }
  branding?: {
    primary_color?: string
    logo_position?: string
  }
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: StandardizedRole
  permissions: Record<string, any>
  invited_by?: string | null
  invited_at?: string | null
  joined_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// Client Types (formerly Companies)
// ============================================

export type ClientStatus = 'active' | 'inactive' | 'archived'

export interface Client {
  id: string
  organization_id?: string | null
  name: string
  legal_name?: string | null
  incorporation_date?: string | null
  state_of_incorporation?: string | null
  ein?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string
  industry?: string | null
  stage?: string | null
  location?: string | null
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  description?: string | null
  lead_assigned?: string | null
  team_members: string[]
  editor_members: string[]
  viewer_members: string[]
  tags: string[]
  status: ClientStatus
  created_by?: string | null
  created_at: string
  updated_at: string
}

// Backward compatibility type
export type Company = Client

// ============================================
// Valuation Types
// ============================================

export type ValuationStatus = 'draft' | 'in_progress' | 'under_review' | 'completed' | 'on_hold'

export interface Valuation {
  id: string
  organization_id?: string | null
  client_id?: string | null // New field
  company_id?: string | null // Deprecated, use client_id
  title: string
  valuation_date: string
  project_type?: string
  status: ValuationStatus
  currency?: string
  max_projected_years?: number
  discounting_convention?: string
  tax_rate?: number
  description?: string | null
  enterprise_value?: number | null
  equity_value?: number | null
  common_share_price?: number | null
  preferred_share_price?: number | null
  discount_rate?: number | null
  volatility?: number | null
  risk_free_rate?: number | null
  dlom?: number | null
  methodology?: string | null
  notes?: string | null
  lead_assigned?: string | null // Renamed from assigned_appraiser
  assigned_appraiser?: string | null // Deprecated, use lead_assigned
  team_members: string[]
  editor_members: string[]
  viewer_members: string[]
  created_by?: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Report and Template Types
// ============================================

export interface ReportTemplate {
  id: string
  name: string
  description?: string | null
  type: string
  is_system: boolean
  is_active: boolean
  is_global?: boolean // New field
  owner_id?: string | null
  organization_id?: string | null // New field
  blocks: any[]
  variables_schema: Record<string, any>
  branding: {
    primaryColor?: string
    fontFamily?: string
    headerEnabled?: boolean
    footerEnabled?: boolean
  }
  version: number
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  valuation_id: string
  report_type: string
  report_data?: Record<string, any> | null
  file_url?: string | null
  template_id?: string | null // New field
  template_version?: number // New field
  generated_at: string
  created_by?: string | null
}

export interface ValuationReportTemplate {
  id: string
  valuation_id: string
  template_id: string
  is_default: boolean
  added_by?: string | null
  added_at: string
}

// ============================================
// Assignment Types
// ============================================

export type AssignmentRole = 'lead' | 'team_member' | 'editor' | 'viewer'
export type EntityType = 'client' | 'valuation'

export interface AssignmentHistory {
  id: string
  entity_type: EntityType
  entity_id: string
  user_id: string
  role: AssignmentRole
  assigned_by?: string | null
  assigned_at: string
  removed_at?: string | null
  removed_by?: string | null
  notes?: string | null
}

// ============================================
// Cap Table Types
// ============================================

export type ShareClassType = 'Common' | 'Preferred'
export type PreferenceType = 'Non-Participating' | 'Participating' | 'Participating with Cap'
export type DividendsType = 'None' | 'Cumulative' | 'Non-Cumulative'
export type OptionsType = 'Options' | 'Warrants' | 'RSUs'

export interface ShareClass {
  id: string
  valuation_id: string
  type: ShareClassType
  class_name: string
  round_date?: string | null
  shares: number
  price_per_share: number
  amount_invested: number
  preference_type?: PreferenceType | null
  lp_multiple?: number | null
  liquidation_multiple: number
  liquidation_preference: number
  seniority?: number | null
  seniority_rank?: number | null
  participation: boolean
  participation_cap?: number | null
  conversion_ratio: number
  as_conv_shares: number
  percent_upon_conv: number
  dividends_declared: boolean
  div_rate?: number | null
  dividends_type: DividendsType
  pik: boolean
  total_dividends: number
  created_at: string
  updated_at: string
}

export interface OptionsWarrant {
  id: string
  valuation_id: string
  num_options: number
  exercise_price: number
  type: OptionsType
  grant_date?: string | null
  grantee_name?: string | null
  vesting_start_date?: string | null
  vesting_schedule?: string | null
  vesting_months?: number | null
  cliff_months?: number | null
  expiration_date?: string | null
  status?: string
  created_at: string
  updated_at: string
}

// ============================================
// Other Types
// ============================================

export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: Exclude<StandardizedRole, 'owner'> // Can't invite as owner
  token: string
  invited_by: string
  expires_at: string
  accepted_at?: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  organization_id?: string | null
  user_id: string
  action: string
  entity_type?: string | null
  entity_id?: string | null
  metadata: Record<string, any>
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

// ============================================
// Helper Types
// ============================================

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ============================================
// Form/API Types
// ============================================

export interface CreateClientRequest {
  name: string
  organization_id?: string
  legal_name?: string
  incorporation_date?: string
  state_of_incorporation?: string
  ein?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  industry?: string
  stage?: string
  location?: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  description?: string
  lead_assigned?: string
  team_members?: string[]
  tags?: string[]
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

export interface AssignmentUpdate {
  lead_assigned?: string | null
  team_members?: string[]
  editor_members?: string[]
  viewer_members?: string[]
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Type guard functions
export const isClient = (entity: any): entity is Client => {
  return entity && typeof entity === 'object' && 'lead_assigned' in entity
}

export const isValuation = (entity: any): entity is Valuation => {
  return entity && typeof entity === 'object' && 'valuation_date' in entity
}

export const hasEditPermission = (role: StandardizedRole): boolean => {
  return ['owner', 'admin', 'appraiser', 'analyst'].includes(role)
}

export const hasViewPermission = (role: StandardizedRole): boolean => {
  return true // All roles can view
}
