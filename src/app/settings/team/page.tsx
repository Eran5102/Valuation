'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Mail,
  Shield,
  Edit2,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  UserPlus,
  Crown,
  User,
  Eye,
  Settings,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { usePermissions } from '@/contexts/PermissionsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { formatDate } from '@/lib/utils'

interface TeamMember {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: string
  joined_at: string
  is_active: boolean
  avatar_url?: string
}

interface Invitation {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
  invited_by: string
}

export default function TeamManagementPage() {
  const { user, organization } = useAuth()
  const { canManageTeam, role, loading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('viewer')
  const [sending, setSending] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  useEffect(() => {
    if (!permissionsLoading && !canManageTeam) {
      router.push('/settings')
    } else if (!permissionsLoading && canManageTeam) {
      fetchTeamData()
    }
  }, [canManageTeam, permissionsLoading, router])

  const fetchTeamData = async () => {
    try {
      // Fetch team members
      const membersResponse = await fetch('/api/organization/members')
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setTeamMembers(membersData.members || membersData || [])
      }

      // Fetch pending invitations
      const invitesResponse = await fetch('/api/organization/invitations')
      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json()
        setInvitations(invitesData)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/organization/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (response.ok) {
        setInviteDialogOpen(false)
        setInviteEmail('')
        setInviteRole('viewer')
        fetchTeamData() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to send invitation')
      }
    } catch (error) {
      alert('Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        fetchTeamData()
      }
    } catch (error) {}
  }

  const removeMember = async (memberId: string) => {
    setMemberToRemove(memberId)
    setRemoveDialogOpen(true)
  }

  const confirmRemoveMember = async () => {
    if (memberToRemove) {
      try {
        const response = await fetch(`/api/organization/members/${memberToRemove}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchTeamData()
        }
      } catch (error) {}
      setMemberToRemove(null)
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/organization/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTeamData()
      }
    } catch (error) {}
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'org_owner':
        return <Crown className="h-4 w-4" />
      case 'org_admin':
        return <Shield className="h-4 w-4" />
      case 'appraiser':
        return <User className="h-4 w-4" />
      case 'viewer':
        return <Eye className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'org_owner':
        return 'bg-purple-100 text-purple-800'
      case 'org_admin':
        return 'bg-blue-100 text-blue-800'
      case 'appraiser':
        return 'bg-green-100 text-green-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (permissionsLoading || loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (!canManageTeam) {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your organization's team members and permissions
            </p>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>Send an invitation to join your organization</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org_admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Organization Admin</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="appraiser">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Appraiser</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>Viewer</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendInvitation} disabled={!inviteEmail || sending}>
                  {sending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {teamMembers.length} active member{teamMembers.length !== 1 && 's'} in your
              organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.email}
                      </div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role.replace('_', ' ').replace('org ', '')}
                          </span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Joined {formatDate(member.joined_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.id !== user?.id && member.role !== 'org_owner' && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) => updateMemberRole(member.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="org_admin">Admin</SelectItem>
                            <SelectItem value="appraiser">Appraiser</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => removeMember(member.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    {member.id === user?.id && <Badge variant="outline">You</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                {invitations.length} pending invitation{invitations.length !== 1 && 's'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className={getRoleBadgeColor(invitation.role)}>
                            <span className="flex items-center gap-1">
                              {getRoleIcon(invitation.role)}
                              {invitation.role.replace('_', ' ')}
                            </span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Expires {formatDate(invitation.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Remove Member Confirmation Dialog */}
        <ConfirmationDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          title="Remove Team Member"
          description={`Are you sure you want to remove this team member? They will lose access to the organization and all associated projects.`}
          confirmText="Remove Member"
          cancelText="Cancel"
          variant="destructive"
          icon="delete"
          onConfirm={confirmRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      </div>
    </AppLayout>
  )
}
