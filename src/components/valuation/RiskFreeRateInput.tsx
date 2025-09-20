import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertCircle, Download, Globe, Loader2, Percent, RefreshCw, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  InterestRateService,
  InterestRateSource,
  RiskFreeRateResult,
} from '@/lib/services/interestRates/interestRateService'
import { Assumption } from './ValuationAssumptions'

interface RiskFreeRateInputProps {
  assumption: Assumption
  categoryId: string
  valuationDate?: string
  timeToLiquidity?: number
  onChange: (categoryId: string, assumptionId: string, value: string | number) => void
  onGetAssumptionValue?: (assumptionId: string) => string | number
}

export function RiskFreeRateInput({
  assumption,
  categoryId,
  valuationDate,
  timeToLiquidity,
  onChange,
  onGetAssumptionValue,
}: RiskFreeRateInputProps) {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchResult, setLastFetchResult] = useState<RiskFreeRateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [availableSources, setAvailableSources] = useState<InterestRateSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('us_treasury')

  // Get current values for valuation date and time to liquidity from other assumptions
  const getValuationDate = (): string => {
    return valuationDate || (onGetAssumptionValue?.('valuation_date') as string) || ''
  }

  const getTimeToLiquidity = (): number => {
    return timeToLiquidity || (onGetAssumptionValue?.('time_to_liquidity') as number) || 3
  }

  // Initialize available sources
  useEffect(() => {
    const sources = InterestRateService.getAvailableSources()
    setAvailableSources(sources)

    // Set default source based on any preferences
    if (sources.length > 0 && !sources.find((s) => s.id === selectedSource)) {
      setSelectedSource(sources[0].id)
    }
  }, [selectedSource])

  // Auto-fetch when automation is enabled and dependencies change
  useEffect(() => {
    if (isAutomationEnabled && !isLoading) {
      const currentDate = getValuationDate()
      const currentTTL = getTimeToLiquidity()

      if (currentDate && currentTTL > 0) {
        handleAutoFetch()
      }
    }
  }, [isAutomationEnabled, valuationDate, timeToLiquidity, selectedSource])

  const handleAutoFetch = async () => {
    const currentDate = getValuationDate()
    const currentTTL = getTimeToLiquidity()

    if (!currentDate) {
      setError('Valuation date is required for automated rate fetching')
      return
    }

    if (!currentTTL || currentTTL <= 0) {
      setError('Time to liquidity is required for automated rate fetching')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await InterestRateService.getRiskFreeRate({
        valuationDate: currentDate,
        timeToLiquidityYears: currentTTL,
        preferredSourceId: selectedSource,
      })

      setLastFetchResult(result)

      if (result.rate !== null) {
        // Update the assumption value
        onChange(categoryId, assumption.id, result.rate.toString())
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch risk-free rate')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk-free rate')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualInput = (value: string) => {
    setIsAutomationEnabled(false)
    setLastFetchResult(null)
    onChange(categoryId, assumption.id, value)
  }

  const canAutoFetch = getValuationDate() && getTimeToLiquidity() > 0

  const baseClasses =
    'w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Main Input Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={assumption.value}
              onChange={(e) => handleManualInput(e.target.value)}
              className={`${baseClasses} pr-8 ${isAutomationEnabled ? 'bg-muted/50' : ''}`}
              step="0.01"
              placeholder="4.5"
              disabled={isLoading}
              readOnly={isAutomationEnabled}
            />
            <Percent className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          </div>

          {/* Auto-fetch button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isAutomationEnabled ? 'default' : 'outline'}
                onClick={() => {
                  if (isAutomationEnabled) {
                    handleAutoFetch()
                  } else {
                    setIsAutomationEnabled(true)
                    if (canAutoFetch) {
                      handleAutoFetch()
                    }
                  }
                }}
                disabled={isLoading || !canAutoFetch}
                className="px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isAutomationEnabled ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!canAutoFetch
                ? 'Set valuation date and time to liquidity first'
                : isAutomationEnabled
                  ? 'Refresh from source'
                  : 'Fetch from Treasury yield curve'}
            </TooltipContent>
          </Tooltip>

          {/* Manual input button */}
          {isAutomationEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAutomationEnabled(false)}
                  className="px-3"
                >
                  ✏️
                </Button>
              </TooltipTrigger>
              <TooltipContent>Switch to manual entry</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Source Selection (when automation enabled) */}
        {isAutomationEnabled && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Source:</span>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="h-8 w-auto text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    <div className="flex items-center gap-2">
                      <span>{source.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {source.currency}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status and Results */}
        {lastFetchResult && isAutomationEnabled && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>
                Fetched {lastFetchResult.rate}% from {lastFetchResult.source.name}(
                {lastFetchResult.maturity}){lastFetchResult.interpolated && ' (interpolated)'}
              </span>
            </div>
            <div className="text-muted-foreground">
              Valuation Date: {lastFetchResult.valuationDate} | Time to Liquidity:{' '}
              {lastFetchResult.timeToLiquidity} years
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Automation Requirements Notice */}
        {!canAutoFetch && (
          <div className="text-xs text-muted-foreground">
            💡 Set <strong>Valuation Date</strong> and <strong>Time to Liquidity</strong> to enable
            automatic yield curve fetching
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
