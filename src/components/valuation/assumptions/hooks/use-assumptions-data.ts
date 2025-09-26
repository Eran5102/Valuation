import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { saveAssumptions, getAssumptions } from '@/app/valuations/[id]/assumptions/actions'
import { TeamMember, Investor } from '../types'
import { formatAssumptionsFromDatabase, formatAssumptionsForDatabase, parseTeamData, parseInvestorData } from '../data-mapping'

export function useAssumptionsData(valuationId: string) {
  const [assumptions, setAssumptions] = useState<Record<string, any>>({})
  const [managementTeam, setManagementTeam] = useState<TeamMember[]>([])
  const [keyInvestors, setKeyInvestors] = useState<Investor[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load existing assumptions on mount
  useEffect(() => {
    const loadAssumptions = async () => {
      try {
        setIsLoading(true)
        const data = await getAssumptions(valuationId)
        if (data) {
          const formattedAssumptions = formatAssumptionsFromDatabase(data)

          // Load management team and investors if they exist
          if (data.management_team) {
            const team = parseTeamData(data.management_team)
            setManagementTeam(team)
            formattedAssumptions['company_profile.management_team'] = team
          }

          if (data.key_investors) {
            const investors = parseInvestorData(data.key_investors)
            setKeyInvestors(investors)
            formattedAssumptions['company_profile.key_investors'] = investors
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

  // Save assumptions
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dataToSave = formatAssumptionsForDatabase(assumptions)
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

  return {
    assumptions,
    setAssumptions,
    managementTeam,
    setManagementTeam,
    keyInvestors,
    setKeyInvestors,
    hasChanges,
    setHasChanges,
    isSaving,
    isLoading,
    handleSave,
  }
}