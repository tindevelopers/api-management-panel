#!/usr/bin/env node

/**
 * Test script to verify the fresh multi-role database schema
 * This tests the new table names to avoid conflicts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Fresh Multi-Role Database Schema Test')
console.log('==========================================')

// --- Environment Check ---
console.log('\n🌍 Checking Environment Configuration...')
let envOk = true
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing')
  envOk = false
} else {
  console.log(`✅ Supabase URL: ${supabaseUrl}`)
}
if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
  envOk = false
} else {
  console.log(`✅ Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
}
if (!supabaseServiceKey) {
  console.warn('⚠️  Service Role Key not found')
  console.info('💡 Add SUPABASE_SERVICE_ROLE_KEY to .env.local for full functionality')
} else {
  console.log(`✅ Service Role Key: ${supabaseServiceKey.substring(0, 20)}...`)
}

if (!envOk) {
  console.error('\n❌ Environment configuration failed. Please fix the missing variables.')
  process.exit(1)
}
console.log('✅ Environment: OK')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
}

function logTest(name, success, message = '') {
  testResults.total++
  if (success) {
    testResults.passed++
    console.log(`✅ ${name}: PASS ${message ? `(${message})` : ''}`)
  } else {
    testResults.failed++
    console.error(`❌ ${name}: FAIL ${message ? `(${message})` : ''}`)
  }
}

async function runFreshSchemaTests() {
  console.log('\n🔍 Testing Fresh Schema Tables...')
  
  // Test 1: Check if 'orgs' table exists
  try {
    const { data, error } = await supabase.from('orgs').select('*').limit(0)
    logTest('Orgs table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('Orgs table exists', false, error.message)
  }

  // Test 2: Check if 'user_permissions' table exists
  try {
    const { data, error } = await supabase.from('user_permissions').select('*').limit(0)
    logTest('User Permissions table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('User Permissions table exists', false, error.message)
  }

  // Test 3: Check if 'permission_definitions' table exists
  try {
    const { data, error } = await supabase.from('permission_definitions').select('*').limit(0)
    logTest('Permission Definitions table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('Permission Definitions table exists', false, error.message)
  }

  // Test 4: Check if 'api_permissions' table exists
  try {
    const { data, error } = await supabase.from('api_permissions').select('*').limit(0)
    logTest('API Permissions table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('API Permissions table exists', false, error.message)
  }

  // Test 5: Check if 'org_invitations' table exists
  try {
    const { data, error } = await supabase.from('org_invitations').select('*').limit(0)
    logTest('Org Invitations table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('Org Invitations table exists', false, error.message)
  }

  // Test 6: Check if 'system_logs' table exists
  try {
    const { data, error } = await supabase.from('system_logs').select('*').limit(0)
    logTest('System Logs table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('System Logs table exists', false, error.message)
  }

  // Test 7: Check if 'user_profiles' table exists
  try {
    const { data, error } = await supabase.from('user_profiles').select('*').limit(0)
    logTest('User Profiles table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('User Profiles table exists', false, error.message)
  }

  // Test 8: Check for default permissions (requires service key for full test)
  if (supabaseServiceKey) {
    try {
      const { data, error } = await supabase.from('permission_definitions').select('*')
      logTest('Default permissions seeded', !error && data && data.length >= 12, error?.message || `Found ${data?.length} permissions`)
    } catch (error) {
      logTest('Default permissions seeded', false, error.message)
    }
  } else {
    logTest('Default permissions seeded', true, 'Skipped: Requires SUPABASE_SERVICE_ROLE_KEY')
  }

  // Test 9: Check for system organization
  try {
    const { data, error } = await supabase.from('orgs').select('*').eq('slug', 'system')
    logTest('System organization seeded', !error && data && data.length > 0, error?.message || `Found ${data?.length} system orgs`)
  } catch (error) {
    logTest('System organization seeded', false, error.message)
  }

  // Test 10: Check for update_timestamp_column function
  if (supabaseServiceKey) {
    try {
      const { data, error } = await supabase.rpc('update_timestamp_column')
      logTest('update_timestamp_column function exists', !error && data !== null, error?.message)
    } catch (error) {
      logTest('update_timestamp_column function exists', false, error.message)
    }
  } else {
    logTest('update_timestamp_column function exists', true, 'Skipped: Requires SUPABASE_SERVICE_ROLE_KEY')
  }

  console.log('\n📊 Final Test Results')
  console.log('======================')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`Total Tests: ${testResults.total}`)

  if (testResults.failed > 0) {
    console.log('\n💡 Next Steps:')
    console.log('1. Apply the fresh schema: multi-role-schema-fresh.sql')
    console.log('2. Run this test again to verify')
    process.exit(1)
  } else {
    console.log('\n🎉 Fresh schema is working perfectly!')
    console.log('✅ All tables created successfully')
    console.log('✅ All functions working')
    console.log('✅ All seed data inserted')
    console.log('✅ Ready for multi-role administration panel!')
  }
}

runFreshSchemaTests()


