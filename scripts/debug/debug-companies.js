const { createClient } = require('@supabase/supabase-js')

// Test environment credentials
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugCompanies() {
  console.log('Testing companies/clients query...\n')

  // Test 1: Check if clients table exists
  console.log('=== Test 1: Check clients table ===')
  const { data: clients, error: clientsError } = await supabase.from('clients').select('*').limit(5)

  if (clientsError) {
    console.error('❌ Error fetching clients:', clientsError)
  } else {
    console.log(`✓ Found ${clients?.length || 0} clients`)
    if (clients && clients.length > 0) {
      console.log('Sample client:', clients[0])
    }
  }

  // Test 2: Check if super_admins table exists
  console.log('\n=== Test 2: Check super_admins table ===')
  const { data: superAdmins, error: superAdminsError } = await supabase
    .from('super_admins')
    .select('*')
    .limit(5)

  if (superAdminsError) {
    console.error('❌ Error fetching super_admins:', superAdminsError)
    console.log('This table might not exist. Creating test query without it...')
  } else {
    console.log(`✓ Found ${superAdmins?.length || 0} super admins`)
  }

  // Test 3: Check valuations
  console.log('\n=== Test 3: Check valuations table ===')
  const { data: valuations, error: valuationsError } = await supabase
    .from('valuations')
    .select('*')
    .limit(5)

  if (valuationsError) {
    console.error('❌ Error fetching valuations:', valuationsError)
  } else {
    console.log(`✓ Found ${valuations?.length || 0} valuations`)
    if (valuations && valuations.length > 0) {
      console.log('Sample valuation columns:', Object.keys(valuations[0]))
    }
  }

  // Test 4: Check organization_members for eran user
  console.log('\n=== Test 4: Check organization membership ===')
  const userId = '27889258-c780-46da-851a-35a0b61392e4'

  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*, organizations(*)')
    .eq('user_id', userId)
    .single()

  if (memberError) {
    console.error('❌ Error fetching membership:', memberError)
  } else {
    console.log('✓ Membership found:')
    console.log('  Organization:', membership.organizations.name)
    console.log('  Organization ID:', membership.organization_id)
    console.log('  Role:', membership.role)
  }
}

debugCompanies().catch(console.error)
