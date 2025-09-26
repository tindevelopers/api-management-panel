// =====================================================
// Formatting Utilities
// =====================================================

// =====================================================
// TYPES
// =====================================================

export interface DateFormatOptions {
  locale?: string
  timeZone?: string
  format?: 'short' | 'medium' | 'long' | 'full'
  includeTime?: boolean
  relative?: boolean
}

export interface NumberFormatOptions {
  locale?: string
  style?: 'decimal' | 'currency' | 'percent'
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
}

export interface FileSizeOptions {
  binary?: boolean
  precision?: number
  units?: string[]
}

// =====================================================
// DATE FORMATTING
// =====================================================

/**
 * Format date with various options
 */
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    timeZone = 'UTC',
    format = 'medium',
    includeTime = false,
    relative = false
  } = options

  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  if (relative) {
    return formatRelativeDate(dateObj)
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    dateStyle: format
  }

  if (includeTime) {
    formatOptions.timeStyle = format
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
}

/**
 * Format relative date (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const diffMinutes = Math.round(diffSeconds / 60)
  const diffHours = Math.round(diffMinutes / 60)
  const diffDays = Math.round(diffHours / 24)
  const diffWeeks = Math.round(diffDays / 7)
  const diffMonths = Math.round(diffDays / 30)
  const diffYears = Math.round(diffDays / 365)

  const isFuture = diffMs > 0
  const prefix = isFuture ? 'in ' : ''
  const suffix = isFuture ? '' : ' ago'

  if (Math.abs(diffSeconds) < 60) {
    return isFuture ? 'in a moment' : 'just now'
  }

  if (Math.abs(diffMinutes) < 60) {
    return `${prefix}${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) === 1 ? '' : 's'}${suffix}`
  }

  if (Math.abs(diffHours) < 24) {
    return `${prefix}${Math.abs(diffHours)} hour${Math.abs(diffHours) === 1 ? '' : 's'}${suffix}`
  }

  if (Math.abs(diffDays) < 7) {
    return `${prefix}${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}${suffix}`
  }

  if (Math.abs(diffWeeks) < 4) {
    return `${prefix}${Math.abs(diffWeeks)} week${Math.abs(diffWeeks) === 1 ? '' : 's'}${suffix}`
  }

  if (Math.abs(diffMonths) < 12) {
    return `${prefix}${Math.abs(diffMonths)} month${Math.abs(diffMonths) === 1 ? '' : 's'}${suffix}`
  }

  return `${prefix}${Math.abs(diffYears)} year${Math.abs(diffYears) === 1 ? '' : 's'}${suffix}`
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const start = typeof startDate === 'string' || typeof startDate === 'number' 
    ? new Date(startDate) 
    : startDate
  const end = typeof endDate === 'string' || typeof endDate === 'number' 
    ? new Date(endDate) 
    : endDate

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid Date Range'
  }

  const { locale = 'en-US', timeZone = 'UTC' } = options

  const startFormatted = formatDate(start, { ...options, locale, timeZone })
  const endFormatted = formatDate(end, { ...options, locale, timeZone })

  return `${startFormatted} - ${endFormatted}`
}

/**
 * Format time duration
 */
export function formatDuration(
  milliseconds: number,
  options: { precision?: number; compact?: boolean } = {}
): string {
  const { precision = 2, compact = false } = options

  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days}${compact ? 'd' : ' day' + (days === 1 ? '' : 's')}`)
  }

  if (hours % 24 > 0) {
    parts.push(`${hours % 24}${compact ? 'h' : ' hour' + (hours % 24 === 1 ? '' : 's')}`)
  }

  if (minutes % 60 > 0) {
    parts.push(`${minutes % 60}${compact ? 'm' : ' minute' + (minutes % 60 === 1 ? '' : 's')}`)
  }

  if (seconds % 60 > 0 || parts.length === 0) {
    const secs = precision > 0 ? (seconds % 60).toFixed(precision) : Math.floor(seconds % 60)
    parts.push(`${secs}${compact ? 's' : ' second' + (seconds % 60 === 1 ? '' : 's')}`)
  }

  return parts.slice(0, precision).join(' ')
}

/**
 * Get time ago string
 */
export function getTimeAgo(date: Date | string | number): string {
  return formatRelativeDate(new Date(date))
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date
  const today = new Date()
  
  return dateObj.toDateString() === today.toDateString()
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return dateObj.toDateString() === yesterday.toDateString()
}

// =====================================================
// NUMBER FORMATTING
// =====================================================

/**
 * Format number with various options
 */
export function formatNumber(
  number: number,
  options: NumberFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    style = 'decimal',
    currency = 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
    notation = 'standard'
  } = options

  const formatOptions: Intl.NumberFormatOptions = {
    style,
    notation
  }

  if (style === 'currency') {
    formatOptions.currency = currency
  }

  if (minimumFractionDigits !== undefined) {
    formatOptions.minimumFractionDigits = minimumFractionDigits
  }

  if (maximumFractionDigits !== undefined) {
    formatOptions.maximumFractionDigits = maximumFractionDigits
  }

  return new Intl.NumberFormat(locale, formatOptions).format(number)
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  locale: string = 'en-US',
  decimals: number = 2
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(
  number: number,
  locale: string = 'en-US',
  precision: number = 1
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: precision
  }).format(number)
}

/**
 * Format ordinal numbers (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(
  number: number,
  locale: string = 'en-US'
): string {
  return new Intl.PluralRules(locale, { type: 'ordinal' }).select(number) === 'other'
    ? `${number}th`
    : `${number}${['st', 'nd', 'rd'][number % 10 - 1] || 'th'}`
}

/**
 * Format file size
 */
export function formatFileSize(
  bytes: number,
  options: FileSizeOptions = {}
): string {
  const {
    binary = false,
    precision = 2,
    units = binary 
      ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  } = options

  if (bytes === 0) return `0 ${units[0]}`

  const base = binary ? 1024 : 1000
  const index = Math.floor(Math.log(bytes) / Math.log(base))
  const size = bytes / Math.pow(base, index)

  return `${size.toFixed(precision)} ${units[index]}`
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  return formatFileSize(bytes, { precision: decimals })
}

/**
 * Parse number from formatted string
 */
export function parseFormattedNumber(formattedNumber: string, locale: string = 'en-US'): number {
  // Remove currency symbols and other formatting
  const cleanNumber = formattedNumber.replace(/[^\d.,]/g, '')
  
  // Handle different decimal separators
  const decimalSeparator = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.'
  const groupSeparator = new Intl.NumberFormat(locale).formatToParts(1000).find(part => part.type === 'group')?.value || ','
  
  let normalized = cleanNumber
  if (groupSeparator !== decimalSeparator) {
    normalized = cleanNumber.replace(new RegExp('\\' + groupSeparator, 'g'), '').replace(decimalSeparator, '.')
  }
  
  return parseFloat(normalized)
}

// =====================================================
// STRING FORMATTING
// =====================================================

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase())
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Convert string to slug
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Convert slug to readable text
 */
export function slugToReadable(slug: string): string {
  return slug
    .split('-')
    .map(word => capitalize(word))
    .join(' ')
}

/**
 * Truncate string with ellipsis
 */
export function truncate(
  str: string,
  length: number,
  suffix: string = '...'
): string {
  if (str.length <= length) {
    return str
  }
  
  return str.slice(0, length - suffix.length) + suffix
}

/**
 * Truncate string at word boundary
 */
export function truncateWords(
  str: string,
  wordCount: number,
  suffix: string = '...'
): string {
  const words = str.split(' ')
  
  if (words.length <= wordCount) {
    return str
  }
  
  return words.slice(0, wordCount).join(' ') + suffix
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Escape HTML characters
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  
  return str.replace(/[&<>"']/g, char => htmlEscapes[char])
}

/**
 * Unescape HTML characters
 */
export function unescapeHtml(str: string): string {
  const htmlUnescapes: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  }
  
  return str.replace(/&(amp|lt|gt|quot|#39);/g, (match, entity) => htmlUnescapes[match])
}

/**
 * Generate initials from name
 */
export function generateInitials(name: string, maxLength: number = 2): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, maxLength)
}

/**
 * Mask sensitive information
 */
export function maskSensitiveInfo(
  str: string,
  visibleChars: number = 4,
  maskChar: string = '*'
): string {
  if (str.length <= visibleChars * 2) {
    return maskChar.repeat(str.length)
  }
  
  const start = str.slice(0, visibleChars)
  const end = str.slice(-visibleChars)
  const middle = maskChar.repeat(str.length - visibleChars * 2)
  
  return start + middle + end
}

/**
 * Format phone number
 */
export function formatPhoneNumber(
  phone: string,
  format: 'US' | 'International' = 'US'
): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (format === 'US') {
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
  }
  
  // International format
  if (cleaned.length >= 10) {
    return `+${cleaned}`
  }
  
  return phone
}

/**
 * Format credit card number
 */
export function formatCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  const groups = cleaned.match(/.{1,4}/g) || []
  return groups.join(' ')
}

/**
 * Format social security number
 */
export function formatSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '')
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`
  }
  return ssn
}

// =====================================================
// DATA FORMATTING
// =====================================================

/**
 * Format array as comma-separated list
 */
export function formatList(
  items: string[],
  conjunction: string = 'and'
): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
  
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`
}

/**
 * Format key-value pairs
 */
export function formatKeyValue(
  obj: Record<string, any>,
  separator: string = ': ',
  itemSeparator: string = ', '
): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}${separator}${value}`)
    .join(itemSeparator)
}

/**
 * Format JSON with indentation
 */
export function formatJSON(obj: any, indent: number = 2): string {
  return JSON.stringify(obj, null, indent)
}

/**
 * Format CSV from array of objects
 */
export function formatCSV(
  data: Record<string, any>[],
  headers?: string[]
): string {
  if (data.length === 0) return ''
  
  const keys = headers || Object.keys(data[0])
  const csvHeaders = keys.join(',')
  
  const csvRows = data.map(row =>
    keys.map(key => {
      const value = row[key]
      const stringValue = value === null || value === undefined ? '' : String(value)
      // Escape commas and quotes
      return stringValue.includes(',') || stringValue.includes('"') 
        ? `"${stringValue.replace(/"/g, '""')}"` 
        : stringValue
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

// =====================================================
// URL FORMATTING
// =====================================================

/**
 * Format URL with query parameters
 */
export function formatURL(
  baseUrl: string,
  params: Record<string, any> = {}
): string {
  const url = new URL(baseUrl)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })
  
  return url.toString()
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const urlObj = new URL(url)
  const params: Record<string, string> = {}
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  return params
}

// =====================================================
// COLOR FORMATTING
// =====================================================

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100
  
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h * 6) % 2 - 1))
  const m = l - c / 2
  
  let r = 0, g = 0, b = 0
  
  if (h >= 0 && h < 1/6) {
    r = c; g = x; b = 0
  } else if (h >= 1/6 && h < 2/6) {
    r = x; g = c; b = 0
  } else if (h >= 2/6 && h < 3/6) {
    r = 0; g = c; b = x
  } else if (h >= 3/6 && h < 4/6) {
    r = 0; g = x; b = c
  } else if (h >= 4/6 && h < 5/6) {
    r = x; g = 0; b = c
  } else if (h >= 5/6 && h < 1) {
    r = c; g = 0; b = x
  }
  
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0
}

/**
 * Normalize whitespace
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim()
}

/**
 * Remove extra spaces
 */
export function removeExtraSpaces(str: string): string {
  return str.replace(/\s{2,}/g, ' ').trim()
}

/**
 * Generate random string
 */
export function generateRandomString(
  length: number = 8,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * Format bytes to human readable with units
 */
export function formatBytesWithUnits(bytes: number): string {
  return formatFileSize(bytes, { binary: true })
}

/**
 * Format percentage with sign
 */
export function formatPercentageWithSign(
  value: number,
  locale: string = 'en-US',
  decimals: number = 1
): string {
  const formatted = formatPercentage(Math.abs(value), locale, decimals)
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${formatted}`
}

/**
 * Format range (e.g., "1-10", "5-5")
 */
export function formatRange(min: number, max: number): string {
  return min === max ? min.toString() : `${min}-${max}`
}

/**
 * Format plural with count
 */
export function formatPlural(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) {
    return `${count} ${singular}`
  }
  
  return `${count} ${plural || singular + 's'}`
}
