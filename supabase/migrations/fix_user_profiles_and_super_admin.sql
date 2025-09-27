-- Fix user_profiles table and set up super admin
-- This handles the existing table structure

-- First, add email column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Now set up your user as super admin
DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'eran@bridgeland-advisors.com' LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Ensure organization exists
        INSERT INTO organizations (name, slug, subscription_plan, subscription_status)
        VALUES ('Bridgeland Advisors', 'bridgeland-advisors', 'starter', 'active')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_org_id;

        -- Add user as organization owner
        INSERT INTO organization_members (organization_id, user_id, role, is_active)
        VALUES (v_org_id, v_user_id, 'org_owner', true)
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'org_owner', is_active = true;

        -- Create/update user profile with super admin status
        -- First try to insert, if it exists then update
        INSERT INTO user_profiles (id, is_super_admin)
        VALUES (v_user_id, true)
        ON CONFLICT (id) DO UPDATE SET is_super_admin = true;

        -- Update email separately to avoid issues
        UPDATE user_profiles SET email = 'eran@bridgeland-advisors.com' WHERE id = v_user_id;

        -- Update any orphaned companies to belong to this organization
        UPDATE companies SET organization_id = v_org_id
        WHERE organization_id IS NULL;

        UPDATE valuations SET organization_id = v_org_id
        WHERE organization_id IS NULL;

        RAISE NOTICE 'User setup complete: % is now a super admin for organization %', 'eran@bridgeland-advisors.com', v_org_id;
    ELSE
        RAISE NOTICE 'User not found: eran@bridgeland-advisors.com';
    END IF;
END $$;

-- Verify the setup
SELECT
    'Setup Complete!' as status,
    (SELECT COUNT(*) FROM organizations) as total_organizations,
    (SELECT COUNT(*) FROM organization_members WHERE is_active = true) as active_members,
    (SELECT COUNT(*) FROM user_profiles WHERE is_super_admin = true) as super_admins,
    (SELECT is_super_admin FROM user_profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'eran@bridgeland-advisors.com')) as your_super_admin_status;