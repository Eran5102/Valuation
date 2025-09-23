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
  Users,
  Building,
  Briefcase,
  Calculator,
  Clock,
  BadgeCheck,
  BarChart3,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface FirmDashboardProps {
  searchTerm: string
}

const recentClients = [
  { id: '1', name: 'Acme Corporation', industry: 'Technology', lastActive: '2 days ago' },
  { id: '2', name: 'Northern Manufacturing', industry: 'Manufacturing', lastActive: '1 week ago' },
  { id: '3', name: 'Crestwood Healthcare', industry: 'Healthcare', lastActive: '3 days ago' },
]

const recentProjects = [
  {
    id: '1',
    name: 'Acme Corp Valuation',
    client: 'Acme Corporation',
    type: 'DCF',
    status: 'In Progress',
  },
  {
    id: '2',
    name: 'Northern Manufacturing Exit',
    client: 'Northern Manufacturing',
    type: 'Market Approach',
    status: 'Draft',
  },
  {
    id: '3',
    name: 'Crestwood Acquisition',
    client: 'Crestwood Healthcare',
    type: 'Asset Approach',
    status: 'Complete',
  },
]

export function FirmDashboard({ searchTerm }: FirmDashboardProps) {
  const filteredClients = recentClients.filter((client) =>
    client.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  const filteredProjects = recentProjects.filter(
    (project) =>
      project.name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      project.client.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  return (
    <div className="grid gap-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total Clients</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-semibold">12</span>
                <Users className="text-finance-secondary h-5 w-5" />
              </div>
              <span className="text-finance-success text-xs">+2 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Active Projects</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-semibold">8</span>
                <Briefcase className="text-finance-secondary h-5 w-5" />
              </div>
              <span className="text-finance-warning text-xs">3 due this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Companies Tracked</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-semibold">15</span>
                <Building className="text-finance-secondary h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">Across all clients</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Reports Generated</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-semibold">24</span>
                <FileText className="text-finance-secondary h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">This quarter</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients and Projects */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users size={20} /> Recent Clients
            </CardTitle>
            <CardDescription>Your most recently active clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.industry}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {client.lastActive}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No clients found matching your search
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full" size="sm">
              <Link to="/clients" className="flex items-center justify-center">
                View all clients <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Briefcase size={20} /> Recent Projects
            </CardTitle>
            <CardDescription>Your ongoing valuation projects</CardDescription>
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
                        {project.client} • {project.type}
                      </div>
                    </div>
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
      </div>

      {/* Methodology Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 size={20} /> Valuation Methodology Usage
          </CardTitle>
          <CardDescription>Distribution of methodologies across your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="mb-2 font-medium">Income Approach</h4>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm">DCF</span>
                    <span className="text-sm text-muted-foreground">65%</span>
                  </div>
                  <Progress value={65} className="h-2 bg-muted" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm">Cap. of Earnings</span>
                    <span className="text-sm text-muted-foreground">25%</span>
                  </div>
                  <Progress value={25} className="h-2 bg-muted" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Market Approach</h4>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm">Guideline Public Co.</span>
                    <span className="text-sm text-muted-foreground">45%</span>
                  </div>
                  <Progress value={45} className="h-2 bg-muted" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm">Precedent Trans.</span>
                    <span className="text-sm text-muted-foreground">55%</span>
                  </div>
                  <Progress value={55} className="h-2 bg-muted" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Asset Approach</h4>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm">Adj. Book Value</span>
                    <span className="text-sm text-muted-foreground">80%</span>
                  </div>
                  <Progress value={80} className="h-2 bg-muted" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm">Replacement Cost</span>
                    <span className="text-sm text-muted-foreground">20%</span>
                  </div>
                  <Progress value={20} className="h-2 bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
