import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, X, Mail, Search } from 'lucide-react'
import { toast } from 'sonner'

const MOCK_TEAM_MEMBERS = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'JD',
    role: 'owner',
    status: 'active',
  },
  {
    id: 2,
    name: 'Mary Kim',
    email: 'mary.kim@example.com',
    avatar: 'MK',
    role: 'editor',
    status: 'active',
  },
  {
    id: 3,
    name: 'Tom Wilson',
    email: 'tom.wilson@example.com',
    avatar: 'TW',
    role: 'viewer',
    status: 'pending',
  },
  {
    id: 4,
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    avatar: 'SJ',
    role: 'editor',
    status: 'active',
  },
]

export default function TeamMembersTab() {
  const [teamMembers, setTeamMembers] = useState(MOCK_TEAM_MEMBERS)
  const [newInvite, setNewInvite] = useState({ email: '', role: 'viewer' })
  const [searchQuery, setSearchQuery] = useState('')

  const handleRoleChange = (userId: number, newRole: string) => {
    setTeamMembers(
      teamMembers.map((member) => (member.id === userId ? { ...member, role: newRole } : member))
    )
    toast.success(`User role updated successfully`)
  }

  const handleRemoveMember = (userId: number) => {
    setTeamMembers(teamMembers.filter((member) => member.id !== userId))
    toast.success(`User removed from project`)
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newInvite.email) {
      toast.error('Please enter an email address')
      return
    }

    // Simulate sending invitation
    toast.success(`Invitation sent to ${newInvite.email}`)
    setNewInvite({ email: '', role: 'viewer' })
  }

  const filteredMembers = searchQuery
    ? teamMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : teamMembers

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Team Members</h3>
        <p className="text-sm text-muted-foreground">
          Manage who has access to this project and what permissions they have.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Member List */}
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-2 rounded-t-md bg-muted px-4 py-2">
          <div className="col-span-5 text-sm font-medium">User</div>
          <div className="col-span-3 hidden text-sm font-medium md:block">Email</div>
          <div className="col-span-3 text-sm font-medium">Role</div>
          <div className="col-span-1 text-right text-sm font-medium">Actions</div>
        </div>

        <div className="divide-y">
          {filteredMembers.map((member) => (
            <div key={member.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
              <div className="col-span-5 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{member.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground md:hidden">{member.email}</div>
                  {member.status === 'pending' && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              <div className="col-span-3 hidden text-sm text-muted-foreground md:block">
                {member.email}
              </div>

              <div className="col-span-3">
                <Select
                  defaultValue={member.role}
                  onValueChange={(value) => handleRoleChange(member.id, value)}
                  disabled={member.role === 'owner'}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="commenter">Commenter</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 text-right">
                {member.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Form */}
      <div>
        <h4 className="text-md mb-3 font-medium">Invite New Members</h4>
        <form onSubmit={handleInvite} className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <Label htmlFor="invite-email" className="sr-only">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-email"
                placeholder="Email address"
                type="email"
                className="pl-9"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="invite-role" className="sr-only">
              Role
            </Label>
            <Select
              value={newInvite.role}
              onValueChange={(value) => setNewInvite({ ...newInvite, role: value })}
            >
              <SelectTrigger id="invite-role" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="commenter">Commenter</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        </form>
      </div>

      {/* Role Explanations */}
      <div className="space-y-2 rounded-md bg-muted/40 p-4 text-sm">
        <h4 className="font-medium">Access Levels</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="font-medium">Owner</div>
            <p className="text-xs text-muted-foreground">
              Full administrative access to project settings and can add/remove team members
            </p>
          </div>
          <div>
            <div className="font-medium">Editor</div>
            <p className="text-xs text-muted-foreground">
              Can view and edit all project data, but cannot modify team access
            </p>
          </div>
          <div>
            <div className="font-medium">Commenter</div>
            <p className="text-xs text-muted-foreground">
              Can view all project data and add comments, but cannot make edits
            </p>
          </div>
          <div>
            <div className="font-medium">Viewer</div>
            <p className="text-xs text-muted-foreground">
              Can only view project data, but cannot make changes or add comments
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
