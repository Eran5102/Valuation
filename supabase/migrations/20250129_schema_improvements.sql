-- ============================================
-- 409A Valuation App - Schema Improvements
-- Date: 2025-01-29
-- Description: Comprehensive schema improvements including:
--   - Profile table consolidation
--   - Report template linking
--   - Enhanced assignment system
--   - Role standardization
--   - Companies to Clients rename
-- ============================================

-- ============================================
-- PART 1: PROFILE TABLE CLEANUP
-- ============================================

-- Drop the obsolete profiles table if it exists
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enhance user_profiles table with missing fields
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- ============================================
-- PART 2: REPORT TEMPLATE ENHANCEMENTS
-- ============================================

-- Add organization linking to report templates
ALTER TABLE public.report_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;

-- Add template linking to reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.report_templates(id),
  ADD COLUMN IF NOT EXISTS template_version INTEGER DEFAULT 1;

-- Create junction table for valuation-specific templates
CREATE TABLE IF NOT EXISTS public.valuation_report_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(valuation_id, template_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_organization_id ON public.report_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_global ON public.report_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_reports_template_id ON public.reports(template_id);
CREATE INDEX IF NOT EXISTS idx_valuation_report_templates_valuation ON public.valuation_report_templates(valuation_id);
CREATE INDEX IF NOT EXISTS idx_valuation_report_templates_template ON public.valuation_report_templates(template_id);

-- ============================================
-- PART 3: ENHANCED ASSIGNMENT SYSTEM
-- ============================================

-- Rename and enhance assignment columns in companies table
ALTER TABLE public.companies
  RENAME COLUMN assigned_to TO lead_assigned;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS viewer_members UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS editor_members UUID[] DEFAULT '{}';

-- Enhance assignment columns in valuations table
ALTER TABLE public.valuations
  RENAME COLUMN assigned_appraiser TO lead_assigned;

ALTER TABLE public.valuations
  ADD COLUMN IF NOT EXISTS viewer_members UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS editor_members UUID[] DEFAULT '{}';

-- Create assignment history table for audit trail
CREATE TABLE IF NOT EXISTS public.assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('client', 'valuation')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(50) NOT NULL CHECK (role IN ('lead', 'team_member', 'editor', 'viewer')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create indexes for assignment history
CREATE INDEX IF NOT EXISTS idx_assignment_history_entity ON public.assignment_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_user ON public.assignment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_assigned_at ON public.assignment_history(assigned_at);

-- ============================================
-- PART 4: ROLE STANDARDIZATION
-- ============================================

-- Create standardized role enum type
DO $$ BEGIN
    CREATE TYPE standardized_role AS ENUM ('owner', 'admin', 'appraiser', 'analyst', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Update organization_members to use standardized roles
-- First, update existing role values to match new standard
UPDATE public.organization_members
SET role = CASE
    WHEN role IN ('org_owner', 'org-owner') THEN 'owner'
    WHEN role IN ('org_admin', 'org-admin', 'administrator') THEN 'admin'
    WHEN role IN ('member', 'appraiser') THEN 'appraiser'
    WHEN role IN ('viewer', 'read-only', 'readonly') THEN 'viewer'
    ELSE role
END
WHERE role NOT IN ('owner', 'admin', 'appraiser', 'analyst', 'viewer');

-- Update the role constraint to use standard roles
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check
    CHECK (role IN ('owner', 'admin', 'appraiser', 'analyst', 'viewer'));

-- Update invitations table role constraint
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_role_check
    CHECK (role IN ('admin', 'appraiser', 'analyst', 'viewer'));

-- ============================================
-- PART 5: RENAME COMPANIES TO CLIENTS
-- ============================================

-- Create clients table as a copy of companies with enhanced fields
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    legal_name TEXT,
    incorporation_date DATE,
    state_of_incorporation TEXT,
    ein TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    industry TEXT,
    stage TEXT,
    location TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    description TEXT,
    lead_assigned UUID REFERENCES auth.users(id),
    team_members UUID[] DEFAULT '{}',
    editor_members UUID[] DEFAULT '{}',
    viewer_members UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data from companies to clients if it exists
INSERT INTO public.clients (
    id, organization_id, name, legal_name, incorporation_date, state_of_incorporation,
    ein, address, city, state, zip_code, industry, stage, location,
    contact_name, email, phone, website, description,
    lead_assigned, team_members, created_by, created_at, updated_at
)
SELECT
    id, organization_id, name, legal_name, incorporation_date, state_of_incorporation,
    ein, address, city, state, zip_code, industry, stage, location,
    contact_name, email, phone, website, description,
    lead_assigned, team_members, created_by, created_at, updated_at
FROM public.companies
ON CONFLICT (id) DO NOTHING;

-- Update valuations table to reference clients
ALTER TABLE public.valuations
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Copy company_id references to client_id
UPDATE public.valuations
SET client_id = company_id
WHERE client_id IS NULL AND company_id IS NOT NULL;

-- Create indexes for clients table
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_lead_assigned ON public.clients(lead_assigned);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_valuations_client_id ON public.valuations(client_id);

-- ============================================
-- PART 6: ENHANCED ORGANIZATION FIELDS
-- ============================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS max_users INTEGER,
  ADD COLUMN IF NOT EXISTS max_clients INTEGER,
  ADD COLUMN IF NOT EXISTS max_valuations INTEGER;

-- Update settings JSONB to include default structure if empty
UPDATE public.organizations
SET settings = jsonb_build_object(
    'notifications', jsonb_build_object(
        'email_enabled', true,
        'valuation_updates', true,
        'team_changes', true
    ),
    'defaults', jsonb_build_object(
        'currency', 'USD',
        'tax_rate', 21,
        'discounting_convention', 'mid_year'
    ),
    'branding', jsonb_build_object(
        'primary_color', '#124E66',
        'logo_position', 'left'
    )
)
WHERE settings = '{}' OR settings IS NULL;

-- ============================================
-- PART 7: UPDATE RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Organization members can view their clients" ON public.clients
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- Super admin
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.is_super_admin = true
            )
            OR
            -- Organization member
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
            )
        )
    );

CREATE POLICY "Assigned users can edit clients" ON public.clients
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND (
            lead_assigned = auth.uid()
            OR auth.uid() = ANY(team_members)
            OR auth.uid() = ANY(editor_members)
            OR EXISTS (
                SELECT 1 FROM public.organization_members
                WHERE user_id = auth.uid()
                AND organization_id = clients.organization_id
                AND role IN ('owner', 'admin')
                AND is_active = true
            )
        )
    );

CREATE POLICY "Organization members can create clients" ON public.clients
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND role IN ('owner', 'admin', 'appraiser')
                AND is_active = true
            )
        )
    );

-- Policies for valuation_report_templates
CREATE POLICY "Users can view templates for their valuations" ON public.valuation_report_templates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.valuations
            WHERE valuations.id = valuation_report_templates.valuation_id
            AND (
                valuations.lead_assigned = auth.uid()
                OR auth.uid() = ANY(valuations.team_members)
                OR auth.uid() = ANY(valuations.viewer_members)
                OR auth.uid() = ANY(valuations.editor_members)
            )
        )
    );

-- Policies for assignment_history
CREATE POLICY "Users can view assignment history for their organization" ON public.assignment_history
    FOR ALL
    USING (
        auth.uid() IS NOT NULL AND (
            -- Super admin
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.is_super_admin = true
            )
            OR
            -- Check if user belongs to the organization of the entity
            (
                CASE
                    WHEN entity_type = 'client' THEN
                        EXISTS (
                            SELECT 1 FROM public.clients
                            WHERE clients.id = assignment_history.entity_id
                            AND clients.organization_id IN (
                                SELECT organization_id
                                FROM public.organization_members
                                WHERE user_id = auth.uid()
                                AND is_active = true
                            )
                        )
                    WHEN entity_type = 'valuation' THEN
                        EXISTS (
                            SELECT 1 FROM public.valuations
                            WHERE valuations.id = assignment_history.entity_id
                            AND valuations.organization_id IN (
                                SELECT organization_id
                                FROM public.organization_members
                                WHERE user_id = auth.uid()
                                AND is_active = true
                            )
                        )
                    ELSE false
                END
            )
        )
    );

-- ============================================
-- PART 8: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if user has access to a client
CREATE OR REPLACE FUNCTION check_client_access(
    p_user_id UUID,
    p_client_id UUID,
    p_access_level VARCHAR DEFAULT 'view'
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_super_admin BOOLEAN;
    v_org_role VARCHAR;
    v_client RECORD;
BEGIN
    -- Check super admin
    SELECT is_super_admin INTO v_is_super_admin
    FROM user_profiles
    WHERE id = p_user_id;

    IF v_is_super_admin = true THEN
        RETURN true;
    END IF;

    -- Get client details
    SELECT * INTO v_client
    FROM clients
    WHERE id = p_client_id;

    IF v_client IS NULL THEN
        RETURN false;
    END IF;

    -- Check organization role
    SELECT role INTO v_org_role
    FROM organization_members
    WHERE user_id = p_user_id
        AND organization_id = v_client.organization_id
        AND is_active = true;

    -- Organization owners and admins have full access
    IF v_org_role IN ('owner', 'admin') THEN
        RETURN true;
    END IF;

    -- Check specific assignment based on access level
    CASE p_access_level
        WHEN 'lead' THEN
            RETURN v_client.lead_assigned = p_user_id;
        WHEN 'edit' THEN
            RETURN v_client.lead_assigned = p_user_id
                OR p_user_id = ANY(v_client.team_members)
                OR p_user_id = ANY(v_client.editor_members);
        WHEN 'view' THEN
            RETURN v_client.lead_assigned = p_user_id
                OR p_user_id = ANY(v_client.team_members)
                OR p_user_id = ANY(v_client.editor_members)
                OR p_user_id = ANY(v_client.viewer_members)
                OR v_org_role IS NOT NULL;
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track assignment changes
CREATE OR REPLACE FUNCTION track_assignment_change() RETURNS TRIGGER AS $$
DECLARE
    v_entity_type VARCHAR;
    v_old_lead UUID;
    v_new_lead UUID;
BEGIN
    -- Determine entity type
    IF TG_TABLE_NAME = 'clients' THEN
        v_entity_type := 'client';
        v_old_lead := OLD.lead_assigned;
        v_new_lead := NEW.lead_assigned;
    ELSIF TG_TABLE_NAME = 'valuations' THEN
        v_entity_type := 'valuation';
        v_old_lead := OLD.lead_assigned;
        v_new_lead := NEW.lead_assigned;
    ELSE
        RETURN NEW;
    END IF;

    -- Track lead assignment changes
    IF v_old_lead IS DISTINCT FROM v_new_lead THEN
        -- Mark old assignment as removed
        IF v_old_lead IS NOT NULL THEN
            UPDATE assignment_history
            SET removed_at = NOW(),
                removed_by = auth.uid()
            WHERE entity_type = v_entity_type
                AND entity_id = NEW.id
                AND user_id = v_old_lead
                AND role = 'lead'
                AND removed_at IS NULL;
        END IF;

        -- Add new assignment
        IF v_new_lead IS NOT NULL THEN
            INSERT INTO assignment_history (
                entity_type, entity_id, user_id, role, assigned_by
            ) VALUES (
                v_entity_type, NEW.id, v_new_lead, 'lead', auth.uid()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for assignment tracking
DROP TRIGGER IF EXISTS track_client_assignment ON public.clients;
CREATE TRIGGER track_client_assignment
    AFTER UPDATE OF lead_assigned ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION track_assignment_change();

DROP TRIGGER IF EXISTS track_valuation_assignment ON public.valuations;
CREATE TRIGGER track_valuation_assignment
    AFTER UPDATE OF lead_assigned ON public.valuations
    FOR EACH ROW
    EXECUTE FUNCTION track_assignment_change();

-- ============================================
-- PART 9: CREATE MIGRATION VIEWS FOR BACKWARD COMPATIBILITY
-- ============================================

-- Create a view that mimics the old companies table
CREATE OR REPLACE VIEW public.companies AS
SELECT
    id,
    organization_id,
    name,
    legal_name,
    incorporation_date,
    state_of_incorporation,
    ein,
    address,
    city,
    state,
    zip_code,
    industry,
    stage,
    location,
    contact_name,
    email,
    phone,
    website,
    description,
    lead_assigned AS assigned_to,  -- Map back to old column name
    team_members,
    created_by,
    created_at,
    updated_at
FROM public.clients;

-- Create rules to make the view updatable
CREATE OR REPLACE RULE companies_insert AS ON INSERT TO public.companies
DO INSTEAD INSERT INTO public.clients (
    id, organization_id, name, legal_name, incorporation_date,
    state_of_incorporation, ein, address, city, state, zip_code,
    industry, stage, location, contact_name, email, phone, website,
    description, lead_assigned, team_members, created_by, created_at, updated_at
) VALUES (
    NEW.id, NEW.organization_id, NEW.name, NEW.legal_name, NEW.incorporation_date,
    NEW.state_of_incorporation, NEW.ein, NEW.address, NEW.city, NEW.state, NEW.zip_code,
    NEW.industry, NEW.stage, NEW.location, NEW.contact_name, NEW.email, NEW.phone, NEW.website,
    NEW.description, NEW.assigned_to, NEW.team_members, NEW.created_by, NEW.created_at, NEW.updated_at
);

CREATE OR REPLACE RULE companies_update AS ON UPDATE TO public.companies
DO INSTEAD UPDATE public.clients SET
    organization_id = NEW.organization_id,
    name = NEW.name,
    legal_name = NEW.legal_name,
    incorporation_date = NEW.incorporation_date,
    state_of_incorporation = NEW.state_of_incorporation,
    ein = NEW.ein,
    address = NEW.address,
    city = NEW.city,
    state = NEW.state,
    zip_code = NEW.zip_code,
    industry = NEW.industry,
    stage = NEW.stage,
    location = NEW.location,
    contact_name = NEW.contact_name,
    email = NEW.email,
    phone = NEW.phone,
    website = NEW.website,
    description = NEW.description,
    lead_assigned = NEW.assigned_to,
    team_members = NEW.team_members,
    updated_at = NEW.updated_at
WHERE id = NEW.id;

CREATE OR REPLACE RULE companies_delete AS ON DELETE TO public.companies
DO INSTEAD DELETE FROM public.clients WHERE id = OLD.id;

-- ============================================
-- PART 10: FINAL CLEANUP AND VALIDATION
-- ============================================

-- Add comments to document the schema
COMMENT ON TABLE public.clients IS 'Client companies that receive valuation services';
COMMENT ON TABLE public.valuation_report_templates IS 'Links report templates to specific valuations';
COMMENT ON TABLE public.assignment_history IS 'Audit trail of user assignments to clients and valuations';
COMMENT ON COLUMN public.clients.lead_assigned IS 'Primary user responsible for this client';
COMMENT ON COLUMN public.clients.team_members IS 'Users with full access to work on this client';
COMMENT ON COLUMN public.clients.editor_members IS 'Users with edit access to this client';
COMMENT ON COLUMN public.clients.viewer_members IS 'Users with read-only access to this client';

-- Grant necessary permissions
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.valuation_report_templates TO authenticated;
GRANT ALL ON public.assignment_history TO authenticated;

-- Refresh materialized views if any exist
-- (placeholder for any materialized views that might need refreshing)

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Schema improvements migration completed successfully';
END $$;