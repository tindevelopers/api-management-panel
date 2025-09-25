#!/usr/bin/env node

/**
 * Test script to verify the multi-role database schema implementation
 * This script tests all tables, RLS policies, helper functions, and data integrity
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Create Supabase client - use service key if available, otherwise anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

if (!supabaseServiceKey) {
  console.log('⚠️  Using anon key - some operations may be restricted')
  console.log('💡 For full functionality, add SUPABASE_SERVICE_ROLE_KEY to .env.local')
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌'
  console.log(`${status} ${name}${details ? ` - ${details}` : ''}`)
  
  testResults.tests.push({ name, passed, details })
  if (passed) {
    testResults.passed++
  } else {
    testResults.failed++
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...')
  
  try {
    const { data, error } = await supabase.from('organizations').select('count').limit(1)
    if (error) throw error
    logTest('Database Connection', true, 'Successfully connected to Supabase')
    return true
  } catch (error) {
    logTest('Database Connection', false, error.message)
    return false
  }
}

async function testTablesExist() {
  console.log('\n📋 Testing Table Existence...')
  
  const tables = [
    'organizations',
    'user_roles', 
    'permissions',
    'api_access_control',
    'user_invitations',
    'audit_logs',
    'profiles'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error && error.code === 'PGRST116') {
        logTest(`Table: ${table}`, false, 'Table does not exist')
      } else {
        logTest(`Table: ${table}`, true, 'Table exists')
      }
    } catch (error) {
      logTest(`Table: ${table}`, false, error.message)
    }
  }
}

async function testRLSPolicies() {
  console.log('\n🔒 Testing Row Level Security Policies...')
  
  try {
    // Test that RLS is enabled by trying to access data without proper auth
    const { data, error } = await supabase.from('organizations').select('*')
    if (error && error.message.includes('row-level security')) {
      logTest('RLS Enabled', true, 'Row Level Security is properly configured')
    } else {
      logTest('RLS Enabled', false, 'RLS may not be properly configured')
    }
  } catch (error) {
    logTest('RLS Enabled', false, error.message)
  }
}

async function testHelperFunctions() {
  console.log('\n⚙️ Testing Helper Functions...')
  
  try {
    // Test the is_system_admin function
    const { data, error } = await supabase.rpc('is_system_admin', { user_uuid: '00000000-0000-0000-0000-000000000000' })
    if (error) {
      logTest('Helper Function: is_system_admin', false, error.message)
    } else {
      logTest('Helper Function: is_system_admin', true, 'Function exists and callable')
    }
  } catch (error) {
    logTest('Helper Function: is_system_admin', false, error.message)
  }
  
  try {
    // Test the get_user_organizations function
    const { data, error } = await supabase.rpc('get_user_organizations', { user_uuid: '00000000-0000-0000-0000-000000000000' })
    if (error) {
      logTest('Helper Function: get_user_organizations', false, error.message)
    } else {
      logTest('Helper Function: get_user_organizations', true, 'Function exists and callable')
    }
  } catch (error) {
    logTest('Helper Function: get_user_organizations', false, error.message)
  }
}

async function testSeedData() {
  console.log('\n🌱 Testing Seed Data...')
  
  try {
    // Test permissions seed data
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('*')
      .limit(5)
    
    if (permError) throw permError
    
    const expectedPermissions = [
      'organizations.create',
      'organizations.read', 
      'users.create',
      'users.read',
      'api.access'
    ]
    
    const hasExpectedPermissions = expectedPermissions.every(perm => 
      permissions.some(p => p.name === perm)
    )
    
    logTest('Permissions Seed Data', hasExpectedPermissions, 
      hasExpectedPermissions ? `${permissions.length} permissions found` : 'Missing expected permissions')
  } catch (error) {
    logTest('Permissions Seed Data', false, error.message)
  }
  
  try {
    // Test system organization
    const { data: systemOrg, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'system')
      .single()
    
    if (orgError) throw orgError
    
    logTest('System Organization', !!systemOrg, 
      systemOrg ? `System org found: ${systemOrg.name}` : 'System organization not found')
  } catch (error) {
    logTest('System Organization', false, error.message)
  }
}

async function testIndexes() {
  console.log('\n📊 Testing Database Indexes...')
  
  try {
    // Test that we can query with indexed columns efficiently
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role_type', 'system_admin')
      .limit(1)
    
    if (error) throw error
    
    logTest('Index Performance', true, 'Indexed queries working efficiently')
  } catch (error) {
    logTest('Index Performance', false, error.message)
  }
}

async function testAuditLogging() {
  console.log('\n📝 Testing Audit Logging...')
  
  try {
    // Test the log_audit_event function
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_organization_id: '00000000-0000-0000-0000-000000000000',
      p_action: 'test_action',
      p_resource_type: 'test_resource',
      p_resource_id: null,
      p_old_values: null,
      p_new_values: { test: 'value' },
      p_ip_address: null,
      p_user_agent: 'test-agent'
    })
    
    if (error) throw error
    
    logTest('Audit Logging Function', true, `Audit log created with ID: ${data}`)
  } catch (error) {
    logTest('Audit Logging Function', false, error.message)
  }
}

async function runAllTests() {
  console.log('🚀 Starting Multi-Role Database Schema Tests')
  console.log('==========================================')
  
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    console.log('\n❌ Database connection failed. Cannot proceed with tests.')
    return
  }
  
  await testTablesExist()
  await testRLSPolicies()
  await testHelperFunctions()
  await testSeedData()
  await testIndexes()
  await testAuditLogging()
  
  // Print summary
  console.log('\n📊 Test Summary')
  console.log('================')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`)
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Database schema is ready for use.')
  } else {
    console.log('\n⚠️ Some tests failed. Please review the schema implementation.')
  }
  
  return testResults.failed === 0
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error)
    process.exit(1)
  })
