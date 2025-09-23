import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SquareSplitHorizontal, Info, Calculator, Link, PlusCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { blackScholesCall, calculateImpliedVolatility } from '@/lib/blackScholes'
import {
  calculateBacksolveSimplified,
  calculateBreakpointAnalysis,
  BreakpointDetail,
} from '@/lib/opmBacksolveCalculator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { BreakpointAnalysisTable } from '@/components/workspace/methodologies/BreakpointAnalysisTable'
import { BreakpointsTable, Breakpoint } from '@/components/workspace/methodologies/BreakpointsTable'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

// Define types for our security classes
interface SecurityClass {
  id: string
  name: string
  type: 'common' | 'preferred'
  liquidationPreference: number
  sharePrice: number
  shareCount: number
  conversionRatio: number
  seniority: number
}

interface OpmInputs {
  totalEquityValue: number
  riskFreeRate: number
  volatility: number
  timeToExit: number
}

export default function OpmBacksolve() {
  // Mock state for whether cap table is configured
  const [capTableConfigured, setCapTableConfigured] = useState(false)
  const navigate = useNavigate()

  // Mock capital table data - in a real app, this would come from the cap table
  const [securityClasses, setSecurityClasses] = useState<SecurityClass[]>([
    {
      id: '1',
      name: 'Common Stock',
      type: 'common',
      liquidationPreference: 0,
      sharePrice: 0,
      shareCount: 10000000,
      conversionRatio: 1,
      seniority: 2,
    },
    {
      id: '2',
      name: 'Series A Preferred',
      type: 'preferred',
      liquidationPreference: 1,
      sharePrice: 5,
      shareCount: 2000000,
      conversionRatio: 1,
      seniority: 1,
    },
  ])

  const [opmInputs, setOpmInputs] = useState<OpmInputs>({
    totalEquityValue: 20000000,
    riskFreeRate: 0.025,
    volatility: 0.45,
    timeToExit: 3,
  })

  const [backsolveResults, setBacksolveResults] = useState<{
    equityValue: number
    commonValue: number
    preferredValue: number
    commonPrice: number
    preferredPrice: number
    discount: number
    detailedResults: Array<{
      name: string
      fmvPerShare: number
      totalValue: number
    }>
  } | null>(null)

  const [breakpointAnalysis, setBreakpointAnalysis] = useState<BreakpointDetail[]>([])
  const [activeTab, setActiveTab] = useState('calculator')

  // Sample breakpoints data for the new table format
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([])

  // Form schema for validation
  const formSchema = z.object({
    totalEquityValue: z.number().positive('Value must be positive'),
    volatility: z.number().min(0.01).max(2, 'Volatility should be between 1% and 200%'),
    riskFreeRate: z.number().min(-0.05).max(0.25, 'Rate should be between -5% and 25%'),
    timeToExit: z.number().positive('Time must be positive'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalEquityValue: opmInputs.totalEquityValue,
      volatility: opmInputs.volatility,
      riskFreeRate: opmInputs.riskFreeRate,
      timeToExit: opmInputs.timeToExit,
    },
  })

  // Simulate fetching cap table data
  useEffect(() => {
    const mockFetchCapTable = async () => {
      // This would be replaced by an actual API call to get cap table data
      const hasCapTable = Math.random() > 0.5 // Randomly determine if cap table exists
      setCapTableConfigured(hasCapTable)

      if (hasCapTable) {
        // If we have cap table data, create sample breakpoints
        generateSampleBreakpoints(opmInputs.totalEquityValue)
      }
    }

    mockFetchCapTable()
  }, [])

  // Generate sample breakpoints based on the screenshot
  const generateSampleBreakpoints = (exitValue: number) => {
    const sampleBreakpoints: Breakpoint[] = [
      {
        id: 1,
        name: '1st Liquidation Preference',
        type: 'Liquidation Preference',
        from: 0,
        to: 2000000,
        participatingSecurities: [{ name: 'Series A', percentage: 100 }],
        shares: 200000,
        color: '#f97316', // orange-500
      },
      {
        id: 2,
        name: '2nd Liquidation Preference',
        type: 'Liquidation Preference',
        from: 2000000,
        to: 6500000,
        participatingSecurities: [{ name: 'Series B', percentage: 100 }],
        shares: 150000,
        color: '#f97316', // orange-500
      },
      {
        id: 3,
        name: 'Pro Rata Distribution',
        type: 'Pro Rata Distribution',
        from: 6500000,
        to: 7687500,
        participatingSecurities: [
          { name: 'Founders', percentage: 63.16 },
          { name: 'Series A', percentage: 21.05 },
          { name: 'Series B', percentage: 15.79 },
        ],
        shares: 950000,
        color: '#22c55e', // green-500
      },
      {
        id: 4,
        name: 'Options @ $1.25 Exercise',
        type: 'Option Exercise',
        from: 7687500,
        to: 7808500,
        participatingSecurities: [
          { name: 'Founders', percentage: 54.55 },
          { name: 'Series A', percentage: 18.18 },
          { name: 'Series B', percentage: 13.64 },
          { name: 'Options @ $1.25', percentage: 13.64 },
        ],
        shares: 1100000,
        color: '#3b82f6', // blue-500
      },
      {
        id: 5,
        name: 'Options @ $1.36 Exercise',
        type: 'Option Exercise',
        from: 7808500,
        to: 34836500,
        participatingSecurities: [
          { name: 'Founders', percentage: 41.18 },
          { name: 'Series A', percentage: 17.79 },
          { name: 'Series B', percentage: 10.38 },
          { name: 'Options @ $1.25', percentage: 10.34 },
          { name: 'Options @ $1.36', percentage: 24.14 },
        ],
        shares: 1450000,
        color: '#3b82f6', // blue-500
      },
      {
        id: 6,
        name: 'Series B Reaches Cap',
        type: 'Cap Reached',
        from: 34836500,
        to: 72500000,
        participatingSecurities: [
          { name: 'Founders', percentage: 46.15 },
          { name: 'Series A', percentage: 15.38 },
          { name: 'Options @ $1.25', percentage: 11.54 },
          { name: 'Options @ $1.36', percentage: 26.92 },
        ],
        shares: 1300000,
        color: '#a855f7', // purple-500
      },
      {
        id: 7,
        name: 'Series B Conversion',
        type: 'Conversion',
        from: 72500000,
        to: 9007199254740991, // Effectively infinity
        participatingSecurities: [
          { name: 'Founders', percentage: 41.18 },
          { name: 'Series A', percentage: 17.79 },
          { name: 'Options @ $1.25', percentage: 10.34 },
          { name: 'Options @ $1.36', percentage: 24.14 },
          { name: 'Series B (as converted)', percentage: 10.34 },
        ],
        shares: 1450000,
        color: '#ec4899', // pink-500
      },
    ]

    setBreakpoints(sampleBreakpoints)
  }

  // Calculate option values and backsolve for implied equity value
  const calculateBacksolve = () => {
    // Basic implementation of OPM Backsolve
    const { totalEquityValue, riskFreeRate, volatility, timeToExit } = opmInputs

    // Get the common and preferred securities
    const commonSecurity = securityClasses.find((s) => s.type === 'common')
    const preferredSecurities = securityClasses.filter((s) => s.type === 'preferred')

    if (!commonSecurity || preferredSecurities.length === 0) {
      toast.error('Need at least one common and one preferred security class')
      return
    }

    try {
      // Use our OPM Backsolve calculator
      const detailedResults = calculateBacksolveSimplified(
        totalEquityValue,
        securityClasses,
        timeToExit,
        riskFreeRate,
        volatility
      )

      // Extract common and preferred values from results
      const commonResult = detailedResults.find((r) => r.name === commonSecurity.name)
      const preferredResults = detailedResults.filter((r) =>
        preferredSecurities.some((ps) => ps.name === r.name)
      )

      if (!commonResult || preferredResults.length === 0) {
        toast.error('Error in backsolve calculation')
        return
      }

      // Calculate totals
      const commonValue = commonResult.totalValue
      const preferredValue = preferredResults.reduce((sum, r) => sum + r.totalValue, 0)

      // Per-share values
      const commonPricePerShare = commonResult.fmvPerShare
      const preferredPricePerShare = preferredSecurities[0].sharePrice

      // Calculate discount of common to preferred
      const discount =
        preferredPricePerShare > 0 ? (1 - commonPricePerShare / preferredPricePerShare) * 100 : 0

      // Set results
      setBacksolveResults({
        equityValue: totalEquityValue,
        commonValue,
        preferredValue,
        commonPrice: commonPricePerShare,
        preferredPrice: preferredPricePerShare,
        discount,
        detailedResults,
      })

      // Calculate breakpoint analysis
      const { breakpoints, shareClasses } = prepareOpmDataFromSecurityClasses(securityClasses)
      const analysis = calculateBreakpointAnalysis(
        totalEquityValue,
        shareClasses,
        breakpoints,
        timeToExit,
        riskFreeRate,
        volatility
      )
      setBreakpointAnalysis(analysis)

      // Generate sample breakpoints based on the screenshot
      generateSampleBreakpoints(totalEquityValue)

      toast.success('OPM Backsolve calculation completed!')
    } catch (error) {
      console.error('OPM Backsolve calculation error:', error)
      toast.error('Error in calculation. Check console for details.')
    }
  }

  // Helper function to prepare data for breakpoint analysis
  function prepareOpmDataFromSecurityClasses(securities: SecurityClass[]) {
    const result = {
      breakpoints: [] as number[],
      shareClasses: [] as {
        name: string
        totalShares: number
        participation: { from: number; to: number; sharesParticipating: number }[]
      }[],
    }

    // Sort securities by seniority
    const sortedSecurities = [...securities].sort((a, b) => a.seniority - b.seniority)

    // Calculate breakpoints
    let cumulativePreference = 0
    const breakpoints: number[] = []

    sortedSecurities
      .filter((sec) => sec.type === 'preferred')
      .forEach((sec) => {
        const preference = sec.shareCount * sec.sharePrice * sec.liquidationPreference
        if (preference > 0) {
          cumulativePreference += preference
          breakpoints.push(cumulativePreference)
        }
      })

    result.breakpoints = breakpoints

    // Create share classes with participation rules
    const shareClasses: {
      name: string
      totalShares: number
      participation: { from: number; to: number; sharesParticipating: number }[]
    }[] = []

    // Add preferred shares
    sortedSecurities
      .filter((sec) => sec.type === 'preferred')
      .forEach((sec) => {
        const preference = sec.shareCount * sec.sharePrice * sec.liquidationPreference
        const participation: { from: number; to: number; sharesParticipating: number }[] = []

        // Preferred shares participate in their preference amount
        if (preference > 0) {
          const preferenceIndex = breakpoints.indexOf(preference)

          if (preferenceIndex >= 0) {
            participation.push({
              from: preferenceIndex > 0 ? breakpoints[preferenceIndex - 1] : 0,
              to: breakpoints[preferenceIndex],
              sharesParticipating: sec.shareCount,
            })
          }
        }

        // After all preferences are paid, all shares participate
        participation.push({
          from: breakpoints[breakpoints.length - 1] || 0,
          to: Infinity,
          sharesParticipating: sec.shareCount,
        })

        shareClasses.push({
          name: sec.name,
          totalShares: sec.shareCount,
          participation,
        })
      })

    // Add common shares
    sortedSecurities
      .filter((sec) => sec.type === 'common')
      .forEach((sec) => {
        shareClasses.push({
          name: sec.name,
          totalShares: sec.shareCount,
          participation: [
            {
              from: breakpoints[breakpoints.length - 1] || 0,
              to: Infinity,
              sharesParticipating: sec.shareCount,
            },
          ],
        })
      })

    result.shareClasses = shareClasses
    return result
  }

  // Navigate to the cap table page
  const goToCapTable = () => {
    navigate('/workspace/1/cap-table')
  }

  return (
    <WorkspaceHeaderLayout
      title="OPM Backsolve Method"
      icon={<SquareSplitHorizontal className="h-5 w-5" />}
      description="Option Pricing Model Backsolve for Complex Capital Allocations"
      fullWidth={true}
    >
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Tabs
          defaultValue="calculator"
          className="space-y-4"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="breakpoints">Breakpoint Analysis</TabsTrigger>
            <TabsTrigger value="explanation">Methodology</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>OPM Backsolve Calculator</CardTitle>
                <CardDescription>
                  Calculate implied equity value and security prices using the Option Pricing Model
                  backsolve method
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!capTableConfigured && (
                  <Alert className="mb-6">
                    <AlertTitle>Cap Table Not Configured</AlertTitle>
                    <AlertDescription>
                      To use the OPM Backsolve method, you need to set up your cap table first to
                      define security classes.
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={goToCapTable}
                          className="flex items-center gap-2"
                        >
                          <Link className="h-4 w-4" />
                          Go to Cap Table
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
                  {/* OPM Parameters */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">OPM Parameters</h3>

                    <Form {...form}>
                      <form className="space-y-4">
                        <FormField
                          control={form.control}
                          name="totalEquityValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Equity Value Estimate ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0
                                    field.onChange(value)
                                    setOpmInputs((prev) => ({ ...prev, totalEquityValue: value }))
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Estimated total equity value of the company
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="volatility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Volatility
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" className="ml-1 h-4 w-4 p-0">
                                      <Info className="h-3 w-3" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <p className="text-sm">
                                      Annualized volatility of equity value, typically between 30%
                                      and 80% for private companies. Higher for early-stage
                                      companies.
                                    </p>
                                  </PopoverContent>
                                </Popover>
                              </FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0
                                      field.onChange(value)
                                      setOpmInputs((prev) => ({ ...prev, volatility: value }))
                                    }}
                                  />
                                  <span>(or {(field.value * 100).toFixed(0)}%)</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="riskFreeRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Risk-Free Rate</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0
                                      field.onChange(value)
                                      setOpmInputs((prev) => ({ ...prev, riskFreeRate: value }))
                                    }}
                                    step={0.001}
                                  />
                                  <span>(or {(field.value * 100).toFixed(2)}%)</span>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Risk-free interest rate, typically the yield on U.S. Treasury bonds
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="timeToExit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time to Exit (Years)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0
                                    field.onChange(value)
                                    setOpmInputs((prev) => ({ ...prev, timeToExit: value }))
                                  }}
                                  step={0.1}
                                />
                              </FormControl>
                              <FormDescription>Expected time until liquidity event</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          className="w-full"
                          onClick={(e) => {
                            e.preventDefault()
                            if (form.formState.isValid) {
                              calculateBacksolve()
                            } else {
                              form.trigger()
                              toast.error('Please fix the form errors before calculating')
                            }
                          }}
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          Calculate OPM Backsolve
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>

                {/* Results Section */}
                {backsolveResults && (
                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle>OPM Backsolve Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                            Equity Value
                          </h4>
                          <div className="text-2xl font-semibold">
                            ${backsolveResults.equityValue.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                            Common Stock Value
                          </h4>
                          <div className="text-2xl font-semibold">
                            ${backsolveResults.commonValue.toLocaleString()}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            ${backsolveResults.commonPrice.toFixed(2)} per share
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                            Preferred Stock Value
                          </h4>
                          <div className="text-2xl font-semibold">
                            ${backsolveResults.preferredValue.toLocaleString()}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            ${backsolveResults.preferredPrice.toFixed(2)} per share
                          </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-3">
                          <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                            Common-to-Preferred Discount
                          </h4>
                          <div className="text-2xl font-semibold">
                            {backsolveResults.discount.toFixed(1)}%
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Common shares are valued at a {backsolveResults.discount.toFixed(1)}%
                            discount to the price of preferred shares
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Breakpoints Table */}
            {capTableConfigured && breakpoints.length > 0 && (
              <BreakpointsTable
                breakpoints={breakpoints}
                currentExitValue={opmInputs.totalEquityValue}
                onRefresh={() => calculateBacksolve()}
              />
            )}
          </TabsContent>

          <TabsContent value="breakpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Breakpoint Analysis</CardTitle>
                <CardDescription>
                  Detailed analysis of participation across breakpoints using Black-Scholes
                  calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {breakpointAnalysis.length > 0 ? (
                  <BreakpointAnalysisTable
                    breakpointDetails={breakpointAnalysis}
                    securityClasses={securityClasses.map((sc) => sc.name)}
                  />
                ) : (
                  <div className="rounded-md border p-8 text-center">
                    <p className="mb-4 text-muted-foreground">
                      No breakpoint analysis results available.
                    </p>
                    <Button
                      onClick={() => {
                        calculateBacksolve()
                        setActiveTab('breakpoints')
                      }}
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      Run Calculation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About the OPM Backsolve Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Overview</h3>
                  <p>
                    The OPM (Option Pricing Model) Backsolve Method is a specialized valuation
                    approach used primarily for early-stage companies with complex capital
                    structures. It leverages option pricing theory to allocate value across
                    different security classes.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">How the OPM Backsolve Works</h3>
                  <p className="mb-3">
                    The OPM Backsolve method treats different security classes as call options on
                    the company's value with different strike prices. The process involves:
                  </p>
                  <ol className="list-decimal space-y-2 pl-6">
                    <li>
                      Starting with the price paid for a recent financing round (typically preferred
                      shares)
                    </li>
                    <li>
                      Identifying the liquidation preference and features of each security class
                    </li>
                    <li>
                      Using Black-Scholes option pricing formula to "backsolve" for the total equity
                      value
                    </li>
                    <li>Calculating the values of common shares and other security classes</li>
                  </ol>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Key Parameters</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      <span className="font-medium">Volatility</span> - Measure of expected
                      fluctuation in company value
                    </li>
                    <li>
                      <span className="font-medium">Time to Exit</span> - Expected time until
                      liquidity event
                    </li>
                    <li>
                      <span className="font-medium">Risk-Free Rate</span> - Typically based on U.S.
                      Treasury bonds
                    </li>
                    <li>
                      <span className="font-medium">Liquidation Preferences</span> - Amount
                      preferred shareholders receive before common
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Black-Scholes Formula in OPM</h3>
                  <p>
                    The Black-Scholes option pricing formula is central to the OPM approach. In this
                    context:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>
                      Common stock is modeled as a call option on firm value with strike price equal
                      to the liquidation preferences
                    </li>
                    <li>
                      Preferred stock value is determined by subtracting the common stock value from
                      total equity value
                    </li>
                    <li>
                      More complex securities (like participating preferred) require additional
                      modeling steps
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">How it Works</h3>
                  <p>
                    The method "backsolves" for the implied total equity value based on the price
                    investors paid for preferred shares in a recent financing round. It considers:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Liquidation preferences</li>
                    <li>Conversion features</li>
                    <li>Participation rights</li>
                    <li>Dividend rights</li>
                    <li>Exit timing assumptions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">When to Use</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>For companies with recent financing rounds</li>
                    <li>
                      When dealing with complex capital structures with multiple classes of shares
                    </li>
                    <li>
                      When traditional valuation methods are difficult to apply due to limited
                      operating history
                    </li>
                    <li>For 409A valuations and financial reporting purposes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Limitations</h3>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>Requires specialized knowledge of option pricing models</li>
                    <li>Highly sensitive to volatility and time-to-exit assumptions</li>
                    <li>
                      May not fully reflect operational value if recent investment terms were highly
                      structured
                    </li>
                    <li>Complex to communicate to non-technical stakeholders</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Use Cases & Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">
                      Example 1: Series B Startup Valuation
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      A startup raises a Series B round at $5 per share for preferred stock with 1x
                      liquidation preference. Using the OPM Backsolve, we can determine the implied
                      value of common stock by considering:
                    </p>
                    <ul className="list-disc space-y-1 pl-6 text-sm">
                      <li>Series A: $2M invested at $2/share (1x preference)</li>
                      <li>Series B: $10M invested at $5/share (1x preference)</li>
                      <li>Estimated time to exit: 4 years</li>
                      <li>Volatility: 60% (based on comparable companies)</li>
                      <li>Risk-free rate: 2.5%</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      OPM Backsolve Result: Common share value of $1.80, implying a 64% discount to
                      the latest preferred price.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-2 text-lg font-medium">
                      Example 2: 409A Valuation Application
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      For 409A tax compliance, a private company needs to establish the fair market
                      value of common shares for option grants. The OPM Backsolve can help determine
                      this value while accounting for the differences between preferred and common
                      stock rights.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-2 text-lg font-medium">
                      Example 3: Implementing the OPM Backsolve
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      This example shows how the OPM Backsolve method might be implemented for a
                      startup that just raised a Series B round:
                    </p>

                    <div className="rounded-md bg-muted p-4">
                      <h4 className="font-medium">Input Parameters:</h4>
                      <ul className="mt-1 list-disc space-y-1 pl-6 text-sm">
                        <li>Series B Price: $4.50 per share</li>
                        <li>Series B Liquidation Preference: 1x (non-participating)</li>
                        <li>Series A Liquidation Preference: 1x (non-participating)</li>
                        <li>Volatility: 45%</li>
                        <li>Time to Exit: 3 years</li>
                        <li>Risk-Free Rate: 2.5%</li>
                      </ul>

                      <h4 className="mt-3 font-medium">Calculation Steps:</h4>
                      <ol className="mt-1 list-decimal space-y-1 pl-6 text-sm">
                        <li>Calculate total liquidation preferences</li>
                        <li>Model common stock as call option on firm value</li>
                        <li>
                          Solve for the implied equity value that makes the Series B price correct
                        </li>
                        <li>Calculate common stock price based on the option value</li>
                      </ol>

                      <h4 className="mt-3 font-medium">Results:</h4>
                      <ul className="mt-1 list-disc space-y-1 pl-6 text-sm">
                        <li>Implied Equity Value: $45,000,000</li>
                        <li>Common Stock Value: $1.62 per share</li>
                        <li>Common-to-Preferred Discount: 64%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceHeaderLayout>
  )
}
