-- Simple check for assignment columns

-- CLIENTS TABLE CHECK
SELECT
  'CLIENTS' as table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
  AND column_name IN ('organization_id', 'assigned_to', 'team_members')
ORDER BY column_name;

-- VALUATIONS TABLE CHECK
SELECT
  'VALUATIONS' as table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'valuations'
  AND column_name IN ('organization_id', 'client_id', 'assigned_to', 'team_members')
ORDER BY column_name;