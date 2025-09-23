import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { FirmDashboard } from '@/components/dashboard/FirmDashboard'
import { SingleCompanyDashboard } from '@/components/dashboard/SingleCompanyDashboard'
import { ClientFormDialog } from '@/components/clients/ClientFormDialog'
import { ValuationProjectFormDialog } from '@/components/projects/ValuationProjectFormDialog'
import { toast } from 'sonner'
import { UserPresenceIndicator } from '@/components/collaboration/UserPresenceIndicator'
import { ShareButton } from '@/components/collaboration/ShareButton'

// Mock companies data for the form
const mockCompanies = [
  { id: '1', name: 'Acme Corporation', clientName: 'Acme Inc.' },
  { id: '2', name: 'Northern Manufacturing', clientName: 'Northern Holdings' },
  { id: '3', name: 'Crestwood Healthcare', clientName: 'Crestwood Group' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)

  const handleCreateProject = (data: any) => {
    console.log('Creating new project:', data)
    toast.success('Valuation project created successfully')
    setShowNewProjectDialog(false)
  }

  return (
    <div className="w-full max-w-full space-y-8 p-6">
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

        {/* Collaboration indicator in dashboard header */}
        <div className="flex items-center gap-3">
          <UserPresenceIndicator tooltipText="Collaboration features coming soon" />
        </div>
      </div>

      <div className="mt-6 w-full">
        {user?.organizationType === 'firm' ? (
          <FirmDashboard searchTerm={searchTerm} />
        ) : (
          <SingleCompanyDashboard searchTerm={searchTerm} />
        )}
      </div>

      <ClientFormDialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog} />

      <ValuationProjectFormDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={handleCreateProject}
        companies={mockCompanies}
      />
    </div>
  )
}
