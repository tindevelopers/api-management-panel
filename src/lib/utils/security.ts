// =====================================================
// Security Utilities
// =====================================================

import crypto from 'crypto'
import { NextRequest } from 'next/server'

// =====================================================
// TYPES
// =====================================================

export interface SecurityConfig {
  encryptionKey: string
  jwtSecret: string
  saltRounds: number
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
}

export interface EncryptionResult {
  encrypted: string
  iv: string
  tag: string
}

export interface HashResult {
  hash: string
  salt: string
}

export interface TokenPayload {
  userId: string
  organizationId?: string
  role?: string
  permissions?: string[]
  exp: number
  iat: number
}

// =====================================================
// ENCRYPTION UTILITIES
// =====================================================

/**
 * Generate a secure random key
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate a secure random string
 */
export function generateSecureString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptData(data: string, key: string): EncryptionResult {
  try {
    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, Buffer.from(key, 'hex'))
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  } catch (error) {
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(encryptedData: EncryptionResult, key: string): string {
  try {
    const algorithm = 'aes-256-gcm'
    const decipher = crypto.createDecipher(algorithm, Buffer.from(key, 'hex'))
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    throw new Error('Decryption failed')
  }
}

/**
 * Simple encryption for non-sensitive data
 */
export function simpleEncrypt(data: string, key: string): string {
  const algorithm = 'aes-256-cbc'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, Buffer.from(key, 'hex'))
  
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Simple decryption for non-sensitive data
 */
export function simpleDecrypt(encryptedData: string, key: string): string {
  const algorithm = 'aes-256-cbc'
  const parts = encryptedData.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  
  const decipher = crypto.createDecipher(algorithm, Buffer.from(key, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// =====================================================
// HASHING UTILITIES
// =====================================================

/**
 * Hash a password using bcrypt-like algorithm
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}

/**
 * Generate a salt
 */
export function generateSalt(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Hash data with salt
 */
export function hashWithSalt(data: string, salt: string): string {
  return crypto.createHash('sha256').update(data + salt).digest('hex')
}

/**
 * Generate a secure hash
 */
export function generateHash(data: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(data).digest('hex')
}

/**
 * Generate HMAC
 */
export function generateHMAC(data: string, secret: string, algorithm: string = 'sha256'): string {
  return crypto.createHmac(algorithm, secret).update(data).digest('hex')
}

// =====================================================
// TOKEN UTILITIES
// =====================================================

/**
 * Generate a secure token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url')
}

/**
 * Generate a JWT token
 */
export function generateJWT(payload: Omit<TokenPayload, 'exp' | 'iat'>, secret: string, expiresIn: string = '24h'): string {
  const jwt = require('jsonwebtoken')
  
  const tokenPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + parseExpiresIn(expiresIn),
    iat: Math.floor(Date.now() / 1000)
  }
  
  return jwt.sign(tokenPayload, secret, { expiresIn })
}

/**
 * Verify a JWT token
 */
export function verifyJWT(token: string, secret: string): TokenPayload | null {
  try {
    const jwt = require('jsonwebtoken')
    return jwt.verify(token, secret) as TokenPayload
  } catch (error) {
    return null
  }
}

/**
 * Parse expires in string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  }
  
  const match = expiresIn.match(/^(\d+)([smhd])$/)
  if (!match) {
    return 86400 // Default to 24 hours
  }
  
  const [, value, unit] = match
  return parseInt(value) * (units[unit as keyof typeof units] || 1)
}

/**
 * Generate an API key
 */
export function generateApiKey(prefix: string = 'ak'): string {
  const randomPart = crypto.randomBytes(16).toString('base64url')
  return `${prefix}_${randomPart}`
}

/**
 * Generate an invitation token
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate a password reset token
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate a verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(16).toString('base64url')
}

// =====================================================
// INPUT SANITIZATION
// =====================================================

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
}

/**
 * Sanitize SQL input
 */
// export function sanitizeSQL(input: string): string {
//   // Basic SQL injection prevention - use parameterized queries in production
//   return input
//     .replace(/[';--]/g, '')
//     .replace(/union\s+select/gi, '')
//     .replace(/drop\s+table/gi, '')
//     .replace(/delete\s+from/gi, '')
//     .replace(/insert\s+into/gi, '')
//     .replace(/update\s+set/gi, '')
// // }

/**
 * Sanitize file path
 */
export function sanitizeFilePath(path: string): string {
  return path
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .replace(/\/+/g, '/') // Normalize slashes
    .trim()
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '')
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Sanitize URL
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.toString()
  } catch {
    return ''
  }
}

/**
 * Sanitize JSON string
 */
export function sanitizeJSON(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed)
  } catch {
    return ''
  }
}

// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password should be at least 8 characters long')
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain at least one uppercase letter')
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain at least one lowercase letter')
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain at least one number')
  }
  
  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain at least one special character')
  }
  
  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ]
  
  if (commonPasswords.includes(password.toLowerCase())) {
    score -= 2
    feedback.push('Password is too common')
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback
  }
}

/**
 * Validate email format
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format
 */
export function validatePhoneNumberFormat(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

/**
 * Validate URL format
 */
export function validateURLFormat(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// =====================================================
// RATE LIMITING UTILITIES
// =====================================================

/**
 * Check if IP is in whitelist
 */
export function isIPWhitelisted(ip: string, whitelist: string[]): boolean {
  return whitelist.some(whitelistedIP => {
    if (whitelistedIP.includes('/')) {
      // CIDR notation
      return isIPInCIDR(ip, whitelistedIP)
    }
    return ip === whitelistedIP
  })
}

/**
 * Check if IP is in CIDR range
 */
export function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, prefixLength] = cidr.split('/')
    const ipNum = ipToNumber(ip)
    const networkNum = ipToNumber(network)
    const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0
    
    return (ipNum & mask) === (networkNum & mask)
  } catch {
    return false
  }
}

/**
 * Convert IP address to number
 */
function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

/**
 * Check if IP is in blacklist
 */
export function isIPBlacklisted(ip: string, blacklist: string[]): boolean {
  return isIPWhitelisted(ip, blacklist) // Same logic, different meaning
}

// =====================================================
// SESSION SECURITY
// =====================================================

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}

// =====================================================
// FILE SECURITY
// =====================================================

/**
 * Validate file type
 */
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  const extension = originalName.split('.').pop()
  
  return `${timestamp}_${random}.${extension}`
}

/**
 * Scan file for malicious content (basic implementation)
 */
export function scanFileContent(content: Buffer): {
  isSafe: boolean
  threats: string[]
} {
  const threats: string[] = []
  const contentStr = content.toString('utf8', 0, Math.min(content.length, 1024))
  
  // Check for common malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.write/i
  ]
  
  maliciousPatterns.forEach(pattern => {
    if (pattern.test(contentStr)) {
      threats.push(`Malicious pattern detected: ${pattern.source}`)
    }
  })
  
  return {
    isSafe: threats.length === 0,
    threats
  }
}

// =====================================================
// HEADER SECURITY
// =====================================================

/**
 * Add security headers to response
 */
export function addSecurityHeaders(headers: Headers): Headers {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return headers
}

/**
 * Add CORS security headers
 */
export function addCorsSecurityHeaders(headers: Headers, origin: string): Headers {
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  
  return headers
}

// =====================================================
// AUDIT UTILITIES
// =====================================================

/**
 * Generate audit log entry
 */
export function generateAuditLogEntry(
  action: string,
  resource: string,
  resourceId: string,
  userId: string,
  organizationId?: string,
  metadata?: Record<string, any>
): {
  id: string
  action: string
  resource_type: string
  resource_id: string
  user_id: string
  organization_id?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
} {
  return {
    id: generateSecureKey(16),
    action,
    resource_type: resource,
    resource_id: resourceId,
    user_id: userId,
    organization_id: organizationId,
    metadata,
    created_at: new Date().toISOString()
  }
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'ssn', 'credit_card']
  const masked = { ...data }
  
  Object.keys(masked).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***MASKED***'
    }
  })
  
  return masked
}

// =====================================================
// ENVIRONMENT VALIDATION
// =====================================================

/**
 * Validate required environment variables
 */
export function validateEnvironmentVariables(): {
  isValid: boolean
  missing: string[]
  warnings: string[]
} {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missing: string[] = []
  const warnings: string[] = []
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key)
    }
  })
  
  // Check for weak secrets
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 32) {
    warnings.push('SUPABASE_ANON_KEY appears to be weak')
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

/**
 * Generate secure environment configuration
 */
export function generateSecureConfig(): SecurityConfig {
  return {
    encryptionKey: generateSecureKey(32),
    jwtSecret: generateSecureKey(32),
    saltRounds: 12,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  }
}
