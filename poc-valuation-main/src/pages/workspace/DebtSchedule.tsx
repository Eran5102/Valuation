import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { generateProjectionLabels } from '@/utils/fiscalYearUtils'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/formatters'
import { useCompanyFinancialData } from '@/hooks/useCompanyFinancialData'
import { useDebtScheduleData } from '@/hooks/useDebtScheduleData'
import { Info, Calendar, Banknote } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PageHeader } from '@/components/layout/PageHeader'

// Interface for debt facility
interface DebtFacility {
  id: string
  name: string
  initialBalance: number
  interestRate: number
  newDrawdowns: number[]
  principalRepayments: number[]
}

// Interface for debt schedule data
interface DebtScheduleData {
  facilities: DebtFacility[]
  schedule: {
    openingDebtBalance: number[]
    newDebtIssuance: number[]
    principalRepayment: number[]
    closingDebtBalance: number[]
    interestExpense: number[]
  }
  importedFromCompanyData?: boolean
  lastModified?: string
}

export default function DebtSchedule() {
  const { settings } = useProjectSettings()
  const { financialData, getLastItemValue } = useCompanyFinancialData()
  const { debtSchedule: savedDebtSchedule, hasDebtSchedule } = useDebtScheduleData(
    settings.maxProjectionYears
  )

  // Generate year labels based on most recent fiscal year end
  const yearLabels = generateProjectionLabels(
    settings.mostRecentFiscalYearEnd,
    settings.fiscalYearEnd,
    settings.maxProjectionYears
  )

  const [facilities, setFacilities] = useState<DebtFacility[]>([])
  const [activeTab, setActiveTab] = useState('debt-facilities')
  const [currentFacility, setCurrentFacility] = useState<DebtFacility | null>(null)
  const [scheduleData, setScheduleData] = useState<DebtScheduleData['schedule']>({
    openingDebtBalance: [],
    newDebtIssuance: [],
    principalRepayment: [],
    closingDebtBalance: [],
    interestExpense: [],
  })
  const [importedFromCompanyData, setImportedFromCompanyData] = useState<boolean>(false)
  const [lastModified, setLastModified] = useState<string>('')

  // Load saved debt schedule from localStorage on component mount
  useEffect(() => {
    if (hasDebtSchedule && savedDebtSchedule) {
      try {
        setFacilities(savedDebtSchedule.facilities || [])
        setScheduleData(savedDebtSchedule.schedule)
        setImportedFromCompanyData(savedDebtSchedule.importedFromCompanyData || false)
        setLastModified(savedDebtSchedule.lastModified || '')

        if (savedDebtSchedule.facilities && savedDebtSchedule.facilities.length > 0) {
          setCurrentFacility(savedDebtSchedule.facilities[0])
        }

        toast.info('Loaded saved debt schedule')
      } catch (error) {
        console.error('Error loading debt schedule:', error)
        initializeDefaultFacility()
      }
    } else {
      initializeDefaultFacility()
    }
  }, [hasDebtSchedule, savedDebtSchedule])

  // Initialize with a default facility
  const initializeDefaultFacility = () => {
    const defaultFacility: DebtFacility = {
      id: 'facility_1',
      name: 'Term Loan A',
      initialBalance: settings.debtBalance || 500,
      interestRate: 5,
      newDrawdowns: Array(settings.maxProjectionYears).fill(0),
      principalRepayments: Array(settings.maxProjectionYears).fill(
        settings.debtBalance ? settings.debtBalance / 5 : 100
      ),
    }

    setFacilities([defaultFacility])
    setCurrentFacility(defaultFacility)
    calculateSchedule([defaultFacility])
  }

  // Import company data
  const importCompanyData = () => {
    if (!financialData) {
      toast.error('No company financial data available to import')
      return
    }

    // Get long-term debt from balance sheet
    const longTermDebt = getLastItemValue('Long-term Debt', 'balance') || 0
    const shortTermDebt = getLastItemValue('Short-term Debt', 'balance') || 0
    const totalDebt = longTermDebt + shortTermDebt

    if (totalDebt <= 0) {
      toast.warning('No debt balance found in company financial data')
      return
    }

    // Create/update facility with imported data
    let updatedFacilities: DebtFacility[]

    if (facilities.length === 0) {
      // Create new facility if none exist
      const newFacility: DebtFacility = {
        id: 'facility_1',
        name: 'Company Debt',
        initialBalance: totalDebt,
        interestRate: 5, // Default interest rate
        newDrawdowns: Array(settings.maxProjectionYears).fill(0),
        principalRepayments: Array(settings.maxProjectionYears).fill(totalDebt / 5), // Default to 5-year repayment
      }
      updatedFacilities = [newFacility]
      setCurrentFacility(newFacility)
    } else {
      // Update existing facilities
      updatedFacilities = facilities.map((facility, index) => {
        if (index === 0) {
          return {
            ...facility,
            initialBalance: totalDebt,
            name: 'Company Debt',
            principalRepayments: Array(settings.maxProjectionYears).fill(totalDebt / 5),
          }
        }
        return facility
      })
      setCurrentFacility(updatedFacilities[0])
    }

    setFacilities(updatedFacilities)
    setImportedFromCompanyData(true)
    setLastModified(new Date().toISOString())

    calculateSchedule(updatedFacilities, true)
    toast.success('Successfully imported debt data from company financials')
  }

  // Add a new debt facility
  const addFacility = () => {
    const newId = `facility_${Date.now()}`
    const newFacility: DebtFacility = {
      id: newId,
      name: `New Facility ${facilities.length + 1}`,
      initialBalance: 0,
      interestRate: 5,
      newDrawdowns: Array(settings.maxProjectionYears).fill(0),
      principalRepayments: Array(settings.maxProjectionYears).fill(0),
    }

    const updatedFacilities = [...facilities, newFacility]
    setFacilities(updatedFacilities)
    setCurrentFacility(newFacility)
    calculateSchedule(updatedFacilities)
  }

  // Delete a facility
  const deleteFacility = (id: string) => {
    const updatedFacilities = facilities.filter((f) => f.id !== id)
    setFacilities(updatedFacilities)

    if (currentFacility && currentFacility.id === id) {
      setCurrentFacility(updatedFacilities.length > 0 ? updatedFacilities[0] : null)
    }

    calculateSchedule(updatedFacilities)
  }

  // Update facility details
  const updateFacility = (field: keyof DebtFacility, value: any) => {
    if (!currentFacility) return

    const updatedFacilities = facilities.map((facility) => {
      if (facility.id === currentFacility.id) {
        return {
          ...facility,
          [field]: value,
        }
      }
      return facility
    })

    setFacilities(updatedFacilities)
    setCurrentFacility({
      ...currentFacility,
      [field]: value,
    })

    calculateSchedule(updatedFacilities)
  }

  // Update drawdowns or repayments
  const updateCashFlow = (
    type: 'newDrawdowns' | 'principalRepayments',
    index: number,
    value: string
  ) => {
    if (!currentFacility) return

    const numValue = parseFloat(value) || 0
    const updatedFlows = [...currentFacility[type]]
    updatedFlows[index] = numValue

    const updatedFacility = {
      ...currentFacility,
      [type]: updatedFlows,
    }

    const updatedFacilities = facilities.map((facility) => {
      if (facility.id === currentFacility.id) {
        return updatedFacility
      }
      return facility
    })

    setFacilities(updatedFacilities)
    setCurrentFacility(updatedFacility)

    calculateSchedule(updatedFacilities)
  }

  // Calculate the debt schedule based on all facilities
  const calculateSchedule = (facilitiesToUse: DebtFacility[] = facilities, fromImport = false) => {
    const openingDebtBalance: number[] = []
    const newDebtIssuance: number[] = []
    const principalRepayment: number[] = []
    const closingDebtBalance: number[] = []
    const interestExpense: number[] = []

    for (let year = 0; year < settings.maxProjectionYears; year++) {
      let openingBalance = 0
      let issuance = 0
      let repayment = 0
      let interest = 0

      // First year opening balance is the sum of all initial balances
      if (year === 0) {
        openingBalance = facilitiesToUse.reduce((sum, facility) => sum + facility.initialBalance, 0)
      } else {
        // Otherwise it's the previous year's closing balance
        openingBalance = closingDebtBalance[year - 1]
      }

      // Sum new drawdowns for all facilities
      issuance = facilitiesToUse.reduce((sum, facility) => {
        return sum + (facility.newDrawdowns[year] || 0)
      }, 0)

      // Sum principal repayments for all facilities
      repayment = facilitiesToUse.reduce((sum, facility) => {
        return sum + (facility.principalRepayments[year] || 0)
      }, 0)

      // Calculate interest expense based on opening balance
      interest = facilitiesToUse.reduce((sum, facility) => {
        // For year 0, use initial balance
        const balanceForInterest =
          year === 0
            ? facility.initialBalance
            : facility.initialBalance +
              facility.newDrawdowns.slice(0, year).reduce((s, d) => s + d, 0) -
              facility.principalRepayments.slice(0, year).reduce((s, r) => s + r, 0)

        return sum + balanceForInterest * (facility.interestRate / 100)
      }, 0)

      // Calculate closing balance
      const closingBalance = openingBalance + issuance - repayment

      // Push to arrays
      openingDebtBalance.push(openingBalance)
      newDebtIssuance.push(issuance)
      principalRepayment.push(repayment)
      closingDebtBalance.push(closingBalance)
      interestExpense.push(interest)
    }

    const newScheduleData = {
      openingDebtBalance,
      newDebtIssuance,
      principalRepayment,
      closingDebtBalance,
      interestExpense,
    }

    setScheduleData(newScheduleData)

    if (!fromImport) {
      setImportedFromCompanyData(false)
    }

    const currentTime = new Date().toISOString()
    setLastModified(currentTime)

    // Save to localStorage
    const dataToSave: DebtScheduleData = {
      facilities: facilitiesToUse,
      schedule: newScheduleData,
      importedFromCompanyData: fromImport ? true : importedFromCompanyData,
      lastModified: currentTime,
    }

    localStorage.setItem('debtScheduleData', JSON.stringify(dataToSave))
  }

  // Save the schedule
  const handleSaveSchedule = () => {
    calculateSchedule()
    toast.success('Debt schedule saved')
  }

  return (
    <div className="h-full w-full">
      <PageHeader
        title="Debt Schedule"
        icon={<Banknote className="h-6 w-6" />}
        description="Manage debt facilities, track interest expense, and project debt balances over the forecast period"
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Tooltip content="Import debt balances from company financial data">
              <Button
                variant="outline"
                onClick={importCompanyData}
                disabled={!financialData}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Import Company Data
              </Button>
            </Tooltip>

            <Button onClick={handleSaveSchedule} className="gap-2">
              Save Schedule
            </Button>
          </div>
        </div>

        {importedFromCompanyData && lastModified && (
          <div className="flex items-center rounded-md bg-blue-50 p-3 text-sm text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Info className="mr-2 h-4 w-4" />
            <span>
              Using debt data imported from company financials on{' '}
              {new Date(lastModified).toLocaleString()}
            </span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="debt-facilities">Debt Facilities</TabsTrigger>
            <TabsTrigger value="schedule">Debt Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="debt-facilities" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Facility List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Debt Facilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    {facilities.map((facility) => (
                      <Button
                        key={facility.id}
                        variant={currentFacility?.id === facility.id ? 'default' : 'outline'}
                        className="justify-between"
                        onClick={() => setCurrentFacility(facility)}
                      >
                        <span>{facility.name}</span>
                        <span>${facility.initialBalance.toLocaleString()}</span>
                      </Button>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button onClick={addFacility} variant="outline" className="w-full">
                      Add Debt Facility
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Facility Details */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    {currentFacility ? `Edit ${currentFacility.name}` : 'Select a facility'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentFacility ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="facility-name">Facility Name</Label>
                          <Input
                            id="facility-name"
                            value={currentFacility.name}
                            onChange={(e) => updateFacility('name', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="initial-balance">Initial Balance</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                              id="initial-balance"
                              type="number"
                              value={currentFacility.initialBalance}
                              onChange={(e) =>
                                updateFacility('initialBalance', Number(e.target.value))
                              }
                              className="pl-7"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                          <Input
                            id="interest-rate"
                            type="number"
                            step="0.1"
                            value={currentFacility.interestRate}
                            onChange={(e) => updateFacility('interestRate', Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-4">
                        <Label>Cash Flows</Label>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead>Year</TableHead>
                                <TableHead>New Drawdowns</TableHead>
                                <TableHead>Principal Repayments</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {yearLabels.slice(0, settings.maxProjectionYears).map((year, i) => (
                                <TableRow key={i}>
                                  <TableCell>{year}</TableCell>
                                  <TableCell>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-muted-foreground">
                                        $
                                      </span>
                                      <Input
                                        type="number"
                                        value={currentFacility.newDrawdowns[i] || 0}
                                        onChange={(e) =>
                                          updateCashFlow('newDrawdowns', i, e.target.value)
                                        }
                                        className="pl-7"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-muted-foreground">
                                        $
                                      </span>
                                      <Input
                                        type="number"
                                        value={currentFacility.principalRepayments[i] || 0}
                                        onChange={(e) =>
                                          updateCashFlow('principalRepayments', i, e.target.value)
                                        }
                                        className="pl-7"
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button
                          variant="destructive"
                          onClick={() => deleteFacility(currentFacility.id)}
                          disabled={facilities.length <= 1}
                        >
                          Delete Facility
                        </Button>
                        <Button onClick={handleSaveSchedule}>Save Changes</Button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      Select a facility from the list or add a new one
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Consolidated Debt Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Item</TableHead>
                        {yearLabels.slice(0, settings.maxProjectionYears).map((year, i) => (
                          <TableHead key={i} className="text-right">
                            {year}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Opening Debt Balance</TableCell>
                        {scheduleData.openingDebtBalance.map((value, i) => (
                          <TableCell key={i} className="text-right">
                            {formatCurrency(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">New Debt Issuance</TableCell>
                        {scheduleData.newDebtIssuance.map((value, i) => (
                          <TableCell key={i} className="text-right">
                            {formatCurrency(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Principal Repayment</TableCell>
                        {scheduleData.principalRepayment.map((value, i) => (
                          <TableCell key={i} className="text-right">
                            {formatCurrency(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Closing Debt Balance</TableCell>
                        {scheduleData.closingDebtBalance.map((value, i) => (
                          <TableCell key={i} className="text-right">
                            {formatCurrency(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Interest Expense</TableCell>
                        {scheduleData.interestExpense.map((value, i) => (
                          <TableCell key={i} className="text-right">
                            {formatCurrency(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
