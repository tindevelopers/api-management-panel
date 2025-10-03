-- Final fix for infinite recursion in RLS policies
-- This migration completely removes all problematic policies and recreates them properly

-- Drop ALL existing policies on all tables to ensure clean state
DROP POLICY IF EXISTS "System admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "System admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can manage roles in their organization" ON user_roles;
DROP POLICY IF EXISTS "System admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can manage organization roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON profiles;
DROP POLICY IF EXISTS "System admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Organization members can view their API access" ON api_access_control;
DROP POLICY IF EXISTS "Organization admins can manage their API access" ON api_access_control;

-- Ensure helper functions exist (recreate if needed)
CREATE OR REPLACE FUNCTION is_system_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = $1 
        AND role_type = 'system_admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_admin(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = $1 
        AND user_roles.organization_id = $2
        AND role_type IN ('system_admin', 'organization_admin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simple, non-recursive policies

-- Organizations policies (no recursion)
CREATE POLICY "System admins can view all organizations" ON organizations
    FOR SELECT USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view their organization" ON organizations
    FOR SELECT USING (is_org_admin(auth.uid(), id));

-- User roles policies (no recursion - using helper functions)
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System admins can manage all roles" ON user_roles
    FOR ALL USING (is_system_admin(auth.uid()));

-- Profiles policies (no recursion)
CREATE POLICY "Users can view and update their own profile" ON profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY "System admins can view all profiles" ON profiles
    FOR SELECT USING (is_system_admin(auth.uid()));

-- API access control policies (no recursion)
CREATE POLICY "Organization members can view their API access" ON api_access_control
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_roles 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Organization admins can manage their API access" ON api_access_control
    FOR ALL USING (is_org_admin(auth.uid(), organization_id));

-- Add a completion message
SELECT 'Final RLS policy fix applied - all circular dependencies removed!' as message;