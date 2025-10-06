// Test script to verify service client bypasses RLS
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
    return
  }

  console.log('Testing Supabase clients...')
  console.log('URL:', supabaseUrl)
  console.log('Service Role Key present:', !!serviceRoleKey)
  console.log('Anon Key present:', !!anonKey)

  // Create service client (should bypass RLS)
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Create anon client (subject to RLS)
  const anonClient = createClient(supabaseUrl, anonKey)

  console.log('\n--- Testing with Service Role Key (should bypass RLS) ---')
  try {
    const { data, error } = await serviceClient
      .from('report_templates')
      .select('id, name, is_system, owner_id')
      .limit(5)

    if (error) {
      console.error('❌ Service client error:', error.message)
    } else {
      console.log('✅ Service client successfully fetched templates:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('Sample:', data[0])
      }
    }
  } catch (err) {
    console.error('❌ Service client exception:', err.message)
  }

  console.log('\n--- Testing INSERT with Service Role Key ---')
  try {
    const testTemplate = {
      name: 'Test Template from Service Client',
      description: 'Testing RLS bypass',
      type: 'custom',
      is_system: false,
      is_active: true,
      owner_id: 'test-user-id', // Dummy user ID
      organization_id: 'test-org-id', // Dummy org ID
      blocks: [],
      variables_schema: {},
      branding: {
        primaryColor: '#000000',
        fontFamily: 'Arial',
      },
      version: 1,
    }

    const { data, error } = await serviceClient
      .from('report_templates')
      .insert(testTemplate)
      .select()
      .single()

    if (error) {
      console.error('❌ Service client INSERT error:', error.message, error.code)
      if (error.message.includes('row-level security')) {
        console.error('⚠️  RLS is still blocking the service client!')
      }
    } else {
      console.log('✅ Service client successfully inserted template:', data.id)

      // Clean up - delete the test template
      const { error: deleteError } = await serviceClient
        .from('report_templates')
        .delete()
        .eq('id', data.id)

      if (!deleteError) {
        console.log('✅ Test template cleaned up')
      }
    }
  } catch (err) {
    console.error('❌ Service client INSERT exception:', err.message)
  }

  console.log('\n--- Testing with Anon Key (should be subject to RLS) ---')
  try {
    const { data, error } = await anonClient.from('report_templates').select('id, name').limit(5)

    if (error) {
      console.error('⚠️  Anon client error (expected):', error.message)
    } else {
      console.log('Anon client fetched templates:', data?.length || 0)
    }
  } catch (err) {
    console.error('⚠️  Anon client exception (expected):', err.message)
  }

  console.log('\nTest complete!')
}

testServiceClient()
