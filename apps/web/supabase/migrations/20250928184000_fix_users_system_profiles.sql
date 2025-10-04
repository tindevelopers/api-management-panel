-- Fix Users System: Add Missing Columns to Profiles Table
-- This migration adds the missing columns needed for the users system to work

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create unique index on user_id to ensure one profile per user
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON profiles(user_id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Update RLS policies for profiles table to work with user_id
DROP POLICY IF EXISTS "Users can view and update their own profile" ON profiles;
DROP POLICY IF EXISTS "System admins can view all profiles" ON profiles;

-- Create new RLS policies that work with user_id
CREATE POLICY "Users can view and update their own profile" ON profiles
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System admins can view all profiles" ON profiles
    FOR SELECT USING (is_system_admin(auth.uid()));

-- Create a function to automatically create profiles for new users
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- Add completion message
SELECT 'Users system database fix applied - profiles table now has user_id and email columns!' as message;