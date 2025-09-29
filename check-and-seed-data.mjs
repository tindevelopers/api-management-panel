import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTY4NjAsImV4cCI6MjA3MzUzMjg2MH0.L_vZL15jxUcgxBoHq3bLfh-wt4ftrhwB8sR5bHmkQ9w'

// Use anon key for basic operations
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAndSeedBasicData() {
  console.log('🔍 Checking existing data and seeding if needed...')
  console.log(`📍 Project: ${supabaseUrl}`)
  
  try {
    // Check organizations
    console.log('\n📊 Checking organizations...')
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
    
    if (orgsError) {
      console.error('❌ Error checking organizations:', orgsError)
    } else {
      console.log(`✅ Found ${orgs?.length || 0} organizations`)
      if (orgs && orgs.length > 0) {
        console.log('   Sample:', orgs[0].name)
      }
    }

    // Check permissions
    console.log('\n📊 Checking permissions...')
    const { data: perms, error: permsError } = await supabase
      .from('permissions')
      .select('*')
    
    if (permsError) {
      console.error('❌ Error checking permissions:', permsError)
    } else {
      console.log(`✅ Found ${perms?.length || 0} permissions`)
      if (perms && perms.length > 0) {
        console.log('   Sample:', perms[0].name)
      }
    }

    // Check profiles
    console.log('\n📊 Checking profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError)
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles`)
      if (profiles && profiles.length > 0) {
        console.log('   Sample:', profiles[0].full_name || profiles[0].email)
      }
    }

    // Check user_roles
    console.log('\n📊 Checking user_roles...')
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
    
    if (rolesError) {
      console.error('❌ Error checking user_roles:', rolesError)
    } else {
      console.log(`✅ Found ${roles?.length || 0} user roles`)
      if (roles && roles.length > 0) {
        console.log('   Sample:', roles[0].role_type)
      }
    }

    // Test the complex query that the users API uses
    console.log('\n🔍 Testing complex users query...')
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles!inner (
          id,
          role_type,
          permissions,
          is_active,
          created_at,
          organizations (
            id,
            name,
            slug
          )
        )
      `)
      .limit(5)
    
    if (usersError) {
      console.error('❌ Error in complex users query:', usersError)
    } else {
      console.log(`✅ Complex query successful, found ${usersData?.length || 0} users with roles`)
      if (usersData && usersData.length > 0) {
        console.log('   Sample user:', usersData[0].full_name || usersData[0].email)
        console.log('   Sample role:', usersData[0].user_roles?.[0]?.role_type)
      }
    }

    console.log('\n🎉 Data check completed!')
    
    // If we have no data, let's try to add some basic test data using SQL
    if ((!orgs || orgs.length === 0) && (!perms || perms.length === 0)) {
      console.log('\n🌱 No data found, attempting to seed basic data...')
      
      // Try to execute the test data SQL directly
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Create a test organization
          INSERT INTO organizations (
              id,
              name,
              slug,
              description,
              subscription_plan,
              max_users,
              max_apis,
              is_active,
              created_at,
              updated_at
          ) VALUES (
              '11111111-1111-1111-1111-111111111111',
              'Test Organization',
              'test-org',
              'A test organization for development',
              'basic',
              10,
              5,
              true,
              NOW(),
              NOW()
          ) ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              updated_at = NOW();

          -- Add some basic permissions data
          INSERT INTO permissions (
              id,
              name,
              description,
              category,
              resource,
              action,
              created_at
          ) VALUES 
              ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'system:admin', 'Full system administration access', 'system', 'system', 'admin', NOW()),
              ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'system:users:manage', 'Manage system users', 'system', 'users', 'manage', NOW()),
              ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'system:organizations:manage', 'Manage organizations', 'system', 'organizations', 'manage', NOW()),
              ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'user:basic', 'Basic user access', 'user', 'user', 'basic', NOW()),
              ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'user:apis:access', 'Access to APIs', 'user', 'apis', 'access', NOW())
          ON CONFLICT (name) DO UPDATE SET
              description = EXCLUDED.description;
        `
      })
      
      if (sqlError) {
        console.error('❌ Error executing SQL:', sqlError)
      } else {
        console.log('✅ Basic test data seeded successfully!')
      }
    }

  } catch (error) {
    console.error('❌ Error in data check:', error)
  }
}

checkAndSeedBasicData()