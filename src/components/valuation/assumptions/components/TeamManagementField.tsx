import React from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeamMember } from '../types'

interface TeamManagementFieldProps {
  field: {
    id: string
    name: string
    description?: string
  }
  managementTeam: TeamMember[]
  addTeamMember: () => void
  updateTeamMember: (memberId: string, field: 'name' | 'title', value: string) => void
  removeTeamMember: (memberId: string) => void
}

export function TeamManagementField({
  field,
  managementTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
}: TeamManagementFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label>{field.name}</Label>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addTeamMember} className="gap-1">
          <Plus className="h-3 w-3" />
          Add Member
        </Button>
      </div>
      <div className="space-y-2">
        {managementTeam.map((member) => (
          <div key={member.id} className="flex items-start gap-2">
            <Input
              placeholder="Name"
              value={member.name}
              onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Title"
              value={member.title}
              onChange={(e) => updateTeamMember(member.id, 'title', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeTeamMember(member.id)}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {managementTeam.length === 0 && (
          <div className="py-2 text-sm text-muted-foreground">
            No team members added yet. Click "Add Member" to start.
          </div>
        )}
      </div>
    </div>
  )
}