#!/usr/bin/env node

/**
 * Check Current Profiles Table Structure
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProfilesTable() {
  console.log('🔍 Checking current profiles table structure...')
  
  // Try different column combinations to see what exists
  const possibleColumns = [
    'id',
    'user_id', 
    'full_name',
    'email',
    'avatar_url',
    'bio',
    'phone',
    'location',
    'website',
    'created_at',
    'updated_at'
  ]

  for (const column of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(column)
        .limit(0)

      if (error) {
        console.log(`❌ Column '${column}' does not exist:`, error.message)
      } else {
        console.log(`✅ Column '${column}' exists`)
      }
    } catch (error) {
      console.log(`❌ Column '${column}' error:`, error.message)
    }
  }

  // Try to select all columns with *
  console.log('\n🔍 Trying to select all columns with *...')
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Select * error:', error.message)
    } else {
      console.log('✅ Select * successful')
      if (data && data.length > 0) {
        console.log('📋 Actual columns:', Object.keys(data[0]))
      } else {
        console.log('📋 Table exists but is empty')
      }
    }
  } catch (error) {
    console.log('❌ Select * error:', error.message)
  }
}

checkProfilesTable().catch(console.error)