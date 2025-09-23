import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Info, Calculator, Save, Settings as SettingsIcon } from 'lucide-react'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { useValuationData } from '@/contexts/ValuationDataContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link, useParams } from 'react-router-dom'

export default function CoreProjectAssumptions() {
  const { projectId } = useParams<{ projectId: string }>()
  const { settings, updateSettings } = useProjectSettings()
  const { setCashBalance, setDebtBalance, setWacc } = useValuationData()
  const [formValues, setFormValues] = useState({
    historicalYears: settings.historicalYears || 3,
    maxProjectionYears: settings.maxProjectionYears || 10,
    valuationDate: settings.valuationDate || '',
    mostRecentFiscalYearEnd: settings.mostRecentFiscalYearEnd || '',
    currency: settings.currency || 'USD',
    discountingConvention: settings.discountingConvention || 'Mid-Year',
    taxRate: settings.taxRate || 25,
    cashBalance: settings.cashBalance || 0,
    debtBalance: settings.debtBalance || 0,
    discountRate: settings.discountRate || 10,
    terminalGrowthRate: settings.terminalGrowthRate || 2,
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Update local state when settings change from outside this component
  useEffect(() => {
    setFormValues({
      historicalYears: settings.historicalYears || 3,
      maxProjectionYears: settings.maxProjectionYears || 10,
      valuationDate: settings.valuationDate || '',
      mostRecentFiscalYearEnd: settings.mostRecentFiscalYearEnd || '',
      currency: settings.currency || 'USD',
      discountingConvention: settings.discountingConvention || 'Mid-Year',
      taxRate: settings.taxRate || 25,
      cashBalance: settings.cashBalance || 0,
      debtBalance: settings.debtBalance || 0,
      discountRate: settings.discountRate || 10,
      terminalGrowthRate: settings.terminalGrowthRate || 2,
    })
    setHasChanges(false)
  }, [settings])

  // Listen for project updates from the edit modal
  useEffect(() => {
    const handleProjectUpdated = (event: CustomEvent) => {
      const { projectId: updatedProjectId, data } = event.detail

      // Only update if this event is for our current project
      if (projectId && updatedProjectId === projectId) {
        console.log('Project updated from edit modal:', data)

        // Update local form values with the changed settings
        setFormValues((prev) => ({
          ...prev,
          maxProjectionYears: data.maxProjectionYears || prev.maxProjectionYears,
          currency: data.currency || prev.currency,
          discountingConvention: data.discountingConvention || prev.discountingConvention,
          taxRate: data.taxRate || prev.taxRate,
          valuationDate: data.valuationDate
            ? format(data.valuationDate, 'yyyy-MM-dd')
            : prev.valuationDate,
        }))

        toast.success('Project settings updated')
      }
    }

    window.addEventListener('projectUpdated', handleProjectUpdated as EventListener)

    return () => {
      window.removeEventListener('projectUpdated', handleProjectUpdated as EventListener)
    }
  }, [projectId])

  // Save changes before unmounting
  useEffect(() => {
    return () => {
      if (hasChanges) {
        saveChanges()
      }
    }
  }, [hasChanges])

  const projectData = {
    valuationDate: formValues.valuationDate || '2025-04-01',
    fiscalYearEnd: settings.fiscalYearEnd,
    currency: formValues.currency || 'USD',
    discountingConvention: formValues.discountingConvention || 'Mid-Year',
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    let parsedValue: string | number = value

    // Handle numeric inputs
    if (name === 'historicalYears' || name === 'maxProjectionYears') {
      const numValue = parseInt(value)
      if (!isNaN(numValue)) {
        if (name === 'historicalYears' && (numValue < 1 || numValue > 10)) return
        if (name === 'maxProjectionYears' && (numValue < 1 || numValue > 30)) return
        parsedValue = numValue
      } else {
        return
      }
    } else if (name === 'taxRate' || name === 'discountRate' || name === 'terminalGrowthRate') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        parsedValue = numValue
      } else {
        return
      }
    } else if (name === 'cashBalance' || name === 'debtBalance') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        parsedValue = numValue
      } else {
        return
      }
    }

    setFormValues((prev) => ({
      ...prev,
      [name]: parsedValue,
    }))
    setHasChanges(true)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }))
    setHasChanges(true)
  }

  const saveChanges = () => {
    // Update all settings at once
    updateSettings({
      historicalYears: formValues.historicalYears,
      maxProjectionYears: formValues.maxProjectionYears,
      valuationDate: formValues.valuationDate,
      mostRecentFiscalYearEnd: formValues.mostRecentFiscalYearEnd,
      currency: formValues.currency,
      discountingConvention: formValues.discountingConvention as 'Mid-Year' | 'End-Year',
      taxRate: formValues.taxRate,
      cashBalance: formValues.cashBalance,
      debtBalance: formValues.debtBalance,
      discountRate: formValues.discountRate,
      terminalGrowthRate: formValues.terminalGrowthRate,
    })

    // Update ValuationDataContext to ensure consistency
    setCashBalance(formValues.cashBalance)
    setDebtBalance(formValues.debtBalance)
    setWacc(formValues.discountRate)

    // Dispatch tax rate change event after settings are updated
    if (formValues.taxRate !== settings.taxRate) {
      window.dispatchEvent(
        new CustomEvent('taxRateChanged', {
          detail: { value: formValues.taxRate },
        })
      )
      toast.success(`Tax rate updated to ${formValues.taxRate}%`)
    }

    toast.success('Core project assumptions saved successfully')
    setHasChanges(false)
  }

  return (
    <div className="animate-fadeIn w-full p-4">
      <PageHeader
        title="Core Project Assumptions"
        icon={<Calculator className="h-6 w-6" />}
        description="Define the fundamental parameters for your valuation analysis"
      />

      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <SettingsIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Note:</strong> These settings affect this project only. To configure default
          settings for new projects, visit the{' '}
          <Link to="/settings" className="text-blue-700 underline hover:text-blue-800">
            app settings page
          </Link>
          .
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Period Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Analysis Periods</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="historicalYears" required>
                        Number of Historical Years
                      </Label>
                      <InfoTooltip text="The number of historical fiscal years to include in the analysis. This drives the historical data presentation throughout the application." />
                    </div>
                    <Input
                      id="historicalYears"
                      name="historicalYears"
                      type="number"
                      min={1}
                      max={10}
                      value={formValues.historicalYears}
                      onChange={handleInputChange}
                      required
                    />
                    <p className="text-sm text-muted-foreground">Min: 1, Max: 10 years</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="maxProjectionYears" required>
                        Maximum Projection Years
                      </Label>
                      <InfoTooltip text="Sets the maximum number of years for which forecast assumptions need to be entered in the Scenario Manager. The DCF calculation period can be adjusted up to this maximum." />
                    </div>
                    <Input
                      id="maxProjectionYears"
                      name="maxProjectionYears"
                      type="number"
                      min={1}
                      max={30}
                      value={formValues.maxProjectionYears}
                      onChange={handleInputChange}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Sets the maximum number of years for which forecast assumptions need to be
                      entered in the Scenario Manager. The DCF calculation period can be adjusted up
                      to this maximum using the slider on the DCF screen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Core Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="valuationDate" required>
                        Valuation Date
                      </Label>
                      <InfoTooltip text="The as-of date for the valuation. All analyses and calculations will be performed as of this date." />
                    </div>
                    <Input
                      type="date"
                      id="valuationDate"
                      name="valuationDate"
                      value={formValues.valuationDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="mostRecentFiscalYearEnd" required>
                        Most Recent Fiscal Year End
                      </Label>
                      <InfoTooltip text="The date of the most recently completed fiscal year. This helps establish the historical and projection periods." />
                    </div>
                    <Input
                      type="date"
                      id="mostRecentFiscalYearEnd"
                      name="mostRecentFiscalYearEnd"
                      value={formValues.mostRecentFiscalYearEnd}
                      onChange={handleInputChange}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      This date will be used to calculate historical periods for financial
                      statements
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="currency">Currency</Label>
                      <InfoTooltip text="The currency used throughout the valuation. All monetary values will be displayed in this currency." />
                    </div>
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
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="discounting">Discounting Convention</Label>
                      <InfoTooltip text="Determines whether cash flows are assumed to occur in the middle or end of each period for DCF calculations." />
                    </div>
                    <Select
                      value={formValues.discountingConvention}
                      onValueChange={(value) => handleSelectChange('discountingConvention', value)}
                    >
                      <SelectTrigger id="discounting">
                        <SelectValue placeholder="Select convention" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                        <SelectItem value="End-Year">End-Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="taxRate" required>
                        Tax Rate (%)
                      </Label>
                      <InfoTooltip text="The effective tax rate used for after-tax calculations throughout the model." />
                    </div>
                    <Input
                      type="number"
                      id="taxRate"
                      name="taxRate"
                      min={0}
                      max={100}
                      step={0.1}
                      value={formValues.taxRate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DCF Settings Section */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-lg font-semibold">DCF Parameters</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="discountRate" required>
                      Discount Rate (%)
                    </Label>
                    <InfoTooltip text="The weighted average cost of capital (WACC) used to discount future cash flows." />
                  </div>
                  <Input
                    type="number"
                    id="discountRate"
                    name="discountRate"
                    min={0}
                    max={100}
                    step={0.1}
                    value={formValues.discountRate}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    You can also calculate this in detail using the WACC Calculator
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="terminalGrowthRate" required>
                      Terminal Growth Rate (%)
                    </Label>
                    <InfoTooltip text="The long-term growth rate used in the terminal value calculation." />
                  </div>
                  <Input
                    type="number"
                    id="terminalGrowthRate"
                    name="terminalGrowthRate"
                    min={0}
                    max={20}
                    step={0.1}
                    value={formValues.terminalGrowthRate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Cash and Debt Section */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-lg font-semibold">Enterprise to Equity Value Bridge</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="cashBalance">Cash Balance (as of valuation date)</Label>
                    <InfoTooltip text="The company's cash and cash equivalents as of the valuation date. Used in enterprise to equity value calculations." />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      id="cashBalance"
                      name="cashBalance"
                      value={formValues.cashBalance}
                      onChange={handleInputChange}
                      className="pl-7"
                      placeholder="Enter cash balance"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="debtBalance">Debt Balance (as of valuation date)</Label>
                    <InfoTooltip text="The company's total debt as of the valuation date. Used in enterprise to equity value calculations." />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      id="debtBalance"
                      name="debtBalance"
                      value={formValues.debtBalance}
                      onChange={handleInputChange}
                      className="pl-7"
                      placeholder="Enter debt balance"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button
                onClick={saveChanges}
                disabled={!hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>

            {/* Period Labeling Information */}
            <div className="mt-6 space-y-2 rounded-lg bg-muted/50 p-4">
              <div className="flex items-start space-x-2">
                <Info className="text-teal mt-0.5 h-5 w-5" />
                <div>
                  <h4 className="font-medium">Period Labeling Convention</h4>
                  <p className="text-sm text-muted-foreground">
                    Financial columns will be labeled based on the Company's Fiscal Year End (
                    {projectData.fiscalYearEnd}) relative to the Valuation Date (
                    {projectData.valuationDate}). Example: 'FYE Jun 2024', 'FYE Jun 2025', etc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
