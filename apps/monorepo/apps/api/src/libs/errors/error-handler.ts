import { ORPCError } from '@orpc/server'
import { createLogger } from '@outscope/orpc-hono'

const logger = createLogger({ level: 'debug', pretty: true })

/**
 * Error codes for better client-side error handling
 */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Error messages mapped to codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.FORBIDDEN]: 'Forbidden',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.CONFLICT]: 'Resource conflict',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
}

/**
 * Create a standardized error response
 */
export function createError(code: ErrorCode, message?: string, data?: unknown): never {
  const errorMessage = message || ErrorMessages[code]

  logger.error({ code, message: errorMessage, data }, 'Error occurred')

  throw new ORPCError(code, {
    message: errorMessage,
    data,
  })
}

/**
 * Handle errors in controllers
 * Converts generic errors into ORPCError with proper structure
 */
export function handleControllerError(error: unknown, context?: string): never {
  // If already an ORPCError, re-throw it
  if (error instanceof ORPCError) {
    throw error
  }

  // Extract error message
  let message = 'An unexpected error occurred'
  let details: unknown = undefined

  if (error instanceof Error) {
    message = error.message

    // Check for specific error patterns
    if (message.includes('not found')) {
      throw new ORPCError('NOT_FOUND', {
        message,
        data: { context },
      })
    }

    if (message.includes('already exists') || message.includes('duplicate')) {
      throw new ORPCError('CONFLICT', {
        message,
        data: { context },
      })
    }

    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      throw new ORPCError('UNAUTHORIZED', {
        message,
        data: { context },
      })
    }

    if (message.includes('forbidden') || message.includes('not allowed')) {
      throw new ORPCError('FORBIDDEN', {
        message,
        data: { context },
      })
    }

    // Check for validation errors (Zod/Prisma)
    if ('code' in error && (error as any).code === 'VALIDATION_ERROR') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Validation error',
        data: { context, details: error },
      })
    }

    details = {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }

  // Log the error
  logger.error({ error, context, message }, 'Unhandled error in controller')

  // Default to internal server error
  throw new ORPCError('INTERNAL_SERVER_ERROR', {
    message,
    data: {
      context,
      ...(process.env.NODE_ENV === 'development' && { details }),
    },
  })
}

/**
 * Async error handler wrapper for controller methods
 */
export function asyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleControllerError(error, context)
    }
  }) as T
}
