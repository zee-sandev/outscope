/**
 * Custom error classes for oRPC-Hono integration
 */

/**
 * Standard error codes mapping to HTTP semantics
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * Map error codes to HTTP status codes
 */
export const ErrorCodeStatus: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
}

/**
 * Base error class for all oRPC-Hono errors
 */
export abstract class ORPCHonoError extends Error {
  /**
   * HTTP status code for this error
   */
  abstract readonly status: number

  /**
   * Machine-readable error code
   */
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /**
   * Convert error to JSON response format
   */
  toJSON(): { error: string; code: string } {
    return {
      error: this.message,
      code: this.code,
    }
  }
}

/**
 * Error thrown when a class is not decorated with @Controller()
 */
export class NotAControllerError extends ORPCHonoError {
  readonly status = 500
  readonly code = 'NOT_A_CONTROLLER'

  constructor(className: string) {
    super(`Class ${className} is not decorated with @Controller()`)
  }
}

/**
 * Error thrown when a contract doesn't have required route metadata
 */
export class MissingRouteMetadataError extends ORPCHonoError {
  readonly status = 500
  readonly code = 'MISSING_ROUTE_METADATA'

  constructor() {
    super('Contract does not have route metadata')
  }
}

/**
 * Error thrown when an unsupported HTTP method is used
 */
export class UnsupportedHttpMethodError extends ORPCHonoError {
  readonly status = 500
  readonly code = 'UNSUPPORTED_HTTP_METHOD'

  constructor(method: string) {
    super(`Unsupported HTTP method: ${method}`)
  }
}

/**
 * Error thrown when a procedure implementation is invalid
 */
export class InvalidProcedureError extends ORPCHonoError {
  readonly status = 500
  readonly code = 'INVALID_PROCEDURE'

  constructor(details: string) {
    super(`Invalid procedure: ${details}`)
  }
}

/**
 * Error thrown when contract handler is not available
 */
export class MissingHandlerError extends ORPCHonoError {
  readonly status = 500
  readonly code = 'MISSING_HANDLER'

  constructor(implementerType: string) {
    super(`Contract does not support .handler() method. Implementer type: ${implementerType}`)
  }
}

/**
 * Error thrown during procedure execution
 */
export class ProcedureExecutionError extends ORPCHonoError {
  readonly status: number
  readonly code: string
  cause?: unknown

  constructor(
    message: string,
    options?: {
      status?: number
      code?: string
      cause?: unknown
    }
  ) {
    super(message)
    this.status = options?.status ?? 500
    this.code = options?.code ?? 'PROCEDURE_EXECUTION_ERROR'
    if (options?.cause) {
      this.cause = options.cause
    }
  }
}

/**
 * Type guard to check if an error is an ORPCHonoError
 */
export function isORPCHonoError(error: unknown): error is ORPCHonoError {
  return error instanceof ORPCHonoError
}

/**
 * Convert any error to an ORPCHonoError
 */
export function toORPCHonoError(error: unknown): ORPCHonoError {
  if (isORPCHonoError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new ProcedureExecutionError(error.message, {
      cause: error,
    })
  }

  if (typeof error === 'string') {
    return new ProcedureExecutionError(error)
  }

  return new ProcedureExecutionError('An unknown error occurred', {
    cause: error,
  })
}

/**
 * Create and throw a standardized error.
 *
 * @param code - Error code from ErrorCode enum
 * @param message - Optional custom message
 * @param data - Optional additional data
 * @throws ORPCHonoError
 *
 * @example
 * ```typescript
 * if (!user) {
 *   createError(ErrorCode.NOT_FOUND, 'User not found')
 * }
 * ```
 */
export function createError(code: ErrorCode, message?: string, data?: unknown): never {
  const status = ErrorCodeStatus[code]
  const defaultMessages: Record<ErrorCode, string> = {
    [ErrorCode.BAD_REQUEST]: 'Bad request',
    [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
    [ErrorCode.FORBIDDEN]: 'Forbidden',
    [ErrorCode.NOT_FOUND]: 'Not found',
    [ErrorCode.CONFLICT]: 'Conflict',
    [ErrorCode.VALIDATION_ERROR]: 'Validation error',
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  }

  throw new ProcedureExecutionError(message ?? defaultMessages[code], {
    status,
    code,
    cause: data,
  })
}

/**
 * Normalize any error to a consistent format.
 *
 * @param error - Any error value
 * @param context - Optional context description
 * @returns Normalized ORPCHonoError
 */
export function normalizeError(error: unknown, context?: string): ORPCHonoError {
  if (isORPCHonoError(error)) {
    return error
  }

  if (error instanceof Error) {
    // Pattern matching for common error types
    const message = error.message.toLowerCase()

    if (message.includes('not found') || message.includes('does not exist')) {
      return new ProcedureExecutionError(error.message, {
        status: 404,
        code: ErrorCode.NOT_FOUND,
        cause: error,
      })
    }

    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return new ProcedureExecutionError(error.message, {
        status: 401,
        code: ErrorCode.UNAUTHORIZED,
        cause: error,
      })
    }

    if (message.includes('forbidden') || message.includes('not allowed')) {
      return new ProcedureExecutionError(error.message, {
        status: 403,
        code: ErrorCode.FORBIDDEN,
        cause: error,
      })
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return new ProcedureExecutionError(error.message, {
        status: 422,
        code: ErrorCode.VALIDATION_ERROR,
        cause: error,
      })
    }

    if (message.includes('conflict') || message.includes('already exists')) {
      return new ProcedureExecutionError(error.message, {
        status: 409,
        code: ErrorCode.CONFLICT,
        cause: error,
      })
    }

    return new ProcedureExecutionError(error.message, {
      cause: error,
    })
  }

  const errorMessage = context
    ? `Error in ${context}: ${String(error)}`
    : String(error) || 'An unknown error occurred'

  return new ProcedureExecutionError(errorMessage, {
    cause: error,
  })
}

/**
 * Wrap an async function with error handling.
 *
 * @param fn - Async function to wrap
 * @param context - Optional context for error messages
 * @returns Wrapped function that normalizes errors
 *
 * @example
 * ```typescript
 * const safeGetUser = withErrorHandling(
 *   async (id: string) => userRepository.findById(id),
 *   'getUserById'
 * )
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw normalizeError(error, context)
    }
  }) as T
}
