import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Building,
  Briefcase,
  Calculator,
  Clock,
  FileText,
  BarChart3,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface IndividualDashboardProps {
  searchTerm: string
}

// Mock data for the individual dashboard
const companyInfo = {
  name: 'My Company, Inc.',
  industry: 'Technology',
  lastValuation: '$5.2M',
  valuationChange: '+12.4%',
  positive: true,
}

const recentProjects = [
  {
    id: '1',
    name: 'Annual Valuation',
    type: 'DCF',
    status: 'Complete',
    date: '2023-05-15',
    value: '$5.2M',
  },
  {
    id: '2',
    name: 'Pre-funding Round',
    type: 'Market Approach',
    status: 'Draft',
    date: '2023-08-10',
    value: 'In Progress',
  },
  {
    id: '3',
    name: 'Strategic Planning',
    type: 'Multiple Scenarios',
    status: 'In Progress',
    date: '2023-09-01',
    value: 'In Progress',
  },
]

export function IndividualDashboard({ searchTerm }: IndividualDashboardProps) {
  // Filter projects based on search term
  const filteredProjects = recentProjects.filter(
    (project) =>
      project.name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      project.type.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  return (
    <div className="grid gap-6">
      {/* Company Overview */}
      <Card className="overflow-hidden">
        <div className="from-finance-primary to-finance-secondary bg-gradient-to-r p-6 text-white">
          <h3 className="mb-1 text-2xl font-bold">{companyInfo.name}</h3>
          <p className="opacity-90">{companyInfo.industry}</p>
          <div className="mt-4 flex gap-8">
            <div>
              <div className="text-sm opacity-80">Last Valuation</div>
              <div className="text-2xl font-medium">{companyInfo.lastValuation}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Change</div>
              <div className="flex items-center text-2xl font-medium">
                {companyInfo.positive ? (
                  <ChevronUp className="mr-1 inline h-5 w-5 text-green-300" />
                ) : (
                  <ChevronDown className="mr-1 inline h-5 w-5 text-red-300" />
                )}
                {companyInfo.valuationChange}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground">Active Projects</span>
                <Briefcase className="text-finance-secondary h-5 w-5" />
              </div>
              <div className="text-2xl font-semibold">3</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground">Reports Generated</span>
                <FileText className="text-finance-secondary h-5 w-5" />
              </div>
              <div className="text-2xl font-semibold">5</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground">WACC Analysis</span>
                <Calculator className="text-finance-secondary h-5 w-5" />
              </div>
              <div className="text-2xl font-semibold">10.5%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valuation Projects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Briefcase size={20} /> Valuation Projects
          </CardTitle>
          <CardDescription>Your ongoing and completed valuations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.type} • {new Date(project.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right font-medium">{project.value}</div>
                    <div
                      className={`rounded-full px-2 py-1 text-sm text-xs font-medium ${
                        project.status === 'Complete'
                          ? 'bg-finance-success/10 text-finance-success'
                          : project.status === 'In Progress'
                            ? 'bg-finance-warning/10 text-finance-warning'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {project.status}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No projects found matching your search
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full" size="sm">
            <Link to="/projects" className="flex items-center justify-center">
              View all projects <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Historical Valuations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 size={20} /> Valuation History
          </CardTitle>
          <CardDescription>Track how your company's value has changed over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border bg-muted/20">
            <p className="text-muted-foreground">
              Historical valuation chart will appear here as you complete projects
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Methodology Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Methodology Breakdown</CardTitle>
            <CardDescription>Applied valuation methodologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm">DCF Analysis</span>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <Progress value={45} className="h-2 bg-muted" />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm">Market Multiples</span>
                  <span className="text-sm text-muted-foreground">30%</span>
                </div>
                <Progress value={30} className="h-2 bg-muted" />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm">Asset-Based</span>
                  <span className="text-sm text-muted-foreground">25%</span>
                </div>
                <Progress value={25} className="h-2 bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common valuation tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/projects/new">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Start new valuation
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/wacc-calculator">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate WACC
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/reports">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate report
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
