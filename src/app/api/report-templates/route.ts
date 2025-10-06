import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getOrganizationId } from '@/lib/auth/get-organization'
import type { TemplateSection } from '@/lib/templates/types'

/**
 * Converts template sections to flat block array for database storage
 */
function sectionsToBlocks(sections: TemplateSection[]): any[] {
  const blocks: any[] = []

  sections.forEach((section, sectionIndex) => {
    // Add section header
    blocks.push({
      id: `section_${section.id}`,
      type: 'section',
      content: {
        title: section.title,
        pageBreakBefore: section.pageBreakBefore,
        pageBreakAfter: section.pageBreakAfter,
      },
      order: sectionIndex * 1000,
    })

    // Add section blocks
    section.blocks.forEach((block, blockIndex) => {
      blocks.push({
        ...block,
        sectionId: section.id,
        order: sectionIndex * 1000 + blockIndex + 1,
      })
    })
  })

  return blocks
}

/**
 * Converts flat block array from database to template sections
 */
function blocksToSections(blocks: any[]): TemplateSection[] {
  const sections: TemplateSection[] = []
  let currentSection: TemplateSection | null = null

  // Sort blocks by order
  blocks.sort((a, b) => (a.order || 0) - (b.order || 0))

  blocks.forEach((block) => {
    if (block.type === 'section') {
      // Create new section
      currentSection = {
        id: block.id.replace('section_', ''),
        title: block.content?.title || 'Untitled Section',
        blocks: [],
        pageBreakBefore: block.content?.pageBreakBefore || false,
        pageBreakAfter: block.content?.pageBreakAfter || false,
      }
      sections.push(currentSection)
    } else if (currentSection) {
      // Add block to current section
      const { sectionId, order, ...blockData } = block
      currentSection.blocks.push(blockData)
    }
  })

  return sections
}

// Updated to use service client to bypass RLS

export async function GET(request: NextRequest) {
  try {
    // Use regular client for auth check
    const authClient = await createClient()
    const organizationId = await getOrganizationId()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser()
    if (userError || !user) {
      console.error('GET /api/report-templates - Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service client to bypass RLS for querying templates
    const serviceClient = await createServiceClient()

    // If requesting a specific template by ID
    if (templateId) {
      // Fetch from database
      const { data: template, error } = await serviceClient
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error || !template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Transform single template
      const transformedTemplate = {
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
        sections: blocksToSections(template.blocks || []),
        variables: Object.keys(template.variables_schema || {}),
        settings: template.branding,
        branding: template.branding, // Also include as branding for compatibility
        metadata: {
          createdAt: template.created_at,
          updatedAt: template.updated_at,
          author: template.owner_id || 'System',
          tags: template.type ? [template.type] : [],
          isSystem: template.is_system || false,
        },
      }

      return NextResponse.json(transformedTemplate)
    }

    // Fetch all templates - both system templates and organization-specific templates
    const { data: templates, error } = await serviceClient
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
        sections: blocksToSections(template.blocks || []), // Convert flat blocks to sections
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

    return NextResponse.json(transformedTemplates)
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
      blocks: sectionsToBlocks(body.sections || []), // Convert sections to flat blocks
      variables_schema:
        body.variables?.reduce((acc: any, v: string) => {
          acc[v] = { type: 'string', required: false }
          return acc
        }, {}) || {},
      branding: {
        ...(body.branding || {}),
        ...(body.settings || {}),
        // Fallback defaults if neither is provided
        primaryColor: (body.settings || body.branding)?.primaryColor || '#124E66',
        fontFamily: (body.settings || body.branding)?.fontFamily || 'Inter',
        headerEnabled: (body.settings || body.branding)?.headerEnabled ?? true,
        footerEnabled: (body.settings || body.branding)?.footerEnabled ?? true,
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
      sections: blocksToSections(newTemplate.blocks || []), // Convert blocks back to sections
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
        sections: blocksToSections(newTemplate.blocks || []), // Convert blocks back to sections
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

    // Regular update - transform frontend format to database format
    const templateData: any = {}

    if (body.name) templateData.name = body.name
    if (body.description !== undefined) templateData.description = body.description
    if (body.category) {
      templateData.type =
        body.category === 'financial'
          ? '409a'
          : body.category === 'presentation'
            ? 'board_deck'
            : body.category === 'operational'
              ? 'cap_table'
              : body.category === 'investor'
                ? 'investor_update'
                : 'custom'
    }
    if (body.sections) templateData.blocks = sectionsToBlocks(body.sections)
    if (body.variables) {
      templateData.variables_schema = body.variables.reduce((acc: any, v: any) => {
        if (typeof v === 'string') {
          acc[v] = { type: 'string', required: false }
        } else {
          acc[v.id || v.name] = { type: v.type || 'string', required: v.required || false }
        }
        return acc
      }, {})
    }
    if (body.settings || body.branding) {
      // Merge settings and branding, with settings taking precedence since that's where theme data lives
      templateData.branding = {
        ...(body.branding || {}),
        ...(body.settings || {}),
      }
    }

    const serviceClient = await createServiceClient()
    const { data: updatedTemplate, error: updateError } = await serviceClient
      .from('report_templates')
      .update(templateData)
      .eq('id', body.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update template:', updateError)
      return NextResponse.json(
        { error: 'Failed to update template', details: updateError.message },
        { status: 500 }
      )
    }

    // Transform back to frontend format
    const transformedTemplate = {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description || '',
      category:
        updatedTemplate.type === '409a'
          ? 'financial'
          : updatedTemplate.type === 'board_deck'
            ? 'presentation'
            : updatedTemplate.type === 'cap_table'
              ? 'operational'
              : updatedTemplate.type === 'investor_update'
                ? 'investor'
                : 'other',
      version: `${updatedTemplate.version}.0.0`,
      sections: blocksToSections(updatedTemplate.blocks || []),
      variables: Object.keys(updatedTemplate.variables_schema || {}),
      settings: updatedTemplate.branding,
      branding: updatedTemplate.branding,
      metadata: {
        createdAt: updatedTemplate.created_at,
        updatedAt: updatedTemplate.updated_at,
        author: updatedTemplate.owner_id || user.email,
        tags: updatedTemplate.type ? [updatedTemplate.type] : [],
        isSystem: updatedTemplate.is_system || false,
      },
    }

    return NextResponse.json(transformedTemplate)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Use service client to bypass RLS
    const serviceClient = await createServiceClient()

    // First check if the template exists and belongs to user's org or is a system template
    const { data: template } = await serviceClient
      .from('report_templates')
      .select('id, organization_id, is_system')
      .eq('id', templateId)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Verify user has permission to delete this template
    // Can delete if: it's their org's template OR it's a system template
    const canDelete = template.is_system || template.organization_id === organizationId

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Soft delete the template
    const { error } = await serviceClient
      .from('report_templates')
      .update({ is_active: false })
      .eq('id', templateId)

    if (error) {
      console.error('Failed to delete template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
