import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, FolderOpen, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface Project {
  id: string
  name: string
  company: string
  client: string
  valuationDate: string
  purpose: string
  status: string
}

interface ProjectsDataTableProps {
  projects: Project[]
  view: 'grid' | 'table'
  onEdit: (project: Project) => void
}

export function ProjectsDataTable({ projects, view, onEdit }: ProjectsDataTableProps) {
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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Valuation Date</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.company}</TableCell>
              <TableCell>{project.client}</TableCell>
              <TableCell>{project.valuationDate}</TableCell>
              <TableCell>{project.purpose}</TableCell>
              <TableCell>
                <span className={getStatusClasses(project.status)}>{project.status}</span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/workspace/${project.id}`}>
                      <FolderOpen className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(project)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {project.status === 'Final' && (
                    <Button variant="ghost" size="icon">
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
