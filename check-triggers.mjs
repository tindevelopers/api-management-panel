#!/usr/bin/env node

/**
 * Check if triggers are set up on tables
 * This will help determine if the function exists and is being used
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

async function checkTriggers() {
  console.log('🔍 Checking for triggers on tables')
  console.log('==================================')
  
  try {
    // Try to get trigger information
    console.log('🔄 Attempting to check triggers...')
    
    // Method 1: Try to query pg_trigger directly
    const { data: triggerData, error: triggerError } = await supabase
      .from('pg_trigger')
      .select('tgname, tgrelid, tgfoid')
      .limit(10)
    
    if (triggerError) {
      console.log(`❌ Cannot access pg_trigger: ${triggerError.message}`)
    } else {
      console.log(`✅ Found ${triggerData?.length || 0} triggers`)
      if (triggerData && triggerData.length > 0) {
        triggerData.forEach(trigger => {
          console.log(`   - Trigger: ${trigger.tgname}`)
        })
      }
    }
    
    // Method 2: Check if we can create a simple test
    console.log('\n🔄 Testing table structure...')
    
    // Check organizations table structure
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (orgError) {
      console.log(`❌ Error accessing organizations: ${orgError.message}`)
    } else {
      console.log('✅ Organizations table accessible')
      if (orgData && orgData.length > 0) {
        const org = orgData[0]
        console.log('   - Sample organization fields:')
        Object.keys(org).forEach(key => {
          console.log(`     * ${key}: ${typeof org[key]}`)
        })
      }
    }
    
    // Method 3: Try to create a test record and see if updated_at changes
    console.log('\n🔄 Testing by creating a test record...')
    
    try {
      // Create a test organization
      const { data: createData, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: `Test Organization ${Date.now()}`,
          description: 'Test organization to check triggers'
        })
        .select('id, name, created_at, updated_at')
      
      if (createError) {
        console.log(`❌ Error creating test record: ${createError.message}`)
      } else if (createData && createData.length > 0) {
        const record = createData[0]
        console.log('✅ Test record created successfully')
        console.log(`   - ID: ${record.id}`)
        console.log(`   - Name: ${record.name}`)
        console.log(`   - Created: ${record.created_at}`)
        console.log(`   - Updated: ${record.updated_at}`)
        
        // Check if created_at and updated_at are the same (indicating trigger worked)
        if (record.created_at === record.updated_at) {
          console.log('✅ created_at and updated_at are the same - trigger likely working')
        } else {
          console.log('⚠️  created_at and updated_at are different - trigger might not be working')
        }
        
        // Clean up the test record
        const { error: deleteError } = await supabase
          .from('organizations')
          .delete()
          .eq('id', record.id)
        
        if (deleteError) {
          console.log(`⚠️  Could not clean up test record: ${deleteError.message}`)
        } else {
          console.log('✅ Test record cleaned up')
        }
      }
    } catch (err) {
      console.log(`❌ Error in test record creation: ${err.message}`)
    }
    
  } catch (error) {
    console.error('💥 Error checking triggers:', error.message)
  }
}

async function main() {
  console.log('🚀 Trigger and Function Check')
  console.log('=============================')
  
  await checkTriggers()
  
  console.log('\n📋 Summary')
  console.log('===========')
  console.log('If triggers are not working, you may need to:')
  console.log('1. Create the update_timestamp_column function in Supabase Dashboard')
  console.log('2. Set up triggers on tables that need updated_at functionality')
  console.log('3. Check the SQL Editor in Supabase Dashboard for any errors')
  console.log('\nTo create triggers manually, run this SQL in Supabase Dashboard:')
  console.log('CREATE TRIGGER update_organizations_updated_at')
  console.log('  BEFORE UPDATE ON organizations')
  console.log('  FOR EACH ROW')
  console.log('  EXECUTE FUNCTION update_timestamp_column();')
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

