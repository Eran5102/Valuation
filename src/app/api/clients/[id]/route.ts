import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateClientRequest, AssignmentUpdate } from '@/types/database'

// GET /api/clients/[id] - Get a single client
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the client
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', id).single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if user has access to this client
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      // Check organization membership
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .eq('organization_id', client.organization_id)
        .eq('is_active', true)
        .single()

      if (!membership) {
        // Check if user is assigned to this client
        const hasAccess =
          client.lead_assigned === user.id ||
          client.team_members?.includes(user.id) ||
          client.editor_members?.includes(user.id) ||
          client.viewer_members?.includes(user.id)

        if (!hasAccess) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = (await request.json()) as UpdateClientRequest
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the client to check permissions
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if user has edit permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    const canEdit =
      profile?.is_super_admin ||
      client.lead_assigned === user.id ||
      client.team_members?.includes(user.id) ||
      client.editor_members?.includes(user.id)

    if (!canEdit) {
      // Check if user is org admin
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', client.organization_id)
        .eq('is_active', true)
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'You do not have permission to edit this client' },
          { status: 403 }
        )
      }
    }

    // Track assignment changes if lead_assigned is being updated
    if (updates.lead_assigned !== undefined && updates.lead_assigned !== client.lead_assigned) {
      // This will be handled by the database trigger
    }

    // Update the client
    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json(
        { error: 'Failed to update client', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error in client PUT:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the client to check permissions
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if user has delete permissions (only super admin or org owner/admin)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', client.organization_id)
        .eq('is_active', true)
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this client' },
          { status: 403 }
        )
      }
    }

    // Delete the client (this will cascade delete related records)
    const { error } = await supabase.from('clients').delete().eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json(
        { error: 'Failed to delete client', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error in client DELETE:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}

// PATCH /api/clients/[id] - Partial update (e.g., assignments)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = (await request.json()) as AssignmentUpdate
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the client to check permissions
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if user has permission to update assignments
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', client.organization_id)
      .eq('is_active', true)
      .single()

    const canUpdateAssignments =
      (membership && ['owner', 'admin', 'appraiser'].includes(membership.role)) ||
      client.lead_assigned === user.id

    if (!canUpdateAssignments) {
      return NextResponse.json(
        { error: 'You do not have permission to update assignments' },
        { status: 403 }
      )
    }

    // Update assignments
    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client assignments:', error)
      return NextResponse.json(
        { error: 'Failed to update assignments', details: error.message },
        { status: 500 }
      )
    }

    // Track assignment changes in history
    if (updates.lead_assigned !== undefined) {
      // The database trigger will handle this
    }

    // Track team member changes
    if (updates.team_members) {
      const added = updates.team_members.filter((m) => !client.team_members?.includes(m))
      const removed =
        client.team_members?.filter((m: string) => !updates.team_members?.includes(m)) || []

      for (const userId of added) {
        await supabase.from('assignment_history').insert({
          entity_type: 'client',
          entity_id: id,
          user_id: userId,
          role: 'team_member',
          assigned_by: user.id,
        })
      }

      for (const userId of removed) {
        await supabase
          .from('assignment_history')
          .update({
            removed_at: new Date().toISOString(),
            removed_by: user.id,
          })
          .eq('entity_id', id)
          .eq('user_id', userId)
          .eq('role', 'team_member')
          .is('removed_at', null)
      }
    }

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error in client PATCH:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}
