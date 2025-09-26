'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

export type UserRole = 'super_admin' | 'org_owner' | 'org_admin' | 'appraiser' | 'viewer'

export type Permission =
  | 'all' // Super admin has all permissions
  | 'manage_organization'
  | 'manage_team'
  | 'manage_billing'
  | 'create_valuation'
  | 'edit_valuation'
  | 'delete_valuation'
  | 'create_client'
  | 'edit_client'
  | 'delete_client'
  | 'view_all'
  | 'view_assigned'
  | 'invite_members'
  | 'manage_roles'
  | 'access_admin_panel'

interface PermissionsContextType {
  role: UserRole | null
  permissions: Permission[]
  isSuperAdmin: boolean
  isOrgOwner: boolean
  isOrgAdmin: boolean
  isAppraiser: boolean
  isViewer: boolean
  canManageOrganization: boolean
  canManageTeam: boolean
  canCreateValuations: boolean
  canEditValuations: boolean
  canViewAll: boolean
  hasPermission: (permission: Permission) => boolean
  checkEntityAccess: (entityType: 'client' | 'valuation', entityId: string) => Promise<boolean>
  loading: boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: ['all'],
  org_owner: [
    'manage_organization',
    'manage_team',
    'manage_billing',
    'create_valuation',
    'edit_valuation',
    'delete_valuation',
    'create_client',
    'edit_client',
    'delete_client',
    'view_all',
    'view_assigned',
    'invite_members',
    'manage_roles',
  ],
  org_admin: [
    'manage_organization',
    'manage_team',
    'create_valuation',
    'edit_valuation',
    'delete_valuation',
    'create_client',
    'edit_client',
    'delete_client',
    'view_all',
    'view_assigned',
    'invite_members',
    'manage_roles',
  ],
  appraiser: [
    'create_valuation',
    'edit_valuation',
    'create_client',
    'edit_client',
    'view_assigned',
  ],
  viewer: ['view_assigned'],
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && organization) {
      fetchUserPermissions()
    } else {
      setRole(null)
      setPermissions([])
      setIsSuperAdmin(false)
      setLoading(false)
    }
  }, [user, organization])

  const fetchUserPermissions = async () => {
    try {
      // Fetch user permissions from the API
      const response = await fetch('/api/user/permissions')
      if (response.ok) {
        const data = await response.json()
        setRole(data.role as UserRole)
        setIsSuperAdmin(data.is_super_admin || false)

        // Set permissions based on role
        if (data.is_super_admin) {
          setPermissions(['all', 'access_admin_panel'])
        } else if (data.role) {
          setPermissions(rolePermissions[data.role as UserRole] || [])
        } else {
          setPermissions([])
        }
      }
    } catch (error) {
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permission: Permission): boolean => {
    if (permissions.includes('all')) return true
    return permissions.includes(permission)
  }

  const checkEntityAccess = async (
    entityType: 'client' | 'valuation',
    entityId: string
  ): Promise<boolean> => {
    // Super admin and org owners can access everything
    if (isSuperAdmin || role === 'org_owner' || role === 'org_admin') {
      return true
    }

    // Check if user is assigned to the entity
    try {
      const endpoint = entityType === 'client' ? 'companies' : 'valuations'
      const response = await fetch(`/api/${endpoint}/${entityId}`)
      if (response.ok) {
        const data = await response.json()

        // Check if user is assigned or in team
        if (entityType === 'client') {
          return (
            data.assigned_to === user?.id ||
            (data.team_members && data.team_members.includes(user?.id))
          )
        } else {
          return (
            data.assigned_appraiser === user?.id ||
            (data.team_members && data.team_members.includes(user?.id))
          )
        }
      }
    } catch (error) {
    }

    return false
  }

  const value: PermissionsContextType = {
    role,
    permissions,
    isSuperAdmin,
    isOrgOwner: role === 'org_owner',
    isOrgAdmin: role === 'org_admin' || role === 'org_owner',
    isAppraiser: role === 'appraiser',
    isViewer: role === 'viewer',
    canManageOrganization: hasPermission('manage_organization'),
    canManageTeam: hasPermission('manage_team'),
    canCreateValuations: hasPermission('create_valuation'),
    canEditValuations: hasPermission('edit_valuation'),
    canViewAll: hasPermission('view_all'),
    hasPermission,
    checkEntityAccess,
    loading,
  }

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export function usePermissions() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  return context
}

// HOC for protecting routes based on permissions
export function withPermission(
  Component: React.ComponentType,
  requiredPermission: Permission | Permission[]
) {
  return function ProtectedComponent(props: any) {
    const { hasPermission, loading } = usePermissions()

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg text-muted-foreground">Checking permissions...</div>
        </div>
      )
    }

    const permissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission]
    const hasAccess = permissions.some((perm) => hasPermission(perm))

    if (!hasAccess) {
      return (
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      )
    }

    return <Component {...props} />
  }
}
