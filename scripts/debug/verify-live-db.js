const { createClient } = require('@supabase/supabase-js')

// This should match what you configured in Vercel
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTMwMTEsImV4cCI6MjA3NDcyOTAxMX0.jA03JNPAhgPWieJhKFGxIeXD51808ovb9HMrULRl5vw'

console.log('Testing connection to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyData() {
  // Check what's in the database
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, name, organization_id')
    .limit(10)

  console.log('\n📊 Clients in database:', clients?.length || 0)
  if (clientError) {
    console.error('❌ Client error:', clientError.message)
  } else if (clients) {
    clients.forEach((c) => {
      console.log(`   - ${c.name} (org: ${c.organization_id})`)
    })
  }

  // Check valuations
  const { data: valuations, error: valError } = await supabase
    .from('valuations')
    .select('id, organization_id, status')
    .limit(10)

  console.log('\n📈 Valuations in database:', valuations?.length || 0)
  if (valError) {
    console.error('❌ Valuation error:', valError.message)
  } else if (valuations) {
    valuations.forEach((v) => {
      console.log(
        `   - ID: ${v.id.substring(0, 8)}... (org: ${v.organization_id}, status: ${v.status})`
      )
    })
  }

  // Check organizations
  const { data: orgs } = await supabase.from('organizations').select('*')

  console.log('\n🏢 Organizations:', orgs?.length || 0)
  orgs?.forEach((org) => {
    console.log(`   - ${org.name} (${org.id})`)
  })

  // Check if eran@value8.ai user exists and their org membership
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, role, organizations(name)')
    .limit(10)

  console.log('\n👥 Organization members:', members?.length || 0)
  if (members) {
    members.forEach((m) => {
      console.log(
        `   - User ${m.user_id.substring(0, 8)}... in ${m.organizations?.name} (${m.role})`
      )
    })
  }
}

verifyData().catch(console.error)
