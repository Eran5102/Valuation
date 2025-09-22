-- Complete RBAC Setup Migration
-- This creates all necessary tables and sets up permissions

-- PART 1: CREATE ORGANIZATIONS AND RELATED TABLES (if they don't exist)

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  logo_url TEXT,
  website TEXT,
  industry VARCHAR(100),
  size VARCHAR(50),
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  title VARCHAR(100),
  department VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  preferences JSONB DEFAULT '{}',
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id to existing tables if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'companies' AND column_name = 'organization_id') THEN
    ALTER TABLE companies ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'valuations' AND column_name = 'organization_id') THEN
    ALTER TABLE valuations ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  -- Add assignment columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'companies' AND column_name = 'assigned_to') THEN
    ALTER TABLE companies ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'companies' AND column_name = 'team_members') THEN
    ALTER TABLE companies ADD COLUMN team_members UUID[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'valuations' AND column_name = 'assigned_appraiser') THEN
    ALTER TABLE valuations ADD COLUMN assigned_appraiser UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'valuations' AND column_name = 'team_members') THEN
    ALTER TABLE valuations ADD COLUMN team_members UUID[] DEFAULT '{}';
  END IF;
END $$;

-- PART 2: CREATE YOUR ORGANIZATION AND MEMBERSHIP

-- First, check if you already have an organization
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_existing_org UUID;
BEGIN
  -- Get your user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'eran@bridgeland-advisors.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Check if organization already exists for this user
    SELECT organization_id INTO v_existing_org
    FROM organization_members om
    WHERE om.user_id = v_user_id
    LIMIT 1;

    IF v_existing_org IS NULL THEN
      -- Create organization
      INSERT INTO organizations (name, slug, subscription_plan, subscription_status)
      VALUES ('Bridgeland Advisors', 'bridgeland-advisors', 'starter', 'active')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO v_org_id;

      -- Add user as owner
      INSERT INTO organization_members (organization_id, user_id, role, is_active)
      VALUES (v_org_id, v_user_id, 'org_owner', true)
      ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'org_owner';
    ELSE
      -- Update existing membership to org_owner
      UPDATE organization_members
      SET role = 'org_owner'
      WHERE user_id = v_user_id AND organization_id = v_existing_org;

      v_org_id := v_existing_org;
    END IF;

    -- Create or update user profile
    INSERT INTO user_profiles (id, is_super_admin)
    VALUES (v_user_id, true)
    ON CONFLICT (id) DO UPDATE SET is_super_admin = true;

    -- Update all existing companies and valuations to belong to this organization
    UPDATE companies SET organization_id = v_org_id WHERE organization_id IS NULL;
    UPDATE valuations SET organization_id = v_org_id WHERE organization_id IS NULL;
  END IF;
END $$;

-- PART 3: CLEAN TEST DATA (only non-Bridgeland data)

-- Delete valuations from other organizations
DELETE FROM valuations WHERE organization_id NOT IN (
  SELECT id FROM organizations WHERE name = 'Bridgeland Advisors'
) OR organization_id IS NULL;

-- Delete companies from other organizations
DELETE FROM companies WHERE organization_id NOT IN (
  SELECT id FROM organizations WHERE name = 'Bridgeland Advisors'
) OR organization_id IS NULL;

-- PART 4: ENHANCE RBAC SYSTEM

-- Update role constraint
ALTER TABLE organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('super_admin', 'org_owner', 'org_admin', 'appraiser', 'viewer'));

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT invitations_role_check CHECK (role IN ('org_admin', 'appraiser', 'viewer'))
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PART 5: CREATE INDEXES

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_organization_id ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_valuations_organization_id ON valuations(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_assigned_to ON companies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_valuations_assigned_appraiser ON valuations(assigned_appraiser);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);

-- PART 6: CREATE PERMISSION FUNCTIONS

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create permission checking function
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_organization_id UUID,
  p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Check if user is super_admin
  SELECT is_super_admin INTO v_is_super_admin
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_is_super_admin = true THEN
    RETURN true;
  END IF;

  -- Get user role in organization
  SELECT role INTO v_role
  FROM organization_members
  WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND is_active = true;

  -- Check permissions based on role
  CASE p_permission
    WHEN 'manage_organization' THEN
      RETURN v_role IN ('org_owner', 'org_admin');
    WHEN 'manage_team' THEN
      RETURN v_role IN ('org_owner', 'org_admin');
    WHEN 'create_valuation' THEN
      RETURN v_role IN ('org_owner', 'org_admin', 'appraiser');
    WHEN 'edit_valuation' THEN
      RETURN v_role IN ('org_owner', 'org_admin', 'appraiser');
    WHEN 'view_all' THEN
      RETURN v_role IN ('org_owner', 'org_admin');
    WHEN 'view_assigned' THEN
      RETURN v_role IS NOT NULL;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user permissions view
CREATE OR REPLACE VIEW user_permissions AS
SELECT
  om.user_id,
  om.organization_id,
  om.role,
  up.is_super_admin,
  o.name as organization_name,
  o.subscription_plan,
  CASE
    WHEN up.is_super_admin = true THEN
      ARRAY['all']::text[]
    WHEN om.role = 'org_owner' THEN
      ARRAY['manage_organization', 'manage_team', 'manage_billing', 'create_valuation', 'edit_valuation', 'view_all']::text[]
    WHEN om.role = 'org_admin' THEN
      ARRAY['manage_organization', 'manage_team', 'create_valuation', 'edit_valuation', 'view_all']::text[]
    WHEN om.role = 'appraiser' THEN
      ARRAY['create_valuation', 'edit_valuation', 'view_assigned']::text[]
    WHEN om.role = 'viewer' THEN
      ARRAY['view_assigned']::text[]
    ELSE
      ARRAY[]::text[]
  END as permissions
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
LEFT JOIN user_profiles up ON up.id = om.user_id
WHERE om.is_active = true;

-- Grant permissions
GRANT SELECT ON user_permissions TO authenticated;
GRANT ALL ON invitations TO authenticated;
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON organization_members TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- Success message
DO $$
DECLARE
  org_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO user_count FROM organization_members WHERE is_active = true;

  RAISE NOTICE 'RBAC setup completed successfully!';
  RAISE NOTICE 'Organizations: %, Active Users: %', org_count, user_count;
END $$;