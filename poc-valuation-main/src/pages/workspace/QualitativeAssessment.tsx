import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatPercent } from '@/utils/formatters'
import { PageHeader } from '@/components/layout/PageHeader'
import { useValuationData } from '@/contexts/ValuationDataContext'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import {
  Target,
  BarChart4,
  AlertCircle,
  Lightbulb,
  Info,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

// Define the structure for qualitative factors
interface Factor {
  id: string
  title: string
  description: string
  icon: string
  score: number
  weight: number
  justification: string
  minLabel: string
  maxLabel: string
  riskDirection: 'direct' | 'inverse' // direct = higher score means higher risk, inverse = higher score means lower risk
}

export default function QualitativeAssessment() {
  // Initial factors with their default values and risk directions
  const [factors, setFactors] = useState<Factor[]>([
    {
      id: 'scale',
      title: 'Scale & Market Share',
      description: 'Size relative to industry and competitors; market penetration depth',
      icon: 'Target',
      score: 5,
      weight: 15,
      justification: '',
      minLabel: 'Small Scale',
      maxLabel: 'Market Leader',
      riskDirection: 'inverse', // Higher score = lower risk
    },
    {
      id: 'positioning',
      title: 'Market Positioning',
      description: 'Brand strength, recognition, and competitive positioning',
      icon: 'Target',
      score: 5,
      weight: 15,
      justification: '',
      minLabel: 'Weak',
      maxLabel: 'Strong',
      riskDirection: 'inverse', // Higher score = lower risk
    },
    {
      id: 'growth',
      title: 'Growth Prospects',
      description: 'Future growth potential based on market trends and company strategy',
      icon: 'Target',
      score: 5,
      weight: 15,
      justification: '',
      minLabel: 'Limited',
      maxLabel: 'Significant',
      riskDirection: 'inverse', // Higher score = lower risk
    },
    {
      id: 'business',
      title: 'Business Model',
      description: 'Revenue model sustainability and operational efficiency',
      icon: 'Target',
      score: 5,
      weight: 10,
      justification: '',
      minLabel: 'Vulnerable',
      maxLabel: 'Resilient',
      riskDirection: 'inverse', // Higher score = lower risk
    },
    {
      id: 'management',
      title: 'Management Quality',
      description: 'Experience, track record, and leadership capability',
      icon: 'Target',
      score: 5,
      weight: 15,
      justification: '',
      minLabel: 'Inexperienced',
      maxLabel: 'Seasoned',
      riskDirection: 'inverse', // Higher score = lower risk
    },
    {
      id: 'financials',
      title: 'Financial Health',
      description: 'Balance sheet strength, profitability trends, and cash flow stability',
      icon: 'BarChart4',
      score: 5,
      weight: 15,
      justification: '',
      minLabel: 'Weak',
      maxLabel: 'Strong',
      riskDirection: 'inverse', // Higher score = lower risk
    },
    {
      id: 'risks',
      title: 'Industry Risks',
      description: 'Regulatory, technological, or competitive disruption exposure',
      icon: 'AlertCircle',
      score: 5,
      weight: 10,
      justification: '',
      minLabel: 'High Risk',
      maxLabel: 'Low Risk',
      riskDirection: 'inverse', // Higher score = lower risk
    },
    {
      id: 'innovations',
      title: 'Innovation Capability',
      description: 'R&D investment, adaptation ability, and innovation track record',
      icon: 'Lightbulb',
      score: 5,
      weight: 5,
      justification: '',
      minLabel: 'Laggard',
      maxLabel: 'Pioneer',
      riskDirection: 'inverse', // Higher score = lower risk
    },
  ])

  // Get valuation context to update CoE premium
  const { setQualitativeRiskPremium } = useValuationData()

  // Sensitivity factors for calculations
  const [coeSensitivityFactor, setCoeSensitivityFactor] = useState<number>(0.5)
  const [multipleAdjustmentFactor, setMultipleAdjustmentFactor] = useState<number>(1.5)

  // Load saved factors and settings from localStorage
  useEffect(() => {
    try {
      const savedFactors = localStorage.getItem('qualitative_factors')
      if (savedFactors) {
        setFactors(JSON.parse(savedFactors))
      }

      const savedSettings = localStorage.getItem('qualitative_settings')
      if (savedSettings) {
        const { coeSensitivity, multipleAdjustment } = JSON.parse(savedSettings)
        setCoeSensitivityFactor(coeSensitivity || 0.5)
        setMultipleAdjustmentFactor(multipleAdjustment || 1.5)
      }
    } catch (error) {
      console.error('Error loading qualitative assessment data:', error)
    }
  }, [])

  // Save factors and settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('qualitative_factors', JSON.stringify(factors))
      localStorage.setItem(
        'qualitative_settings',
        JSON.stringify({
          coeSensitivity: coeSensitivityFactor,
          multipleAdjustment: multipleAdjustmentFactor,
        })
      )
    } catch (error) {
      console.error('Error saving qualitative assessment data:', error)
    }
  }, [factors, coeSensitivityFactor, multipleAdjustmentFactor])

  // Update factor score
  const handleScoreChange = (id: string, newScore: number[]) => {
    setFactors(
      factors.map((factor) => (factor.id === id ? { ...factor, score: newScore[0] } : factor))
    )
  }

  // Update factor weight
  const handleWeightChange = (id: string, newWeight: string) => {
    const weight = parseFloat(newWeight)
    if (!isNaN(weight) && weight >= 0 && weight <= 100) {
      setFactors(factors.map((factor) => (factor.id === id ? { ...factor, weight } : factor)))
    }
  }

  // Update factor justification
  const handleJustificationChange = (id: string, newJustification: string) => {
    setFactors(
      factors.map((factor) =>
        factor.id === id ? { ...factor, justification: newJustification } : factor
      )
    )
  }

  // Apply CoE premium to WACC module
  const handleApplyToWacc = () => {
    setQualitativeRiskPremium(calculatedOutputs.coePremium)

    // Also save to localStorage directly for persistence
    localStorage.setItem('qualitative_coe_premium', calculatedOutputs.coePremium.toString())

    // Show success toast
    toast.success('Qualitative risk premium applied to WACC successfully', {
      description: `Added ${formatPercent(calculatedOutputs.coePremium, 1)} to the cost of equity`,
    })

    // Dispatch event for other components that might be listening
    window.dispatchEvent(
      new CustomEvent('qualitativeRiskPremiumChanged', {
        detail: { value: calculatedOutputs.coePremium },
      })
    )
  }

  // Calculate outputs based on factor scores and weights, accounting for risk directions
  const calculatedOutputs = useMemo(() => {
    // Total weight should sum to 100%
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0)

    // Calculate weighted sum of adjusted scores (higher = higher risk)
    let weightedSumOfAdjustedScores = 0

    factors.forEach((factor) => {
      // Get raw score (0-10)
      const rawScore = factor.score

      // Adjust score based on risk direction
      let adjustedScore
      if (factor.riskDirection === 'inverse') {
        // For inverse factors, higher UI score = lower risk, so flip for calculation
        adjustedScore = 10 - rawScore
      } else {
        // For direct factors, higher UI score = higher risk
        adjustedScore = rawScore
      }

      // Add weighted contribution to total
      weightedSumOfAdjustedScores += adjustedScore * factor.weight
    })

    // Calculate weighted average adjusted score (0-10 scale)
    const weightedAverageAdjustedScore =
      totalWeight > 0 ? weightedSumOfAdjustedScores / totalWeight : 5

    // Normalize to a 0-10 scale for the risk factor
    const riskFactor = Math.max(0, Math.min(10, weightedAverageAdjustedScore))

    // Calculate CoE premium based on risk factor (if risk > 5)
    // UPDATED: Implement exact formula: Math.max(0, (RiskFactor - 5) * CoESensitivity) * 100
    const coePremium = Math.max(0, (riskFactor - 5) * (coeSensitivityFactor / 100))

    // Calculate multiple adjustment (can be positive or negative)
    // UPDATED: Implement exact formula: (5 - RiskFactor) * MultipleSensitivity * 100
    const multipleAdjustment = (5 - riskFactor) * (multipleAdjustmentFactor / 100)

    return {
      totalWeight,
      riskFactor,
      coePremium,
      multipleAdjustment,
    }
  }, [factors, coeSensitivityFactor, multipleAdjustmentFactor])

  return (
    <div className="h-full w-full overflow-auto">
      <div className="px-6 py-6">
        <PageHeader
          title="Qualitative Factor Assessment"
          icon={<Target className="h-6 w-6" />}
          description="Assess qualitative factors to generate risk-adjusted valuation inputs"
        />

        <p className="mb-6 text-muted-foreground">
          Evaluate subjective risk factors that impact company value beyond financial metrics. These
          assessments quantifiably adjust valuation parameters in other modules, including WACC and
          market multiples.
        </p>

        {/* Factors Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {factors.map((factor) => (
            <QualitativeFactor
              key={factor.id}
              factor={factor}
              onScoreChange={(newScore) => handleScoreChange(factor.id, newScore)}
              onWeightChange={(newWeight) => handleWeightChange(factor.id, newWeight)}
              onJustificationChange={(newJustification) =>
                handleJustificationChange(factor.id, newJustification)
              }
            />
          ))}
        </div>

        {/* Sensitivity Adjustment Inputs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl">Adjustment Sensitivity Settings</CardTitle>
            <CardDescription>
              Configure how qualitative risk scores translate into valuation adjustments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="flex-grow text-sm font-medium">
                    CoE Premium per Risk Point*:
                  </label>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Info size={14} />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="text-sm">
                        Enter the % to add to Cost of Equity for each point the calculated Risk
                        Factor is above 5.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={coeSensitivityFactor}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      if (!isNaN(value) && value >= 0) {
                        setCoeSensitivityFactor(value)
                      }
                    }}
                    step={0.1}
                    min={0}
                    className="w-20"
                  />
                  <span>%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="flex-grow text-sm font-medium">
                    Multiple Adj. % per Risk Point*:
                  </label>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Info size={14} />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="text-sm">
                        Enter the % discount (if Risk Factor &gt; 5) or premium (if Risk Factor &lt;
                        5) to suggest for market multiples for each point the Risk Factor deviates
                        from 5.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={multipleAdjustmentFactor}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      if (!isNaN(value) && value >= 0) {
                        setMultipleAdjustmentFactor(value)
                      }
                    }}
                    step={0.1}
                    min={0}
                    className="w-20"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              * Risk Factor scale 0-10, where 5 represents average qualitative risk relative to
              peers.
            </p>
          </CardContent>
        </Card>

        {/* Output Cards */}
        <div className="mt-6">
          <h2 className="mb-4 text-xl font-semibold">Qualitative Summary</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <QualitativeOutputCard
              title="Calculated Risk Factor*"
              value={calculatedOutputs.riskFactor.toFixed(1)}
              description="Scale 0-10, where 5 represents average qualitative risk relative to peers. Higher value indicates higher relative risk."
            />

            <QualitativeOutputCard
              title="Suggested Cost of Equity (CoE) Qualitative Premium"
              value={`${formatPercent(calculatedOutputs.coePremium, 1)}`}
              description="Suggestion: Apply this premium to the Cost of Equity build-up in the WACC module."
              action={
                <Button variant="outline" onClick={handleApplyToWacc}>
                  Apply to WACC
                </Button>
              }
            />

            <QualitativeOutputCard
              title="Suggested Adjustment to Market Multiples"
              value={`${calculatedOutputs.multipleAdjustment > 0 ? '+' : ''}${formatPercent(calculatedOutputs.multipleAdjustment, 1)}`}
              description="Suggestion: Consider this percentage adjustment when concluding on ranges from Market Approaches in Valuation Synthesis."
              action={
                <Button variant="outline" disabled>
                  Note for Synthesis (Coming Soon)
                </Button>
              }
              trend={calculatedOutputs.multipleAdjustment > 0 ? 'up' : 'down'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Component for individual qualitative factor card
function QualitativeFactor({
  factor,
  onScoreChange,
  onWeightChange,
  onJustificationChange,
}: {
  factor: Factor
  onScoreChange: (newScore: number[]) => void
  onWeightChange: (newWeight: string) => void
  onJustificationChange: (newJustification: string) => void
}) {
  // Render the appropriate icon based on the factor's icon name
  const renderIcon = () => {
    switch (factor.icon) {
      case 'Target':
        return <Target className="h-5 w-5 text-primary" />
      case 'BarChart4':
        return <BarChart4 className="h-5 w-5 text-primary" />
      case 'AlertCircle':
        return <AlertCircle className="h-5 w-5 text-primary" />
      case 'Lightbulb':
        return <Lightbulb className="h-5 w-5 text-primary" />
      default:
        return <Target className="h-5 w-5 text-primary" /> // Default icon
    }
  }

  // Helper function to add risk direction context
  const getRiskDirectionIndicator = () => {
    if (factor.riskDirection === 'direct') {
      return <span className="ml-1 text-xs text-muted-foreground">(Higher = Higher Risk)</span>
    } else {
      return <span className="ml-1 text-xs text-muted-foreground">(Higher = Lower Risk)</span>
    }
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center space-x-2">
          {renderIcon()}
          <CardTitle className="text-lg">{factor.title}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">{factor.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{factor.minLabel}</span>
            <span className="font-medium">
              {factor.score} / 10 {getRiskDirectionIndicator()}
            </span>
            <span>{factor.maxLabel}</span>
          </div>
          <Slider
            value={[factor.score]}
            min={0}
            max={10}
            step={1}
            onValueChange={onScoreChange}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Weight (%):</label>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={factor.weight}
              onChange={(e) => onWeightChange(e.target.value)}
              className="w-20"
              min={0}
              max={100}
            />
            <span>%</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Justification:</label>
          <Textarea
            placeholder="Enter your rationale for this rating..."
            value={factor.justification}
            onChange={(e) => onJustificationChange(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Component for qualitative output summary card
interface OutputCardProps {
  title: string
  value: string
  description: string
  action?: React.ReactNode
  trend?: 'up' | 'down'
}

function QualitativeOutputCard({ title, value, description, action, trend }: OutputCardProps) {
  return (
    <Card>
      <CardContent className="pb-4 pt-6">
        <h3 className="mb-1 text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="mb-2 flex items-center space-x-2">
          <p className="text-2xl font-bold">{value}</p>
          {trend && trend === 'up' && <ChevronUp className="text-green-500" />}
          {trend && trend === 'down' && <ChevronDown className="text-red-500" />}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      {action && <CardFooter className="pb-4 pt-0">{action}</CardFooter>}
    </Card>
  )
}
