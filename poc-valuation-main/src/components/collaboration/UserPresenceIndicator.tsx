import { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip } from '@/components/ui/tooltip'
import { Users } from 'lucide-react'

interface UserPresenceIndicatorProps {
  tooltipText?: string
}

export function UserPresenceIndicator({
  tooltipText = 'Team Members Online (Collaboration features coming soon)',
}: UserPresenceIndicatorProps) {
  return (
    <Tooltip content={tooltipText}>
      <div className="flex cursor-pointer items-center">
        <div className="mr-1 flex -space-x-2">
          <div className="relative">
            <Avatar className="bg-teal/20 h-7 w-7 border-2 border-background">
              <AvatarFallback className="text-teal text-xs">JD</AvatarFallback>
            </Avatar>
            <span className="bg-green absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-1 ring-white" />
          </div>
          <div className="relative">
            <Avatar className="h-7 w-7 border-2 border-background bg-accent/20">
              <AvatarFallback className="text-xs text-accent">MK</AvatarFallback>
            </Avatar>
            <span className="bg-green absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-1 ring-white" />
          </div>
          <div className="relative">
            <Avatar className="h-7 w-7 border-2 border-background bg-muted">
              <AvatarFallback className="text-xs">TW</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-yellow-500 ring-1 ring-white" />
          </div>
        </div>
        <Users className="ml-1 h-4 w-4 text-muted-foreground" />
      </div>
    </Tooltip>
  )
}
