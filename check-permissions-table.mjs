#!/usr/bin/env node

/**
 * Check Permissions Table Structure
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkPermissionsTable() {
  console.log('🔍 Checking current permissions table structure...')
  
  // Try different column combinations to see what exists
  const possibleColumns = [
    'id',
    'name',
    'description',
    'category',
    'resource',
    'action',
    'created_at',
    'updated_at'
  ]

  for (const column of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('permissions')
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
      .from('permissions')
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

checkPermissionsTable().catch(console.error)