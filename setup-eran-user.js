const { createClient } = require('@supabase/supabase-js')

// Test environment credentials from .env.test.local
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setup() {
  console.log('Connecting to test database:', supabaseUrl)

  console.log('\n=== Step 1: Find Value8 organization ===')

  let { data: value8Org, error: value8Error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'value8')
    .single()

  if (value8Error || !value8Org) {
    console.log('Value8 organization not found by slug, checking all organizations...')

    const { data: allOrgs, error: allOrgsError } = await supabase.from('organizations').select('*')

    if (allOrgsError) {
      console.error('Error fetching organizations:', allOrgsError)
      return
    }

    console.log('Available organizations:', allOrgs)

    // Try to find by name
    value8Org = allOrgs?.find((org) => org.name?.toLowerCase().includes('value8'))

    if (!value8Org) {
      console.log('Creating Value8 organization...')
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Value8',
          slug: 'value8-test',
          industry: 'Valuation Services',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating organization:', createError)
        return
      }
      value8Org = newOrg
    }
  }

  console.log('✓ Using organization:', {
    id: value8Org.id,
    name: value8Org.name,
    slug: value8Org.slug,
  })

  console.log('\n=== Step 2: Find eran@value8.ai user ===')

  const {
    data: { users },
    error: usersError,
  } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('Error listing users:', usersError)
    return
  }

  console.log(`Found ${users.length} total users`)

  let eranUser = users.find((u) => u.email === 'eran@value8.ai')

  if (!eranUser) {
    console.log('❌ User eran@value8.ai not found')
    console.log('Available users:')
    users.forEach((u) => console.log(`  - ${u.email} (${u.id})`))

    console.log('\n=== Creating user eran@value8.ai ===')

    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: 'eran@value8.ai',
      password: 'TempPassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Eran',
        role: 'admin',
      },
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return
    }

    eranUser = newUser.user
    console.log('✓ Created user eran@value8.ai')
    console.log('  Temporary password: TempPassword123!')
    console.log('  User ID:', eranUser.id)
  } else {
    console.log('✓ User eran@value8.ai found:', eranUser.id)
  }

  console.log('\n=== Step 3: Check organization membership ===')

  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', value8Org.id)
    .eq('user_id', eranUser.id)
    .maybeSingle()

  if (!membership) {
    console.log('Adding user to organization...')

    const { error: addMemberError } = await supabase.from('organization_members').insert({
      organization_id: value8Org.id,
      user_id: eranUser.id,
      role: 'admin',
      is_active: true,
    })

    if (addMemberError) {
      console.error('Error adding user to organization:', addMemberError)
      return
    }
    console.log('✓ Added user to organization as admin')
  } else {
    console.log('✓ User is already a member with role:', membership.role)
  }

  console.log('\n=== Step 4: Update clients to belong to organization ===')

  const { data: updateClients, error: updateClientsError } = await supabase
    .from('clients')
    .update({ organization_id: value8Org.id })
    .is('organization_id', null)
    .select()

  if (updateClientsError) {
    console.error('Error updating clients:', updateClientsError)
  } else {
    console.log(`✓ Updated ${updateClients?.length || 0} clients`)
  }

  console.log('\n=== Step 5: Update valuations to belong to organization ===')

  const { data: updateVals, error: updateValsError } = await supabase
    .from('valuations')
    .update({ organization_id: value8Org.id })
    .is('organization_id', null)
    .select()

  if (updateValsError) {
    console.error('Error updating valuations:', updateValsError)
  } else {
    console.log(`✓ Updated ${updateVals?.length || 0} valuations`)
  }

  console.log('\n✅ Setup complete!')
  console.log('\nLogin credentials:')
  console.log('  Email: eran@value8.ai')
  console.log('  Password: TempPassword123! (if user was just created)')
  console.log('\nOrganization:', value8Org.name)
  console.log('User role: admin')
}

setup().catch(console.error)
