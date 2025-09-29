#!/usr/bin/env node

/**
 * Database Schema Inspector
 * Checks table structures and relationships
 */

import { createClient } from '@supabase/supabase-js'

// Use the actual environment variables
const supabaseUrl = 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function inspectTableStructures() {
  console.log('🔍 Inspecting Database Table Structures...')
  console.log()

  // Check profiles table structure
  console.log('📊 Profiles table structure:')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      if (data && data.length > 0) {
        console.log('✅ Columns:', Object.keys(data[0]))
      } else {
        // Try to get column info from an empty result
        const { data: emptyData, error: emptyError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, created_at, updated_at')
          .limit(0)
        
        if (!emptyError) {
          console.log('✅ Table exists but is empty')
          console.log('📋 Expected columns: id, full_name, email, avatar_url, created_at, updated_at')
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log()

  // Check user_roles table structure
  console.log('📊 User_roles table structure:')
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      if (data && data.length > 0) {
        console.log('✅ Columns:', Object.keys(data[0]))
      } else {
        // Try to get column info from an empty result
        const { data: emptyData, error: emptyError } = await supabase
          .from('user_roles')
          .select('id, user_id, organization_id, role_type, permissions, is_active, created_at')
          .limit(0)
        
        if (!emptyError) {
          console.log('✅ Table exists but is empty')
          console.log('📋 Expected columns: id, user_id, organization_id, role_type, permissions, is_active, created_at')
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log()

  // Test the relationship query with explicit join
  console.log('📊 Testing explicit relationship query:')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email
      `)
      .limit(1)

    if (error) {
      console.log('❌ Profiles query error:', error.message)
    } else {
      console.log('✅ Profiles query successful')
      
      // Now try to get user roles for any user
      if (data && data.length > 0) {
        const userId = data[0].id
        console.log('🔍 Testing user roles for user:', userId)
        
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)

        if (rolesError) {
          console.log('❌ User roles query error:', rolesError.message)
        } else {
          console.log('✅ User roles query successful, found:', rolesData?.length || 0, 'roles')
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log()

  // Test if we can create a test profile and role
  console.log('📊 Testing data insertion capabilities:')
  try {
    // Try to insert a test profile (this might fail due to RLS)
    const testUserId = '00000000-0000-0000-0000-000000000001'
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        full_name: 'Test User',
        email: 'test@example.com'
      })
      .select()

    if (profileError) {
      console.log('❌ Profile insertion error:', profileError.message)
      console.log('ℹ️  This might be due to RLS policies or auth requirements')
    } else {
      console.log('✅ Profile insertion successful')
      
      // Try to insert a test user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: testUserId,
          organization_id: '00000000-0000-0000-0000-000000000001',
          role_type: 'user',
          permissions: ['user:basic'],
          is_active: true
        })
        .select()

      if (roleError) {
        console.log('❌ User role insertion error:', roleError.message)
      } else {
        console.log('✅ User role insertion successful')
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n🎉 Database schema inspection completed!')
}

// Run the inspection
inspectTableStructures().catch(console.error)