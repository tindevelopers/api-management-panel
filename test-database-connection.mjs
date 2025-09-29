#!/usr/bin/env node

/**
 * Database Connection Test
 * Tests the connection to our Supabase database and verifies the schema
 */

import { createClient } from '@supabase/supabase-js'

// Use the actual environment variables from .env.local if available.
// Fall back to the known project values when env vars are not set.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://kgaovsovhggehkpntbzu.supabase.co'

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing Supabase database connection...')
    console.log(`📍 Project: kgaovsovhggehkpntbzu (AI-Model-As-A-Service Production)`)
    console.log(`🌐 URL: ${supabaseUrl}`)
    
    // Test 1: Check if organizations table exists and has required columns
    console.log('\n📊 Testing organizations table...')
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, max_users, max_apis, subscription_plan')
      .limit(1)
    
    if (orgError) {
      console.error('❌ Organizations table error:', orgError.message)
      return false
    }
    
    console.log('✅ Organizations table accessible')
    if (orgData && orgData.length > 0) {
      console.log('✅ Sample organization data:', orgData[0])
    } else {
      console.log('ℹ️  No organizations found (table is empty)')
    }
    
    // Test 2: Check other tables
    console.log('\n📊 Testing other tables...')
    const tables = ['user_roles', 'permissions', 'api_access_control', 'profiles']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ ${table} table error:`, error.message)
      } else {
        console.log(`✅ ${table} table accessible`)
      }
    }
    
    // Test 3: Check permissions seed data
    console.log('\n🔐 Testing permissions seed data...')
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('name, description')
      .limit(5)
    
    if (permError) {
      console.error('❌ Permissions error:', permError.message)
    } else {
      console.log('✅ Permissions found:', permissions?.length || 0)
      permissions?.forEach(p => console.log(`  - ${p.name}: ${p.description}`))
    }
    
    console.log('\n🎉 Database connection test completed!')
    return true
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message)
    return false
  }
}

// Run the test
testDatabaseConnection()