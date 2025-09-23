import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Edit, FolderOpen, Search, FileText } from 'lucide-react'
import { ProjectsDataTable, Project } from '@/components/projects/ProjectsDataTable'
import { ViewToggle } from '@/components/shared/ViewToggle'
import { ValuationProjectFormDialog } from '@/components/projects/ValuationProjectFormDialog'
import { toast } from 'sonner'
import { ValuationProjectFormData } from '@/types/valuation-project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Mock companies data for the form
const mockCompanies = [
  { id: '1', name: 'Acme Corporation', clientName: 'Acme Inc.' },
  { id: '2', name: 'Northern Manufacturing', clientName: 'Northern Holdings' },
  { id: '3', name: 'Crestwood Healthcare', clientName: 'Crestwood Group' },
]

// Mock projects data for the table
const mockProjects = [
  {
    id: '1',
    name: 'Annual Valuation 2025',
    company: 'Tech Corp',
    client: 'ABC Corp',
    valuationDate: '2025-03-15',
    purpose: 'Annual Review',
    status: 'In Progress',
  },
  {
    id: '2',
    name: 'Acquisition Analysis',
    company: 'Finance Ltd',
    client: 'XYZ Industries',
    valuationDate: '2025-04-01',
    purpose: 'M&A',
    status: 'Draft',
  },
]

export default function Projects() {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [editingProject, setEditingProject] = useState<ValuationProjectFormData | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateProject = (data: ValuationProjectFormData) => {
    console.log('Creating new project:', data)
    toast.success('Valuation project created successfully')
    setShowNewProjectDialog(false)
  }

  const handleEditProject = (project: Project) => {
    // Create a copy of the project and convert the string date to a Date object for the form
    const projectToEdit: ValuationProjectFormData = {
      companyId: project.id, // Assuming project.id can be used as companyId
      projectName: project.name,
      valuationDate: new Date(project.valuationDate),
      projectType: 'General Business Valuation', // Set default since it's required
      purpose: project.purpose as any, // Cast to match the expected enum
      status: project.status as any, // Cast to match the expected enum
      description: '',
      maxProjectionYears: 10,
      currency: 'USD',
      discountingConvention: 'Mid-Year',
      taxRate: 25,
    }

    setEditingProject(projectToEdit)
    setCurrentProjectId(project.id)
    setShowNewProjectDialog(true)
  }

  // Filter projects based on search term
  const filteredProjects = mockProjects.filter(
    (project) =>
      project.name.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      project.company.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      project.client.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      project.purpose.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  function getStatusClasses(status: string) {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
    switch (status) {
      case 'Draft':
        return `${baseClasses} bg-gray-100 text-gray-800`
      case 'In Progress':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'Final':
        return `${baseClasses} bg-green-100 text-green-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const ProjectCard = ({ project }: { project: Project }) => {
    return (
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{project.name}</CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Company:</span> {project.company}
            </p>
            <p>
              <span className="font-medium text-foreground">Client:</span> {project.client}
            </p>
            <p>
              <span className="font-medium text-foreground">Valuation Date:</span>{' '}
              {project.valuationDate}
            </p>
            <p>
              <span className="font-medium text-foreground">Purpose:</span> {project.purpose}
            </p>
          </div>
        </CardContent>
        <div className="mt-2 flex items-center justify-between border-t p-4">
          <div>
            <span className={getStatusClasses(project.status)}>{project.status}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/workspace/${project.id}`}>
                <FolderOpen className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)}>
              <Edit className="h-4 w-4" />
            </Button>
            {project.status === 'Final' && (
              <Button variant="ghost" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} />
          <Button
            onClick={() => {
              setEditingProject(null)
              setCurrentProjectId(undefined)
              setShowNewProjectDialog(true)
            }}
          >
            + Add New Project
          </Button>
        </div>
      </div>

      {/* Projects content */}
      {filteredProjects.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <ProjectsDataTable projects={filteredProjects} view="table" onEdit={handleEditProject} />
        )
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No projects found. Add your first project to get started.
          </p>
        </div>
      )}

      <ValuationProjectFormDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={handleCreateProject}
        companies={mockCompanies}
        editingProject={editingProject}
        projectId={currentProjectId}
      />
    </div>
  )
}
