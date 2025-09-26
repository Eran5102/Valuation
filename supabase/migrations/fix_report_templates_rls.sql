-- Fix RLS policies for report_templates table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own templates and system templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can view templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can create templates" ON public.report_templates;

-- Create new, more permissive policies for authenticated users
CREATE POLICY "Users can view templates" ON public.report_templates
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            owner_id = auth.uid() OR
            is_system = true OR
            is_active = true OR
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create templates" ON public.report_templates
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        owner_id = auth.uid()
    );

CREATE POLICY "Users can update their own templates" ON public.report_templates
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        owner_id = auth.uid() AND
        is_system = false
    );

CREATE POLICY "Users can delete their own templates" ON public.report_templates
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        owner_id = auth.uid() AND
        is_system = false
    );