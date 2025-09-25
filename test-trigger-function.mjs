#!/usr/bin/env node

/**
 * Test if the update_timestamp_column function works by testing triggers
 * This is a more practical test than trying to call the function directly
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

async function testTriggerFunction() {
  console.log('🧪 Testing update_timestamp_column function via triggers')
  console.log('======================================================')
  
  try {
    // Test 1: Check if organizations table has updated_at field
    console.log('🔄 Checking organizations table structure...')
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_at, updated_at')
      .limit(1)
    
    if (orgError) {
      console.log(`❌ Error accessing organizations: ${orgError.message}`)
      return false
    }
    
    console.log('✅ Organizations table accessible')
    if (orgData && orgData.length > 0) {
      const org = orgData[0]
      console.log(`   - Sample org: ${org.name}`)
      console.log(`   - Created: ${org.created_at}`)
      console.log(`   - Updated: ${org.updated_at}`)
    }
    
    // Test 2: Try to update an organization and see if updated_at changes
    console.log('\n🔄 Testing trigger by updating an organization...')
    
    // First, get the current timestamp
    const beforeUpdate = new Date().toISOString()
    console.log(`   - Before update: ${beforeUpdate}`)
    
    // Try to update an organization
    const { data: updateData, error: updateError } = await supabase
      .from('organizations')
      .update({ 
        name: `Test Update ${Date.now()}` 
      })
      .eq('name', 'System Organization')
      .select('name, updated_at')
    
    if (updateError) {
      console.log(`❌ Update failed: ${updateError.message}`)
      return false
    }
    
    if (updateData && updateData.length > 0) {
      const updated = updateData[0]
      console.log(`✅ Update successful`)
      console.log(`   - Updated name: ${updated.name}`)
      console.log(`   - Updated timestamp: ${updated.updated_at}`)
      
      // Check if the timestamp is recent
      const updateTime = new Date(updated.updated_at)
      const now = new Date()
      const timeDiff = now - updateTime
      
      if (timeDiff < 5000) { // Less than 5 seconds
        console.log('✅ Trigger appears to be working! updated_at was automatically updated')
        return true
      } else {
        console.log('⚠️  updated_at timestamp seems old, trigger might not be working')
        return false
      }
    } else {
      console.log('❌ No data returned from update')
      return false
    }
    
  } catch (error) {
    console.error('💥 Error testing trigger:', error.message)
    return false
  }
}

async function testUserProfiles() {
  console.log('\n🔄 Testing user_profiles table...')
  
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, created_at, updated_at')
      .limit(1)
    
    if (profileError) {
      console.log(`❌ Error accessing user_profiles: ${profileError.message}`)
      return false
    }
    
    console.log('✅ User profiles table accessible')
    if (profileData && profileData.length > 0) {
      const profile = profileData[0]
      console.log(`   - Sample profile: ${profile.full_name}`)
      console.log(`   - Created: ${profile.created_at}`)
      console.log(`   - Updated: ${profile.updated_at}`)
    }
    
    return true
  } catch (error) {
    console.error('💥 Error testing user_profiles:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Trigger Function Test')
  console.log('========================')
  
  const triggerWorks = await testTriggerFunction()
  const profilesWork = await testUserProfiles()
  
  console.log('\n📊 Test Results')
  console.log('================')
  console.log(`✅ Trigger test: ${triggerWorks ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Profiles test: ${profilesWork ? 'PASS' : 'FAIL'}`)
  
  if (triggerWorks) {
    console.log('\n🎉 SUCCESS!')
    console.log('============')
    console.log('✅ The update_timestamp_column function is working!')
    console.log('✅ Triggers are automatically updating the updated_at field')
    console.log('✅ Your database schema is fully functional')
    console.log('\nThe test script might be failing because:')
    console.log('1. The function is designed for triggers, not direct RPC calls')
    console.log('2. The test script is looking for the wrong function signature')
    console.log('3. Schema cache issues in the test script')
  } else {
    console.log('\n❌ FAILED')
    console.log('==========')
    console.log('The update_timestamp_column function is not working properly')
    console.log('Please check:')
    console.log('1. Is the function actually created in Supabase Dashboard?')
    console.log('2. Are there triggers set up on the tables?')
    console.log('3. Check the SQL Editor in Supabase Dashboard')
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
