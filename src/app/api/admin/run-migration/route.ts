import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with admin token
    const authHeader = request.headers.get('authorization')
    const adminToken = process.env.ADMIN_MIGRATION_TOKEN || 'run-migration-now'

    if (authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      'supabase',
      'migrations',
      '19_create_cap_table_and_assumptions_tables.sql'
    )
    const sql = readFileSync(migrationPath, 'utf-8')

    // Create admin Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Split SQL into statements and execute each
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    const results = []
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      try {
        // Execute SQL using Supabase's direct query
        const { data, error } = await supabase
          .rpc('exec_sql', {
            query: statement,
          })
          .single()

        if (error) {
          errors.push({ statement: i + 1, error: error.message })
        } else {
          results.push({ statement: i + 1, success: true })
        }
      } catch (err: any) {
        errors.push({ statement: i + 1, error: err.message })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message:
        errors.length === 0
          ? '✅ Migration completed successfully!'
          : `⚠️ Migration completed with ${errors.length} errors`,
      results,
      errors,
      details: {
        total_statements: statements.length,
        successful: results.length,
        failed: errors.length,
      },
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
        instructions: [
          '1. Go to Supabase Dashboard → SQL Editor',
          '2. Open: supabase/migrations/19_create_cap_table_and_assumptions_tables.sql',
          '3. Copy all contents and paste into SQL Editor',
          '4. Click Run',
        ],
      },
      { status: 500 }
    )
  }
}

// GET endpoint with instructions
export async function GET() {
  return NextResponse.json({
    message: 'Migration API Endpoint',
    instructions: [
      'To run migration via API:',
      'POST /api/admin/run-migration',
      'Header: Authorization: Bearer run-migration-now',
      '',
      'Or manually:',
      '1. Go to Supabase Dashboard → SQL Editor',
      '2. Open: supabase/migrations/19_create_cap_table_and_assumptions_tables.sql',
      '3. Copy all contents and execute',
    ],
    migration_file: 'supabase/migrations/19_create_cap_table_and_assumptions_tables.sql',
  })
}
