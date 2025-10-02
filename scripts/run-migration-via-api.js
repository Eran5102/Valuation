// Run migration via API endpoint
const fs = require('fs')

async function runMigration() {
  try {
    console.log('🚀 Running migration via API...\n')

    const response = await fetch('http://localhost:4005/api/admin/run-migration', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer run-migration-now',
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (response.ok) {
      console.log(result.message)
      console.log('\n📊 Migration Details:')
      console.log(`   Total statements: ${result.details.total_statements}`)
      console.log(`   ✅ Successful: ${result.details.successful}`)
      console.log(`   ❌ Failed: ${result.details.failed}`)

      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:')
        result.errors.forEach((err) => {
          console.log(`   Statement ${err.statement}: ${err.error}`)
        })
      }

      if (result.success) {
        console.log('\n✨ Database tables created successfully!')
        console.log('\n📋 Tables created:')
        console.log('   - share_classes (with round_date)')
        console.log('   - options_warrants (with grant_date)')
        console.log('   - valuation_assumptions (with 50+ fields)')
        console.log('\n🔐 RLS policies enabled')
        console.log('\n✅ Your data will now persist!')
      }
    } else {
      console.error('❌ Migration failed:', result.error)
      if (result.instructions) {
        console.log('\n💡 Manual migration steps:')
        result.instructions.forEach((step) => console.log(`   ${step}`))
      }
    }
  } catch (err) {
    console.error('\n❌ Error running migration:', err.message)
    console.log('\n💡 Alternative: Run migration manually in Supabase Dashboard')
    console.log('   1. Go to: https://supabase.com/dashboard/project/sfirooxwybfcgresqnpq/sql')
    console.log('   2. Click "New Query"')
    console.log(
      '   3. Copy contents of: supabase/migrations/19_create_cap_table_and_assumptions_tables.sql'
    )
    console.log('   4. Paste and click "Run"')
  }
}

// Check if server is running
console.log('⏳ Checking if dev server is running on http://localhost:4005...\n')

fetch('http://localhost:4005/api/admin/run-migration')
  .then(() => {
    console.log('✅ Server is running!\n')
    runMigration()
  })
  .catch(() => {
    console.error('❌ Dev server not running on port 4005')
    console.log('\nPlease:')
    console.log('1. Make sure "npm run dev" is running')
    console.log('2. Or run migration manually in Supabase Dashboard:')
    console.log('   → https://supabase.com/dashboard/project/sfirooxwybfcgresqnpq/sql')
    process.exit(1)
  })
