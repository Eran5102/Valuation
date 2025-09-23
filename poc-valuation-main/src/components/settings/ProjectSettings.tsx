import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { Save, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProjectSettings() {
  const { settings, updateSettings } = useProjectSettings()
  const [formValues, setFormValues] = useState({ ...settings })
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setFormValues({ ...settings })
    setHasChanges(false)
  }, [settings])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Handle numeric inputs
    if (
      name === 'maxProjectionYears' ||
      name === 'historicalYears' ||
      name === 'taxRate' ||
      name === 'cashBalance' ||
      name === 'debtBalance'
    ) {
      setFormValues({
        ...formValues,
        [name]: isNaN(parseFloat(value)) ? 0 : parseFloat(value),
      })
    } else {
      setFormValues({
        ...formValues,
        [name]: value,
      })
    }

    setHasChanges(true)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value,
    })

    setHasChanges(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings(formValues)
    toast.success('Default project settings updated')
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Default Project Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure default settings for <strong>new</strong> valuation projects. These settings do
          not affect existing projects.
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          These defaults are only applied when creating new projects. To update settings for a
          current project, please use the <strong>Core Project Assumptions</strong> page in the
          project workspace.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="valuationDate">Default Valuation Date</Label>
            <Input
              id="valuationDate"
              name="valuationDate"
              type="date"
              value={formValues.valuationDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fiscalYearEnd">Fiscal Year End</Label>
            <Select
              value={formValues.fiscalYearEnd}
              onValueChange={(value) => handleSelectChange('fiscalYearEnd', value)}
            >
              <SelectTrigger id="fiscalYearEnd">
                <SelectValue placeholder="Select fiscal year end" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12-31">December 31</SelectItem>
                <SelectItem value="06-30">June 30</SelectItem>
                <SelectItem value="03-31">March 31</SelectItem>
                <SelectItem value="09-30">September 30</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Select
              value={formValues.currency}
              onValueChange={(value) => handleSelectChange('currency', value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountingConvention">Discounting Convention</Label>
            <Select
              value={formValues.discountingConvention}
              onValueChange={(value) => handleSelectChange('discountingConvention', value)}
            >
              <SelectTrigger id="discountingConvention">
                <SelectValue placeholder="Select convention" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                <SelectItem value="End-Year">End-Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxProjectionYears">Default Projection Years</Label>
            <Input
              id="maxProjectionYears"
              name="maxProjectionYears"
              type="number"
              min="1"
              max="20"
              value={formValues.maxProjectionYears}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="historicalYears">Historical Years to Include</Label>
            <Input
              id="historicalYears"
              name="historicalYears"
              type="number"
              min="1"
              max="10"
              value={formValues.historicalYears}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
            <Input
              id="taxRate"
              name="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formValues.taxRate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!hasChanges} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Default Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
