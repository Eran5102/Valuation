const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSPolicies() {
  // Query pg_policies to see RLS policies
  const { data: policies, error } = await supabase.rpc('get_policies')

  if (error) {
    console.log('RPC not available, checking manually...\n')

    // Try to query clients as authenticated user
    const testEmail = 'eran@value8.ai'
    const testPassword = 'Value8Test123!'

    // Create a client with user auth
    const testSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const { data: authData, error: authError } = await testSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (authError) {
      console.error('❌ Auth error:', authError.message)
      return
    }

    console.log('✅ Authenticated as:', testEmail)
    console.log('   User ID:', authData.user.id)

    // Try to fetch clients
    const { data: clients, error: clientError } = await testSupabase.from('clients').select('*')

    console.log('\n📊 Clients visible to user:', clients?.length || 0)
    if (clientError) {
      console.error('❌ Error fetching clients:', clientError.message)
      console.error('   Details:', clientError)
    } else if (clients && clients.length > 0) {
      clients.forEach((c) => {
        console.log(`   - ${c.name} (org: ${c.organization_id})`)
      })
    } else {
      console.log('❌ No clients visible despite user being authenticated')
    }

    // Try to fetch valuations
    const { data: valuations, error: valError } = await testSupabase.from('valuations').select('*')

    console.log('\n📈 Valuations visible to user:', valuations?.length || 0)
    if (valError) {
      console.error('❌ Error fetching valuations:', valError.message)
      console.error('   Details:', valError)
    } else if (valuations && valuations.length > 0) {
      valuations.forEach((v) => {
        console.log(`   - Status: ${v.status} (org: ${v.organization_id})`)
      })
    } else {
      console.log('❌ No valuations visible')
    }
  }
}

checkRLSPolicies().catch(console.error)
