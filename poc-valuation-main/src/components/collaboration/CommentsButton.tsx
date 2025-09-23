import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface CommentsButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'icon'
}

export function CommentsButton({ variant = 'outline', size = 'icon' }: CommentsButtonProps) {
  const [open, setOpen] = useState(false)

  // Mock comments data
  const mockComments = [
    {
      id: 1,
      author: 'John Doe',
      avatar: 'JD',
      content: 'The discount rate seems a bit aggressive given current market conditions.',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      author: 'Mary Kim',
      avatar: 'MK',
      content: "I'd suggest revisiting the terminal growth assumption.",
      timestamp: 'Yesterday',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip content="View/Add Comments">
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className="relative">
            <MessageSquare className="h-4 w-4" />
            <Badge className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center px-1 text-[10px]">
              {mockComments.length}
            </Badge>
          </Button>
        </DialogTrigger>
      </Tooltip>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Project Comments</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {mockComments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-muted/40 p-3">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium">
                  {comment.avatar}
                </div>
                <div className="text-sm font-medium">{comment.author}</div>
                <div className="ml-auto text-xs text-muted-foreground">{comment.timestamp}</div>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}

          <div className="relative mt-4">
            <textarea
              className="h-20 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Add your comment here..."
            />
            <Button className="absolute bottom-2 right-2" size="sm">
              Send
            </Button>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            Comments functionality coming soon. This is a preview of the interface.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
