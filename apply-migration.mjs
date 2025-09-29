import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

console.log('🔧 Applying organization CRUD policies...')

async function applyMigration() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Read the migration file
    const migrationContent = readFileSync('supabase/migrations/20250928190000_add_organization_crud_policies.sql', 'utf8')
    
    // Split into individual statements
    const statements = migrationContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '')
    
    console.log(`📝 Found ${statements.length} statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.includes('SELECT') && statement.includes('message')) {
        console.log('ℹ️  Skipping message statement')
        continue
      }
      
      console.log(`📝 Executing statement ${i + 1}/${statements.length}:`)
      console.log(statement.substring(0, 100) + '...')
      
      try {
        // Try using rpc first
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`❌ RPC Error for statement ${i + 1}:`, error)
          
          // If RPC fails, try direct query for CREATE POLICY statements
          if (statement.includes('CREATE POLICY')) {
            console.log('🔄 Trying alternative approach for policy creation...')
            // For policies, we might need to use a different approach
            // Let's log the statement for manual execution
            console.log('📋 Manual execution required for:', statement)
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`💥 Unexpected error for statement ${i + 1}:`, err)
      }
    }
    
    console.log('🧪 Testing organization creation after policy application...')
    
    // Test creating an organization
    const testOrg = {
      name: 'Test Organization ' + Date.now(),
      slug: 'test-org-' + Date.now(),
      description: 'Test description',
      max_users: 10,
      max_apis: 5,
      is_active: true
    }
    
    const { data: newOrg, error: insertError } = await supabase
      .from('organizations')
      .insert(testOrg)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Test insert still failing:', insertError)
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
    } else {
      console.log('✅ Test organization created successfully:', newOrg)
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
  }
}

applyMigration()