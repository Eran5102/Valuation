const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserOrg() {
  // Find the eran@value8.ai user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('❌ Error fetching users:', userError.message)
    return
  }

  const eranUser = users.users.find((u) => u.email === 'eran@value8.ai')

  if (!eranUser) {
    console.log('❌ User eran@value8.ai not found')
    return
  }

  console.log('✅ Found user:', eranUser.email, 'ID:', eranUser.id)

  // Check organization membership
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*, organizations(name)')
    .eq('user_id', eranUser.id)

  console.log('\n📋 Organization memberships:', membership?.length || 0)
  if (memberError) {
    console.error('❌ Error:', memberError.message)
  } else if (membership && membership.length > 0) {
    membership.forEach((m) => {
      console.log(`   - ${m.organizations?.name} (${m.organization_id}) - Role: ${m.role}`)
    })
  } else {
    console.log('❌ User has no organization memberships!')
  }

  // Check what org the data belongs to
  const { data: client } = await supabase
    .from('clients')
    .select('name, organization_id')
    .limit(1)
    .single()

  if (client) {
    console.log('\n📊 Client data belongs to org:', client.organization_id)

    // Check if this matches the user's org
    const hasAccess = membership?.some((m) => m.organization_id === client.organization_id)
    if (hasAccess) {
      console.log('✅ User IS a member of this organization')
    } else {
      console.log('❌ User is NOT a member of this organization - THIS IS THE PROBLEM!')
    }
  }
}

checkUserOrg().catch(console.error)
