#!/usr/bin/env node

/**
 * Setup Admin User Script
 * 
 * This script will:
 * 1. Apply the multi-role database schema
 * 2. Create the admin user with system admin privileges
 * 3. Set up the necessary database tables and permissions
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ADMIN_EMAIL = 'admin@tin.info'
const ADMIN_PASSWORD = '88888888'

async function setupDatabase() {
  console.log('🔧 Setting up database schema...')
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250125000000_multi_role_schema.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Error applying migration:', error)
      return false
    }
    
    console.log('✅ Database schema applied successfully')
    return true
  } catch (error) {
    console.error('❌ Error reading migration file:', error)
    return false
  }
}

async function createAdminUser() {
  console.log('👤 Creating admin user...')
  
  try {
    // Create user in auth.users
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
      console.error('❌ Error creating auth user:', authError)
      return false
    }
    
    console.log('✅ Auth user created:', authData.user.id)
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: ADMIN_EMAIL,
        full_name: 'System Administrator',
        is_active: true
      })
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
      return false
    }
    
    console.log('✅ User profile created')
    
    // Create system admin role
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
      console.error('❌ Error creating user role:', roleError)
      return false
    }
    
    console.log('✅ System admin role assigned')
    
    return true
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    return false
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...')
  
  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(ADMIN_EMAIL)
    
    if (userError || !userData.user) {
      console.error('❌ Admin user not found')
      return false
    }
    
    console.log('✅ Admin user found:', userData.user.id)
    
    // Check if user has system admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('role_type', 'system_admin')
      .eq('is_active', true)
    
    if (rolesError || !roles || roles.length === 0) {
      console.error('❌ System admin role not found')
      return false
    }
    
    console.log('✅ System admin role verified')
    
    return true
  } catch (error) {
    console.error('❌ Error verifying setup:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting admin user setup...')
  console.log(`📧 Admin Email: ${ADMIN_EMAIL}`)
  console.log(`🔑 Admin Password: ${ADMIN_PASSWORD}`)
  console.log('')
  
  // Step 1: Setup database schema
  const schemaSuccess = await setupDatabase()
  if (!schemaSuccess) {
    console.error('❌ Database setup failed')
    process.exit(1)
  }
  
  // Step 2: Create admin user
  const userSuccess = await createAdminUser()
  if (!userSuccess) {
    console.error('❌ Admin user creation failed')
    process.exit(1)
  }
  
  // Step 3: Verify setup
  const verifySuccess = await verifySetup()
  if (!verifySuccess) {
    console.error('❌ Setup verification failed')
    process.exit(1)
  }
  
  console.log('')
  console.log('🎉 Admin user setup completed successfully!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('1. Go to: https://api-management-panel-git-develop-tindeveloper.vercel.app/login')
  console.log(`2. Login with: ${ADMIN_EMAIL}`)
  console.log(`3. Password: ${ADMIN_PASSWORD}`)
  console.log('4. Access admin panel at: /admin')
  console.log('')
  console.log('🔐 Admin user has full system administrator privileges')
}

// Run the setup
main().catch(console.error)
