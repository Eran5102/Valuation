import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  Search,
  Save,
  RotateCcw,
  FileArchive,
  FileText,
  Database,
  History,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WorkspaceHeaderLayout } from '@/components/layout/WorkspaceHeaderLayout'

// Types for project history
interface HistoryEvent {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  description: string
  category: 'methodology' | 'assumption' | 'scenario' | 'report' | 'project' | 'other'
  details?: {
    previousValue?: string
    newValue?: string
  }
}

interface ProjectSnapshot {
  id: string
  name: string
  description?: string
  timestamp: string
  createdBy: string
  dataHash?: string // For integrity verification
}

// Mock user data - would come from auth context in a real app
const currentUser = {
  id: 'user-1',
  name: 'John Smith',
}

const ProjectHistory: React.FC = () => {
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([])
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [snapshotName, setSnapshotName] = useState('')
  const [snapshotDescription, setSnapshotDescription] = useState('')
  const [isCreateSnapshotOpen, setIsCreateSnapshotOpen] = useState(false)

  // Load history events and snapshots from localStorage on component mount
  useEffect(() => {
    const loadHistoryData = () => {
      try {
        const savedHistory = localStorage.getItem('projectHistory')
        if (savedHistory) {
          setHistoryEvents(JSON.parse(savedHistory))
        } else {
          // Add some sample history events if none exist
          const mockEvents = generateMockEvents()
          setHistoryEvents(mockEvents)
          localStorage.setItem('projectHistory', JSON.stringify(mockEvents))
        }

        const savedSnapshots = localStorage.getItem('projectSnapshots')
        if (savedSnapshots) {
          setSnapshots(JSON.parse(savedSnapshots))
        }
      } catch (error) {
        console.error('Error loading history data:', error)
        toast.error('Failed to load project history')
      }
    }

    loadHistoryData()
  }, [])

  // Generate some mock history events for demonstration
  const generateMockEvents = (): HistoryEvent[] => {
    const now = new Date()
    return [
      {
        id: 'event-1',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        userId: 'user-1',
        userName: 'John Smith',
        action: 'Updated Discount Rate',
        description: 'Modified WACC from 10.5% to 11.0%',
        category: 'assumption',
        details: {
          previousValue: '10.5%',
          newValue: '11.0%',
        },
      },
      {
        id: 'event-2',
        timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        userId: 'user-2',
        userName: 'Jane Doe',
        action: 'Saved Scenario',
        description: "Created 'Upside Case' scenario",
        category: 'scenario',
      },
      {
        id: 'event-3',
        timestamp: new Date(now.getTime() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        userId: 'user-1',
        userName: 'John Smith',
        action: 'Added Comparable',
        description: 'Added AAPL to Public Comps',
        category: 'methodology',
      },
      {
        id: 'event-4',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        userId: 'user-1',
        userName: 'John Smith',
        action: 'Modified Growth Rate',
        description: 'Changed terminal growth rate from 2.0% to 2.5%',
        category: 'assumption',
        details: {
          previousValue: '2.0%',
          newValue: '2.5%',
        },
      },
      {
        id: 'event-5',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        userId: 'user-2',
        userName: 'Jane Doe',
        action: 'Generated Report',
        description: 'Created valuation summary report',
        category: 'report',
      },
    ]
  }

  // Filter history events based on search query and category
  const filteredEvents = historyEvents.filter((event) => {
    const matchesSearch =
      searchQuery === '' ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.userName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === null || event.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Handler for creating a new snapshot
  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) {
      toast.error('Snapshot name is required')
      return
    }

    const newSnapshot: ProjectSnapshot = {
      id: `snapshot-${Date.now()}`,
      name: snapshotName,
      description: snapshotDescription,
      timestamp: new Date().toISOString(),
      createdBy: currentUser.name,
    }

    // Add to snapshots
    const updatedSnapshots = [...snapshots, newSnapshot]
    setSnapshots(updatedSnapshots)
    localStorage.setItem('projectSnapshots', JSON.stringify(updatedSnapshots))

    // Log the snapshot creation as a history event
    const newEvent: HistoryEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'Created Snapshot',
      description: `Created snapshot: ${snapshotName}`,
      category: 'project',
    }

    const updatedEvents = [newEvent, ...historyEvents]
    setHistoryEvents(updatedEvents)
    localStorage.setItem('projectHistory', JSON.stringify(updatedEvents))

    // Close dialog and reset form
    setIsCreateSnapshotOpen(false)
    setSnapshotName('')
    setSnapshotDescription('')

    toast.success('Project snapshot created successfully')
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return format(date, 'MMM d, yyyy h:mm a')
    } catch (error) {
      return timestamp
    }
  }

  // Handler for restoring a snapshot (just a placeholder for now)
  const handleRestoreSnapshot = (snapshotId: string) => {
    toast('This feature is not yet implemented', {
      description: 'Snapshot restoration will be available in a future update.',
    })
  }

  // Get category badge color
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'methodology':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'assumption':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      case 'scenario':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'report':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200'
      case 'project':
        return 'bg-rose-100 text-rose-800 hover:bg-rose-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  return (
    <WorkspaceHeaderLayout
      title="Project History"
      icon={<History className="h-5 w-5" />}
      description="View the history of changes and project snapshots"
      fullWidth={true}
    >
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="history" className="h-full w-full">
          <TabsList>
            <TabsTrigger value="history">Activity Log</TabsTrigger>
            <TabsTrigger value="snapshots">Project Snapshots</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <div className="mb-6 flex items-center justify-between">
              <div className="relative w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search history entries..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter by:</span>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`cursor-pointer ${categoryFilter === null ? 'border-primary/20 bg-primary/10 text-primary' : ''}`}
                    onClick={() => setCategoryFilter(null)}
                  >
                    All
                  </Badge>
                  {['methodology', 'assumption', 'scenario', 'report', 'project'].map(
                    (category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className={`cursor-pointer capitalize ${categoryFilter === category ? 'border-primary/20 bg-primary/10 text-primary' : ''}`}
                        onClick={() => setCategoryFilter(category as any)}
                      >
                        {category}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-4 p-4">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-md border p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{event.action}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {event.description}
                              </p>
                              {event.details && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {event.details.previousValue && (
                                    <span>Previous: {event.details.previousValue}</span>
                                  )}
                                  {event.details.previousValue && event.details.newValue && (
                                    <span> → </span>
                                  )}
                                  {event.details.newValue && (
                                    <span>New: {event.details.newValue}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <Badge
                              className={`${getCategoryBadgeColor(event.category)} capitalize`}
                            >
                              {event.category}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>{formatTimestamp(event.timestamp)}</span>
                            <span className="mx-2">•</span>
                            <span>{event.userName}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No history entries found</p>
                        {searchQuery && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setSearchQuery('')
                              setCategoryFilter(null)
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="snapshots">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium">Project Snapshots</h2>

              <Dialog open={isCreateSnapshotOpen} onOpenChange={setIsCreateSnapshotOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Create Snapshot
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Project Snapshot</DialogTitle>
                    <DialogDescription>
                      Save the current state of the project for future reference.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="snapshot-name" className="text-right text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="snapshot-name"
                        value={snapshotName}
                        onChange={(e) => setSnapshotName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Pre-Board Meeting Draft"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label
                        htmlFor="snapshot-description"
                        className="text-right text-sm font-medium"
                      >
                        Description
                      </label>
                      <Input
                        id="snapshot-description"
                        value={snapshotDescription}
                        onChange={(e) => setSnapshotDescription(e.target.value)}
                        className="col-span-3"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateSnapshotOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSnapshot}>Create Snapshot</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {snapshots.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {snapshots.map((snapshot) => (
                  <Card key={snapshot.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{snapshot.name}</CardTitle>
                        <FileArchive className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardDescription className="line-clamp-1">
                        {snapshot.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="mr-2 h-3.5 w-3.5" />
                          <span>{formatTimestamp(snapshot.timestamp)}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Database className="mr-2 h-3.5 w-3.5" />
                          <span>Created by {snapshot.createdBy}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t bg-muted/20 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreSnapshot(snapshot.id)}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" />
                        Restore
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <FileArchive className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-medium">No snapshots yet</h3>
                <p className="mb-4 text-muted-foreground">
                  Create snapshots to save the current state of your project.
                </p>
                <Button onClick={() => setIsCreateSnapshotOpen(true)}>
                  <Save className="mr-2 h-4 w-4" />
                  Create Your First Snapshot
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceHeaderLayout>
  )
}

export default ProjectHistory
