import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }


    // Find the Bridgeland Advisors organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'Bridgeland Advisors')
      .single()

    if (orgError || !orgData) {
      return NextResponse.json(
        {
          error: 'Bridgeland Advisors organization not found',
          details: orgError,
        },
        { status: 404 }
      )
    }


    // Update the organization with your user ID as owner
    // First try with member_ids, if that fails, try without
    let updateData = null
    let updateError = null

    // Try with member_ids first
    const { data: data1, error: error1 } = await supabase
      .from('organizations')
      .update({
        owner_id: user.id,
        member_ids: [user.id],
      })
      .eq('id', orgData.id)
      .select()
      .single()

    if (error1 && error1.message?.includes('member_ids')) {
      // If member_ids doesn't exist, try without it
      const { data: data2, error: error2 } = await supabase
        .from('organizations')
        .update({
          owner_id: user.id,
        })
        .eq('id', orgData.id)
        .select()
        .single()

      updateData = data2
      updateError = error2
    } else {
      updateData = data1
      updateError = error1
    }

    if (updateError) {
      return NextResponse.json(
        {
          error: 'Failed to update organization',
          details: updateError,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully updated Bridgeland Advisors!',
      organization: updateData,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error,
      },
      { status: 500 }
    )
  }
}
