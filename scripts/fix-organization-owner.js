import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixOrganizationOwner() {
  try {
    // First, get your user ID by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }

    // Find your user by email
    const user = userData.users.find((u) => u.email === 'eranb@bridgeland-advisors.com')

    if (!user) {
      console.error('User not found with email: eranb@bridgeland-advisors.com')
      return
    }

    console.log('Found user:', user.id, user.email)

    // Now find the Bridgeland Advisors organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'Bridgeland Advisors')
      .single()

    if (orgError) {
      console.error('Error finding organization:', orgError)
      return
    }

    if (!orgData) {
      console.error('Bridgeland Advisors organization not found')
      return
    }

    console.log('Found organization:', orgData.name, 'Current owner:', orgData.owner_id)

    // Update the organization with your user ID as owner
    const { data: updateData, error: updateError } = await supabase
      .from('organizations')
      .update({
        owner_id: user.id,
        member_ids: [user.id], // Also add to members array
      })
      .eq('id', orgData.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return
    }

    console.log('✅ Successfully updated Bridgeland Advisors!')
    console.log('Organization now owned by:', user.email)
    console.log('Organization details:', updateData)
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixOrganizationOwner()
