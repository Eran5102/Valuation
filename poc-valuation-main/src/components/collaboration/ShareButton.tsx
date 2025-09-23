import { Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'icon'
}

export function ShareButton({ variant = 'outline', size = 'icon' }: ShareButtonProps) {
  const [open, setOpen] = useState(false)

  const handleCopyLink = () => {
    setOpen(false)
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success('Project link copied to clipboard'))
      .catch(() => toast.error('Failed to copy link'))
  }

  const handleShare = (method: string) => {
    setOpen(false)
    toast(`Share via ${method} coming soon`, {
      description: 'This feature will be available in the next update',
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip content="Share Project">
          <PopoverTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className="hover:bg-primary/10 hover:text-primary"
            >
              <Share className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Share Project</h4>
          <div className="flex flex-col space-y-2">
            <Button variant="outline" className="justify-start" onClick={handleCopyLink}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleShare('Email')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect width="16" height="13" x="4" y="6" rx="2" />
                <path d="m4 10 8 3 8-3" />
              </svg>
              Email
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => handleShare('Slack')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect width="3" height="8" x="13" y="2" rx="1.5" />
                <path d="M19 8.5V10h1.5A1.5 1.5 0 1 0 19 8.5" />
                <rect width="3" height="8" x="8" y="14" rx="1.5" />
                <path d="M5 15.5V14H3.5A1.5 1.5 0 1 0 5 15.5" />
                <rect width="8" height="3" x="14" y="13" rx="1.5" />
                <path d="M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5" />
                <rect width="8" height="3" x="2" y="8" rx="1.5" />
                <path d="M8.5 5H10V3.5A1.5 1.5 0 1 0 8.5 5" />
              </svg>
              Slack
            </Button>
          </div>
          <div className="border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setOpen(false)}
            >
              Advanced sharing options coming soon
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
