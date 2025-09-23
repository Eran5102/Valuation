import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { RotateCcw, Download, ChevronRight, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Mock version history data
const MOCK_VERSIONS = [
  {
    id: 1,
    versionNumber: 'v1.3',
    timestamp: '2025-05-01T14:30:00Z',
    user: { name: 'John Doe', avatar: 'JD' },
    changes: [
      { type: 'updated', description: 'Updated discount rate from 10% to 12%' },
      { type: 'updated', description: 'Modified terminal growth rate assumptions' },
      { type: 'added', description: 'Added sensitivity analysis for WACC' },
    ],
    isCurrent: true,
  },
  {
    id: 2,
    versionNumber: 'v1.2',
    timestamp: '2025-04-28T09:15:00Z',
    user: { name: 'Mary Kim', avatar: 'MK' },
    changes: [
      { type: 'updated', description: 'Revised financial projections for FY2026-2028' },
      { type: 'removed', description: 'Removed redundant cost categories' },
    ],
    isCurrent: false,
  },
  {
    id: 3,
    versionNumber: 'v1.1',
    timestamp: '2025-04-15T16:45:00Z',
    user: { name: 'Tom Wilson', avatar: 'TW' },
    changes: [
      { type: 'added', description: 'Added historical financial data for 2023-2024' },
      { type: 'updated', description: 'Updated company profile information' },
    ],
    isCurrent: false,
  },
  {
    id: 4,
    versionNumber: 'v1.0',
    timestamp: '2025-04-01T10:00:00Z',
    user: { name: 'John Doe', avatar: 'JD' },
    changes: [{ type: 'created', description: 'Initial project creation' }],
    isCurrent: false,
  },
]

export default function VersionHistoryTab() {
  const [versions, setVersions] = useState(MOCK_VERSIONS)
  const [openItems, setOpenItems] = useState<number[]>([1])

  const toggleVersion = (id: number) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleRevert = (versionId: number, versionNumber: string) => {
    toast.success(`Reverted to version ${versionNumber}`)
    // In a real app, this would trigger an API call to revert the project
    setVersions(
      versions.map((v) => ({
        ...v,
        isCurrent: v.id === versionId,
      }))
    )
  }

  const handleDownload = (versionId: number, versionNumber: string) => {
    toast.success(`Downloading version ${versionNumber}`)
    // In a real app, this would trigger a download
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800'
      case 'updated':
        return 'bg-blue-100 text-blue-800'
      case 'removed':
        return 'bg-red-100 text-red-800'
      case 'created':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Version History</h3>
        <p className="text-sm text-muted-foreground">
          View and restore previous versions of this project.
        </p>
      </div>

      <div className="space-y-4">
        {versions.map((version) => (
          <Collapsible
            key={version.id}
            open={openItems.includes(version.id)}
            onOpenChange={() => toggleVersion(version.id)}
            className="overflow-hidden rounded-md border"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/40">
              <div className="flex items-center gap-3">
                {openItems.includes(version.id) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{version.versionNumber}</span>
                    {version.isCurrent && (
                      <Badge variant="outline" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {formatDate(version.timestamp)}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarFallback className="text-xs">{version.user.avatar}</AvatarFallback>
                </Avatar>
                <span className="mr-2 hidden text-sm md:inline">{version.user.name}</span>

                {!version.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRevert(version.id, version.versionNumber)
                    }}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Revert
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(version.id, version.versionNumber)
                  }}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Export
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t bg-muted/30 p-4">
                <h4 className="mb-3 text-sm font-medium">Changes</h4>

                <ul className="space-y-2">
                  {version.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${getChangeTypeColor(change.type)}`}
                      >
                        {change.type}
                      </span>
                      <span>{change.description}</span>
                    </li>
                  ))}
                </ul>

                {version.id !== versions.length && (
                  <div className="mt-4 border-t border-dashed pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        console.log(`Compare with ${version.versionNumber} and current`)
                      }
                    >
                      Compare with Current Version
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}
