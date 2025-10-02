-- Audit the clients table to see what assignment columns exist

-- Show all columns in clients table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Check specifically for key columns
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'organization_id') THEN '✓'
    ELSE '✗'
  END as has_organization_id,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'assigned_to') THEN '✓'
    ELSE '✗'
  END as has_assigned_to,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'team_members') THEN '✓'
    ELSE '✗'
  END as has_team_members;

-- Check valuations table for assignment columns
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valuations' AND column_name = 'organization_id') THEN '✓'
    ELSE '✗'
  END as has_organization_id,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valuations' AND column_name = 'client_id') THEN '✓'
    ELSE '✗'
  END as has_client_id,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valuations' AND column_name = 'assigned_to') THEN '✓'
    ELSE '✗'
  END as has_assigned_to,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valuations' AND column_name = 'team_members') THEN '✓'
    ELSE '✗'
  END as has_team_members;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  CLIENTS TABLE AUDIT COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the output above to see:';
  RAISE NOTICE '  1. All columns in clients table';
  RAISE NOTICE '  2. Assignment column status';
  RAISE NOTICE '  3. Valuations column status';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;