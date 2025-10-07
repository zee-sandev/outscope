/**
 * Custom error classes for oRPC-Hono integration
 */

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
