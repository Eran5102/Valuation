'use client'

import React, { useState, useEffect } from 'react'
import { User, Users, UserPlus, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
}

interface AssignmentSelectorProps {
  assignedTo?: string | null
  teamMembers?: string[]
  onAssignmentChange: (assignedTo: string | null, teamMembers: string[]) => void
  entityType: 'client' | 'valuation'
  className?: string
}

export function AssignmentSelector({
  assignedTo,
  teamMembers = [],
  onAssignmentChange,
  entityType,
  className,
}: AssignmentSelectorProps) {
  const { user, organization } = useAuth()
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (organization) {
      fetchTeamMembers()
    }
  }, [organization])

  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organization/members')
      if (response.ok) {
        const data = await response.json()
        setAvailableMembers(data.members || [])
      } else {
        // Fallback to mock data if API not available
        setAvailableMembers([
          {
            id: user?.id || '1',
            name:
              user?.user_metadata?.first_name + ' ' + user?.user_metadata?.last_name ||
              'Current User',
            email: user?.email || 'user@example.com',
            role: 'owner',
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'admin',
          },
          {
            id: '3',
            name: 'Mike Wilson',
            email: 'mike@example.com',
            role: 'member',
          },
        ])
      }
    } catch (error) {
      // Use mock data on error
      setAvailableMembers([
        {
          id: user?.id || '1',
          name:
            user?.user_metadata?.first_name + ' ' + user?.user_metadata?.last_name ||
            'Current User',
          email: user?.email || 'user@example.com',
          role: 'owner',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getAssignedMember = () => {
    return availableMembers.find((member) => member.id === assignedTo)
  }

  const getTeamMemberDetails = () => {
    return teamMembers
      .map((id) => availableMembers.find((member) => member.id === id))
      .filter(Boolean) as TeamMember[]
  }

  const handleAssignToUser = (userId: string) => {
    onAssignmentChange(userId, teamMembers)
  }

  const handleAddTeamMember = (userId: string) => {
    if (!teamMembers.includes(userId)) {
      onAssignmentChange(assignedTo, [...teamMembers, userId])
    }
  }

  const handleRemoveTeamMember = (userId: string) => {
    onAssignmentChange(
      assignedTo,
      teamMembers.filter((id) => id !== userId)
    )
  }

  const handleUnassign = () => {
    onAssignmentChange(null, teamMembers)
  }

  const assignedMember = getAssignedMember()
  const teamMemberDetails = getTeamMemberDetails()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Primary Assignment */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            {assignedMember ? (
              <>
                <User className="mr-2 h-3 w-3" />
                <span className="max-w-[150px] truncate">{assignedMember.name}</span>
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-3 w-3" />
                Assign {entityType}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Assign to</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <DropdownMenuItem disabled>Loading team members...</DropdownMenuItem>
          ) : (
            <>
              {availableMembers.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() => handleAssignToUser(member.id)}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  {member.id === assignedTo && (
                    <Badge variant="secondary" className="ml-2">
                      Assigned
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
              {assignedTo && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleUnassign}
                    className="cursor-pointer text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Unassign
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Team Members */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <Users className="mr-2 h-3 w-3" />
            Team ({teamMembers.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Team Members</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {teamMemberDetails.length > 0 ? (
            <>
              {teamMemberDetails.map((member) => (
                <DropdownMenuItem key={member.id} className="justify-between">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>{member.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTeamMember(member.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled>No team members</DropdownMenuItem>
          )}
          <DropdownMenuLabel className="text-xs">Add Team Member</DropdownMenuLabel>
          {availableMembers
            .filter((member) => !teamMembers.includes(member.id) && member.id !== assignedTo)
            .map((member) => (
              <DropdownMenuItem
                key={member.id}
                onClick={() => handleAddTeamMember(member.id)}
                className="cursor-pointer"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.role}</div>
                </div>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visual indicators */}
      {assignedMember && (
        <Badge variant="outline" className="ml-2">
          <User className="mr-1 h-3 w-3" />
          {assignedMember.name.split(' ')[0]}
        </Badge>
      )}
    </div>
  )
}
