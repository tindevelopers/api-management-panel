// =====================================================
// Logging Utilities
// =====================================================

// =====================================================
// TYPES
// =====================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  AUDIT = 'audit',
  SYSTEM = 'system',
  USER = 'user',
  ORGANIZATION = 'organization'
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: any
  userId?: string
  organizationId?: string
  requestId?: string
  ipAddress?: string
  userAgent?: string
  stack?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableDatabase: boolean
  filePath?: string
  maxFileSize?: number
  maxFiles?: number
  format?: 'json' | 'text'
  includeStackTrace?: boolean
  sanitizeData?: boolean
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  resource: string
  resourceId: string
  userId: string
  organizationId?: string
  ipAddress?: string
  userAgent?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
  requestId?: string
}

// =====================================================
// LOGGER CLASS
// =====================================================

class Logger {
  private config: LoggerConfig
  private logs: LogEntry[] = []

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableDatabase: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      format: 'json',
      includeStackTrace: true,
      sanitizeData: true,
      ...config
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.DEBUG, message, data, category)
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.INFO, message, data, category)
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.WARN, message, data, category)
  }

  /**
   * Log error message
   */
  error(message: string, data?: any, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.ERROR, message, data, category)
  }

  /**
   * Log fatal message
   */
  fatal(message: string, data?: any, category: LogCategory = LogCategory.SYSTEM): void {
    this.log(LogLevel.FATAL, message, data, category)
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, category: LogCategory = LogCategory.SYSTEM): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: this.config.sanitizeData ? this.sanitize(data) : data,
      ...this.extractContext()
    }

    // Add stack trace for errors
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      entry.stack = this.getStackTrace()
    }

    // Store in memory
    this.logs.push(entry)

    // Output to configured destinations
    if (this.config.enableConsole) {
      this.logToConsole(entry)
    }

    if (this.config.enableFile) {
      this.logToFile(entry)
    }

    if (this.config.enableDatabase) {
      this.logToDatabase(entry)
    }
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
    const currentLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)
    
    return messageLevelIndex >= currentLevelIndex
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Extract context from current request/environment
   */
  private extractContext(): Partial<LogEntry> {
    // In a real implementation, this would extract context from the current request
    // For now, we'll return empty context
    return {}
  }

  /**
   * Get stack trace
   */
  private getStackTrace(): string {
    const stack = new Error().stack
    return stack ? stack.split('\n').slice(3).join('\n') : ''
  }

  /**
   * Sanitize sensitive data
   */
  private sanitize(data: any): any {
    if (!data) return data

    if (typeof data === 'string') {
      return this.sanitizeString(data)
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item))
    }

    if (typeof data === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = '***REDACTED***'
        } else {
          sanitized[key] = this.sanitize(value)
        }
      }
      return sanitized
    }

    return data
  }

  /**
   * Check if field contains sensitive data
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'token', 'key', 'secret', 'ssn', 'credit_card',
      'api_key', 'auth_token', 'refresh_token', 'private_key',
      'client_secret', 'access_token', 'session_id'
    ]
    
    const lowerFieldName = fieldName.toLowerCase()
    return sensitiveFields.some(field => lowerFieldName.includes(field))
  }

  /**
   * Sanitize string data
   */
  private sanitizeString(str: string): string {
    // Remove potential sensitive patterns
    return str
      .replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password="***REDACTED***"')
      .replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token="***REDACTED***"')
      .replace(/key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'key="***REDACTED***"')
      .replace(/secret["\s]*[:=]["\s]*[^"\s,}]+/gi, 'secret="***REDACTED***"')
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`
    
    if (this.config.format === 'json') {
      console.log(prefix, JSON.stringify(entry, null, 2))
    } else {
      console.log(`${prefix} ${entry.message}`, entry.data || '')
    }
  }

  /**
   * Log to file (placeholder - would need file system access)
   */
  private logToFile(entry: LogEntry): void {
    // In a real implementation, this would write to a log file
    // For now, we'll just store in memory
    console.log('Would log to file:', entry)
  }

  /**
   * Log to database (placeholder)
   */
  private logToDatabase(entry: LogEntry): void {
    // In a real implementation, this would save to database
    console.log('Would log to database:', entry)
  }

  /**
   * Get recent logs
   */
  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit)
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-limit)
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: LogCategory, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(-limit)
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// =====================================================
// GLOBAL LOGGER INSTANCE
// =====================================================

export const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  enableDatabase: false,
  sanitizeData: true
})

// =====================================================
// AUDIT LOGGER
// =====================================================

class AuditLogger {
  private auditLogs: AuditLogEntry[] = []

  /**
   * Log audit entry
   */
  log(
    action: string,
    resource: string,
    resourceId: string,
    userId: string,
    options: {
      organizationId?: string
      ipAddress?: string
      userAgent?: string
      oldValues?: Record<string, any>
      newValues?: Record<string, any>
      metadata?: Record<string, any>
      requestId?: string
    } = {}
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      action,
      resource,
      resourceId,
      userId,
      ...options
    }

    this.auditLogs.push(entry)
    
    // Also log to main logger
    logger.info(`Audit: ${action} on ${resource}`, entry, LogCategory.AUDIT)
  }

  /**
   * Generate audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100): AuditLogEntry[] {
    return this.auditLogs.slice(-limit)
  }

  /**
   * Get audit logs by user
   */
  getAuditLogsByUser(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(-limit)
  }

  /**
   * Get audit logs by organization
   */
  getAuditLogsByOrganization(organizationId: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.organizationId === organizationId)
      .slice(-limit)
  }

  /**
   * Get audit logs by action
   */
  getAuditLogsByAction(action: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.action === action)
      .slice(-limit)
  }

  /**
   * Clear audit logs
   */
  clearAuditLogs(): void {
    this.auditLogs = []
  }
}

export const auditLogger = new AuditLogger()

// =====================================================
// PERFORMANCE LOGGER
// =====================================================

class PerformanceLogger {
  private performanceLogs: Array<{
    id: string
    operation: string
    startTime: number
    endTime?: number
    duration?: number
    metadata?: Record<string, any>
  }> = []

  /**
   * Start performance tracking
   */
  start(operation: string, metadata?: Record<string, any>): string {
    const id = this.generatePerformanceId()
    const startTime = Date.now()
    
    this.performanceLogs.push({
      id,
      operation,
      startTime,
      metadata
    })
    
    return id
  }

  /**
   * End performance tracking
   */
  end(id: string): number | null {
    const log = this.performanceLogs.find(l => l.id === id)
    if (!log) {
      logger.warn('Performance log not found', { id }, LogCategory.PERFORMANCE)
      return null
    }
    
    const endTime = Date.now()
    const duration = endTime - log.startTime
    
    log.endTime = endTime
    log.duration = duration
    
    logger.info(`Performance: ${log.operation}`, {
      operation: log.operation,
      duration,
      metadata: log.metadata
    }, LogCategory.PERFORMANCE)
    
    return duration
  }

  /**
   * Generate performance ID
   */
  private generatePerformanceId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get performance logs
   */
  getPerformanceLogs(limit: number = 100): any[] {
    return this.performanceLogs.slice(-limit)
  }

  /**
   * Get slow operations
   */
  getSlowOperations(thresholdMs: number = 1000): any[] {
    return this.performanceLogs.filter(log => 
      log.duration && log.duration > thresholdMs
    )
  }
}

export const performanceLogger = new PerformanceLogger()

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Create a performance timer
 */
export function createTimer(operation: string, metadata?: Record<string, any>): {
  end: () => number | null
  id: string
} {
  const id = performanceLogger.start(operation, metadata)
  
  return {
    end: () => performanceLogger.end(id),
    id
  }
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  organizationId?: string,
  requestId?: string
): void {
  logger.info('API Request', {
    method,
    path,
    statusCode,
    duration,
    userId,
    organizationId,
    requestId
  }, LogCategory.API)
}

/**
 * Log API error
 */
export function logApiError(
  method: string,
  path: string,
  error: Error,
  statusCode: number,
  userId?: string,
  organizationId?: string,
  requestId?: string
): void {
  logger.error('API Error', {
    method,
    path,
    error: error.message,
    stack: error.stack,
    statusCode,
    userId,
    organizationId,
    requestId
  }, LogCategory.API)
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): void {
  if (success) {
    logger.info(`Auth: ${event}`, {
      event,
      userId,
      success,
      ipAddress,
      userAgent,
      metadata
    }, LogCategory.AUTH)
  } else {
    logger.warn(`Auth: ${event}`, {
      event,
      userId,
      success,
      ipAddress,
      userAgent,
      metadata
    }, LogCategory.AUTH)
  }
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  userId?: string,
  organizationId?: string,
  ipAddress?: string,
  metadata?: Record<string, any>
): void {
  if (severity === 'critical') {
    logger.error(`Security: ${event}`, {
      event,
      severity,
      userId,
      organizationId,
      ipAddress,
      metadata
    }, LogCategory.SECURITY)
  } else if (severity === 'high') {
    logger.error(`Security: ${event}`, {
      event,
      severity,
      userId,
      organizationId,
      ipAddress,
      metadata
    }, LogCategory.SECURITY)
  } else if (severity === 'medium') {
    logger.warn(`Security: ${event}`, {
      event,
      severity,
      userId,
      organizationId,
      ipAddress,
      metadata
    }, LogCategory.SECURITY)
  } else {
    logger.info(`Security: ${event}`, {
      event,
      severity,
      userId,
      organizationId,
      ipAddress,
      metadata
    }, LogCategory.SECURITY)
  }
}

/**
 * Log database operation
 */
export function logDatabaseOperation(
  operation: 'create' | 'read' | 'update' | 'delete',
  table: string,
  recordId?: string,
  userId?: string,
  organizationId?: string,
  duration?: number,
  error?: Error
): void {
  if (error) {
    logger.error(`Database: ${operation} on ${table}`, {
      operation,
      table,
      recordId,
      userId,
      organizationId,
      duration,
      error: error?.message
    }, LogCategory.DATABASE)
  } else {
    logger.debug(`Database: ${operation} on ${table}`, {
      operation,
      table,
      recordId,
      userId,
      organizationId,
      duration
    }, LogCategory.DATABASE)
  }
}

/**
 * Log user activity
 */
export function logUserActivity(
  activity: string,
  userId: string,
  organizationId?: string,
  resource?: string,
  resourceId?: string,
  metadata?: Record<string, any>
): void {
  logger.info('User Activity', {
    activity,
    userId,
    organizationId,
    resource,
    resourceId,
    metadata
  }, LogCategory.USER)
  
  // Also log to audit
  auditLogger.log(activity, resource || 'user_activity', resourceId || userId, userId, {
    organizationId,
    metadata
  })
}

/**
 * Log system event
 */
export function logSystemEvent(
  event: string,
  level: LogLevel = LogLevel.INFO,
  metadata?: Record<string, any>
): void {
  logger.log(level, `System: ${event}`, metadata, LogCategory.SYSTEM)
}

/**
 * Format log entry for display
 */
export function formatLogEntry(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toLocaleString()
  const level = entry.level.toUpperCase().padEnd(5)
  const category = entry.category.toUpperCase().padEnd(12)
  
  let output = `[${timestamp}] ${level} ${category} ${entry.message}`
  
  if (entry.data) {
    output += `\nData: ${JSON.stringify(entry.data, null, 2)}`
  }
  
  if (entry.stack) {
    output += `\nStack: ${entry.stack}`
  }
  
  return output
}

/**
 * Export logs to JSON
 */
export function exportLogsToJSON(logs: LogEntry[]): string {
  return JSON.stringify(logs, null, 2)
}

/**
 * Export logs to CSV
 */
export function exportLogsToCSV(logs: LogEntry[]): string {
  const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'organizationId', 'requestId']
  const csvRows = [headers.join(',')]
  
  logs.forEach(log => {
    const row = headers.map(header => {
      const value = log[header as keyof LogEntry]
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value || ''
    })
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

/**
 * Filter logs by criteria
 */
export function filterLogs(
  logs: LogEntry[],
  criteria: {
    level?: LogLevel
    category?: LogCategory
    userId?: string
    organizationId?: string
    startDate?: Date
    endDate?: Date
    search?: string
  }
): LogEntry[] {
  return logs.filter(log => {
    if (criteria.level && log.level !== criteria.level) return false
    if (criteria.category && log.category !== criteria.category) return false
    if (criteria.userId && log.userId !== criteria.userId) return false
    if (criteria.organizationId && log.organizationId !== criteria.organizationId) return false
    if (criteria.startDate && new Date(log.timestamp) < criteria.startDate) return false
    if (criteria.endDate && new Date(log.timestamp) > criteria.endDate) return false
    if (criteria.search && !log.message.toLowerCase().includes(criteria.search.toLowerCase())) return false
    
    return true
  })
}

/**
 * Get log statistics
 */
export function getLogStatistics(logs: LogEntry[]): {
  total: number
  byLevel: Record<LogLevel, number>
  byCategory: Record<LogCategory, number>
  errors: number
  warnings: number
  last24Hours: number
} {
  const stats = {
    total: logs.length,
    byLevel: {} as Record<LogLevel, number>,
    byCategory: {} as Record<LogCategory, number>,
    errors: 0,
    warnings: 0,
    last24Hours: 0
  }
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  logs.forEach(log => {
    // Count by level
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
    
    // Count by category
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
    
    // Count errors and warnings
    if (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) {
      stats.errors++
    } else if (log.level === LogLevel.WARN) {
      stats.warnings++
    }
    
    // Count last 24 hours
    if (new Date(log.timestamp) > oneDayAgo) {
      stats.last24Hours++
    }
  })
  
  return stats
}

// =====================================================
// MIDDLEWARE HELPERS
// =====================================================

/**
 * Create request logging middleware
 */
export function createRequestLoggingMiddleware() {
  return (request: Request, response: Response, next: () => void) => {
    const startTime = Date.now()
    const method = request.method
    const url = new URL(request.url)
    const path = url.pathname
    
    // Log request
    logger.info('Request started', {
      method,
      path,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }, LogCategory.API)
    
    // Override response end to log completion
    const originalEnd = response.end
    response.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime
      
      logger.info('Request completed', {
        method,
        path,
        statusCode: response.statusCode,
        duration
      }, LogCategory.API)
      
      return originalEnd.call(this, chunk, encoding)
    }
    
    next()
  }
}

/**
 * Create error logging middleware
 */
export function createErrorLoggingMiddleware() {
  return (error: Error, request: any, response: any, next: () => void) => {
    logger.error('Request error', {
      error: error.message,
      stack: error.stack,
      method: request.method,
      path: new URL(request.url).pathname
    }, LogCategory.API)
    
    next()
  }
}
