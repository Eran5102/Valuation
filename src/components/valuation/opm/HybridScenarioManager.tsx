'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Plus, Calculator, TrendingUp, AlertCircle, Info } from 'lucide-react'
import { AssumptionsExtractor } from '@/lib/services/shared/AssumptionsExtractor'
import { ProbabilityHelpers } from '@/lib/services/shared/math/ProbabilityHelpers'
import { HybridScenarioCard } from './HybridScenarioCard'
import { HybridResultsDisplay } from './HybridResultsDisplay'
import type { HybridScenario, HybridPWERMResult, OPMBlackScholesParams } from '@/types/opm'

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
  const [securityClassId, setSecurityClassId] = useState<string>('common')

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

  // Initialize with default scenarios
  useEffect(() => {
    if (scenarios.length === 0) {
      const initialScenarios: HybridScenario[] = DEFAULT_SCENARIOS.map((template, idx) => ({
        id: `scenario_${Date.now()}_${idx}`,
        name: template.name || `Scenario ${idx + 1}`,
        probability: template.probability || 33.33,
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
   * Calculate hybrid PWERM
   */
  const handleCalculate = async () => {
    setCalculating(true)
    setError(null)

    try {
      // Validate scenarios
      if (scenarios.length === 0) {
        throw new Error('At least one scenario is required')
      }

      if (scenarios.some((s) => s.targetFMV <= 0)) {
        throw new Error('All scenarios must have a positive target FMV')
      }

      if (!probabilityValidation?.valid) {
        throw new Error(
          `Probability validation failed: ${probabilityValidation?.errors.join(', ')}`
        )
      }

      // Make API request
      const response = await fetch(`/api/valuations/${valuationId}/opm-hybrid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securityClassId,
          scenarios,
          globalBlackScholesParams: {
            timeToLiquidity: globalParams.timeToLiquidity,
            volatility: globalParams.volatility,
            riskFreeRate: globalParams.riskFreeRate,
            dividendYield: globalParams.dividendYield,
          },
          probabilityFormat,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate hybrid PWERM')
      }

      const data = await response.json()
      if (data.success) {
        setResult(data.data)
        onResultCalculated?.(data.data)
      } else {
        throw new Error(data.error || 'Calculation failed')
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
            {/* Global Parameters */}
            <div>
              <Label className="text-base font-semibold">Global Parameters</Label>
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
                  <Label htmlFor="securityClass">Security Class</Label>
                  <Input
                    id="securityClass"
                    type="text"
                    value={securityClassId}
                    onChange={(e) => setSecurityClassId(e.target.value)}
                    placeholder="e.g., common"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Probability Summary */}
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

      {/* Calculate Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCalculate}
              disabled={calculating || !probabilityValidation?.valid || scenarios.length === 0}
              className="flex-1"
              size="lg"
            >
              {calculating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" /> Calculating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" /> Calculate Hybrid PWERM
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && <HybridResultsDisplay result={result} />}
    </div>
  )
}
