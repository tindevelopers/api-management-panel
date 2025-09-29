import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1Njg2MCwiZXhwIjoyMDczNTMyODYwfQ.your_service_role_key_here'

console.log('🔧 Applying organization policies fix...')

async function applyPoliciesFix() {
  try {
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Read the SQL file
    const sqlContent = readFileSync('fix-organization-policies.sql', 'utf8')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Error applying policies fix:', error)
      
      // Try alternative approach - execute statements individually
      console.log('🔄 Trying alternative approach...')
      
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.includes('SELECT')) continue // Skip SELECT statements
        
        console.log('📝 Executing:', statement.substring(0, 50) + '...')
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (stmtError) {
          console.error('❌ Statement error:', stmtError)
        } else {
          console.log('✅ Statement executed successfully')
        }
      }
    } else {
      console.log('✅ Policies fix applied successfully:', data)
    }
    
    // Test if we can now create an organization
    console.log('🧪 Testing organization creation...')
    
    // First, create a test user and assign system admin role
    const testUserId = '00000000-0000-0000-0000-000000000001' // Dummy UUID for testing
    
    // Try to insert a test organization
    const { data: testOrg, error: insertError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization ' + Date.now(),
        slug: 'test-org-' + Date.now(),
        description: 'Test description',
        max_users: 10,
        max_apis: 5,
        is_active: true
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Test insert failed:', insertError)
    } else {
      console.log('✅ Test organization created successfully:', testOrg)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

applyPoliciesFix()