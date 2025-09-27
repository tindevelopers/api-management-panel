-- =====================================================
-- Fix Infinite Recursion in RLS Policies
-- =====================================================
-- This migration fixes the infinite recursion issue in user_roles policies
-- by using helper functions instead of direct table references
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "System admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Organization admins can view roles in their organization" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Drop existing problematic organization policies
DROP POLICY IF EXISTS "System admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can view their organization" ON organizations;

-- Drop existing problematic profile policies
DROP POLICY IF EXISTS "System admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Organization admins can view profiles in their org" ON profiles;

-- =====================================================
-- HELPER FUNCTIONS (CREATE OR REPLACE)
-- =====================================================

-- Check if user is system admin (using direct query to avoid recursion)
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

-- Check if user is organization admin for a specific org
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

-- Get user's organization IDs (for organization admins)
CREATE OR REPLACE FUNCTION get_user_organization_ids(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT organization_id 
        FROM user_roles 
        WHERE user_id = user_uuid 
        AND role_type = 'organization_admin' 
        AND is_active = true
        AND organization_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIXED RLS POLICIES
-- =====================================================

-- Organizations policies (using helper functions)
CREATE POLICY "System admins can manage all organizations" ON organizations
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view their organization" ON organizations
    FOR SELECT USING (
        id = ANY(get_user_organization_ids(auth.uid()))
    );

-- User roles policies (using helper functions to avoid recursion)
CREATE POLICY "System admins can manage all user roles" ON user_roles
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage roles in their org" ON user_roles
    FOR ALL USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
    );

-- Permissions policies
CREATE POLICY "System admins can manage all permissions" ON permissions
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "All authenticated users can read permissions" ON permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- API access control policies
CREATE POLICY "System admins can manage all API access" ON api_access_control
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can manage API access in their org" ON api_access_control
    FOR ALL USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
    );

-- User invitations policies
CREATE POLICY "System admins can manage all invitations" ON user_invitations
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can manage invitations in their org" ON user_invitations
    FOR ALL USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
    );

-- Audit logs policies
CREATE POLICY "System admins can view all audit logs" ON audit_logs
    FOR SELECT USING (is_system_admin(auth.uid()));

CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view org audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
    );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "System admins can manage all profiles" ON profiles
    FOR ALL USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view profiles in their org" ON profiles
    FOR SELECT USING (
        id IN (
            SELECT user_id FROM user_roles 
            WHERE organization_id = ANY(get_user_organization_ids(auth.uid()))
            AND is_active = true
        )
    );

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Fixed infinite recursion in RLS policies!';
    RAISE NOTICE 'Helper functions created: is_system_admin, is_organization_admin, get_user_organization_ids';
    RAISE NOTICE 'RLS policies updated to use helper functions instead of direct table references';
    RAISE NOTICE 'Infinite recursion issue resolved!';
END $$;
