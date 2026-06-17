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

export { createApp } from './core/create-app.js'
export type { AppConfig, OutscopeApp, ErrorHandler } from './core/create-app.js'
export { ORPCHono } from './core/orpc-hono.js'
export type { ApplyHandlersOptions } from './core/orpc-hono.js'

// ============================================================================
// Functional API
// ============================================================================

export {
  defineHandle,
  defineHandlers,
  handle,
} from './functional/define-handlers.js'
export type {
  DefinedHandle,
  HandlerDef,
  HandlerMap,
  PermissionHandle,
  PlainHandle,
} from './functional/define-handlers.js'
export {
  AccessPolicyCycleError,
  MissingAccessPolicyError,
  defineAccess,
  resolveAccessPolicy,
} from './domain/access.js'

// ============================================================================
// Plugins
// ============================================================================

export {
  corsPlugin,
  loggerPlugin,
  openapiPlugin,
  errorHandlerPlugin,
} from './plugins/index.js'

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
} from './plugins/index.js'

// ============================================================================
// Context
// ============================================================================

export { defaultContextFactory } from './domain/context.js'

export type {
  BaseORPCContext,
  AuthContext,
  AuthenticatedContext,
  ContextFactory,
} from './domain/context.js'

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
} from './infrastructure/logger/index.js'

export type { Logger, LoggerConfig } from './infrastructure/logger/index.js'

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
} from './domain/errors.js'

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
} from './domain/types.js'

export type {
  AccessConfig,
  AccessMiddlewareFactory,
  AccessPolicy,
  AccessPolicyKind,
  AccessMetadata,
  EndpointAccessMetadata,
  ResolvedAccessPolicy,
  AccessProducerFactory,
} from './domain/access.js'

// ============================================================================
// Utilities
// ============================================================================

export {
  extractToken,
  extractBearerToken,
  extractCookieToken,
  attachPrismaLogging,
  createSqlFormatter,
} from './utils/index.js'

export type {
  TokenExtractionResult,
  ExtractTokenOptions,
  TokenExtractionContext,
  PrismaClientLike,
  PrismaLoggingOptions,
} from './utils/index.js'

// ============================================================================
// Re-exports from oRPC
// ============================================================================

export { implement } from '@orpc/server'
