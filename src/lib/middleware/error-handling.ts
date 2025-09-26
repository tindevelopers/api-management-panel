// =====================================================
// Error Handling Middleware
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { logger, logSecurityEvent } from '@/lib/utils/logging'
import { 
  createErrorResponse, 
  createNotFoundResponse, 
  createUnauthorizedResponse, 
  createForbiddenResponse,
  createConflictResponse,
  createValidationErrorResponse,
  extractRequestContext,
  HttpStatus,
  ErrorCodes
} from '@/lib/utils/api'

// =====================================================
// TYPES
// =====================================================

export interface ErrorHandlingConfig {
  logErrors: boolean
  logStackTraces: boolean
  sanitizeErrors: boolean
  includeErrorDetails: boolean
  fallbackErrorPage?: string
  errorReportingEnabled: boolean
  customErrorHandlers: Record<string, (error: Error, request: NextRequest) => NextResponse>
}

export interface ErrorContext {
  requestId: string
  userId?: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
  pathname: string
  method: string
  timestamp: string
}

// =====================================================
// ERROR TYPES
// =====================================================

export class ApiError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
  }
}

export class ValidationError extends ApiError {
  public field?: string
  public errors?: Record<string, string[]>

  constructor(message: string, field?: string, errors?: Record<string, string[]>) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCodes.VALIDATION_ERROR)
    this.name = 'ValidationError'
    this.field = field
    this.errors = errors
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  public retryAfter?: number

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, ErrorCodes.RATE_LIMIT_EXCEEDED)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends ApiError {
  public service: string

  constructor(service: string, message: string = 'External service error') {
    super(message, HttpStatus.BAD_GATEWAY, ErrorCodes.EXTERNAL_SERVICE_ERROR)
    this.name = 'ExternalServiceError'
    this.service = service
  }
}

// =====================================================
// DEFAULT CONFIGURATIONS
// =====================================================

export const errorHandlingConfigs = {
  // Development error handling configuration
  development: {
    logErrors: true,
    logStackTraces: true,
    sanitizeErrors: false,
    includeErrorDetails: true,
    errorReportingEnabled: false,
    customErrorHandlers: {}
  },

  // Production error handling configuration
  production: {
    logErrors: true,
    logStackTraces: false,
    sanitizeErrors: true,
    includeErrorDetails: false,
    errorReportingEnabled: true,
    customErrorHandlers: {}
  },

  // Testing error handling configuration
  testing: {
    logErrors: false,
    logStackTraces: false,
    sanitizeErrors: true,
    includeErrorDetails: false,
    errorReportingEnabled: false,
    customErrorHandlers: {}
  }
}

// =====================================================
// ERROR HANDLING MIDDLEWARE
// =====================================================

/**
 * Create error handling middleware
 */
export function createErrorHandlingMiddleware(config: ErrorHandlingConfig) {
  return async (request: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> => {
    try {
      return await handler()
    } catch (error) {
      return await handleError(error, request, config)
    }
  }
}

/**
 * Create global error handler
 */
export function createGlobalErrorHandler(config: ErrorHandlingConfig) {
  return async (error: unknown, request: NextRequest): Promise<NextResponse> => {
    return await handleError(error, request, config)
  }
}

/**
 * Handle error with appropriate response
 */
async function handleError(
  error: unknown,
  request: NextRequest,
  config: ErrorHandlingConfig
): Promise<NextResponse> {
  const context = extractRequestContext(request)
  const errorContext: ErrorContext = {
    requestId: context.requestId,
    userId: context.userId,
    organizationId: context.organizationId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    pathname: request.nextUrl.pathname,
    method: request.method,
    timestamp: new Date().toISOString()
  }

  // Check for custom error handlers first
  if (error instanceof Error && error.constructor.name in config.customErrorHandlers) {
    return config.customErrorHandlers[error.constructor.name](error, request)
  }

  // Handle specific error types
  if (error instanceof ApiError) {
    return await handleApiError(error, request, config, errorContext)
  }

  if (error instanceof ValidationError) {
    return await handleValidationError(error, request, config, errorContext)
  }

  if (error instanceof AuthenticationError) {
    return await handleAuthenticationError(error, request, config, errorContext)
  }

  if (error instanceof AuthorizationError) {
    return await handleAuthorizationError(error, request, config, errorContext)
  }

  if (error instanceof NotFoundError) {
    return await handleNotFoundError(error, request, config, errorContext)
  }

  if (error instanceof ConflictError) {
    return await handleConflictError(error, request, config, errorContext)
  }

  if (error instanceof RateLimitError) {
    return await handleRateLimitError(error, request, config, errorContext)
  }

  if (error instanceof DatabaseError) {
    return await handleDatabaseError(error, request, config, errorContext)
  }

  if (error instanceof ExternalServiceError) {
    return await handleExternalServiceError(error, request, config, errorContext)
  }

  // Handle unknown errors
  return await handleUnknownError(error, request, config, errorContext)
}

// =====================================================
// SPECIFIC ERROR HANDLERS
// =====================================================

/**
 * Handle API errors
 */
async function handleApiError(
  error: ApiError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.error('API Error', {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: config.logStackTraces ? error.stack : undefined,
      context
    })
  }

  if (error.statusCode >= 500) {
    logSecurityEvent(
      'server_error',
      'high',
      context.userId,
      context.organizationId,
      context.ipAddress,
      { error: error.message, code: error.code, pathname: context.pathname }
    )
  }

  const message = config.sanitizeErrors && error.statusCode >= 500 
    ? 'An internal server error occurred'
    : error.message

  return createErrorResponse(message, error.code, error.statusCode)
}

/**
 * Handle validation errors
 */
async function handleValidationError(
  error: ValidationError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.warn('Validation Error', {
      error: error.message,
      field: error.field,
      errors: error.errors,
      context
    })
  }

  if (error.errors) {
    return createValidationErrorResponse(error.errors, error.message)
  }

  return createErrorResponse(error.message, error.code, error.statusCode)
}

/**
 * Handle authentication errors
 */
async function handleAuthenticationError(
  error: AuthenticationError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.warn('Authentication Error', {
      error: error.message,
      context
    })
  }

  logSecurityEvent(
    'authentication_failed',
    'medium',
    context.userId,
    context.organizationId,
    context.ipAddress,
    { pathname: context.pathname, method: context.method }
  )

  return createUnauthorizedResponse(error.message)
}

/**
 * Handle authorization errors
 */
async function handleAuthorizationError(
  error: AuthorizationError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.warn('Authorization Error', {
      error: error.message,
      context
    })
  }

  logSecurityEvent(
    'authorization_failed',
    'high',
    context.userId,
    context.organizationId,
    context.ipAddress,
    { pathname: context.pathname, method: context.method }
  )

  return createForbiddenResponse(error.message)
}

/**
 * Handle not found errors
 */
async function handleNotFoundError(
  error: NotFoundError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.info('Not Found Error', {
      error: error.message,
      context
    })
  }

  return createNotFoundResponse(error.message)
}

/**
 * Handle conflict errors
 */
async function handleConflictError(
  error: ConflictError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.warn('Conflict Error', {
      error: error.message,
      context
    })
  }

  return createConflictResponse(error.message)
}

/**
 * Handle rate limit errors
 */
async function handleRateLimitError(
  error: RateLimitError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.warn('Rate Limit Error', {
      error: error.message,
      retryAfter: error.retryAfter,
      context
    })
  }

  logSecurityEvent(
    'rate_limit_exceeded',
    'medium',
    context.userId,
    context.organizationId,
    context.ipAddress,
    { pathname: context.pathname, retryAfter: error.retryAfter }
  )

  const response = createErrorResponse(error.message, error.code, error.statusCode)
  
  if (error.retryAfter) {
    response.headers.set('Retry-After', error.retryAfter.toString())
  }

  return response
}

/**
 * Handle database errors
 */
async function handleDatabaseError(
  error: DatabaseError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.error('Database Error', {
      error: error.message,
      stack: config.logStackTraces ? error.stack : undefined,
      context
    })
  }

  logSecurityEvent(
    'database_error',
    'high',
    context.userId,
    context.organizationId,
    context.ipAddress,
    { error: error.message, pathname: context.pathname }
  )

  const message = config.sanitizeErrors 
    ? 'A database error occurred'
    : error.message

  return createErrorResponse(message, error.code, error.statusCode)
}

/**
 * Handle external service errors
 */
async function handleExternalServiceError(
  error: ExternalServiceError,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  if (config.logErrors) {
    logger.error('External Service Error', {
      service: error.service,
      error: error.message,
      stack: config.logStackTraces ? error.stack : undefined,
      context
    })
  }

  logSecurityEvent(
    'external_service_error',
    'medium',
    context.userId,
    context.organizationId,
    context.ipAddress,
    { service: error.service, error: error.message, pathname: context.pathname }
  )

  const message = config.sanitizeErrors 
    ? 'An external service error occurred'
    : `${error.service}: ${error.message}`

  return createErrorResponse(message, error.code, error.statusCode)
}

/**
 * Handle unknown errors
 */
async function handleUnknownError(
  error: unknown,
  request: NextRequest,
  config: ErrorHandlingConfig,
  context: ErrorContext
): Promise<NextResponse> {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  const errorStack = error instanceof Error ? error.stack : undefined

  if (config.logErrors) {
    logger.error('Unknown Error', {
      error: errorMessage,
      stack: config.logStackTraces ? errorStack : undefined,
      context,
      rawError: config.includeErrorDetails ? error : undefined
    })
  }

  logSecurityEvent(
    'unknown_error',
    'critical',
    context.userId,
    context.organizationId,
    context.ipAddress,
    { error: errorMessage, pathname: context.pathname }
  )

  const message = config.sanitizeErrors 
    ? 'An unexpected error occurred'
    : errorMessage

  return createErrorResponse(message, ErrorCodes.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR)
}

// =====================================================
// ERROR MIDDLEWARE FACTORIES
// =====================================================

/**
 * Create error handling middleware for API routes
 */
export function createApiErrorMiddleware(config: Partial<ErrorHandlingConfig> = {}) {
  const fullConfig = { ...errorHandlingConfigs.production, ...config }
  
  return async (request: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> => {
    try {
      return await handler()
    } catch (error) {
      return await handleError(error, request, fullConfig)
    }
  }
}

/**
 * Create error handling middleware for page routes
 */
export function createPageErrorMiddleware(config: Partial<ErrorHandlingConfig> = {}) {
  const fullConfig = { ...errorHandlingConfigs.production, ...config }
  
  return async (request: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> => {
    try {
      return await handler()
    } catch (error) {
      // For page routes, we might want to redirect to an error page
      if (fullConfig.fallbackErrorPage) {
        return NextResponse.redirect(new URL(fullConfig.fallbackErrorPage, request.url))
      }
      
      return await handleError(error, request, fullConfig)
    }
  }
}

/**
 * Create error handling middleware with custom handlers
 */
export function createCustomErrorMiddleware(
  customHandlers: Record<string, (error: Error, request: NextRequest) => NextResponse>,
  config: Partial<ErrorHandlingConfig> = {}
) {
  const fullConfig = { ...errorHandlingConfigs.production, ...config, customErrorHandlers: customHandlers }
  
  return async (request: NextRequest, handler: () => Promise<NextResponse>): Promise<NextResponse> => {
    try {
      return await handler()
    } catch (error) {
      return await handleError(error, request, fullConfig)
    }
  }
}

// =====================================================
// ERROR REPORTING
// =====================================================

/**
 * Report error to external service (placeholder)
 */
export async function reportError(
  error: Error,
  context: ErrorContext,
  config: ErrorHandlingConfig
): Promise<void> {
  if (!config.errorReportingEnabled) {
    return
  }

  try {
    // In a real implementation, this would send the error to a service like Sentry, Bugsnag, etc.
    console.log('Error reported to external service:', {
      error: error.message,
      stack: error.stack,
      context
    })
  } catch (reportingError) {
    logger.error('Failed to report error', {
      originalError: error.message,
      reportingError: reportingError instanceof Error ? reportingError.message : 'Unknown error'
    })
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if error is operational (expected) or programming (unexpected)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof ApiError) {
    return error.isOperational
  }
  
  // Programming errors (unexpected)
  if (error instanceof TypeError || error instanceof ReferenceError || error instanceof SyntaxError) {
    return false
  }
  
  // Operational errors (expected)
  return true
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) {
      return 'critical'
    } else if (error.statusCode >= 400) {
      return 'high'
    } else {
      return 'medium'
    }
  }
  
  if (error instanceof TypeError || error instanceof ReferenceError || error instanceof SyntaxError) {
    return 'critical'
  }
  
  return 'medium'
}

/**
 * Create error from HTTP status code
 */
export function createErrorFromStatusCode(statusCode: number, message?: string): ApiError {
  switch (statusCode) {
    case 400:
      return new ApiError(message || 'Bad Request', statusCode, ErrorCodes.INVALID_INPUT)
    case 401:
      return new AuthenticationError(message)
    case 403:
      return new AuthorizationError(message)
    case 404:
      return new NotFoundError(message)
    case 409:
      return new ConflictError(message)
    case 422:
      return new ValidationError(message || 'Validation failed')
    case 429:
      return new RateLimitError(message)
    case 500:
      return new ApiError(message || 'Internal Server Error', statusCode, ErrorCodes.INTERNAL_ERROR)
    case 502:
      return new ExternalServiceError('external', message || 'Bad Gateway')
    case 503:
      return new ApiError(message || 'Service Unavailable', statusCode, ErrorCodes.SERVICE_UNAVAILABLE)
    default:
      return new ApiError(message || 'Unknown Error', statusCode)
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: Error, ...args: T) => R
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (errorHandler) {
        return errorHandler(error as Error, ...args)
      }
      throw error
    }
  }
}

/**
 * Create error boundary for React components (placeholder for future use)
 */
export function createErrorBoundary() {
  // This would be implemented for React error boundaries
  return {
    componentDidCatch: (error: Error, errorInfo: any) => {
      logger.error('React Error Boundary caught error', {
        error: error.message,
        stack: error.stack,
        errorInfo
      })
    }
  }
}

// =====================================================
// CONFIGURATION BUILDERS
// =====================================================

/**
 * Build error handling configuration from environment variables
 */
export function buildErrorHandlingConfigFromEnv(): ErrorHandlingConfig {
  return {
    logErrors: process.env.LOG_ERRORS !== 'false',
    logStackTraces: process.env.LOG_STACK_TRACES === 'true',
    sanitizeErrors: process.env.SANITIZE_ERRORS !== 'false',
    includeErrorDetails: process.env.INCLUDE_ERROR_DETAILS === 'true',
    fallbackErrorPage: process.env.FALLBACK_ERROR_PAGE,
    errorReportingEnabled: process.env.ERROR_REPORTING_ENABLED === 'true',
    customErrorHandlers: {}
  }
}

/**
 * Build error handling configuration for specific environment
 */
export function buildErrorHandlingConfigForEnvironment(env: 'development' | 'staging' | 'production'): ErrorHandlingConfig {
  switch (env) {
    case 'development':
      return errorHandlingConfigs.development
    case 'staging':
      return {
        ...errorHandlingConfigs.production,
        logStackTraces: true,
        includeErrorDetails: true
      }
    case 'production':
      return errorHandlingConfigs.production
    default:
      return errorHandlingConfigs.development
  }
}
