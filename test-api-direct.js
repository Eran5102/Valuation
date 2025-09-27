// Test API directly with authentication
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('Testing API directly...')
  console.log('='.repeat(50))

  // Create client and sign in
  const supabase = createClient(supabaseUrl, anonKey)

  // Sign in as the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'eran@bridgeland-advisors.com',
    password: 'Sandking2',
  })

  if (authError) {
    console.error('Auth error:', authError)
    return
  }

  console.log('✅ Authenticated successfully')
  console.log('User ID:', authData.user.id)

  // Get the session token
  const session = authData.session

  // Make API request with auth headers
  console.log('\n📡 Calling /api/companies with auth...')

  try {
    const response = await fetch('http://localhost:3000/api/companies', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Cookie: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })}`,
      },
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    const text = await response.text()
    console.log('\nResponse body:')

    try {
      const json = JSON.parse(text)
      console.log(JSON.stringify(json, null, 2))
    } catch {
      console.log(text)
    }
  } catch (error) {
    console.error('Request error:', error)
  }

  console.log('\n' + '='.repeat(50))
}

testAPI()
