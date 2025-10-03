-- Add missing INSERT/UPDATE/DELETE policies for organizations table
-- Migration: 20250928190000_add_organization_crud_policies.sql

-- Add INSERT policy for organizations (system admins can create)
CREATE POLICY "System admins can create organizations" ON organizations
    FOR INSERT WITH CHECK (is_system_admin(auth.uid()));

-- Add UPDATE policy for organizations (system admins can update)
CREATE POLICY "System admins can update organizations" ON organizations
    FOR UPDATE USING (is_system_admin(auth.uid()));

-- Add DELETE policy for organizations (system admins can delete)
CREATE POLICY "System admins can delete organizations" ON organizations
    FOR DELETE USING (is_system_admin(auth.uid()));

-- Also add a policy to allow anonymous inserts for testing (TEMPORARY)
CREATE POLICY "Allow anonymous organization creation for testing" ON organizations
    FOR INSERT WITH CHECK (true);

-- Add a policy to allow anonymous reads for testing (TEMPORARY)
CREATE POLICY "Allow anonymous organization reads for testing" ON organizations
    FOR SELECT USING (true);

SELECT 'Organization CRUD policies added successfully!' as message;