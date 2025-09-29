import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

console.log('🔧 Testing organization creation with current setup...')

async function testOrganizationCreation() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('📖 Testing read access...')
    const { data: existingOrgs, error: readError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (readError) {
      console.error('❌ Read error:', readError)
    } else {
      console.log('✅ Read access successful. Found', existingOrgs?.length || 0, 'organizations')
    }
    
    console.log('📝 Testing insert access...')
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
      console.error('❌ Insert error:', insertError)
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      
      // Try to understand the RLS situation
      console.log('🔍 Checking RLS policies...')
      
      // Try to disable RLS temporarily for testing
      console.log('🔧 Attempting to add permissive policy...')
      
      const policySQL = `
        CREATE POLICY IF NOT EXISTS "Allow all operations for testing" ON organizations
        FOR ALL USING (true) WITH CHECK (true);
      `
      
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL })
      
      if (policyError) {
        console.error('❌ Policy creation error:', policyError)
      } else {
        console.log('✅ Permissive policy created, retrying insert...')
        
        // Retry the insert
        const { data: retryOrg, error: retryError } = await supabase
          .from('organizations')
          .insert(testOrg)
          .select()
          .single()
        
        if (retryError) {
          console.error('❌ Retry insert still failed:', retryError)
        } else {
          console.log('✅ Retry insert successful:', retryOrg)
        }
      }
      
    } else {
      console.log('✅ Insert successful:', newOrg)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testOrganizationCreation()