import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssumptionTable } from '@/components/workspace/dcf/AssumptionTable'
import { generateProjectionLabels } from '@/utils/fiscalYearUtils'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { PlusCircle, Save, Trash2, Edit, Lock, LockOpen, FileBarChart } from 'lucide-react'
import { toast } from 'sonner'
import { useCompanyFinancialData } from '@/hooks/useCompanyFinancialData'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPercent, formatCurrency } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Scenario,
  TerminalAssumptions,
  DEFAULT_TERMINAL_ASSUMPTIONS,
  createNewScenario,
  createDefaultScenarios,
  calculateScenarioProjections,
  updateScenarioAssumption,
  updateTerminalAssumptions,
  loadScenariosFromLocalStorage,
  saveActiveScenarioId,
} from '@/utils/scenarioUtils'
import { Separator } from '@/components/ui/separator'

export default function ScenarioManager() {
  const { settings } = useProjectSettings()
  const { financialData } = useCompanyFinancialData()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [activeScenarioId, setActiveScenarioId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'incomeCf' | 'balanceSheet'>('incomeCf')
  const [editingName, setEditingName] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const [lastModified, setLastModified] = useState<string>('')
  const [isEditMode, setIsEditMode] = useState(false)

  // State for terminal assumptions
  const [terminalAssumptions, setTerminalAssumptions] = useState<TerminalAssumptions>(
    DEFAULT_TERMINAL_ASSUMPTIONS
  )

  // Generate year labels based on most recent fiscal year end
  const yearLabels = generateProjectionLabels(
    settings.mostRecentFiscalYearEnd,
    settings.fiscalYearEnd,
    settings.maxProjectionYears
  )

  // Load scenarios from localStorage
  useEffect(() => {
    const {
      scenarios: loadedScenarios,
      activeScenarioId: loadedId,
      activeScenarioName,
      lastModified: loadedLastModified,
    } = loadScenariosFromLocalStorage()

    if (loadedScenarios.length > 0) {
      setScenarios(loadedScenarios)
      setActiveScenarioId(loadedId)
      setScenarioName(activeScenarioName)
      setLastModified(loadedLastModified)

      // Set terminal assumptions if available
      const activeScenario = loadedScenarios.find((s) => s.id === loadedId)
      if (activeScenario && activeScenario.terminalAssumptions) {
        setTerminalAssumptions(activeScenario.terminalAssumptions)
      } else {
        setTerminalAssumptions(DEFAULT_TERMINAL_ASSUMPTIONS)
      }
    } else {
      // Initialize default scenarios if none exist
      const defaultScenarios = createDefaultScenarios(settings.maxProjectionYears)
      setScenarios(defaultScenarios)
      setActiveScenarioId(defaultScenarios[0].id)
      setScenarioName(defaultScenarios[0].name)
      setTerminalAssumptions(DEFAULT_TERMINAL_ASSUMPTIONS)

      // Save to localStorage
      localStorage.setItem('scenarios', JSON.stringify(defaultScenarios))
      localStorage.setItem('activeScenarioId', defaultScenarios[0].id)
      localStorage.setItem('activeScenarioName', defaultScenarios[0].name)
    }
  }, [settings.maxProjectionYears])

  // Update active scenario info when ID changes
  useEffect(() => {
    if (activeScenarioId) {
      saveActiveScenarioId(activeScenarioId, scenarioName)

      // Update local state with active scenario details
      const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId)
      if (activeScenario) {
        setScenarioName(activeScenario.name)
        setLastModified(activeScenario.lastModified || '')

        // Update terminal assumptions
        if (activeScenario.terminalAssumptions) {
          setTerminalAssumptions(activeScenario.terminalAssumptions)
        } else {
          setTerminalAssumptions(DEFAULT_TERMINAL_ASSUMPTIONS)
        }
      }
    }
  }, [activeScenarioId, scenarios, scenarioName])

  // Calculate projections based on assumptions
  useEffect(() => {
    if (scenarios.length && financialData) {
      // Get last year's revenue from company data
      const lastRevenue = 100 // Default value since we aren't using company data import

      const updatedScenarios = scenarios.map((scenario) => {
        const projections = calculateScenarioProjections(
          scenario,
          lastRevenue,
          settings.maxProjectionYears
        )

        return {
          ...scenario,
          projections,
        }
      })

      setScenarios(updatedScenarios)
    }
  }, [scenarios.length, financialData, settings.maxProjectionYears])

  // Find active scenario
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId)

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev)
    if (isEditMode) {
      handleSaveAll()
      toast.success('Changes saved and edit mode disabled')
    } else {
      toast.info('Edit mode enabled - you can now modify scenario details')
    }
  }

  // Add new scenario
  const handleAddScenario = () => {
    const newId = `scenario_${Date.now()}`
    const newName = `New Scenario ${scenarios.length + 1}`
    const newScenario = createNewScenario(newId, newName, settings.maxProjectionYears)

    const updatedScenarios = [...scenarios, newScenario]
    setScenarios(updatedScenarios)
    setActiveScenarioId(newId)
    setScenarioName(newName)
    localStorage.setItem('scenarios', JSON.stringify(updatedScenarios))
    toast.success('New scenario created')
  }

  // Delete active scenario
  const handleDeleteScenario = () => {
    if (scenarios.length <= 1) {
      toast.error('Cannot delete the only scenario')
      return
    }

    const updatedScenarios = scenarios.filter((scenario) => scenario.id !== activeScenarioId)
    setScenarios(updatedScenarios)
    setActiveScenarioId(updatedScenarios[0].id)
    setScenarioName(updatedScenarios[0].name)
    setLastModified(updatedScenarios[0].lastModified || '')
    localStorage.setItem('scenarios', JSON.stringify(updatedScenarios))
    toast.success('Scenario deleted')
  }

  // Handle assumption changes - updated to use utility function
  const handleAssumptionChange = (
    category: 'incomeCf' | 'balanceSheet',
    label: string,
    values: number[]
  ) => {
    if (!activeScenario || !isEditMode) return

    const updatedScenarios = updateScenarioAssumption(
      scenarios,
      activeScenarioId,
      category,
      label,
      values
    )
    setScenarios(updatedScenarios)
    setLastModified(new Date().toISOString())
  }

  // Handle terminal assumption changes
  const handleTerminalAssumptionChange = (field: keyof TerminalAssumptions, value: number) => {
    if (!isEditMode) return

    const updatedTerminalAssumptions = {
      ...terminalAssumptions,
      [field]: value,
    }

    setTerminalAssumptions(updatedTerminalAssumptions)

    // Update scenarios with new terminal assumptions
    const updatedScenarios = updateTerminalAssumptions(
      scenarios,
      activeScenarioId,
      updatedTerminalAssumptions
    )

    setScenarios(updatedScenarios)

    // Optionally dispatch an event to notify other components
    window.dispatchEvent(
      new CustomEvent('terminalAssumptionsChanged', {
        detail: {
          scenarioId: activeScenarioId,
          terminalAssumptions: updatedTerminalAssumptions,
        },
      })
    )

    // If this is the terminal growth rate, also dispatch a specific event for it
    if (field === 'terminalGrowthRate') {
      window.dispatchEvent(
        new CustomEvent('terminalGrowthRateChanged', {
          detail: {
            value: value,
          },
        })
      )
    }
  }

  // Handle scenario name change
  const handleNameChange = () => {
    if (!scenarioName.trim() || !isEditMode) {
      setScenarioName(activeScenario?.name || '')
      setEditingName(false)
      return
    }

    const updatedScenarios = scenarios.map((scenario) => {
      if (scenario.id === activeScenarioId) {
        return {
          ...scenario,
          name: scenarioName,
        }
      }
      return scenario
    })

    setScenarios(updatedScenarios)
    setEditingName(false)
    localStorage.setItem('scenarios', JSON.stringify(updatedScenarios))
    localStorage.setItem('activeScenarioName', scenarioName)
    toast.success('Scenario name updated')
  }

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode) return

    const updatedScenarios = scenarios.map((scenario) => {
      if (scenario.id === activeScenarioId) {
        return {
          ...scenario,
          description: e.target.value,
        }
      }
      return scenario
    })

    setScenarios(updatedScenarios)
    localStorage.setItem('scenarios', JSON.stringify(updatedScenarios))
  }

  // Save all scenarios
  const handleSaveAll = () => {
    localStorage.setItem('scenarios', JSON.stringify(scenarios))
    toast.success('All scenarios saved')

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('scenarioDataUpdated'))
  }

  // Render tooltip functions
  const renderTerminalGrowthRateTooltip = () => (
    <TooltipProvider>
      <Tooltip
        content={
          <p>
            The assumed constant rate FCF will grow indefinitely after the explicit forecast. Should
            generally be &lt;= long-term nominal GDP growth.
          </p>
        }
      >
        <TooltipTrigger asChild>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-xs font-medium">
            ?
          </span>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )

  const renderTerminalNopatMarginTooltip = () => (
    <TooltipProvider>
      <Tooltip
        content={
          <p>
            The expected stable Net Operating Profit After Tax as a percentage of Revenue in the
            terminal year.
          </p>
        }
      >
        <TooltipTrigger asChild>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-xs font-medium">
            ?
          </span>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )

  const renderTerminalReinvestmentRateTooltip = () => (
    <TooltipProvider>
      <Tooltip
        content={
          <p>
            The percentage of NOPAT expected to be reinvested (CapEx - Depr + Change in NWC) / NOPAT
            to sustain the terminal growth rate 'g'. Alternatively calculated as g / ROIC.
          </p>
        }
      >
        <TooltipTrigger asChild>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-xs font-medium">
            ?
          </span>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="w-full">
      <PageHeader
        title="Scenario Manager"
        icon={<FileBarChart className="h-6 w-6" />}
        description="Manage different scenarios for your valuation analysis"
      >
        <div className="flex gap-2">
          <Button
            variant={isEditMode ? 'outline' : 'secondary'}
            onClick={toggleEditMode}
            className="flex items-center gap-2"
          >
            {isEditMode ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            {isEditMode ? 'Lock & Save' : 'Unlock to Edit'}
          </Button>

          <Button onClick={handleSaveAll} className="gap-2">
            <Save className="h-4 w-4" />
            Save All
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 px-4 md:grid-cols-4">
        {/* Scenario List */}
        <Card className="h-min md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="space-y-2">
              {scenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant={activeScenarioId === scenario.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveScenarioId(scenario.id)}
                >
                  {scenario.name}
                </Button>
              ))}
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddScenario}
                disabled={!isEditMode}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Scenario
              </Button>
              {scenarios.length > 1 && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDeleteScenario}
                  disabled={!isEditMode}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Scenario
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenario Details */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              {editingName && isEditMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="max-w-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameChange()
                      if (e.key === 'Escape') {
                        setScenarioName(activeScenario?.name || '')
                        setEditingName(false)
                      }
                    }}
                    onBlur={handleNameChange}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-medium">
                    {activeScenario?.name || 'No scenario selected'}
                  </CardTitle>
                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setScenarioName(activeScenario?.name || '')
                        setEditingName(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit name</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeScenario && (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <Label>Description</Label>
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const descriptionInput = document.getElementById('scenario-description')
                          if (descriptionInput) {
                            descriptionInput.focus()
                          }
                        }}
                      >
                        <Edit className="h-3 w-3" />
                        <span className="sr-only">Edit description</span>
                      </Button>
                    )}
                  </div>
                  <Input
                    id="scenario-description"
                    value={activeScenario.description}
                    onChange={handleDescriptionChange}
                    className="mt-1"
                    disabled={!isEditMode}
                  />
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="incomeCf">Income & Cash Flow</TabsTrigger>
                    <TabsTrigger value="balanceSheet">Balance Sheet</TabsTrigger>
                  </TabsList>

                  <TabsContent value="incomeCf" className="m-0">
                    <AssumptionTable
                      title="Income Statement & Cash Flow Assumptions"
                      yearLabels={yearLabels}
                      assumptions={Object.keys(activeScenario.assumptions.incomeCf)}
                      values={activeScenario.assumptions.incomeCf}
                      onChange={(label, values) =>
                        handleAssumptionChange('incomeCf', label, values)
                      }
                      showTooltips={true}
                      disabled={!isEditMode}
                    />
                  </TabsContent>

                  <TabsContent value="balanceSheet" className="m-0">
                    <AssumptionTable
                      title="Balance Sheet Assumptions"
                      yearLabels={yearLabels}
                      assumptions={Object.keys(activeScenario.assumptions.balanceSheet)}
                      values={activeScenario.assumptions.balanceSheet}
                      onChange={(label, values) =>
                        handleAssumptionChange('balanceSheet', label, values)
                      }
                      showTooltips={true}
                      disabled={!isEditMode}
                    />
                  </TabsContent>
                </Tabs>

                {/* New Terminal Year Assumptions Section */}
                <div className="mt-8">
                  <Separator className="my-6" />
                  <h3 className="mb-4 text-lg font-medium">
                    Terminal Year Assumptions (for Perpetuity Growth Method)
                  </h3>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="terminal-growth-rate">Terminal Growth Rate (g) (%)</Label>
                        {renderTerminalGrowthRateTooltip()}
                      </div>
                      <Input
                        id="terminal-growth-rate"
                        type="number"
                        step="0.1"
                        disabled={!isEditMode}
                        value={terminalAssumptions.terminalGrowthRate}
                        onChange={(e) =>
                          handleTerminalAssumptionChange(
                            'terminalGrowthRate',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="terminal-nopat-margin">Terminal NOPAT Margin (%)</Label>
                        {renderTerminalNopatMarginTooltip()}
                      </div>
                      <Input
                        id="terminal-nopat-margin"
                        type="number"
                        step="0.1"
                        disabled={!isEditMode}
                        value={terminalAssumptions.terminalNopatMargin}
                        onChange={(e) =>
                          handleTerminalAssumptionChange(
                            'terminalNopatMargin',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="terminal-reinvestment-rate">
                          Terminal Reinvestment Rate (%)
                        </Label>
                        {renderTerminalReinvestmentRateTooltip()}
                      </div>
                      <Input
                        id="terminal-reinvestment-rate"
                        type="number"
                        step="0.1"
                        disabled={!isEditMode}
                        value={terminalAssumptions.terminalReinvestmentRate}
                        onChange={(e) =>
                          handleTerminalAssumptionChange(
                            'terminalReinvestmentRate',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      These terminal year assumptions are used specifically for Perpetuity Growth
                      Method (PGM) terminal value calculations in the DCF analysis.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
