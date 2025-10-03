-- Simple fix for missing columns in organizations table
-- Run this directly in Supabase SQL Editor

-- Check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add max_users column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'max_users'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_users INTEGER DEFAULT 10;
        RAISE NOTICE 'Added max_users column';
    ELSE
        RAISE NOTICE 'max_users column already exists';
    END IF;

    -- Add max_apis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'max_apis'
    ) THEN
        ALTER TABLE organizations ADD COLUMN max_apis INTEGER DEFAULT 5;
        RAISE NOTICE 'Added max_apis column';
    ELSE
        RAISE NOTICE 'max_apis column already exists';
    END IF;

    -- Add subscription_plan column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE organizations ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free';
        RAISE NOTICE 'Added subscription_plan column';
    ELSE
        RAISE NOTICE 'subscription_plan column already exists';
    END IF;
END $$;

-- Update existing records to have default values if they are NULL
UPDATE organizations 
SET max_users = 10 
WHERE max_users IS NULL;

UPDATE organizations 
SET max_apis = 5 
WHERE max_apis IS NULL;

UPDATE organizations 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Add check constraint for subscription_plan if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'organizations_subscription_plan_check'
    ) THEN
        ALTER TABLE organizations 
        ADD CONSTRAINT organizations_subscription_plan_check 
        CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise'));
        RAISE NOTICE 'Added subscription_plan check constraint';
    ELSE
        RAISE NOTICE 'subscription_plan check constraint already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('max_users', 'max_apis', 'subscription_plan')
ORDER BY column_name;