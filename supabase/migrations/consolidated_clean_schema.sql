-- 409A Valuation App - Consolidated Clean Schema
-- This is a cleaned up version without duplicates and conflicts

-- ============================================
-- PART 1: EXTENSIONS AND TYPES
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'client', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE valuation_status AS ENUM ('draft', 'in_progress', 'under_review', 'completed', 'on_hold');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE share_class_type AS ENUM ('Common', 'Preferred');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE preference_type AS ENUM ('Non-Participating', 'Participating', 'Participating with Cap');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dividends_type AS ENUM ('None', 'Cumulative', 'Non-Cumulative');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE options_type AS ENUM ('Options', 'Warrants', 'RSUs');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PART 2: CORE TABLES
-- ============================================

-- Organizations table (master table for multi-tenancy)
CREATE TABLE IF NOT EXISTS public.organizations (
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

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    title VARCHAR(100),
    department VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    role user_role DEFAULT 'analyst',
    preferences JSONB DEFAULT '{}',
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members table (links users to organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id),
    CONSTRAINT organization_members_role_check CHECK (role IN ('super_admin', 'org_owner', 'org_admin', 'appraiser', 'viewer', 'member', 'admin', 'owner'))
);

-- Companies table (clients)
CREATE TABLE IF NOT EXISTS public.companies (
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
    industry TEXT,
    stage TEXT,
    location TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    team_members UUID[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valuations table
CREATE TABLE IF NOT EXISTS public.valuations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    valuation_date DATE NOT NULL,
    project_type TEXT DEFAULT '409a',
    status valuation_status DEFAULT 'draft',
    currency TEXT DEFAULT 'USD',
    max_projected_years INTEGER DEFAULT 5,
    discounting_convention TEXT DEFAULT 'mid_year',
    tax_rate DECIMAL DEFAULT 21,
    description TEXT,
    enterprise_value DECIMAL,
    equity_value DECIMAL,
    common_share_price DECIMAL,
    preferred_share_price DECIMAL,
    discount_rate DECIMAL,
    volatility DECIMAL,
    risk_free_rate DECIMAL,
    dlom DECIMAL,
    methodology TEXT,
    notes TEXT,
    assigned_appraiser UUID REFERENCES auth.users(id),
    team_members UUID[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PART 3: VALUATION RELATED TABLES
-- ============================================

-- Share classes table
CREATE TABLE IF NOT EXISTS public.share_classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    type share_class_type NOT NULL,
    class_name TEXT NOT NULL,
    round_date DATE,
    shares BIGINT NOT NULL DEFAULT 0,
    price_per_share DECIMAL NOT NULL DEFAULT 0,
    amount_invested DECIMAL NOT NULL DEFAULT 0,
    preference_type preference_type,
    lp_multiple DECIMAL,
    liquidation_multiple DECIMAL DEFAULT 1,
    liquidation_preference DECIMAL DEFAULT 0,
    seniority INTEGER,
    seniority_rank INTEGER,
    participation BOOLEAN DEFAULT false,
    participation_cap DECIMAL,
    conversion_ratio DECIMAL DEFAULT 1,
    as_conv_shares BIGINT DEFAULT 0,
    percent_upon_conv DECIMAL DEFAULT 0,
    dividends_declared BOOLEAN DEFAULT false,
    div_rate DECIMAL,
    dividends_type dividends_type DEFAULT 'None',
    pik BOOLEAN DEFAULT false,
    total_dividends DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Options and warrants table
CREATE TABLE IF NOT EXISTS public.options_warrants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    num_options BIGINT NOT NULL DEFAULT 0,
    exercise_price DECIMAL NOT NULL DEFAULT 0,
    type options_type DEFAULT 'Options',
    grant_date DATE,
    grantee_name TEXT,
    vesting_start_date DATE,
    vesting_schedule TEXT,
    vesting_months INTEGER,
    cliff_months INTEGER,
    expiration_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional valuation tables
CREATE TABLE IF NOT EXISTS public.cap_table_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_assumptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    type TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dlom_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    model_inputs JSONB NOT NULL,
    model_results JSONB NOT NULL,
    model_weights JSONB NOT NULL,
    weighted_average DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.breakpoints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    breakpoint_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.waterfall_scenarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    scenario_name TEXT NOT NULL,
    exit_value DECIMAL NOT NULL,
    scenario_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PART 4: REPORT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    report_data JSONB,
    file_url TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    owner_id TEXT,
    organization_id TEXT,
    blocks JSONB DEFAULT '[]'::jsonb,
    variables_schema JSONB DEFAULT '{}'::jsonb,
    branding JSONB DEFAULT '{
        "primaryColor": "#124E66",
        "fontFamily": "Inter",
        "headerEnabled": true,
        "footerEnabled": true
    }'::jsonb,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_variable_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
    variable_path TEXT NOT NULL,
    data_source TEXT NOT NULL,
    source_field TEXT NOT NULL,
    transform JSONB,
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, variable_path)
);

-- ============================================
-- PART 5: ADMINISTRATIVE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT invitations_role_check CHECK (role IN ('org_admin', 'appraiser', 'viewer'))
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 6: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_organization_id ON public.companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_assigned_to ON public.companies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_valuations_organization_id ON public.valuations(organization_id);
CREATE INDEX IF NOT EXISTS idx_valuations_company ON public.valuations(company_id);
CREATE INDEX IF NOT EXISTS idx_valuations_date ON public.valuations(valuation_date);
CREATE INDEX IF NOT EXISTS idx_valuations_status ON public.valuations(status);
CREATE INDEX IF NOT EXISTS idx_valuations_created_by ON public.valuations(created_by);
CREATE INDEX IF NOT EXISTS idx_valuations_assigned_appraiser ON public.valuations(assigned_appraiser);
CREATE INDEX IF NOT EXISTS idx_share_classes_valuation ON public.share_classes(valuation_id);
CREATE INDEX IF NOT EXISTS idx_options_valuation ON public.options_warrants(valuation_id);
CREATE INDEX IF NOT EXISTS idx_cap_table_valuation ON public.cap_table_configs(valuation_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_owner_id ON public.report_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON public.report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_variable_mappings_template_id ON public.report_variable_mappings(template_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_super_admin ON public.user_profiles(is_super_admin) WHERE is_super_admin = true;

-- ============================================
-- PART 7: RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options_warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cap_table_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlom_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waterfall_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_variable_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Companies RLS Policies
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Organization members can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Organization members can create companies" ON public.companies;
DROP POLICY IF EXISTS "Organization admins can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Organization admins can delete their companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins full access to companies" ON public.companies;

CREATE POLICY "Super admins can view all companies" ON public.companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    );

CREATE POLICY "Organization members can view their companies" ON public.companies
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
            )
        )
    );

CREATE POLICY "Organization members can create companies" ON public.companies
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
            )
        )
    );

CREATE POLICY "Organization admins can update their companies" ON public.companies
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND (
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
                AND role IN ('admin', 'owner', 'org_admin', 'org_owner')
            )
        )
    );

CREATE POLICY "Organization admins can delete their companies" ON public.companies
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND (
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
                AND role IN ('admin', 'owner', 'org_admin', 'org_owner')
            )
        )
    );

CREATE POLICY "Super admins full access to companies" ON public.companies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.is_super_admin = true
        )
    );

-- Similar permissive policies for other tables (simplified for development)
CREATE POLICY "All operations on valuations" ON public.valuations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "All operations on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "All operations on organization_members" ON public.organization_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "All operations on organizations" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- PART 8: FUNCTIONS AND TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at column
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_valuations_updated_at ON public.valuations;
CREATE TRIGGER update_valuations_updated_at BEFORE UPDATE ON public.valuations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Permission checking function
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_organization_id UUID,
    p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
    v_is_super_admin BOOLEAN;
BEGIN
    SELECT is_super_admin INTO v_is_super_admin
    FROM user_profiles
    WHERE id = p_user_id;

    IF v_is_super_admin = true THEN
        RETURN true;
    END IF;

    SELECT role INTO v_role
    FROM organization_members
    WHERE user_id = p_user_id
        AND organization_id = p_organization_id
        AND is_active = true;

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

-- ============================================
-- PART 9: SETUP YOUR USER AS SUPER ADMIN
-- ============================================

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
        INSERT INTO user_profiles (id, email, is_super_admin)
        VALUES (v_user_id, 'eran@bridgeland-advisors.com', true)
        ON CONFLICT (id) DO UPDATE SET is_super_admin = true, email = 'eran@bridgeland-advisors.com';

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

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify the setup
SELECT
    'Setup Complete!' as status,
    (SELECT COUNT(*) FROM organizations) as total_organizations,
    (SELECT COUNT(*) FROM organization_members WHERE is_active = true) as active_members,
    (SELECT COUNT(*) FROM user_profiles WHERE is_super_admin = true) as super_admins,
    (SELECT is_super_admin FROM user_profiles up
     JOIN auth.users au ON up.id = au.id
     WHERE au.email = 'eran@bridgeland-advisors.com') as your_super_admin_status;