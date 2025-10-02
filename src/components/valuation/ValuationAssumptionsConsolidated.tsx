'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Building2,
  Clock,
  UserCheck,
  FileText,
  Activity,
  CreditCard,
  Search,
  Save,
  Check,
  AlertCircle,
  Calendar,
  Info,
  Filter,
  Users,
  Plus,
  X,
  Briefcase,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { ValuationMethodologySelector } from './ValuationMethodologySelector'
import { RiskFreeRateInput } from './RiskFreeRateInput'
import { VolatilityInput } from './VolatilityInput'
import { DatePicker } from '@/components/ui/date-picker'
import { useMethodologyStore } from '@/hooks/useMethodologyStore'
import { toast } from 'sonner'
import { saveAssumptions, getAssumptions } from '@/app/valuations/[id]/assumptions/actions'

interface TeamMember {
  id: string
  name: string
  title: string
}

interface Investor {
  id: string
  name: string
  type: string
}

interface AssumptionField {
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

// Export type alias for backward compatibility
export type Assumption = AssumptionField
export type { AssumptionSection }

interface AssumptionSection {
  id: string
  name: string
  icon: React.ElementType
  fields: AssumptionField[]
  description?: string
}

interface ValuationAssumptionsProps {
  valuationId: string
}

export default function ValuationAssumptionsConsolidated({
  valuationId,
}: ValuationAssumptionsProps) {
  const { methodologies } = useMethodologyStore()
  const [assumptions, setAssumptions] = useState<Record<string, any>>({})
  const [managementTeam, setManagementTeam] = useState<TeamMember[]>([])
  const [keyInvestors, setKeyInvestors] = useState<Investor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'required' | 'incomplete'>('all')
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Load existing assumptions on mount
  useEffect(() => {
    const loadAssumptions = async () => {
      try {
        setIsLoading(true)
        const data = await getAssumptions(valuationId)
        if (data) {
          // Convert flat database structure to nested structure for the form
          const formattedAssumptions: Record<string, any> = {}

          // Map database fields to form fields
          if (data.company_name) formattedAssumptions['company.company_name'] = data.company_name
          if (data.company_address)
            formattedAssumptions['company.company_address'] = data.company_address
          if (data.state_incorporation)
            formattedAssumptions['company.state_incorporation'] = data.state_incorporation
          if (data.incorporation_date)
            formattedAssumptions['company.incorporation_date'] = data.incorporation_date
          if (data.industry) formattedAssumptions['company.industry'] = data.industry
          if (data.company_stage)
            formattedAssumptions['company_profile.company_stage'] = data.company_stage
          if (data.valuation_date)
            formattedAssumptions['valuation_details.valuation_date'] = data.valuation_date
          if (data.fiscal_year_end)
            formattedAssumptions['company.fiscal_year_end'] = data.fiscal_year_end
          if (data.currency) formattedAssumptions['company.currency'] = data.currency
          if (data.discounting_convention)
            formattedAssumptions['company.discounting_convention'] = data.discounting_convention

          if (data.report_date)
            formattedAssumptions['valuation_details.report_date'] = data.report_date
          if (data.subject_security)
            formattedAssumptions['valuation_details.subject_security'] = data.subject_security
          if (data.valuation_purpose)
            formattedAssumptions['valuation_details.valuation_purpose'] = data.valuation_purpose
          if (data.standard_of_value)
            formattedAssumptions['valuation_details.standard_of_value'] = data.standard_of_value
          if (data.premise_of_value)
            formattedAssumptions['valuation_details.premise_of_value'] = data.premise_of_value

          if (data.designee_prefix)
            formattedAssumptions['designee.designee_prefix'] = data.designee_prefix
          if (data.designee_first_name)
            formattedAssumptions['designee.designee_first_name'] = data.designee_first_name
          if (data.designee_last_name)
            formattedAssumptions['designee.designee_last_name'] = data.designee_last_name
          if (data.designee_title)
            formattedAssumptions['designee.designee_title'] = data.designee_title
          if (data.engagement_letter_date)
            formattedAssumptions['designee.engagement_letter_date'] = data.engagement_letter_date

          if (data.appraiser_name)
            formattedAssumptions['appraiser.appraiser_name'] = data.appraiser_name
          if (data.appraiser_firm)
            formattedAssumptions['appraiser.appraiser_firm'] = data.appraiser_firm
          if (data.appraiser_credentials)
            formattedAssumptions['appraiser.appraiser_credentials'] = data.appraiser_credentials
          if (data.appraiser_phone)
            formattedAssumptions['appraiser.appraiser_phone'] = data.appraiser_phone
          if (data.appraiser_email)
            formattedAssumptions['appraiser.appraiser_email'] = data.appraiser_email

          if (data.historical_years !== undefined)
            formattedAssumptions['analysis_periods.historical_years'] = data.historical_years
          if (data.projection_years !== undefined)
            formattedAssumptions['analysis_periods.projection_years'] = data.projection_years

          if (data.risk_free_rate !== undefined)
            formattedAssumptions['volatility.risk_free_rate'] = data.risk_free_rate
          if (data.equity_volatility !== undefined)
            formattedAssumptions['volatility.equity_volatility'] = data.equity_volatility
          if (data.time_to_liquidity !== undefined)
            formattedAssumptions['volatility.time_to_liquidity'] = data.time_to_liquidity

          if (data.last_financing_date)
            formattedAssumptions['recent_transactions.last_financing_date'] =
              data.last_financing_date
          if (data.last_financing_amount)
            formattedAssumptions['recent_transactions.last_financing_amount'] =
              data.last_financing_amount
          if (data.last_financing_valuation)
            formattedAssumptions['recent_transactions.last_financing_valuation'] =
              data.last_financing_valuation
          if (data.last_financing_type)
            formattedAssumptions['recent_transactions.last_financing_type'] =
              data.last_financing_type

          // Load Company Profile fields
          if (data.company_description)
            formattedAssumptions['company_profile.company_description'] = data.company_description
          if (data.products_services)
            formattedAssumptions['company_profile.products_services'] = data.products_services
          if (data.industry_description)
            formattedAssumptions['company_profile.industry_description'] = data.industry_description
          if (data.stage_description)
            formattedAssumptions['company_profile.stage_description'] = data.stage_description

          // Load management team and investors if they exist
          if (data.management_team) {
            try {
              const team =
                typeof data.management_team === 'string'
                  ? JSON.parse(data.management_team)
                  : data.management_team
              setManagementTeam(team)
              formattedAssumptions['company_profile.management_team'] = team
            } catch (e) {}
          }

          if (data.key_investors) {
            try {
              const investors =
                typeof data.key_investors === 'string'
                  ? JSON.parse(data.key_investors)
                  : data.key_investors
              setKeyInvestors(investors)
              formattedAssumptions['company_profile.key_investors'] = investors
            } catch (e) {}
          }

          setAssumptions(formattedAssumptions)
        }
      } catch (error) {
        toast.error('Failed to load assumptions')
      } finally {
        setIsLoading(false)
      }
    }

    loadAssumptions()
  }, [valuationId])

  // Define consolidated sections
  const sections: AssumptionSection[] = [
    {
      id: 'methodology',
      name: 'Valuation Methodologies',
      icon: Settings,
      description: 'Select and weight the valuation methodologies',
      fields: [], // Handled by ValuationMethodologySelector
    },
    {
      id: 'company',
      name: 'Company Information',
      icon: Building2,
      description: 'Core company details and incorporation information',
      fields: [
        { id: 'company_name', name: 'Company Name', type: 'text', value: '', required: true },
        { id: 'company_address', name: 'Company Address', type: 'text', value: '' },
        {
          id: 'state_incorporation',
          name: 'State of Incorporation',
          type: 'select',
          value: 'Delaware',
          options: ['Delaware', 'California', 'New York', 'Texas', 'Nevada', 'Wyoming', 'Other'],
          required: true,
        },
        { id: 'incorporation_date', name: 'Date of Incorporation', type: 'date', value: '' },
        {
          id: 'industry',
          name: 'Industry',
          type: 'select',
          value: '',
          options: [
            'Technology',
            'Healthcare',
            'Financial Services',
            'Consumer',
            'Industrial',
            'Energy',
            'Real Estate',
            'Other',
          ],
          required: true,
        },
        { id: 'fiscal_year_end', name: 'Fiscal Year End', type: 'date', value: '', required: true },
        {
          id: 'currency',
          name: 'Currency',
          type: 'select',
          value: 'USD',
          options: ['USD', 'EUR', 'GBP', 'CAD'],
        },
        {
          id: 'discounting_convention',
          name: 'Discounting Convention',
          type: 'select',
          value: 'Mid-Year',
          options: ['Mid-Year', 'End-Year'],
          description: 'When cash flows are assumed to occur during the period',
        },
      ],
    },
    {
      id: 'company_profile',
      name: 'Company Profile',
      icon: Briefcase,
      description: 'Detailed company profile and stakeholder information',
      fields: [
        {
          id: 'company_stage',
          name: 'Company Stage',
          type: 'select',
          value: '',
          options: [
            'Stage 1: Ideation',
            'Stage 2: Product Development',
            'Stage 3: Development Progress',
            'Stage 4: Early Revenue',
            'Stage 5: Revenue Generation',
            'Stage 6: Established Operations',
          ],
          required: true,
        },
        {
          id: 'stage_description',
          name: 'Stage Description',
          type: 'textarea',
          value: '',
          placeholder: 'Select a stage to auto-populate or enter custom description',
          description: 'AICPA stage description - automatically populated when stage is selected',
        },
        {
          id: 'company_description',
          name: 'Company Description',
          type: 'textarea',
          value: '',
          placeholder: 'Brief description of the company and its mission',
        },
        {
          id: 'products_services',
          name: 'Products & Services',
          type: 'textarea',
          value: '',
          placeholder: 'Description of main products and services offered',
        },
        {
          id: 'management_team',
          name: 'Management Team',
          type: 'team',
          value: [],
          description: 'Key management team members',
        },
        {
          id: 'key_investors',
          name: 'Key Investors',
          type: 'investors',
          value: [],
          description: 'Major investors and stakeholders',
        },
        {
          id: 'industry_description',
          name: 'Industry Description',
          type: 'textarea',
          value: '',
          placeholder: 'Description of the industry and market dynamics',
        },
      ],
    },
    {
      id: 'valuation_details',
      name: 'Valuation Details',
      icon: FileText,
      description: 'Purpose and standards for the valuation',
      fields: [
        { id: 'valuation_date', name: 'Valuation Date', type: 'date', value: '', required: true },
        { id: 'report_date', name: 'Report Date', type: 'date', value: '' },
        {
          id: 'subject_security',
          name: 'Subject Security',
          type: 'text',
          value: '',
          placeholder: 'e.g., Common Stock, Series A Preferred Stock',
          description: 'The type of security being valued',
          required: true,
        },
        {
          id: 'valuation_purpose',
          name: 'Valuation Purpose',
          type: 'text',
          value: 'Section 409A of the Internal Revenue Code',
          required: true,
        },
        {
          id: 'standard_of_value',
          name: 'Standard of Value',
          type: 'select',
          value: 'Fair Market Value',
          options: ['Fair Market Value', 'Fair Value', 'Investment Value', 'Intrinsic Value'],
          required: true,
        },
        {
          id: 'premise_of_value',
          name: 'Premise of Value',
          type: 'select',
          value: 'Going Concern',
          options: ['Going Concern', 'Liquidation', 'Orderly Liquidation', 'Forced Liquidation'],
          required: true,
        },
      ],
    },
    {
      id: 'designee',
      name: 'Designee Information',
      icon: Users,
      description: 'Person the valuation report will be addressed to',
      fields: [
        {
          id: 'designee_prefix',
          name: 'Prefix',
          type: 'select',
          value: 'Mr.',
          options: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'],
          required: true,
        },
        { id: 'designee_first_name', name: 'First Name', type: 'text', value: '', required: true },
        { id: 'designee_last_name', name: 'Last Name', type: 'text', value: '', required: true },
        {
          id: 'designee_title',
          name: 'Title',
          type: 'text',
          value: '',
          placeholder: 'e.g., CEO, CFO, Board Member',
          required: true,
        },
        {
          id: 'engagement_letter_date',
          name: 'Engagement Letter Date',
          type: 'date',
          value: '',
          description: 'Date the engagement letter was signed',
          required: true,
        },
      ],
    },
    {
      id: 'appraiser',
      name: 'Appraiser Information',
      icon: UserCheck,
      description: 'Details about the valuation professional',
      fields: [
        { id: 'appraiser_name', name: 'Appraiser Name', type: 'text', value: '', required: true },
        { id: 'appraiser_firm', name: 'Appraiser Firm', type: 'text', value: '', required: true },
        {
          id: 'appraiser_credentials',
          name: 'Credentials (ASA, CFA, etc.)',
          type: 'text',
          value: '',
        },
        { id: 'appraiser_phone', name: 'Contact Phone', type: 'text', value: '' },
        { id: 'appraiser_email', name: 'Contact Email', type: 'text', value: '', required: true },
      ],
    },
    {
      id: 'analysis_periods',
      name: 'Analysis Periods',
      icon: Clock,
      description: 'Historical and projection periods for analysis',
      fields: [
        {
          id: 'historical_years',
          name: 'Number of Historical Years',
          type: 'number',
          value: 3,
          description: 'Number of historical fiscal years to include (1-10)',
          required: true,
        },
        {
          id: 'projection_years',
          name: 'Projection Years',
          type: 'number',
          value: 5,
          description: 'Number of years to project (1-30)',
          required: true,
        },
      ],
    },
    {
      id: 'volatility',
      name: 'Volatility & Risk-Free Rate',
      icon: Activity,
      description: 'Market volatility and risk-free rate parameters',
      fields: [
        {
          id: 'risk_free_rate',
          name: 'Risk-Free Rate (%)',
          type: 'percentage',
          value: 4.5,
          description: 'Current risk-free rate for option pricing',
          required: true,
        },
        {
          id: 'equity_volatility',
          name: 'Equity Volatility (%)',
          type: 'percentage',
          value: 60,
          description: 'Expected volatility of equity',
        },
        {
          id: 'time_to_liquidity',
          name: 'Expected Time to Liquidity (Years)',
          type: 'number',
          value: 3,
          description: 'Expected time until a liquidity event',
        },
      ],
    },
    {
      id: 'recent_transactions',
      name: 'Recent Transactions',
      icon: CreditCard,
      description: 'Recent financing or transaction information',
      fields: [
        { id: 'last_financing_date', name: 'Last Financing Date', type: 'date', value: '' },
        { id: 'last_financing_amount', name: 'Last Financing Amount', type: 'currency', value: '' },
        {
          id: 'last_financing_valuation',
          name: 'Post-Money Valuation',
          type: 'currency',
          value: '',
        },
        {
          id: 'last_financing_type',
          name: 'Financing Type',
          type: 'select',
          value: '',
          options: [
            'Series Seed',
            'Series A',
            'Series B',
            'Series C',
            'Series D+',
            'Convertible Note',
            'SAFE',
            'Other',
          ],
        },
      ],
    },
  ]

  // AICPA stage descriptions
  const stageDescriptions: Record<string, string> = {
    'Stage 1: Ideation':
      'The Idea - Ideation and Initial Concept: No tangible product exists. Management team typically incomplete. Initial funding from founders, friends, and family. No product revenue and limited expense history. Valuation highly subjective; Backsolve Method most reliable if recent transaction occurred.',
    'Stage 2: Product Development':
      'The Plan - Formalization and Early Development: Product development actively underway, business challenges better understood. Management team being assembled. First or second round of financing (preferred stock) to fund development. No product revenue but substantive expense history. Backsolve Method remains primary valuation tool.',
    'Stage 3: Development Progress':
      'The Product - Nearing Completion: Key development milestones met, product nearing completion with alpha/beta testing. More complete management team in place. Continued financing through preferred stock. Generally no product revenue yet. Valuation approaches expanded to include DCF and market comparables.',
    'Stage 4: Early Revenue':
      'First Sales - Initial Market Entry: Product launched to market with initial customer sales. Complete or near-complete management team. Additional financing rounds for market expansion. Initial product revenues but operating at a loss. Market approach gains prominence alongside DCF methodology.',
    'Stage 5: Revenue Generation':
      'Growth - Market Expansion: Growing sales to expanding customer base with potential market leadership. Management team complete and expanding. Later stage financing through multiple investor groups. Significant revenue growth approaching profitability. Comparable company analysis becomes primary valuation methodology.',
    'Stage 6: Established Operations':
      'Maturity - Profitable Operations: Established market position with sustainable competitive advantages. Experienced and stable management team. Potential for IPO or strategic exit. Profitable operations with positive cash flows. Market multiples and guideline transactions provide reliable valuation benchmarks.',
  }

  // Handle field value changes
  const handleFieldChange = (
    sectionId: string,
    fieldId: string,
    value: string | number | any[]
  ) => {
    setAssumptions((prev) => ({
      ...prev,
      [`${sectionId}.${fieldId}`]: value,
    }))
    setHasChanges(true)

    // Auto-populate stage description when company stage is selected
    if (sectionId === 'company_profile' && fieldId === 'company_stage' && value) {
      const description = stageDescriptions[value as string] || ''
      if (description) {
        // Also update the stage_description field
        setAssumptions((prev) => ({
          ...prev,
          'company_profile.stage_description': description,
        }))
      }
    }
  }

  // Team Member Management Functions
  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      name: '',
      title: '',
    }
    const updatedTeam = [...managementTeam, newMember]
    setManagementTeam(updatedTeam)
    handleFieldChange('company_profile', 'management_team', updatedTeam)
  }

  const updateTeamMember = (memberId: string, field: 'name' | 'title', value: string) => {
    const updatedTeam = managementTeam.map((member) =>
      member.id === memberId ? { ...member, [field]: value } : member
    )
    setManagementTeam(updatedTeam)
    handleFieldChange('company_profile', 'management_team', updatedTeam)
  }

  const removeTeamMember = (memberId: string) => {
    const updatedTeam = managementTeam.filter((member) => member.id !== memberId)
    setManagementTeam(updatedTeam)
    handleFieldChange('company_profile', 'management_team', updatedTeam)
  }

  // Investor Management Functions
  const addInvestor = () => {
    const newInvestor: Investor = {
      id: `investor_${Date.now()}`,
      name: '',
      type: 'VC',
    }
    const updatedInvestors = [...keyInvestors, newInvestor]
    setKeyInvestors(updatedInvestors)
    handleFieldChange('company_profile', 'key_investors', updatedInvestors)
  }

  const updateInvestor = (investorId: string, field: 'name' | 'type', value: string) => {
    const updatedInvestors = keyInvestors.map((investor) =>
      investor.id === investorId ? { ...investor, [field]: value } : investor
    )
    setKeyInvestors(updatedInvestors)
    handleFieldChange('company_profile', 'key_investors', updatedInvestors)
  }

  const removeInvestor = (investorId: string) => {
    const updatedInvestors = keyInvestors.filter((investor) => investor.id !== investorId)
    setKeyInvestors(updatedInvestors)
    handleFieldChange('company_profile', 'key_investors', updatedInvestors)
  }

  // Save assumptions
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Convert nested form structure back to flat database structure
      const dataToSave: any = {}

      // Extract company section
      Object.entries(assumptions).forEach(([key, value]) => {
        if (key.startsWith('company.')) {
          const fieldName = key.replace('company.', '')
          dataToSave[fieldName] = value
        } else if (key.startsWith('company_profile.')) {
          const fieldName = key.replace('company_profile.', '')
          // Handle special fields
          if (fieldName === 'management_team' || fieldName === 'key_investors') {
            dataToSave[fieldName] = JSON.stringify(value)
          } else {
            dataToSave[fieldName] = value
          }
        } else if (key.startsWith('valuation_details.')) {
          const fieldName = key.replace('valuation_details.', '')
          dataToSave[fieldName] = value
        } else if (key.startsWith('designee.')) {
          const fieldName = key.replace('designee.', '')
          dataToSave[fieldName] = value
        } else if (key.startsWith('appraiser.')) {
          const fieldName = key.replace('appraiser.', '')
          dataToSave[fieldName] = value
        } else if (key.startsWith('analysis_periods.')) {
          const fieldName = key.replace('analysis_periods.', '')
          dataToSave[fieldName] = typeof value === 'string' ? parseInt(value) : value
        } else if (key.startsWith('volatility.')) {
          const fieldName = key.replace('volatility.', '')
          dataToSave[fieldName] = typeof value === 'string' ? parseFloat(value) : value
        } else if (key.startsWith('recent_transactions.')) {
          const fieldName = key.replace('recent_transactions.', '')
          if (fieldName === 'last_financing_amount' || fieldName === 'last_financing_valuation') {
            dataToSave[fieldName] = typeof value === 'string' ? parseFloat(value) : value
          } else {
            dataToSave[fieldName] = value
          }
        }
      })

      const result = await saveAssumptions(valuationId, dataToSave)

      if (result.success) {
        toast.success('Assumptions saved successfully')
        setHasChanges(false)
      } else {
        throw new Error(result.error || 'Failed to save assumptions')
      }
    } catch (error) {
      toast.error('Failed to save assumptions')
    } finally {
      setIsSaving(false)
    }
  }

  // Filter sections and fields based on search and filter
  const getFilteredSections = () => {
    return sections
      .map((section) => {
        let filteredFields = section.fields

        // Apply search filter
        if (searchQuery) {
          filteredFields = filteredFields.filter(
            (field) =>
              field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              field.id.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        // Apply status filter
        if (filterStatus === 'required') {
          filteredFields = filteredFields.filter((field) => field.required)
        } else if (filterStatus === 'incomplete') {
          filteredFields = filteredFields.filter((field) => {
            const value = assumptions[`${section.id}.${field.id}`]
            return (value === undefined || value === null || value === '') && field.required
          })
        }

        return { ...section, fields: filteredFields }
      })
      .filter((section) => section.id === 'methodology' || section.fields.length > 0)
  }

  // Calculate completion stats
  const getCompletionStats = () => {
    let totalFields = 0
    let completedFields = 0
    let requiredFields = 0
    let requiredCompleted = 0

    sections.forEach((section) => {
      section.fields.forEach((field) => {
        totalFields++
        const value = assumptions[`${section.id}.${field.id}`]
        if (value !== undefined && value !== null && value !== '') completedFields++
        if (field.required) {
          requiredFields++
          if (value !== undefined && value !== null && value !== '') requiredCompleted++
        }
      })
    })

    return {
      totalFields,
      completedFields,
      requiredFields,
      requiredCompleted,
      completionPercentage: totalFields > 0 ? (completedFields / totalFields) * 100 : 0,
      requiredPercentage: requiredFields > 0 ? (requiredCompleted / requiredFields) * 100 : 0,
    }
  }

  const stats = getCompletionStats()
  const filteredSections = getFilteredSections()

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)
      setTimeout(() => setActiveSection(null), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading assumptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Valuation Assumptions</h1>
              <p className="mt-1 text-muted-foreground">
                Configure all assumptions and inputs for your valuation
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="bg-yellow-50">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Unsaved changes
                </Badge>
              )}
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assumptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value: 'all' | 'required' | 'incomplete') => setFilterStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="required">Required Only</SelectItem>
                <SelectItem value="incomplete">Incomplete Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sections */}
        <Accordion type="multiple" className="space-y-4">
          {filteredSections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id

            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                id={`section-${section.id}`}
                className={cn(
                  'rounded-lg border bg-card transition-all',
                  isActive && 'ring-2 ring-primary'
                )}
              >
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="mr-2 flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <div className="text-base font-semibold">{section.name}</div>
                        {section.description && (
                          <div className="mt-1 text-sm font-normal text-muted-foreground">
                            {section.description}
                          </div>
                        )}
                      </div>
                    </div>
                    {section.id !== 'methodology' && (
                      <Badge variant="outline" className="ml-2">
                        {
                          section.fields.filter((f) => {
                            const value = assumptions[`${section.id}.${f.id}`]
                            return value !== undefined && value !== null && value !== ''
                          }).length
                        }
                        /{section.fields.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6">
                  {section.id === 'methodology' ? (
                    <ValuationMethodologySelector />
                  ) : section.id === 'volatility' ? (
                    <div className="space-y-4">
                      {/* Two-column layout for Risk-Free Rate and Volatility */}
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Risk-Free Rate Column */}
                        <div className="space-y-2">
                          <RiskFreeRateInput
                            assumption={{
                              id: 'risk_free_rate',
                              name: 'Risk-Free Rate (%)',
                              value: assumptions['volatility.risk_free_rate'] || 4.5,
                              type: 'percentage',
                              description: 'Current risk-free rate for option pricing',
                              required: true,
                            }}
                            categoryId="volatility"
                            onChange={(catId, assumptionId, value) =>
                              handleFieldChange(catId, assumptionId, value)
                            }
                            valuationDate={assumptions['company.valuation_date']}
                            timeToLiquidity={assumptions['volatility.time_to_liquidity'] || 3}
                          />
                        </div>

                        {/* Volatility Column */}
                        <div className="space-y-2">
                          <VolatilityInput
                            assumption={{
                              id: 'equity_volatility',
                              name: 'Equity Volatility (%)',
                              value: assumptions['volatility.equity_volatility'] || 60,
                              type: 'percentage',
                              description: 'Expected volatility of equity',
                            }}
                            categoryId="volatility"
                            onChange={(catId, assumptionId, value) =>
                              handleFieldChange(catId, assumptionId, value)
                            }
                          />
                        </div>
                      </div>

                      {/* Time to Liquidity - Full width below */}
                      <div className="mt-4">
                        <Label htmlFor="time_to_liquidity">
                          Expected Time to Liquidity (Years)
                        </Label>
                        <p className="mb-2 text-xs text-muted-foreground">
                          Expected time until a liquidity event (IPO, acquisition, etc.)
                        </p>
                        <Input
                          id="time_to_liquidity"
                          type="number"
                          value={assumptions['volatility.time_to_liquidity'] || 3}
                          onChange={(e) =>
                            handleFieldChange(
                              'volatility',
                              'time_to_liquidity',
                              parseFloat(e.target.value)
                            )
                          }
                          className="max-w-xs"
                          step="0.5"
                          min="0.5"
                          max="10"
                        />
                      </div>
                    </div>
                  ) : section.id === 'company_profile' ? (
                    <div className="space-y-4">
                      {section.fields.map((field) => {
                        // Handle special field types
                        if (field.type === 'team') {
                          return (
                            <div key={field.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>{field.name}</Label>
                                  {field.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {field.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={addTeamMember}
                                  className="gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Member
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {managementTeam.map((member) => (
                                  <div key={member.id} className="flex items-start gap-2">
                                    <Input
                                      placeholder="Name"
                                      value={member.name}
                                      onChange={(e) =>
                                        updateTeamMember(member.id, 'name', e.target.value)
                                      }
                                      className="flex-1"
                                    />
                                    <Input
                                      placeholder="Title"
                                      value={member.title}
                                      onChange={(e) =>
                                        updateTeamMember(member.id, 'title', e.target.value)
                                      }
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeTeamMember(member.id)}
                                      className="h-9 w-9"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                {managementTeam.length === 0 && (
                                  <div className="py-2 text-sm text-muted-foreground">
                                    No team members added yet. Click "Add Member" to start.
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }

                        if (field.type === 'investors') {
                          return (
                            <div key={field.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label>{field.name}</Label>
                                  {field.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {field.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={addInvestor}
                                  className="gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Investor
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {keyInvestors.map((investor) => (
                                  <div key={investor.id} className="flex items-start gap-2">
                                    <Input
                                      placeholder="Investor Name"
                                      value={investor.name}
                                      onChange={(e) =>
                                        updateInvestor(investor.id, 'name', e.target.value)
                                      }
                                      className="flex-1"
                                    />
                                    <Select
                                      value={investor.type}
                                      onValueChange={(value) =>
                                        updateInvestor(investor.id, 'type', value)
                                      }
                                    >
                                      <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="VC">VC</SelectItem>
                                        <SelectItem value="Angel">Angel</SelectItem>
                                        <SelectItem value="Strategic">Strategic</SelectItem>
                                        <SelectItem value="PE">Private Equity</SelectItem>
                                        <SelectItem value="Family Office">Family Office</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeInvestor(investor.id)}
                                      className="h-9 w-9"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                {keyInvestors.length === 0 && (
                                  <div className="py-2 text-sm text-muted-foreground">
                                    No investors added yet. Click "Add Investor" to start.
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }

                        // Regular fields
                        return (
                          <div
                            key={field.id}
                            className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                          >
                            <Label htmlFor={field.id}>
                              {field.name}
                              {field.required && <span className="ml-1 text-red-500">*</span>}
                            </Label>
                            {field.description && (
                              <p className="text-xs text-muted-foreground">{field.description}</p>
                            )}
                            {field.type === 'select' ? (
                              <Select
                                value={assumptions[`${section.id}.${field.id}`] || field.value}
                                onValueChange={(value) =>
                                  handleFieldChange(section.id, field.id, value)
                                }
                              >
                                <SelectTrigger id={field.id} className="mt-1">
                                  <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                id={field.id}
                                value={assumptions[`${section.id}.${field.id}`] || field.value}
                                onChange={(e) =>
                                  handleFieldChange(section.id, field.id, e.target.value)
                                }
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                rows={3}
                                placeholder={field.placeholder}
                              />
                            ) : field.type === 'date' ? (
                              <DatePicker
                                value={
                                  assumptions[`${section.id}.${field.id}`]
                                    ? new Date(assumptions[`${section.id}.${field.id}`])
                                    : undefined
                                }
                                onChange={(date) =>
                                  handleFieldChange(
                                    section.id,
                                    field.id,
                                    date?.toISOString().split('T')[0] || ''
                                  )
                                }
                                placeholder={field.placeholder || 'Select date'}
                                className="mt-1"
                              />
                            ) : (
                              <Input
                                id={field.id}
                                type={field.type === 'percentage' ? 'number' : field.type}
                                value={assumptions[`${section.id}.${field.id}`] || field.value}
                                onChange={(e) =>
                                  handleFieldChange(section.id, field.id, e.target.value)
                                }
                                className="mt-1"
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {section.fields.map((field) => (
                        <div key={field.id}>
                          <Label htmlFor={field.id}>
                            {field.name}
                            {field.required && <span className="ml-1 text-red-500">*</span>}
                          </Label>
                          {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          )}
                          {field.type === 'select' ? (
                            <Select
                              value={assumptions[`${section.id}.${field.id}`] || field.value}
                              onValueChange={(value) =>
                                handleFieldChange(section.id, field.id, value)
                              }
                            >
                              <SelectTrigger id={field.id} className="mt-1">
                                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              id={field.id}
                              value={assumptions[`${section.id}.${field.id}`] || field.value}
                              onChange={(e) =>
                                handleFieldChange(section.id, field.id, e.target.value)
                              }
                              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              rows={3}
                              placeholder={field.placeholder}
                            />
                          ) : field.type === 'date' ? (
                            <DatePicker
                              value={
                                assumptions[`${section.id}.${field.id}`]
                                  ? new Date(assumptions[`${section.id}.${field.id}`])
                                  : undefined
                              }
                              onChange={(date) =>
                                handleFieldChange(
                                  section.id,
                                  field.id,
                                  date?.toISOString().split('T')[0] || ''
                                )
                              }
                              placeholder={field.placeholder || 'Select date'}
                              className="mt-1"
                            />
                          ) : (
                            <Input
                              id={field.id}
                              type={field.type === 'percentage' ? 'number' : field.type}
                              value={assumptions[`${section.id}.${field.id}`] || field.value}
                              onChange={(e) =>
                                handleFieldChange(section.id, field.id, e.target.value)
                              }
                              className="mt-1"
                              placeholder={field.placeholder}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 space-y-4">
        {/* Completion Status Card - Moved to Top */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(stats.completionPercentage)}%</span>
              </div>
              <Progress value={stats.completionPercentage} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Required Fields</span>
                <span className="font-medium">{Math.round(stats.requiredPercentage)}%</span>
              </div>
              <Progress value={stats.requiredPercentage} className="mt-2" />
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Fields</span>
                <span className="font-medium">{stats.totalFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">{stats.completedFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required</span>
                <span className="font-medium">{stats.requiredFields}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required Complete</span>
                <span className="font-medium text-green-600">
                  {stats.requiredCompleted}/{stats.requiredFields}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const sectionStats = section.fields.filter((f) => {
                    const value = assumptions[`${section.id}.${f.id}`]
                    return value !== undefined && value !== null && value !== ''
                  }).length

                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                        activeSection === section.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{section.name}</span>
                      </div>
                      {section.id !== 'methodology' && (
                        <Badge variant="outline" className="h-5 px-1 text-xs">
                          {sectionStats}/{section.fields.length}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Methodologies Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Methodologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {methodologies
                .filter((m) => m.enabled)
                .map((method) => (
                  <div key={method.id} className="flex items-center justify-between text-sm">
                    <span>{method.name}</span>
                    <Badge variant="secondary">{method.weight}%</Badge>
                  </div>
                ))}
              {methodologies.filter((m) => m.enabled).length === 0 && (
                <p className="text-sm text-muted-foreground">No methodologies selected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
