import type { Context } from 'hono'
import type { Plugin, PluginFactory } from './types'
import type { BaseORPCContext } from '../domain/context'
import { toORPCHonoError, isORPCHonoError } from '../domain/errors'

/**
 * Error handler plugin options
 */
export interface ErrorHandlerPluginOptions {
  /**
   * Include stack trace in error responses (development only)
   * @default false
   */
  includeStack?: boolean

  /**
   * Custom error handler function
   */
  onError?: (error: unknown, context: Context) => void

  /**
   * Transform error before sending response
   */
  transformError?: (error: unknown) => {
    message: string
    code: string
    status: number
    data?: unknown
  }

  /**
   * Log errors
   * @default true
   */
  logErrors?: boolean
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string
  code: string
  status: number
  data?: unknown
  stack?: string
}

/**
 * Create an error handler plugin for centralized error handling.
 *
 * This plugin:
 * - Catches all unhandled errors
 * - Formats errors into a consistent response structure
 * - Optionally logs errors
 * - Supports custom error transformation
 *
 * @param options - Error handler configuration options
 * @returns A plugin that adds error handling
 *
 * @example
 * ```typescript
 * const app = await createApp({
 *   contract,
 *   controllers: [...],
 *   plugins: [
 *     errorHandlerPlugin({
 *       includeStack: process.env.NODE_ENV !== 'production',
 *       onError: (error) => {
 *         // Send to error tracking service
 *         Sentry.captureException(error)
 *       },
 *     }),
 *   ],
 * })
 * ```
 */
export const errorHandlerPlugin: PluginFactory<ErrorHandlerPluginOptions, BaseORPCContext> = (
  options = {}
) => {
  const { includeStack = false, onError, transformError, logErrors = true } = options

  return {
    name: 'error-handler',

    onInit({ app }) {
      app.onError((error, c) => {
        // Log the error
        if (logErrors) {
          console.error('Unhandled error:', error)
        }

        // Call custom error handler
        onError?.(error, c)

        // Transform error
        let errorResponse: ErrorResponse

        if (transformError) {
          const transformed = transformError(error)
          errorResponse = {
            error: transformed.message,
            code: transformed.code,
            status: transformed.status,
            data: transformed.data,
          }
        } else if (isORPCHonoError(error)) {
          errorResponse = {
            error: error.message,
            code: error.code,
            status: error.status,
          }
        } else {
          const orpcError = toORPCHonoError(error)
          errorResponse = {
            error: orpcError.message,
            code: orpcError.code,
            status: orpcError.status,
          }
        }

        // Include stack trace in development
        if (includeStack && error instanceof Error) {
          errorResponse.stack = error.stack
        }

        return c.json(errorResponse, errorResponse.status as any)
      })
    },
  }
}
