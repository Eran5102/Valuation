import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMethodology } from '@/contexts/MethodologyContext'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Save,
  FileText,
  Tag,
  Activity,
  CreditCard,
  StickyNote,
  ChevronRight,
  Calendar,
  Building,
  User,
  CheckCircle,
  PieChart,
  ArrowRight,
  History,
} from 'lucide-react'
import { toast } from 'sonner'
import { ScenarioComparisonChart } from '@/components/workspace/ScenarioComparisonChart'
import { ProjectSummaryAuditTrail } from '@/components/workspace/ProjectSummaryAuditTrail'
import { PageHeader } from '@/components/layout/PageHeader'

const ProjectSummary = () => {
  const { methodologies } = useMethodology()
  const navigate = useNavigate()
  const [projectNotes, setProjectNotes] = useState('')
  const [unitMultiplier, setUnitMultiplier] = useState(1000000) // Default to millions
  const [scenariosData, setScenariosData] = useState([])
  const [currency, setCurrency] = useState('USD')

  const projectData = {
    id: '1', // Adding this to pass to the audit trail component
    name: 'Q4 2025 Valuation',
    company: 'Acme Corporation',
    client: 'John Smith',
    valuationDate: '2025-04-01',
    projectType: 'General Business Valuation',
    purpose: 'Annual Review',
    status: 'In Progress',
  }

  const quickLinks = [
    { name: 'Methodology Scope', path: 'methodology-scope', icon: CheckCircle },
    { name: 'Company Financials', path: 'company-data', icon: Building },
    { name: 'WACC Calculator', path: 'wacc', icon: Calculator },
    { name: 'Scenario Manager', path: 'scenarios', icon: PieChart },
    { name: 'Valuation Synthesis', path: 'valuation-summary', icon: Activity },
    { name: 'Project History', path: 'history', icon: History },
  ]

  const activatedMethodologies = methodologies
    .flatMap((group) => group.methods)
    .filter((method) => method.enabled)
    .map((method) => method.name)

  // Load scenarios on component mount
  useEffect(() => {
    // Load saved scenarios from localStorage
    const loadScenarios = () => {
      try {
        const savedScenariosString = localStorage.getItem('scenarios')
        const activeScenarioId = localStorage.getItem('activeScenarioId')

        if (savedScenariosString) {
          const savedScenarios = JSON.parse(savedScenariosString)

          // Map scenarios to the format needed for the chart
          const processedScenarios = savedScenarios.map((scenario: any) => ({
            id: scenario.id,
            name: scenario.name,
            enterpriseValue:
              scenario.enterpriseValue ||
              (scenario.id === '1' ? 750000000 : scenario.id === '2' ? 900000000 : 600000000),
            isActive: scenario.id === activeScenarioId,
          }))

          setScenariosData(processedScenarios)
        } else {
          // Default scenario data if none exists
          setScenariosData([
            { id: '1', name: 'Base Case', enterpriseValue: 750000000, isActive: true },
            { id: '2', name: 'Upside Case', enterpriseValue: 900000000 },
            { id: '3', name: 'Downside Case', enterpriseValue: 600000000 },
          ])
        }
      } catch (error) {
        console.error('Error loading scenarios:', error)
      }
    }

    // Load currency setting
    const loadSettings = () => {
      const savedCurrency = localStorage.getItem('projectCurrency')
      if (savedCurrency) {
        setCurrency(savedCurrency)
      }
    }

    loadScenarios()
    loadSettings()

    // Listen for scenario updates
    const handleScenarioUpdate = () => {
      loadScenarios()
    }

    window.addEventListener('scenarioDataUpdated', handleScenarioUpdate)

    return () => {
      window.removeEventListener('scenarioDataUpdated', handleScenarioUpdate)
    }
  }, [])

  const handleSaveNotes = () => {
    toast('Notes saved', {
      description: 'Your project notes have been saved successfully.',
    })
  }

  return (
    <div className="animate-fadeIn h-full bg-gradient-to-b from-muted/50 to-background">
      <PageHeader
        title="Project Summary"
        icon={<Activity className="h-5 w-5" />}
        description="Overview and key details for your valuation project"
      />

      <div className="px-6 py-4">
        <p className="text-muted-foreground">
          This dashboard provides a centralized overview of your valuation project, including key
          metrics, activated methodologies, and recent activity. Access all project components from
          this hub.
        </p>
        <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-primary to-primary/40"></div>

        {/* Project Details and Valuation Parameters */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="bg-muted/40 pb-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-[120px_1fr] gap-y-4 text-sm">
                <div className="flex items-center font-medium text-muted-foreground">
                  <Building className="mr-2 h-4 w-4" />
                  Company
                </div>
                <div className="font-semibold">{projectData.company}</div>

                <div className="flex items-center font-medium text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  Client
                </div>
                <div className="font-semibold">{projectData.client}</div>

                <div className="flex items-center font-medium text-muted-foreground">
                  <Tag className="mr-2 h-4 w-4" />
                  Status
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 font-medium text-primary hover:bg-primary/20"
                  >
                    {projectData.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="bg-muted/40 pb-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Valuation Parameters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-[120px_1fr] gap-y-4 text-sm">
                <div className="flex items-center font-medium text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Valuation Date
                </div>
                <div className="font-semibold">{projectData.valuationDate}</div>

                <div className="flex items-center font-medium text-muted-foreground">
                  <FileText className="mr-2 h-4 w-4" />
                  Project Type
                </div>
                <div className="font-semibold">{projectData.projectType}</div>

                <div className="flex items-center font-medium text-muted-foreground">
                  <Tag className="mr-2 h-4 w-4" />
                  Purpose
                </div>
                <div className="font-semibold">{projectData.purpose}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Comparison Chart */}
        <div className="mt-6 grid grid-cols-1 gap-6">
          <ScenarioComparisonChart
            scenarios={scenariosData}
            unitMultiplier={unitMultiplier}
            currency={currency}
            subtitle="DCF valuation results from the scenario manager"
          />
        </div>

        {/* Activated Methodologies, Quick Links, and Audit Trail */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Activated Methodologies - First 2 columns */}
          <Card className="col-span-2 border-border/60 shadow-sm">
            <CardHeader className="bg-muted/40 pb-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Activated Methodologies</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {activatedMethodologies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activatedMethodologies.map((methodology, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-primary/20 bg-primary/5 px-3 py-1.5 text-primary hover:bg-primary/10"
                    >
                      {methodology}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                  <CheckCircle className="mb-2 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No methodologies activated yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate('methodology-scope')}
                  >
                    Select Methodologies
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Trail - New component */}
          <ProjectSummaryAuditTrail projectId={projectData.id} />
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Span 1 column */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="bg-muted/40 pb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Quick Links</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {quickLinks.map((link, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-between transition-colors hover:bg-primary/10 hover:text-primary"
                    onClick={() => navigate(link.path)}
                  >
                    <div className="flex items-center">
                      <link.icon className="mr-2 h-4 w-4" />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Notes - Span 2 columns */}
          <Card className="border-border/60 shadow-sm md:col-span-2">
            <CardHeader className="bg-muted/40 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <StickyNote className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Project Notes / Activity Log</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                placeholder="Add project notes, comments, or track important milestones..."
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                className="min-h-[150px] resize-y border-border focus-visible:ring-primary"
              />
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={handleSaveNotes} className="ml-auto bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                Save Notes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProjectSummary

// Calculator utility function needed for quickLinks
function Calculator() {
  return <div className="h-4 w-4" />
}
