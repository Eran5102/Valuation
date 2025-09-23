import { Building2, Clock } from 'lucide-react'
import { UserPresenceIndicator } from '@/components/collaboration/UserPresenceIndicator'
import { ShareButton } from '@/components/collaboration/ShareButton'

interface WorkspaceHeaderProps {
  projectId?: string
}

export function WorkspaceHeader({ projectId }: WorkspaceHeaderProps) {
  const projectData = {
    id: projectId,
    name: 'Q4 2025 Valuation',
    company: {
      name: 'Acme Corporation',
      client: 'Acme Holdings Ltd.',
    },
    valuationDate: '2025-04-01',
    purpose: 'Annual Review',
    status: 'In Progress',
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="w-full border-b bg-muted/30">
      <div className="flex h-16 items-center px-4">
        <div className="flex flex-col">
          <h1 className="text-teal text-lg font-semibold">{projectData.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>{projectData.company.name}</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-muted-foreground/80">{projectData.company.client}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Share button */}
          <ShareButton />

          {/* User presence indicator */}
          <UserPresenceIndicator />

          <div className="ml-3 flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1.5 h-3.5 w-3.5 opacity-70" />
            <span>Last updated: {formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
