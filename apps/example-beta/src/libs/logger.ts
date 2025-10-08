import pino, { type Logger, type LoggerOptions } from 'pino'

export type AppLogger = Logger

let globalLogger: Logger | undefined

export interface LoggerConfig extends LoggerOptions {
  level?: string
  pretty?: boolean
}

export function createLogger(config?: LoggerConfig): Logger {
  const options: LoggerOptions = {
    level: config?.level || process.env.LOG_LEVEL || 'info',
    ...(config || {}),
  }

  // Add pretty printing in development, but do not override if transport is already provided
  if (
    !options.transport &&
    config?.pretty !== false &&
    process.env.NODE_ENV !== 'production'
  ) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  }

  return pino(options)
}

export function initLogger(config?: LoggerConfig): Logger {
  globalLogger = createLogger(config)
  return globalLogger
}

export function getLogger(): Logger {
  if (!globalLogger) {
    // Auto-initialize with defaults
    globalLogger = createLogger()
  }
  return globalLogger
}

export const logger = new Proxy({} as Logger, {
  get(_, prop) {
    const log = getLogger()
    const value = log[prop as keyof Logger]
    return typeof value === 'function' ? value.bind(log) : value
  },
})
