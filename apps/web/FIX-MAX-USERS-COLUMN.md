# Fix: Missing max_users Column in Organizations Table

## Problem
The error `column "organizations.max_users" does not exist` indicates that your database is missing the `max_users` column in the `organizations` table. This column is required by the application code but wasn't created during the initial database setup.

## Solution Options

### Option 1: Run the Automated Migration Script (Recommended)

1. **Make sure you have the required environment variables set:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the migration script:**
   ```bash
   node add-missing-columns.mjs
   ```

### Option 2: Manual SQL Execution (If script fails)

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the following SQL commands:**

```sql
-- Add missing columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_apis INTEGER DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free' 
  CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise'));

-- Update existing records with default values
UPDATE organizations 
SET max_users = 10 
WHERE max_users IS NULL;

UPDATE organizations 
SET max_apis = 5 
WHERE max_apis IS NULL;

UPDATE organizations 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- Add helpful comments
COMMENT ON COLUMN organizations.max_users IS 'Maximum number of users allowed in this organization';
COMMENT ON COLUMN organizations.max_apis IS 'Maximum number of APIs allowed in this organization';
COMMENT ON COLUMN organizations.subscription_plan IS 'Subscription plan: free, basic, premium, or enterprise';
```

### Option 3: Using Supabase CLI

If you have the Supabase CLI installed:

1. **Create a new migration:**
   ```bash
   supabase migration new add_max_users_column
   ```

2. **Add the SQL content to the generated migration file**

3. **Apply the migration:**
   ```bash
   supabase db push
   ```

## Verification

After running any of the above solutions, verify the fix by:

1. **Check the table structure:**
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'organizations' 
   AND column_name IN ('max_users', 'max_apis', 'subscription_plan');
   ```

2. **Test a query:**
   ```sql
   SELECT id, name, max_users, max_apis, subscription_plan 
   FROM organizations 
   LIMIT 5;
   ```

## What These Columns Do

- **`max_users`**: Limits the number of users that can be added to an organization
- **`max_apis`**: Limits the number of APIs that can be managed by an organization  
- **`subscription_plan`**: Tracks the organization's subscription level (free, basic, premium, enterprise)

## Files Created

- `add-max-users-column.sql` - Raw SQL migration
- `add-missing-columns.mjs` - Automated Node.js migration script
- `run-max-users-migration.mjs` - Alternative migration script

## Next Steps

After fixing the database schema:

1. Restart your application
2. Test the organization settings functionality
3. Verify that the admin panel works correctly
4. Check that user limits are enforced properly

## Prevention

To prevent this issue in the future:
- Always run the complete schema setup when initializing a new database
- Use the `multi-role-schema.sql` file which includes all required columns
- Consider using database migrations for schema changes