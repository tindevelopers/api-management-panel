-- =====================================================
-- Multi-Role Administration Panel - Complete Database Schema
-- =====================================================
-- This schema implements a comprehensive multi-role system with:
-- - System Admin and Organization Admin roles
-- - Multi-tenant organization support
-- - Granular permissions system
-- - Audit logging and security
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE organizations (
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
CREATE TABLE user_roles (
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
CREATE TABLE permissions (
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
CREATE TABLE api_access_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    api_name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    allowed_roles JSONB DEFAULT '[]',
    rate_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 5. USER INVITATIONS TABLE
-- =====================================================
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('organization_admin', 'user')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
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
-- 7. PROFILES TABLE (Enhanced)
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ORGANIZATIONS RLS POLICIES
-- =====================================================
-- System admins can see all organizations
CREATE POLICY "System admins can view all organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- Organization admins can see their organization
CREATE POLICY "Organization admins can view their organization" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = organizations.id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- =====================================================
-- USER ROLES RLS POLICIES
-- =====================================================
-- System admins can see all user roles
CREATE POLICY "System admins can view all user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- Organization admins can see roles in their organization
CREATE POLICY "Organization admins can view roles in their organization" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = user_roles.organization_id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- Users can see their own roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- PERMISSIONS RLS POLICIES
-- =====================================================
-- System admins can manage all permissions
CREATE POLICY "System admins can manage permissions" ON permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- =====================================================
-- API ACCESS CONTROL RLS POLICIES
-- =====================================================
-- System admins can manage all API access
CREATE POLICY "System admins can manage API access" ON api_access_control
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- Organization admins can manage API access for their organization
CREATE POLICY "Organization admins can manage API access for their org" ON api_access_control
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = api_access_control.organization_id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- =====================================================
-- USER INVITATIONS RLS POLICIES
-- =====================================================
-- System admins can manage all invitations
CREATE POLICY "System admins can manage all invitations" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- Organization admins can manage invitations for their organization
CREATE POLICY "Organization admins can manage invitations for their org" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = user_invitations.organization_id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- =====================================================
-- AUDIT LOGS RLS POLICIES
-- =====================================================
-- System admins can view all audit logs
CREATE POLICY "System admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- Organization admins can view audit logs for their organization
CREATE POLICY "Organization admins can view audit logs for their org" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = audit_logs.organization_id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- =====================================================
-- PROFILES RLS POLICIES
-- =====================================================
-- Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- System admins can view all profiles
CREATE POLICY "System admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- Organization admins can view profiles in their organization
CREATE POLICY "Organization admins can view profiles in their org" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id IN (
                SELECT organization_id FROM user_roles 
                WHERE user_id = profiles.id 
                AND is_active = true
            )
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has system admin role
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

-- Function to check if user has organization admin role
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

-- Function to get user's organizations
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

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_organization_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_old_values JSONB,
    p_new_values JSONB,
    p_ip_address INET,
    p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, organization_id, action, resource_type, 
        resource_id, old_values, new_values, ip_address, user_agent
    ) VALUES (
        p_user_id, p_organization_id, p_action, p_resource_type,
        p_resource_id, p_old_values, p_new_values, p_ip_address, p_user_agent
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
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
-- SEED DATA
-- =====================================================

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('organizations.create', 'Create new organizations', 'organizations', 'create'),
('organizations.read', 'View organizations', 'organizations', 'read'),
('organizations.update', 'Update organizations', 'organizations', 'update'),
('organizations.delete', 'Delete organizations', 'organizations', 'delete'),
('users.create', 'Create new users', 'users', 'create'),
('users.read', 'View users', 'users', 'read'),
('users.update', 'Update users', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('roles.assign', 'Assign roles to users', 'roles', 'assign'),
('roles.revoke', 'Revoke roles from users', 'roles', 'revoke'),
('api.access', 'Access API endpoints', 'api', 'access'),
('audit.view', 'View audit logs', 'audit', 'view');

-- Create system organization
INSERT INTO organizations (id, name, slug, description, status) VALUES
('00000000-0000-0000-0000-000000000000', 'System', 'system', 'System organization for platform management', 'active');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- User invitations indexes
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_organization_id ON user_invitations(organization_id);
CREATE INDEX idx_user_invitations_token ON user_invitations(token);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);

-- API access control indexes
CREATE INDEX idx_api_access_control_organization_id ON api_access_control(organization_id);
CREATE INDEX idx_api_access_control_api_name ON api_access_control(api_name);
CREATE INDEX idx_api_access_control_active ON api_access_control(is_active);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Multi-Role Administration Panel database schema has been successfully created!';
    RAISE NOTICE 'Tables created: organizations, user_roles, permissions, api_access_control, user_invitations, audit_logs, profiles';
    RAISE NOTICE 'RLS policies implemented for all tables';
    RAISE NOTICE 'Helper functions and triggers created';
    RAISE NOTICE 'Seed data inserted';
    RAISE NOTICE 'Performance indexes created';
END $$;
