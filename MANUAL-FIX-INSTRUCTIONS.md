# Manual Fix for Missing max_users Column

Since the Supabase CLI is having issues with migration history conflicts, here's the manual approach to fix the missing `max_users` column:

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **AI-Model-As-A-Service (Production)** (ID: kgaovsovhggehkpntbzu)
3. Navigate to **SQL Editor** in the left sidebar

## Step 2: Run the Fix SQL

Copy and paste this SQL into the SQL Editor and click "Run":

```sql
-- Check current table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY column_name;
```

## Step 3: Add Missing Columns

If the above query shows that `max_users`, `max_apis`, or `subscription_plan` columns are missing, run this SQL:

```sql
-- Add missing columns to organizations table
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

-- Add check constraint for subscription_plan
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
    END IF;
END $$;
```

## Step 4: Verify the Fix

Run this query to confirm the columns were added:

```sql
-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('max_users', 'max_apis', 'subscription_plan')
ORDER BY column_name;

-- Check sample data
SELECT id, name, max_users, max_apis, subscription_plan 
FROM organizations 
LIMIT 5;
```

## Step 5: Test Your Application

After running the SQL:
1. Restart your application
2. Try accessing the organization settings page
3. The error should be resolved

## Alternative: Use the SQL File

I've created a file `fix-organizations-columns-direct.sql` that contains all the necessary SQL. You can:
1. Open this file
2. Copy its contents
3. Paste into Supabase SQL Editor
4. Run it

This approach bypasses the CLI migration issues and directly fixes the database schema.