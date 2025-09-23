import { ReactNode } from 'react'
import {
  Clock,
  Home,
  Briefcase,
  Building2,
  FileCog,
  FileBarChart,
  Settings,
  Calculator,
} from 'lucide-react'
import { UserPresenceIndicator } from '@/components/collaboration/UserPresenceIndicator'
import { ShareButton } from '@/components/collaboration/ShareButton'

interface AppHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
}

export function AppHeader({ title, subtitle, icon }: AppHeaderProps) {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Get appropriate icon based on page title
  const getIconByTitle = () => {
    switch (title) {
      case 'Dashboard':
        return <Home className="h-3.5 w-3.5" />
      case 'Clients':
        return <Briefcase className="h-3.5 w-3.5" />
      case 'Companies':
        return <Building2 className="h-3.5 w-3.5" />
      case 'Projects':
        return <FileCog className="h-3.5 w-3.5" />
      case 'Reports':
        return <FileBarChart className="h-3.5 w-3.5" />
      case 'Settings':
        return <Settings className="h-3.5 w-3.5" />
      case 'WACC Calculator':
        return <Calculator className="h-3.5 w-3.5" />
      default:
        return <Home className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="w-full border-b bg-muted/30">
      <div className="flex h-16 items-center px-4">
        <div className="flex flex-col">
          <h1 className="text-teal text-lg font-semibold">{title}</h1>
          {subtitle && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {icon || getIconByTitle()}
              <span>{subtitle}</span>
            </div>
          )}
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
