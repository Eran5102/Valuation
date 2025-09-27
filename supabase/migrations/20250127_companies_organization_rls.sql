-- Add organization-based RLS policies for companies table
-- This ensures proper data separation between organizations

-- First, ensure the companies table has organization_id column
-- (It should already exist, but this is safe to run)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Organization members can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Organization members can create companies" ON public.companies;
DROP POLICY IF EXISTS "Organization admins can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Organization admins can delete their companies" ON public.companies;

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super admins can view all companies
CREATE POLICY "Super admins can view all companies" ON public.companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

-- Policy 2: Organization members can view their organization's companies
CREATE POLICY "Organization members can view their companies" ON public.companies
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- User is a member of the organization that owns the company
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
            )
        )
    );

-- Policy 3: Organization members can create companies for their organization
CREATE POLICY "Organization members can create companies" ON public.companies
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            -- User must be creating a company for their own organization
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
            )
        )
    );

-- Policy 4: Organization admins can update their organization's companies
CREATE POLICY "Organization admins can update their companies" ON public.companies
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND (
            -- User must be an admin or owner of the organization
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
                AND role IN ('admin', 'owner')
            )
        )
    );

-- Policy 5: Organization admins can delete their organization's companies
CREATE POLICY "Organization admins can delete their companies" ON public.companies
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND (
            -- User must be an admin or owner of the organization
            organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid()
                AND is_active = true
                AND role IN ('admin', 'owner')
            )
        )
    );

-- Policy 6: Super admins can perform all operations on all companies
CREATE POLICY "Super admins full access to companies" ON public.companies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = true
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_organization_id ON public.companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin) WHERE is_super_admin = true;