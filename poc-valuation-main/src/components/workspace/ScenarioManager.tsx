import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusIcon, CircleDollarSign, Save, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TerminalAssumptions, DEFAULT_TERMINAL_ASSUMPTIONS } from '@/utils/scenarioUtils'

interface ScenarioManagerProps {
  scenario: any
  setScenario: (scenario: any) => void
  assumptions: any
  setAssumptions: (assumptions: any) => void
  historicals: any
  setHistoricals: (historicals: any) => void
  settings: any
  setSettings: (settings: any) => void
  onRefreshProjections?: () => void
}

export function ScenarioManager({
  scenario,
  setScenario,
  assumptions,
  setAssumptions,
  historicals,
  setHistoricals,
  settings,
  setSettings,
  onRefreshProjections,
}: ScenarioManagerProps) {
  const navigate = useNavigate()
  const [availableScenarios, setAvailableScenarios] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load available scenarios on mount
  useEffect(() => {
    loadAvailableScenarios()
  }, [])

  // When the component mounts, check for company data to sync
  useEffect(() => {
    const syncCompanyDataWithHistoricals = () => {
      try {
        const lastActualRevenue = localStorage.getItem('lastActualRevenue')

        if (lastActualRevenue && historicals) {
          const revenueValue = parseFloat(lastActualRevenue)

          // Only update if the value is valid and different from current
          if (
            !isNaN(revenueValue) &&
            revenueValue > 0 &&
            revenueValue !== historicals.lastActualRevenue
          ) {
            const updatedHistoricals = {
              ...historicals,
              lastActualRevenue: revenueValue,
            }

            setHistoricals(updatedHistoricals)
            console.log('Updated historicals with latest revenue:', revenueValue)

            // Dispatch event to notify DCF module
            window.dispatchEvent(new CustomEvent('scenarioDataUpdated'))
            toast.success('Revenue data synced from company data', {
              description: 'Your DCF projections have been updated.',
            })
          }
        }

        // Also sync EBITDA if available
        const lastActualEbitda = localStorage.getItem('lastActualEbitda')
        if (lastActualEbitda && historicals) {
          const ebitdaValue = parseFloat(lastActualEbitda)

          if (
            !isNaN(ebitdaValue) &&
            ebitdaValue > 0 &&
            ebitdaValue !== historicals.lastActualEbitda
          ) {
            const updatedHistoricals = {
              ...historicals,
              lastActualEbitda: ebitdaValue,
            }

            setHistoricals(updatedHistoricals)
            console.log('Updated historicals with latest EBITDA:', ebitdaValue)
          }
        }
      } catch (error) {
        console.error('Error syncing company data with historicals:', error)
        toast.error('Error syncing company data')
      }
    }

    syncCompanyDataWithHistoricals()

    // Listen for company data updates
    const handleCompanyDataUpdate = () => {
      syncCompanyDataWithHistoricals()
    }

    window.addEventListener('companyFinancialDataUpdated', handleCompanyDataUpdate)

    return () => {
      window.removeEventListener('companyFinancialDataUpdated', handleCompanyDataUpdate)
    }
  }, [historicals, setHistoricals])

  const loadAvailableScenarios = () => {
    setIsLoading(true)
    try {
      // Load scenarios from localStorage
      const scenariosData = localStorage.getItem('scenarios')
      if (scenariosData) {
        const parsedScenarios = JSON.parse(scenariosData)
        const scenarioList = parsedScenarios.map((s: any) => ({ id: s.id, name: s.name }))
        setAvailableScenarios(scenarioList)
      } else {
        // Default scenario if none found
        setAvailableScenarios([{ id: 'base-case', name: 'Base Case' }])
      }
    } catch (error) {
      console.error('Error loading scenarios:', error)
      toast.error('Could not load available scenarios')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchScenario = (scenarioId: string, scenarioName: string) => {
    try {
      // First save current scenario data
      saveCurrentScenarioData()

      // Then load the selected scenario
      const selectedScenario = { id: scenarioId, name: scenarioName }
      setScenario(selectedScenario)

      // Load assumptions and other data for this scenario
      const scenariosData = localStorage.getItem('scenarios')
      if (scenariosData) {
        const parsedScenarios = JSON.parse(scenariosData)
        const scenarioData = parsedScenarios.find((s: any) => s.id === scenarioId)

        if (scenarioData) {
          if (scenarioData.assumptions) setAssumptions(scenarioData.assumptions)
          if (scenarioData.historicals) setHistoricals(scenarioData.historicals)

          // Update settings with terminal assumptions if available
          if (scenarioData.terminalAssumptions) {
            setSettings((prevSettings) => ({
              ...prevSettings,
              terminalGrowthRate: scenarioData.terminalAssumptions.terminalGrowthRate,
              terminalNopatMargin: scenarioData.terminalAssumptions.terminalNopatMargin,
              terminalReinvestmentRate: scenarioData.terminalAssumptions.terminalReinvestmentRate,
            }))
          } else {
            // Set default terminal assumptions if none exist
            setSettings((prevSettings) => ({
              ...prevSettings,
              terminalGrowthRate: DEFAULT_TERMINAL_ASSUMPTIONS.terminalGrowthRate,
              terminalNopatMargin: DEFAULT_TERMINAL_ASSUMPTIONS.terminalNopatMargin,
              terminalReinvestmentRate: DEFAULT_TERMINAL_ASSUMPTIONS.terminalReinvestmentRate,
            }))
          }

          if (scenarioData.settings) {
            // Merge existing settings with loaded settings but preserve terminal values we just set
            const terminalSettings = {
              terminalGrowthRate:
                settings.terminalGrowthRate || DEFAULT_TERMINAL_ASSUMPTIONS.terminalGrowthRate,
              terminalNopatMargin:
                settings.terminalNopatMargin || DEFAULT_TERMINAL_ASSUMPTIONS.terminalNopatMargin,
              terminalReinvestmentRate:
                settings.terminalReinvestmentRate ||
                DEFAULT_TERMINAL_ASSUMPTIONS.terminalReinvestmentRate,
            }

            setSettings({
              ...scenarioData.settings,
              ...terminalSettings,
            })
          }

          // Update active scenario in localStorage
          localStorage.setItem('activeScenarioId', scenarioId)
          localStorage.setItem('activeScenarioName', scenarioName)

          // Notify other components about scenario change
          window.dispatchEvent(
            new CustomEvent('activeScenarioChanged', {
              detail: { id: scenarioId, name: scenarioName },
            })
          )

          // If this scenario has terminal assumptions, dispatch event for DCF updates
          if (scenarioData.terminalAssumptions) {
            window.dispatchEvent(
              new CustomEvent('terminalAssumptionsChanged', {
                detail: {
                  scenarioId: scenarioId,
                  terminalAssumptions: scenarioData.terminalAssumptions,
                },
              })
            )
          }

          toast.success(`Switched to scenario: ${scenarioName}`)

          // Refresh projections if callback provided
          if (onRefreshProjections) {
            setTimeout(onRefreshProjections, 100)
          }
        }
      }
    } catch (error) {
      console.error('Error switching scenarios:', error)
      toast.error('Could not switch scenarios')
    }
  }

  const saveCurrentScenarioData = () => {
    if (!scenario || !scenario.id) return

    try {
      const scenariosData = localStorage.getItem('scenarios')
      let parsedScenarios = scenariosData ? JSON.parse(scenariosData) : []

      // Find current scenario index or add if not exists
      const currentScenarioIndex = parsedScenarios.findIndex((s: any) => s.id === scenario.id)

      // Extract terminal assumptions from settings
      const terminalAssumptions: TerminalAssumptions = {
        terminalGrowthRate:
          settings.terminalGrowthRate || DEFAULT_TERMINAL_ASSUMPTIONS.terminalGrowthRate,
        terminalNopatMargin:
          settings.terminalNopatMargin || DEFAULT_TERMINAL_ASSUMPTIONS.terminalNopatMargin,
        terminalReinvestmentRate:
          settings.terminalReinvestmentRate ||
          DEFAULT_TERMINAL_ASSUMPTIONS.terminalReinvestmentRate,
      }

      const updatedScenario = {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description || '',
        lastModified: new Date().toISOString(),
        assumptions: assumptions,
        historicals: historicals,
        settings: settings,
        terminalAssumptions: terminalAssumptions,
      }

      if (currentScenarioIndex >= 0) {
        // Update existing
        parsedScenarios[currentScenarioIndex] = updatedScenario
      } else {
        // Add new
        parsedScenarios.push(updatedScenario)
      }

      // Save back to localStorage
      localStorage.setItem('scenarios', JSON.stringify(parsedScenarios))
      console.log(`Saved scenario data for: ${scenario.name}`)

      return true
    } catch (error) {
      console.error('Error saving scenario data:', error)
      return false
    }
  }

  const handleSaveScenario = () => {
    const success = saveCurrentScenarioData()
    if (success) {
      toast.success('Current scenario saved successfully')
      loadAvailableScenarios()
    } else {
      toast.error('Failed to save scenario')
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Active Scenario</span>
          <Button variant="outline" size="sm" onClick={handleSaveScenario} className="ml-2">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal">
              <span>{scenario?.name || 'Select a scenario'}</span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {availableScenarios.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => handleSwitchScenario(s.id, s.name)}
                className={s.id === scenario?.id ? 'bg-muted' : ''}
              >
                {s.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/workspace/1/scenarios')}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Manage Scenarios
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/workspace/1/company-data')}
          >
            <CircleDollarSign className="mr-2 h-4 w-4" />
            Update Company Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
