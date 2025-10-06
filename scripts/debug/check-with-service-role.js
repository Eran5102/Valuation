const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Checking database with SERVICE ROLE (bypasses RLS):', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkWithServiceRole() {
  // Check clients with service role (bypasses RLS)
  const { data: clients, error: clientError } = await supabase.from('clients').select('*').limit(10)

  console.log('\n📊 Clients (service role):', clients?.length || 0)
  if (clientError) {
    console.error('❌ Error:', clientError.message)
  } else if (clients && clients.length > 0) {
    console.log('✅ DATA EXISTS! Found clients:')
    clients.forEach((c) => {
      console.log(`   - ${c.name} (org: ${c.organization_id || 'no org'})`)
    })
  } else {
    console.log('❌ No clients found even with service role')
  }

  // Check valuations
  const { data: valuations, error: valError } = await supabase
    .from('valuations')
    .select('id, organization_id, status, company_id')
    .limit(10)

  console.log('\n📈 Valuations (service role):', valuations?.length || 0)
  if (valError) {
    console.error('❌ Error:', valError.message)
  } else if (valuations && valuations.length > 0) {
    console.log('✅ DATA EXISTS! Found valuations:')
    valuations.forEach((v) => {
      console.log(
        `   - Status: ${v.status}, Org: ${v.organization_id || 'no org'}, Company: ${v.company_id || 'no company'}`
      )
    })
  } else {
    console.log('❌ No valuations found even with service role')
  }
}

checkWithServiceRole().catch(console.error)
