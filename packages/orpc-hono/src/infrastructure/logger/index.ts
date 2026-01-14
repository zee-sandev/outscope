/**
 * Logger infrastructure for @outscope/orpc-hono
 *
 * Provides a pluggable logging system that:
 * - Uses Pino when available (Node.js)
 * - Falls back to console logging (edge runtimes)
 * - Supports structured logging
 */

import { createPinoLogger } from './pino-adapter'
import { createConsoleLogger } from './console-adapter'

/**
 * Logger interface
 */
export interface Logger {
  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void
  debug(obj: object, message?: string): void

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void
  info(obj: object, message?: string): void

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void
  warn(obj: object, message?: string): void

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void
  error(obj: object, message?: string): void

  /**
   * Create a child logger with additional context
   */
  child(bindings: Record<string, unknown>): Logger
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * Log level
   * @default 'info'
   */
  level?: 'debug' | 'info' | 'warn' | 'error'

  /**
   * Enable pretty printing (development)
   * @default false
   */
  pretty?: boolean

  /**
   * Pino transport configuration
   */
  transport?: {
    target: string
    options?: Record<string, unknown>
  }

  /**
   * Logger name
   */
  name?: string
}

/**
 * Create a logger instance.
 *
 * Automatically selects the best available logging implementation:
 * - Pino in Node.js environments
 * - Console in edge runtimes
 *
 * @param config - Logger configuration
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({ level: 'debug', pretty: true })
 *
 * logger.info({ user: 'john' }, 'User logged in')
 * logger.error('Something went wrong')
 * ```
 */
export function createLogger(config?: LoggerConfig): Logger {
  // Try to use Pino if available
  try {
    return createPinoLogger(config)
  } catch {
    // Fall back to console logger
    return createConsoleLogger(config)
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null

/**
 * Get the global logger instance.
 * Creates a new one if it doesn't exist.
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createLogger()
  }
  return globalLogger
}

/**
 * Set the global logger instance.
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger
}

/**
 * Initialize the global logger with configuration.
 *
 * @param config - Logger configuration
 * @returns The initialized logger
 */
export function initLogger(config?: LoggerConfig): Logger {
  globalLogger = createLogger(config)
  return globalLogger
}

// Re-export adapters
export { createPinoLogger } from './pino-adapter'
export { createConsoleLogger } from './console-adapter'
