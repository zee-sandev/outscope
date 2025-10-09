/**
 * @horn/orpc-hono
 *
 * Type-safe oRPC integration for Hono framework with decorator-based controllers.
 * Built with clean architecture principles for maintainability and extensibility.
 */

// Core
export { ORPCHono } from './core/orpc-hono'

// Decorators
export { Controller, Implement, Middleware } from './infrastructure/decorators'

// Types
export type {
  ORPCHonoOptions,
  ApplyMiddlewareOptions,
  ImplementationMetadata,
  ORPCMetadata,
  WithORPCMetadata,
  ProcedureHandler,
  ProcedureContext,
  HttpMethod,
  RouteMetadata,
  HonoMiddleware,
} from './domain/types'

// Errors
export {
  ORPCHonoError,
  NotAControllerError,
  MissingRouteMetadataError,
  UnsupportedHttpMethodError,
  InvalidProcedureError,
  MissingHandlerError,
  ProcedureExecutionError,
  isORPCHonoError,
  toORPCHonoError,
} from './domain/errors'

// Re-export commonly used oRPC utilities
export { implement } from '@orpc/server'
