/**
 * Date formatting utilities with consistent output between server and client
 * These utilities help avoid React hydration mismatch errors
 */

export interface FormatDateOptions {
  locale?: string
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
}

/**
 * Format date consistently between server and client
 * Uses fixed locale (en-US) by default to avoid hydration mismatches
 *
 * @example
 * formatDate(session.expiresAt) // "Jan 14, 2026, 10:30 AM"
 */
export function formatDate(
  date: Date | string,
  options?: FormatDateOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  // Use fixed locale for consistent server/client rendering
  const locale = options?.locale || 'en-US'

  return d.toLocaleString(locale, {
    dateStyle: options?.dateStyle || 'medium',
    timeStyle: options?.timeStyle || 'short',
  })
}

/**
 * Format date as short date only (no time)
 *
 * @example
 * formatShortDate(user.createdAt) // "Jan 14, 2026"
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date as time only
 *
 * @example
 * formatTime(session.expiresAt) // "10:30 AM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * Safe for SSR - uses deterministic calculations
 *
 * @example
 * formatRelativeTime(session.expiresAt) // "in 2 hours"
 */
export function formatRelativeTime(
  date: Date | string,
  referenceDate?: Date
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = referenceDate || new Date()
  const diff = d.getTime() - now.getTime()
  const absDiff = Math.abs(diff)

  const minutes = Math.floor(absDiff / 60000)
  const hours = Math.floor(absDiff / 3600000)
  const days = Math.floor(absDiff / 86400000)

  const prefix = diff > 0 ? 'in ' : ''
  const suffix = diff <= 0 ? ' ago' : ''

  if (days > 0) {
    return `${prefix}${days} day${days > 1 ? 's' : ''}${suffix}`
  }
  if (hours > 0) {
    return `${prefix}${hours} hour${hours > 1 ? 's' : ''}${suffix}`
  }
  if (minutes > 0) {
    return `${prefix}${minutes} minute${minutes > 1 ? 's' : ''}${suffix}`
  }

  return 'just now'
}

/**
 * Check if a date is expired (in the past)
 * Use in useEffect to avoid hydration mismatch
 *
 * @example
 * useEffect(() => {
 *   if (isExpired(session.expiresAt)) {
 *     clearAuth()
 *     router.push('/login')
 *   }
 * }, [])
 */
export function isExpired(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Date() > d
}
