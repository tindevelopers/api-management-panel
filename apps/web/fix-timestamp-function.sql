-- =====================================================
-- Fix Timestamp Function - Create Missing Function
-- =====================================================

-- Create the missing update_timestamp_column function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Timestamp function created successfully!';
    RAISE NOTICE 'All triggers should now work properly.';
END $$;



