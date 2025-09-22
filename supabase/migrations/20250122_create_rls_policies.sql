-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organizations(user_id UUID)
RETURNS UUID[] AS $$
  SELECT array_agg(organization_id)
  FROM organization_members
  WHERE user_id = $1 AND is_active = true
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is org admin or owner
CREATE OR REPLACE FUNCTION is_org_admin(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = $1
    AND organization_id = $2
    AND role IN ('owner', 'admin')
    AND is_active = true
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT unnest(get_user_organizations(auth.uid()))));

CREATE POLICY "Org owners can update their organization"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid()
      AND organization_id = organizations.id
      AND role = 'owner'
      AND is_active = true
    )
  );

-- Organization members policies
CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT unnest(get_user_organizations(auth.uid()))));

CREATE POLICY "Org admins can manage members"
  ON organization_members FOR ALL
  USING (is_org_admin(auth.uid(), organization_id));

-- User profiles policies
CREATE POLICY "Users can view profiles in their organizations"
  ON user_profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM organization_members
      WHERE organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
      AND is_active = true
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Companies policies
CREATE POLICY "Users can view companies in their organization"
  ON companies FOR SELECT
  USING (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
    AND (
      -- User is assigned to this company
      assigned_to = auth.uid()
      OR
      -- User is in the team members
      auth.uid() = ANY(team_members)
      OR
      -- User is an admin/owner of the organization
      is_org_admin(auth.uid(), organization_id)
      OR
      -- Company has no specific assignment (available to all org members)
      (assigned_to IS NULL AND team_members = '{}')
    )
  );

CREATE POLICY "Assigned users and admins can update companies"
  ON companies FOR UPDATE
  USING (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
    AND (
      assigned_to = auth.uid()
      OR auth.uid() = ANY(team_members)
      OR is_org_admin(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Org members can create companies"
  ON companies FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
  );

CREATE POLICY "Assigned users and admins can delete companies"
  ON companies FOR DELETE
  USING (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
    AND (
      assigned_to = auth.uid()
      OR is_org_admin(auth.uid(), organization_id)
    )
  );

-- Valuations policies
CREATE POLICY "Users can view valuations they have access to"
  ON valuations FOR SELECT
  USING (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
    AND (
      -- User is the assigned appraiser
      assigned_appraiser = auth.uid()
      OR
      -- User is in the team members
      auth.uid() = ANY(team_members)
      OR
      -- User is an admin/owner of the organization
      is_org_admin(auth.uid(), organization_id)
      OR
      -- Valuation has no specific assignment (available to all org members)
      (assigned_appraiser IS NULL AND team_members = '{}')
    )
  );

CREATE POLICY "Assigned appraisers and admins can update valuations"
  ON valuations FOR UPDATE
  USING (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
    AND (
      assigned_appraiser = auth.uid()
      OR auth.uid() = ANY(team_members)
      OR is_org_admin(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Org members can create valuations"
  ON valuations FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
  );

CREATE POLICY "Assigned appraisers and admins can delete valuations"
  ON valuations FOR DELETE
  USING (
    organization_id IN (SELECT unnest(get_user_organizations(auth.uid())))
    AND (
      assigned_appraiser = auth.uid()
      OR is_org_admin(auth.uid(), organization_id)
    )
  );

-- Create function to automatically set organization_id on insert
CREATE OR REPLACE FUNCTION set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    -- Get the user's primary organization (first one they're a member of)
    SELECT organization_id INTO NEW.organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND is_active = true
    ORDER BY joined_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply organization_id triggers
CREATE TRIGGER set_company_organization_id
  BEFORE INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION set_organization_id();

CREATE TRIGGER set_valuation_organization_id
  BEFORE INSERT ON valuations
  FOR EACH ROW EXECUTE FUNCTION set_organization_id();