# Permission System & Authentication Enhancement Guide

## Overview

This document provides a comprehensive guide to the enhanced permission system and authentication features implemented in the API Management Panel. The system supports multi-role, multi-organization access control with fine-grained permissions.

## 🏗️ Architecture

### Core Components

1. **Permission System** (`src/lib/permissions.ts`)
   - Centralized permission checking utilities
   - Role hierarchy management
   - Organization-based access control

2. **Authentication Context** (`src/contexts/AuthContext.tsx`)
   - Global authentication state management
   - Permission-aware user session handling
   - Organization switching capabilities

3. **Permission Guards** (`src/components/auth/PermissionGuard.tsx`)
   - Component-level permission protection
   - Route-based access control
   - Fallback UI for unauthorized access

4. **Role-Based Navigation** (`src/components/auth/RoleBasedNav.tsx`)
   - Dynamic navigation based on user permissions
   - Organization-aware menu items
   - Permission-based visibility

## 🔐 Permission System

### Role Hierarchy

The system implements a three-tier role hierarchy:

```
System Admin (Full Access)
├── Organization Admin (Org-specific access)
└── User (Basic access)
```

### Permission Types

#### System Admin Permissions
- `SYSTEM_ADMIN` - Full system access
- `MANAGE_ORGANIZATIONS` - Create, update, delete organizations
- `MANAGE_SYSTEM_USERS` - Manage all system users
- `MANAGE_SYSTEM_APIS` - Manage system-wide APIs
- `VIEW_SYSTEM_ANALYTICS` - Access system analytics

#### Organization Admin Permissions
- `ORG_ADMIN` - Organization administration
- `MANAGE_ORG_USERS` - Manage organization users
- `MANAGE_ORG_APIS` - Manage organization APIs
- `VIEW_ORG_ANALYTICS` - View organization analytics
- `MANAGE_ORG_SETTINGS` - Manage organization settings
- `MANAGE_ORG_INVITATIONS` - Manage user invitations

#### User Permissions
- `USER_BASIC` - Basic user access
- `ACCESS_APIS` - Access to APIs
- `VIEW_PERSONAL_DASHBOARD` - View personal dashboard

### Database Schema

The permission system uses the following key tables:

```sql
-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    subscription_plan VARCHAR(20),
    max_users INTEGER,
    max_apis INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- User Roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    role_type VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- API Access Control
CREATE TABLE api_access_control (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    api_name VARCHAR(100) NOT NULL,
    access_level VARCHAR(50) NOT NULL,
    rate_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true
);
```

## 🚀 Usage Guide

### 1. Protecting Components

Use the `PermissionGuard` component to protect UI elements:

```tsx
import PermissionGuard from '@/components/auth/PermissionGuard'
import { Permission } from '@/types/multi-role'

function AdminPanel() {
  return (
    <PermissionGuard 
      permission={Permission.MANAGE_SYSTEM_USERS}
      fallback={<div>Access Denied</div>}
    >
      <UserManagement />
    </PermissionGuard>
  )
}
```

### 2. Checking Permissions in Components

Use the `useAuth` hook for permission checks:

```tsx
import { useAuth } from '@/contexts/AuthContext'
import { Permission, RoleType } from '@/types/multi-role'

function MyComponent() {
  const { hasPermission, hasRole, isSystemAdmin } = useAuth()

  if (isSystemAdmin) {
    return <FullAccessPanel />
  }

  if (hasPermission(Permission.MANAGE_ORG_USERS)) {
    return <OrgUserManagement />
  }

  if (hasRole(RoleType.USER)) {
    return <BasicUserPanel />
  }

  return <AccessDenied />
}
```

### 3. API Route Protection

Protect API routes with permission checks:

```tsx
import { requireSystemAdmin } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await requireSystemAdmin(user.id)
  
  // Protected logic here
}
```

### 4. Navigation Configuration

The navigation system automatically shows/hides menu items based on permissions:

```tsx
const navigationItems = [
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: Shield,
    role: RoleType.SYSTEM_ADMIN,
    children: [
      {
        label: 'Users',
        href: '/admin/users',
        permission: Permission.MANAGE_SYSTEM_USERS
      }
    ]
  }
]
```

## 🔧 Configuration

### Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

Run the schema setup script:

```bash
node setup-multi-role-schema.mjs
```

### Testing

Test the permission system:

```bash
node test-permission-system.mjs
```

## 📱 Component Examples

### Organization Selector

```tsx
import OrganizationSelector from '@/components/auth/OrganizationSelector'

function Header() {
  return (
    <div className="flex items-center justify-between">
      <Logo />
      <OrganizationSelector 
        onOrganizationChange={(org) => {
          console.log('Switched to:', org.name)
        }}
      />
    </div>
  )
}
```

### Role-Based Navigation

```tsx
import RoleBasedNav from '@/components/auth/RoleBasedNav'

function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg">
      <RoleBasedNav 
        onItemClick={() => {
          // Handle navigation
        }}
      />
    </aside>
  )
}
```

## 🛡️ Security Features

### Row Level Security (RLS)

All tables have RLS policies enabled:

- **System Admins**: Full access to all data
- **Organization Admins**: Access to their organization's data
- **Users**: Access to their own data and organization data they belong to

### Permission Validation

- Server-side permission validation in API routes
- Client-side permission checks for UI components
- Database-level access control with RLS policies

### Audit Logging

All administrative actions are logged:

```sql
SELECT log_audit_event(
  user_id,
  organization_id,
  'user_created',
  'user',
  new_user_id,
  NULL,
  '{"email": "user@example.com"}',
  client_ip,
  user_agent
);
```

## 🚀 Deployment

### Prerequisites

1. Supabase project with authentication enabled
2. Database schema applied
3. Environment variables configured

### Steps

1. **Apply Database Schema**:
   ```bash
   node setup-multi-role-schema.mjs
   ```

2. **Set Environment Variables**:
   ```bash
   npx vercel env add NEXT_PUBLIC_SUPABASE_URL
   npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Deploy**:
   ```bash
   git push origin develop
   ```

## 🧪 Testing

### Unit Tests

Test individual permission functions:

```javascript
import { hasPermission, hasRole } from '@/lib/permissions'

// Test permission checking
const canManageUsers = await hasPermission(
  userId, 
  Permission.MANAGE_ORG_USERS, 
  organizationId
)

// Test role checking
const isAdmin = await hasRole(userId, RoleType.SYSTEM_ADMIN)
```

### Integration Tests

Run the comprehensive test suite:

```bash
node test-permission-system.mjs
```

### Manual Testing

1. Create test users with different roles
2. Test organization switching
3. Verify permission-based UI visibility
4. Test API route protection

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user has the required role
   - Verify organization context
   - Ensure RLS policies are correctly configured

2. **Navigation Not Showing**
   - Verify user permissions
   - Check organization membership
   - Ensure navigation configuration is correct

3. **API Route Access Issues**
   - Check authentication status
   - Verify permission requirements
   - Review server-side permission validation

### Debug Mode

Enable debug logging:

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('User permissions:', permissions)
  console.log('Current organization:', currentOrganization)
}
```

## 📚 API Reference

### Permission Functions

- `hasPermission(userId, permission, organizationId?)` - Check specific permission
- `hasRole(userId, role, organizationId?)` - Check user role
- `getUserPermissions(userId, organizationId?)` - Get all user permissions
- `requirePermission(userId, permission, organizationId?)` - Require permission or throw error

### Context Hooks

- `useAuth()` - Access authentication state and permissions
- `usePermissions()` - Permission checking utilities

### Components

- `<PermissionGuard>` - Protect components with permissions
- `<RoleBasedNav>` - Permission-aware navigation
- `<OrganizationSelector>` - Organization switching

## 🎯 Best Practices

1. **Always validate permissions server-side**
2. **Use permission guards for UI protection**
3. **Implement proper error handling**
4. **Log administrative actions**
5. **Test permission changes thoroughly**
6. **Use organization context appropriately**
7. **Implement graceful fallbacks for unauthorized access**

## 🔄 Future Enhancements

- [ ] Advanced permission inheritance
- [ ] Time-based permission expiration
- [ ] Permission templates and presets
- [ ] Advanced audit log analytics
- [ ] Permission delegation
- [ ] Multi-factor authentication integration
- [ ] SSO integration
- [ ] Advanced rate limiting per permission

---

For more information, see the main [README.md](./README.md) or contact the development team.
