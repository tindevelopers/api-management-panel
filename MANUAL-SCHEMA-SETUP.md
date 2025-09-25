# Manual Database Schema Setup Guide

## Overview
Since the automated methods are having issues, here's the manual approach to set up the multi-role database schema in Supabase.

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project: "AI-Model-As-A-Service (Production)"

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New query"

### Step 3: Execute the Schema
1. Copy the entire contents of `multi-role-schema-complete.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the schema

### Step 4: Verify Setup
After execution, you should see:
- ✅ All tables created successfully
- ✅ RLS policies enabled
- ✅ Helper functions created
- ✅ Seed data inserted

## Method 2: Using Supabase CLI (Alternative)

If you have the service role key, you can try:

### Step 1: Add Service Role Key
Add to your `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 2: Run Setup Script
```bash
node setup-multi-role-schema.mjs
```

## Method 3: Direct Database Connection

If you have direct database access:

### Step 1: Get Database Connection String
From Supabase Dashboard → Settings → Database:
```
postgresql://postgres:[YOUR-PASSWORD]@db.kgaovsovhggehkpntbzu.supabase.co:5432/postgres
```

### Step 2: Execute Schema
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.kgaovsovhggehkpntbzu.supabase.co:5432/postgres" -f multi-role-schema-complete.sql
```

## Verification Steps

### 1. Check Tables Exist
In Supabase Dashboard → Table Editor, you should see:
- `organizations`
- `user_roles`
- `permissions`
- `api_access_control`
- `user_invitations`
- `audit_logs`
- `profiles`

### 2. Check RLS Policies
In Supabase Dashboard → Authentication → Policies, you should see RLS policies for all tables.

### 3. Check Helper Functions
In Supabase Dashboard → SQL Editor, run:
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_system_admin', 'is_organization_admin', 'get_user_organizations', 'log_audit_event');
```

### 4. Check Seed Data
```sql
SELECT COUNT(*) as permission_count FROM permissions;
SELECT COUNT(*) as org_count FROM organizations WHERE slug = 'system';
```

## Testing the Setup

### Run the Test Script
```bash
node test-schema.mjs
```

### Expected Results
- ✅ Database Connection
- ✅ All tables exist
- ✅ RLS policies enabled
- ✅ Helper functions working
- ✅ Seed data present

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the correct project
   - Check that you have admin access

2. **Function Not Found**
   - Verify all helper functions were created
   - Check function parameters

3. **RLS Policy Issues**
   - Ensure policies are enabled on all tables
   - Verify policy conditions

4. **Seed Data Missing**
   - Check that INSERT statements executed
   - Verify permissions and system organization

### Getting Help

1. Check Supabase logs in the dashboard
2. Review SQL execution results
3. Verify environment variables
4. Test with provided scripts

## Next Steps

Once the schema is successfully set up:

1. **Test the Schema**
   ```bash
   node test-schema.mjs
   ```

2. **Begin Development**
   - Start implementing API routes
   - Test role-based access control
   - Build admin interfaces

3. **Verify Everything Works**
   - Test user authentication
   - Test role assignments
   - Test permission checks

## Security Notes

- Never expose service role keys in client code
- Always use RLS policies for data access
- Implement proper authentication checks
- Log all administrative actions
- Regularly audit user permissions

## Support

If you encounter issues:
1. Check the Supabase documentation
2. Review error messages carefully
3. Verify your setup
4. Test with provided scripts
5. Contact Supabase support if needed


