/**
 * @outscope/orpc-hono
 *
 * Type-safe oRPC integration for Hono framework with decorator-based controllers.
 * Built with clean architecture principles for maintainability and extensibility.
 *
 * @example
 * ```typescript
 * import { createApp, corsPlugin, loggerPlugin, openapiPlugin } from '@outscope/orpc-hono'
 * import { contract } from './contracts'
 *
 * const app = await createApp({
 *   contract,
 *   controllers: 'src/features/**\/*.controller.ts',
 *   plugins: [
 *     corsPlugin({ origins: ['http://localhost:3000'] }),
 *     loggerPlugin({ level: 'debug', pretty: true }),
 *     openapiPlugin({ title: 'My API', version: '1.0.0' }),
 *   ],
 * })
 *
 * app.listen(3000)
 * ```
 */

// ============================================================================
// Core
// ============================================================================

/** Main application factory function */
export { createApp } from './core/create-app'

/** Low-level ORPCHono class for advanced usage */
export { ORPCHono } from './core/orpc-hono'

// ============================================================================
// Decorators
// ============================================================================

export { Controller, Implement, Middleware, CatchErrors } from './infrastructure/decorators'

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
  AppConfig,
  OutscopeApp,
  ServerInfo,
  ErrorHandler,
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
// Controller Loader
// ============================================================================

export {
  loadControllers,
  instantiateControllers,
  loadAndInstantiateControllers,
} from './application/controller-loader'

export type {
  ControllerClass,
  ControllerLoaderOptions,
  DependencyContainer,
} from './application/controller-loader'

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
  // Error classes
  ORPCHonoError,
  NotAControllerError,
  MissingRouteMetadataError,
  UnsupportedHttpMethodError,
  InvalidProcedureError,
  MissingHandlerError,
  ProcedureExecutionError,
  // Error codes
  ErrorCode,
  ErrorCodeStatus,
  // Error utilities
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

// ============================================================================
// Utilities
// ============================================================================

export {
  // Auth utilities
  extractToken,
  extractBearerToken,
  extractCookieToken,
  // Prisma utilities
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
