import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testOrganizationCreation() {
  console.log('🔍 Testing organization creation...')
  
  try {
    // First, test if we can read from organizations table
    console.log('📖 Testing read access...')
    const { data: existingOrgs, error: readError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
    
    if (readError) {
      console.error('❌ Read error:', readError)
      return
    }
    
    console.log('✅ Read access successful. Existing orgs:', existingOrgs?.length || 0)
    
    // Now test insert
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
      return
    }
    
    console.log('✅ Insert successful:', newOrg)
    
    // Test if we can read the new organization
    const { data: verifyOrg, error: verifyError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', newOrg.id)
      .single()
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
      return
    }
    
    console.log('✅ Verification successful:', verifyOrg)
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testOrganizationCreation()