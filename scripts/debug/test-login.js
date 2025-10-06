const { createClient } = require('@supabase/supabase-js')

// Test environment credentials
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTMwMTEsImV4cCI6MjA3NDcyOTAxMX0.jA03JNPAhgPWieJhKFGxIeXD51808ovb9HMrULRl5vw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing login for eran@value8.ai...\n')

  // First, let's check if we can reset the password
  console.log('=== Option 1: Reset password ===')
  console.log('You can reset the password by:')
  console.log('1. Going to the login page')
  console.log('2. Clicking "Forgot password"')
  console.log('3. Entering eran@value8.ai')
  console.log('4. Checking your email for reset link\n')

  // Try to sign in with a test password (this will likely fail but shows the error)
  console.log('=== Option 2: Test current password ===')

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'eran@value8.ai',
    password: 'test123', // This is just a test
  })

  if (signInError) {
    console.log('❌ Sign in failed (expected):', signInError.message)

    if (signInError.message.includes('Invalid login credentials')) {
      console.log('\nThe user exists but the password is incorrect.')
      console.log('You need to either:')
      console.log('  1. Use the password reset flow')
      console.log('  2. Or provide the correct password if you know it')
    } else if (signInError.message.includes('Email not confirmed')) {
      console.log('\nThe email needs to be confirmed.')
      console.log('Checking user confirmation status...\n')

      // Use service role to check user
      const serviceSupabase = createClient(
        supabaseUrl,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE'
      )

      const {
        data: { users },
        error: usersError,
      } = await serviceSupabase.auth.admin.listUsers()
      const user = users?.find((u) => u.email === 'eran@value8.ai')

      if (user) {
        console.log('User status:')
        console.log('  Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No')
        console.log('  Created at:', user.created_at)
        console.log('  Last sign in:', user.last_sign_in_at || 'Never')

        if (!user.email_confirmed_at) {
          console.log('\n❌ Email is not confirmed. Confirming now...')

          const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
            email_confirm: true,
          })

          if (updateError) {
            console.error('Error confirming email:', updateError)
          } else {
            console.log('✓ Email confirmed! You can now try logging in.')
          }
        }
      }
    }
  } else {
    console.log('✓ Sign in successful!')
    console.log('User:', signInData.user.email)
    console.log('Session:', signInData.session ? 'Active' : 'None')
  }

  console.log('\n=== Summary ===')
  console.log('User: eran@value8.ai')
  console.log('User ID: 27889258-c780-46da-851a-35a0b61392e4')
  console.log('Organization: Value8 (b9a35a7a-1548-4b8e-822d-2c923c7f8ab1)')
  console.log('Role: owner')
  console.log("\nIf you don't know the password, please use the password reset function.")
}

testLogin().catch(console.error)
