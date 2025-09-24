-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    plan VARCHAR(100) DEFAULT 'Professional Plan',
    logo TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_member_ids ON public.organizations USING GIN(member_ids);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view organizations they own or are members of" ON public.organizations
    FOR SELECT
    USING (
        auth.uid() = owner_id
        OR auth.uid() = ANY(member_ids)
    );

CREATE POLICY "Owners can update their organizations" ON public.organizations
    FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their organizations" ON public.organizations
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Insert sample organization if it doesn't exist
INSERT INTO public.organizations (name, slug, plan, owner_id)
SELECT
    'Bridgeland Advisors',
    'bridgeland-advisors',
    'Professional Plan',
    auth.uid()
WHERE
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.organizations
        WHERE name = 'Bridgeland Advisors' AND owner_id = auth.uid()
    );