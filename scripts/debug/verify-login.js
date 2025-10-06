const { createClient } = require('@supabase/supabase-js')

// Test environment credentials
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTMwMTEsImV4cCI6MjA3NDcyOTAxMX0.jA03JNPAhgPWieJhKFGxIeXD51808ovb9HMrULRl5vw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyLogin() {
  console.log('Verifying login...\n')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'eran@value8.ai',
    password: 'Value8Test123!',
  })

  if (error) {
    console.error('❌ Login failed:', error.message)
    return
  }

  console.log('✅ Login successful!')
  console.log('\nUser details:')
  console.log('  Email:', data.user.email)
  console.log('  User ID:', data.user.id)
  console.log('  Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No')

  // Check organization membership
  console.log('\nFetching organization membership...')

  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*, organizations(*)')
    .eq('user_id', data.user.id)
    .single()

  if (memberError) {
    console.error('Error fetching membership:', memberError)
  } else {
    console.log('\n✓ Organization membership:')
    console.log('  Organization:', membership.organizations.name)
    console.log('  Role:', membership.role)
    console.log('  Active:', membership.is_active)
  }

  // Sign out
  await supabase.auth.signOut()
  console.log('\n✓ Signed out successfully')
}

verifyLogin().catch(console.error)
