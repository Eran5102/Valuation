import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
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
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatPercent } from '@/utils/formatters'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { useNavigate } from 'react-router-dom'
import {
  Calculator,
  Info,
  Trash2,
  Plus,
  RefreshCw,
  BarChart2,
  ArrowRightLeft,
  PieChart,
  Banknote,
  Percent,
  LineChart,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useValuationData } from '@/contexts/ValuationDataContext'

// Define the peer company structure
interface PeerCompany {
  id: string
  name: string
  date: string
  debtToEquity: number
  leveredBeta: number
  taxRate: number
  unleveredBeta?: number
}

export default function WaccCalculator() {
  // Get project settings including tax rate
  const { settings } = useProjectSettings()
  const navigate = useNavigate()
  const { qualitativeRiskPremium, setQualitativeRiskPremium } = useValuationData()

  // Peer Beta Analysis
  const [peerCompanies, setPeerCompanies] = useState<PeerCompany[]>([])
  const [newCompany, setNewCompany] = useState<PeerCompany>({
    id: '',
    name: '',
    date: '',
    debtToEquity: 0,
    leveredBeta: 0,
    taxRate: settings.taxRate, // Use tax rate from project settings
  })

  // Target Company Structure
  const [targetDebtEquity, setTargetDebtEquity] = useState(0.4)
  const [targetTaxRate, setTargetTaxRate] = useState(settings.taxRate) // Use tax rate from project settings

  // Cost of Equity Inputs
  const [riskFreeRate, setRiskFreeRate] = useState(2.5)
  const [equityRiskPremium, setEquityRiskPremium] = useState(5.5)
  const [sizePremium, setSizePremium] = useState(0)
  const [countryRiskPremium, setCountryRiskPremium] = useState(0)
  const [qualitativePremium, setQualitativePremium] = useState(0) // Local state for the UI

  // Cost of Debt Inputs
  const [preTaxCostOfDebt, setPreTaxCostOfDebt] = useState(5.0)
  const [taxRate, setTaxRate] = useState(settings.taxRate) // Use tax rate from project settings

  // Capital Structure Inputs
  const [debtPercentage, setDebtPercentage] = useState(40)

  // Update tax rates when project settings change
  useEffect(() => {
    setTaxRate(settings.taxRate)
    setTargetTaxRate(settings.taxRate)
    setNewCompany((prev) => ({ ...prev, taxRate: settings.taxRate }))
  }, [settings.taxRate])

  // Fetch qualitative risk premium from context or local storage
  useEffect(() => {
    // Check if there's a value in the context first
    if (qualitativeRiskPremium !== null) {
      setQualitativePremium(qualitativeRiskPremium)
    } else {
      // Otherwise try to get it from localStorage as fallback
      const savedPremium = localStorage.getItem('qualitative_coe_premium')
      if (savedPremium) {
        const parsedPremium = parseFloat(savedPremium)
        if (!isNaN(parsedPremium)) {
          setQualitativePremium(parsedPremium)
          // Also update the context
          setQualitativeRiskPremium(parsedPremium)
        }
      }
    }

    // Listen for updates from the Qualitative Assessment module
    const handleQualitativeUpdate = (event: CustomEvent) => {
      const { value } = event.detail
      setQualitativePremium(value)
    }

    window.addEventListener(
      'qualitativeRiskPremiumChanged',
      handleQualitativeUpdate as EventListener
    )

    return () => {
      window.removeEventListener(
        'qualitativeRiskPremiumChanged',
        handleQualitativeUpdate as EventListener
      )
    }
  }, [qualitativeRiskPremium, setQualitativeRiskPremium])

  // Handle adding a new peer company
  const handleAddPeer = () => {
    if (!newCompany.name || !newCompany.date) {
      toast.error('Please fill in all required fields')
      return
    }

    const newId = Date.now().toString()
    const unleveredBeta = calculateUnleveredBeta(
      newCompany.leveredBeta,
      newCompany.debtToEquity,
      newCompany.taxRate
    )

    setPeerCompanies([
      ...peerCompanies,
      {
        ...newCompany,
        id: newId,
        unleveredBeta,
      },
    ])

    setNewCompany({
      id: '',
      name: '',
      date: '',
      debtToEquity: 0,
      leveredBeta: 0,
      taxRate: 21,
    })

    toast.success('Peer company added')
  }

  const handleDeletePeer = (id: string) => {
    setPeerCompanies(peerCompanies.filter((company) => company.id !== id))
    toast.success('Peer company deleted')
  }

  // Calculate unlevered beta for a single peer
  const calculateUnleveredBeta = (leveredBeta: number, debtEquity: number, taxRate: number) => {
    return leveredBeta / (1 + debtEquity * (1 - taxRate / 100))
  }

  // Calculate average unlevered beta across all peers
  const averageUnleveredBeta = useMemo(() => {
    if (peerCompanies.length === 0) return 0

    const sum = peerCompanies.reduce((acc, company) => acc + (company.unleveredBeta || 0), 0)

    return sum / peerCompanies.length
  }, [peerCompanies])

  // Calculate relevered beta for target company
  const releveredBeta = useMemo(() => {
    return averageUnleveredBeta * (1 + targetDebtEquity * (1 - targetTaxRate / 100))
  }, [averageUnleveredBeta, targetDebtEquity, targetTaxRate])

  // Calculate Cost of Equity using CAPM
  const costOfEquity = useMemo(() => {
    return (
      riskFreeRate +
      releveredBeta * equityRiskPremium +
      sizePremium +
      countryRiskPremium +
      qualitativePremium
    )
  }, [
    riskFreeRate,
    releveredBeta,
    equityRiskPremium,
    sizePremium,
    countryRiskPremium,
    qualitativePremium,
  ])

  // Calculate After-Tax Cost of Debt
  const afterTaxCostOfDebt = useMemo(() => {
    return preTaxCostOfDebt * (1 - taxRate / 100)
  }, [preTaxCostOfDebt, taxRate])

  // Calculate Equity Percentage
  const equityPercentage = useMemo(() => {
    return 100 - debtPercentage
  }, [debtPercentage])

  // Calculate final WACC
  const wacc = useMemo(() => {
    return (equityPercentage / 100) * costOfEquity + (debtPercentage / 100) * afterTaxCostOfDebt
  }, [equityPercentage, costOfEquity, debtPercentage, afterTaxCostOfDebt])

  // Calculate sensitivity matrix for WACC
  const sensitivityMatrix = useMemo(() => {
    const debtRatios = [35, 40, 45]
    const preTaxDebtCosts = [3.0, 4.0, 5.0]

    return preTaxDebtCosts.map((debtCost) => {
      return debtRatios.map((debtRatio) => {
        const equityRatio = 100 - debtRatio
        const afterTaxDebtCost = debtCost * (1 - taxRate / 100)
        return (equityRatio / 100) * costOfEquity + (debtRatio / 100) * afterTaxDebtCost
      })
    })
  }, [costOfEquity, taxRate])

  // Function to apply WACC to DCF module
  const handleApplyToDCF = () => {
    // Save WACC to localStorage or global state for DCF module to access
    localStorage.setItem('calculatedWACC', wacc.toString())

    toast.success('WACC value has been saved for use in DCF module', {
      description: `${wacc.toFixed(2)}% will be used as the default discount rate`,
    })

    // Navigate to DCF page
    navigate('/workspace/1/dcf')
  }

  // Handle manual update of qualitative premium
  const handleQualitativePremiumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setQualitativePremium(value)
      // Also update context
      setQualitativeRiskPremium(value)
      // And localStorage for persistence
      localStorage.setItem('qualitative_coe_premium', value.toString())
    }
  }

  // Navigate to Qualitative Assessment
  const navigateToQualitativeAssessment = () => {
    navigate('/workspace/1/qualitative')
  }

  return (
    <div className="w-full">
      <PageHeader
        title="WACC Calculator"
        icon={<Calculator className="h-6 w-6" />}
        description="Calculate the Weighted Average Cost of Capital (WACC) for your valuation"
      />

      <div className="space-y-8 px-4">
        <p className="text-muted-foreground">
          Weighted Average Cost of Capital (WACC) is used to determine the discount rate in
          discounted cash flow (DCF) analysis. This calculator helps you estimate WACC based on peer
          data and market conditions.
        </p>

        {/* Peer Beta Analysis Section */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <span>Peer Beta Analysis</span>
                </CardTitle>
                <CardDescription>
                  Add comparable companies to derive an average unlevered beta
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary">
                {formatPercent(averageUnleveredBeta, 2)} Avg Unlevered Beta
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input
                  placeholder="e.g. AT&T"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newCompany.date}
                  onChange={(e) => setNewCompany({ ...newCompany, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Debt/Equity</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1.2"
                  value={newCompany.debtToEquity || ''}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, debtToEquity: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Levered Beta</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.9"
                  value={newCompany.leveredBeta || ''}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, leveredBeta: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tax Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="21"
                  value={newCompany.taxRate || ''}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, taxRate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddPeer}>
                <Plus className="mr-2 h-4 w-4" /> Add Peer
              </Button>
            </div>

            {peerCompanies.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Actions</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Debt/Equity</TableHead>
                      <TableHead>Levered Beta</TableHead>
                      <TableHead>Tax Rate</TableHead>
                      <TableHead>Unlevered Beta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {peerCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePeer(company.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.date}</TableCell>
                        <TableCell>{company.debtToEquity.toFixed(2)}</TableCell>
                        <TableCell>{company.leveredBeta.toFixed(2)}</TableCell>
                        <TableCell>{company.taxRate.toFixed(1)}%</TableCell>
                        <TableCell className="font-medium">
                          {(company.unleveredBeta || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-2 text-sm text-muted-foreground">
              <span className="italic">Note: Future: Integrate API fetch for peer data</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Target Company Structure Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                <span>Target Company Structure & Relevered Beta</span>
              </CardTitle>
              <CardDescription>
                Apply the unlevered beta to your target company's capital structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Target Debt/Equity Ratio</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={targetDebtEquity || ''}
                    onChange={(e) => setTargetDebtEquity(parseFloat(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Target Tax Rate (%)
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Default from Project Settings: {settings.taxRate}%)
                    </span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={targetTaxRate || ''}
                    onChange={(e) => setTargetTaxRate(parseFloat(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                </div>

                <div className="mt-8">
                  <h3 className="mb-3 text-lg font-medium text-primary">Calculated Result:</h3>
                  <div className="rounded-lg bg-primary/5 p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-sm text-muted-foreground">Average Unlevered Beta:</div>
                      <div className="font-medium">{averageUnleveredBeta.toFixed(2)}</div>

                      <div className="text-sm text-muted-foreground">Relevered Beta:</div>
                      <div className="text-lg font-medium">{releveredBeta.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost of Equity (Ke) Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5 text-primary" />
                <span>Cost of Equity (Ke) Calculation</span>
              </CardTitle>
              <CardDescription>CAPM Build-Up approach to derive the Cost of Equity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Risk-Free Rate (%)</label>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          Typically based on long-term government bond yields.
                          <br />
                          <i>Future: Fetch current rate</i>
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    value={riskFreeRate || ''}
                    onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) || 0)}
                    className="max-w-full"
                  />

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Equity Risk Premium (%)</label>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          The additional return expected over the risk-free rate for investing in
                          equities.
                          <br />
                          <i>Future: Use Duff&Phelps/Kroll data</i>
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    value={equityRiskPremium || ''}
                    onChange={(e) => setEquityRiskPremium(parseFloat(e.target.value) || 0)}
                    className="max-w-full"
                  />

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Relevered Beta</label>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          Calculated from peer data and adjusted for target capital structure
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Input
                    type="number"
                    value={releveredBeta.toFixed(2)}
                    readOnly
                    className="max-w-full bg-muted"
                  />

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Size Premium (%)</label>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          Premium based on company size, e.g., from Duff&Phelps/Kroll data. Smaller
                          companies generally have higher risk premiums.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    value={sizePremium || ''}
                    onChange={(e) => setSizePremium(parseFloat(e.target.value) || 0)}
                    className="max-w-full"
                  />

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Country Risk Premium (%)</label>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          Premium based on company's operating geography risk, if applicable.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Input
                    type="number"
                    step="0.1"
                    value={countryRiskPremium || ''}
                    onChange={(e) => setCountryRiskPremium(parseFloat(e.target.value) || 0)}
                    className="max-w-full"
                  />

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Qualitative Risk Premium (%)</label>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          Pulled from Qualitative Assessment module based on risk factor analysis.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={qualitativePremium}
                      onChange={handleQualitativePremiumChange}
                      className="max-w-[calc(100%-80px)]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap text-xs"
                      onClick={navigateToQualitativeAssessment}
                    >
                      View Analysis
                    </Button>
                  </div>
                </div>

                <div className="mt-6 rounded-lg bg-primary/5 p-4">
                  <h3 className="mb-2 text-sm font-medium">CAPM Formula:</h3>
                  <p className="mb-2 font-mono text-sm">Ke = Rf + (Beta * ERP) + SP + CRP + QRP</p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">
                      Calculated Cost of Equity (Ke):
                    </div>
                    <div className="text-lg font-bold text-primary">{costOfEquity.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Cost of Debt (Kd) Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Banknote className="h-5 w-5 text-primary" />
                <span>Cost of Debt (Kd) Calculation</span>
              </CardTitle>
              <CardDescription>Calculate the after-tax cost of debt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center space-x-2 text-sm font-medium">
                    <span>Pre-Tax Cost of Debt (%)</span>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          Company's estimated current borrowing rate before taxes.
                          <br />
                          <i>Future: Estimate based on credit rating/coverage</i>
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={preTaxCostOfDebt || ''}
                    onChange={(e) => setPreTaxCostOfDebt(parseFloat(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Tax Rate (%)
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Default from Project Settings: {settings.taxRate}%)
                    </span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={taxRate || ''}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                </div>

                <div className="mt-6 rounded-lg bg-primary/5 p-4">
                  <h3 className="mb-2 text-sm font-medium">After-Tax Cost of Debt Formula:</h3>
                  <p className="mb-3 font-mono text-sm">
                    After-Tax Kd = Pre-Tax Kd * (1 - Tax Rate)
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-1">
                    <div className="text-sm text-muted-foreground">Pre-Tax Cost of Debt:</div>
                    <div className="font-medium">{preTaxCostOfDebt.toFixed(2)}%</div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      After-Tax Cost of Debt:
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {afterTaxCostOfDebt.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capital Structure Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-primary" />
                <span>Capital Structure Weights</span>
              </CardTitle>
              <CardDescription>Define the target debt and equity proportions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">% Debt of Total Capital</label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={debtPercentage || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setDebtPercentage(value >= 0 && value <= 100 ? value : debtPercentage)
                  }}
                  className="max-w-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">% Equity of Total Capital</label>
                <Input
                  type="number"
                  value={equityPercentage}
                  readOnly
                  className="max-w-xs bg-muted"
                />
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                <i>Future: Option to calculate based on Market Cap & Debt values</i>
              </div>

              <div className="mt-6 rounded-lg bg-primary/5 p-4">
                <h3 className="mb-2 text-sm font-medium">Capital Structure:</h3>

                <div className="mt-3 h-4 w-full rounded-full bg-muted">
                  <div
                    className="h-4 rounded-full bg-primary"
                    style={{ width: `${debtPercentage}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span>Debt: {debtPercentage}%</span>
                  <span>Equity: {equityPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final WACC Section - Updated with integration to DCF */}
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center space-x-2 text-xl font-bold">
              <Percent className="h-6 w-6 text-primary" />
              <span>Weighted Average Cost of Capital (WACC)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium">WACC Formula:</h3>
                <div className="rounded-md bg-muted/50 p-3 font-mono text-sm">
                  WACC = (% Equity * Ke) + (% Debt * After-Tax Kd)
                </div>

                <div className="mt-6 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-muted-foreground">Cost of Equity (Ke):</div>
                    <div className="font-medium">{costOfEquity.toFixed(2)}%</div>

                    <div className="text-sm text-muted-foreground">Equity Weight:</div>
                    <div className="font-medium">{equityPercentage}%</div>

                    <div className="text-sm text-muted-foreground">After-Tax Cost of Debt:</div>
                    <div className="font-medium">{afterTaxCostOfDebt.toFixed(2)}%</div>

                    <div className="text-sm text-muted-foreground">Debt Weight:</div>
                    <div className="font-medium">{debtPercentage}%</div>

                    <div className="text-sm text-muted-foreground">Valuation Date:</div>
                    <div className="font-medium">{settings.valuationDate}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-lg bg-primary/5 p-6">
                <h3 className="mb-2 text-lg font-medium text-primary">Final Calculated WACC</h3>
                <div className="text-4xl font-bold text-primary">{wacc.toFixed(2)}%</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  This rate will be available for use in DCF and other valuation modules
                </p>
                <Button className="mt-4" onClick={handleApplyToDCF}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Apply to DCF Module
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sensitivity Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <span>WACC Sensitivity Analysis</span>
            </CardTitle>
            <CardDescription>
              Impact of varying capital structure and debt cost on WACC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center text-sm">
                WACC (%) by Pre-Tax Cost of Debt (rows) and % Debt (columns)
              </div>

              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Pre-Tax CoD (%)</TableHead>
                      <TableHead className="text-center">Debt = 35%</TableHead>
                      <TableHead className="text-center">Debt = 40%</TableHead>
                      <TableHead className="text-center">Debt = 45%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sensitivityMatrix.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-medium">{(rowIndex + 3).toFixed(1)}%</TableCell>
                        {row.map((value, colIndex) => (
                          <TableCell key={colIndex} className="text-center">
                            {value.toFixed(2)}%
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                <span className="italic">Note: Future: Add more sensitivity charts/tables</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
