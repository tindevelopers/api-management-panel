#!/usr/bin/env node

/**
 * Create Admin User Script (Simplified)
 * 
 * This script creates an admin user using Supabase Auth Admin API
 * and sets up the necessary database records for the admin panel.
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Please set these in your .env.local file or environment')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ADMIN_EMAIL = 'admin@tin.info'
const ADMIN_PASSWORD = '88888888'

async function createAdminUser() {
  console.log('👤 Creating admin user...')
  console.log(`📧 Email: ${ADMIN_EMAIL}`)
  console.log(`🔑 Password: ${ADMIN_PASSWORD}`)
  console.log('')
  
  try {
    // Create user in auth.users using Supabase Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: 'System Administrator',
        role: 'system_admin'
      }
    })
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError.message)
      return false
    }
    
    console.log('✅ Auth user created successfully')
    console.log(`   User ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}`)
    console.log('')
    
    // Try to create profile (may fail if table doesn't exist yet)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: ADMIN_EMAIL,
          full_name: 'System Administrator',
          is_active: true
        })
      
      if (profileError) {
        console.log('⚠️  Profile creation failed (table may not exist yet):', profileError.message)
      } else {
        console.log('✅ User profile created')
      }
    } catch (profileError) {
      console.log('⚠️  Profile creation skipped (table not available)')
    }
    
    // Try to create system admin role (may fail if table doesn't exist yet)
    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role_type: 'system_admin',
          permissions: [
            'system_admin',
            'manage_organizations',
            'manage_system_users',
            'manage_system_apis',
            'view_system_analytics'
          ],
          is_active: true
        })
      
      if (roleError) {
        console.log('⚠️  Role creation failed (table may not exist yet):', roleError.message)
      } else {
        console.log('✅ System admin role assigned')
      }
    } catch (roleError) {
      console.log('⚠️  Role creation skipped (table not available)')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    return false
  }
}

async function verifyUser() {
  console.log('🔍 Verifying admin user...')
  
  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(ADMIN_EMAIL)
    
    if (userError) {
      console.error('❌ Error fetching user:', userError.message)
      return false
    }
    
    if (!userData.user) {
      console.error('❌ Admin user not found')
      return false
    }
    
    console.log('✅ Admin user verified')
    console.log(`   User ID: ${userData.user.id}`)
    console.log(`   Email: ${userData.user.email}`)
    console.log(`   Email Confirmed: ${userData.user.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log('')
    
    return true
  } catch (error) {
    console.error('❌ Error verifying user:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Creating admin user for API Management Panel...')
  console.log('')
  
  // Step 1: Create admin user
  const userSuccess = await createAdminUser()
  if (!userSuccess) {
    console.error('❌ Admin user creation failed')
    process.exit(1)
  }
  
  // Step 2: Verify user
  const verifySuccess = await verifyUser()
  if (!verifySuccess) {
    console.error('❌ User verification failed')
    process.exit(1)
  }
  
  console.log('🎉 Admin user setup completed successfully!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('1. Go to: https://api-management-panel-git-develop-tindeveloper.vercel.app/login')
  console.log(`2. Login with: ${ADMIN_EMAIL}`)
  console.log(`3. Password: ${ADMIN_PASSWORD}`)
  console.log('4. Access admin panel at: /admin')
  console.log('')
  console.log('🔐 Note: The admin panel currently grants all users system admin permissions')
  console.log('   for testing purposes. This will be updated once the database schema is applied.')
  console.log('')
}

// Run the setup
main().catch(console.error)
