-- Fix RLS policies for 409A valuation app tables
-- This migration sets up proper RLS policies or disables RLS for development

-- Companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all operations for companies" ON companies;

-- Create permissive policy for all operations (for development)
CREATE POLICY "Enable all operations for companies" ON companies
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Valuations table
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all operations for valuations" ON valuations;

-- Create permissive policy for all operations (for development)
CREATE POLICY "Enable all operations for valuations" ON valuations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- API requests table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_requests') THEN
        ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Enable all operations for api_requests" ON api_requests;

        CREATE POLICY "Enable all operations for api_requests" ON api_requests
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Table views table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'table_views') THEN
        ALTER TABLE table_views ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Enable all operations for table_views" ON table_views;

        CREATE POLICY "Enable all operations for table_views" ON table_views
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Note: These are permissive policies for development
-- In production, you should implement proper authentication-based policies
-- Example for production:
-- CREATE POLICY "Users can view their own companies" ON companies
--     FOR SELECT
--     USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own companies" ON companies
--     FOR INSERT
--     WITH CHECK (auth.uid() = user_id);