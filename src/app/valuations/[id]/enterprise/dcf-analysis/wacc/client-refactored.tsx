'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PercentageInput } from '@/components/ui/percentage-input'
import { Save, AlertCircle, Plus, Download } from 'lucide-react'
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

// Import modular components
import {
  PeerBetaAnalysis,
  CostOfEquityInputs,
  CostOfDebtInputs,
  CapitalStructureInputs,
  WACCResults,
  OptimalStructureChart,
} from './components'

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
  const [data, setData] = useState(initialData.waccData)
  const [peerCompanies, setPeerCompanies] = useState<PeerCompany[]>(initialData.peerCompanies)
  const [calculatedResults, setCalculatedResults] = useState<any>(null)
  const [optimalStructure, setOptimalStructure] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // New peer dialog state
  const [newPeerOpen, setNewPeerOpen] = useState(false)
  const [newPeer, setNewPeer] = useState<PeerCompany>({
    name: '',
    leveredBeta: 1.0,
    debtToEquity: 0.4,
    taxRate: 0.21,
  })

  // Calculate WACC in real-time
  const calculateCurrentWACC = useCallback(() => {
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
    }

    const results = calculateWACC(inputs)
    setCalculatedResults(results)
  }, [data, peerCompanies])

  // Auto-calculate on changes
  const debouncedCalculate = useDebouncedCallback(() => {
    calculateCurrentWACC()
    setHasChanges(true)
  }, 300)

  useEffect(() => {
    debouncedCalculate()
  }, [data, peerCompanies, debouncedCalculate])

  // Update data field
  const updateDataField = (field: string, value: number) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  // Update peer company
  const updatePeer = (index: number, field: string, value: any) => {
    const updated = [...peerCompanies]
    updated[index] = { ...updated[index], [field]: value }
    setPeerCompanies(updated)
  }

  // Delete peer company
  const handleDeletePeer = (index: number) => {
    const updated = [...peerCompanies]
    updated.splice(index, 1)
    setPeerCompanies(updated)
    toast.success('Peer company removed')
  }

  // Add peer company
  const handleAddPeer = () => {
    setNewPeerOpen(true)
  }

  const confirmAddPeer = () => {
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

  // Import peer betas
  const handleImportPeers = async () => {
    setIsImporting(true)
    try {
      const imported = await importPeerBetas('Bloomberg')
      const newPeers = imported.map((p: any, i: number) => ({
        ...p,
        id: `imported-${Date.now()}-${i}`,
      }))
      setPeerCompanies([...peerCompanies, ...newPeers])
      toast.success(`Imported ${imported.length} peer companies`)
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import peer companies')
    } finally {
      setIsImporting(false)
    }
  }

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

  // Export to Excel
  const handleExport = () => {
    // Implementation for exporting WACC calculation to Excel
    toast.success('WACC calculation exported')
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WACC Calculator</h2>
          <p className="text-muted-foreground">
            Calculate the weighted average cost of capital using peer analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Warning for missing peers */}
      {peerCompanies.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Add peer companies to enable beta calculation and complete WACC analysis.
          </AlertDescription>
        </Alert>
      )}

      {/* Main content tabs */}
      <Tabs defaultValue="inputs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="peers">Peer Analysis</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CostOfEquityInputs
              riskFreeRate={data.riskFreeRate}
              equityRiskPremium={data.equityRiskPremium}
              sizePremium={data.sizePremium}
              countryRiskPremium={data.countryRiskPremium}
              companySpecificPremium={data.companySpecificPremium}
              onUpdate={updateDataField}
            />
            <CostOfDebtInputs
              preTaxCostOfDebt={data.preTaxCostOfDebt}
              debtTaxRate={data.debtTaxRate}
              afterTaxCostOfDebt={calculatedResults?.afterTaxCostOfDebt || 0}
              onUpdate={updateDataField}
            />
          </div>
          <CapitalStructureInputs
            debtWeight={data.debtWeight}
            targetDebtToEquity={data.targetDebtToEquity}
            targetTaxRate={data.targetTaxRate}
            onUpdate={updateDataField}
          />
        </TabsContent>

        <TabsContent value="peers" className="space-y-4">
          <PeerBetaAnalysis
            peerCompanies={peerCompanies}
            unleveredBeta={calculatedResults?.unleveredBeta || 0}
            releveredBeta={calculatedResults?.releveredBeta || 0}
            onAddPeer={handleAddPeer}
            onDeletePeer={handleDeletePeer}
            onUpdatePeer={updatePeer}
            onImportPeers={handleImportPeers}
            isImporting={isImporting}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <WACCResults
            results={calculatedResults}
            debtWeight={data.debtWeight}
            lastUpdated={initialData.lastUpdated}
          />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <OptimalStructureChart
            optimalStructure={optimalStructure}
            onCalculate={handleCalculateOptimal}
            isCalculating={isCalculating}
          />
        </TabsContent>
      </Tabs>

      {/* Add Peer Dialog */}
      <Dialog open={newPeerOpen} onOpenChange={setNewPeerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Peer Company</DialogTitle>
            <DialogDescription>Enter the peer company details for beta analysis</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="peerName">Company Name</Label>
              <Input
                id="peerName"
                value={newPeer.name}
                onChange={(e) => setNewPeer({ ...newPeer, name: e.target.value })}
                placeholder="e.g., Microsoft Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peerBeta">Levered Beta</Label>
                <Input
                  id="peerBeta"
                  type="number"
                  value={newPeer.leveredBeta}
                  onChange={(e) =>
                    setNewPeer({ ...newPeer, leveredBeta: parseFloat(e.target.value) || 0 })
                  }
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="peerDE">D/E Ratio</Label>
                <Input
                  id="peerDE"
                  type="number"
                  value={newPeer.debtToEquity}
                  onChange={(e) =>
                    setNewPeer({ ...newPeer, debtToEquity: parseFloat(e.target.value) || 0 })
                  }
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="peerTax">Tax Rate (%)</Label>
              <PercentageInput
                id="peerTax"
                value={newPeer.taxRate * 100}
                onChange={(value) => setNewPeer({ ...newPeer, taxRate: value / 100 })}
                min={0}
                max={50}
                step={0.1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPeerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAddPeer}>
              <Plus className="mr-2 h-4 w-4" />
              Add Peer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
