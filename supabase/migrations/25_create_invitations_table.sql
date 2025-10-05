-- Create invitations table for team member invitations
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT unique_pending_invitation UNIQUE (organization_id, email, accepted_at)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization admins can view their organization's invitations
CREATE POLICY "Organization admins can view invitations" ON invitations
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: Organization admins can create invitations
CREATE POLICY "Organization admins can create invitations" ON invitations
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: Organization admins can update invitations (mark as accepted)
CREATE POLICY "Organization admins can update invitations" ON invitations
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role IN ('owner', 'admin')
        )
    );

-- Policy: Organization admins can delete invitations
CREATE POLICY "Organization admins can delete invitations" ON invitations
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role IN ('owner', 'admin')
        )
    );
