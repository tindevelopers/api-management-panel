#!/usr/bin/env node

/**
 * Simple Migration Script: Add max_users column to organizations table
 * 
 * This script uses a direct approach to add the missing columns.
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Please set these in your .env.local file or environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addMissingColumns() {
  try {
    console.log('🚀 Adding missing columns to organizations table...')
    
    // First, let's check the current structure
    console.log('🔍 Checking current table structure...')
    const { data: currentData, error: checkError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Error checking table:', checkError.message)
      throw checkError
    }
    
    console.log('📊 Current columns:', Object.keys(currentData?.[0] || {}))
    
    // Add max_users column
    console.log('➕ Adding max_users column...')
    try {
      const { error: maxUsersError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;'
      })
      
      if (maxUsersError && !maxUsersError.message.includes('already exists')) {
        throw maxUsersError
      }
      console.log('✅ max_users column added/verified')
    } catch (err) {
      console.log('⚠️  max_users column might already exist or RPC not available')
    }
    
    // Add max_apis column
    console.log('➕ Adding max_apis column...')
    try {
      const { error: maxApisError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_apis INTEGER DEFAULT 5;'
      })
      
      if (maxApisError && !maxApisError.message.includes('already exists')) {
        throw maxApisError
      }
      console.log('✅ max_apis column added/verified')
    } catch (err) {
      console.log('⚠️  max_apis column might already exist or RPC not available')
    }
    
    // Add subscription_plan column
    console.log('➕ Adding subscription_plan column...')
    try {
      const { error: planError } = await supabase.rpc('exec', {
        sql: `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise'));`
      })
      
      if (planError && !planError.message.includes('already exists')) {
        throw planError
      }
      console.log('✅ subscription_plan column added/verified')
    } catch (err) {
      console.log('⚠️  subscription_plan column might already exist or RPC not available')
    }
    
    // Update existing records
    console.log('🔄 Updating existing records with default values...')
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        max_users: 10,
        max_apis: 5,
        subscription_plan: 'free'
      })
      .is('max_users', null)
    
    if (updateError) {
      console.log('⚠️  Update might have failed, but this is often expected if columns already have values')
    }
    
    // Verify the migration
    console.log('🔍 Verifying migration...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('organizations')
      .select('id, name, max_users, max_apis, subscription_plan')
      .limit(1)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message)
      throw verifyError
    }
    
    console.log('✅ Migration verification successful!')
    if (verifyData && verifyData.length > 0) {
      console.log('📊 Sample organization data:')
      console.log(JSON.stringify(verifyData[0], null, 2))
    }
    
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Full error:', error)
    
    console.log('\n📝 Manual steps if this script fails:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run the following SQL:')
    console.log('')
    console.log('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;')
    console.log('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_apis INTEGER DEFAULT 5;')
    console.log("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';")
    console.log('')
    
    process.exit(1)
  }
}

// Run the migration
addMissingColumns()