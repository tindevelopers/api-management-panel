#!/usr/bin/env node

/**
 * Users System Database Test
 * Tests the users functionality and database queries
 */

import { createClient } from '@supabase/supabase-js'

// Use the actual environment variables
const supabaseUrl = 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUsersSystem() {
  console.log('🔍 Testing Users System Database Queries...')
  console.log(`📍 Project: kgaovsovhggehkpntbzu (AI-Model-As-A-Service Production)`)
  console.log(`🌐 URL: ${supabaseUrl}`)
  console.log()

  try {
    // Test 1: Check if we can access auth.users (this might fail due to RLS)
    console.log('📊 Testing auth.users access...')
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      if (authError) {
        console.log('❌ Auth users error:', authError.message)
        console.log('ℹ️  This is expected - admin functions require service role key')
      } else {
        console.log('✅ Auth users accessible:', authUsers?.users?.length || 0, 'users found')
      }
    } catch (error) {
      console.log('❌ Auth users error:', error.message)
      console.log('ℹ️  This is expected - admin functions require service role key')
    }

    // Test 2: Check profiles table
    console.log('\n📊 Testing profiles table...')
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)

      if (profilesError) {
        console.log('❌ Profiles table error:', profilesError.message)
      } else {
        console.log('✅ Profiles table accessible')
        console.log('ℹ️  Profiles found:', profiles?.length || 0)
        if (profiles && profiles.length > 0) {
          console.log('📋 Sample profile structure:', Object.keys(profiles[0]))
        }
      }
    } catch (error) {
      console.log('❌ Profiles table error:', error.message)
    }

    // Test 3: Check user_roles table
    console.log('\n📊 Testing user_roles table...')
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .limit(5)

      if (rolesError) {
        console.log('❌ User roles table error:', rolesError.message)
      } else {
        console.log('✅ User roles table accessible')
        console.log('ℹ️  User roles found:', userRoles?.length || 0)
        if (userRoles && userRoles.length > 0) {
          console.log('📋 Sample user role structure:', Object.keys(userRoles[0]))
        }
      }
    } catch (error) {
      console.log('❌ User roles table error:', error.message)
    }

    // Test 4: Test complex query that users API would need
    console.log('\n📊 Testing complex users query...')
    try {
      // This simulates what the users API should do:
      // 1. Get profiles (which should link to auth.users)
      // 2. Get their roles
      // 3. Get their organizations
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(
            *,
            organization:organizations(*)
          )
        `)
        .limit(10)

      if (usersError) {
        console.log('❌ Complex users query error:', usersError.message)
      } else {
        console.log('✅ Complex users query successful')
        console.log('ℹ️  Users with roles found:', usersData?.length || 0)
        
        if (usersData && usersData.length > 0) {
          console.log('📋 Sample user data structure:')
          const sampleUser = usersData[0]
          console.log('   - Profile fields:', Object.keys(sampleUser).filter(k => k !== 'user_roles'))
          console.log('   - Roles count:', sampleUser.user_roles?.length || 0)
          if (sampleUser.user_roles && sampleUser.user_roles.length > 0) {
            console.log('   - Sample role fields:', Object.keys(sampleUser.user_roles[0]).filter(k => k !== 'organization'))
          }
        }
      }
    } catch (error) {
      console.log('❌ Complex users query error:', error.message)
    }

    // Test 5: Check permissions table
    console.log('\n📊 Testing permissions table...')
    try {
      const { data: permissions, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .limit(10)

      if (permissionsError) {
        console.log('❌ Permissions table error:', permissionsError.message)
      } else {
        console.log('✅ Permissions table accessible')
        console.log('ℹ️  Permissions found:', permissions?.length || 0)
        if (permissions && permissions.length > 0) {
          console.log('📋 Sample permissions:', permissions.map(p => p.name || p.id).slice(0, 3))
        }
      }
    } catch (error) {
      console.log('❌ Permissions table error:', error.message)
    }

    console.log('\n🎉 Users system database test completed!')

  } catch (error) {
    console.error('💥 Fatal error during users system test:', error)
  }
}

// Run the test
testUsersSystem().catch(console.error)