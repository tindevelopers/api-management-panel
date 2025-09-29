// =====================================================
// Validation Utilities
// =====================================================

import { z } from 'zod'

// =====================================================
// COMMON VALIDATION SCHEMAS
// =====================================================

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email is too long')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .refine((val) => !val.startsWith('-') && !val.endsWith('-'), 'Slug cannot start or end with a hyphen')

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Name contains invalid characters')

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL is too long')

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()

// =====================================================
// ORGANIZATION VALIDATION SCHEMAS
// =====================================================

export const organizationSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().max(500, 'Description is too long').optional(),
  subscription_plan: z.enum(['free', 'basic', 'premium', 'enterprise']),
  max_users: z.number().int().min(1, 'Max users must be at least 1'),
  max_apis: z.number().int().min(1, 'Max APIs must be at least 1'),
  settings: z.record(z.string(), z.unknown()).optional()
})

export const updateOrganizationSchema = organizationSchema.partial()

// =====================================================
// USER VALIDATION SCHEMAS
// =====================================================

export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export const userProfileSchema = z.object({
  email: emailSchema,
  first_name: z.string().max(50, 'First name is too long').optional(),
  last_name: z.string().max(50, 'Last name is too long').optional(),
  phone: phoneSchema,
  avatar_url: urlSchema.optional()
})

// =====================================================
// ROLE VALIDATION SCHEMAS
// =====================================================

export const roleAssignmentSchema = z.object({
  user_id: uuidSchema,
  organization_id: uuidSchema,
  role_type: z.enum(['system_admin', 'org_admin', 'user']),
  permissions: z.array(z.string()).optional(),
  expires_at: z.string().datetime().optional()
})

export const updateRoleSchema = roleAssignmentSchema.partial()

// =====================================================
// INVITATION VALIDATION SCHEMAS
// =====================================================

export const invitationSchema = z.object({
  email: emailSchema,
  organization_id: uuidSchema,
  role_type: z.enum(['system_admin', 'org_admin', 'user']),
  message: z.string().max(500, 'Message is too long').optional()
})

export const invitationAcceptanceSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  first_name: z.string().max(50, 'First name is too long').optional(),
  last_name: z.string().max(50, 'Last name is too long').optional()
})

// =====================================================
// API VALIDATION SCHEMAS
// =====================================================

export const apiAccessSchema = z.object({
  user_id: uuidSchema,
  organization_id: uuidSchema,
  api_name: z.string().min(1, 'API name is required').max(100, 'API name is too long'),
  api_endpoint: z.string().min(1, 'API endpoint is required').max(500, 'API endpoint is too long'),
  allowed_methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])),
  rate_limit: z.number().int().min(1, 'Rate limit must be at least 1').optional(),
  rate_limit_period: z.enum(['minute', 'hour', 'day']).optional(),
  expires_at: z.string().datetime().optional()
})

// =====================================================
// PAGINATION VALIDATION SCHEMAS
// =====================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sort: z.string().max(50, 'Sort field is too long').optional(),
  order: z.enum(['asc', 'desc']).default('asc')
})

// =====================================================
// FILTER VALIDATION SCHEMAS
// =====================================================

export const organizationFiltersSchema = z.object({
  search: z.string().max(100, 'Search term is too long').optional(),
  subscription_plan: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
  is_active: z.boolean().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional()
})

export const userFiltersSchema = z.object({
  search: z.string().max(100, 'Search term is too long').optional(),
  role_type: z.enum(['system_admin', 'org_admin', 'user']).optional(),
  organization_id: uuidSchema.optional(),
  is_active: z.boolean().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional()
})

// =====================================================
// VALIDATION UTILITY FUNCTIONS
// =====================================================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      
      error.issues.forEach((err: any) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      
      return { success: false, errors }
    }
    
    return {
      success: false,
      errors: { general: ['Validation failed'] }
    }
  }
}

/**
 * Validate data and throw error if invalid
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Safe validation that returns null on error
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data)
  } catch {
    return null
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  return uuidSchema.safeParse(uuid).success
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  return urlSchema.safeParse(url).success
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtmlContent(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return sanitizeString(query, 100)
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  return phoneSchema.safeParse(phone).success
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start <= end
  } catch {
    return false
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, limit: number): { page: number; limit: number } {
  return {
    page: Math.max(1, Math.floor(page)),
    limit: Math.min(100, Math.max(1, Math.floor(limit)))
  }
}

/**
 * Validate sort parameters
 */
export function validateSortParams(sort: string, order: string): { sort: string; order: 'asc' | 'desc' } {
  const validOrder = order === 'desc' ? 'desc' : 'asc'
  const sanitizedSort = sanitizeString(sort, 50)
  
  return {
    sort: sanitizedSort || 'created_at',
    order: validOrder
  }
}

/**
 * Check if a string is a valid JSON
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

/**
 * Validate API endpoint format
 */
export function isValidApiEndpoint(endpoint: string): boolean {
  // Basic validation for API endpoints
  const endpointPattern = /^\/[a-zA-Z0-9\-_\/]*$/
  return endpointPattern.test(endpoint) && endpoint.length <= 500
}

/**
 * Validate rate limit values
 */
export function isValidRateLimit(limit: number, period: string): boolean {
  const validPeriods = ['minute', 'hour', 'day']
  return validPeriods.includes(period) && limit > 0 && limit <= 10000
}

/**
 * Validate subscription plan
 */
export function isValidSubscriptionPlan(plan: string): boolean {
  const validPlans = ['free', 'basic', 'premium', 'enterprise']
  return validPlans.includes(plan)
}

/**
 * Validate role type
 */
export function isValidRoleType(roleType: string): boolean {
  const validRoles = ['system_admin', 'org_admin', 'user']
  return validRoles.includes(roleType)
}

/**
 * Validate API method
 */
export function isValidApiMethod(method: string): boolean {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  return validMethods.includes(method.toUpperCase())
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string[]>): string[] {
  const formattedErrors: string[] = []
  
  Object.entries(errors).forEach(([field, messages]) => {
    messages.forEach(message => {
      formattedErrors.push(`${field}: ${message}`)
    })
  })
  
  return formattedErrors
}

/**
 * Create a validation error response
 */
export function createValidationErrorsResponse(errors: Record<string, string[]>) {
  return {
    success: false,
    error: 'Validation failed',
    details: errors,
    message: 'Please check your input and try again'
  }
}

// =====================================================
// CUSTOM VALIDATION FUNCTIONS
// =====================================================

/**
 * Check if password meets complexity requirements
 */
export function checkPasswordComplexity(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if organization slug is valid and available
 */
export async function validateOrganizationSlug(slug: string): Promise<{
  isValid: boolean
  isAvailable: boolean
  errors: string[]
}> {
  const errors: string[] = []
  
  // Check format
  if (!isValidSlug(slug)) {
    errors.push('Slug format is invalid')
  }
  
  // Check reserved words
  const reservedWords = ['admin', 'api', 'www', 'mail', 'ftp', 'app', 'dashboard']
  if (reservedWords.includes(slug.toLowerCase())) {
    errors.push('This slug is reserved and cannot be used')
  }
  
  // Check availability (this would need to be implemented with database check)
  // For now, we'll assume it's available if format is valid
  const isAvailable = errors.length === 0
  
  return {
    isValid: errors.length === 0,
    isAvailable,
    errors
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  maxFiles?: number
} = {}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], maxFiles = 1 } = options
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // Basic API key validation - should be at least 32 characters and contain alphanumeric characters
  return /^[a-zA-Z0-9]{32,}$/.test(apiKey)
}

/**
 * Validate JWT token format
 */
export function validateJWTFormat(token: string): boolean {
  // Basic JWT format validation (header.payload.signature)
  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

/**
 * Validate environment variable
 */
export function validateEnvVar(name: string, value: string | undefined, required: boolean = true): boolean {
  if (required && (!value || value.trim() === '')) {
    console.error(`Required environment variable ${name} is not set`)
    return false
  }
  return true
}

// =====================================================
// EXPORT TYPES
// =====================================================

export type ValidationResult<T> = {
  success: true
  data: T
} | {
  success: false
  errors: Record<string, string[]>
}

export type ValidationOptions = {
  abortEarly?: boolean
  stripUnknown?: boolean
  allowUnknown?: boolean
}

// =====================================================
// VALIDATION MIDDLEWARE HELPERS
// =====================================================

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): ValidationResult<T> => {
    return validateData(schema, data)
  }
}

/**
 * Validate request body
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
  return validateData(schema, body)
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, query: unknown): ValidationResult<T> {
  return validateData(schema, query)
}

/**
 * Validate URL parameters
 */
export function validateUrlParams<T>(schema: z.ZodSchema<T>, params: unknown): ValidationResult<T> {
  return validateData(schema, params)
}
