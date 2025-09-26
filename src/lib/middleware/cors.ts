// =====================================================
// CORS Middleware
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { handleCorsPreflight, addCorsHeaders } from '@/lib/utils/api'

// =====================================================
// TYPES
// =====================================================

export interface CorsConfig {
  origins: string[]
  methods: string[]
  headers: string[]
  credentials?: boolean
  maxAge?: number
  exposeHeaders?: string[]
  optionsSuccessStatus?: number
}

export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean)
  methods?: string | string[]
  allowedHeaders?: string | string[]
  exposedHeaders?: string | string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
  preflightContinue?: boolean
}

// =====================================================
// DEFAULT CORS CONFIGURATIONS
// =====================================================

export const corsConfigs = {
  // Default CORS configuration
  default: {
    origins: ['http://localhost:3000', 'https://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    exposeHeaders: ['Content-Length', 'X-Request-ID']
  },

  // Development CORS configuration
  development: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: ['*'],
    credentials: true,
    maxAge: 0, // No caching in development
    exposeHeaders: ['*']
  },

  // Production CORS configuration
  production: {
    origins: [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://api.yourdomain.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-API-Key',
      'X-Organization-ID',
      'X-User-ID'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    exposeHeaders: ['Content-Length', 'X-Request-ID', 'X-Rate-Limit-Remaining']
  },

  // API-specific CORS configuration
  api: {
    origins: ['*'], // Allow all origins for API
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-API-Key',
      'X-Organization-ID',
      'X-User-ID'
    ],
    credentials: false,
    maxAge: 3600, // 1 hour
    exposeHeaders: ['Content-Length', 'X-Request-ID']
  },

  // Admin CORS configuration (restrictive)
  admin: {
    origins: ['https://admin.yourdomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Admin-Token'
    ],
    credentials: true,
    maxAge: 1800, // 30 minutes
    exposeHeaders: ['Content-Length', 'X-Request-ID']
  }
}

// =====================================================
// CORS MIDDLEWARE FUNCTIONS
// =====================================================

/**
 * Create CORS middleware
 */
export function createCorsMiddleware(config: CorsConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const origin = request.headers.get('origin')
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(request, config)
    }
    
    // Handle actual requests
    const response = NextResponse.next()
    return addCorsHeaders(response, config, origin || undefined)
  }
}

/**
 * Default CORS middleware
 */
export const defaultCors = createCorsMiddleware(corsConfigs.default)

/**
 * Development CORS middleware
 */
export const developmentCors = createCorsMiddleware(corsConfigs.development)

/**
 * Production CORS middleware
 */
export const productionCors = createCorsMiddleware(corsConfigs.production)

/**
 * API CORS middleware
 */
export const apiCors = createCorsMiddleware(corsConfigs.api)

/**
 * Admin CORS middleware
 */
export const adminCors = createCorsMiddleware(corsConfigs.admin)

// =====================================================
// DYNAMIC CORS FUNCTIONS
// =====================================================

/**
 * Create dynamic CORS middleware based on environment
 */
export function createDynamicCorsMiddleware(): (request: NextRequest) => Promise<NextResponse | null> {
  const config = process.env.NODE_ENV === 'production' 
    ? corsConfigs.production 
    : corsConfigs.development
  
  return createCorsMiddleware(config)
}

/**
 * Create CORS middleware with custom origin validation
 */
export function createCustomOriginCorsMiddleware(
  originValidator: (origin: string) => boolean,
  baseConfig: CorsConfig
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const origin = request.headers.get('origin')
    
    if (origin && !originValidator(origin)) {
      return new NextResponse('CORS policy violation', { status: 403 })
    }
    
    const middleware = createCorsMiddleware(baseConfig)
    return middleware(request)
  }
}

/**
 * Create CORS middleware with subdomain support
 */
export function createSubdomainCorsMiddleware(
  baseDomain: string,
  baseConfig: CorsConfig
): (request: NextRequest) => Promise<NextResponse | null> {
  return createCustomOriginCorsMiddleware(
    (origin) => {
      try {
        const url = new URL(origin)
        return url.hostname === baseDomain || url.hostname.endsWith(`.${baseDomain}`)
      } catch {
        return false
      }
    },
    baseConfig
  )
}

/**
 * Create CORS middleware with wildcard subdomain support
 */
export function createWildcardSubdomainCorsMiddleware(
  baseDomain: string,
  baseConfig: CorsConfig
): (request: NextRequest) => Promise<NextResponse | null> {
  return createCustomOriginCorsMiddleware(
    (origin) => {
      try {
        const url = new URL(origin)
        return url.hostname === baseDomain || 
               url.hostname.endsWith(`.${baseDomain}`) ||
               !!url.hostname.match(new RegExp(`^[a-zA-Z0-9-]+\\.${baseDomain.replace(/\./g, '\\.')}$`))
      } catch {
        return false
      }
    },
    baseConfig
  )
}

// =====================================================
// CORS UTILITY FUNCTIONS
// =====================================================

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes('*')) {
    return true
  }
  
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin === origin) {
      return true
    }
    
    // Support for wildcard subdomains
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2)
      return origin.endsWith(`.${domain}`) || origin === domain
    }
    
    return false
  })
}

/**
 * Get allowed origin for response
 */
export function getAllowedOrigin(origin: string, allowedOrigins: string[]): string | null {
  if (!origin) {
    return null
  }
  
  if (isOriginAllowed(origin, allowedOrigins)) {
    return origin
  }
  
  // Return first allowed origin if origin is not allowed and credentials are false
  return allowedOrigins.length > 0 ? allowedOrigins[0] : null
}

/**
 * Create CORS response
 */
export function createCorsResponse(
  request: NextRequest,
  config: CorsConfig,
  status: number = 200
): NextResponse {
  const origin = request.headers.get('origin')
  const allowedOrigin = getAllowedOrigin(origin || '', config.origins)
  
  const response = new NextResponse(null, { status })
  
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  }
  
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', config.headers.join(', '))
  
  if (config.exposeHeaders && config.exposeHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', config.exposeHeaders.join(', '))
  }
  
  if (config.maxAge !== undefined) {
    response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
  }
  
  return response
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(
  request: NextRequest,
  config: CorsConfig
): NextResponse {
  const origin = request.headers.get('origin')
  
  if (!origin || !isOriginAllowed(origin, config.origins)) {
    return new NextResponse('CORS policy violation', { status: 403 })
  }
  
  const response = createCorsResponse(request, config, 204)
  
  // Add additional headers for preflight
  const requestedMethod = request.headers.get('Access-Control-Request-Method')
  const requestedHeaders = request.headers.get('Access-Control-Request-Headers')
  
  if (requestedMethod && !config.methods.includes(requestedMethod)) {
    return new NextResponse('CORS policy violation: method not allowed', { status: 403 })
  }
  
  if (requestedHeaders) {
    const headers = requestedHeaders.split(',').map(h => h.trim())
    const allowedHeaders = config.headers.includes('*') ? headers : config.headers
    
    for (const header of headers) {
      if (!allowedHeaders.includes(header)) {
        return new NextResponse('CORS policy violation: header not allowed', { status: 403 })
      }
    }
  }
  
  return response
}

// =====================================================
// CORS CONFIGURATION BUILDERS
// =====================================================

/**
 * Build CORS configuration from environment variables
 */
export function buildCorsConfigFromEnv(): CorsConfig {
  const origins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  const methods = process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  const headers = process.env.CORS_HEADERS?.split(',') || ['Content-Type', 'Authorization']
  const credentials = process.env.CORS_CREDENTIALS === 'true'
  const maxAge = parseInt(process.env.CORS_MAX_AGE || '86400')
  
  return {
    origins,
    methods,
    headers,
    credentials,
    maxAge,
    exposeHeaders: ['Content-Length', 'X-Request-ID']
  }
}

/**
 * Build CORS configuration for specific environment
 */
export function buildCorsConfigForEnvironment(env: 'development' | 'staging' | 'production'): CorsConfig {
  switch (env) {
    case 'development':
      return corsConfigs.development
    case 'staging':
      return {
        ...corsConfigs.production,
        origins: [
          'https://staging.yourdomain.com',
          'https://staging-api.yourdomain.com'
        ]
      }
    case 'production':
      return corsConfigs.production
    default:
      return corsConfigs.default
  }
}

/**
 * Build CORS configuration for API endpoints
 */
export function buildApiCorsConfig(apiVersion: string = 'v1'): CorsConfig {
  return {
    ...corsConfigs.api,
    origins: [
      `https://api-${apiVersion}.yourdomain.com`,
      'https://api.yourdomain.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    ]
  }
}

/**
 * Build CORS configuration for admin endpoints
 */
export function buildAdminCorsConfig(): CorsConfig {
  return {
    ...corsConfigs.admin,
    origins: [
      'https://admin.yourdomain.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3001'] : [])
    ]
  }
}

/**
 * Build CORS configuration for webhook endpoints
 */
export function buildWebhookCorsConfig(): CorsConfig {
  return {
    origins: ['*'], // Webhooks typically come from external services
    methods: ['POST', 'OPTIONS'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-Webhook-Signature',
      'X-Webhook-Event',
      'User-Agent'
    ],
    credentials: false,
    maxAge: 86400,
    exposeHeaders: ['X-Webhook-Response-ID']
  }
}

/**
 * Build CORS configuration for public API
 */
export function buildPublicApiCorsConfig(): CorsConfig {
  return {
    origins: ['*'],
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'Accept',
      'Origin'
    ],
    credentials: false,
    maxAge: 3600,
    exposeHeaders: ['Content-Length', 'X-Rate-Limit-Remaining', 'X-Request-ID']
  }
}

/**
 * Build CORS configuration for authenticated API
 */
export function buildAuthenticatedApiCorsConfig(): CorsConfig {
  return {
    origins: [
      'https://app.yourdomain.com',
      'https://dashboard.yourdomain.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    headers: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Organization-ID',
      'X-User-ID',
      'X-API-Key'
    ],
    credentials: true,
    maxAge: 3600,
    exposeHeaders: [
      'Content-Length',
      'X-Request-ID',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ]
  }
}

// =====================================================
// CORS MIDDLEWARE COMPOSERS
// =====================================================

/**
 * Compose multiple CORS middlewares
 */
export function composeCorsMiddlewares(
  middlewares: Array<(request: NextRequest) => Promise<NextResponse | null>>
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const response = await middleware(request)
      if (response) {
        return response
      }
    }
    return null
  }
}

/**
 * Create conditional CORS middleware
 */
export function createConditionalCorsMiddleware(
  condition: (request: NextRequest) => boolean,
  corsMiddleware: (request: NextRequest) => Promise<NextResponse | null>
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    if (condition(request)) {
      return corsMiddleware(request)
    }
    return null
  }
}

/**
 * Create path-based CORS middleware
 */
export function createPathBasedCorsMiddleware(
  pathConfigs: Record<string, CorsConfig>
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const pathname = request.nextUrl.pathname
    
    for (const [path, config] of Object.entries(pathConfigs)) {
      if (pathname.startsWith(path)) {
        return createCorsMiddleware(config)(request)
      }
    }
    
    return null
  }
}

/**
 * Create method-based CORS middleware
 */
export function createMethodBasedCorsMiddleware(
  methodConfigs: Record<string, CorsConfig>
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const method = request.method
    
    if (methodConfigs[method]) {
      return createCorsMiddleware(methodConfigs[method])(request)
    }
    
    return null
  }
}
