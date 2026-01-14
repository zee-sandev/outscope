/**
 * Authentication utilities for token extraction
 *
 * Provides helpers for extracting authentication tokens from HTTP requests,
 * supporting both Bearer token authentication and cookie-based sessions.
 */

import type { Context as HonoContext } from 'hono'

/**
 * Result of token extraction operation
 */
export interface TokenExtractionResult {
  /** The extracted token, or null if not found */
  token: string | null
  /** Source of the token: 'bearer' for Authorization header, 'cookie' for cookies */
  source: 'bearer' | 'cookie' | null
}

/**
 * Options for token extraction
 */
export interface ExtractTokenOptions {
  /**
   * Cookie name to look for session token
   * @default 'session_token'
   */
  cookieName?: string

  /**
   * Pattern to match cookie name (regex)
   * Used when cookie name contains special characters or prefixes
   * @example /better-auth\.session_token=([^;]+)/
   */
  cookiePattern?: RegExp
}

/**
 * Context shape required for token extraction
 */
export interface TokenExtractionContext {
  honoContext?: HonoContext
}

/**
 * Extract authentication token from request context
 *
 * Checks for Bearer token in Authorization header first, then falls back
 * to cookie-based session token.
 *
 * @param context - The request context containing honoContext
 * @param options - Configuration options for extraction
 * @returns Object containing the token and its source
 *
 * @example Basic usage with Bearer token
 * ```typescript
 * const { token, source } = extractToken(context)
 * if (token) {
 *   // Use token for authentication
 * }
 * ```
 *
 * @example With custom cookie name
 * ```typescript
 * const { token, source } = extractToken(context, {
 *   cookieName: 'my-session-token'
 * })
 * ```
 *
 * @example With Better Auth cookie pattern
 * ```typescript
 * const { token } = extractToken(context, {
 *   cookiePattern: /better-auth\.session_token=([^;]+)/
 * })
 * ```
 */
export function extractToken(
  context: TokenExtractionContext,
  options?: ExtractTokenOptions
): TokenExtractionResult {
  const authHeader = context.honoContext?.req?.header('authorization')
  const cookieHeader = context.honoContext?.req?.header('cookie')

  // Try Bearer token first
  if (authHeader?.startsWith('Bearer ')) {
    return {
      token: authHeader.substring(7),
      source: 'bearer',
    }
  }

  // Try cookie-based token
  if (cookieHeader) {
    // Use custom pattern if provided
    if (options?.cookiePattern) {
      const match = cookieHeader.match(options.cookiePattern)
      if (match?.[1]) {
        return {
          token: match[1],
          source: 'cookie',
        }
      }
    }

    // Use cookie name
    const cookieName = options?.cookieName || 'session_token'
    const escapedName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`${escapedName}=([^;]+)`)
    const match = cookieHeader.match(pattern)

    if (match?.[1]) {
      return {
        token: match[1],
        source: 'cookie',
      }
    }
  }

  return {
    token: null,
    source: null,
  }
}

/**
 * Extract Bearer token from Authorization header only
 *
 * Use this when you only want to support Bearer token authentication.
 *
 * @param context - The request context containing honoContext
 * @returns The token string or null if not found
 *
 * @example
 * ```typescript
 * const token = extractBearerToken(context)
 * if (!token) {
 *   throw new Error('Bearer token required')
 * }
 * ```
 */
export function extractBearerToken(context: TokenExtractionContext): string | null {
  const authHeader = context.honoContext?.req?.header('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

/**
 * Extract session token from cookies only
 *
 * Use this when you only want to support cookie-based authentication.
 *
 * @param context - The request context containing honoContext
 * @param options - Configuration options
 * @returns The token string or null if not found
 *
 * @example
 * ```typescript
 * const token = extractCookieToken(context, {
 *   cookiePattern: /better-auth\.session_token=([^;]+)/
 * })
 * ```
 */
export function extractCookieToken(
  context: TokenExtractionContext,
  options?: Pick<ExtractTokenOptions, 'cookieName' | 'cookiePattern'>
): string | null {
  const cookieHeader = context.honoContext?.req?.header('cookie')

  if (!cookieHeader) {
    return null
  }

  // Use custom pattern if provided
  if (options?.cookiePattern) {
    const match = cookieHeader.match(options.cookiePattern)
    return match?.[1] || null
  }

  // Use cookie name
  const cookieName = options?.cookieName || 'session_token'
  const escapedName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escapedName}=([^;]+)`)
  const match = cookieHeader.match(pattern)

  return match?.[1] || null
}
