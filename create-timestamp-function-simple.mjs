#!/usr/bin/env node

/**
 * Simple approach to create the update_timestamp_column function
 * Using direct database connection via Supabase client
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
    // Try to create the function using a different approach
    console.log('🔄 Attempting to create function via SQL...')
    
    // Use the REST API directly to execute SQL
    const sql = `
      CREATE OR REPLACE FUNCTION update_timestamp_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    // Try using the SQL editor endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    })
    
    if (response.ok) {
      console.log('✅ Function created successfully!')
      return true
    } else {
      const error = await response.text()
      console.log(`❌ Failed to create function: ${error}`)
      
      // Try alternative approach - create a simple table to test
      console.log('🔄 Trying alternative approach...')
      
      const testResponse = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
      
      if (testResponse.error) {
        console.log(`❌ Database connection issue: ${testResponse.error.message}`)
      } else {
        console.log('✅ Database connection is working')
        console.log('💡 The function needs to be created manually in Supabase dashboard')
        console.log('   Go to: SQL Editor in your Supabase dashboard')
        console.log('   Run this SQL:')
        console.log('   CREATE OR REPLACE FUNCTION update_timestamp_column()')
        console.log('   RETURNS TRIGGER AS $$')
        console.log('   BEGIN')
        console.log('       NEW.updated_at = NOW();')
        console.log('       RETURN NEW;')
        console.log('   END;')
        console.log('   $$ LANGUAGE plpgsql;')
      }
      
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
  console.log('🚀 Simple Timestamp Function Creation')
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
    console.log('\n❌ Failed to create function automatically')
    console.log('Please create it manually in the Supabase dashboard')
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

