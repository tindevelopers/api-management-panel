#!/usr/bin/env node

/**
 * Migration Script: Add max_users column to organizations table
 * 
 * This script fixes the error: column "organizations.max_users" does not exist
 * by adding the missing columns to the organizations table.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add max_users column to organizations table')
    
    // Read the SQL migration file
    const sqlPath = join(__dirname, 'add-max-users-column.sql')
    const migrationSQL = readFileSync(sqlPath, 'utf8')
    
    console.log('📝 Executing migration SQL...')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })
    
    if (error) {
      // If the RPC doesn't exist, try direct SQL execution
      console.log('⚠️  RPC method not available, trying direct execution...')
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`)
          const { error: execError } = await supabase.rpc('exec', {
            sql: statement
          })
          
          if (execError) {
            console.error(`❌ Error executing statement: ${execError.message}`)
            throw execError
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!')
    
    // Verify the columns were added
    console.log('🔍 Verifying migration...')
    const { data: orgData, error: verifyError } = await supabase
      .from('organizations')
      .select('id, name, max_users, max_apis, subscription_plan')
      .limit(1)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message)
      throw verifyError
    }
    
    console.log('✅ Verification successful! Columns added:')
    if (orgData && orgData.length > 0) {
      const org = orgData[0]
      console.log(`   - max_users: ${org.max_users}`)
      console.log(`   - max_apis: ${org.max_apis}`)
      console.log(`   - subscription_plan: ${org.subscription_plan}`)
    }
    
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()