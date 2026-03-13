import type { Context } from 'hono'
import type { Plugin, PluginFactory } from './types'
import type { BaseORPCContext } from '../domain/context'

/**
 * Logger plugin options
 */
export interface LoggerPluginOptions {
  /**
   * Log level
   * @default 'info'
   */
  level?: 'debug' | 'info' | 'warn' | 'error'

  /**
   * Enable pretty printing (for development)
   * @default false
   */
  pretty?: boolean

  /**
   * Pino transport configuration (Node.js only)
   */
  transport?: {
    target: string
    options?: Record<string, unknown>
  }

  /**
   * Custom log format function
   */
  format?: (info: RequestLogInfo) => string

  /**
   * Skip logging for certain paths
   */
  skip?: (path: string) => boolean
}

/**
 * Request log information
 */
export interface RequestLogInfo {
  method: string
  path: string
  status: number
  duration: number
  userAgent?: string
}

/**
 * Create a logger plugin for request logging.
 *
 * Uses Pino for logging in Node.js environments, falls back to console in edge runtimes.
 *
 * @param options - Logger configuration options
 * @returns A plugin that adds request logging middleware
 *
 * @example
 * ```typescript
 * const app = await createApp({
 *   contract,
 *   controllers: [...],
 *   plugins: [
 *     loggerPlugin({
 *       level: 'debug',
 *       pretty: true,
 *     }),
 *   ],
 * })
 * ```
 */
export const loggerPlugin: PluginFactory<LoggerPluginOptions, BaseORPCContext> = (options = {}) => {
  const { level = 'info', pretty = false, transport, format, skip } = options

  let logger: any = null

  // Try to initialize Pino logger
  const initLogger = async () => {
    try {
      const pino = await import('pino')

      const pinoOptions: any = {
        level,
      }

      if (pretty || transport) {
        pinoOptions.transport = transport ?? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      }

      logger = pino.default(pinoOptions)
    } catch {
      // Pino not available, use console fallback
      logger = createConsoleLogger(level)
    }
  }

  return {
    name: 'logger',

    async onInit({ app }) {
      await initLogger()

      app.use('*', async (c: Context, next: () => Promise<void>) => {
        const start = Date.now()
        const path = c.req.path
        const method = c.req.method

        // Check if we should skip this request
        if (skip?.(path)) {
          return next()
        }

        // Log request start
        logger.debug({ method, path }, 'Request started')

        await next()

        // Log request completion
        const duration = Date.now() - start
        const status = c.res.status

        const logInfo: RequestLogInfo = {
          method,
          path,
          status,
          duration,
          userAgent: c.req.header('user-agent'),
        }

        const message = format
          ? format(logInfo)
          : `${method} ${path} ${status} ${duration}ms`

        if (status >= 500) {
          logger.error(logInfo, message)
        } else if (status >= 400) {
          logger.warn(logInfo, message)
        } else {
          logger.info(logInfo, message)
        }
      })
    },

    onStart({ port }) {
      logger?.info({ port }, `Server started on port ${port}`)
    },
  }
}

/**
 * Create a console-based logger (edge-compatible fallback)
 */
function createConsoleLogger(level: string) {
  const levels = ['debug', 'info', 'warn', 'error']
  const minLevel = levels.indexOf(level)

  return {
    debug: minLevel <= 0 ? console.debug.bind(console) : () => {},
    info: minLevel <= 1 ? console.info.bind(console) : () => {},
    warn: minLevel <= 2 ? console.warn.bind(console) : () => {},
    error: minLevel <= 3 ? console.error.bind(console) : () => {},
  }
}
