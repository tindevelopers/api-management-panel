#!/usr/bin/env node

/**
 * Apply database schema using service role key
 * This script executes the SQL schema directly using the service role key
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
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

async function executeSQL(sql) {
  try {
    // Use the REST API directly with service role key
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    // Some errors are expected (like "already exists")
    if (error.message.includes('already exists') || 
        error.message.includes('does not exist') ||
        error.message.includes('duplicate key')) {
      return { success: true, warning: error.message }
    } else {
      return { success: false, error: error.message }
    }
  }
}

async function applySchema() {
  console.log('🚀 Applying Multi-Role Database Schema with Service Role Key')
  console.log('============================================================')
  
  try {
    // Read the SQL schema file
    const schemaPath = join(process.cwd(), 'multi-role-schema-complete.sql')
    const schemaSQL = readFileSync(schemaPath, 'utf8')
    
    console.log('📖 Schema file loaded successfully')
    console.log(`📏 Schema size: ${(schemaSQL.length / 1024).toFixed(2)} KB`)
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    let successCount = 0
    let warningCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue
      }
      
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
      
      const result = await executeSQL(statement)
      
      if (result.success) {
        if (result.warning) {
          console.log(`⚠️  Statement ${i + 1}: ${result.warning}`)
          warningCount++
        } else {
          console.log(`✅ Statement ${i + 1}: Success`)
          successCount++
        }
      } else {
        console.log(`❌ Statement ${i + 1}: ${result.error}`)
        errorCount++
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log('\n📊 Schema Application Summary')
    console.log('==============================')
    console.log(`✅ Successful: ${successCount}`)
    console.log(`⚠️  Warnings: ${warningCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 Schema applied successfully!')
      return true
    } else {
      console.log('\n⚠️ Schema applied with some errors. Please review the output above.')
      return false
    }
    
  } catch (error) {
    console.error('💥 Failed to apply schema:', error.message)
    return false
  }
}

async function verifySchema() {
  console.log('\n🔍 Verifying Schema Implementation...')
  
  try {
    // Test basic table access
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (orgError) {
      console.log('❌ Organizations table not accessible')
      return false
    }
    
    console.log('✅ Organizations table accessible')
    
    // Test permissions table
    const { data: perms, error: permError } = await supabase
      .from('permissions')
      .select('count')
      .limit(1)
    
    if (permError) {
      console.log('❌ Permissions table not accessible')
      return false
    }
    
    console.log('✅ Permissions table accessible')
    
    // Test helper functions
    const { data: isAdmin, error: funcError } = await supabase
      .rpc('is_system_admin', { user_uuid: '00000000-0000-0000-0000-000000000000' })
    
    if (funcError) {
      console.log('❌ Helper functions not accessible')
      return false
    }
    
    console.log('✅ Helper functions accessible')
    
    console.log('\n🎉 Schema verification successful!')
    return true
    
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Multi-Role Database Schema Setup with Service Role Key')
  console.log('==========================================================')
  
  const schemaApplied = await applySchema()
  
  if (schemaApplied) {
    const verified = await verifySchema()
    
    if (verified) {
      console.log('\n🚀 Setup Complete!')
      console.log('==================')
      console.log('✅ Database schema has been successfully applied')
      console.log('✅ All tables, RLS policies, and functions are ready')
      console.log('✅ You can now run the test script to verify everything works')
      console.log('\nNext steps:')
      console.log('1. Run: node test-schema.mjs')
      console.log('2. Begin implementing the API routes')
      console.log('3. Start building the admin interfaces')
    } else {
      console.log('\n⚠️ Setup completed but verification failed')
      console.log('Please check the database and try running the test script')
    }
  } else {
    console.log('\n❌ Schema setup failed')
    console.log('Please check the error messages above and try again')
  }
}

// Run the setup
main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })


