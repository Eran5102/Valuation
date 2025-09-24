'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shield,
  AlertCircle,
  Save,
  TrendingUp,
  Users,
  Lightbulb,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import recharts to reduce initial bundle size
const RadarChart = dynamic(() => import('recharts').then((mod) => mod.RadarChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
})
const PolarGrid = dynamic(() => import('recharts').then((mod) => mod.PolarGrid), { ssr: false })
const PolarAngleAxis = dynamic(() => import('recharts').then((mod) => mod.PolarAngleAxis), {
  ssr: false,
})
const PolarRadiusAxis = dynamic(() => import('recharts').then((mod) => mod.PolarRadiusAxis), {
  ssr: false,
})
const Radar = dynamic(() => import('recharts').then((mod) => mod.Radar), { ssr: false })
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)

interface QualitativeFactor {
  id: string
  category: string
  factor: string
  description: string
  score: number // 1-10 scale
  weight: number // percentage weight
  comments: string
  impact: 'positive' | 'neutral' | 'negative'
}

interface RiskAssessment {
  id: string
  category: string
  risk: string
  likelihood: number // 1-5 scale
  impact: number // 1-5 scale
  mitigation: string
  status: 'identified' | 'mitigating' | 'accepted' | 'resolved'
}

interface QualitativeAssessmentClientProps {
  valuationId: string
}

const defaultQualitativeFactors: QualitativeFactor[] = [
  {
    id: 'qf_1',
    category: 'Management',
    factor: 'Management Team Experience',
    description: 'Experience and track record of the management team',
    score: 7,
    weight: 15,
    comments: '',
    impact: 'positive',
  },
  {
    id: 'qf_2',
    category: 'Management',
    factor: 'Corporate Governance',
    description: 'Board composition, independence, and governance practices',
    score: 6,
    weight: 10,
    comments: '',
    impact: 'neutral',
  },
  {
    id: 'qf_3',
    category: 'Market',
    factor: 'Market Size & Growth',
    description: 'Total addressable market and growth potential',
    score: 8,
    weight: 20,
    comments: '',
    impact: 'positive',
  },
  {
    id: 'qf_4',
    category: 'Market',
    factor: 'Competitive Position',
    description: 'Market share and competitive advantages',
    score: 6,
    weight: 15,
    comments: '',
    impact: 'neutral',
  },
  {
    id: 'qf_5',
    category: 'Product',
    factor: 'Product Differentiation',
    description: 'Uniqueness and value proposition of products/services',
    score: 7,
    weight: 10,
    comments: '',
    impact: 'positive',
  },
  {
    id: 'qf_6',
    category: 'Product',
    factor: 'Technology & Innovation',
    description: 'R&D capabilities and innovation pipeline',
    score: 8,
    weight: 10,
    comments: '',
    impact: 'positive',
  },
  {
    id: 'qf_7',
    category: 'Operations',
    factor: 'Operational Efficiency',
    description: 'Cost structure and operational scalability',
    score: 5,
    weight: 10,
    comments: '',
    impact: 'neutral',
  },
  {
    id: 'qf_8',
    category: 'Financial',
    factor: 'Customer Concentration',
    description: 'Revenue concentration and customer retention',
    score: 4,
    weight: 10,
    comments: '',
    impact: 'negative',
  },
]

const defaultRisks: RiskAssessment[] = [
  {
    id: 'risk_1',
    category: 'Market',
    risk: 'Increased Competition',
    likelihood: 4,
    impact: 3,
    mitigation: 'Strengthen product differentiation and customer relationships',
    status: 'identified',
  },
  {
    id: 'risk_2',
    category: 'Regulatory',
    risk: 'Regulatory Changes',
    likelihood: 2,
    impact: 4,
    mitigation: 'Monitor regulatory landscape and maintain compliance',
    status: 'mitigating',
  },
  {
    id: 'risk_3',
    category: 'Technology',
    risk: 'Technology Obsolescence',
    likelihood: 3,
    impact: 4,
    mitigation: 'Continuous R&D investment and technology monitoring',
    status: 'mitigating',
  },
  {
    id: 'risk_4',
    category: 'Financial',
    risk: 'Customer Concentration',
    likelihood: 3,
    impact: 3,
    mitigation: 'Diversify customer base and expand market reach',
    status: 'identified',
  },
]

export function QualitativeAssessmentClient({ valuationId }: QualitativeAssessmentClientProps) {
  const [qualitativeFactors, setQualitativeFactors] =
    useState<QualitativeFactor[]>(defaultQualitativeFactors)
  const [risks, setRisks] = useState<RiskAssessment[]>(defaultRisks)
  const [overallAssessment, setOverallAssessment] = useState({
    summary: '',
    strengthsWeaknesses: '',
    opportunities: '',
    threats: '',
    conclusion: '',
    adjustmentRecommendation: 0, // percentage adjustment to valuation
  })
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadQualitativeData()
  }, [valuationId])

  const loadQualitativeData = async () => {
    try {
      const response = await fetch(`/api/valuations/${valuationId}/qualitative`)
      if (response.ok) {
        const data = await response.json()
        setQualitativeFactors(data.qualitativeFactors || defaultQualitativeFactors)
        setRisks(data.risks || defaultRisks)
        setOverallAssessment(data.overallAssessment || overallAssessment)
      }
    } catch (error) {
      console.error('Error loading qualitative data:', error)
    }
  }

  const handleFactorUpdate = (id: string, updates: Partial<QualitativeFactor>) => {
    setQualitativeFactors((factors) => factors.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    setHasChanges(true)
  }

  const handleRiskUpdate = (id: string, updates: Partial<RiskAssessment>) => {
    setRisks((risks) => risks.map((r) => (r.id === id ? { ...r, ...updates } : r)))
    setHasChanges(true)
  }

  const calculateWeightedScore = () => {
    const totalWeight = qualitativeFactors.reduce((sum, f) => sum + f.weight, 0)
    const weightedSum = qualitativeFactors.reduce((sum, f) => sum + f.score * f.weight, 0)
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '0'
  }

  const calculateRiskScore = (risk: RiskAssessment) => {
    return risk.likelihood * risk.impact
  }

  const getRiskLevel = (score: number) => {
    if (score >= 16) return { level: 'Critical', color: 'text-red-600' }
    if (score >= 12) return { level: 'High', color: 'text-orange-600' }
    if (score >= 8) return { level: 'Medium', color: 'text-yellow-600' }
    return { level: 'Low', color: 'text-green-600' }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/valuations/${valuationId}/qualitative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qualitativeFactors,
          risks,
          overallAssessment,
        }),
      })

      if (response.ok) {
        toast.success('Qualitative assessment saved successfully')
        setHasChanges(false)
      } else {
        toast.error('Failed to save qualitative assessment')
      }
    } catch (error) {
      toast.error('Error saving qualitative assessment')
    } finally {
      setIsSaving(false)
    }
  }

  // Prepare radar chart data
  const radarData = Object.entries(
    qualitativeFactors.reduce(
      (acc, factor) => {
        if (!acc[factor.category]) {
          acc[factor.category] = { total: 0, count: 0 }
        }
        acc[factor.category].total += factor.score
        acc[factor.category].count += 1
        return acc
      },
      {} as Record<string, { total: number; count: number }>
    )
  ).map(([category, data]) => ({
    category,
    score: data.total / data.count,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6" />
            Qualitative Assessment
          </h1>
          <p className="mt-1 text-muted-foreground">
            Evaluate qualitative factors and risks affecting valuation
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateWeightedScore()}/10</div>
            <div className="text-xs text-muted-foreground">Weighted average</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Positive Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {qualitativeFactors.filter((f) => f.impact === 'positive').length}
            </div>
            <div className="text-xs text-muted-foreground">Strength areas</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risk Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {risks.filter((r) => calculateRiskScore(r) >= 12).length}
            </div>
            <div className="text-xs text-muted-foreground">High/Critical</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${overallAssessment.adjustmentRecommendation >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {overallAssessment.adjustmentRecommendation >= 0 ? '+' : ''}
              {overallAssessment.adjustmentRecommendation}%
            </div>
            <div className="text-xs text-muted-foreground">Valuation impact</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="factors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="factors">Qualitative Factors</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="factors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Qualitative Scoring Factors</CardTitle>
              <CardDescription>
                Rate each factor on a scale of 1-10 and assign relative weights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {['Management', 'Market', 'Product', 'Operations', 'Financial'].map((category) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  {qualitativeFactors
                    .filter((f) => f.category === category)
                    .map((factor) => (
                      <div key={factor.id} className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{factor.factor}</h4>
                              {getImpactIcon(factor.impact)}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {factor.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Score (1-10)</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[factor.score]}
                                onValueChange={(value) =>
                                  handleFactorUpdate(factor.id, { score: value[0] })
                                }
                                min={1}
                                max={10}
                                step={1}
                                className="flex-1"
                              />
                              <span className="w-12 text-center font-semibold">{factor.score}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Weight (%)</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[factor.weight]}
                                onValueChange={(value) =>
                                  handleFactorUpdate(factor.id, { weight: value[0] })
                                }
                                min={0}
                                max={30}
                                step={5}
                                className="flex-1"
                              />
                              <span className="w-12 text-center">{factor.weight}%</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Impact</Label>
                            <Select
                              value={factor.impact}
                              onValueChange={(value) =>
                                handleFactorUpdate(factor.id, {
                                  impact: value as QualitativeFactor['impact'],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Comments</Label>
                          <Textarea
                            value={factor.comments}
                            onChange={(e) =>
                              handleFactorUpdate(factor.id, { comments: e.target.value })
                            }
                            placeholder="Additional notes or justification..."
                            className="min-h-[60px]"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ))}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Weighted Score:</strong> {calculateWeightedScore()}/10
                  <br />
                  <strong>Total Weight:</strong>{' '}
                  {qualitativeFactors.reduce((sum, f) => sum + f.weight, 0)}%
                  {qualitativeFactors.reduce((sum, f) => sum + f.weight, 0) !== 100 && (
                    <span className="text-orange-600"> (Warning: Weights should sum to 100%)</span>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Risk Matrix</CardTitle>
                  <CardDescription>
                    Identify and assess key risks affecting the valuation
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    const newRisk: RiskAssessment = {
                      id: `risk_${Date.now()}`,
                      category: 'Operational',
                      risk: 'New Risk',
                      likelihood: 3,
                      impact: 3,
                      mitigation: '',
                      status: 'identified',
                    }
                    setRisks([...risks, newRisk])
                  }}
                >
                  Add Risk
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {risks.map((risk) => {
                const riskScore = calculateRiskScore(risk)
                const riskLevel = getRiskLevel(riskScore)

                return (
                  <div key={risk.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{risk.category}</Badge>
                          <Badge className={riskLevel.color} variant="outline">
                            {riskLevel.level} Risk (Score: {riskScore})
                          </Badge>
                        </div>
                        <h4 className="mt-2 font-medium">{risk.risk}</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setRisks(risks.filter((r) => r.id !== risk.id))}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Likelihood (1-5)</Label>
                        <Slider
                          value={[risk.likelihood]}
                          onValueChange={(value) =>
                            handleRiskUpdate(risk.id, { likelihood: value[0] })
                          }
                          min={1}
                          max={5}
                          step={1}
                        />
                        <div className="text-center text-sm">{risk.likelihood}</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Impact (1-5)</Label>
                        <Slider
                          value={[risk.impact]}
                          onValueChange={(value) => handleRiskUpdate(risk.id, { impact: value[0] })}
                          min={1}
                          max={5}
                          step={1}
                        />
                        <div className="text-center text-sm">{risk.impact}</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={risk.category}
                          onValueChange={(value) => handleRiskUpdate(risk.id, { category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Market">Market</SelectItem>
                            <SelectItem value="Operational">Operational</SelectItem>
                            <SelectItem value="Financial">Financial</SelectItem>
                            <SelectItem value="Regulatory">Regulatory</SelectItem>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Strategic">Strategic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={risk.status}
                          onValueChange={(value) =>
                            handleRiskUpdate(risk.id, { status: value as RiskAssessment['status'] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="identified">Identified</SelectItem>
                            <SelectItem value="mitigating">Mitigating</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mitigation Strategy</Label>
                      <Textarea
                        value={risk.mitigation}
                        onChange={(e) => handleRiskUpdate(risk.id, { mitigation: e.target.value })}
                        placeholder="Describe mitigation approach..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                )
              })}

              {/* Risk Matrix Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Heat Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    <div></div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="text-center font-semibold">
                        Impact {i}
                      </div>
                    ))}
                    {[5, 4, 3, 2, 1].map((likelihood) => (
                      <React.Fragment key={likelihood}>
                        <div className="text-center font-semibold">Likelihood {likelihood}</div>
                        {[1, 2, 3, 4, 5].map((impact) => {
                          const score = likelihood * impact
                          const level = getRiskLevel(score)
                          const risksInCell = risks.filter(
                            (r) => r.likelihood === likelihood && r.impact === impact
                          )

                          return (
                            <div
                              key={`${likelihood}-${impact}`}
                              className={`flex h-16 items-center justify-center rounded border ${
                                score >= 16
                                  ? 'bg-red-100'
                                  : score >= 12
                                    ? 'bg-orange-100'
                                    : score >= 8
                                      ? 'bg-yellow-100'
                                      : 'bg-green-100'
                              } `}
                            >
                              {risksInCell.length > 0 && (
                                <span className="font-semibold">{risksInCell.length}</span>
                              )}
                            </div>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="swot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SWOT Analysis</CardTitle>
              <CardDescription>
                Comprehensive assessment of strengths, weaknesses, opportunities, and threats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Strengths
                  </Label>
                  <Textarea
                    value={overallAssessment.strengthsWeaknesses.split('|')[0] || ''}
                    onChange={(e) =>
                      setOverallAssessment({
                        ...overallAssessment,
                        strengthsWeaknesses:
                          e.target.value +
                          '|' +
                          (overallAssessment.strengthsWeaknesses.split('|')[1] || ''),
                      })
                    }
                    placeholder="List key strengths..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Weaknesses
                  </Label>
                  <Textarea
                    value={overallAssessment.strengthsWeaknesses.split('|')[1] || ''}
                    onChange={(e) =>
                      setOverallAssessment({
                        ...overallAssessment,
                        strengthsWeaknesses:
                          (overallAssessment.strengthsWeaknesses.split('|')[0] || '') +
                          '|' +
                          e.target.value,
                      })
                    }
                    placeholder="List key weaknesses..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    Opportunities
                  </Label>
                  <Textarea
                    value={overallAssessment.opportunities}
                    onChange={(e) =>
                      setOverallAssessment({
                        ...overallAssessment,
                        opportunities: e.target.value,
                      })
                    }
                    placeholder="Identify market opportunities..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Threats
                  </Label>
                  <Textarea
                    value={overallAssessment.threats}
                    onChange={(e) =>
                      setOverallAssessment({
                        ...overallAssessment,
                        threats: e.target.value,
                      })
                    }
                    placeholder="Identify external threats..."
                    className="min-h-[150px]"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Executive Summary</Label>
                  <Textarea
                    value={overallAssessment.summary}
                    onChange={(e) =>
                      setOverallAssessment({
                        ...overallAssessment,
                        summary: e.target.value,
                      })
                    }
                    placeholder="Provide an executive summary of the qualitative assessment..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valuation Conclusion & Recommendation</Label>
                  <Textarea
                    value={overallAssessment.conclusion}
                    onChange={(e) =>
                      setOverallAssessment({
                        ...overallAssessment,
                        conclusion: e.target.value,
                      })
                    }
                    placeholder="Final conclusion and impact on valuation..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recommended Valuation Adjustment</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[overallAssessment.adjustmentRecommendation]}
                      onValueChange={(value) =>
                        setOverallAssessment({
                          ...overallAssessment,
                          adjustmentRecommendation: value[0],
                        })
                      }
                      min={-20}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <div
                      className={`w-20 text-center font-semibold ${
                        overallAssessment.adjustmentRecommendation >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {overallAssessment.adjustmentRecommendation >= 0 ? '+' : ''}
                      {overallAssessment.adjustmentRecommendation}%
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Positive adjustment increases valuation, negative adjustment decreases it
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Factor Analysis by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Critical', 'High', 'Medium', 'Low'].map((level) => {
                    const count = risks.filter((r) => {
                      const score = calculateRiskScore(r)
                      return getRiskLevel(score).level === level
                    }).length

                    const color =
                      level === 'Critical'
                        ? 'bg-red-500'
                        : level === 'High'
                          ? 'bg-orange-500'
                          : level === 'Medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'

                    return (
                      <div key={level} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium">{level}</div>
                        <div className="h-6 flex-1 rounded-full bg-gray-200">
                          <div
                            className={`${color} flex h-6 items-center justify-end rounded-full pr-2`}
                            style={{ width: `${(count / risks.length) * 100}%` }}
                          >
                            <span className="text-xs font-semibold text-white">{count}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Risks:</span>
                      <span className="ml-2 font-semibold">{risks.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Risk Score:</span>
                      <span className="ml-2 font-semibold">
                        {(
                          risks.reduce((sum, r) => sum + calculateRiskScore(r), 0) / risks.length
                        ).toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mitigating:</span>
                      <span className="ml-2 font-semibold">
                        {risks.filter((r) => r.status === 'mitigating').length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resolved:</span>
                      <span className="ml-2 font-semibold">
                        {risks.filter((r) => r.status === 'resolved').length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Impact Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <Award className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {qualitativeFactors.filter((f) => f.impact === 'positive').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Positive Factors</div>
                </div>

                <div className="rounded-lg bg-yellow-50 p-4 text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {qualitativeFactors.filter((f) => f.impact === 'neutral').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Neutral Factors</div>
                </div>

                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">
                    {qualitativeFactors.filter((f) => f.impact === 'negative').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Negative Factors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
