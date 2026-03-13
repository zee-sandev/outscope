import type { Logger, LoggerConfig } from './index'

/**
 * Log levels with numeric values for comparison
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const

/**
 * Create a console-based logger.
 *
 * This adapter uses the native console API and works in all JavaScript runtimes,
 * including edge environments like Cloudflare Workers and Vercel Edge Functions.
 *
 * @param config - Logger configuration
 * @returns Logger instance
 */
export function createConsoleLogger(config?: LoggerConfig): Logger {
  const { level = 'info', name } = config ?? {}
  const minLevel = LOG_LEVELS[level]

  /**
   * Format a log message with context
   */
  const format = (logLevel: string, args: unknown[]): unknown[] => {
    const timestamp = new Date().toISOString()
    const prefix = name ? `[${name}]` : ''
    const levelStr = `[${logLevel.toUpperCase()}]`

    if (args.length === 0) {
      return [`${timestamp} ${levelStr}${prefix}`]
    }

    const first = args[0]
    if (typeof first === 'object' && first !== null) {
      // Object as first argument (structured logging)
      const message = args.length > 1 ? String(args[1]) : ''
      return [`${timestamp} ${levelStr}${prefix} ${message}`, first]
    }

    // String message
    return [`${timestamp} ${levelStr}${prefix}`, ...args]
  }

  return {
    debug(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.debug) {
        console.debug(...format('debug', args))
      }
    },

    info(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.info) {
        console.info(...format('info', args))
      }
    },

    warn(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.warn) {
        console.warn(...format('warn', args))
      }
    },

    error(...args: unknown[]) {
      if (minLevel <= LOG_LEVELS.error) {
        console.error(...format('error', args))
      }
    },

    child(bindings: Record<string, unknown>): Logger {
      // Create a child logger with merged name
      const childName = name
        ? `${name}:${Object.values(bindings).join(':')}`
        : Object.values(bindings).join(':')

      return createConsoleLogger({
        ...config,
        name: childName,
      })
    },
  }
}
