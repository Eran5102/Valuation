const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Test environment credentials
const supabaseUrl = 'https://sfirooxwybfcgresqnpq.supabase.co'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJvb3h3eWJmY2dyZXNxbnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1MzAxMSwiZXhwIjoyMDc0NzI5MDExfQ.O0ueNo-0ow4ptbVNMDXKFx1A8XGulis6GEQCuj2TqlE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      'supabase',
      'migrations',
      '24_add_organization_support.sql'
    )
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('Running migration: 24_add_organization_support.sql')
    console.log('Target database:', supabaseUrl)

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      console.log(`Executing ${statements.length} statements...`)

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i]
        console.log(`\nStatement ${i + 1}/${statements.length}:`)

        const result = await supabase.rpc('query', { query_text: stmt + ';' })
        if (result.error) {
          console.error(`Error in statement ${i + 1}:`, result.error)
          throw result.error
        }
        console.log('✓ Success')
      }

      return { data: 'Migration executed successfully', error: null }
    })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('\n✓ Migration completed successfully!')
    console.log('\nChecking if eran@value8.ai user exists...')

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('Error checking users:', userError)
    } else {
      const eranUser = users.users?.find((u) => u.email === 'eran@value8.ai')
      if (eranUser) {
        console.log('✓ User eran@value8.ai exists:', eranUser.id)
      } else {
        console.log('⚠ User eran@value8.ai not found in auth.users')
        console.log(
          'Available users:',
          users.users?.map((u) => u.email)
        )
      }
    }
  } catch (err) {
    console.error('Error running migration:', err)
    process.exit(1)
  }
}

runMigration()
