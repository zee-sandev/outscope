import type { Logger, LoggerConfig } from './index'

/**
 * Create a Pino-based logger.
 *
 * This adapter uses the Pino logging library for high-performance structured logging.
 * Requires `pino` and optionally `pino-pretty` packages to be installed.
 *
 * @param config - Logger configuration
 * @returns Logger instance
 * @throws Error if Pino is not available
 */
export function createPinoLogger(config?: LoggerConfig): Logger {
  // Dynamic import to avoid bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pino = require('pino')

  const { level = 'info', pretty = false, transport, name } = config ?? {}

  const pinoOptions: Record<string, unknown> = {
    level,
    name,
  }

  // Configure transport for pretty printing
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

  const pinoLogger = pino(pinoOptions)

  return createLoggerFromPino(pinoLogger)
}

/**
 * Create a Logger adapter from a Pino instance
 */
function createLoggerFromPino(pinoLogger: any): Logger {
  return {
    debug(objOrMessage: object | string, messageOrArgs?: string | unknown) {
      if (typeof objOrMessage === 'string') {
        pinoLogger.debug(objOrMessage)
      } else {
        pinoLogger.debug(objOrMessage, messageOrArgs as string)
      }
    },

    info(objOrMessage: object | string, messageOrArgs?: string | unknown) {
      if (typeof objOrMessage === 'string') {
        pinoLogger.info(objOrMessage)
      } else {
        pinoLogger.info(objOrMessage, messageOrArgs as string)
      }
    },

    warn(objOrMessage: object | string, messageOrArgs?: string | unknown) {
      if (typeof objOrMessage === 'string') {
        pinoLogger.warn(objOrMessage)
      } else {
        pinoLogger.warn(objOrMessage, messageOrArgs as string)
      }
    },

    error(objOrMessage: object | string, messageOrArgs?: string | unknown) {
      if (typeof objOrMessage === 'string') {
        pinoLogger.error(objOrMessage)
      } else {
        pinoLogger.error(objOrMessage, messageOrArgs as string)
      }
    },

    child(bindings: Record<string, unknown>): Logger {
      return createLoggerFromPino(pinoLogger.child(bindings))
    },
  }
}
