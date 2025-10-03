-- Verification script to check that all tables and columns exist
-- Run this in Supabase SQL Editor to verify the migration was successful

-- 1. Check that organizations table exists with all required columns
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY column_name;

-- 2. Check sample data from organizations table
SELECT 
    id, 
    name, 
    slug, 
    max_users, 
    max_apis, 
    subscription_plan,
    is_active,
    created_at
FROM organizations 
LIMIT 5;

-- 3. List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 4. Check that the required columns specifically exist
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' AND column_name = 'max_users'
        ) THEN '✅ max_users column exists'
        ELSE '❌ max_users column missing'
    END as max_users_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' AND column_name = 'max_apis'
        ) THEN '✅ max_apis column exists'
        ELSE '❌ max_apis column missing'
    END as max_apis_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' AND column_name = 'subscription_plan'
        ) THEN '✅ subscription_plan column exists'
        ELSE '❌ subscription_plan column missing'
    END as subscription_plan_status;