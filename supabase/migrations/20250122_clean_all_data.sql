-- Clean ALL existing data from companies and valuations
-- This will give you a completely fresh start

-- First, delete all valuations (due to foreign key constraints)
DELETE FROM valuations;

-- Then, delete all companies
DELETE FROM companies;

-- Verify the cleanup
DO $$
DECLARE
  company_count INTEGER;
  valuation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO company_count FROM companies;
  SELECT COUNT(*) INTO valuation_count FROM valuations;

  RAISE NOTICE 'Data cleanup complete!';
  RAISE NOTICE 'Companies remaining: %', company_count;
  RAISE NOTICE 'Valuations remaining: %', valuation_count;
END $$;