/**
 * @outscope/nova-fn
 *
 * Lightweight functional oRPC integration for Hono framework.
 * Pure functions, zero decorators, minimal overhead.
 *
 * @example
 * ```typescript
 * import { createApp, handle, corsPlugin } from '@outscope/nova-fn'
 *
 * const userHandlers = defineHandlers(routes.user, {
 *   get: handle.auth(async (input, ctx) => {
 *   return userService.getById(input.id)
 *   }),
 * })
 *
 * const app = await createApp({
 *   routes,
 *   access,
 *   handlers: { user: userHandlers },
 *   plugins: [corsPlugin({ origins: ['http://localhost:3000'] })],
 * })
 *
 * app.listen(3000)
 * ```
 */

// ============================================================================
// Core
// ============================================================================

export { createApp } from './core/create-app'
export type { AppConfig, OutscopeApp, ErrorHandler } from './core/create-app'
export { ORPCHono } from './core/orpc-hono'
export type { ApplyHandlersOptions } from './core/orpc-hono'

// ============================================================================
// Functional API
// ============================================================================

export { defineHandlers, handle } from './functional/define-handlers'
export type {
  HandlerDef,
  HandlerMap,
} from './functional/define-handlers'
export { defineAccess, resolveAccessPolicy } from './domain/access'

// ============================================================================
// Plugins
// ============================================================================

export {
  corsPlugin,
  loggerPlugin,
  openapiPlugin,
  errorHandlerPlugin,
} from './plugins'

export type {
  Plugin,
  PluginFactory,
  PluginContext,
  ServerInfo,
  CORSPluginOptions,
  LoggerPluginOptions,
  OpenAPIPluginOptions,
  ErrorHandlerPluginOptions,
  RequestLogInfo,
  ErrorResponse,
} from './plugins'

// ============================================================================
// Context
// ============================================================================

export { defaultContextFactory } from './domain/context'

export type {
  BaseORPCContext,
  AuthContext,
  AuthenticatedContext,
  ContextFactory,
} from './domain/context'

// ============================================================================
// Logger
// ============================================================================

export {
  createLogger,
  getLogger,
  setLogger,
  initLogger,
  createPinoLogger,
  createConsoleLogger,
} from './infrastructure/logger'

export type { Logger, LoggerConfig } from './infrastructure/logger'

// ============================================================================
// Errors
// ============================================================================

export {
  ORPCHonoError,
  NotAControllerError,
  MissingRouteMetadataError,
  UnsupportedHttpMethodError,
  InvalidProcedureError,
  MissingHandlerError,
  ProcedureExecutionError,
  ErrorCode,
  ErrorCodeStatus,
  isORPCHonoError,
  toORPCHonoError,
  createError,
  normalizeError,
  withErrorHandling,
} from './domain/errors'

// ============================================================================
// Types
// ============================================================================

export type {
  ORPCHonoOptions,
  ImplementationMetadata,
  ORPCMetadata,
  WithORPCMetadata,
  ProcedureHandler,
  ProcedureContext,
  HttpMethod,
  RouteMetadata,
  HonoMiddleware,
} from './domain/types'

export type {
  AccessConfig,
  AccessPolicy,
  AccessMetadata,
  EndpointAccessMetadata,
  ResolvedAccessPolicy,
} from './domain/access'

// ============================================================================
// Utilities
// ============================================================================

export {
  extractToken,
  extractBearerToken,
  extractCookieToken,
  attachPrismaLogging,
  createSqlFormatter,
} from './utils'

export type {
  TokenExtractionResult,
  ExtractTokenOptions,
  TokenExtractionContext,
  PrismaClientLike,
  PrismaLoggingOptions,
} from './utils'

// ============================================================================
// Re-exports from oRPC
// ============================================================================

export { implement } from '@orpc/server'
