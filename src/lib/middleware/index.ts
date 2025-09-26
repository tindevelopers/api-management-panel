// =====================================================
// Middleware Index
// =====================================================

// Export all middleware utilities
export * from './rate-limiting'
export * from './cors'
export * from './logging'
export * from './error-handling'

// =====================================================
// MIDDLEWARE COMPOSITION UTILITIES
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createCorsMiddleware } from './cors'
import { createRateLimitMiddleware } from './rate-limiting'
import { createRequestLoggingMiddleware } from './logging'
import { createErrorHandlingMiddleware, buildErrorHandlingConfigForEnvironment } from './error-handling'

// =====================================================
// MIDDLEWARE PIPELINE
// =====================================================

/**
 * Create a middleware pipeline that runs multiple middleware in sequence
 */
export function createMiddlewarePipeline(
  ...middlewares: Array<(request: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse | null>>
) {
  return async (request: NextRequest, finalHandler: () => Promise<NextResponse>): Promise<NextResponse> => {
    let index = 0

    const next = async (): Promise<NextResponse> => {
      if (index >= middlewares.length) {
        return await finalHandler()
      }

      const middleware = middlewares[index++]
      const result = await middleware(request, next)

      if (result !== null) {
        return result
      }

      return await next()
    }

    return await next()
  }
}

/**
 * Create a complete API middleware stack
 */
export function createApiMiddlewareStack(options: {
  enableCors?: boolean
  enableRateLimit?: boolean
  enableLogging?: boolean
  enableErrorHandling?: boolean
  corsOptions?: any
  rateLimitOptions?: any
  errorHandlingOptions?: any
  environment?: 'development' | 'staging' | 'production'
}) {
  const {
    enableCors = true,
    enableRateLimit = true,
    enableLogging = true,
    enableErrorHandling = true,
    corsOptions = {},
    rateLimitOptions = {},
    errorHandlingOptions = {},
    environment = 'production'
  } = options

  const middlewares: Array<(request: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse | null>> = []

  // Add CORS middleware
  if (enableCors) {
    const corsMiddleware = createCorsMiddleware(corsOptions)
    middlewares.push(async (request, next) => {
      const corsResult = await corsMiddleware(request)
      if (corsResult) return corsResult
      return await next()
    })
  }

  // Add rate limiting middleware
  if (enableRateLimit) {
    const rateLimitMiddleware = createRateLimitMiddleware(rateLimitOptions)
    middlewares.push(async (request, next) => {
      const rateLimitResult = await rateLimitMiddleware(request)
      if (rateLimitResult) return rateLimitResult
      return await next()
    })
  }

  // Add logging middleware
  if (enableLogging) {
    const loggingMiddleware = createRequestLoggingMiddleware()
    middlewares.push(async (request, next) => {
      return await loggingMiddleware(request)
    })
  }

  // Add error handling middleware
  if (enableErrorHandling) {
    const errorConfig = buildErrorHandlingConfigForEnvironment(environment)
    const errorMiddleware = createErrorHandlingMiddleware({ ...errorConfig, ...errorHandlingOptions })
    
    middlewares.push(async (request, next) => {
      return await errorMiddleware(request, next)
    })
  }

  return createMiddlewarePipeline(...middlewares)
}

/**
 * Create a simplified API middleware for basic use cases
 */
export function createBasicApiMiddleware() {
  return createApiMiddlewareStack({
    enableCors: true,
    enableRateLimit: true,
    enableLogging: false,
    enableErrorHandling: true,
    corsOptions: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    },
    rateLimitOptions: {
      limit: 100,
      windowMs: 60 * 1000 // 1 minute
    }
  })
}

/**
 * Create a secure API middleware for sensitive endpoints
 */
export function createSecureApiMiddleware() {
  return createApiMiddlewareStack({
    enableCors: true,
    enableRateLimit: true,
    enableLogging: true,
    enableErrorHandling: true,
    corsOptions: {
      origin: (origin: string | null) => {
        // Add your allowed origins here
        const allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com']
        return !origin || allowedOrigins.includes(origin)
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    rateLimitOptions: {
      limit: 50,
      windowMs: 60 * 1000, // 1 minute
      keyGenerator: (request: NextRequest) => {
        // Use user ID if available, otherwise IP
        const userId = request.headers.get('x-user-id')
        return userId || request.headers.get('x-forwarded-for') || 'anonymous'
      }
    }
  })
}

/**
 * Create middleware for public endpoints
 */
export function createPublicApiMiddleware() {
  return createApiMiddlewareStack({
    enableCors: true,
    enableRateLimit: true,
    enableLogging: false,
    enableErrorHandling: true,
    corsOptions: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false
    },
    rateLimitOptions: {
      limit: 200,
      windowMs: 60 * 1000 // 1 minute
    }
  })
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Skip middleware for specific paths
 */
export function skipMiddlewareForPaths(
  middleware: (request: NextRequest) => Promise<NextResponse | null>,
  skipPaths: string[]
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const pathname = request.nextUrl.pathname
    
    if (skipPaths.some(path => pathname.startsWith(path))) {
      return null
    }

    return await middleware(request)
  }
}

/**
 * Apply middleware only to specific paths
 */
export function applyMiddlewareToPaths(
  middleware: (request: NextRequest) => Promise<NextResponse | null>,
  allowedPaths: string[]
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const pathname = request.nextUrl.pathname
    
    if (!allowedPaths.some(path => pathname.startsWith(path))) {
      return null
    }

    return await middleware(request)
  }
}

/**
 * Combine multiple middleware with OR logic (first non-null result wins)
 */
export function combineMiddleware(
  ...middlewares: Array<(request: NextRequest) => Promise<NextResponse | null>>
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(request)
      if (result !== null) {
        return result
      }
    }
    return null
  }
}

/**
 * Create conditional middleware
 */
export function createConditionalMiddleware(
  condition: (request: NextRequest) => boolean | Promise<boolean>,
  middleware: (request: NextRequest) => Promise<NextResponse | null>
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const shouldRun = await condition(request)
    if (!shouldRun) {
      return null
    }
    return await middleware(request)
  }
}

/**
 * Create middleware with timeout
 */
export function createTimeoutMiddleware(
  middleware: (request: NextRequest) => Promise<NextResponse | null>,
  timeoutMs: number = 5000
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const timeoutPromise = new Promise<NextResponse | null>((_, reject) => {
      setTimeout(() => reject(new Error('Middleware timeout')), timeoutMs)
    })

    const middlewarePromise = middleware(request)

    try {
      return await Promise.race([middlewarePromise, timeoutPromise])
    } catch (error) {
      console.error('Middleware timeout:', error)
      return new NextResponse('Request timeout', { status: 408 })
    }
  }
}

/**
 * Create retry middleware
 */
export function createRetryMiddleware(
  middleware: (request: NextRequest) => Promise<NextResponse | null>,
  maxRetries: number = 3,
  retryDelayMs: number = 1000
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await middleware(request)
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          console.error(`Middleware failed after ${maxRetries} attempts:`, error)
          break
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt))
      }
    }

    return new NextResponse('Service temporarily unavailable', { status: 503 })
  }
}

// =====================================================
// MIDDLEWARE DECORATORS
// =====================================================

/**
 * Add request timing to middleware
 */
export function withTiming<T extends (request: NextRequest) => Promise<NextResponse | null>>(
  middleware: T
): T {
  return (async (request: NextRequest) => {
    const startTime = Date.now()
    const result = await middleware(request)
    const duration = Date.now() - startTime

    // Add timing header if response exists
    if (result && result instanceof NextResponse) {
      result.headers.set('X-Response-Time', `${duration}ms`)
    }

    return result
  }) as T
}

/**
 * Add caching headers to middleware
 */
export function withCaching<T extends (request: NextRequest) => Promise<NextResponse | null>>(
  middleware: T,
  cacheOptions: {
    maxAge?: number
    sMaxAge?: number
    mustRevalidate?: boolean
    noCache?: boolean
  } = {}
): T {
  return (async (request: NextRequest) => {
    const result = await middleware(request)

    if (result && result instanceof NextResponse) {
      const { maxAge = 3600, sMaxAge, mustRevalidate, noCache } = cacheOptions

      if (noCache) {
        result.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      } else {
        let cacheControl = `public, max-age=${maxAge}`
        if (sMaxAge) cacheControl += `, s-maxage=${sMaxAge}`
        if (mustRevalidate) cacheControl += ', must-revalidate'
        result.headers.set('Cache-Control', cacheControl)
      }
    }

    return result
  }) as T
}

/**
 * Add security headers to middleware
 */
export function withSecurityHeaders<T extends (request: NextRequest) => Promise<NextResponse | null>>(
  middleware: T
): T {
  return (async (request: NextRequest) => {
    const result = await middleware(request)

    if (result && result instanceof NextResponse) {
      // Add security headers
      result.headers.set('X-Content-Type-Options', 'nosniff')
      result.headers.set('X-Frame-Options', 'DENY')
      result.headers.set('X-XSS-Protection', '1; mode=block')
      result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      result.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    }

    return result
  }) as T
}

// =====================================================
// COMMON MIDDLEWARE COMBINATIONS
// =====================================================

/**
 * Standard web API middleware
 */
export const standardApiMiddleware = createApiMiddlewareStack({
  enableCors: true,
  enableRateLimit: true,
  enableLogging: true,
  enableErrorHandling: true,
  corsOptions: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  },
  rateLimitOptions: {
    limit: 100,
    windowMs: 60 * 1000
  }
})

/**
 * Admin API middleware
 */
export const adminApiMiddleware = createApiMiddlewareStack({
  enableCors: true,
  enableRateLimit: true,
  enableLogging: true,
  enableErrorHandling: true,
  corsOptions: {
      origin: (origin: string | null) => {
        // Restrict to admin domains only
        const adminOrigins = ['https://admin.yourdomain.com']
        return !origin || adminOrigins.includes(origin)
      },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  rateLimitOptions: {
    limit: 50,
    windowMs: 60 * 1000
  }
})

/**
 * Public API middleware
 */
export const publicApiMiddleware = createPublicApiMiddleware()

/**
 * Internal API middleware (for service-to-service communication)
 */
export const internalApiMiddleware = createApiMiddlewareStack({
  enableCors: false,
  enableRateLimit: false,
  enableLogging: true,
  enableErrorHandling: true
})
