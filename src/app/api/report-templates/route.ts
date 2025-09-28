import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getOrganizationId } from '@/lib/auth/get-organization'
import { standard409ATemplate } from '@/lib/templates/409a-template'
import { value8Template409A } from '@/lib/templates/value8-409a-template'

// Updated to use service client to bypass RLS

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch templates - both system templates and organization-specific templates
    const { data: templates, error } = await supabase
      .from('report_templates')
      .select('*')
      .or(`is_system.eq.true,organization_id.eq.${organizationId}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    // Transform the database format to match the frontend ReportTemplate interface
    const transformedTemplates =
      templates?.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description || '',
        category:
          template.type === '409a'
            ? 'financial'
            : template.type === 'board_deck'
              ? 'presentation'
              : template.type === 'cap_table'
                ? 'operational'
                : template.type === 'investor_update'
                  ? 'investor'
                  : 'other',
        version: `${template.version}.0.0`,
        sections: template.blocks || [],
        variables: Object.keys(template.variables_schema || {}),
        settings: template.branding,
        metadata: {
          createdAt: template.created_at,
          updatedAt: template.updated_at,
          author: template.owner_id || 'System',
          tags: template.type ? [template.type] : [],
          isSystem: template.is_system || false,
        },
      })) || []

    // Check if predefined templates have been deleted (soft delete)
    const { data: deletedTemplates } = await supabase
      .from('report_templates')
      .select('id')
      .in('id', ['409a-standard-v1', 'value8-409a-comprehensive'])
      .eq('is_active', false)

    const deletedIds = deletedTemplates?.map((t) => t.id) || []

    // Add predefined templates from codebase (only if not deleted)
    const predefinedTemplates = []

    if (!deletedIds.includes('409a-standard-v1')) {
      predefinedTemplates.push({
        ...standard409ATemplate,
        metadata: {
          ...standard409ATemplate.metadata,
          isSystem: true,
          author: 'System',
        },
      })
    }

    if (!deletedIds.includes('value8-409a-comprehensive')) {
      predefinedTemplates.push({
        ...value8Template409A,
        metadata: {
          ...value8Template409A.metadata,
          isSystem: true,
          author: 'Value8',
        },
      })
    }

    // Combine database templates with predefined templates
    const allTemplates = [...predefinedTemplates, ...transformedTemplates]

    return NextResponse.json(allTemplates)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use regular client for auth check
    const authClient = await createClient()
    const organizationId = await getOrganizationId()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Log to verify service role key is present
    console.log(
      'POST /api/report-templates - Service role key present:',
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    console.log('POST /api/report-templates - User ID:', user.id)
    console.log('POST /api/report-templates - Organization ID:', organizationId)

    // Map frontend format to database format
    const templateData = {
      name: body.name,
      description: body.description || null,
      type:
        body.category === 'financial'
          ? '409a'
          : body.category === 'presentation'
            ? 'board_deck'
            : body.category === 'operational'
              ? 'cap_table'
              : body.category === 'investor'
                ? 'investor_update'
                : 'custom',
      is_system: false,
      is_active: true,
      owner_id: user.id,
      organization_id: organizationId,
      blocks: body.sections || [],
      variables_schema:
        body.variables?.reduce((acc: any, v: string) => {
          acc[v] = { type: 'string', required: false }
          return acc
        }, {}) || {},
      branding: body.settings || {
        primaryColor: '#124E66',
        fontFamily: 'Inter',
        headerEnabled: true,
        footerEnabled: true,
      },
      version: 1,
    }

    // Use service client to bypass RLS for insert
    console.log('Creating service client to bypass RLS...')
    const serviceClient = await createServiceClient()

    // Log which key is being used in the service client
    const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'
    console.log('Service client using key type:', keyType)
    console.log('Template data to insert:', JSON.stringify(templateData, null, 2))

    const { data: newTemplate, error } = await serviceClient
      .from('report_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      console.error('Failed to create template:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          error: 'Failed to create template',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    // Transform the response to match frontend format
    const transformedTemplate = {
      id: newTemplate.id,
      name: newTemplate.name,
      description: newTemplate.description || '',
      category: body.category,
      version: '1.0.0',
      sections: newTemplate.blocks || [],
      variables: Object.keys(newTemplate.variables_schema || {}),
      settings: newTemplate.branding,
      metadata: {
        createdAt: newTemplate.created_at,
        updatedAt: newTemplate.updated_at,
        author: user.email || 'Current User',
        tags: body.metadata?.tags || [],
        isSystem: false,
      },
    }

    return NextResponse.json(transformedTemplate)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle template cloning/duplication
export async function PUT(request: NextRequest) {
  try {
    // Use regular client for auth check
    const authClient = await createClient()
    const organizationId = await getOrganizationId()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, templateId, ...updateData } = body

    if (action === 'clone' || action === 'duplicate') {
      console.log('PUT /api/report-templates - Duplicate action')
      console.log('Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

      // Use service client to fetch and insert
      const serviceClient = await createServiceClient()
      console.log('Service client created for duplication')

      // Fetch the original template
      const { data: originalTemplate, error: fetchError } = await serviceClient
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (fetchError || !originalTemplate) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Create a copy with a new name, excluding auto-generated fields
      const { id, created_at, updated_at, ...templateData } = originalTemplate
      const clonedTemplate = {
        ...templateData,
        name: `${originalTemplate.name} (Copy)`,
        is_system: false,
        owner_id: user.id,
        organization_id: organizationId,
      }

      const { data: newTemplate, error: cloneError } = await serviceClient
        .from('report_templates')
        .insert(clonedTemplate)
        .select()
        .single()

      if (cloneError) {
        console.error('Failed to clone template:', cloneError)
        return NextResponse.json(
          {
            error: 'Failed to clone template',
            details: cloneError.message,
          },
          { status: 500 }
        )
      }

      // Transform the response
      const transformedTemplate = {
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description || '',
        category:
          newTemplate.type === '409a'
            ? 'financial'
            : newTemplate.type === 'board_deck'
              ? 'presentation'
              : newTemplate.type === 'cap_table'
                ? 'operational'
                : newTemplate.type === 'investor_update'
                  ? 'investor'
                  : 'other',
        version: `${newTemplate.version}.0.0`,
        sections: newTemplate.blocks || [],
        variables: Object.keys(newTemplate.variables_schema || {}),
        settings: newTemplate.branding,
        metadata: {
          createdAt: newTemplate.created_at,
          updatedAt: newTemplate.updated_at,
          author: user.email || 'Current User',
          tags: newTemplate.type ? [newTemplate.type] : [],
          isSystem: false,
        },
      }

      return NextResponse.json(transformedTemplate)
    }

    // Regular update - use service client for updates as well
    const serviceClient = await createServiceClient()
    const { data: updatedTemplate, error: updateError } = await serviceClient
      .from('report_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Check if this is a predefined template
    const predefinedIds = ['409a-standard-v1', 'value8-409a-comprehensive']

    if (predefinedIds.includes(templateId)) {
      // For predefined templates, create a "deleted" record in the database
      // This will prevent them from showing up when we check in GET
      const { error } = await supabase.from('report_templates').upsert({
        id: templateId,
        name: 'Deleted Template',
        organization_id: organizationId,
        is_active: false,
        is_system: true,
        type: '409a',
        version: 1,
        blocks: [],
        variables_schema: {},
        owner_id: (await supabase.auth.getUser()).data.user?.id,
      })

      if (error) {
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
      }
    } else {
      // Regular soft delete for database templates
      const { error } = await supabase
        .from('report_templates')
        .update({ is_active: false })
        .eq('id', templateId)
        .eq('organization_id', organizationId)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
