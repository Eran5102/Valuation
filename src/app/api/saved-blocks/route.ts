import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationId } from '@/lib/auth/get-organization'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Fetch saved blocks - both global and organization-specific
    const { data: blocks, error } = await supabase
      .from('saved_template_blocks')
      .select('*')
      .or(`is_global.eq.true,organization_id.eq.${organizationId}`)
      .order('category', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch saved blocks' }, { status: 500 })
    }

    // Transform database format to match frontend format
    const transformedBlocks = blocks?.map(block => ({
      id: block.id,
      name: block.name,
      description: block.description || '',
      category: block.category,
      tags: block.tags || [],
      block: {
        id: `block_${block.id}`,
        type: block.block_type,
        content: block.block_content,
        styling: block.block_styling || {},
      },
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    })) || []

    return NextResponse.json(transformedBlocks)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const organizationId = await getOrganizationId()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const blockData = {
      organization_id: organizationId,
      name: body.name,
      description: body.description || null,
      category: body.category || 'Uncategorized',
      block_type: body.block.type,
      block_content: body.block.content || {},
      block_styling: body.block.styling || {},
      tags: body.tags || [],
      is_global: false,
      created_by: user.id,
    }

    const { data: newBlock, error } = await supabase
      .from('saved_template_blocks')
      .insert(blockData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save block' }, { status: 500 })
    }

    // Transform response to match frontend format
    const transformedBlock = {
      id: newBlock.id,
      name: newBlock.name,
      description: newBlock.description || '',
      category: newBlock.category,
      tags: newBlock.tags || [],
      block: {
        id: `block_${newBlock.id}`,
        type: newBlock.block_type,
        content: newBlock.block_content,
        styling: newBlock.block_styling || {},
      },
      createdAt: newBlock.created_at,
      updatedAt: newBlock.updated_at,
    }

    return NextResponse.json(transformedBlock)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Block ID required' }, { status: 400 })
    }

    const blockData = {
      name: updateData.name,
      description: updateData.description || null,
      category: updateData.category || 'Uncategorized',
      tags: updateData.tags || [],
      updated_at: new Date().toISOString(),
    }

    const { data: updatedBlock, error } = await supabase
      .from('saved_template_blocks')
      .update(blockData)
      .eq('id', id)
      .eq('created_by', user.id) // Ensure user owns the block
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update block' }, { status: 500 })
    }

    if (!updatedBlock) {
      return NextResponse.json({ error: 'Block not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json(updatedBlock)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Block ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('saved_template_blocks')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id) // Ensure user owns the block

    if (error) {
      return NextResponse.json({ error: 'Failed to delete block' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}