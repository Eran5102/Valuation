'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { EditableDataTable } from '@/components/ui/editable-data-table'
import { PercentageInput } from '@/components/ui/percentage-input'
import { Slider } from '@/components/ui/slider'
import {
  Calculator,
  Plus,
  Trash2,
  Info,
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  Save,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedCallback } from 'use-debounce'
import {
  saveWACCData,
  addPeerCompany,
  deletePeerCompany,
  calculateOptimalStructure,
  importPeerBetas,
} from './actions'
import { calculateWACC, WACCInputs } from '@/lib/calculations/wacc-client'
import { ColumnDef } from '@tanstack/react-table'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { useDCFModel } from '@/contexts/DCFModelContext'
import { PeerCompaniesAnalysis } from '@/components/peer-analysis/PeerCompaniesAnalysis'

interface PeerCompany {
  id?: string
  name: string
  leveredBeta: number
  debtToEquity: number
  taxRate: number
  unleveredBeta?: number
}

interface WACCData {
  waccData: {
    targetDebtToEquity: number
    targetTaxRate: number
    riskFreeRate: number
    equityRiskPremium: number
    sizePremium: number
    countryRiskPremium: number
    companySpecificPremium: number
    preTaxCostOfDebt: number
    debtTaxRate: number
    debtWeight: number
    equityWeight: number
  }
  peerCompanies: PeerCompany[]
  calculatedWACC: number | null
  lastUpdated: string | null
}

interface WACCCalculatorClientProps {
  valuationId: string
  initialData: WACCData
}

export function WACCCalculatorClient({ valuationId, initialData }: WACCCalculatorClientProps) {
  // Use DCF Model Context
  const { updateWACC, updateAssumptions, recalculateAll } = useDCFModel()

  const [data, setData] = useState(initialData.waccData)
  const [peerCompanies, setPeerCompanies] = useState<PeerCompany[]>(initialData.peerCompanies)
  const [calculatedResults, setCalculatedResults] = useState<any>(null)
  const [optimalStructure, setOptimalStructure] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('peer-analysis')

  // New peer dialog state
  const [newPeerOpen, setNewPeerOpen] = useState(false)
  const [newPeer, setNewPeer] = useState<PeerCompany>({
    name: '',
    leveredBeta: 1.0,
    debtToEquity: 0.4,
    taxRate: 0.21,
  })
  const [showPeerAnalysis, setShowPeerAnalysis] = useState(false)

  // Calculate WACC in real-time
  const calculateCurrentWACC = useCallback(() => {
    if (peerCompanies.length === 0) return

    const inputs: WACCInputs = {
      peerCompanies,
      targetDebtToEquity: data.targetDebtToEquity,
      targetTaxRate: data.targetTaxRate,
      riskFreeRate: data.riskFreeRate,
      equityRiskPremium: data.equityRiskPremium,
      sizePremium: data.sizePremium,
      countryRiskPremium: data.countryRiskPremium,
      companySpecificPremium: data.companySpecificPremium,
      preTaxCostOfDebt: data.preTaxCostOfDebt,
      debtTaxRate: data.debtTaxRate,
      debtWeight: data.debtWeight,
      equityWeight: 1 - data.debtWeight,
    }

    const results = calculateWACC(inputs)
    setCalculatedResults(results)

    // Update DCF context with WACC data
    if (results?.wacc) {
      updateWACC({
        costOfEquity: results.costOfEquity,
        costOfDebt: results.afterTaxCostOfDebt,
        taxRate: data.targetTaxRate,
        debtWeight: data.debtWeight,
        equityWeight: data.equityWeight,
        calculatedWACC: results.wacc,
        unleveredBeta: results.unleveredBeta,
        leveredBeta: results.leveredBeta,
        riskFreeRate: data.riskFreeRate,
        equityRiskPremium: data.equityRiskPremium,
        sizePremium: data.sizePremium,
        specificRiskPremium: data.companySpecificPremium,
      })

      // Also update discount rate in assumptions
      updateAssumptions({
        discountRate: results.wacc,
      })
    }
  }, [data, peerCompanies, updateWACC, updateAssumptions])

  // Auto-calculate on changes
  const debouncedCalculate = useDebouncedCallback(() => {
    calculateCurrentWACC()
    setHasChanges(true)
  }, 300)

  useEffect(() => {
    debouncedCalculate()
  }, [data, peerCompanies, debouncedCalculate])

  // Save WACC data
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveWACCData(valuationId, {
        ...data,
        peerCompanies,
      })
      toast.success('WACC calculation saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save WACC calculation')
    } finally {
      setIsSaving(false)
    }
  }

  // Add peer company
  const handleAddPeer = async () => {
    if (!newPeer.name) {
      toast.error('Please enter a company name')
      return
    }

    const peerToAdd = {
      ...newPeer,
      id: Date.now().toString(),
    }

    setPeerCompanies([...peerCompanies, peerToAdd])
    setNewPeerOpen(false)
    setNewPeer({
      name: '',
      leveredBeta: 1.0,
      debtToEquity: 0.4,
      taxRate: 0.21,
    })
    toast.success('Peer company added')
  }

  // Delete peer company
  const handleDeletePeer = (peerId: string) => {
    setPeerCompanies(peerCompanies.filter((p) => p.id !== peerId))
    toast.success('Peer company removed')
  }

  // Update peer company
  const updatePeer = (index: number, field: keyof PeerCompany, value: any) => {
    const updated = [...peerCompanies]
    updated[index] = { ...updated[index], [field]: value }
    setPeerCompanies(updated)
  }

  // Calculate optimal capital structure
  const handleCalculateOptimal = async () => {
    setIsCalculating(true)
    try {
      const baseInputs = {
        peerCompanies,
        targetTaxRate: data.targetTaxRate,
        riskFreeRate: data.riskFreeRate,
        equityRiskPremium: data.equityRiskPremium,
        sizePremium: data.sizePremium,
        countryRiskPremium: data.countryRiskPremium,
        companySpecificPremium: data.companySpecificPremium,
        preTaxCostOfDebt: data.preTaxCostOfDebt,
        debtTaxRate: data.debtTaxRate,
      }

      const result = await calculateOptimalStructure(valuationId, baseInputs)
      setOptimalStructure(result)
      toast.success('Optimal capital structure calculated')
    } catch (error) {
      console.error('Optimization error:', error)
      toast.error('Failed to calculate optimal structure')
    } finally {
      setIsCalculating(false)
    }
  }

  // Import peer betas
  const handleImportPeers = async (source: 'Bloomberg' | 'CapitalIQ') => {
    try {
      const imported = await importPeerBetas(source)
      const newPeers = imported.map((p: any, i: number) => ({
        ...p,
        id: `imported-${Date.now()}-${i}`,
      }))
      setPeerCompanies([...peerCompanies, ...newPeers])
      toast.success(`Imported ${imported.length} peer companies from ${source}`)
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import peer companies')
    }
  }

  // Peer companies table columns
  const peerColumns: ColumnDef<PeerCompany>[] = [
    {
      id: 'name',
      header: 'Company Name',
      accessorKey: 'name',
    },
    {
      id: 'leveredBeta',
      header: 'Levered Beta',
      accessorKey: 'leveredBeta',
      cell: ({ row }) => row.original.leveredBeta.toFixed(2),
    },
    {
      id: 'debtToEquity',
      header: 'D/E Ratio',
      accessorKey: 'debtToEquity',
      cell: ({ row }) => row.original.debtToEquity.toFixed(2),
    },
    {
      id: 'taxRate',
      header: 'Tax Rate',
      accessorKey: 'taxRate',
      cell: ({ row }) => `${(row.original.taxRate * 100).toFixed(1)}%`,
    },
    {
      id: 'unleveredBeta',
      header: 'Unlevered Beta',
      accessorKey: 'unleveredBeta',
      cell: ({ row }) => {
        const unlevered =
          row.original.leveredBeta / (1 + (1 - row.original.taxRate) * row.original.debtToEquity)
        return unlevered.toFixed(3)
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => handleDeletePeer(row.original.id || '')}>
          <Trash2 className="h-3 w-3" />
        </Button>
      ),
    },
  ]

  // Chart data for optimal structure
  const chartData = optimalStructure?.allResults?.map((r: any) => ({
    'Debt Ratio': `${(r.debtRatio * 100).toFixed(0)}%`,
    WACC: (r.wacc * 100).toFixed(2),
    'Cost of Equity': (r.costOfEquity * 100).toFixed(2),
    'Cost of Debt': (r.costOfDebt * 100).toFixed(2),
  }))

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WACC Calculator</h1>
          <p className="text-muted-foreground">Weighted Average Cost of Capital calculation</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" disabled>
              <AlertCircle className="mr-2 h-4 w-4" />
              Unsaved Changes
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save WACC'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WACC</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculatedResults ? `${(calculatedResults.wacc * 100).toFixed(2)}%` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Weighted average cost of capital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost of Equity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculatedResults ? `${(calculatedResults.costOfEquity * 100).toFixed(2)}%` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">CAPM + premiums</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost of Debt</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculatedResults
                ? `${(calculatedResults.afterTaxCostOfDebt * 100).toFixed(2)}%`
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">After-tax</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relevered Beta</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculatedResults ? calculatedResults.releveredBeta.toFixed(3) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Target capital structure</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="peer-analysis">Peer Beta Analysis</TabsTrigger>
          <TabsTrigger value="alpha-vantage">Market Data</TabsTrigger>
          <TabsTrigger value="cost-of-equity">Cost of Equity</TabsTrigger>
          <TabsTrigger value="capital-structure">Capital Structure</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Peer Beta Analysis Tab */}
        <TabsContent value="peer-analysis">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Peer Company Beta Analysis</CardTitle>
                  <CardDescription>
                    Add comparable companies to calculate median unlevered beta
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab('alpha-vantage')
                      setShowPeerAnalysis(true)
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Import from Alpha Vantage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImportPeers('Bloomberg')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Import from Bloomberg
                  </Button>
                  <Dialog open={newPeerOpen} onOpenChange={setNewPeerOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Peer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Peer Company</DialogTitle>
                        <DialogDescription>
                          Enter the peer company's beta and capital structure information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input
                            value={newPeer.name}
                            onChange={(e) => setNewPeer({ ...newPeer, name: e.target.value })}
                            placeholder="e.g., Apple Inc."
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Levered Beta</Label>
                            <Input
                              type="number"
                              value={newPeer.leveredBeta}
                              onChange={(e) =>
                                setNewPeer({ ...newPeer, leveredBeta: parseFloat(e.target.value) })
                              }
                              step={0.01}
                              min={0}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Debt-to-Equity Ratio</Label>
                            <Input
                              type="number"
                              value={newPeer.debtToEquity}
                              onChange={(e) =>
                                setNewPeer({ ...newPeer, debtToEquity: parseFloat(e.target.value) })
                              }
                              step={0.01}
                              min={0}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Tax Rate</Label>
                          <PercentageInput
                            value={newPeer.taxRate * 100}
                            onChange={(value) => setNewPeer({ ...newPeer, taxRate: value / 100 })}
                            min={0}
                            max={50}
                            decimals={1}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewPeerOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPeer}>Add Peer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {peerCompanies.length > 0 ? (
                <>
                  <EditableDataTable
                    data={peerCompanies}
                    columns={peerColumns}
                    tableId="peer-companies"
                    showExport={false}
                    showColumnVisibility={false}
                    showPagination={false}
                    editable={false}
                  />
                  {calculatedResults && (
                    <div className="mt-4 rounded-lg bg-muted p-4">
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Median Unlevered Beta:</span>
                          <span className="font-medium">
                            {calculatedResults.unleveredBeta.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target D/E Ratio:</span>
                          <span className="font-medium">{data.targetDebtToEquity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Relevered Beta:</span>
                          <span className="font-medium">
                            {calculatedResults.releveredBeta.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Add peer companies to calculate beta for your valuation
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alpha Vantage Market Data Tab */}
        <TabsContent value="alpha-vantage">
          {showPeerAnalysis ? (
            <PeerCompaniesAnalysis
              valuationId={valuationId}
              onBetaSelect={(beta, source) => {
                // Add the beta as a new peer company
                const newPeerFromAlpha: PeerCompany = {
                  name: `${source} Beta`,
                  leveredBeta: beta,
                  debtToEquity: data.targetDebtToEquity,
                  taxRate: data.targetTaxRate,
                }
                setPeerCompanies([...peerCompanies, newPeerFromAlpha])
                setHasChanges(true)
                toast.success(`Added ${source} beta: ${beta.toFixed(3)}`)
                setShowPeerAnalysis(false)
                setActiveTab('peer-analysis')
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Alpha Vantage Market Data</CardTitle>
                <CardDescription>
                  Import beta and peer companies data from Alpha Vantage based on valuation date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowPeerAnalysis(true)} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Load Peer Companies Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cost of Equity Tab */}
        <TabsContent value="cost-of-equity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk-Free Rate & Market Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Risk-Free Rate</Label>
                  <PercentageInput
                    value={data.riskFreeRate * 100}
                    onChange={(value) => setData({ ...data, riskFreeRate: value / 100 })}
                    min={0}
                    max={10}
                    decimals={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Equity Risk Premium</Label>
                  <PercentageInput
                    value={data.equityRiskPremium * 100}
                    onChange={(value) => setData({ ...data, equityRiskPremium: value / 100 })}
                    min={0}
                    max={20}
                    decimals={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Risk Premiums</CardTitle>
              <CardDescription>
                Adjust for size, country, and company-specific risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Size Premium</Label>
                  <PercentageInput
                    value={data.sizePremium * 100}
                    onChange={(value) => setData({ ...data, sizePremium: value / 100 })}
                    min={0}
                    max={10}
                    decimals={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country Risk Premium</Label>
                  <PercentageInput
                    value={data.countryRiskPremium * 100}
                    onChange={(value) => setData({ ...data, countryRiskPremium: value / 100 })}
                    min={0}
                    max={10}
                    decimals={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company-Specific Premium</Label>
                  <PercentageInput
                    value={data.companySpecificPremium * 100}
                    onChange={(value) => setData({ ...data, companySpecificPremium: value / 100 })}
                    min={-5}
                    max={10}
                    decimals={2}
                  />
                </div>
              </div>

              {calculatedResults && (
                <div className="mt-6 rounded-lg bg-muted p-4">
                  <h4 className="mb-2 font-medium">Cost of Equity Build-Up</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Risk-Free Rate</span>
                      <span>{(data.riskFreeRate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Beta-Adjusted Market Premium</span>
                      <span>
                        {(calculatedResults.components.betaAdjustedPremium * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Size Premium</span>
                      <span>{(data.sizePremium * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Country Risk Premium</span>
                      <span>{(data.countryRiskPremium * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Company-Specific Premium</span>
                      <span>{(data.companySpecificPremium * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-medium">
                      <span>= Cost of Equity</span>
                      <span>{(calculatedResults.costOfEquity * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capital Structure Tab */}
        <TabsContent value="capital-structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost of Debt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pre-Tax Cost of Debt</Label>
                  <PercentageInput
                    value={data.preTaxCostOfDebt * 100}
                    onChange={(value) => setData({ ...data, preTaxCostOfDebt: value / 100 })}
                    min={0}
                    max={20}
                    decimals={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate</Label>
                  <PercentageInput
                    value={data.debtTaxRate * 100}
                    onChange={(value) => setData({ ...data, debtTaxRate: value / 100 })}
                    min={0}
                    max={50}
                    decimals={1}
                  />
                </div>
              </div>
              {calculatedResults && (
                <div className="mt-4 text-sm text-muted-foreground">
                  After-Tax Cost of Debt: {(data.preTaxCostOfDebt * 100).toFixed(2)}% × (1 -{' '}
                  {(data.debtTaxRate * 100).toFixed(1)}%) ={' '}
                  <span className="font-medium text-foreground">
                    {(calculatedResults.afterTaxCostOfDebt * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capital Structure Weights</CardTitle>
              <CardDescription>
                Set the target capital structure for WACC calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Debt Weight</Label>
                    <span className="text-sm font-medium">
                      {(data.debtWeight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[data.debtWeight * 100]}
                    onValueChange={([value]) => {
                      const debtWeight = value / 100
                      setData({
                        ...data,
                        debtWeight,
                        targetDebtToEquity: debtWeight / (1 - debtWeight),
                      })
                    }}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (All Equity)</span>
                    <span>100% (All Debt)</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Debt Weight:</span>
                      <span className="font-medium">{(data.debtWeight * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equity Weight:</span>
                      <span className="font-medium">
                        {((1 - data.debtWeight) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Implied D/E Ratio:</span>
                      <span className="font-medium">{data.targetDebtToEquity.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {calculatedResults && (
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">WACC Calculation</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cost of Equity × Equity Weight</span>
                        <span>
                          {(calculatedResults.costOfEquity * 100).toFixed(2)}% ×{' '}
                          {((1 - data.debtWeight) * 100).toFixed(1)}% ={' '}
                          {(calculatedResults.costOfEquity * (1 - data.debtWeight) * 100).toFixed(
                            2
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Cost of Debt × Debt Weight</span>
                        <span>
                          {(calculatedResults.afterTaxCostOfDebt * 100).toFixed(2)}% ×{' '}
                          {(data.debtWeight * 100).toFixed(1)}% ={' '}
                          {(calculatedResults.afterTaxCostOfDebt * data.debtWeight * 100).toFixed(
                            2
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-medium">
                        <span>= WACC</span>
                        <span className="text-primary">
                          {(calculatedResults.wacc * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Capital Structure Optimization</CardTitle>
                  <CardDescription>Find the optimal debt ratio that minimizes WACC</CardDescription>
                </div>
                <Button onClick={handleCalculateOptimal} disabled={isCalculating}>
                  <RefreshCw className={cn('mr-2 h-4 w-4', isCalculating && 'animate-spin')} />
                  {isCalculating ? 'Calculating...' : 'Calculate Optimal'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {optimalStructure ? (
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Optimal debt ratio: {(optimalStructure.optimalDebtRatio * 100).toFixed(0)}%
                      results in minimum WACC of {(optimalStructure.optimalWACC * 100).toFixed(2)}%
                    </AlertDescription>
                  </Alert>

                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="Debt Ratio" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="WACC"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Cost of Equity"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Cost of Debt"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      const optimalDebtWeight = optimalStructure.optimalDebtRatio
                      setData({
                        ...data,
                        debtWeight: optimalDebtWeight,
                        targetDebtToEquity: optimalDebtWeight / (1 - optimalDebtWeight),
                      })
                      toast.success('Applied optimal capital structure')
                    }}
                  >
                    Apply Optimal Structure
                  </Button>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click "Calculate Optimal" to find the capital structure that minimizes WACC
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
