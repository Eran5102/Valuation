import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Plus, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'

// Mock data for the company and projects
const companyData = {
  name: 'Acme Corporation',
  projects: [
    {
      id: '1',
      name: 'Q4 2025 Valuation',
      date: '2025-12-31',
      purpose: 'Financial Reporting',
      status: 'Draft',
    },
    {
      id: '2',
      name: 'Mid-Year Review 2025',
      date: '2025-06-30',
      purpose: 'Internal Planning',
      status: 'Final',
    },
    {
      id: '3',
      name: 'Strategic Assessment',
      date: '2025-03-15',
      purpose: 'M&A Planning',
      status: 'In Progress',
    },
  ],
}

interface SingleCompanyDashboardProps {
  searchTerm: string
}

export function SingleCompanyDashboard({ searchTerm }: SingleCompanyDashboardProps) {
  // Filter projects based on search term
  const filteredProjects = companyData.projects.filter(
    (project) =>
      project.name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      project.purpose.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Valuation Projects for {companyData.name}</h1>
        <Button onClick={() => {}}>
          <Plus className="mr-2 h-4 w-4" />
          Start New Valuation Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(project.date).toLocaleDateString()} • {project.purpose}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'Final'
                          ? 'bg-finance-success/10 text-finance-success'
                          : project.status === 'In Progress'
                            ? 'bg-finance-warning/10 text-finance-warning'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {project.status}
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/projects/${project.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
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
      </Card>
    </div>
  )
}
