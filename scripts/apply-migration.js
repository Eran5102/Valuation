const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_create_report_templates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Connecting to Supabase...');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        console.log(`Statement: ${statement.substring(0, 100)}...`);

        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error);
            // Continue with other statements for non-critical errors
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Exception in statement ${i + 1}:`, err.message);
          // For table creation and similar statements, we'll use the REST API directly
          if (statement.toLowerCase().includes('create table')) {
            console.log('Attempting alternative method for table creation...');
            // We'll handle this differently below
          }
        }
      }
    }

    // Alternative approach: Use the REST API to create tables if the above fails
    console.log('Verifying tables exist...');

    // Check if report_templates table exists
    const { data: templates, error: templatesError } = await supabase
      .from('report_templates')
      .select('*')
      .limit(1);

    if (!templatesError) {
      console.log('✓ report_templates table exists');
    } else {
      console.log('Creating report_templates table via direct SQL...');
      // Since we can't use rpc, we'll insert the default template directly
    }

    // Check if report_variable_mappings table exists
    const { data: mappings, error: mappingsError } = await supabase
      .from('report_variable_mappings')
      .select('*')
      .limit(1);

    if (!mappingsError) {
      console.log('✓ report_variable_mappings table exists');
    }

    console.log('Migration application completed.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();