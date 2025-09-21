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
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertCircle,
  Database,
  Globe,
  Loader2,
  Percent,
  RefreshCw,
  Info,
  TrendingUp,
  BarChart,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getVolatilityService } from '@/lib/services/volatility/volatilityService'
import { VolatilitySource, VolatilityResult, VOLATILITY_MARKETS } from '@/types/volatility'
import { Assumption } from './ValuationAssumptions'

interface VolatilityInputProps {
  assumption: Assumption
  categoryId: string
  industry?: string
  timeToLiquidity?: number
  onChange: (categoryId: string, assumptionId: string, value: string | number) => void
  onGetAssumptionValue?: (assumptionId: string) => string | number
}

export function VolatilityInput({
  assumption,
  categoryId,
  industry,
  timeToLiquidity,
  onChange,
  onGetAssumptionValue,
}: VolatilityInputProps) {
  const [selectedSource, setSelectedSource] = useState<VolatilitySource>('manual')
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchResult, setLastFetchResult] = useState<VolatilityResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Damodaran-specific states
  const [selectedMarket, setSelectedMarket] = useState<string>('US')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([])

  // Alpha Vantage specific states
  const [comparableTickers, setComparableTickers] = useState<string>('')
  const [measurementPeriod, setMeasurementPeriod] = useState<number>(2) // years
  const [dataFrequency, setDataFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const volatilityService = getVolatilityService()

  // Get current industry from assumptions if not provided
  const getIndustry = (): string => {
    return industry || (onGetAssumptionValue?.('industry') as string) || ''
  }

  // Get time to liquidity from assumptions if not provided
  const getTimeToLiquidity = (): number => {
    return timeToLiquidity || (onGetAssumptionValue?.('time_to_liquidity') as number) || 3
  }

  // Load available industries when market changes
  useEffect(() => {
    const loadIndustries = async () => {
      if (selectedSource === 'damodaran' && selectedMarket) {
        try {
          // Import the appropriate market data
          const module = await import(
            `@/data/damodaran-volatility/${selectedMarket.toLowerCase()}-market.json`
          )
          const data = module.default as Array<{ industry: string }>
          const industries = data.map((item) => item.industry).sort()
          setAvailableIndustries(industries)

          // Auto-select industry if it matches
          const currentIndustry = getIndustry()
          if (currentIndustry && industries.includes(currentIndustry)) {
            setSelectedIndustry(currentIndustry)
          }
        } catch (error) {
          console.error('Failed to load industries:', error)
          setAvailableIndustries([])
        }
      }
    }
    loadIndustries()
  }, [selectedSource, selectedMarket])

  const handleFetchVolatility = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let result: VolatilityResult | null = null

      if (selectedSource === 'damodaran') {
        if (!selectedIndustry) {
          throw new Error('Please select an industry')
        }

        result = await volatilityService.getVolatility({
          source: 'damodaran',
          industry: selectedIndustry,
          market: selectedMarket,
        })
      } else if (selectedSource === 'alpha_vantage') {
        if (!comparableTickers.trim()) {
          throw new Error('Please enter comparable company tickers')
        }

        const tickers = comparableTickers
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)

        // Use API route for Alpha Vantage to handle server-side
        const response = await fetch('/api/volatility/alpha-vantage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tickers,
            timePeriodYears: measurementPeriod,
            frequency: dataFrequency,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to fetch volatility')
        }

        result = await response.json()
      }

      if (result) {
        setLastFetchResult(result)
        // Update the assumption value
        onChange(categoryId, assumption.id, result.value.toString())
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch volatility')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualInput = (value: string) => {
    setSelectedSource('manual')
    setLastFetchResult(null)
    onChange(categoryId, assumption.id, value)
  }

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
              className={`${baseClasses} pr-8 ${selectedSource !== 'manual' ? 'bg-muted/50' : ''}`}
              step="0.1"
              placeholder="60"
              disabled={isLoading}
              readOnly={selectedSource !== 'manual'}
            />
            <Percent className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          </div>

          {/* Source Selection Dropdown */}
          <Select
            value={selectedSource}
            onValueChange={(v) => setSelectedSource(v as VolatilitySource)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  ✏️ <span>Manual</span>
                </div>
              </SelectItem>
              <SelectItem value="damodaran">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Damodaran</span>
                </div>
              </SelectItem>
              <SelectItem value="alpha_vantage">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Alpha Vantage</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Fetch Button */}
          {selectedSource !== 'manual' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleFetchVolatility}
                  disabled={isLoading}
                  className="px-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {selectedSource === 'damodaran'
                  ? 'Fetch industry volatility'
                  : 'Calculate from stock prices'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Damodaran Configuration */}
        {selectedSource === 'damodaran' && (
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Market:</span>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOLATILITY_MARKETS.map((market) => (
                    <SelectItem key={market.value} value={market.value}>
                      {market.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <BarChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Industry:</span>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  {availableIndustries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Alpha Vantage Configuration */}
        {selectedSource === 'alpha_vantage' && (
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Comparable Tickers:</span>
                <Input
                  type="text"
                  value={comparableTickers}
                  onChange={(e) => setComparableTickers(e.target.value)}
                  placeholder="AAPL, MSFT, GOOGL"
                  className="h-8 flex-1"
                />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Measurement Period:</span>
                <Select
                  value={measurementPeriod.toString()}
                  onValueChange={(v) => setMeasurementPeriod(Number(v))}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Data Frequency:</span>
                <Select
                  value={dataFrequency}
                  onValueChange={(v) => setDataFrequency(v as 'daily' | 'weekly' | 'monthly')}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs italic text-muted-foreground">
                Using secure API key from server configuration
              </div>
            </div>
          </div>
        )}

        {/* Status and Results */}
        {lastFetchResult && selectedSource !== 'manual' && (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>
                Volatility: {lastFetchResult.value.toFixed(2)}% from {lastFetchResult.source}
              </span>
            </div>
            {lastFetchResult.metadata && (
              <div className="text-muted-foreground">
                {lastFetchResult.metadata.industry &&
                  `Industry: ${lastFetchResult.metadata.industry} | `}
                {lastFetchResult.metadata.market && `Market: ${lastFetchResult.metadata.market} | `}
                {lastFetchResult.metadata.dataPoints &&
                  `Data Points: ${lastFetchResult.metadata.dataPoints} | `}
                {lastFetchResult.metadata.tickers &&
                  `Tickers: ${lastFetchResult.metadata.tickers.join(', ')}`}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Information Notice */}
        {selectedSource === 'manual' && (
          <div className="text-xs text-muted-foreground">
            💡 Select <strong>Damodaran</strong> for industry-based volatility or{' '}
            <strong>Alpha Vantage</strong> for volatility from comparable companies
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
