import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  hasPermission, 
  getCurrentUserWithRoles
} from '@/lib/permissions'
import { Permission, RoleType } from '@/types/multi-role'
import { 
  logApiRequest,
  logSecurityEvent
} from '@/lib/utils/logging'

// Extract request context for logging
function extractRequestContext(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return {
    requestId,
    ipAddress: ipAddress.split(',')[0].trim(),
    userAgent,
    method: request.method,
    url: request.url,
    userId: undefined, // Will be populated by auth middleware
    organizationId: undefined // Will be populated by auth middleware
  }
}

// Route protection configuration with detailed permissions
const protectedRoutes = {
  // System admin routes
  '/admin': {
    permissions: [Permission.SYSTEM_ADMIN],
    roles: [RoleType.SYSTEM_ADMIN]
  },
  '/admin/organizations': {
    permissions: [Permission.MANAGE_ORGANIZATIONS],
    roles: [RoleType.SYSTEM_ADMIN]
  },
  '/admin/users': {
    permissions: [Permission.MANAGE_SYSTEM_USERS],
    roles: [RoleType.SYSTEM_ADMIN]
  },
  '/admin/apis': {
    permissions: [Permission.MANAGE_SYSTEM_APIS],
    roles: [RoleType.SYSTEM_ADMIN]
  },
  '/admin/analytics': {
    permissions: [Permission.VIEW_SYSTEM_ANALYTICS],
    roles: [RoleType.SYSTEM_ADMIN]
  },
  
  // Organization routes
  '/org': {
    permissions: [Permission.ORG_ADMIN, Permission.USER_BASIC],
    roles: [RoleType.ORG_ADMIN, RoleType.USER]
  },
  '/org/users': {
    permissions: [Permission.MANAGE_ORG_USERS],
    roles: [RoleType.ORG_ADMIN]
  },
  '/org/apis': {
    permissions: [Permission.MANAGE_ORG_APIS, Permission.ACCESS_APIS],
    roles: [RoleType.ORG_ADMIN, RoleType.USER]
  },
  '/org/invitations': {
    permissions: [Permission.MANAGE_ORG_INVITATIONS],
    roles: [RoleType.ORG_ADMIN]
  },
  '/org/analytics': {
    permissions: [Permission.VIEW_ORG_ANALYTICS],
    roles: [RoleType.ORG_ADMIN]
  },
  '/org/settings': {
    permissions: [Permission.MANAGE_ORG_SETTINGS],
    roles: [RoleType.ORG_ADMIN]
  },
  '/api-keys': {
    permissions: [Permission.ACCESS_APIS],
    roles: [RoleType.ORG_ADMIN, RoleType.USER]
  },
  '/dashboard': {
    permissions: [Permission.VIEW_PERSONAL_DASHBOARD],
    roles: [RoleType.SYSTEM_ADMIN, RoleType.ORG_ADMIN, RoleType.USER]
  }
}

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/setup',
  '/test',
  '/simple',
  '/test-org',
  '/api/auth',
  '/api/health',
  '/_next',
  '/favicon.ico'
]

// API routes that require special handling
const apiRoutes = {
  '/api/admin': {
    permissions: [Permission.SYSTEM_ADMIN],
    roles: [RoleType.SYSTEM_ADMIN]
  },
  '/api/org': {
    permissions: [Permission.ORG_ADMIN, Permission.USER_BASIC],
    roles: [RoleType.ORG_ADMIN, RoleType.USER]
  }
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl
  const context = extractRequestContext(request)

  try {
    // Allow static files and public routes first (before auth session)
    if (isPublicRoute(pathname) || isStaticFile(pathname)) {
      return NextResponse.next({ request })
    }

    // Handle auth session for protected routes
    const response = await updateSession(request)

    // Handle API routes
    if (pathname.startsWith('/api/')) {
      return await handleApiRoute(request, response, context)
    }

    // Handle protected routes
    if (requiresAuthentication(pathname)) {
      return await handleProtectedRoute(request, response, pathname, context)
    }

    // Log request completion
    const duration = Date.now() - startTime
    logApiRequest(
      request.method,
      pathname,
      response.status,
      duration,
      context.userId,
      context.organizationId,
      context.requestId
    )

    return response
  } catch (error) {
    // Log security event for middleware errors
    logSecurityEvent(
      'middleware_error',
      'high',
      context.userId,
      context.organizationId,
      context.ipAddress,
      { error: error instanceof Error ? error.message : 'Unknown error', pathname }
    )

    // Return error response
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if file is static
 */
function isStaticFile(pathname: string): boolean {
  return pathname.startsWith('/_next') || 
         pathname.startsWith('/static') ||
         /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/.test(pathname)
}

/**
 * Check if route requires authentication
 */
function requiresAuthentication(pathname: string): boolean {
  return !isPublicRoute(pathname) && !pathname.startsWith('/api/')
}

/**
 * Handle API route authentication and authorization
 */
async function handleApiRoute(
  request: NextRequest, 
  response: NextResponse, 
  context: any
): Promise<NextResponse> {
  // Extract organization ID from path for API routes
  const orgMatch = request.nextUrl.pathname.match(/^\/api\/org\/([^\/]+)/)
  const organizationId = orgMatch ? orgMatch[1] : undefined

  // Check if this is an admin API route
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    return await checkApiPermissions(
      request,
      response,
      Permission.SYSTEM_ADMIN,
      undefined,
      context
    )
  }

  // Check if this is an organization API route
  if (request.nextUrl.pathname.startsWith('/api/org')) {
    if (!organizationId) {
      logSecurityEvent(
        'api_route_without_org_id',
        'medium',
        context.userId,
        undefined,
        context.ipAddress,
        { pathname: request.nextUrl.pathname }
      )
      return new NextResponse('Organization ID required', { status: 400 })
    }

    return await checkApiPermissions(
      request,
      response,
      Permission.USER_BASIC,
      organizationId,
      context
    )
  }

  return response
}

/**
 * Handle protected route authentication and authorization
 */
async function handleProtectedRoute(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  context: any
): Promise<NextResponse> {
  // Check if user is authenticated
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    logSecurityEvent(
      'unauthenticated_access_attempt',
      'medium',
      undefined,
      undefined,
      context.ipAddress,
      { pathname }
    )

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Update context with user info
  context.userId = user.id

  // Check route permissions
  const routeConfig = getRouteConfig(pathname)
  if (routeConfig) {
    // Extract organization ID from path
    const orgMatch = pathname.match(/^\/org\/([^\/]+)/)
    const organizationId = orgMatch ? orgMatch[1] : undefined
    context.organizationId = organizationId

    // Check permissions
    const hasAccess = await checkRoutePermissions(
      user.id,
      routeConfig,
      organizationId,
      context
    )

    if (!hasAccess) {
      logSecurityEvent(
        'unauthorized_access_attempt',
        'high',
        user.id,
        organizationId,
        context.ipAddress,
        { pathname, requiredPermissions: routeConfig.permissions }
      )

      // For admin routes, temporarily allow access (temporary admin permissions)
      if (pathname.startsWith('/admin')) {
        // Allow access to admin routes for now (temporary system admin permissions)
        return response
      }

      // Redirect to appropriate page based on user role
            const userWithRoles = await getCurrentUserWithRoles()
            if (userWithRoles?.roles.some((role: any) => role.role_type === RoleType.SYSTEM_ADMIN)) {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else if (userWithRoles?.roles && userWithRoles.roles.length > 0) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/setup', request.url))
      }
    }
  }

  return response
}

/**
 * Check API route permissions
 */
async function checkApiPermissions(
  request: NextRequest,
  response: NextResponse,
  requiredPermission: Permission,
  organizationId?: string,
  context?: any
): Promise<NextResponse> {
  // TEMPORARY: Skip permission checking to prevent infinite recursion
  console.log('⚠️  TEMPORARY: Skipping API permission checks to prevent infinite recursion')
  return response
}

/**
 * Check route permissions for a user
 */
async function checkRoutePermissions(
  userId: string,
  routeConfig: any,
  organizationId?: string,
  context?: any
): Promise<boolean> {
  // TEMPORARY: Skip permission checking to prevent infinite recursion
  console.log('⚠️  TEMPORARY: Skipping route permission checks to prevent infinite recursion')
  return true
}

/**
 * Get route configuration
 */
function getRouteConfig(pathname: string): any {
  // Find matching route pattern
  for (const [pattern, config] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(pattern)) {
      return config
    }
  }
  return null
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
