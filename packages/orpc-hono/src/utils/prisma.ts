/**
 * Prisma integration utilities
 *
 * Provides helpers for integrating Prisma with the logging system,
 * reducing boilerplate for common Prisma setup patterns.
 */

import type { Logger } from '../infrastructure/logger'

/**
 * Prisma client interface for logging attachment
 * This is a minimal interface to avoid requiring @prisma/client as a dependency
 */
export interface PrismaClientLike {
  $on: (event: string, handler: (e: unknown) => void) => void
}

/**
 * Prisma event data shape
 */
interface PrismaEventData {
  message?: string
  query?: string
  params?: string
  duration?: number
  target?: string
  timestamp?: Date
}

/**
 * Options for Prisma logging attachment
 */
export interface PrismaLoggingOptions {
  /**
   * Whether to log query events
   * @default true
   */
  logQueries?: boolean

  /**
   * Whether to log error events
   * @default true
   */
  logErrors?: boolean

  /**
   * Whether to log info events
   * @default true
   */
  logInfo?: boolean

  /**
   * Whether to log warning events
   * @default true
   */
  logWarnings?: boolean

  /**
   * Custom query formatter for better readability
   * If provided, will be called to format query strings
   */
  queryFormatter?: (query: string, params?: string) => string
}

/**
 * Attach logging to Prisma client events
 *
 * This function attaches event listeners to a Prisma client for logging
 * query, error, info, and warning events using the provided logger.
 *
 * Note: To use this, the Prisma client must be initialized with
 * event logging enabled:
 * ```typescript
 * new PrismaClient({
 *   log: [
 *     { emit: 'event', level: 'query' },
 *     { emit: 'event', level: 'error' },
 *     { emit: 'event', level: 'info' },
 *     { emit: 'event', level: 'warn' },
 *   ],
 * })
 * ```
 *
 * @param prisma - The Prisma client instance
 * @param logger - The logger instance to use
 * @param options - Optional configuration
 *
 * @example Basic usage
 * ```typescript
 * import { PrismaClient } from '@prisma/client'
 * import { attachPrismaLogging, createLogger } from '@outscope/orpc-hono'
 *
 * const prisma = new PrismaClient({
 *   log: [
 *     { emit: 'event', level: 'query' },
 *     { emit: 'event', level: 'error' },
 *     { emit: 'event', level: 'info' },
 *     { emit: 'event', level: 'warn' },
 *   ],
 * })
 *
 * const logger = createLogger({ level: 'debug', pretty: true })
 * attachPrismaLogging(prisma, logger)
 * ```
 *
 * @example With custom options
 * ```typescript
 * attachPrismaLogging(prisma, logger, {
 *   logQueries: process.env.NODE_ENV === 'development',
 *   logErrors: true,
 *   logInfo: false,
 *   logWarnings: true,
 * })
 * ```
 */
export function attachPrismaLogging(
  prisma: PrismaClientLike,
  logger: Logger,
  options?: PrismaLoggingOptions
): void {
  const {
    logQueries = true,
    logErrors = true,
    logInfo = true,
    logWarnings = true,
    queryFormatter,
  } = options || {}

  // Query logging
  if (logQueries) {
    prisma.$on('query', (e: unknown) => {
      const event = e as PrismaEventData
      let queryLog: Record<string, unknown> = {}

      if (queryFormatter && event.query) {
        queryLog = {
          query: queryFormatter(event.query, event.params),
          duration: event.duration ? `${event.duration}ms` : undefined,
        }
      } else {
        queryLog = {
          query: event.query,
          params: event.params,
          duration: event.duration ? `${event.duration}ms` : undefined,
        }
      }

      logger.debug(queryLog, 'Prisma Query')
    })
  }

  // Error logging
  if (logErrors) {
    prisma.$on('error', (e: unknown) => {
      const event = e as PrismaEventData
      logger.error(
        {
          message: event.message,
          target: event.target,
        },
        'Prisma Error'
      )
    })
  }

  // Info logging
  if (logInfo) {
    prisma.$on('info', (e: unknown) => {
      const event = e as PrismaEventData
      logger.info({ message: event.message }, 'Prisma Info')
    })
  }

  // Warning logging
  if (logWarnings) {
    prisma.$on('warn', (e: unknown) => {
      const event = e as PrismaEventData
      logger.warn({ message: event.message }, 'Prisma Warning')
    })
  }
}

/**
 * Create a SQL formatter that interpolates parameters into queries
 *
 * This creates more readable query logs by replacing parameter placeholders
 * with actual values.
 *
 * @returns A query formatter function
 *
 * @example
 * ```typescript
 * attachPrismaLogging(prisma, logger, {
 *   queryFormatter: createSqlFormatter(),
 * })
 * ```
 */
export function createSqlFormatter(): (query: string, params?: string) => string {
  return (query: string, params?: string): string => {
    if (!params) return query

    try {
      const parsedParams = JSON.parse(params) as unknown[]
      let formattedQuery = query

      parsedParams.forEach((param, index) => {
        let value: string

        if (param === null) {
          value = 'NULL'
        } else if (typeof param === 'string') {
          // Escape single quotes
          value = `'${param.replace(/'/g, "''")}'`
        } else if (typeof param === 'number' || typeof param === 'boolean') {
          value = String(param)
        } else if (param instanceof Date || (typeof param === 'string' && !isNaN(Date.parse(param)))) {
          value = `'${new Date(param as string).toISOString()}'`
        } else {
          value = `'${JSON.stringify(param).replace(/'/g, "''")}'`
        }

        // Replace $N placeholders (PostgreSQL style)
        formattedQuery = formattedQuery.replace(
          new RegExp(`\\$${index + 1}\\b`, 'g'),
          value
        )
      })

      // Remove backslashes for cleaner output
      return formattedQuery.replace(/\\/g, '')
    } catch {
      // Return original query if params can't be parsed
      return query
    }
  }
}
