-- Add organization_members table and update organizations table
-- Migration: 20250101000000_add_organization_members_table.sql

-- =====================================================
-- 1. ADD MISSING COLUMNS TO ORGANIZATIONS TABLE
-- =====================================================

-- Add missing columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Update settings column to include member management settings
-- (This will preserve existing settings and add new ones as needed)

-- =====================================================
-- 2. CREATE ORGANIZATION_MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- 3. CREATE ENUMS FOR BETTER TYPE SAFETY
-- =====================================================

-- Create enum types for organization status
DO $$ BEGIN
    CREATE TYPE organization_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum types for organization member roles
DO $$ BEGIN
    CREATE TYPE organization_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum types for organization member status
DO $$ BEGIN
    CREATE TYPE organization_member_status AS ENUM ('active', 'pending', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for organization_members table
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);

-- Indexes for organizations table
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- =====================================================
-- 5. ADD TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for organization_members table
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for organizations table (if not exists)
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on organization_members table
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view organization members if they are members of the organization
CREATE POLICY "Users can view organization members if they are members" ON organization_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

-- Policy: Organization owners and admins can manage members
CREATE POLICY "Organization owners and admins can manage members" ON organization_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- Policy: Users can insert themselves as members (for invitations)
CREATE POLICY "Users can accept invitations" ON organization_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: System admins can do everything
CREATE POLICY "System admins can manage all organization members" ON organization_members
    FOR ALL USING (is_system_admin(auth.uid()));

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is organization owner/admin
CREATE OR REPLACE FUNCTION is_organization_admin(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND organization_members.user_id = user_id
        AND role IN ('owner', 'admin')
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in organization
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM organization_members
    WHERE organization_id = org_id
    AND organization_members.user_id = user_id
    AND status = 'active';
    
    RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- =====================================================

-- Insert sample organization if none exists
INSERT INTO organizations (name, slug, description, owner_id, settings)
SELECT 
    'Sample Organization',
    'sample-org',
    'A sample organization for testing',
    (SELECT id FROM auth.users LIMIT 1),
    '{"allow_member_invites": true, "require_approval": false, "max_members": 50}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'sample-org')
AND EXISTS (SELECT 1 FROM auth.users);

-- Add the owner as a member
INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
SELECT 
    o.id,
    o.owner_id,
    'owner',
    'active',
    NOW()
FROM organizations o
WHERE o.slug = 'sample-org'
AND o.owner_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = o.id
    AND om.user_id = o.owner_id
);

SELECT 'Organization members table and related functionality added successfully!' as message;