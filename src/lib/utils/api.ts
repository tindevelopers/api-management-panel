// =====================================================
// API Utilities
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

// =====================================================
// TYPES
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  requestId?: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
  field?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp: string
}

export interface RequestContext {
  userId?: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
  requestId: string
  timestamp: string
}

// =====================================================
// HTTP STATUS CODES
// =====================================================

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const

// =====================================================
// ERROR CODES
// =====================================================

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const

// =====================================================
// RESPONSE UTILITIES
// =====================================================

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = HttpStatus.OK
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  code: string = ErrorCodes.INTERNAL_ERROR,
  status: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: any
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    message: error,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit)
  
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response)
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  errors: Record<string, string[]> | ZodError,
  message: string = 'Validation failed'
): NextResponse<ApiResponse> {
  let errorDetails: Record<string, string[]> = {}
  
  if (errors instanceof ZodError) {
    errors.errors.forEach((error) => {
      const field = error.path.join('.')
      if (!errorDetails[field]) {
        errorDetails[field] = []
      }
      errorDetails[field].push(error.message)
    })
  } else {
    errorDetails = errors
  }
  
  const response: ApiResponse = {
    success: false,
    error: message,
    message,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, {
    status: HttpStatus.UNPROCESSABLE_ENTITY
  })
}

/**
 * Create a not found response
 */
export function createNotFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return createErrorResponse(
    `${resource} not found`,
    ErrorCodes.NOT_FOUND,
    HttpStatus.NOT_FOUND
  )
}

/**
 * Create an unauthorized response
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    ErrorCodes.UNAUTHORIZED,
    HttpStatus.UNAUTHORIZED
  )
}

/**
 * Create a forbidden response
 */
export function createForbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    ErrorCodes.FORBIDDEN,
    HttpStatus.FORBIDDEN
  )
}

/**
 * Create a conflict response
 */
export function createConflictResponse(message: string = 'Conflict'): NextResponse<ApiResponse> {
  return createErrorResponse(
    message,
    ErrorCodes.CONFLICT,
    HttpStatus.CONFLICT
  )
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(
  message: string = 'Rate limit exceeded',
  retryAfter?: number
): NextResponse<ApiResponse> {
  const response = createErrorResponse(
    message,
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    HttpStatus.TOO_MANY_REQUESTS
  )
  
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString())
  }
  
  return response
}

// =====================================================
// REQUEST UTILITIES
// =====================================================

/**
 * Extract request context from NextRequest
 */
export function extractRequestContext(request: NextRequest): RequestContext {
  const requestId = request.headers.get('x-request-id') || generateRequestId()
  const userId = request.headers.get('x-user-id') || undefined
  const organizationId = request.headers.get('x-organization-id') || undefined
  const ipAddress = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || undefined
  
  return {
    requestId,
    userId,
    organizationId,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString()
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || 'unknown'
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Parse request body with error handling
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T | null> {
  try {
    const body = await request.text()
    
    if (!body) {
      return null
    }
    
    return JSON.parse(body)
  } catch (error) {
    console.error('Error parsing request body:', error)
    return null
  }
}

/**
 * Get query parameters from request
 */
export function getQueryParams(request: NextRequest): Record<string, string> {
  const params: Record<string, string> = {}
  
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  return params
}

/**
 * Validate required headers
 */
export function validateRequiredHeaders(
  request: NextRequest,
  requiredHeaders: string[]
): { isValid: boolean; missingHeaders: string[] } {
  const missingHeaders: string[] = []
  
  requiredHeaders.forEach(header => {
    if (!request.headers.get(header)) {
      missingHeaders.push(header)
    }
  })
  
  return {
    isValid: missingHeaders.length === 0,
    missingHeaders
  }
}

// =====================================================
// ERROR HANDLING UTILITIES
// =====================================================

/**
 * Handle API errors with proper logging and response
 */
export function handleApiError(
  error: unknown,
  context?: RequestContext
): NextResponse<ApiResponse> {
  console.error('API Error:', {
    error,
    context,
    timestamp: new Date().toISOString()
  })
  
  // Handle specific error types
  if (error instanceof ZodError) {
    return createValidationErrorResponse(error)
  }
  
  if (error instanceof Error) {
    // Handle known error types
    if (error.name === 'PermissionError') {
      return createForbiddenResponse(error.message)
    }
    
    if (error.name === 'NotFoundError') {
      return createNotFoundResponse(error.message)
    }
    
    if (error.name === 'ConflictError') {
      return createConflictResponse(error.message)
    }
    
    // Generic error
    return createErrorResponse(
      error.message || 'An unexpected error occurred',
      ErrorCodes.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }
  
  // Unknown error
  return createErrorResponse(
    'An unexpected error occurred',
    ErrorCodes.INTERNAL_ERROR,
    HttpStatus.INTERNAL_SERVER_ERROR
  )
}

/**
 * Wrap async handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      const request = args.find(arg => arg instanceof Request) as NextRequest
      const context = request ? extractRequestContext(request) : undefined
      return handleApiError(error, context)
    }
  }
}

/**
 * Create a timeout promise
 */
export function createTimeoutPromise<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

// =====================================================
// RATE LIMITING UTILITIES
// =====================================================

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Simple in-memory rate limiter (for production, use Redis)
 */
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  
  check(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now()
    const resetTime = now + config.windowMs
    
    const existing = this.requests.get(key)
    
    if (!existing || now > existing.resetTime) {
      // Reset or create new entry
      this.requests.set(key, { count: 1, resetTime })
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime
      }
    }
    
    if (existing.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
        retryAfter: Math.ceil((existing.resetTime - now) / 1000)
      }
    }
    
    // Increment counter
    existing.count++
    this.requests.set(key, existing)
    
    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetTime: existing.resetTime
    }
  }
  
  // Clean up expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

const rateLimiter = new RateLimiter()

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.keyGenerator ? config.keyGenerator(request) : getClientIP(request)
  return rateLimiter.check(key, config)
}

/**
 * Default rate limit key generator
 */
export function defaultRateLimitKeyGenerator(request: NextRequest): string {
  const userId = request.headers.get('x-user-id')
  const ip = getClientIP(request)
  
  return userId ? `user:${userId}` : `ip:${ip}`
}

// =====================================================
// CORS UTILITIES
// =====================================================

export interface CorsConfig {
  origins: string[]
  methods: string[]
  headers: string[]
  credentials?: boolean
  maxAge?: number
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(
  request: NextRequest,
  config: CorsConfig
): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null
  }
  
  const origin = request.headers.get('origin')
  const allowedOrigin = config.origins.includes(origin || '') ? origin : config.origins[0]
  
  const response = new NextResponse(null, { status: 200 })
  
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  }
  
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', config.headers.join(', '))
  
  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', config.maxAge.toString())
  }
  
  return response
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  config: CorsConfig,
  origin?: string
): NextResponse {
  const allowedOrigin = config.origins.includes(origin || '') ? origin : config.origins[0]
  
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  }
  
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

// =====================================================
// CACHE UTILITIES
// =====================================================

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  response: NextResponse,
  maxAge: number,
  staleWhileRevalidate?: number
): NextResponse {
  response.headers.set('Cache-Control', [
    `public, max-age=${maxAge}`,
    staleWhileRevalidate ? `stale-while-revalidate=${staleWhileRevalidate}` : ''
  ].filter(Boolean).join(', '))
  
  response.headers.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString())
  
  return response
}

/**
 * Add no-cache headers to response
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

// =====================================================
// API VERSIONING UTILITIES
// =====================================================

/**
 * Extract API version from request
 */
export function extractApiVersion(request: NextRequest): string {
  const version = request.headers.get('api-version') || 
                  request.headers.get('accept-version') ||
                  request.nextUrl.searchParams.get('version') ||
                  'v1'
  
  return version
}

/**
 * Validate API version
 */
export function validateApiVersion(version: string, supportedVersions: string[]): boolean {
  return supportedVersions.includes(version)
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Check if response is successful
 */
export function isSuccessfulResponse(status: number): boolean {
  return status >= 200 && status < 300
}

/**
 * Check if response is client error
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500
}

/**
 * Check if response is server error
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600
}

/**
 * Format error message for logging
 */
export function formatErrorForLogging(error: unknown, context?: RequestContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context.requestId}]` : ''
  
  if (error instanceof Error) {
    return `${timestamp} ${contextStr} Error: ${error.message}\nStack: ${error.stack}`
  }
  
  return `${timestamp} ${contextStr} Unknown error: ${JSON.stringify(error)}`
}

/**
 * Sanitize error for client response
 */
export function sanitizeErrorForClient(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production') {
      return 'An internal error occurred'
    }
    return error.message
  }
  
  return 'An unknown error occurred'
}

/**
 * Create a health check response
 */
export function createHealthCheckResponse(services: Record<string, boolean> = {}): NextResponse<ApiResponse> {
  const allHealthy = Object.values(services).every(status => status === true)
  
  return createSuccessResponse(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      services,
      timestamp: new Date().toISOString()
    },
    allHealthy ? 'All services healthy' : 'Some services unhealthy',
    allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE
  )
}
