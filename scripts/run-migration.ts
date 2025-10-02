import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  try {
    console.log('📦 Reading migration file...')

    // Read the migration SQL file
    const migrationPath = join(
      process.cwd(),
      'supabase',
      'migrations',
      '19_create_cap_table_and_assumptions_tables.sql'
    )
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Executing migration...')

    // Execute the SQL using Supabase's SQL endpoint
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
    console.log('📊 Tables created:')
    console.log('   - share_classes')
    console.log('   - options_warrants')
    console.log('   - valuation_assumptions')
    console.log('\n🔐 RLS policies enabled and configured')
    console.log('\n✨ Database is now ready for data persistence!')
  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

runMigration()
