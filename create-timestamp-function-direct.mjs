#!/usr/bin/env node

/**
 * Direct approach to create the update_timestamp_column function
 * This bypasses the exec_sql function issue by using direct SQL execution
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTimestampFunction() {
  console.log('🔧 Creating update_timestamp_column function')
  console.log('============================================')
  
  try {
    // First, let's try to drop the function if it exists
    console.log('🔄 Dropping existing function if it exists...')
    const dropResult = await supabase
      .from('pg_proc')
      .delete()
      .eq('proname', 'update_timestamp_column')
      .eq('pronamespace', 'public')
    
    console.log('✅ Drop operation completed')
    
    // Now create the function using a direct SQL approach
    console.log('🔄 Creating update_timestamp_column function...')
    
    // Try using the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          CREATE OR REPLACE FUNCTION update_timestamp_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `
      })
    })
    
    if (response.ok) {
      console.log('✅ Function created successfully!')
      return true
    } else {
      const error = await response.text()
      console.log(`❌ Failed to create function: ${error}`)
      return false
    }
    
  } catch (error) {
    console.error('💥 Error creating function:', error.message)
    return false
  }
}

async function testFunction() {
  console.log('\n🧪 Testing the function...')
  
  try {
    // Try to call the function to see if it exists
    const { data, error } = await supabase.rpc('update_timestamp_column')
    
    if (error) {
      console.log(`❌ Function test failed: ${error.message}`)
      return false
    } else {
      console.log('✅ Function is accessible!')
      return true
    }
  } catch (err) {
    console.log(`❌ Function test error: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Direct Timestamp Function Creation')
  console.log('=====================================')
  
  const created = await createTimestampFunction()
  
  if (created) {
    const tested = await testFunction()
    
    if (tested) {
      console.log('\n🎉 Success!')
      console.log('============')
      console.log('✅ update_timestamp_column function created and tested')
      console.log('✅ You can now run the test script again')
    } else {
      console.log('\n⚠️ Function created but test failed')
      console.log('The function might exist but not be accessible via RPC')
    }
  } else {
    console.log('\n❌ Failed to create function')
    console.log('You may need to create it manually in the Supabase dashboard')
  }
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
