-- ============================================
-- CLEAN UP OLD COMPANIES TABLES/VIEWS
-- ============================================
-- Remove companies view and companies_old table
-- The app now uses the clients table

-- Drop companies view
DROP VIEW IF EXISTS public.companies CASCADE;

-- Drop companies_old table
DROP TABLE IF EXISTS public.companies_old CASCADE;

-- Verify cleanup
DO $$
DECLARE
  v_companies_view_exists BOOLEAN;
  v_companies_old_exists BOOLEAN;
BEGIN
  -- Check if companies view exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) INTO v_companies_view_exists;

  -- Check if companies_old table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies_old'
  ) INTO v_companies_old_exists;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  CLEANUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  IF v_companies_view_exists THEN
    RAISE NOTICE '✗ companies view still exists (unexpected)';
  ELSE
    RAISE NOTICE '✓ companies view removed';
  END IF;

  IF v_companies_old_exists THEN
    RAISE NOTICE '✗ companies_old table still exists (unexpected)';
  ELSE
    RAISE NOTICE '✓ companies_old table removed';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'The app now uses only:';
  RAISE NOTICE '  - clients table (for client management)';
  RAISE NOTICE '  - valuations table (for valuations)';
  RAISE NOTICE '  - organizations table (for multi-tenancy)';
  RAISE NOTICE '  - organization_members (for team members)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;