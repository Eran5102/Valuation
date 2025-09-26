import { useCallback } from 'react'
import { TeamMember, Investor } from '../types'

export function useTeamManagement(
  managementTeam: TeamMember[],
  setManagementTeam: (team: TeamMember[]) => void,
  keyInvestors: Investor[],
  setKeyInvestors: (investors: Investor[]) => void,
  handleFieldChange: (sectionId: string, fieldId: string, value: any) => void
) {
  // Team Member Management Functions
  const addTeamMember = useCallback(() => {
    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      name: '',
      title: '',
    }
    const updatedTeam = [...managementTeam, newMember]
    setManagementTeam(updatedTeam)
    handleFieldChange('company_profile', 'management_team', updatedTeam)
  }, [managementTeam, setManagementTeam, handleFieldChange])

  const updateTeamMember = useCallback(
    (memberId: string, field: 'name' | 'title', value: string) => {
      const updatedTeam = managementTeam.map((member) =>
        member.id === memberId ? { ...member, [field]: value } : member
      )
      setManagementTeam(updatedTeam)
      handleFieldChange('company_profile', 'management_team', updatedTeam)
    },
    [managementTeam, setManagementTeam, handleFieldChange]
  )

  const removeTeamMember = useCallback(
    (memberId: string) => {
      const updatedTeam = managementTeam.filter((member) => member.id !== memberId)
      setManagementTeam(updatedTeam)
      handleFieldChange('company_profile', 'management_team', updatedTeam)
    },
    [managementTeam, setManagementTeam, handleFieldChange]
  )

  // Investor Management Functions
  const addInvestor = useCallback(() => {
    const newInvestor: Investor = {
      id: `investor_${Date.now()}`,
      name: '',
      type: 'VC',
    }
    const updatedInvestors = [...keyInvestors, newInvestor]
    setKeyInvestors(updatedInvestors)
    handleFieldChange('company_profile', 'key_investors', updatedInvestors)
  }, [keyInvestors, setKeyInvestors, handleFieldChange])

  const updateInvestor = useCallback(
    (investorId: string, field: 'name' | 'type', value: string) => {
      const updatedInvestors = keyInvestors.map((investor) =>
        investor.id === investorId ? { ...investor, [field]: value } : investor
      )
      setKeyInvestors(updatedInvestors)
      handleFieldChange('company_profile', 'key_investors', updatedInvestors)
    },
    [keyInvestors, setKeyInvestors, handleFieldChange]
  )

  const removeInvestor = useCallback(
    (investorId: string) => {
      const updatedInvestors = keyInvestors.filter((investor) => investor.id !== investorId)
      setKeyInvestors(updatedInvestors)
      handleFieldChange('company_profile', 'key_investors', updatedInvestors)
    },
    [keyInvestors, setKeyInvestors, handleFieldChange]
  )

  return {
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    addInvestor,
    updateInvestor,
    removeInvestor,
  }
}