'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  GitBranch,
  GitCommit,
  Clock,
  MoreVertical,
  Check,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  FileText,
  User,
} from 'lucide-react'
import type { ReportTemplate } from '@/lib/templates/types'

interface TemplateVersion {
  id: string
  version: string
  type: 'major' | 'minor' | 'patch'
  changes: string
  author: string
  createdAt: string
  template: ReportTemplate
}

interface TemplateVersioningProps {
  template: ReportTemplate
  onChange: (template: ReportTemplate) => void
}

export function TemplateVersioning({ template, onChange }: TemplateVersioningProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>(() => {
    // Load versions from localStorage or initialize with current
    const stored = localStorage.getItem(`template-versions-${template.id}`)
    if (stored) {
      return JSON.parse(stored)
    }

    // Create initial version if none exists
    return [
      {
        id: `v_${Date.now()}`,
        version: template.version || '1.0.0',
        type: 'major',
        changes: 'Initial version',
        author: template.metadata?.author || 'Unknown',
        createdAt: template.metadata?.createdAt || new Date().toISOString(),
        template: { ...template },
      },
    ]
  })

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [versionType, setVersionType] = useState<'major' | 'minor' | 'patch'>('patch')
  const [versionNotes, setVersionNotes] = useState('')

  const currentVersion = String(template.version || '1.0.0')
  const [major, minor, patch] = currentVersion.split('.').map(Number)

  const getNextVersion = (type: 'major' | 'minor' | 'patch') => {
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'patch':
        return `${major}.${minor}.${patch + 1}`
      default:
        return currentVersion
    }
  }

  const saveVersion = useCallback(() => {
    const newVersion: TemplateVersion = {
      id: `v_${Date.now()}`,
      version: getNextVersion(versionType),
      type: versionType,
      changes:
        versionNotes || `${versionType.charAt(0).toUpperCase() + versionType.slice(1)} update`,
      author: template.metadata?.author || 'Unknown',
      createdAt: new Date().toISOString(),
      template: { ...template },
    }

    const updatedVersions = [...versions, newVersion]
    setVersions(updatedVersions)

    // Save to localStorage
    localStorage.setItem(`template-versions-${template.id}`, JSON.stringify(updatedVersions))

    // Update the current template with new version
    const updatedTemplate: ReportTemplate = {
      ...template,
      version: newVersion.version,
      metadata: {
        ...template.metadata,
        updatedAt: newVersion.createdAt,
        lastVersion: currentVersion,
      },
    }

    onChange(updatedTemplate)
    setShowCreateDialog(false)
    setVersionNotes('')
    // Version created successfully
  }, [template, versionType, versionNotes, versions, currentVersion, onChange])

  const loadVersion = (version: TemplateVersion) => {
    onChange(version.template)
    // Version loaded successfully
  }

  const deleteVersion = (versionId: string) => {
    if (versions.length <= 1) {
      // Cannot delete the last version
      return
    }

    const updatedVersions = versions.filter((v) => v.id !== versionId)
    setVersions(updatedVersions)
    localStorage.setItem(`template-versions-${template.id}`, JSON.stringify(updatedVersions))
    // Version deleted
  }

  const compareVersions = (v1: TemplateVersion, v2: TemplateVersion) => {
    // Simple comparison - count differences
    const diffs = {
      sections: v1.template.sections.length !== v2.template.sections.length,
      variables: v1.template.variables.length !== v2.template.variables.length,
      blocks:
        v1.template.sections.reduce((acc, s) => acc + s.blocks.length, 0) !==
        v2.template.sections.reduce((acc, s) => acc + s.blocks.length, 0),
    }

    return diffs
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version Control
          </div>
          <Badge variant="default" className="text-xs">
            v{currentVersion}
          </Badge>
        </CardTitle>
        <CardDescription>Manage template versions and track changes over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create New Version */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <GitCommit className="mr-2 h-4 w-4" />
              Create New Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Version</DialogTitle>
              <DialogDescription>
                Save the current state of your template as a new version
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Version Type</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Button
                    variant={versionType === 'major' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVersionType('major')}
                  >
                    <ArrowUp className="mr-1 h-3 w-3" />
                    Major
                    <Badge variant="secondary" className="ml-2">
                      {getNextVersion('major')}
                    </Badge>
                  </Button>
                  <Button
                    variant={versionType === 'minor' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVersionType('minor')}
                  >
                    Minor
                    <Badge variant="secondary" className="ml-2">
                      {getNextVersion('minor')}
                    </Badge>
                  </Button>
                  <Button
                    variant={versionType === 'patch' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVersionType('patch')}
                  >
                    <ArrowDown className="mr-1 h-3 w-3" />
                    Patch
                    <Badge variant="secondary" className="ml-2">
                      {getNextVersion('patch')}
                    </Badge>
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="version-notes">Version Notes</Label>
                <Textarea
                  id="version-notes"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="Describe the changes in this version..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveVersion}>
                <GitCommit className="mr-2 h-4 w-4" />
                Create Version {getNextVersion(versionType)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Version History */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Version History</Label>
          <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-lg border p-2">
            {versions
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((version, index) => {
                const isCurrent = version.version === currentVersion
                return (
                  <div
                    key={version.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isCurrent ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={isCurrent ? 'default' : 'outline'} className="text-xs">
                            v{version.version}
                          </Badge>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="mr-1 h-3 w-3" />
                              Current
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              version.type === 'major'
                                ? 'border-red-500 text-red-500'
                                : version.type === 'minor'
                                  ? 'border-yellow-500 text-yellow-500'
                                  : 'border-green-500 text-green-500'
                            }`}
                          >
                            {version.type}
                          </Badge>
                        </div>
                        <p className="text-sm">{version.changes}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(version.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isCurrent && (
                            <>
                              <DropdownMenuItem onClick={() => loadVersion(version)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Load Version
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(
                                JSON.stringify(version.template, null, 2)
                              )
                              // Template JSON copied to clipboard
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy as JSON
                          </DropdownMenuItem>
                          {!isCurrent && versions.length > 1 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteVersion(version.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Version
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Use <strong>Major</strong> versions for breaking changes,{' '}
            <strong>Minor</strong> for new features, and <strong>Patch</strong> for bug fixes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
