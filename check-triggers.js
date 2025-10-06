const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTriggers() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'report_templates';
    `,
  })

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Triggers on report_templates:')
    console.log(JSON.stringify(data, null, 2))
  }
}

checkTriggers()
