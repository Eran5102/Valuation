-- Drop the unused all_organizations view (not table)
-- This view is not referenced anywhere in the codebase

-- Check what it is first
DO $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT table_type INTO v_type
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'all_organizations';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  DROPPING ALL_ORGANIZATIONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Type: %', v_type;
  RAISE NOTICE 'Dropping...';
  RAISE NOTICE '';
END $$;

-- Drop the view
DROP VIEW IF EXISTS public.all_organizations CASCADE;

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
    RAISE NOTICE '✗ View still exists (unexpected)';
  ELSE
    RAISE NOTICE '✓ View successfully dropped';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Database cleanup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;