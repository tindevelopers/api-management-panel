// =====================================================
// Rate Limiting Middleware
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, defaultRateLimitKeyGenerator, createRateLimitResponse } from '@/lib/utils/api'
import { logSecurityEvent } from '@/lib/utils/logging'

// =====================================================
// TYPES
// =====================================================

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

// =====================================================
// RATE LIMITING CONFIGURATIONS
// =====================================================

export const rateLimitConfigs = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.'
  },

  // Strict rate limiting for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  },

  // Moderate rate limiting for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 60,
    message: 'API rate limit exceeded, please try again later.'
  },

  // Strict rate limiting for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many sensitive operations, please try again later.'
  },

  // Very strict rate limiting for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later.'
  }
}

// =====================================================
// RATE LIMITING MIDDLEWARE
// =====================================================

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Generate rate limit key
      const key = config.keyGenerator 
        ? config.keyGenerator(request) 
        : defaultRateLimitKeyGenerator(request)

      // Check rate limit
      const result = checkRateLimit(request, {
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        keyGenerator: config.keyGenerator
      })

      // If rate limit exceeded, return error response
      if (!result.allowed) {
        logSecurityEvent(
          'rate_limit_exceeded',
          'medium',
          undefined,
          undefined,
          getClientIP(request),
          {
            key,
            limit: config.maxRequests,
            windowMs: config.windowMs,
            pathname: request.nextUrl.pathname,
            method: request.method
          }
        )

        const response = createRateLimitResponse(
          config.message || 'Rate limit exceeded',
          result.retryAfter
        )

        // Add rate limit headers
        if (config.standardHeaders) {
          response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
          response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
        }

        if (config.legacyHeaders) {
          response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
          response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
        }

        return response
      }

      // Add rate limit headers to successful response
      const response = NextResponse.next()
      if (config.standardHeaders) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
      }

      return response
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request to proceed
      return null
    }
  }
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = createRateLimitMiddleware({
  ...rateLimitConfigs.auth,
  standardHeaders: true,
  legacyHeaders: true
})

/**
 * Rate limiting middleware for general API endpoints
 */
export const apiRateLimit = createRateLimitMiddleware({
  ...rateLimitConfigs.api,
  standardHeaders: true,
  legacyHeaders: true
})

/**
 * Rate limiting middleware for sensitive operations
 */
export const sensitiveRateLimit = createRateLimitMiddleware({
  ...rateLimitConfigs.sensitive,
  standardHeaders: true,
  legacyHeaders: true
})

/**
 * Rate limiting middleware for password reset
 */
export const passwordResetRateLimit = createRateLimitMiddleware({
  ...rateLimitConfigs.passwordReset,
  standardHeaders: true,
  legacyHeaders: true
})

// =====================================================
// CUSTOM RATE LIMIT KEY GENERATORS
// =====================================================

/**
 * Rate limit by user ID
 */
export function userBasedRateLimitKeyGenerator(request: NextRequest): string {
  const userId = request.headers.get('x-user-id') || 'anonymous'
  return `user:${userId}`
}

/**
 * Rate limit by organization ID
 */
export function organizationBasedRateLimitKeyGenerator(request: NextRequest): string {
  const orgId = request.headers.get('x-organization-id') || 'default'
  return `org:${orgId}`
}

/**
 * Rate limit by API key
 */
export function apiKeyBasedRateLimitKeyGenerator(request: NextRequest): string {
  const apiKey = request.headers.get('x-api-key') || 'anonymous'
  return `apikey:${apiKey}`
}

/**
 * Rate limit by IP and user combination
 */
export function ipUserBasedRateLimitKeyGenerator(request: NextRequest): string {
  const ip = getClientIP(request)
  const userId = request.headers.get('x-user-id') || 'anonymous'
  return `ip-user:${ip}:${userId}`
}

/**
 * Rate limit by endpoint
 */
export function endpointBasedRateLimitKeyGenerator(request: NextRequest): string {
  const endpoint = request.nextUrl.pathname
  const ip = getClientIP(request)
  return `endpoint:${endpoint}:${ip}`
}

// =====================================================
// SPECIALIZED RATE LIMITING FUNCTIONS
// =====================================================

/**
 * Apply rate limiting to request
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; response?: NextResponse; result?: RateLimitResult }> {
  const middleware = createRateLimitMiddleware(config)
  const response = await middleware(request)
  
  if (response) {
    // Rate limit was applied and request was blocked
    return { allowed: false, response }
  }
  
  // Rate limit passed
  return { allowed: true }
}

/**
 * Check if request should be rate limited
 */
export function shouldRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimit(request, {
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    keyGenerator: config.keyGenerator
  })
}

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimit(request, {
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    keyGenerator: config.keyGenerator
  })
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Create dynamic rate limit config based on user role
 */
export function createDynamicRateLimitConfig(
  userRole: string,
  baseConfig: RateLimitConfig
): RateLimitConfig {
  const roleMultipliers = {
    'system_admin': 10,
    'org_admin': 5,
    'user': 1
  }
  
  const multiplier = roleMultipliers[userRole as keyof typeof roleMultipliers] || 1
  
  return {
    ...baseConfig,
    maxRequests: baseConfig.maxRequests * multiplier,
    keyGenerator: userBasedRateLimitKeyGenerator
  }
}

/**
 * Create burst rate limit config
 */
export function createBurstRateLimitConfig(
  burstLimit: number,
  windowMs: number = 60 * 1000 // 1 minute
): RateLimitConfig {
  return {
    windowMs,
    maxRequests: burstLimit,
    message: `Burst rate limit exceeded. Maximum ${burstLimit} requests per minute.`,
    standardHeaders: true,
    legacyHeaders: true
  }
}

/**
 * Create sustained rate limit config
 */
export function createSustainedRateLimitConfig(
  sustainedLimit: number,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): RateLimitConfig {
  return {
    windowMs,
    maxRequests: sustainedLimit,
    message: `Sustained rate limit exceeded. Maximum ${sustainedLimit} requests per hour.`,
    standardHeaders: true,
    legacyHeaders: true
  }
}

/**
 * Create tiered rate limit config
 */
export function createTieredRateLimitConfig(
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
): RateLimitConfig {
  const tierLimits = {
    free: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 per 15 minutes
    basic: { requests: 500, windowMs: 15 * 60 * 1000 }, // 500 per 15 minutes
    premium: { requests: 2000, windowMs: 15 * 60 * 1000 }, // 2000 per 15 minutes
    enterprise: { requests: 10000, windowMs: 15 * 60 * 1000 } // 10000 per 15 minutes
  }
  
  const limit = tierLimits[tier]
  
  return {
    windowMs: limit.windowMs,
    maxRequests: limit.requests,
    message: `Rate limit exceeded for ${tier} tier.`,
    standardHeaders: true,
    legacyHeaders: true
  }
}

/**
 * Create organization-based rate limit
 */
export function createOrganizationRateLimit(
  organizationId: string,
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
): RateLimitConfig {
  const config = createTieredRateLimitConfig(tier)
  
  return {
    ...config,
    keyGenerator: (request: NextRequest) => `org:${organizationId}`,
    message: `Organization rate limit exceeded. Please contact support to upgrade your plan.`
  }
}

/**
 * Create user-based rate limit
 */
export function createUserRateLimit(
  userId: string,
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
): RateLimitConfig {
  const config = createTieredRateLimitConfig(tier)
  
  return {
    ...config,
    keyGenerator: (request: NextRequest) => `user:${userId}`,
    message: `User rate limit exceeded. Please try again later or contact support.`
  }
}

/**
 * Create API endpoint-specific rate limit
 */
export function createEndpointRateLimit(
  endpoint: string,
  requestsPerMinute: number
): RateLimitConfig {
  return {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: requestsPerMinute,
    keyGenerator: (request: NextRequest) => `endpoint:${endpoint}:${getClientIP(request)}`,
    message: `Rate limit exceeded for ${endpoint}. Maximum ${requestsPerMinute} requests per minute.`,
    standardHeaders: true,
    legacyHeaders: true
  }
}

/**
 * Create global rate limit
 */
export function createGlobalRateLimit(
  requestsPerHour: number
): RateLimitConfig {
  return {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: requestsPerHour,
    keyGenerator: (request: NextRequest) => `global:${getClientIP(request)}`,
    message: `Global rate limit exceeded. Maximum ${requestsPerHour} requests per hour.`,
    standardHeaders: true,
    legacyHeaders: true
  }
}

/**
 * Create IP-based rate limit
 */
export function createIPRateLimit(
  requestsPerMinute: number,
  windowMs: number = 60 * 1000
): RateLimitConfig {
  return {
    windowMs,
    maxRequests: requestsPerMinute,
    keyGenerator: (request: NextRequest) => `ip:${getClientIP(request)}`,
    message: `IP rate limit exceeded. Maximum ${requestsPerMinute} requests per ${windowMs / 1000 / 60} minute(s).`,
    standardHeaders: true,
    legacyHeaders: true
  }
}

/**
 * Create API key-based rate limit
 */
export function createAPIKeyRateLimit(
  apiKey: string,
  requestsPerMinute: number
): RateLimitConfig {
  return {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: requestsPerMinute,
    keyGenerator: (request: NextRequest) => `apikey:${apiKey}`,
    message: `API key rate limit exceeded. Maximum ${requestsPerMinute} requests per minute.`,
    standardHeaders: true,
    legacyHeaders: true
  }
}

// =====================================================
// RATE LIMITING MIDDLEWARE FACTORY
// =====================================================

/**
 * Create middleware that applies multiple rate limits
 */
export function createMultiRateLimitMiddleware(configs: RateLimitConfig[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    for (const config of configs) {
      const middleware = createRateLimitMiddleware(config)
      const response = await middleware(request)
      
      if (response) {
        return response
      }
    }
    
    return null
  }
}

/**
 * Create conditional rate limiting middleware
 */
export function createConditionalRateLimitMiddleware(
  condition: (request: NextRequest) => boolean,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    if (condition(request)) {
      return createRateLimitMiddleware(config)(request)
    }
    
    return null
  }
}

/**
 * Create rate limiting middleware that skips on certain conditions
 */
export function createSkipableRateLimitMiddleware(
  config: RateLimitConfig,
  skipCondition: (request: NextRequest) => boolean
) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    if (skipCondition(request)) {
      return null
    }
    
    return createRateLimitMiddleware(config)(request)
  }
}
