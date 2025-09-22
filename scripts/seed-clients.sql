-- Seed script to add sample clients to your database
-- Run this in your Supabase SQL Editor

-- First, get your user ID and organization ID (replace with your actual email)
DO $$
DECLARE
    user_id UUID;
    org_id UUID;
BEGIN
    -- Get the user ID for your email
    SELECT id INTO user_id FROM auth.users WHERE email = 'eran@bridgeland-advisors.com' LIMIT 1;

    -- Get or create organization
    SELECT id INTO org_id FROM organizations WHERE id = user_id LIMIT 1;

    -- If no organization exists, create one
    IF org_id IS NULL THEN
        INSERT INTO organizations (id, name, slug, subscription_plan)
        VALUES (user_id, 'Bridgeland Advisors', 'bridgeland-advisors', 'starter')
        RETURNING id INTO org_id;

        -- Add user as owner
        INSERT INTO organization_members (organization_id, user_id, role, is_active)
        VALUES (org_id, user_id, 'owner', true)
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    -- Insert sample companies with your organization_id
    INSERT INTO companies (
        name,
        industry,
        website,
        email,
        phone,
        contact_name,
        address,
        city,
        state,
        zip_code,
        country,
        status,
        organization_id
    ) VALUES
    (
        'TechStart Inc.',
        'Technology',
        'https://techstart.com',
        'contact@techstart.com',
        '+1 (555) 123-4567',
        'John Smith',
        '123 Market Street',
        'San Francisco',
        'CA',
        '94105',
        'United States',
        'active',
        org_id
    ),
    (
        'InnovateCorp',
        'Healthcare',
        'https://innovatecorp.com',
        'info@innovatecorp.com',
        '+1 (555) 987-6543',
        'Sarah Johnson',
        '456 Innovation Way',
        'Boston',
        'MA',
        '02110',
        'United States',
        'active',
        org_id
    ),
    (
        'StartupXYZ',
        'FinTech',
        'https://startupxyz.com',
        'hello@startupxyz.com',
        '+1 (555) 456-7890',
        'Mike Wilson',
        '789 Wall Street',
        'New York',
        'NY',
        '10005',
        'United States',
        'prospect',
        org_id
    ),
    (
        'DataCorp Solutions',
        'Analytics',
        'https://datacorp.com',
        'contact@datacorp.com',
        '+1 (555) 234-5678',
        'Emily Chen',
        '321 Data Drive',
        'Austin',
        'TX',
        '78701',
        'United States',
        'active',
        org_id
    ),
    (
        'CloudScale Systems',
        'Cloud Computing',
        'https://cloudscale.com',
        'info@cloudscale.com',
        '+1 (555) 345-6789',
        'Robert Turner',
        '567 Cloud Avenue',
        'Seattle',
        'WA',
        '98101',
        'United States',
        'active',
        org_id
    )
    ON CONFLICT (name, organization_id) DO NOTHING;

    RAISE NOTICE 'Successfully added sample companies for organization: %', org_id;
END $$;

-- Verify the data was inserted
SELECT id, name, industry, status, organization_id
FROM companies
WHERE organization_id IN (
    SELECT id FROM organizations
    WHERE name = 'Bridgeland Advisors'
);