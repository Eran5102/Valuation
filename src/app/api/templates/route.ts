/**
 * API routes for template operations
 * Handles CRUD operations for report templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReportTemplate, TemplateSection } from '@/lib/templates/types'

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
  blocks.sort((a, b) => a.order - b.order)

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

// GET - Fetch all templates or a specific template
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (templateId) {
      // Fetch specific template
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) {
        console.error('Error fetching template:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Convert blocks to sections
      const template: ReportTemplate = {
        ...data,
        sections: blocksToSections(data.blocks || []),
      }

      return NextResponse.json(template)
    } else {
      // Fetch all templates
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Convert each template's blocks to sections
      const templates = data.map((templateData: any) => ({
        ...templateData,
        sections: blocksToSections(templateData.blocks || []),
      }))

      return NextResponse.json(templates)
    }
  } catch (error) {
    console.error('Error in GET /api/templates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const template: ReportTemplate = await request.json()

    // Convert sections to blocks for database storage
    const templateData = {
      name: template.name,
      description: template.description,
      category: template.category,
      version: template.version || '1.0.0',
      blocks: sectionsToBlocks(template.sections || []),
      is_active: true,
    }

    const { data, error } = await supabase
      .from('report_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Error in POST /api/templates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update an existing template
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const template: ReportTemplate = await request.json()

    if (!template.id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Check if template exists
    const { data: existingTemplate, error: checkError } = await supabase
      .from('report_templates')
      .select('id')
      .eq('id', template.id)
      .single()

    if (checkError || !existingTemplate) {
      // Template doesn't exist, create it
      const templateData = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        version: template.version || '1.0.0',
        blocks: sectionsToBlocks(template.sections || []),
        is_active: true,
      }

      const { data, error } = await supabase
        .from('report_templates')
        .insert(templateData)
        .select()
        .single()

      if (error) {
        console.error('Error creating template:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, id: data.id })
    } else {
      // Template exists, update it
      const templateData = {
        name: template.name,
        description: template.description,
        category: template.category,
        version: template.version || '1.0.0',
        blocks: sectionsToBlocks(template.sections || []),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('report_templates')
        .update(templateData)
        .eq('id', template.id)

      if (error) {
        console.error('Error updating template:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, id: template.id })
    }
  } catch (error) {
    console.error('Error in PUT /api/templates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const { error } = await supabase.from('report_templates').delete().eq('id', templateId)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/templates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
