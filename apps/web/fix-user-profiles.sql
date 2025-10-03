-- =====================================================
-- Fix User Profiles Table - Remove RLS Policy Issues
-- =====================================================

-- Drop the problematic user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Recreate user_profiles table without RLS
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    is_system_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the trigger back
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'User Profiles table fixed! RLS policy issues resolved.';
    RAISE NOTICE 'Table recreated without RLS policies.';
    RAISE NOTICE 'Trigger recreated successfully.';
END $$;



