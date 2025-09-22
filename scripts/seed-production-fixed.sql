-- Fixed Production Seed Script for 409A Valuation Platform
-- This script creates initial sample data matching the actual database structure

-- Get the first authenticated user's ID (you)
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_company_id BIGINT;
  v_company_id2 BIGINT;
  v_company_id3 BIGINT;
BEGIN
  -- Get the first user (should be you after logging in)
  SELECT id INTO v_user_id
  FROM auth.users
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated users found. Please sign up/login first.';
    RETURN;
  END IF;

  -- Get or create organization for the user
  SELECT om.organization_id INTO v_org_id
  FROM organization_members om
  WHERE om.user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    -- Create organization if it doesn't exist
    INSERT INTO organizations (name, created_by)
    VALUES ('My Organization', v_user_id)
    RETURNING id INTO v_org_id;

    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role, is_active)
    VALUES (v_org_id, v_user_id, 'org_owner', true);

    RAISE NOTICE 'Created new organization: %', v_org_id;
  ELSE
    RAISE NOTICE 'Using existing organization: %', v_org_id;
  END IF;

  -- Create sample companies with correct columns
  INSERT INTO companies (name, industry, stage, headquarters, status, organization_id)
  VALUES
    ('TechStart Inc', 'Technology', 'seed', 'San Francisco, CA', 'active', v_org_id),
    ('FinanceApp Ltd', 'Financial Services', 'series_a', 'New York, NY', 'active', v_org_id),
    ('HealthTech Solutions', 'Healthcare', 'series_b', 'Boston, MA', 'active', v_org_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_company_id;

  -- Get the company IDs
  SELECT id INTO v_company_id FROM companies WHERE name = 'TechStart Inc' AND organization_id = v_org_id LIMIT 1;
  SELECT id INTO v_company_id2 FROM companies WHERE name = 'FinanceApp Ltd' AND organization_id = v_org_id LIMIT 1;
  SELECT id INTO v_company_id3 FROM companies WHERE name = 'HealthTech Solutions' AND organization_id = v_org_id LIMIT 1;

  -- Create sample valuations if we have companies
  IF v_company_id IS NOT NULL THEN
    -- Completed valuation for TechStart Inc
    INSERT INTO valuations (
      company_id,
      valuation_date,
      valuation_type,
      purpose,
      status,
      fair_market_value,
      common_price_per_share,
      preferred_price_per_share,
      report_date,
      next_review,
      organization_id,
      assigned_appraiser,
      created_at,
      updated_at
    )
    VALUES
      (
        v_company_id,
        CURRENT_DATE - INTERVAL '30 days',
        '409a',
        'Stock option grants',
        'completed',
        5000000.00,
        0.15,
        1.25,
        CURRENT_DATE - INTERVAL '15 days',
        CURRENT_DATE + INTERVAL '335 days',
        v_org_id,
        v_user_id,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '15 days'
      )
    ON CONFLICT DO NOTHING;

    -- In-progress valuation for TechStart Inc
    INSERT INTO valuations (
      company_id,
      valuation_date,
      valuation_type,
      purpose,
      status,
      organization_id,
      assigned_appraiser,
      created_at,
      updated_at
    )
    VALUES
      (
        v_company_id,
        CURRENT_DATE,
        '409a',
        'Year-end valuation',
        'in_progress',
        v_org_id,
        v_user_id,
        NOW() - INTERVAL '5 days',
        NOW()
      )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add valuations for FinanceApp Ltd
  IF v_company_id2 IS NOT NULL THEN
    INSERT INTO valuations (
      company_id,
      valuation_date,
      valuation_type,
      purpose,
      status,
      fair_market_value,
      common_price_per_share,
      report_date,
      organization_id,
      assigned_appraiser,
      created_at,
      updated_at
    )
    VALUES (
      v_company_id2,
      CURRENT_DATE - INTERVAL '60 days',
      '409a',
      'Series A financing',
      'completed',
      25000000.00,
      0.85,
      CURRENT_DATE - INTERVAL '45 days',
      v_org_id,
      v_user_id,
      NOW() - INTERVAL '60 days',
      NOW() - INTERVAL '45 days'
    )
    ON CONFLICT DO NOTHING;

    -- Draft valuation for FinanceApp Ltd
    INSERT INTO valuations (
      company_id,
      valuation_date,
      valuation_type,
      status,
      organization_id,
      created_at,
      updated_at
    )
    VALUES (
      v_company_id2,
      CURRENT_DATE + INTERVAL '30 days',
      '409a',
      'draft',
      v_org_id,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add valuation for HealthTech Solutions
  IF v_company_id3 IS NOT NULL THEN
    INSERT INTO valuations (
      company_id,
      valuation_date,
      valuation_type,
      purpose,
      status,
      fair_market_value,
      common_price_per_share,
      preferred_price_per_share,
      organization_id,
      assigned_appraiser,
      next_review,
      created_at,
      updated_at
    )
    VALUES (
      v_company_id3,
      CURRENT_DATE - INTERVAL '90 days',
      '409a',
      'Series B round',
      'completed',
      75000000.00,
      2.35,
      12.50,
      v_org_id,
      v_user_id,
      CURRENT_DATE + INTERVAL '275 days',
      NOW() - INTERVAL '90 days',
      NOW() - INTERVAL '75 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Sample data created successfully';
  RAISE NOTICE 'Companies created: TechStart Inc (ID: %), FinanceApp Ltd (ID: %), HealthTech Solutions (ID: %)', v_company_id, v_company_id2, v_company_id3;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sample data: %', SQLERRM;
    RAISE;
END $$;

-- Verify the data was created
SELECT 'Summary of created data:' as info;

SELECT 'Companies' as table_name, COUNT(*) as count
FROM companies
WHERE name IN ('TechStart Inc', 'FinanceApp Ltd', 'HealthTech Solutions')
UNION ALL
SELECT 'Valuations', COUNT(*)
FROM valuations v
JOIN companies c ON v.company_id = c.id
WHERE c.name IN ('TechStart Inc', 'FinanceApp Ltd', 'HealthTech Solutions')
UNION ALL
SELECT 'Organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'Organization Members', COUNT(*) FROM organization_members
ORDER BY table_name;