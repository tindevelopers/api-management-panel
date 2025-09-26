import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Route protection configuration
const protectedRoutes = {
  '/admin': ['system_admin'],
  '/admin/organizations': ['system_admin'],
  '/admin/users': ['system_admin'],
  '/admin/apis': ['system_admin'],
  '/admin/analytics': ['system_admin'],
  '/org': ['organization_admin', 'user'],
  '/org/users': ['organization_admin'],
  '/org/apis': ['organization_admin', 'user'],
  '/org/invitations': ['organization_admin'],
  '/org/analytics': ['organization_admin'],
  '/org/settings': ['organization_admin'],
  '/api-keys': ['organization_admin', 'user']
}

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/setup',
  '/api/auth'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle auth session first
  const response = await updateSession(request)
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return response
  }

  // Check if route requires authentication
  const requiresAuth = !publicRoutes.some(route => pathname.startsWith(route))
  
  if (requiresAuth) {
    // Check if user is authenticated
    const { data: { user } } = await response.json?.() || { data: { user: null } }
    
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check route-specific permissions
    const routePermissions = getRoutePermissions(pathname)
    if (routePermissions.length > 0) {
      // For now, we'll let the client-side components handle permission checks
      // In a production app, you might want to verify permissions server-side here
    }
  }

  return response
}

function getRoutePermissions(pathname: string): string[] {
  // Find matching route pattern
  for (const [pattern, permissions] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(pattern)) {
      return permissions
    }
  }
  return []
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
