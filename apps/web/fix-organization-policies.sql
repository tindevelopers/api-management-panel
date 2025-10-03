-- Fix missing INSERT policy for organizations table
-- This allows system admins to create new organizations

-- Add INSERT policy for organizations
CREATE POLICY "System admins can create organizations" ON organizations
    FOR INSERT WITH CHECK (is_system_admin(auth.uid()));

-- Add UPDATE policy for organizations  
CREATE POLICY "System admins can update organizations" ON organizations
    FOR UPDATE USING (is_system_admin(auth.uid()));

-- Add DELETE policy for organizations
CREATE POLICY "System admins can delete organizations" ON organizations
    FOR DELETE USING (is_system_admin(auth.uid()));

-- Verify the helper function exists
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

SELECT 'Organization INSERT/UPDATE/DELETE policies added for system admins!' as message;