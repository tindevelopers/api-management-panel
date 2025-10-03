-- Create test data for users system testing (Final version with conflict handling)
-- Organizations and permissions with proper conflict resolution

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

-- Add some basic permissions data (with proper conflict handling on name)
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

SELECT 'Test data created successfully with proper conflict handling!' as message;