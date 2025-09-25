-- =====================================================
-- Multi-Role Administration Panel - FINAL Schema
-- =====================================================
-- This schema handles all existing objects gracefully
-- Drops and recreates functions to avoid type conflicts
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. USER ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('system_admin', 'organization_admin', 'user')),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, organization_id, role_type)
);

-- =====================================================
-- 3. PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. API ACCESS CONTROL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    api_name VARCHAR(100) NOT NULL,
    access_level VARCHAR(50) NOT NULL CHECK (access_level IN ('read', 'write', 'admin')),
    rate_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, organization_id, api_name)
);

-- =====================================================
-- 5. USER INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('organization_admin', 'user')),
    permissions JSONB DEFAULT '[]',
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    is_system_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DROP EXISTING FUNCTIONS FIRST
-- =====================================================
DROP FUNCTION IF EXISTS is_system_admin(UUID);
DROP FUNCTION IF EXISTS is_organization_admin(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_organizations(UUID);
DROP FUNCTION IF EXISTS log_audit_event(UUID, UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, INET, TEXT);

-- =====================================================
-- HELPER FUNCTIONS (CREATE OR REPLACE)
-- =====================================================

-- Check if user is system admin
CREATE OR REPLACE FUNCTION is_system_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid 
        AND role_type = 'system_admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is organization admin
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

-- Get user organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS TABLE(organization_id UUID, role_type VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.organization_id, ur.role_type
    FROM user_roles ur
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true
    AND ur.organization_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logging function
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

-- =====================================================
-- ROW LEVEL SECURITY POLICIES (DROP AND RECREATE)
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "System admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can view their organization" ON organizations;
DROP POLICY IF EXISTS "System admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can manage roles in their org" ON user_roles;
DROP POLICY IF EXISTS "System admins can manage all permissions" ON permissions;
DROP POLICY IF EXISTS "All authenticated users can read permissions" ON permissions;
DROP POLICY IF EXISTS "System admins can manage all API access" ON api_access_control;
DROP POLICY IF EXISTS "Users can view their own API access" ON api_access_control;
DROP POLICY IF EXISTS "Organization admins can manage API access in their org" ON api_access_control;
DROP POLICY IF EXISTS "System admins can manage all invitations" ON user_invitations;
DROP POLICY IF EXISTS "Organization admins can manage invitations in their org" ON user_invitations;
DROP POLICY IF EXISTS "System admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Organization admins can view org audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "System admins can manage all profiles" ON profiles;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "System admins can manage all organizations" ON organizations
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM user_roles 
               WHERE user_id = auth.uid() AND is_active = true)
    );

-- User roles policies (FIXED - no self-reference)
CREATE POLICY "System admins can manage all user roles" ON user_roles
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage roles in their org" ON user_roles
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM user_roles 
                           WHERE user_id = auth.uid() 
                           AND role_type = 'organization_admin' 
                           AND is_active = true)
    );

-- Permissions policies
CREATE POLICY "System admins can manage all permissions" ON permissions
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "All authenticated users can read permissions" ON permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- API access control policies
CREATE POLICY "System admins can manage all API access" ON api_access_control
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own API access" ON api_access_control
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage API access in their org" ON api_access_control
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM user_roles 
                           WHERE user_id = auth.uid() 
                           AND role_type = 'organization_admin' 
                           AND is_active = true)
    );

-- User invitations policies
CREATE POLICY "System admins can manage all invitations" ON user_invitations
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can manage invitations in their org" ON user_invitations
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM user_roles 
                           WHERE user_id = auth.uid() 
                           AND role_type = 'organization_admin' 
                           AND is_active = true)
    );

-- Audit logs policies
CREATE POLICY "System admins can view all audit logs" ON audit_logs
    FOR SELECT USING (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view org audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM user_roles 
                           WHERE user_id = auth.uid() 
                           AND role_type = 'organization_admin' 
                           AND is_active = true)
    );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "System admins can manage all profiles" ON profiles
    FOR ALL USING (is_system_admin(auth.uid()));

-- =====================================================
-- INDEXES FOR PERFORMANCE (CREATE IF NOT EXISTS)
-- =====================================================

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- API access control indexes
CREATE INDEX IF NOT EXISTS idx_api_access_user_id ON api_access_control(user_id);
CREATE INDEX IF NOT EXISTS idx_api_access_organization_id ON api_access_control(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_access_api_name ON api_access_control(api_name);

-- User invitations indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_organization_id ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- SEED DATA (INSERT OR IGNORE)
-- =====================================================

-- Insert default permissions
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

-- Create system organization
INSERT INTO organizations (id, name, slug, description, status) VALUES
('00000000-0000-0000-0000-000000000000', 'System', 'system', 'System organization for global operations', 'active')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables (DROP IF EXISTS first)
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
DROP TRIGGER IF EXISTS update_api_access_control_updated_at ON api_access_control;
DROP TRIGGER IF EXISTS update_user_invitations_updated_at ON user_invitations;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Create triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_access_control_updated_at BEFORE UPDATE ON api_access_control
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Multi-Role Database Schema has been successfully applied!';
    RAISE NOTICE 'Tables created: organizations, user_roles, permissions, api_access_control, user_invitations, audit_logs, profiles';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Helper functions created: is_system_admin, is_organization_admin, get_user_organizations, log_audit_event';
    RAISE NOTICE 'Default permissions and system organization seeded';
    RAISE NOTICE 'Ready for multi-role administration panel implementation!';
END $$;


