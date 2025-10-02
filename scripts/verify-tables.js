// Verify database tables were created successfully
const https = require('https')

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const projectRef = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)[1]

console.log('🔍 Verifying database tables...\n')

async function checkTable(tableName) {
  return new Promise((resolve) => {
    const options = {
      hostname: `${projectRef}.supabase.co`,
      path: `/rest/v1/${tableName}?limit=1`,
      method: 'HEAD',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve({ table: tableName, exists: true, status: res.statusCode })
      } else if (res.statusCode === 404) {
        resolve({ table: tableName, exists: false, status: res.statusCode })
      } else {
        resolve({ table: tableName, exists: false, status: res.statusCode, error: true })
      }
    })

    req.on('error', () => {
      resolve({ table: tableName, exists: false, error: true })
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve({ table: tableName, exists: false, timeout: true })
    })

    req.end()
  })
}

async function verifyAllTables() {
  const tables = ['share_classes', 'options_warrants', 'valuation_assumptions']

  const results = []

  for (const table of tables) {
    const result = await checkTable(table)
    results.push(result)

    if (result.exists) {
      console.log(`✅ ${table.padEnd(25)} - EXISTS`)
    } else if (result.timeout) {
      console.log(`⏱️  ${table.padEnd(25)} - TIMEOUT (check manually)`)
    } else if (result.error) {
      console.log(`⚠️  ${table.padEnd(25)} - ERROR (check manually)`)
    } else {
      console.log(`❌ ${table.padEnd(25)} - MISSING`)
    }
  }

  const allExist = results.every((r) => r.exists)
  const someExist = results.some((r) => r.exists)
  const hasErrors = results.some((r) => r.error || r.timeout)

  console.log('\n' + '━'.repeat(60))

  if (allExist) {
    console.log('\n🎉 SUCCESS! All tables exist!')
    console.log('\n✨ Your data will now persist across page refreshes!')
    console.log('\n📋 Next steps:')
    console.log('   1. Go to your valuation')
    console.log('   2. Add a share class with a date')
    console.log('   3. Save and refresh the page')
    console.log('   4. Verify the data persists!')
  } else if (someExist) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some tables missing')
    console.log('\n💡 Run the migration again to create missing tables')
    console.log('   See: MIGRATION_INSTRUCTIONS.md')
  } else if (hasErrors) {
    console.log('\n⚠️  Cannot verify - Network or permission issues')
    console.log('\n💡 Check manually in Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/' + projectRef + '/editor')
  } else {
    console.log('\n❌ MIGRATION NOT RUN - All tables missing!')
    console.log('\n📋 Follow these steps:')
    console.log('   1. Read: MIGRATION_INSTRUCTIONS.md')
    console.log('   2. Open Supabase SQL Editor')
    console.log('   3. Run: supabase/migrations/19_create_cap_table_and_assumptions_tables.sql')
  }

  console.log('\n' + '━'.repeat(60) + '\n')
}

verifyAllTables()
