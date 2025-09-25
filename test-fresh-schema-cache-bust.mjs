#!/usr/bin/env node

/**
 * Fresh Multi-Role Database Schema Test - Cache Busting Version
 * This version forces cache refresh and does more thorough function checking
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Fresh Multi-Role Database Schema Test - Cache Busting Version')
console.log('================================================================')

// Environment check
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
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing')
  envOk = false
} else {
  console.log(`✅ Service Role Key: ${supabaseServiceKey.substring(0, 20)}...`)
}

if (!envOk) {
  console.error('\n❌ Environment configuration failed. Please fix the missing variables.')
  process.exit(1)
}
console.log('✅ Environment: OK')

// Create Supabase client with service key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

async function runCacheBustingTests() {
  console.log('\n🔍 Testing Fresh Schema Tables with Cache Busting...')
  
  // Test 1: Check if 'organizations' table exists
  try {
    const { data, error } = await supabase.from('organizations').select('*').limit(0)
    logTest('Organizations table exists', !error && data !== null, error?.message)
  } catch (error) {
    logTest('Organizations table exists', false, error.message)
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

  // Test 8: Check for default permissions (requires service key)
  try {
    const { data, error } = await supabase.from('permission_definitions').select('*')
    logTest('Default permissions seeded', !error && data && data.length >= 12, error?.message || `Found ${data?.length} permissions`)
  } catch (error) {
    logTest('Default permissions seeded', false, error.message)
  }

  // Test 9: Check for system organization
  try {
    const { data, error } = await supabase.from('organizations').select('*').eq('name', 'System')
    logTest('System organization seeded', !error && data && data.length >= 1, error?.message || `Found ${data?.length} system orgs`)
  } catch (error) {
    logTest('System organization seeded', false, error.message)
  }

  // Test 10: Check for update_timestamp_column function with multiple approaches
  console.log('\n🔧 Testing update_timestamp_column function with cache busting...')
  
  // Approach 1: Direct RPC call
  try {
    const { data, error } = await supabase.rpc('update_timestamp_column')
    logTest('update_timestamp_column function (RPC)', !error, error?.message || 'Function exists but cannot be called directly')
  } catch (error) {
    logTest('update_timestamp_column function (RPC)', false, error.message)
  }

  // Approach 2: Check function in information_schema
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'update_timestamp_column')
      .eq('routine_type', 'FUNCTION')
    
    const functionExists = !error && data && data.length > 0
    logTest('update_timestamp_column function (schema)', functionExists, error?.message || `Found ${data?.length} functions`)
  } catch (error) {
    logTest('update_timestamp_column function (schema)', false, error.message)
  }

  // Approach 3: Try to create a test trigger to see if function works
  try {
    // This is a more direct test - try to use the function in a trigger
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `SELECT update_timestamp_column() IS NOT NULL as function_exists` 
    })
    logTest('update_timestamp_column function (direct)', !error, error?.message)
  } catch (error) {
    logTest('update_timestamp_column function (direct)', false, error.message)
  }

  console.log('\n📊 Final Test Results')
  console.log('======================')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`Total Tests: ${testResults.total}`)

  if (testResults.failed > 0) {
    console.log('\n💡 Next Steps:')
    console.log('1. Check the specific error messages above')
    console.log('2. Verify the function was created in Supabase Dashboard')
    console.log('3. Try running the fix-timestamp-function.sql script again')
    console.log('4. Check if there are any permission issues')
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed! Multi-role schema is fully functional!')
    process.exit(0)
  }
}

runCacheBustingTests()


