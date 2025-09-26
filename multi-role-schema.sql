-- =====================================================
-- Multi-Role Administration Panel Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
  max_users INTEGER DEFAULT 10,
  max_apis INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER ROLES TABLE
-- =====================================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('system_admin', 'org_admin', 'user')),
  permissions JSONB DEFAULT '[]',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, organization_id)
);

-- =====================================================
-- API ACCESS CONTROL TABLE
-- =====================================================
CREATE TABLE api_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  api_name VARCHAR(255) NOT NULL,
  api_endpoint VARCHAR(255) NOT NULL,
  allowed_methods TEXT[] DEFAULT '{"GET"}',
  rate_limit INTEGER DEFAULT 1000,
  rate_limit_period VARCHAR(20) DEFAULT 'hour' CHECK (rate_limit_period IN ('minute', 'hour', 'day')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER INVITATIONS TABLE
-- =====================================================
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('org_admin', 'user')),
  invited_by UUID REFERENCES auth.users(id),
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION SETTINGS TABLE
-- =====================================================
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

-- API access control indexes
CREATE INDEX idx_api_access_user_id ON api_access_control(user_id);
CREATE INDEX idx_api_access_organization_id ON api_access_control(organization_id);
CREATE INDEX idx_api_access_api_name ON api_access_control(api_name);

-- User invitations indexes
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_organization_id ON user_invitations(organization_id);
CREATE INDEX idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

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
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = organizations.id
      AND ur.role_type IN ('org_admin', 'system_admin')
      AND ur.is_active = true
    )
  );

-- User roles policies
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_type = 'system_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Organization admins can manage org roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = user_roles.organization_id
      AND ur.role_type IN ('org_admin', 'system_admin')
      AND ur.is_active = true
    )
  );

-- API access control policies
CREATE POLICY "Users can view own API access" ON api_access_control
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organization admins can manage org API access" ON api_access_control
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = api_access_control.organization_id
      AND ur.role_type IN ('org_admin', 'system_admin')
      AND ur.is_active = true
    )
  );

-- User invitations policies
CREATE POLICY "Organization admins can manage org invitations" ON user_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = user_invitations.organization_id
      AND ur.role_type IN ('org_admin', 'system_admin')
      AND ur.is_active = true
    )
  );

-- Audit logs policies
CREATE POLICY "System admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_type = 'system_admin'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Organization admins can view org audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = audit_logs.organization_id
      AND ur.role_type IN ('org_admin', 'system_admin')
      AND ur.is_active = true
    )
  );

-- Organization settings policies
CREATE POLICY "Organization admins can manage org settings" ON organization_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = organization_settings.organization_id
      AND ur.role_type IN ('org_admin', 'system_admin')
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

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_access_control_updated_at BEFORE UPDATE ON api_access_control
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON organization_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        COALESCE(NEW.organization_id, OLD.organization_id),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Audit triggers
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_api_access_control AFTER INSERT OR UPDATE OR DELETE ON api_access_control
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default permissions
INSERT INTO permissions (name, description, category, resource, action) VALUES
-- System Admin Permissions
('system:admin', 'Full system administration access', 'system', 'system', 'admin'),
('system:organizations:manage', 'Manage all organizations', 'system', 'organizations', 'manage'),
('system:users:manage', 'Manage all users across organizations', 'system', 'users', 'manage'),
('system:apis:manage', 'Manage system-wide APIs', 'system', 'apis', 'manage'),
('system:analytics:view', 'View system-wide analytics', 'system', 'analytics', 'view'),

-- Organization Admin Permissions
('org:admin', 'Organization administration access', 'organization', 'organization', 'admin'),
('org:users:manage', 'Manage organization users', 'organization', 'users', 'manage'),
('org:apis:manage', 'Manage organization APIs', 'organization', 'apis', 'manage'),
('org:analytics:view', 'View organization analytics', 'organization', 'analytics', 'view'),
('org:settings:manage', 'Manage organization settings', 'organization', 'settings', 'manage'),
('org:invitations:manage', 'Manage user invitations', 'organization', 'invitations', 'manage'),

-- User Permissions
('user:basic', 'Basic user access', 'user', 'user', 'basic'),
('user:apis:access', 'Access assigned APIs', 'user', 'apis', 'access'),
('user:dashboard:view', 'View personal dashboard', 'user', 'dashboard', 'view');

-- Create default system organization
INSERT INTO organizations (name, slug, description, subscription_plan, max_users, max_apis) VALUES
('System Organization', 'system', 'Default system organization for system administrators', 'enterprise', 1000, 100);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_name VARCHAR(100),
    p_organization_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Check if user is system admin (has all permissions)
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = p_user_id
        AND ur.role_type = 'system_admin'
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ) INTO has_permission;
    
    IF has_permission THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permission
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = p_user_id
        AND (p_organization_id IS NULL OR ur.organization_id = p_organization_id)
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND (
            ur.permissions @> to_jsonb(ARRAY[p_permission_name])
            OR ur.role_type IN ('org_admin', 'system_admin')
        )
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE (
    role_type VARCHAR(50),
    organization_id UUID,
    organization_name VARCHAR(255),
    organization_slug VARCHAR(100),
    permissions JSONB,
    assigned_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role_type,
        ur.organization_id,
        o.name as organization_name,
        o.slug as organization_slug,
        ur.permissions,
        ur.assigned_at,
        ur.expires_at
    FROM user_roles ur
    JOIN organizations o ON ur.organization_id = o.id
    WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY ur.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Multi-Role Administration Panel database schema created successfully!';
    RAISE NOTICE 'Tables created: organizations, user_roles, permissions, api_access_control, user_invitations, audit_logs, organization_settings';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Helper functions created: user_has_permission(), get_user_roles()';
    RAISE NOTICE 'Default permissions and system organization seeded';
END $$;
