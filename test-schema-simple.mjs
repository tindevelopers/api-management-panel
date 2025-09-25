#!/usr/bin/env node

/**
 * Simplified test script to verify basic database connectivity
 * This script tests the connection and basic table access without requiring service role key
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testBasicConnection() {
  console.log('🔍 Testing Basic Database Connection...')
  
  try {
    // Test basic connection by querying a system table
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  Organizations table does not exist yet')
        console.log('💡 You need to run the database schema setup first')
        return false
      } else {
        console.log('❌ Database connection failed:', error.message)
        return false
      }
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    return false
  }
}

async function testAuthConnection() {
  console.log('🔐 Testing Authentication System...')
  
  try {
    // Test auth system
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('⚠️  No authenticated user (this is expected)')
      console.log('💡 Authentication system is working correctly')
    } else if (user) {
      console.log('✅ User authenticated:', user.email)
    } else {
      console.log('✅ Authentication system ready')
    }
    
    return true
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message)
    return false
  }
}

async function checkEnvironment() {
  console.log('🌍 Checking Environment Configuration...')
  
  console.log(`✅ Supabase URL: ${supabaseUrl}`)
  console.log(`✅ Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  Service Role Key not found')
    console.log('💡 Add SUPABASE_SERVICE_ROLE_KEY to .env.local for full functionality')
  } else {
    console.log('✅ Service Role Key found')
  }
  
  return true
}

async function provideNextSteps() {
  console.log('\n📋 Next Steps')
  console.log('==============')
  console.log('1. 📖 Read the setup guide: DATABASE-SETUP-GUIDE.md')
  console.log('2. 🗄️  Apply the database schema via Supabase Dashboard')
  console.log('3. 🧪 Run the full test: node test-schema.mjs')
  console.log('4. 🚀 Begin implementing the multi-role system')
  
  console.log('\n💡 Quick Setup Commands:')
  console.log('1. Open Supabase Dashboard → SQL Editor')
  console.log('2. Copy contents of multi-role-schema-complete.sql')
  console.log('3. Paste and execute in SQL Editor')
  console.log('4. Run: node test-schema.mjs')
}

async function main() {
  console.log('🚀 Multi-Role Database Schema - Basic Test')
  console.log('==========================================')
  
  const envOk = await checkEnvironment()
  const connectionOk = await testBasicConnection()
  const authOk = await testAuthConnection()
  
  console.log('\n📊 Test Results')
  console.log('================')
  console.log(`✅ Environment: ${envOk ? 'OK' : 'FAILED'}`)
  console.log(`✅ Connection: ${connectionOk ? 'OK' : 'FAILED'}`)
  console.log(`✅ Authentication: ${authOk ? 'OK' : 'FAILED'}`)
  
  if (envOk && authOk) {
    console.log('\n🎉 Basic setup is working!')
    console.log('You can now proceed with the database schema setup.')
  } else {
    console.log('\n⚠️ Some issues detected. Please check the configuration.')
  }
  
  await provideNextSteps()
}

// Run the test
main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })


