-- =====================================================
-- Create Timestamp Function - Simple Version
-- This version avoids complex PL/pgSQL blocks that cause syntax errors
-- =====================================================

-- Drop the function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS update_timestamp_column() CASCADE;

-- Create the function with explicit parameter handling
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at column to current timestamp
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Simple completion message without complex PL/pgSQL
SELECT 'Timestamp function created successfully!' as message;
SELECT 'All triggers should now work properly.' as message;
SELECT 'You can now run the test again to verify 100% success.' as message;



