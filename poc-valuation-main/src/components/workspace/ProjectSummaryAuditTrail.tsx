import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface AuditTrailEvent {
  id: string
  action: string
  user: string
  timestamp: string
}

interface ProjectSummaryAuditTrailProps {
  projectId: string
  recentEvents?: AuditTrailEvent[]
}

export function ProjectSummaryAuditTrail({
  projectId,
  recentEvents,
}: ProjectSummaryAuditTrailProps) {
  const navigate = useNavigate()

  // Default recent events if none provided
  const events = recentEvents || [
    { id: '1', action: 'Updated WACC value to 11%', user: 'John Smith', timestamp: '2 hours ago' },
    { id: '2', action: "Created 'Upside Case' scenario", user: 'Jane Doe', timestamp: 'Yesterday' },
    { id: '3', action: 'Added AAPL to Public Comps', user: 'John Smith', timestamp: '2 days ago' },
  ]

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="bg-muted/40 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/workspace/${projectId}/history`)}
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="border-b py-2 last:border-0">
              <div className="text-sm font-medium">{event.action}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{event.user}</span>
                <span className="text-xs text-muted-foreground">{event.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
