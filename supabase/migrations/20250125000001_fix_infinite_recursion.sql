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
DROP POLICY IF EXISTS "Organization admins can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Drop existing functions if they exist to prevent conflicts
DROP FUNCTION IF EXISTS is_system_admin(uuid);
DROP FUNCTION IF EXISTS is_org_admin(uuid, uuid);
DROP FUNCTION IF EXISTS is_self(uuid, uuid);

-- Create helper function to check if a user is a system admin
CREATE OR REPLACE FUNCTION is_system_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = is_system_admin.user_id
      AND user_roles.role_type = 'system_admin'
      AND user_roles.is_active = TRUE
  );
END;
$$;

-- Create helper function to check if a user is an organization admin for a specific organization
CREATE OR REPLACE FUNCTION is_org_admin(user_id uuid, org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = is_org_admin.user_id
      AND user_roles.organization_id = is_org_admin.org_id
      AND user_roles.role_type = 'organization_admin'
      AND user_roles.is_active = TRUE
  );
END;
$$;

-- Create helper function to check if a user is viewing their own record
CREATE OR REPLACE FUNCTION is_self(requester_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN requester_id = target_id;
END;
$$;

-- =====================================================
-- Table: organizations
-- =====================================================
-- RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view all organizations" ON organizations
FOR SELECT TO authenticated
USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view their organization" ON organizations
FOR SELECT TO authenticated
USING (is_org_admin(auth.uid(), id));

-- =====================================================
-- Table: profiles
-- =====================================================
-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view profiles in their organization" ON profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = profiles.id AND is_active = TRUE
      )
      AND user_roles.role_type = 'organization_admin'
      AND user_roles.is_active = TRUE
  ) OR is_system_admin(auth.uid())
);

CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- =====================================================
-- Table: user_roles
-- =====================================================
-- RLS for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view all user roles" ON user_roles
FOR SELECT TO authenticated
USING (is_system_admin(auth.uid()));

CREATE POLICY "Organization admins can view roles in their organization" ON user_roles
FOR SELECT TO authenticated
USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Users can view their own roles" ON user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
