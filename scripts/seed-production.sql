-- Production Seed Script for 409A Valuation Platform
-- This script creates initial sample data for testing in production
-- Run this in your Supabase SQL editor after running the RBAC migration

-- Get the first authenticated user's ID (you)
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_company_id UUID;
BEGIN
  -- Get the first user (should be you after logging in)
  SELECT id INTO v_user_id
  FROM auth.users
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated users found. Please sign up/login first.';
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
  END IF;

  -- Create sample companies
  INSERT INTO companies (name, industry, stage, state, status, founded_date, employee_count)
  VALUES
    ('TechStart Inc', 'Technology', 'seed', 'CA', 'active', '2022-01-15', 15),
    ('FinanceApp Ltd', 'Financial Services', 'series_a', 'NY', 'active', '2021-06-01', 35),
    ('HealthTech Solutions', 'Healthcare', 'series_b', 'MA', 'active', '2020-03-10', 75)
  ON CONFLICT DO NOTHING;

  -- Get the first company ID
  SELECT id INTO v_company_id
  FROM companies
  WHERE name = 'TechStart Inc'
  LIMIT 1;

  -- Create sample valuations if we have a company
  IF v_company_id IS NOT NULL THEN
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
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '15 days'
      ),
      (
        v_company_id,
        CURRENT_DATE,
        '409a',
        'Year-end valuation',
        'in_progress',
        NULL,
        NULL,
        NULL,
        NULL,
        CURRENT_DATE + INTERVAL '365 days',
        NOW() - INTERVAL '5 days',
        NOW()
      )
    ON CONFLICT DO NOTHING;

    -- Add a valuation for another company
    SELECT id INTO v_company_id
    FROM companies
    WHERE name = 'FinanceApp Ltd'
    LIMIT 1;

    IF v_company_id IS NOT NULL THEN
      INSERT INTO valuations (
        company_id,
        valuation_date,
        valuation_type,
        purpose,
        status,
        fair_market_value,
        common_price_per_share,
        report_date,
        created_at,
        updated_at
      )
      VALUES (
        v_company_id,
        CURRENT_DATE - INTERVAL '60 days',
        '409a',
        'Series A financing',
        'completed',
        25000000.00,
        0.85,
        CURRENT_DATE - INTERVAL '45 days',
        NOW() - INTERVAL '60 days',
        NOW() - INTERVAL '45 days'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RAISE NOTICE 'Sample data created successfully for organization %', v_org_id;
END $$;

-- Verify the data was created
SELECT 'Companies' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'Valuations', COUNT(*) FROM valuations
UNION ALL
SELECT 'Organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'Organization Members', COUNT(*) FROM organization_members;