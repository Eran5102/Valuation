-- Drop the unused all_organizations table
-- This table is not referenced anywhere in the codebase

-- First check if it has any data (just for logging)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.all_organizations;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  DROPPING ALL_ORGANIZATIONS TABLE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table has % rows', v_count;
  RAISE NOTICE 'Dropping table...';
  RAISE NOTICE '';
END $$;

-- Drop the table
DROP TABLE IF EXISTS public.all_organizations CASCADE;

-- Verify it's gone
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'all_organizations'
  ) INTO v_exists;

  IF v_exists THEN
    RAISE NOTICE '✗ Table still exists (unexpected)';
  ELSE
    RAISE NOTICE '✓ Table successfully dropped';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Database cleanup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;