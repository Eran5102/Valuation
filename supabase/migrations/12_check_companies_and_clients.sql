-- Check both companies and clients tables
-- There might be confusion between these two

-- Check if companies table exists and its columns
SELECT
  'COMPANIES TABLE' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- Check if clients table exists and its columns
SELECT
  'CLIENTS TABLE' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Check all *company* and *client* related tables
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%compan%' OR table_name LIKE '%client%')
ORDER BY table_name;

-- Check for assignment-related columns in companies
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'clients')
  AND (
    column_name IN ('organization_id', 'assigned_to', 'team_members', 'assigned_users')
    OR column_name LIKE '%assign%'
    OR column_name LIKE '%team%'
  )
ORDER BY table_name, column_name;

-- Check for assignment-related columns in valuations
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'valuations'
  AND (
    column_name IN ('organization_id', 'assigned_to', 'team_members', 'assigned_users', 'company_id', 'client_id')
    OR column_name LIKE '%assign%'
    OR column_name LIKE '%team%'
  )
ORDER BY column_name;