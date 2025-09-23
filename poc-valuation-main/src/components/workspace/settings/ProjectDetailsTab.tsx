import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProjectSettings } from '@/contexts/ProjectSettingsContext'
import { useNavigate, useParams } from 'react-router-dom'
import { ValuationProjectFormDialog } from '@/components/projects/ValuationProjectFormDialog'
import { valuationProjectTypes, valuationPurposes } from '@/types/valuation-project'

export default function ProjectDetailsTab() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()

  // Get project settings from context
  const { settings } = useProjectSettings()

  // State for edit modal
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Navigate to core assumptions
  const navigateToCoreAssumptions = () => {
    navigate(`/workspace/${projectId}/core-assumptions`)
  }

  // Mock companies data for the form (in a real app, this would come from an API)
  const mockCompanies = [
    {
      id: projectId || '1',
      name: settings.projectName || 'Current Project',
      clientName: settings.clientName || 'Current Client',
    },
  ]

  // Create project data for editing in the modal
  // Use type casting to match the expected types from ValuationProjectFormDialog
  const projectData = {
    companyId: projectId || '1',
    projectName: settings.projectName || '',
    valuationDate: settings.valuationDate ? new Date(settings.valuationDate) : new Date(),
    projectType: (settings.projectType ||
      'General Business Valuation') as (typeof valuationProjectTypes)[number],
    purpose: 'Annual Review' as (typeof valuationPurposes)[number],
    status: 'In Progress' as 'In Progress' | 'Draft' | 'Review' | 'Final',
    description: settings.projectDescription || '',
    maxProjectionYears: settings.maxProjectionYears,
    currency: settings.currency as 'USD' | 'EUR' | 'GBP' | 'CAD',
    discountingConvention: settings.discountingConvention as 'Mid-Year' | 'End-Year',
    taxRate: settings.taxRate,
  }

  // Handle form submission from the dialog
  const handleUpdateProject = (data: any) => {
    // The actual update happens in the ValuationProjectFormDialog component
    setShowEditDialog(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Project Details</h3>
        <p className="text-sm text-muted-foreground">
          View information about your valuation project
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-700">
          Core project parameters (valuation date, tax rate, etc.) are managed in the Core Project
          Assumptions section.
          <Button
            variant="outline"
            onClick={navigateToCoreAssumptions}
            className="ml-4 flex items-center gap-2 bg-blue-100 hover:bg-blue-200"
          >
            Go to Core Project Assumptions <ArrowRight className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>

      <div className="space-y-6 rounded-md border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">{settings.projectName || 'Unnamed Project'}</h4>
          <Button
            onClick={() => setShowEditDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" /> Edit Project Details
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Client</p>
            <p className="text-base">{settings.clientName || 'Not specified'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Industry</p>
            <p className="text-base">{settings.industry || 'Not specified'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Project Type</p>
            <p className="text-base">{settings.projectType || 'Valuation'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Valuation Date</p>
            <p className="text-base">{settings.valuationDate || 'Not specified'}</p>
          </div>

          <div className="col-span-2">
            <p className="text-sm font-medium text-gray-500">Tags</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {settings.tags && settings.tags.length > 0 ? (
                settings.tags.map((tag, index) => (
                  <span key={index} className="rounded-md bg-gray-100 px-2 py-1 text-xs">
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-400">No tags specified</p>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="whitespace-pre-line text-base">
              {settings.projectDescription || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Project Dialog */}
      <ValuationProjectFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleUpdateProject}
        editingProject={projectData}
        companies={mockCompanies}
        projectId={projectId}
      />
    </div>
  )
}
