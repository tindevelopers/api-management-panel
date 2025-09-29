import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgaovsovhggehkpntbzu.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYW92c292aGdnZWhrcG50Ynp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjc5NzE5MSwiZXhwIjoyMDQ4MzczMTkxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestData() {
  console.log('🌱 Seeding test data for Users System...')
  console.log(`📍 Project: ${supabaseUrl}`)
  
  try {
    // 1. First, seed organizations
    console.log('\n📊 Seeding organizations...')
    const organizationsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        description: 'Leading technology solutions provider',
        max_users: 50,
        max_apis: 10,
        subscription_plan: 'enterprise',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'TechStart Inc',
        slug: 'techstart-inc',
        description: 'Innovative startup focused on AI solutions',
        max_users: 25,
        max_apis: 5,
        subscription_plan: 'premium',
        is_active: true
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Global Systems Ltd',
        slug: 'global-systems',
        description: 'International systems integration company',
        max_users: 100,
        max_apis: 20,
        subscription_plan: 'enterprise',
        is_active: true
      }
    ]

    const { data: orgsResult, error: orgsError } = await supabase
      .from('organizations')
      .upsert(organizationsData, { onConflict: 'id' })
      .select()

    if (orgsError) {
      console.error('❌ Error seeding organizations:', orgsError)
    } else {
      console.log(`✅ Seeded ${organizationsData.length} organizations`)
    }

    // 2. Seed permissions
    console.log('\n📊 Seeding permissions...')
    const permissionsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        name: 'users.read',
        description: 'Read user information',
        category: 'users',
        resource: 'users',
        action: 'read'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        name: 'users.write',
        description: 'Create and update users',
        category: 'users',
        resource: 'users',
        action: 'write'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        name: 'users.delete',
        description: 'Delete users',
        category: 'users',
        resource: 'users',
        action: 'delete'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440104',
        name: 'organizations.read',
        description: 'Read organization information',
        category: 'organizations',
        resource: 'organizations',
        action: 'read'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440105',
        name: 'organizations.write',
        description: 'Create and update organizations',
        category: 'organizations',
        resource: 'organizations',
        action: 'write'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440106',
        name: 'system.admin',
        description: 'Full system administration access',
        category: 'system',
        resource: 'system',
        action: 'admin'
      }
    ]

    const { data: permsResult, error: permsError } = await supabase
      .from('permissions')
      .upsert(permissionsData, { onConflict: 'id' })
      .select()

    if (permsError) {
      console.error('❌ Error seeding permissions:', permsError)
    } else {
      console.log(`✅ Seeded ${permissionsData.length} permissions`)
    }

    // 3. Create test users in auth.users (using admin API)
    console.log('\n👥 Creating test users...')
    const testUsers = [
      {
        email: 'admin@acme.com',
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'John Admin',
          role: 'system_admin'
        }
      },
      {
        email: 'manager@acme.com',
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Sarah Manager',
          role: 'org_admin'
        }
      },
      {
        email: 'user@acme.com',
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Mike User',
          role: 'user'
        }
      },
      {
        email: 'dev@techstart.com',
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Alice Developer',
          role: 'user'
        }
      },
      {
        email: 'admin@global.com',
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Bob Global',
          role: 'org_admin'
        }
      }
    ]

    const createdUsers = []
    for (const userData of testUsers) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: userData.email_confirm,
        user_metadata: userData.user_metadata
      })

      if (authError) {
        console.error(`❌ Error creating user ${userData.email}:`, authError.message)
      } else {
        console.log(`✅ Created user: ${userData.email}`)
        createdUsers.push({
          ...authUser.user,
          metadata: userData.user_metadata
        })
      }
    }

    // 4. Create profiles for the users
    console.log('\n📝 Creating user profiles...')
    const profilesData = createdUsers.map((user, index) => ({
      id: user.id,
      user_id: user.id,
      email: user.email,
      full_name: user.metadata.full_name,
      role: user.metadata.role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data: profilesResult, error: profilesError } = await supabase
      .from('profiles')
      .upsert(profilesData, { onConflict: 'user_id' })
      .select()

    if (profilesError) {
      console.error('❌ Error creating profiles:', profilesError)
    } else {
      console.log(`✅ Created ${profilesData.length} user profiles`)
    }

    // 5. Create user roles and organization assignments
    console.log('\n🔐 Creating user roles...')
    const userRolesData = [
      // John Admin - System Admin
      {
        id: '550e8400-e29b-41d4-a716-446655440201',
        user_id: createdUsers[0]?.id,
        organization_id: organizationsData[0].id, // Acme Corp
        role_type: 'system_admin',
        permissions: ['system.admin', 'users.read', 'users.write', 'users.delete', 'organizations.read', 'organizations.write'],
        is_active: true
      },
      // Sarah Manager - Org Admin at Acme
      {
        id: '550e8400-e29b-41d4-a716-446655440202',
        user_id: createdUsers[1]?.id,
        organization_id: organizationsData[0].id, // Acme Corp
        role_type: 'org_admin',
        permissions: ['users.read', 'users.write', 'organizations.read'],
        is_active: true
      },
      // Mike User - Regular user at Acme
      {
        id: '550e8400-e29b-41d4-a716-446655440203',
        user_id: createdUsers[2]?.id,
        organization_id: organizationsData[0].id, // Acme Corp
        role_type: 'user',
        permissions: ['users.read'],
        is_active: true
      },
      // Alice Developer - User at TechStart
      {
        id: '550e8400-e29b-41d4-a716-446655440204',
        user_id: createdUsers[3]?.id,
        organization_id: organizationsData[1].id, // TechStart Inc
        role_type: 'user',
        permissions: ['users.read'],
        is_active: true
      },
      // Bob Global - Org Admin at Global Systems
      {
        id: '550e8400-e29b-41d4-a716-446655440205',
        user_id: createdUsers[4]?.id,
        organization_id: organizationsData[2].id, // Global Systems
        role_type: 'org_admin',
        permissions: ['users.read', 'users.write', 'organizations.read'],
        is_active: true
      }
    ]

    // Filter out any roles where user_id is undefined
    const validUserRoles = userRolesData.filter(role => role.user_id)

    const { data: rolesResult, error: rolesError } = await supabase
      .from('user_roles')
      .upsert(validUserRoles, { onConflict: 'id' })
      .select()

    if (rolesError) {
      console.error('❌ Error creating user roles:', rolesError)
    } else {
      console.log(`✅ Created ${validUserRoles.length} user roles`)
    }

    // 6. Verify the seeded data
    console.log('\n🔍 Verifying seeded data...')
    
    const { data: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' })
    
    const { data: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
    
    const { data: roleCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact' })
    
    const { data: permCount } = await supabase
      .from('permissions')
      .select('*', { count: 'exact' })

    console.log(`📊 Final counts:`)
    console.log(`   Organizations: ${orgCount?.length || 0}`)
    console.log(`   Profiles: ${profileCount?.length || 0}`)
    console.log(`   User Roles: ${roleCount?.length || 0}`)
    console.log(`   Permissions: ${permCount?.length || 0}`)

    console.log('\n🎉 Test data seeding completed successfully!')
    console.log('\n📋 Test User Credentials:')
    console.log('   admin@acme.com / TestPassword123! (System Admin)')
    console.log('   manager@acme.com / TestPassword123! (Org Admin)')
    console.log('   user@acme.com / TestPassword123! (User)')
    console.log('   dev@techstart.com / TestPassword123! (User)')
    console.log('   admin@global.com / TestPassword123! (Org Admin)')

  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    process.exit(1)
  }
}

seedTestData()