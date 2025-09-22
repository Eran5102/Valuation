-- Complete Data Cleanup Script
-- This will remove ALL companies and valuations to give you a fresh start

-- First check what we have
DO $$
DECLARE
  company_count_before INTEGER;
  valuation_count_before INTEGER;
BEGIN
  SELECT COUNT(*) INTO company_count_before FROM companies;
  SELECT COUNT(*) INTO valuation_count_before FROM valuations;

  RAISE NOTICE 'BEFORE CLEANUP:';
  RAISE NOTICE 'Companies found: %', company_count_before;
  RAISE NOTICE 'Valuations found: %', valuation_count_before;
END $$;

-- Delete all valuations first (due to foreign key constraints)
DELETE FROM valuations;

-- Delete all companies
DELETE FROM companies;

-- Reset any sequences if needed
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS valuations_id_seq RESTART WITH 1;

-- Verify the cleanup
DO $$
DECLARE
  company_count_after INTEGER;
  valuation_count_after INTEGER;
  org_count INTEGER;
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO company_count_after FROM companies;
  SELECT COUNT(*) INTO valuation_count_after FROM valuations;
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO member_count FROM organization_members WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE 'AFTER CLEANUP:';
  RAISE NOTICE 'Companies remaining: %', company_count_after;
  RAISE NOTICE 'Valuations remaining: %', valuation_count_after;
  RAISE NOTICE '';
  RAISE NOTICE 'Your organization is preserved:';
  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE 'Active members: %', member_count;

  IF company_count_after = 0 AND valuation_count_after = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✓ SUCCESS: All data has been cleaned!';
    RAISE NOTICE 'You can now create new companies and valuations from the UI.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠ WARNING: Some data still remains. Please check manually.';
  END IF;
END $$;