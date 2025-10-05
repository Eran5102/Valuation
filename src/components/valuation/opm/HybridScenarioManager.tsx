'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Plus, Calculator, TrendingUp, AlertCircle, Info } from 'lucide-react'
import { AssumptionsExtractor } from '@/lib/services/shared/AssumptionsExtractor'
import { ProbabilityHelpers } from '@/lib/services/shared/math/ProbabilityHelpers'
import { HybridScenarioCard } from './HybridScenarioCard'
import { HybridResultsDisplay } from './HybridResultsDisplay'
import type { HybridScenario, HybridPWERMResult, OPMBlackScholesParams } from '@/types/opm'

interface SecurityClass {
  id: string
  name: string
  shareType: string
  pricePerShare: number
  sharesOutstanding: number
}

interface HybridScenarioManagerProps {
  valuationId: string
  assumptions?: any
  onResultCalculated?: (result: HybridPWERMResult) => void
}

// Default scenario templates
const DEFAULT_SCENARIOS: Partial<HybridScenario>[] = [
  {
    name: 'IPO',
    probability: 30,
    targetFMV: 0,
    description: 'Initial Public Offering scenario',
    color: '#10b981', // green
  },
  {
    name: 'Acquisition',
    probability: 50,
    targetFMV: 0,
    description: 'Strategic acquisition scenario',
    color: '#3b82f6', // blue
  },
  {
    name: 'Down Round',
    probability: 20,
    targetFMV: 0,
    description: 'Down round financing scenario',
    color: '#ef4444', // red
  },
]

export function HybridScenarioManager({
  valuationId,
  assumptions,
  onResultCalculated,
}: HybridScenarioManagerProps) {
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scenarios, setScenarios] = useState<HybridScenario[]>([])
  const [result, setResult] = useState<HybridPWERMResult | null>(null)
  const [probabilityFormat] = useState<'percentage' | 'decimal'>('percentage')
  const [securities, setSecurities] = useState<SecurityClass[]>([])
  const [selectedSecurityId, setSelectedSecurityId] = useState<string>('')

  // Extract Black-Scholes parameters from assumptions
  const extractedParams = useMemo(() => {
    return AssumptionsExtractor.extractBlackScholesParams(assumptions)
  }, [assumptions])

  const [globalParams, setGlobalParams] = useState<OPMBlackScholesParams>({
    companyValue: 0,
    strikePrice: 0,
    timeToLiquidity: extractedParams.timeToLiquidity,
    volatility: extractedParams.volatility,
    riskFreeRate: extractedParams.riskFreeRate,
    dividendYield: extractedParams.dividendYield,
  })

  // Update global params when assumptions change
  useEffect(() => {
    setGlobalParams((prev) => ({
      ...prev,
      timeToLiquidity: extractedParams.timeToLiquidity,
      volatility: extractedParams.volatility,
      riskFreeRate: extractedParams.riskFreeRate,
      dividendYield: extractedParams.dividendYield,
    }))
  }, [extractedParams])

  // Fetch cap table for securities
  useEffect(() => {
    async function fetchCapTable() {
      try {
        const response = await fetch(`/api/valuations/${valuationId}`)
        const data = await response.json()
        const capTable = data.cap_table_snapshot || data.cap_table

        if (capTable && capTable.shareClasses) {
          const securityClasses: SecurityClass[] = capTable.shareClasses.map((sc: any) => ({
            id: sc.id,
            name: sc.name,
            shareType: sc.shareType,
            pricePerShare: sc.pricePerShare || 0,
            sharesOutstanding: sc.sharesOutstanding || 0,
          }))
          setSecurities(securityClasses)

          // Auto-select first security
          if (securityClasses.length > 0 && !selectedSecurityId) {
            setSelectedSecurityId(securityClasses[0].id)
          }
        }
      } catch (error) {
        console.error('[HybridScenarioManager] Failed to fetch cap table:', error)
      }
    }

    if (valuationId) {
      fetchCapTable()
    }
  }, [valuationId])

  // Initialize with default scenarios
  useEffect(() => {
    if (scenarios.length === 0) {
      const initialScenarios: HybridScenario[] = DEFAULT_SCENARIOS.map((template, idx) => ({
        id: `scenario_${Date.now()}_${idx}`,
        name: template.name || `Scenario ${idx + 1}`,
        probability: template.probability || 33.33,
        mode: 'manual' as 'manual' | 'backsolve',
        enterpriseValue: 0,
        targetFMV: template.targetFMV || 0,
        description: template.description,
        color: template.color,
      }))
      setScenarios(initialScenarios)
    }
  }, [])

  // Validate probabilities
  const probabilityValidation = useMemo(() => {
    if (scenarios.length === 0) return null
    const probs = scenarios.map((s) => s.probability)
    return ProbabilityHelpers.validateProbabilities(probs, probabilityFormat)
  }, [scenarios, probabilityFormat])

  // Calculate total probability
  const totalProbability = useMemo(() => {
    return scenarios.reduce((sum, s) => sum + s.probability, 0)
  }, [scenarios])

  // Detect if there's a backsolve scenario
  const backsolveScenario = useMemo(() => {
    return scenarios.find((s) => s.mode === 'backsolve')
  }, [scenarios])

  // Count backsolve scenarios
  const backsolveCount = useMemo(() => {
    return scenarios.filter((s) => s.mode === 'backsolve').length
  }, [scenarios])

  // Auto-calculate when inputs change
  useEffect(() => {
    if (
      selectedSecurityId &&
      scenarios.length > 0 &&
      probabilityValidation?.valid &&
      backsolveCount <= 1
    ) {
      // Debounce the calculation
      const timer = setTimeout(() => {
        handleCalculate()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [scenarios, selectedSecurityId, globalParams, backsolveCount])

  /**
   * Add new scenario
   */
  const handleAddScenario = () => {
    const newScenario: HybridScenario = {
      id: `scenario_${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      probability: 0,
      targetFMV: 0,
      description: '',
      color: '#6b7280', // gray
    }
    setScenarios([...scenarios, newScenario])
  }

  /**
   * Update scenario
   */
  const handleUpdateScenario = (index: number, updatedScenario: HybridScenario) => {
    const newScenarios = [...scenarios]
    newScenarios[index] = updatedScenario
    setScenarios(newScenarios)
  }

  /**
   * Delete scenario
   */
  const handleDeleteScenario = (index: number) => {
    if (scenarios.length <= 1) {
      setError('At least one scenario is required')
      return
    }
    const newScenarios = scenarios.filter((_, i) => i !== index)
    setScenarios(newScenarios)
  }

  /**
   * Auto-adjust probabilities when one changes
   */
  const handleProbabilityChange = (index: number, newProbability: number) => {
    const probs = scenarios.map((s) => s.probability)
    const adjustedProbs = ProbabilityHelpers.autoAdjustProbabilities(
      probs,
      index,
      newProbability,
      probabilityFormat
    )

    const newScenarios = scenarios.map((s, i) => ({
      ...s,
      probability: adjustedProbs[i],
    }))
    setScenarios(newScenarios)
  }

  /**
   * Normalize probabilities to 100%
   */
  const handleNormalizeProbabilities = () => {
    const probs = scenarios.map((s) => s.probability)
    const normalized = ProbabilityHelpers.normalizeProbabilities(probs, probabilityFormat)

    const newScenarios = scenarios.map((s, i) => ({
      ...s,
      probability: normalized[i],
    }))
    setScenarios(newScenarios)
  }

  /**
   * Calculate hybrid PWERM (weighted backsolve or regular)
   */
  const handleCalculate = async () => {
    if (!selectedSecurityId) return

    setCalculating(true)
    setError(null)

    try {
      // Validate scenarios
      if (scenarios.length === 0) {
        throw new Error('At least one scenario is required')
      }

      if (!probabilityValidation?.valid) {
        throw new Error(
          `Probability validation failed: ${probabilityValidation?.errors.join(', ')}`
        )
      }

      // Check for backsolve scenarios
      if (backsolveCount > 1) {
        throw new Error('Only one scenario can be in backsolve mode')
      }

      // Validate manual scenarios have enterprise values
      const manualScenarios = scenarios.filter((s) => s.mode === 'manual')
      if (manualScenarios.some((s) => !s.enterpriseValue || s.enterpriseValue <= 0)) {
        throw new Error('All manual scenarios must have a positive enterprise value')
      }

      // Determine which API to call
      const hasBacksolve = backsolveCount === 1

      if (hasBacksolve) {
        // Call weighted backsolve API
        const response = await fetch(`/api/valuations/${valuationId}/opm-weighted-backsolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            securityClassId: selectedSecurityId,
            scenarios: scenarios.map((s) => ({
              name: s.name,
              probability: s.probability,
              isBacksolve: s.mode === 'backsolve',
              enterpriseValue: s.mode === 'manual' ? s.enterpriseValue : undefined,
              // Merge scenario-specific params with global params
              timeToLiquidity:
                s.blackScholesParams?.timeToLiquidity ?? globalParams.timeToLiquidity,
              volatility: s.blackScholesParams?.volatility ?? globalParams.volatility,
              riskFreeRate: s.blackScholesParams?.riskFreeRate ?? globalParams.riskFreeRate,
              dividendYield: s.blackScholesParams?.dividendYield ?? globalParams.dividendYield,
            })),
            probabilityFormat,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to calculate weighted backsolve')
        }

        const data = await response.json()
        if (data.success) {
          // Transform weighted backsolve result to match HybridPWERMResult format
          const transformedResult: HybridPWERMResult = {
            success: data.data.converged,
            enterpriseValue:
              data.data.scenarioResults[data.data.backsolveScenarioIndex]?.enterpriseValue,
            weightedFMV: data.data.actualWeightedFMV,
            error: data.data.error,
            converged: data.data.converged,
            iterations: data.data.metadata?.iterations || 0,
            scenarioResults: data.data.scenarioResults.map((sr: any, idx: number) => ({
              scenarioId: scenarios[idx].id,
              scenarioName: sr.name,
              probability: sr.probability,
              targetFMV: data.data.targetFMV,
              calculatedFMV: sr.fmvPerShare,
              blackScholesParams: {
                companyValue: sr.enterpriseValue,
                strikePrice: 0,
                timeToLiquidity:
                  scenarios[idx].blackScholesParams?.timeToLiquidity ??
                  globalParams.timeToLiquidity,
                volatility:
                  scenarios[idx].blackScholesParams?.volatility ?? globalParams.volatility,
                riskFreeRate:
                  scenarios[idx].blackScholesParams?.riskFreeRate ?? globalParams.riskFreeRate,
                dividendYield:
                  scenarios[idx].blackScholesParams?.dividendYield ?? globalParams.dividendYield,
              },
              breakpoints: [],
              allocation: sr.allocation,
              weightedContribution: sr.weightedContribution,
              percentOfWeightedValue:
                data.data.actualWeightedFMV > 0
                  ? (sr.weightedContribution / data.data.actualWeightedFMV) * 100
                  : 0,
            })),
            probabilityValidation: {
              valid: true,
              totalProbability: scenarios.reduce((sum, s) => sum + s.probability, 0),
              normalizedProbabilities: scenarios.map((s) => s.probability),
            },
            statistics: {
              weightedMean: data.data.actualWeightedFMV,
              weightedVariance: 0,
              weightedStdDev: 0,
              coefficientOfVariation: 0,
              percentile25: 0,
              percentile50: 0,
              percentile75: 0,
            },
            metadata: {
              method: data.data.metadata?.method || 'hybrid',
              executionTimeMs: data.data.metadata?.executionTimeMs || 0,
            },
            warnings: data.data.warnings,
          }
          setResult(transformedResult)
          onResultCalculated?.(transformedResult)
        } else {
          throw new Error(data.error || 'Calculation failed')
        }
      } else {
        // All manual - call regular hybrid API (if it exists)
        // For now, show error since we removed the old hybrid API
        throw new Error(
          'Regular hybrid PWERM (all manual scenarios) is not yet implemented. Use at least one backsolve scenario.'
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hybrid Scenario PWERM
          </CardTitle>
          <CardDescription>
            Analyze multiple liquidity scenarios with probability-weighted expected returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Target Security */}
            <div>
              <Label className="text-base font-semibold">
                Target Security{' '}
                {backsolveScenario && <span className="text-xs text-muted-foreground">*</span>}
              </Label>
              {backsolveScenario && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The backsolve scenario will calculate the enterprise value needed to achieve
                    this security's price per share (weighted across all scenarios)
                  </AlertDescription>
                </Alert>
              )}
              <div className="mt-2">
                <Label htmlFor="security">Security Class</Label>
                <Select value={selectedSecurityId} onValueChange={setSelectedSecurityId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a security" />
                  </SelectTrigger>
                  <SelectContent>
                    {securities.map((security) => (
                      <SelectItem key={security.id} value={security.id}>
                        {security.name} - ${security.pricePerShare.toFixed(4)}/share
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Global Parameters */}
            <div>
              <Label className="text-base font-semibold">Global Black-Scholes Parameters</Label>
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  These parameters apply to all scenarios unless overridden per scenario
                </AlertDescription>
              </Alert>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="volatility">Volatility (%)</Label>
                  <Input
                    id="volatility"
                    type="number"
                    value={(globalParams.volatility * 100).toFixed(1)}
                    onChange={(e) =>
                      setGlobalParams((prev) => ({
                        ...prev,
                        volatility: parseFloat(e.target.value) / 100 || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="riskFreeRate">Risk-Free Rate (%)</Label>
                  <Input
                    id="riskFreeRate"
                    type="number"
                    value={(globalParams.riskFreeRate * 100).toFixed(1)}
                    onChange={(e) =>
                      setGlobalParams((prev) => ({
                        ...prev,
                        riskFreeRate: parseFloat(e.target.value) / 100 || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeToLiquidity">Time to Liquidity (Years)</Label>
                  <Input
                    id="timeToLiquidity"
                    type="number"
                    value={globalParams.timeToLiquidity}
                    onChange={(e) =>
                      setGlobalParams((prev) => ({
                        ...prev,
                        timeToLiquidity: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dividendYield">Dividend Yield (%)</Label>
                  <Input
                    id="dividendYield"
                    type="number"
                    value={(globalParams.dividendYield * 100).toFixed(1)}
                    onChange={(e) =>
                      setGlobalParams((prev) => ({
                        ...prev,
                        dividendYield: parseFloat(e.target.value) / 100 || 0,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Probability Summary & Validation */}
            <div className="space-y-2">
              <div className="bg-muted/50 flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Probability</div>
                  <div className="text-2xl font-bold">
                    {totalProbability.toFixed(1)}%
                    {probabilityValidation?.valid ? (
                      <span className="ml-2 text-sm font-normal text-green-600">✓ Valid</span>
                    ) : (
                      <span className="ml-2 text-sm font-normal text-red-600">✗ Invalid</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNormalizeProbabilities}
                  disabled={scenarios.length === 0}
                >
                  Normalize to 100%
                </Button>
              </div>

              {probabilityValidation && !probabilityValidation.valid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{probabilityValidation.errors.join(', ')}</AlertDescription>
                </Alert>
              )}

              {backsolveCount > 1 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Only one scenario can be in backsolve mode. You currently have {backsolveCount}{' '}
                    backsolve scenarios.
                  </AlertDescription>
                </Alert>
              )}

              {calculating && (
                <Alert>
                  <LoadingSpinner size="sm" className="h-4 w-4" />
                  <AlertDescription>Calculating weighted backsolve...</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scenarios ({scenarios.length})</h3>
          <Button onClick={handleAddScenario} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Scenario
          </Button>
        </div>

        {scenarios.map((scenario, index) => (
          <HybridScenarioCard
            key={scenario.id}
            scenario={scenario}
            index={index}
            totalScenarios={scenarios.length}
            onUpdate={(updated) => handleUpdateScenario(index, updated)}
            onDelete={() => handleDeleteScenario(index)}
            onProbabilityChange={(newProb) => handleProbabilityChange(index, newProb)}
            probabilityFormat={probabilityFormat}
            globalParams={globalParams}
          />
        ))}
      </div>

      {/* Errors */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && <HybridResultsDisplay result={result} />}
    </div>
  )
}
