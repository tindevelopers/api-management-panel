-- Migration: Add max_users column to organizations table
-- This fixes the error: column "organizations.max_users" does not exist

-- Add the max_users column to the organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;

-- Add the max_apis column as well (in case it's also missing)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS max_apis INTEGER DEFAULT 5;

-- Add subscription_plan column if it doesn't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free' 
CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise'));

-- Update existing organizations to have default values if they were NULL
UPDATE organizations 
SET max_users = 10 
WHERE max_users IS NULL;

UPDATE organizations 
SET max_apis = 5 
WHERE max_apis IS NULL;

UPDATE organizations 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN organizations.max_users IS 'Maximum number of users allowed in this organization';
COMMENT ON COLUMN organizations.max_apis IS 'Maximum number of APIs allowed in this organization';
COMMENT ON COLUMN organizations.subscription_plan IS 'Subscription plan: free, basic, premium, or enterprise';