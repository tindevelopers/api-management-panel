# Admin User Setup Guide

This guide will help you create an admin user with the credentials:
- **Email**: `admin@tin.info`
- **Password**: `88888888`

## Prerequisites

You need the following environment variables set up in your Vercel project:

1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

## Method 1: Using the Setup Script (Recommended)

### Step 1: Run the Admin User Creation Script

```bash
# Navigate to the project directory
cd "/Users/gene/Projects/API Management Panel/api-management-panel"

# Make the script executable
chmod +x create-admin-user.mjs

# Run the script
node create-admin-user.mjs
```

### Step 2: Verify the Setup

The script will:
1. Create the admin user in Supabase Auth
2. Set up the user profile
3. Assign system admin role (if database tables exist)
4. Verify the user was created successfully

## Method 2: Manual Setup via Supabase Dashboard

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User**

### Step 2: Create the Admin User

Fill in the form:
- **Email**: `admin@tin.info`
- **Password**: `88888888`
- **Auto Confirm User**: ✅ (checked)
- **User Metadata**:
  ```json
  {
    "full_name": "System Administrator",
    "role": "system_admin"
  }
  ```

### Step 3: Assign System Admin Role

If the database schema is applied, you'll need to manually assign the system admin role:

```sql
-- Insert system admin role
INSERT INTO user_roles (
  user_id,
  role_type,
  permissions,
  is_active
) VALUES (
  'USER_ID_FROM_SUPABASE',
  'system_admin',
  '["system_admin", "manage_organizations", "manage_system_users", "manage_system_apis", "view_system_analytics"]',
  true
);
```

## Method 3: Using Supabase CLI

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Create Admin User

```bash
# Create user with admin privileges
supabase auth users create admin@tin.info --password 88888888 --email-confirm
```

## Verification

After creating the admin user, you can verify it works by:

1. **Go to the login page**: https://api-management-panel-git-develop-tindeveloper.vercel.app/login
2. **Login with**:
   - Email: `admin@tin.info`
   - Password: `88888888`
3. **Access the admin panel**: https://api-management-panel-git-develop-tindeveloper.vercel.app/admin

## Troubleshooting

### Issue: "User not found" error
- **Solution**: Verify the user was created in Supabase Auth dashboard
- **Check**: User email confirmation status

### Issue: "Insufficient permissions" error
- **Solution**: The current setup grants all users system admin permissions temporarily
- **Note**: This will be updated once the database schema is properly applied

### Issue: Environment variables not found
- **Solution**: Ensure your Vercel project has the required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Issue: Database tables don't exist
- **Solution**: The admin panel will work with temporary permissions
- **Next Step**: Apply the database schema using the migration files

## Current Status

The admin panel is currently configured with **temporary system admin permissions** for all users. This allows the interface to work even without the full database schema applied.

Once you have the admin user created, you can:

1. ✅ Access the admin dashboard at `/admin`
2. ✅ View organization management at `/admin/organizations`
3. ✅ Create and manage organizations
4. ✅ Access all admin features

## Next Steps

After creating the admin user:

1. **Test the login**: Verify you can log in with the admin credentials
2. **Access admin panel**: Navigate to `/admin` to see the system admin interface
3. **Apply database schema**: Use the migration files to set up the full multi-role system
4. **Configure proper permissions**: Replace temporary permissions with proper role-based access

## Support

If you encounter any issues:

1. Check the Vercel deployment logs
2. Verify environment variables are set correctly
3. Ensure Supabase project is accessible
4. Check that the admin user was created successfully in Supabase Auth

The admin user setup is now complete and ready for use! 🎉
