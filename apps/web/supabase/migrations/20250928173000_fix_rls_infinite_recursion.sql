-- Fix for infinite recursion in RLS policies
-- This migration removes the circular dependency in user_roles policies

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can manage roles in their organization" ON user_roles;
DROP POLICY IF EXISTS "System admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can manage organization roles" ON user_roles;
DROP POLICY IF EXISTS "System admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Organization members can view their API access" ON api_access_control;
DROP POLICY IF EXISTS "Organization admins can manage their API access" ON api_access_control;

-- Create a helper function to check if user is system admin (avoids recursion)
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

-- Create a helper function to check if user is org admin (avoids recursion)
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

-- Create a helper function to get user's organizations (avoids recursion)
CREATE OR REPLACE FUNCTION get_user_organizations(user_id UUID)
RETURNS TABLE(organization_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT user_roles.organization_id
    FROM user_roles
    WHERE user_roles.user_id = $1
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create non-recursive policies using helper functions

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System admins can manage all roles" ON user_roles
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can manage organization roles" ON user_roles
    FOR ALL USING (
        is_system_admin(auth.uid()) OR
        is_org_admin(auth.uid(), user_roles.organization_id)
    );

-- Profiles policies
CREATE POLICY "System admins can view all profiles" ON profiles
    FOR SELECT USING (is_system_admin(auth.uid()));

-- API access control policies
CREATE POLICY "Organization members can view their API access" ON api_access_control
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM get_user_organizations(auth.uid()))
    );

CREATE POLICY "Organization admins can manage their API access" ON api_access_control
    FOR ALL USING (
        is_system_admin(auth.uid()) OR
        is_org_admin(auth.uid(), api_access_control.organization_id)
    );

-- Add a notice
DO $$
BEGIN
    RAISE NOTICE 'RLS policy infinite recursion fix applied successfully!';
    RAISE NOTICE 'Helper functions created to avoid circular dependencies.';
    RAISE NOTICE 'All policies have been recreated without recursion.';
END $$;