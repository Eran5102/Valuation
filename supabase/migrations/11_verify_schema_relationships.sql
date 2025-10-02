-- ============================================
-- VERIFY COMPLETE SCHEMA RELATIONSHIPS
-- ============================================
-- This checks all the multi-tenant relationships

-- 1. Check companies table structure (clients)
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- 2. Check valuations table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'valuations'
ORDER BY ordinal_position;

-- 3. Check for team member assignment tables
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%assignment%'
    OR table_name LIKE '%team%'
    OR table_name LIKE '%member%'
  )
ORDER BY table_name, ordinal_position;

-- 4. Check foreign key relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('companies', 'valuations', 'organization_members')
ORDER BY tc.table_name, kcu.column_name;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  SCHEMA VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the output above for:';
  RAISE NOTICE '  1. Companies table structure';
  RAISE NOTICE '  2. Valuations table structure';
  RAISE NOTICE '  3. Team member assignment tables';
  RAISE NOTICE '  4. Foreign key relationships';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected relationships:';
  RAISE NOTICE '  - companies → organization_id';
  RAISE NOTICE '  - valuations → company_id';
  RAISE NOTICE '  - valuations → organization_id';
  RAISE NOTICE '  - organization_members → organization_id';
  RAISE NOTICE '  - (possibly) member assignments to clients/valuations';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;