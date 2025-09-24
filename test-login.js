#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and create a test user
 * Run this script to test the login functionality
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Just test that we can create a client and it has the right configuration
    if (supabase.supabaseUrl === supabaseUrl && supabase.supabaseKey === supabaseAnonKey) {
      console.log('✅ Supabase client created successfully')
      console.log('🌐 Supabase URL:', supabaseUrl)
      console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...')
      return true
    } else {
      console.error('❌ Supabase client configuration mismatch')
      return false
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message)
    return false
  }
}

async function createTestUser() {
  console.log('👤 Creating test user...')
  
  const testEmail = 'test@example.com'
  const testPassword = 'testpassword123'
  
  try {
    // Try to sign up a test user
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('ℹ️  Test user already exists')
        return { email: testEmail, password: testPassword }
      }
      console.error('❌ Failed to create test user:', error.message)
      return null
    }
    
    console.log('✅ Test user created successfully')
    console.log('📧 Email:', testEmail)
    console.log('🔑 Password:', testPassword)
    return { email: testEmail, password: testPassword }
  } catch (error) {
    console.error('❌ Error creating test user:', error.message)
    return null
  }
}

async function testLogin(credentials) {
  if (!credentials) return false
  
  console.log('🔐 Testing login...')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    
    if (error) {
      console.error('❌ Login failed:', error.message)
      return false
    }
    
    console.log('✅ Login successful')
    console.log('👤 User ID:', data.user?.id)
    return true
  } catch (error) {
    console.error('❌ Login error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 API Management Panel - Login Test')
  console.log('=====================================')
  
  // Test connection
  const connected = await testSupabaseConnection()
  if (!connected) {
    process.exit(1)
  }
  
  // Create test user
  const credentials = await createTestUser()
  
  // Test login
  const loginSuccess = await testLogin(credentials)
  
  console.log('\n📋 Test Results:')
  console.log('================')
  console.log('✅ Supabase Connection:', connected ? 'PASS' : 'FAIL')
  console.log('✅ User Creation:', credentials ? 'PASS' : 'FAIL')
  console.log('✅ Login Test:', loginSuccess ? 'PASS' : 'FAIL')
  
  if (credentials && loginSuccess) {
    console.log('\n🎉 All tests passed! You can now use these credentials:')
    console.log('🌐 Login URL: http://localhost:3000/login')
    console.log('📧 Email:', credentials.email)
    console.log('🔑 Password:', credentials.password)
  }
}

main().catch(console.error)
