-- Check what tables exist and in which schemas
SELECT
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name ILIKE '%organization%'
ORDER BY table_schema, table_name;

-- Check if there's a table called "All organizations"
SELECT
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name = 'All organizations'
   OR table_name = 'organizations';

-- Show columns for organizations table in public schema
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
ORDER BY ordinal_position;