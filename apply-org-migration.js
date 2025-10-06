const { createClient } = require('@supabase/supabase-js')

// Test environment credentials from .env.test.local
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('Connecting to test database:', supabaseUrl)
  console.log('\n=== Step 1: Check if organizations table exists ===')

  const { data: orgCheck, error: orgCheckError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)

  if (orgCheckError) {
    console.error(
      '❌ Organizations table does not exist or is not accessible:',
      orgCheckError.message
    )
    console.log('\nYou need to create the organizations table first.')
    return
  }

  console.log('✓ Organizations table exists')

  console.log('\n=== Step 2: Check if organization_id column exists in clients table ===')

  const { data: clientCheck, error: clientCheckError } = await supabase
    .from('clients')
    .select('id, organization_id')
    .limit(1)

  if (clientCheckError && clientCheckError.message.includes('organization_id')) {
    console.log('❌ organization_id column missing in clients table')
    console.log('\nNeed to add organization_id column to clients table')
    console.log('This requires running SQL with ALTER TABLE permissions.')
    console.log('\nPlease run the migration file manually in the Supabase SQL Editor:')
    console.log('supabase/migrations/24_add_organization_support.sql')
    return
  } else if (clientCheckError) {
    console.error('Error checking clients table:', clientCheckError)
    return
  }

  console.log('✓ organization_id column exists in clients table')

  console.log('\n=== Step 3: Check if organization_id column exists in valuations table ===')

  const { data: valCheck, error: valCheckError } = await supabase
    .from('valuations')
    .select('id, organization_id')
    .limit(1)

  if (valCheckError && valCheckError.message.includes('organization_id')) {
    console.log('❌ organization_id column missing in valuations table')
    console.log('\nPlease run the migration file manually in the Supabase SQL Editor')
    return
  } else if (valCheckError) {
    console.error('Error checking valuations table:', valCheckError)
    return
  }

  console.log('✓ organization_id column exists in valuations table')

  console.log('\n=== Step 4: Check for Value8 organization ===')

  const { data: value8Org, error: value8Error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  if (value8Error || !value8Org) {
    console.log('❌ Value8 organization not found, creating it...')

    const { error: createError } = await supabase.from('organizations').insert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Value8',
      slug: 'value8',
      industry: 'Valuation Services',
    })

    if (createError) {
      console.error('Error creating Value8 organization:', createError)
      return
    }
    console.log('✓ Created Value8 organization')
  } else {
    console.log('✓ Value8 organization exists:', value8Org.name)
  }

  console.log('\n=== Step 5: Check for eran@value8.ai user ===')

  // List users via auth admin
  const {
    data: { users },
    error: usersError,
  } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('Error listing users:', usersError)
    return
  }

  const eranUser = users.find((u) => u.email === 'eran@value8.ai')

  if (!eranUser) {
    console.log('❌ User eran@value8.ai not found')
    console.log(
      'Available users:',
      users.map((u) => ({ email: u.email, id: u.id }))
    )
    console.log('\nYou may need to create this user or check the email address')
    return
  }

  console.log('✓ User eran@value8.ai found:', eranUser.id)

  console.log('\n=== Step 6: Check organization membership ===')

  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', '00000000-0000-0000-0000-000000000001')
    .eq('user_id', eranUser.id)
    .single()

  if (memberError || !membership) {
    console.log('❌ User is not a member of Value8 organization, adding...')

    const { error: addMemberError } = await supabase.from('organization_members').insert({
      organization_id: '00000000-0000-0000-0000-000000000001',
      user_id: eranUser.id,
      role: 'admin',
      is_active: true,
    })

    if (addMemberError) {
      console.error('Error adding user to organization:', addMemberError)
      return
    }
    console.log('✓ Added user to Value8 organization')
  } else {
    console.log('✓ User is already a member with role:', membership.role)
  }

  console.log('\n=== Step 7: Update clients without organization_id ===')

  const { data: updateClients, error: updateClientsError } = await supabase
    .from('clients')
    .update({ organization_id: '00000000-0000-0000-0000-000000000001' })
    .is('organization_id', null)
    .select()

  if (updateClientsError) {
    console.error('Error updating clients:', updateClientsError)
  } else {
    console.log(`✓ Updated ${updateClients?.length || 0} clients to Value8 organization`)
  }

  console.log('\n=== Step 8: Update valuations without organization_id ===')

  const { data: updateVals, error: updateValsError } = await supabase
    .from('valuations')
    .update({ organization_id: '00000000-0000-0000-0000-000000000001' })
    .is('organization_id', null)
    .select()

  if (updateValsError) {
    console.error('Error updating valuations:', updateValsError)
  } else {
    console.log(`✓ Updated ${updateVals?.length || 0} valuations to Value8 organization`)
  }

  console.log('\n✅ Migration check and setup complete!')
  console.log('\nYou should now be able to log in with eran@value8.ai')
}

applyMigration().catch(console.error)
