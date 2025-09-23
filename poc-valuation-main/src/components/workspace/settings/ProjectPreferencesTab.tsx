import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Save, ArrowRight } from 'lucide-react'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { useNavigate, useParams } from 'react-router-dom'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calculator } from 'lucide-react'

export default function ProjectPreferencesTab() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  // Get project settings from context
  const { settings, updateSettings } = useProjectSettings()

  // Local state for form values - focusing only on visualization and presentation preferences
  const [formValues, setFormValues] = useState({
    chartColorTheme: settings.chartColorTheme || 'default',
    defaultChartType: settings.defaultChartType || 'bar',
    showWaterfall: settings.showWaterfall !== false,
    showTornado: settings.showTornado !== false,
    showComparison: settings.showComparison !== false,
    terminalValueMethod: settings.terminalValueMethod || 'PGM',
    exitMultipleMetric: settings.exitMultipleMetric || 'EBITDA',
    depreciationSource: settings.depreciationSource || 'scenario',
  })
  const [hasChanges, setHasChanges] = useState(false)

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value,
    })

    setHasChanges(true)
  }

  // Handle switch change
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormValues({
      ...formValues,
      [name]: checked,
    })

    setHasChanges(true)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings({
      chartColorTheme: formValues.chartColorTheme,
      defaultChartType: formValues.defaultChartType,
      showWaterfall: formValues.showWaterfall,
      showTornado: formValues.showTornado,
      showComparison: formValues.showComparison,
      terminalValueMethod: formValues.terminalValueMethod as string,
      exitMultipleMetric: formValues.exitMultipleMetric,
      depreciationSource: formValues.depreciationSource as 'scenario' | 'schedule',
    })
    toast.success('Project preferences updated')
    setHasChanges(false)
  }

  const navigateToCoreAssumptions = () => {
    navigate(`/workspace/${projectId}/core-assumptions`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Project Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Configure display preferences and calculation methods for this project.
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Calculator className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Important:</strong> Core project parameters (valuation date, tax rate, currency,
          etc.) are managed in the Core Project Assumptions section.
          <Button
            variant="outline"
            onClick={navigateToCoreAssumptions}
            className="ml-4 flex items-center gap-2 bg-blue-100 hover:bg-blue-200"
          >
            Go to Core Project Assumptions <ArrowRight className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="visualization">
        <TabsList className="mb-4 grid grid-cols-2">
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="calculation">Calculation Methods</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="visualization" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showWaterfall">Show Waterfall Charts</Label>
                  <p className="text-xs text-muted-foreground">
                    Display waterfall charts in DCF analysis
                  </p>
                </div>
                <Switch
                  id="showWaterfall"
                  checked={formValues.showWaterfall}
                  onCheckedChange={(checked) => handleSwitchChange('showWaterfall', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showTornado">Show Tornado Charts</Label>
                  <p className="text-xs text-muted-foreground">
                    Display tornado sensitivity analysis
                  </p>
                </div>
                <Switch
                  id="showTornado"
                  checked={formValues.showTornado}
                  onCheckedChange={(checked) => handleSwitchChange('showTornado', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showComparison">Show Comparison Charts</Label>
                  <p className="text-xs text-muted-foreground">
                    Display scenario comparison charts
                  </p>
                </div>
                <Switch
                  id="showComparison"
                  checked={formValues.showComparison}
                  onCheckedChange={(checked) => handleSwitchChange('showComparison', checked)}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="chartColorTheme">Chart Color Theme</Label>
                <Select
                  value={formValues.chartColorTheme}
                  onValueChange={(value) => handleSelectChange('chartColorTheme', value)}
                >
                  <SelectTrigger id="chartColorTheme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                    <SelectItem value="colorful">Colorful</SelectItem>
                    <SelectItem value="pastel">Pastel</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultChartType">Default Chart Type</Label>
                <Select
                  value={formValues.defaultChartType}
                  onValueChange={(value) => handleSelectChange('defaultChartType', value)}
                >
                  <SelectTrigger id="defaultChartType">
                    <SelectValue placeholder="Select chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="combined">Combined Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calculation" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="terminalValueMethod">Terminal Value Method</Label>
                <Select
                  value={formValues.terminalValueMethod}
                  onValueChange={(value) => handleSelectChange('terminalValueMethod', value)}
                >
                  <SelectTrigger id="terminalValueMethod">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PGM">Perpetual Growth Model</SelectItem>
                    <SelectItem value="Multiple">Exit Multiple</SelectItem>
                    <SelectItem value="Both">Both Methods</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitMultipleMetric">Exit Multiple Metric</Label>
                <Select
                  value={formValues.exitMultipleMetric}
                  onValueChange={(value) => handleSelectChange('exitMultipleMetric', value)}
                >
                  <SelectTrigger id="exitMultipleMetric">
                    <SelectValue placeholder="Select multiple metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EBITDA">EBITDA</SelectItem>
                    <SelectItem value="EBIT">EBIT</SelectItem>
                    <SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="EPS">EPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depreciationSource">Depreciation Source</Label>
                <Select
                  value={formValues.depreciationSource}
                  onValueChange={(value) =>
                    handleSelectChange('depreciationSource', value as 'scenario' | 'schedule')
                  }
                >
                  <SelectTrigger id="depreciationSource">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scenario">Scenario Inputs</SelectItem>
                    <SelectItem value="schedule">Depreciation Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={!hasChanges} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
