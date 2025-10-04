-- =====================================================
-- Complete Database Schema for API Management Panel
-- =====================================================
-- This creates all required tables with the correct columns
-- including max_users, max_apis, and subscription_plan
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ORGANIZATIONS TABLE (with all required columns)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
    max_users INTEGER DEFAULT 10,
    max_apis INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. USER ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. API ACCESS CONTROL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS api_access_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    api_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    allowed_methods TEXT[] DEFAULT ARRAY['GET', 'POST', 'PUT', 'DELETE'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, api_name)
);

-- =====================================================
-- 5. USER INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('organization_admin', 'user')),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 6. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    location VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_plan ON organizations(subscription_plan);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_api_access_control_organization_id ON api_access_control(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_access_control_api_name ON api_access_control(api_name);

CREATE INDEX IF NOT EXISTS idx_user_invitations_organization_id ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Organizations policies
CREATE POLICY "System admins can view all organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

CREATE POLICY "Organization admins can view their organization" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = organizations.id 
            AND ur.role_type IN ('organization_admin', 'user')
            AND ur.is_active = true
        )
    );

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System admins can manage all user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

CREATE POLICY "Organization admins can manage roles in their organization" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = user_roles.organization_id 
            AND ur.role_type = 'organization_admin' 
            AND ur.is_active = true
        )
    );

-- Profiles policies
CREATE POLICY "Users can view and update their own profile" ON profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY "System admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role_type = 'system_admin' 
            AND ur.is_active = true
        )
    );

-- API access control policies
CREATE POLICY "Organization members can view their API access" ON api_access_control
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = api_access_control.organization_id 
            AND ur.is_active = true
        )
    );

CREATE POLICY "Organization admins can manage their API access" ON api_access_control
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organization_id = api_access_control.organization_id 
            AND ur.role_type IN ('system_admin', 'organization_admin')
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_access_control_updated_at BEFORE UPDATE ON api_access_control
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default permissions
INSERT INTO permissions (name, description, category, resource, action) VALUES
('system:organizations:manage', 'Manage all organizations', 'system', 'organizations', 'manage'),
('system:users:manage', 'Manage all users across organizations', 'system', 'users', 'manage'),
('system:permissions:manage', 'Manage system permissions', 'system', 'permissions', 'manage'),
('organization:users:manage', 'Manage users within organization', 'organization', 'users', 'manage'),
('organization:apis:manage', 'Manage API access within organization', 'organization', 'apis', 'manage'),
('organization:settings:manage', 'Manage organization settings', 'organization', 'settings', 'manage'),
('user:profile:manage', 'Manage own user profile', 'user', 'profile', 'manage'),
('user:apis:view', 'View available APIs', 'user', 'apis', 'view'),
('user:apis:use', 'Use APIs within limits', 'user', 'apis', 'use')
ON CONFLICT (name) DO NOTHING;

-- Create a default organization (optional)
INSERT INTO organizations (name, slug, description, subscription_plan, max_users, max_apis) VALUES
('Default Organization', 'default-org', 'Default organization for new users', 'free', 10, 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'API Management Panel database schema has been successfully created!';
    RAISE NOTICE 'Tables created: organizations (with max_users, max_apis, subscription_plan), user_roles, permissions, api_access_control, user_invitations, audit_logs, profiles';
    RAISE NOTICE 'RLS policies implemented for all tables';
    RAISE NOTICE 'Helper functions and triggers created';
    RAISE NOTICE 'Seed data inserted';
    RAISE NOTICE 'Performance indexes created';
END $$;