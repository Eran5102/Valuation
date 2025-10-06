const { createClient } = require('@supabase/supabase-js')

// Test environment credentials
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetPassword() {
  const email = 'eran@value8.ai'
  const newPassword = 'Value8Test123!'

  console.log('Resetting password for:', email)

  // Find the user
  const {
    data: { users },
    error: usersError,
  } = await supabase.auth.admin.listUsers()
  const user = users?.find((u) => u.email === email)

  if (!user) {
    console.error('User not found')
    return
  }

  console.log('Found user:', user.id)

  // Update user password
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
  })

  if (error) {
    console.error('Error updating password:', error)
    return
  }

  console.log('\n✅ Password reset successful!')
  console.log('\nLogin credentials:')
  console.log('  Email:', email)
  console.log('  Password:', newPassword)
  console.log('\nYou can now log in to the test environment.')
}

resetPassword().catch(console.error)
