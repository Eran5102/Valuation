// Test script to check client visibility and super admin status
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testClientVisibility() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found')
    return
  }

  console.log('Testing Client Visibility and Super Admin Status...')
  console.log('='.repeat(50))

  // Create service client (bypasses RLS)
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Step 1: Check your super admin status
    console.log('\n1. Checking your super admin status...')

    const { data: userProfile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('id, email, is_super_admin')
      .eq('email', 'eran@bridgeland-advisors.com')
      .single()

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError.message)
    } else if (userProfile) {
      console.log('✅ Your profile:')
      console.log('   Email:', userProfile.email || 'Not set')
      console.log('   Super Admin:', userProfile.is_super_admin ? '✅ YES' : '❌ NO')
      console.log('   User ID:', userProfile.id)
    } else {
      console.log('❌ No profile found for eran@bridgeland-advisors.com')
    }

    // Step 2: Check if auth.users has your email
    console.log('\n2. Checking auth.users table...')
    const { data: authUser, error: authError } = await serviceClient
      .from('auth.users')
      .select('id, email')
      .eq('email', 'eran@bridgeland-advisors.com')
      .single()

    if (authError) {
      console.error('❌ Error fetching auth user:', authError.message)
    } else if (authUser) {
      console.log('✅ Auth user found:')
      console.log('   Email:', authUser.email)
      console.log('   ID:', authUser.id)
    }

    // Step 3: Check all companies in the database
    console.log('\n3. Checking all companies in database...')

    const { data: allCompanies, error: companiesError } = await serviceClient
      .from('companies')
      .select('id, name, organization_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError.message)
    } else {
      console.log(`✅ Found ${allCompanies?.length || 0} recent companies:`)
      if (allCompanies && allCompanies.length > 0) {
        allCompanies.forEach((c) => {
          const createdDate = new Date(c.created_at).toLocaleString()
          console.log(`   - ${c.name} (Created: ${createdDate})`)
          console.log(`     Organization: ${c.organization_id || 'NO ORGANIZATION'}`)
        })
      }
    }

    // Step 4: Look specifically for test client 9.27
    console.log('\n4. Looking for "test client 9.27"...')

    const { data: testClient, error: testError } = await serviceClient
      .from('companies')
      .select('*')
      .or('name.ilike.%9.27%,name.ilike.%test client%')

    if (testError) {
      console.error('❌ Error searching for test client:', testError.message)
    } else if (testClient && testClient.length > 0) {
      console.log(`✅ Found ${testClient.length} matching clients:`)
      testClient.forEach((c) => {
        console.log(`   - ${c.name}`)
        console.log(`     ID: ${c.id}`)
        console.log(`     Organization: ${c.organization_id || 'NO ORGANIZATION'}`)
        console.log(`     Created: ${new Date(c.created_at).toLocaleString()}`)
      })
    } else {
      console.log('❌ No client found with name containing "9.27" or "test client"')
    }

    // Step 5: Check your organization
    console.log('\n5. Checking your organization...')

    const { data: membership, error: memError } = await serviceClient
      .from('organization_members')
      .select('organization_id, role, organizations(name)')
      .eq('user_id', userProfile?.id)
      .single()

    if (memError) {
      console.error('❌ Error fetching membership:', memError.message)
    } else if (membership) {
      console.log('✅ Your organization membership:')
      console.log('   Organization:', membership.organizations?.name)
      console.log('   Organization ID:', membership.organization_id)
      console.log('   Your Role:', membership.role)
    }

    // Step 6: Check companies in your organization
    if (membership?.organization_id) {
      console.log('\n6. Checking companies in your organization...')

      const { data: orgCompanies, error: orgError } = await serviceClient
        .from('companies')
        .select('name, created_at')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false })

      if (orgError) {
        console.error('❌ Error fetching org companies:', orgError.message)
      } else {
        console.log(`✅ Found ${orgCompanies?.length || 0} companies in your organization:`)
        if (orgCompanies && orgCompanies.length > 0) {
          orgCompanies.forEach((c) => {
            console.log(`   - ${c.name} (${new Date(c.created_at).toLocaleDateString()})`)
          })
        }
      }
    }

    // Step 7: Check RLS policies on companies table
    console.log('\n7. Checking RLS policies on companies table...')

    const { data: policies, error: policiesError } = await serviceClient
      .from('pg_policies')
      .select('policyname, roles, cmd')
      .eq('tablename', 'companies')
      .eq('schemaname', 'public')

    if (policiesError) {
      console.error('❌ Error fetching policies:', policiesError.message)
    } else {
      console.log(`✅ Found ${policies?.length || 0} policies on companies table:`)
      if (policies && policies.length > 0) {
        policies.forEach((p) => {
          console.log(`   - ${p.policyname} (${p.cmd})`)
        })
      }
    }
  } catch (err) {
    console.error('❌ Test failed with error:', err.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('Diagnostic Summary:')
  console.log('1. Check if your client was created in the database')
  console.log('2. Verify your super admin status is true')
  console.log('3. Ensure the client has an organization_id')
  console.log('4. Check that RLS policies are properly configured')
}

testClientVisibility()
