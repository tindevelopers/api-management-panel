-- =====================================================
-- RESET DATABASE - Remove all existing multi-role objects
-- =====================================================

-- Drop all existing policies first
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
DROP POLICY IF EXISTS "Allow all for organizations" ON organizations;
DROP POLICY IF EXISTS "Allow all for user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow all for permissions" ON permissions;
DROP POLICY IF EXISTS "Allow all for api_access_control" ON api_access_control;
DROP POLICY IF EXISTS "Allow all for user_invitations" ON user_invitations;
DROP POLICY IF EXISTS "Allow all for audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow all for profiles" ON profiles;

-- Drop all existing functions
DROP FUNCTION IF EXISTS is_system_admin(UUID);
DROP FUNCTION IF EXISTS is_organization_admin(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_organizations(UUID);
DROP FUNCTION IF EXISTS log_audit_event(UUID, UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, INET, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop all existing tables (in reverse dependency order)
-- This will automatically drop all triggers that depend on these tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS api_access_control CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Now drop the function (after all tables and their triggers are dropped)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all existing indexes
DROP INDEX IF EXISTS idx_user_roles_user_id;
DROP INDEX IF EXISTS idx_user_roles_organization_id;
DROP INDEX IF EXISTS idx_user_roles_role_type;
DROP INDEX IF EXISTS idx_user_roles_active;
DROP INDEX IF EXISTS idx_api_access_user_id;
DROP INDEX IF EXISTS idx_api_access_organization_id;
DROP INDEX IF EXISTS idx_api_access_api_name;
DROP INDEX IF EXISTS idx_user_invitations_email;
DROP INDEX IF EXISTS idx_user_invitations_organization_id;
DROP INDEX IF EXISTS idx_user_invitations_token;
DROP INDEX IF EXISTS idx_user_invitations_status;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_organization_id;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_created_at;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Database reset complete! All multi-role objects have been removed.';
    RAISE NOTICE 'You can now run the minimal schema without conflicts.';
END $$;
