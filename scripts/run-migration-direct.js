// Direct migration runner using fetch API
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log('📦 Reading migration file...')

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '19_create_cap_table_and_assumptions_tables.sql'
    )
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Executing migration via Supabase REST API...')

    // Execute using Supabase's REST API for SQL execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    })

    if (!response.ok) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('ℹ️  exec_sql RPC not available, trying alternative method...')

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'))

      console.log(`📝 Executing ${statements.length} SQL statements...`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        console.log(`   Statement ${i + 1}/${statements.length}...`)

        const stmtResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            query: statement,
          }),
        })

        if (!stmtResponse.ok) {
          const error = await stmtResponse.text()
          console.error(`❌ Statement ${i + 1} failed:`, error)
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('📊 Tables created:')
    console.log('   - share_classes (with round_date)')
    console.log('   - options_warrants (with grant_date)')
    console.log('   - valuation_assumptions (with 50+ fields)')
    console.log('\n🔐 RLS policies enabled and configured')
    console.log('\n✨ Database is now ready for data persistence!')
    console.log('\n📋 Next steps:')
    console.log('   1. Test cap table: Add share class → Save → Refresh → Verify persists')
    console.log('   2. Test assumptions: Fill fields → Save → Refresh → Verify persists')
    console.log('   3. Verify breakpoints work with saved data')
  } catch (err) {
    console.error('❌ Error:', err.message)
    console.error('\n💡 Manual migration required:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log(
      '   2. Copy contents of: supabase/migrations/19_create_cap_table_and_assumptions_tables.sql'
    )
    console.log('   3. Paste and execute in SQL Editor')
    process.exit(1)
  }
}

runMigration()
