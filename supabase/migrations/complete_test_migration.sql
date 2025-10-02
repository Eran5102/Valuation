-- ============================================
-- COMPLETE DATABASE MIGRATION FOR TEST ENVIRONMENT
-- This single script sets up everything needed
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- PART 1: CREATE CLIENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  country TEXT DEFAULT 'US',
  industry TEXT,
  stage TEXT,
  location TEXT,
  contact_name TEXT,
  email TEXT,  -- This is what used to be contact_email
  phone TEXT,
  website TEXT,
  description TEXT,
  lead_assigned UUID REFERENCES auth.users(id),  -- This is what used to be assigned_to
  team_members UUID[] DEFAULT '{}',
  editor_members UUID[] DEFAULT '{}',
  viewer_members UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: CREATE ASSIGNMENT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.assignment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'valuation')),
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('lead', 'team_member', 'editor', 'viewer')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================
-- PART 3: CREATE VALUATION REPORT TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.valuation_report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(valuation_id, template_id)
);

-- ============================================
-- PART 4: COPY DATA FROM COMPANIES TO CLIENTS
-- ============================================

-- Only copy if companies table exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
    -- Copy data from companies to clients (avoiding duplicates)
    INSERT INTO public.clients (
        id, organization_id, name, legal_name, incorporation_date, state_of_incorporation,
        ein, address, city, state, zip_code, country, industry, stage, location,
        contact_name, email, phone, website, description,
        lead_assigned, team_members, tags, status,
        created_by, created_at, updated_at
    )
    SELECT
        id, organization_id, name, legal_name, incorporation_date, state_of_incorporation,
        ein, address, city, state, zip_code, country, industry, stage, location,
        contact_name,
        contact_email AS email,  -- Map contact_email to email
        phone, website, description,
        assigned_to AS lead_assigned,  -- Map assigned_to to lead_assigned
        team_members, tags, status,
        created_by, created_at, updated_at
    FROM public.companies
    WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE clients.id = companies.id);
  END IF;
END $$;

-- ============================================
-- PART 5: UPDATE VALUATIONS TABLE
-- ============================================

-- Add client_id column to valuations
ALTER TABLE public.valuations
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS lead_assigned UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS editor_members UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS viewer_members UUID[] DEFAULT '{}';

-- Copy company_id references to client_id
UPDATE public.valuations
SET client_id = company_id
WHERE client_id IS NULL AND company_id IS NOT NULL;

-- Copy assigned_appraiser to lead_assigned
UPDATE public.valuations
SET lead_assigned = assigned_appraiser
WHERE lead_assigned IS NULL AND assigned_appraiser IS NOT NULL;

-- ============================================
-- PART 6: ENHANCE USER PROFILES
-- ============================================

-- Add missing columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Copy data from profiles table if it exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    UPDATE public.user_profiles up
    SET
      email = COALESCE(up.email, p.email),
      full_name = COALESCE(up.full_name, p.full_name),
      avatar_url = COALESCE(up.avatar_url, p.avatar_url)
    FROM public.profiles p
    WHERE up.id = p.id;
  END IF;
END $$;

-- ============================================
-- PART 7: ENHANCE ORGANIZATIONS TABLE
-- ============================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS max_users INTEGER,
  ADD COLUMN IF NOT EXISTS max_clients INTEGER,
  ADD COLUMN IF NOT EXISTS max_valuations INTEGER;

-- ============================================
-- PART 8: ENHANCE REPORT TEMPLATES
-- ============================================

ALTER TABLE public.report_templates
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.report_templates(id),
  ADD COLUMN IF NOT EXISTS template_version INTEGER;

-- ============================================
-- PART 9: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_lead_assigned ON public.clients(lead_assigned);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_valuations_client_id ON public.valuations(client_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_entity ON public.assignment_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_user ON public.assignment_history(user_id);

-- ============================================
-- PART 10: CREATE BACKWARD COMPATIBILITY VIEW
-- ============================================

-- First, rename the existing companies table to companies_old (as backup)
ALTER TABLE IF EXISTS public.companies RENAME TO companies_old;

-- Create view for companies that maps to clients
CREATE VIEW public.companies AS
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
    country,
    industry,
    stage,
    location,
    contact_name,
    email AS contact_email,  -- Map back to contact_email
    phone,
    website,
    description,
    lead_assigned AS assigned_to,  -- Map back to assigned_to
    team_members,
    tags,
    status,
    created_by,
    created_at,
    updated_at
FROM public.clients;

-- ============================================
-- PART 11: CREATE TRIGGER FUNCTIONS
-- ============================================

-- Function for INSERT on companies view
CREATE OR REPLACE FUNCTION handle_companies_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.clients (
        id, organization_id, name, legal_name, incorporation_date,
        state_of_incorporation, ein, address, city, state, zip_code,
        country, industry, stage, location, contact_name, email, phone,
        website, description, lead_assigned, team_members, tags, status,
        created_by, created_at, updated_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.organization_id, NEW.name, NEW.legal_name, NEW.incorporation_date,
        NEW.state_of_incorporation, NEW.ein, NEW.address, NEW.city, NEW.state,
        NEW.zip_code, NEW.country, NEW.industry, NEW.stage, NEW.location,
        NEW.contact_name, NEW.contact_email, NEW.phone, NEW.website, NEW.description,
        NEW.assigned_to, NEW.team_members, NEW.tags, NEW.status,
        NEW.created_by, COALESCE(NEW.created_at, NOW()), COALESCE(NEW.updated_at, NOW())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for UPDATE on companies view
CREATE OR REPLACE FUNCTION handle_companies_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clients SET
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
        country = NEW.country,
        industry = NEW.industry,
        stage = NEW.stage,
        location = NEW.location,
        contact_name = NEW.contact_name,
        email = NEW.contact_email,
        phone = NEW.phone,
        website = NEW.website,
        description = NEW.description,
        lead_assigned = NEW.assigned_to,
        team_members = NEW.team_members,
        tags = NEW.tags,
        status = NEW.status,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for DELETE on companies view
CREATE OR REPLACE FUNCTION handle_companies_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.clients WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER companies_insert_trigger
    INSTEAD OF INSERT ON public.companies
    FOR EACH ROW EXECUTE FUNCTION handle_companies_insert();

CREATE TRIGGER companies_update_trigger
    INSTEAD OF UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION handle_companies_update();

CREATE TRIGGER companies_delete_trigger
    INSTEAD OF DELETE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION handle_companies_delete();

-- ============================================
-- PART 12: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 13: CREATE RLS POLICIES
-- ============================================

-- Policies for clients table
CREATE POLICY "Organization members can view their clients" ON public.clients
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.is_super_admin = true
            )
            OR
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

CREATE POLICY "Organization admins can delete clients" ON public.clients
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
            AND organization_id = clients.organization_id
            AND role IN ('owner', 'admin')
            AND is_active = true
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
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.is_super_admin = true
            )
            OR
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
-- PART 14: CREATE UPDATE TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to new tables
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_assignment_history_updated_at ON public.assignment_history;
CREATE TRIGGER update_assignment_history_updated_at BEFORE UPDATE ON public.assignment_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PART 15: FINAL CLEANUP AND VERIFICATION
-- ============================================

-- Drop the old profiles table if it exists (data already copied)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Standardize roles in organization_members
UPDATE public.organization_members
SET role = CASE
    WHEN role IN ('admin', 'administrator') THEN 'admin'
    WHEN role IN ('member', 'user') THEN 'appraiser'
    WHEN role IN ('read_only', 'readonly') THEN 'viewer'
    ELSE role
END
WHERE role NOT IN ('owner', 'admin', 'appraiser', 'analyst', 'viewer');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  ✓ clients (replacing companies)';
  RAISE NOTICE '  ✓ assignment_history';
  RAISE NOTICE '  ✓ valuation_report_templates';
  RAISE NOTICE '';
  RAISE NOTICE 'Enhanced tables:';
  RAISE NOTICE '  ✓ user_profiles';
  RAISE NOTICE '  ✓ organizations';
  RAISE NOTICE '  ✓ valuations';
  RAISE NOTICE '  ✓ report_templates';
  RAISE NOTICE '';
  RAISE NOTICE 'Backward compatibility:';
  RAISE NOTICE '  ✓ companies view created';
  RAISE NOTICE '  ✓ All triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE 'Your test database is ready!';
  RAISE NOTICE '========================================';
END $$;