// Execute migration using Supabase Management API
const https = require('https')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)[1]

console.log('📦 Loading migration SQL...\n')

const sqlPath = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '19_create_cap_table_and_assumptions_tables.sql'
)
const sql = fs.readFileSync(sqlPath, 'utf-8')

console.log('🔗 Supabase Project:', projectRef)
console.log('📝 SQL Length:', sql.length, 'characters\n')

// Use Supabase's database API
const options = {
  hostname: `${projectRef}.supabase.co`,
  path: '/rest/v1/rpc/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: 'return=minimal',
  },
}

const data = JSON.stringify({ query: sql })

console.log('🚀 Executing migration...\n')

const req = https.request(options, (res) => {
  let body = ''

  res.on('data', (chunk) => {
    body += chunk
  })

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
      console.log('✅ Migration executed successfully!\n')
      console.log('📊 Tables created:')
      console.log('   - share_classes')
      console.log('   - options_warrants')
      console.log('   - valuation_assumptions\n')
      console.log('🔐 RLS policies configured')
      console.log('✨ Database ready for data persistence!\n')
    } else {
      console.log('⚠️  Response status:', res.statusCode)
      console.log('Response:', body)
      console.log('\n💡 You may need to run the migration manually:')
      printManualInstructions()
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Error:', error.message, '\n')
  printManualInstructions()
})

req.write(data)
req.end()

function printManualInstructions() {
  console.log('\n📋 Manual Migration Steps:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n1. Open Supabase Dashboard:')
  console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('\n2. Click "New Query"')
  console.log('\n3. Copy the entire contents of this file:')
  console.log('   supabase/migrations/19_create_cap_table_and_assumptions_tables.sql')
  console.log('\n4. Paste into the SQL Editor')
  console.log('\n5. Click "Run" (or press Ctrl+Enter)')
  console.log('\n6. You should see "Success. No rows returned"')
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}
