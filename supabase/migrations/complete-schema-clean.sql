-- 409A Valuation App - Supabase Migration Schema
-- This schema includes RLS (Row Level Security) and authentication integration

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (only once)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'client', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE valuation_status AS ENUM ('draft', 'in_progress', 'under_review', 'completed', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE share_class_type AS ENUM ('Common', 'Preferred');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE preference_type AS ENUM ('Non-Participating', 'Participating', 'Participating with Cap');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dividends_type AS ENUM ('None', 'Cumulative', 'Non-Cumulative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE options_type AS ENUM ('Options', 'Warrants', 'RSUs');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'analyst',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    incorporation_date DATE,
    state_of_incorporation TEXT,
    ein TEXT,
    address TEXT,
    industry TEXT,
    stage TEXT,
    location TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valuations table
CREATE TABLE IF NOT EXISTS public.valuations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
    dlom DECIMAL, -- Discount for Lack of Marketability
    methodology TEXT, -- 'OPM', 'PWERM', 'hybrid'
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Cap table configurations (for storing complex cap table data)
CREATE TABLE IF NOT EXISTS public.cap_table_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    config_data JSONB NOT NULL, -- Stores the full cap table configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial assumptions table
CREATE TABLE IF NOT EXISTS public.financial_assumptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    unit TEXT,
    type TEXT, -- 'text', 'number', 'percentage', 'currency', 'date'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DLOM models table
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

-- Breakpoints analysis table
CREATE TABLE IF NOT EXISTS public.breakpoints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    breakpoint_data JSONB NOT NULL, -- Stores complex breakpoint calculations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waterfall scenarios table
CREATE TABLE IF NOT EXISTS public.waterfall_scenarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    scenario_name TEXT NOT NULL,
    exit_value DECIMAL NOT NULL,
    scenario_data JSONB, -- Stores detailed waterfall calculations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    valuation_id UUID NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- '409A', 'waterfall', 'summary'
    report_data JSONB, -- Stores report configuration and data
    file_url TEXT, -- Supabase storage URL
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Report templates table (for the report generator)
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

-- Report variable mappings table
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

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);
CREATE INDEX IF NOT EXISTS idx_valuations_company ON public.valuations(company_id);
CREATE INDEX IF NOT EXISTS idx_valuations_date ON public.valuations(valuation_date);
CREATE INDEX IF NOT EXISTS idx_valuations_status ON public.valuations(status);
CREATE INDEX IF NOT EXISTS idx_valuations_created_by ON public.valuations(created_by);
CREATE INDEX IF NOT EXISTS idx_share_classes_valuation ON public.share_classes(valuation_id);
CREATE INDEX IF NOT EXISTS idx_options_valuation ON public.options_warrants(valuation_id);
CREATE INDEX IF NOT EXISTS idx_cap_table_valuation ON public.cap_table_configs(valuation_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_owner_id ON public.report_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON public.report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_variable_mappings_template_id ON public.report_variable_mappings(template_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
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

-- RLS Policies (using IF NOT EXISTS pattern)

-- Profiles: Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Companies: Users can view companies they created or have access to
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Users can view companies" ON public.companies FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'analyst')
    )
);

DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
CREATE POLICY "Users can create companies" ON public.companies FOR INSERT WITH CHECK (
    auth.uid() = created_by
);

DROP POLICY IF EXISTS "Users can update companies they created" ON public.companies;
CREATE POLICY "Users can update companies they created" ON public.companies FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin')
    )
);

-- Valuations: Users can access valuations for companies they have access to
DROP POLICY IF EXISTS "Users can view valuations" ON public.valuations;
CREATE POLICY "Users can view valuations" ON public.valuations FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND (
            c.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('admin', 'analyst')
            )
        )
    )
);

DROP POLICY IF EXISTS "Users can create valuations" ON public.valuations;
CREATE POLICY "Users can create valuations" ON public.valuations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND (
            c.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('admin', 'analyst')
            )
        )
    )
);

DROP POLICY IF EXISTS "Users can update valuations" ON public.valuations;
CREATE POLICY "Users can update valuations" ON public.valuations FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id AND (
            c.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('admin', 'analyst')
            )
        )
    )
);

-- Similar policies for other tables
DROP POLICY IF EXISTS "Share classes access" ON public.share_classes;
CREATE POLICY "Share classes access" ON public.share_classes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.valuations v
        WHERE v.id = valuation_id AND (
            v.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.companies c
                WHERE c.id = v.company_id AND (
                    c.created_by = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.profiles p
                        WHERE p.id = auth.uid() AND p.role IN ('admin', 'analyst')
                    )
                )
            )
        )
    )
);

DROP POLICY IF EXISTS "Options access" ON public.options_warrants;
CREATE POLICY "Options access" ON public.options_warrants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.valuations v
        WHERE v.id = valuation_id AND (
            v.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.companies c
                WHERE c.id = v.company_id AND (
                    c.created_by = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.profiles p
                        WHERE p.id = auth.uid() AND p.role IN ('admin', 'analyst')
                    )
                )
            )
        )
    )
);

DROP POLICY IF EXISTS "Cap table access" ON public.cap_table_configs;
CREATE POLICY "Cap table access" ON public.cap_table_configs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.valuations v
        WHERE v.id = valuation_id AND (
            v.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.companies c
                WHERE c.id = v.company_id AND (
                    c.created_by = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.profiles p
                        WHERE p.id = auth.uid() AND p.role IN ('admin', 'analyst')
                    )
                )
            )
        )
    )
);

-- Report templates policies
DROP POLICY IF EXISTS "Users can view their own templates and system templates" ON public.report_templates;
CREATE POLICY "Users can view their own templates and system templates" ON public.report_templates
    FOR SELECT USING (owner_id = current_setting('request.jwt.claim.sub', true) OR is_system = TRUE);

DROP POLICY IF EXISTS "Users can insert their own templates" ON public.report_templates;
CREATE POLICY "Users can insert their own templates" ON public.report_templates
    FOR INSERT WITH CHECK (owner_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Users can update their own templates" ON public.report_templates;
CREATE POLICY "Users can update their own templates" ON public.report_templates
    FOR UPDATE USING (owner_id = current_setting('request.jwt.claim.sub', true) AND is_system = FALSE);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.report_templates;
CREATE POLICY "Users can delete their own templates" ON public.report_templates
    FOR DELETE USING (owner_id = current_setting('request.jwt.claim.sub', true) AND is_system = FALSE);

-- Report variable mappings policies
DROP POLICY IF EXISTS "Users can view variable mappings for accessible templates" ON public.report_variable_mappings;
CREATE POLICY "Users can view variable mappings for accessible templates" ON public.report_variable_mappings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.report_templates rt
            WHERE rt.id = template_id
            AND (rt.owner_id = current_setting('request.jwt.claim.sub', true) OR rt.is_system = TRUE)
        )
    );

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at (with DROP IF EXISTS)
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_valuations_updated_at ON public.valuations;
CREATE TRIGGER update_valuations_updated_at BEFORE UPDATE ON public.valuations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_share_classes_updated_at ON public.share_classes;
CREATE TRIGGER update_share_classes_updated_at BEFORE UPDATE ON public.share_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_options_updated_at ON public.options_warrants;
CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON public.options_warrants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cap_table_updated_at ON public.cap_table_configs;
CREATE TRIGGER update_cap_table_updated_at BEFORE UPDATE ON public.cap_table_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assumptions_updated_at ON public.financial_assumptions;
CREATE TRIGGER update_assumptions_updated_at BEFORE UPDATE ON public.financial_assumptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dlom_updated_at ON public.dlom_models;
CREATE TRIGGER update_dlom_updated_at BEFORE UPDATE ON public.dlom_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_breakpoints_updated_at ON public.breakpoints;
CREATE TRIGGER update_breakpoints_updated_at BEFORE UPDATE ON public.breakpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON public.report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample template (only if it doesn't exist)
INSERT INTO public.report_templates (name, description, type, is_system, is_active, owner_id, blocks, variables_schema)
SELECT
    'Standard 409A Valuation Report',
    'A comprehensive 409A valuation report template with all required sections',
    '409a',
    TRUE,
    TRUE,
    'system',
    '[
        {
            "id": "header-1",
            "type": "header",
            "content": "409A Valuation Report",
            "level": 1,
            "style": {}
        },
        {
            "id": "company-info",
            "type": "section",
            "title": "Company Information",
            "content": "Company: {{company.name}}\\nValuation Date: {{valuation.date}}",
            "style": {}
        }
    ]'::jsonb,
    '{
        "company": {
            "name": {"type": "string", "description": "Company name"}
        },
        "valuation": {
            "date": {"type": "date", "description": "Valuation date"}
        }
    }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.report_templates WHERE name = 'Standard 409A Valuation Report');