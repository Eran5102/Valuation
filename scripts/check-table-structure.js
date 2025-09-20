const { createClient } = require('@supabase/supabase-js');

// Use the environment variables directly
const supabaseUrl = 'https://xxqdqqglkemclosqzswh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cWRxcWdsa2VtY2xvc3F6c3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc1MTc1NCwiZXhwIjoyMDczMzI3NzU0fQ.RZ0dy1vyr8b1lEgU-z7kt_F83xOV_Rxueimz344lEyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('Checking report_templates table structure...');

    // First, let's see what data is currently in the table
    const { data: tableData, error: tableError } = await supabase
      .from('report_templates')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Error querying table:', tableError);
      return;
    }

    console.log('Current table data sample:');
    console.log(JSON.stringify(tableData, null, 2));

    if (tableData && tableData.length > 0) {
      console.log('\nTable column names:');
      Object.keys(tableData[0]).forEach(column => {
        console.log(`- ${column}`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkTables();