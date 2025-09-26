// =====================================================
// Logging Middleware
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { logger, auditLogger, performanceLogger, LogLevel, LogCategory } from '@/lib/utils/logging'
import { extractRequestContext, createTimer } from '@/lib/utils'

// =====================================================
// TYPES
// =====================================================

export interface LoggingConfig {
  logRequests: boolean
  logResponses: boolean
  logErrors: boolean
  logPerformance: boolean
  logAudit: boolean
  includeHeaders: boolean
  includeBody: boolean
  maxBodySize: number
  sensitiveHeaders: string[]
  sensitiveBodyFields: string[]
  excludePaths: string[]
  excludeMethods: string[]
  logLevel: LogLevel
}

export interface RequestLogEntry {
  id: string
  method: string
  url: string
  pathname: string
  query: Record<string, string>
  headers: Record<string, string>
  body?: any
  timestamp: string
  userId?: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
  requestId: string
}

export interface ResponseLogEntry {
  requestId: string
  statusCode: number
  headers: Record<string, string>
  body?: any
  duration: number
  timestamp: string
  userId?: string
  organizationId?: string
  error?: string
}

// =====================================================
// DEFAULT CONFIGURATIONS
// =====================================================

export const loggingConfigs = {
  // Development logging configuration
  development: {
    logRequests: true,
    logResponses: true,
    logErrors: true,
    logPerformance: true,
    logAudit: true,
    includeHeaders: true,
    includeBody: true,
    maxBodySize: 1024 * 10, // 10KB
    sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'],
    sensitiveBodyFields: ['password', 'token', 'secret', 'key'],
    excludePaths: ['/_next', '/favicon.ico', '/api/health'],
    excludeMethods: [],
    logLevel: LogLevel.DEBUG
  },

  // Production logging configuration
  production: {
    logRequests: true,
    logResponses: false,
    logErrors: true,
    logPerformance: true,
    logAudit: true,
    includeHeaders: false,
    includeBody: false,
    maxBodySize: 1024 * 5, // 5KB
    sensitiveHeaders: ['authorization', 'cookie', 'x-api-key', 'x-user-id'],
    sensitiveBodyFields: ['password', 'token', 'secret', 'key', 'ssn', 'credit_card'],
    excludePaths: ['/_next', '/favicon.ico', '/api/health', '/api/metrics'],
    excludeMethods: ['OPTIONS'],
    logLevel: LogLevel.INFO
  },

  // Minimal logging configuration
  minimal: {
    logRequests: false,
    logResponses: false,
    logErrors: true,
    logPerformance: false,
    logAudit: true,
    includeHeaders: false,
    includeBody: false,
    maxBodySize: 0,
    sensitiveHeaders: [],
    sensitiveBodyFields: [],
    excludePaths: ['/_next', '/favicon.ico', '/api/health', '/api/metrics', '/api/logs'],
    excludeMethods: ['OPTIONS', 'GET'],
    logLevel: LogLevel.WARN
  },

  // Debug logging configuration
  debug: {
    logRequests: true,
    logResponses: true,
    logErrors: true,
    logPerformance: true,
    logAudit: true,
    includeHeaders: true,
    includeBody: true,
    maxBodySize: 1024 * 50, // 50KB
    sensitiveHeaders: [],
    sensitiveBodyFields: [],
    excludePaths: [],
    excludeMethods: [],
    logLevel: LogLevel.DEBUG
  }
}

// =====================================================
// LOGGING MIDDLEWARE FUNCTIONS
// =====================================================

/**
 * Create logging middleware
 */
export function createLoggingMiddleware(config: LoggingConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const startTime = Date.now()
    const context = extractRequestContext(request)
    
    // Check if we should log this request
    if (!shouldLogRequest(request, config)) {
      return null
    }

    // Start performance tracking
    const performanceId = config.logPerformance 
      ? performanceLogger.start(`${request.method} ${request.nextUrl.pathname}`, {
          userId: context.userId,
          organizationId: context.organizationId,
          ipAddress: context.ipAddress
        })
      : null

    try {
      // Log request
      if (config.logRequests) {
        await logRequest(request, config, context)
      }

      // Continue with request processing
      const response = NextResponse.next()
      
      // Log response
      if (config.logResponses) {
        const duration = Date.now() - startTime
        await logResponse(response, request, config, context, duration)
      }

      // End performance tracking
      if (performanceId) {
        performanceLogger.end(performanceId)
      }

      return response
    } catch (error) {
      // Log error
      if (config.logErrors) {
        await logError(error, request, config, context)
      }

      // End performance tracking
      if (performanceId) {
        performanceLogger.end(performanceId)
      }

      throw error
    }
  }
}

/**
 * Create request logging middleware
 */
export function createRequestLoggingMiddleware(config: Partial<LoggingConfig> = {}) {
  const fullConfig = { ...loggingConfigs.production, ...config }
  
  return async (request: NextRequest): Promise<NextResponse | null> => {
    if (!shouldLogRequest(request, fullConfig)) {
      return null
    }

    const context = extractRequestContext(request)
    await logRequest(request, fullConfig, context)
    
    return null
  }
}

/**
 * Create response logging middleware
 */
export function createResponseLoggingMiddleware(config: Partial<LoggingConfig> = {}) {
  const fullConfig = { ...loggingConfigs.production, ...config }
  
  return async (response: NextResponse, request: NextRequest, duration: number): Promise<void> => {
    if (!shouldLogRequest(request, fullConfig)) {
      return
    }

    const context = extractRequestContext(request)
    await logResponse(response, request, fullConfig, context, duration)
  }
}

/**
 * Create error logging middleware
 */
export function createErrorLoggingMiddleware(config: Partial<LoggingConfig> = {}) {
  const fullConfig = { ...loggingConfigs.production, ...config }
  
  return async (error: Error, request: NextRequest): Promise<void> => {
    const context = extractRequestContext(request)
    await logError(error, request, fullConfig, context)
  }
}

/**
 * Create audit logging middleware
 */
export function createAuditLoggingMiddleware(config: Partial<LoggingConfig> = {}) {
  const fullConfig = { ...loggingConfigs.production, ...config }
  
  return async (request: NextRequest, response: NextResponse, action?: string): Promise<void> => {
    if (!fullConfig.logAudit || !shouldLogRequest(request, fullConfig)) {
      return
    }

    const context = extractRequestContext(request)
    await logAuditEvent(request, response, fullConfig, context, action)
  }
}

// =====================================================
// LOGGING FUNCTIONS
// =====================================================

/**
 * Check if request should be logged
 */
function shouldLogRequest(request: NextRequest, config: LoggingConfig): boolean {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Check excluded paths
  if (config.excludePaths.some(path => pathname.startsWith(path))) {
    return false
  }

  // Check excluded methods
  if (config.excludeMethods.includes(method)) {
    return false
  }

  return true
}

/**
 * Log request details
 */
async function logRequest(
  request: NextRequest,
  config: LoggingConfig,
  context: any
): Promise<void> {
  try {
    const requestData: RequestLogEntry = {
      id: context.requestId,
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
      query: Object.fromEntries(request.nextUrl.searchParams),
      headers: config.includeHeaders ? sanitizeHeaders(request.headers, config) : {},
      body: await getRequestBody(request, config),
      timestamp: new Date().toISOString(),
      userId: context.userId,
      organizationId: context.organizationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requestId: context.requestId
    }

    logger.info('Request received', requestData, LogCategory.API)
  } catch (error) {
    logger.error('Failed to log request', { error: error instanceof Error ? error.message : 'Unknown error' }, LogCategory.API)
  }
}

/**
 * Log response details
 */
async function logResponse(
  response: NextResponse,
  request: NextRequest,
  config: LoggingConfig,
  context: any,
  duration: number
): Promise<void> {
  try {
    const responseData: ResponseLogEntry = {
      requestId: context.requestId,
      statusCode: response.status,
      headers: config.includeHeaders ? sanitizeHeaders(response.headers, config) : {},
      body: await getResponseBody(response, config),
      duration,
      timestamp: new Date().toISOString(),
      userId: context.userId,
      organizationId: context.organizationId
    }

    const logLevel = response.status >= 400 ? LogLevel.WARN : LogLevel.INFO
    logger.log(logLevel, 'Response sent', responseData, LogCategory.API)
  } catch (error) {
    logger.error('Failed to log response', { error: error instanceof Error ? error.message : 'Unknown error' }, LogCategory.API)
  }
}

/**
 * Log error details
 */
async function logError(
  error: Error,
  request: NextRequest,
  config: LoggingConfig,
  context: any
): Promise<void> {
  try {
    const errorData = {
      requestId: context.requestId,
      method: request.method,
      pathname: request.nextUrl.pathname,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: context.userId,
      organizationId: context.organizationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }

    logger.error('Request error', errorData, LogCategory.API)
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }
}

/**
 * Log audit event
 */
async function logAuditEvent(
  request: NextRequest,
  response: NextResponse,
  config: LoggingConfig,
  context: any,
  action?: string
): Promise<void> {
  try {
    if (!context.userId) {
      return // Skip audit logging for unauthenticated requests
    }

    const auditAction = action || `${request.method} ${request.nextUrl.pathname}`
    const resourceType = getResourceType(request.nextUrl.pathname)
    const resourceId = getResourceId(request.nextUrl.pathname)

    auditLogger.log(
      auditAction,
      resourceType,
      resourceId,
      context.userId,
      {
        organizationId: context.organizationId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: {
          statusCode: response.status,
          method: request.method,
          pathname: request.nextUrl.pathname
        },
        requestId: context.requestId
      }
    )
  } catch (error) {
    logger.error('Failed to log audit event', { error: error instanceof Error ? error.message : 'Unknown error' }, LogCategory.AUDIT)
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Sanitize headers by removing sensitive information
 */
function sanitizeHeaders(headers: Headers, config: LoggingConfig): Record<string, string> {
  const sanitized: Record<string, string> = {}
  
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    
    if (config.sensitiveHeaders.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))) {
      sanitized[key] = '***REDACTED***'
    } else {
      sanitized[key] = value
    }
  })
  
  return sanitized
}

/**
 * Get request body with size and sensitivity checks
 */
async function getRequestBody(request: NextRequest, config: LoggingConfig): Promise<any> {
  if (!config.includeBody || config.maxBodySize === 0) {
    return undefined
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    
    // Skip body logging for certain content types
    if (contentType.includes('multipart/form-data') || contentType.includes('application/octet-stream')) {
      return '[BINARY DATA]'
    }

    const body = await request.text()
    
    if (body.length > config.maxBodySize) {
      return `[BODY TOO LARGE: ${body.length} bytes]`
    }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(body)
      return sanitizeBody(parsed, config)
    } catch {
      // Return as string if not JSON
      return sanitizeString(body, config)
    }
  } catch (error) {
    return '[ERROR READING BODY]'
  }
}

/**
 * Get response body with size and sensitivity checks
 */
async function getResponseBody(response: NextResponse, config: LoggingConfig): Promise<any> {
  if (!config.includeBody || config.maxBodySize === 0) {
    return undefined
  }

  try {
    // Clone response to read body without consuming it
    const clonedResponse = response.clone()
    const body = await clonedResponse.text()
    
    if (body.length > config.maxBodySize) {
      return `[BODY TOO LARGE: ${body.length} bytes]`
    }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(body)
      return sanitizeBody(parsed, config)
    } catch {
      // Return as string if not JSON
      return sanitizeString(body, config)
    }
  } catch (error) {
    return '[ERROR READING BODY]'
  }
}

/**
 * Sanitize body data by removing sensitive fields
 */
function sanitizeBody(body: any, config: LoggingConfig): any {
  if (typeof body !== 'object' || body === null) {
    return sanitizeString(String(body), config)
  }

  if (Array.isArray(body)) {
    return body.map(item => sanitizeBody(item, config))
  }

  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(body)) {
    if (config.sensitiveBodyFields.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = '***REDACTED***'
    } else {
      sanitized[key] = sanitizeBody(value, config)
    }
  }
  
  return sanitized
}

/**
 * Sanitize string data by removing sensitive patterns
 */
function sanitizeString(str: string, config: LoggingConfig): string {
  let sanitized = str
  
  // Remove sensitive patterns
  config.sensitiveBodyFields.forEach(field => {
    const pattern = new RegExp(`"${field}"\\s*:\\s*"[^"]*"`, 'gi')
    sanitized = sanitized.replace(pattern, `"${field}":"***REDACTED***"`)
  })
  
  return sanitized
}

/**
 * Get resource type from pathname
 */
function getResourceType(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return 'root'
  }
  
  // Map common API patterns to resource types
  const resourceMap: Record<string, string> = {
    'api': 'api',
    'admin': 'admin',
    'org': 'organization',
    'users': 'user',
    'organizations': 'organization',
    'apis': 'api',
    'invitations': 'invitation',
    'roles': 'role',
    'permissions': 'permission'
  }
  
  return resourceMap[segments[0]] || segments[0]
}

/**
 * Get resource ID from pathname
 */
function getResourceId(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  
  // Try to find UUID-like segments
  for (const segment of segments) {
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return segment
    }
  }
  
  // Return last segment if no UUID found
  return segments[segments.length - 1] || pathname
}

// =====================================================
// MIDDLEWARE COMPOSERS
// =====================================================

/**
 * Compose multiple logging middlewares
 */
export function composeLoggingMiddlewares(
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
 * Create conditional logging middleware
 */
export function createConditionalLoggingMiddleware(
  condition: (request: NextRequest) => boolean,
  loggingMiddleware: (request: NextRequest) => Promise<NextResponse | null>
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    if (condition(request)) {
      return loggingMiddleware(request)
    }
    return null
  }
}

/**
 * Create path-based logging middleware
 */
export function createPathBasedLoggingMiddleware(
  pathConfigs: Record<string, LoggingConfig>
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const pathname = request.nextUrl.pathname
    
    for (const [path, config] of Object.entries(pathConfigs)) {
      if (pathname.startsWith(path)) {
        return createLoggingMiddleware(config)(request)
      }
    }
    
    return null
  }
}

/**
 * Create method-based logging middleware
 */
export function createMethodBasedLoggingMiddleware(
  methodConfigs: Record<string, LoggingConfig>
): (request: NextRequest) => Promise<NextResponse | null> {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const method = request.method
    
    if (methodConfigs[method]) {
      return createLoggingMiddleware(methodConfigs[method])(request)
    }
    
    return null
  }
}

// =====================================================
// CONFIGURATION BUILDERS
// =====================================================

/**
 * Build logging configuration from environment variables
 */
export function buildLoggingConfigFromEnv(): LoggingConfig {
  return {
    logRequests: process.env.LOG_REQUESTS === 'true',
    logResponses: process.env.LOG_RESPONSES === 'true',
    logErrors: process.env.LOG_ERRORS !== 'false',
    logPerformance: process.env.LOG_PERFORMANCE === 'true',
    logAudit: process.env.LOG_AUDIT !== 'false',
    includeHeaders: process.env.LOG_INCLUDE_HEADERS === 'true',
    includeBody: process.env.LOG_INCLUDE_BODY === 'true',
    maxBodySize: parseInt(process.env.LOG_MAX_BODY_SIZE || '10240'),
    sensitiveHeaders: process.env.LOG_SENSITIVE_HEADERS?.split(',') || ['authorization', 'cookie'],
    sensitiveBodyFields: process.env.LOG_SENSITIVE_BODY_FIELDS?.split(',') || ['password', 'token'],
    excludePaths: process.env.LOG_EXCLUDE_PATHS?.split(',') || ['/_next', '/favicon.ico'],
    excludeMethods: process.env.LOG_EXCLUDE_METHODS?.split(',') || ['OPTIONS'],
    logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO
  }
}

/**
 * Build logging configuration for specific environment
 */
export function buildLoggingConfigForEnvironment(env: 'development' | 'staging' | 'production'): LoggingConfig {
  switch (env) {
    case 'development':
      return loggingConfigs.development
    case 'staging':
      return {
        ...loggingConfigs.production,
        logResponses: true,
        includeHeaders: true,
        logLevel: LogLevel.DEBUG
      }
    case 'production':
      return loggingConfigs.production
    default:
      return loggingConfigs.default
  }
}
