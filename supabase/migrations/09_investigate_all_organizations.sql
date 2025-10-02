-- Check if all_organizations has any data
SELECT COUNT(*) as row_count FROM public.all_organizations;

-- Check the columns in all_organizations
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'all_organizations'
ORDER BY ordinal_position;

-- Check if it's a view or table
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'all_organizations';

-- Check if any code references all_organizations
-- (We'll need to check the codebase separately)

-- Since it appears to be unused, let's see if we can safely drop it
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ALL_ORGANIZATIONS TABLE ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This table appears to be unused.';
  RAISE NOTICE 'If it has no data and no references,';
  RAISE NOTICE 'we can safely drop it.';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the output above for:';
  RAISE NOTICE '  - Row count (should be 0)';
  RAISE NOTICE '  - Column structure';
  RAISE NOTICE '  - Table type';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;