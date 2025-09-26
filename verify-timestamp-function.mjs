#!/usr/bin/env node

/**
 * Verify if the update_timestamp_column function exists
 * This script checks the database schema directly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyFunction() {
  console.log('🔍 Verifying update_timestamp_column function')
  console.log('============================================')
  
  try {
    // Method 1: Check if function exists in pg_proc
    console.log('🔄 Checking function in pg_proc...')
    const { data: procData, error: procError } = await supabase
      .from('pg_proc')
      .select('proname, prokind')
      .eq('proname', 'update_timestamp_column')
    
    if (procError) {
      console.log(`❌ Error checking pg_proc: ${procError.message}`)
    } else if (procData && procData.length > 0) {
      console.log(`✅ Function found in pg_proc: ${procData.length} entries`)
      procData.forEach(func => {
        console.log(`   - ${func.proname} (kind: ${func.prokind})`)
      })
    } else {
      console.log('❌ Function not found in pg_proc')
    }
    
    // Method 2: Check information_schema.routines
    console.log('\n🔄 Checking function in information_schema.routines...')
    const { data: routineData, error: routineError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_name', 'update_timestamp_column')
    
    if (routineError) {
      console.log(`❌ Error checking information_schema: ${routineError.message}`)
    } else if (routineData && routineData.length > 0) {
      console.log(`✅ Function found in information_schema: ${routineData.length} entries`)
      routineData.forEach(routine => {
        console.log(`   - ${routine.routine_name} (type: ${routine.routine_type})`)
      })
    } else {
      console.log('❌ Function not found in information_schema')
    }
    
    // Method 3: Try to create a test table with the function
    console.log('\n🔄 Testing function by creating a test trigger...')
    try {
      // Create a temporary test table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS test_timestamp_table (
          id SERIAL PRIMARY KEY,
          name TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      
      // This won't work via RPC, but let's try a different approach
      console.log('💡 Function verification methods:')
      console.log('1. Check Supabase Dashboard > SQL Editor')
      console.log('2. Run: SELECT proname FROM pg_proc WHERE proname = \'update_timestamp_column\';')
      console.log('3. Check if triggers are working on existing tables')
      
      // Method 4: Check if any tables have triggers using this function
      console.log('\n🔄 Checking for triggers using this function...')
      const { data: triggerData, error: triggerError } = await supabase
        .from('pg_trigger')
        .select('tgname, tgfoid')
        .eq('tgfoid', 'update_timestamp_column')
      
      if (triggerError) {
        console.log(`❌ Error checking triggers: ${triggerError.message}`)
      } else if (triggerData && triggerData.length > 0) {
        console.log(`✅ Found ${triggerData.length} triggers using this function`)
        triggerData.forEach(trigger => {
          console.log(`   - Trigger: ${trigger.tgname}`)
        })
      } else {
        console.log('❌ No triggers found using this function')
      }
      
    } catch (err) {
      console.log(`❌ Error testing function: ${err.message}`)
    }
    
  } catch (error) {
    console.error('💥 Error verifying function:', error.message)
  }
}

async function testFunctionDirectly() {
  console.log('\n🧪 Testing function directly...')
  
  try {
    // Try to call the function (this might fail if it's a trigger function)
    const { data, error } = await supabase.rpc('update_timestamp_column')
    
    if (error) {
      console.log(`❌ Function call failed: ${error.message}`)
      console.log('💡 This is expected if the function is designed for triggers only')
    } else {
      console.log('✅ Function call succeeded!')
      console.log('Data:', data)
    }
  } catch (err) {
    console.log(`❌ Function call error: ${err.message}`)
    console.log('💡 This is expected if the function is designed for triggers only')
  }
}

async function main() {
  console.log('🚀 Timestamp Function Verification')
  console.log('==================================')
  
  await verifyFunction()
  await testFunctionDirectly()
  
  console.log('\n📋 Summary')
  console.log('===========')
  console.log('If the function exists but tests fail, it might be:')
  console.log('1. A trigger function (not callable via RPC)')
  console.log('2. Not accessible due to permissions')
  console.log('3. Schema cache needs refresh')
  console.log('\nTo verify manually:')
  console.log('1. Go to Supabase Dashboard > SQL Editor')
  console.log('2. Run: SELECT proname FROM pg_proc WHERE proname = \'update_timestamp_column\';')
  console.log('3. If it returns a row, the function exists')
}

// Run the script
main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
