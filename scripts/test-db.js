const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values from .env.local since dotenv is not available
const supabase = createClient(
  'https://xxqdqqglkemclosqzswh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cWRxcWdsa2VtY2xvc3F6c3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc1MTc1NCwiZXhwIjoyMDczMzI3NzU0fQ.RZ0dy1vyr8b1lEgU-z7kt_F83xOV_Rxueimz344lEyE'
);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('URL:', 'https://xxqdqqglkemclosqzswh.supabase.co');

    // Test basic connection by trying to access a known table
    const { data, error } = await supabase
      .from('options_warrants')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return;
    }

    console.log('✓ Database connection successful');
    console.log('Successfully accessed existing data');

    // Check if report_templates table exists by trying to query it
    console.log('Checking if report_templates table exists...');

    const { data: templates, error: templatesError } = await supabase
      .from('report_templates')
      .select('*')
      .limit(5);

    if (!templatesError) {
      console.log('✓ report_templates table exists');
      console.log(`Found ${templates.length} templates in database`);
    } else {
      console.log('✗ report_templates table does not exist');
      console.log('Error:', templatesError.message);

      // Now we need to create the table
      console.log('Creating report_templates table...');
      return;
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabase();