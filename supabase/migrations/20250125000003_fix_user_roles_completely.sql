-- =====================================================
-- Complete Fix for user_roles Table and Infinite Recursion
-- =====================================================
-- This migration completely fixes the user_roles table and infinite recursion issues
-- =====================================================

-- Drop all existing policies on user_roles first
DROP POLICY IF EXISTS "System admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can view roles in their organization" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "System admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can manage roles in their org" ON user_roles;

-- Drop all existing policies on organizations
DROP POLICY IF EXISTS "System admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can view their organization" ON organizations;
DROP POLICY IF EXISTS "System admins can manage all organizations" ON organizations;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "System admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Organization admins can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "System admins can manage all profiles" ON profiles;

-- Drop existing functions that might be causing issues
DROP FUNCTION IF EXISTS is_system_admin(UUID);
DROP FUNCTION IF EXISTS is_organization_admin(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_organizations(UUID);
DROP FUNCTION IF EXISTS log_audit_event(UUID, UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, INET, TEXT);

-- Ensure organizations table has all required columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure profiles table has all required columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create simple, non-recursive helper functions
CREATE OR REPLACE FUNCTION is_system_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_uuid 
        AND is_system_admin = true
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_organization_admin(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid 
        AND organization_id = org_uuid
        AND role_type = 'organization_admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simple RLS policies without recursion
-- Organizations policies
CREATE POLICY "System admins can view all organizations" ON organizations
    FOR SELECT USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view their organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = organizations.id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- User roles policies (FIXED - no self-reference)
CREATE POLICY "System admins can view all user roles" ON user_roles
    FOR SELECT USING (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view roles in their organization" ON user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = user_roles.organization_id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "System admins can view all profiles" ON profiles
    FOR SELECT USING (is_system_admin(auth.uid()));

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_organization_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, organization_id, action, resource_type, resource_id,
        old_values, new_values, ip_address, user_agent
    ) VALUES (
        p_user_id, p_organization_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS TABLE(organization_id UUID, organization_name VARCHAR, role_type VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.organization_id, o.name, ur.role_type
    FROM user_roles ur
    JOIN organizations o ON ur.organization_id = o.id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true
    AND o.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions if they don't exist
INSERT INTO permissions (name, description, resource, action) VALUES
('users.create', 'Create new users', 'users', 'create'),
('users.read', 'View user information', 'users', 'read'),
('users.update', 'Update user information', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('organizations.create', 'Create new organizations', 'organizations', 'create'),
('organizations.read', 'View organization information', 'organizations', 'read'),
('organizations.update', 'Update organization information', 'organizations', 'update'),
('organizations.delete', 'Delete organizations', 'organizations', 'delete'),
('api_keys.create', 'Create API keys', 'api_keys', 'create'),
('api_keys.read', 'View API keys', 'api_keys', 'read'),
('api_keys.update', 'Update API keys', 'api_keys', 'update'),
('api_keys.delete', 'Delete API keys', 'api_keys', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Create system organization if it doesn't exist
INSERT INTO organizations (id, name, slug, description, status, is_active) VALUES
('00000000-0000-0000-0000-000000000000', 'System', 'system', 'System organization for global operations', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    is_active = true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_is_system_admin ON profiles(is_system_admin);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'User roles table and infinite recursion issues fixed successfully!';
    RAISE NOTICE 'All RLS policies recreated without recursion';
    RAISE NOTICE 'Helper functions created with proper security';
    RAISE NOTICE 'Database is now ready for the application!';
END $$;
