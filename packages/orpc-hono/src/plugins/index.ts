/**
 * @outscope/orpc-hono plugins
 *
 * This module exports all built-in plugins for extending framework functionality.
 */

// Plugin types
export type { Plugin, PluginFactory, PluginContext, AppConfig, OutscopeApp, ServerInfo, ErrorHandler } from './types'

// CORS plugin
export { corsPlugin } from './cors'
export type { CORSPluginOptions } from './cors'

// Logger plugin
export { loggerPlugin } from './logger'
export type { LoggerPluginOptions, RequestLogInfo } from './logger'

// OpenAPI plugin
export { openapiPlugin } from './openapi'
export type { OpenAPIPluginOptions } from './openapi'

// Error handler plugin
export { errorHandlerPlugin } from './error-handler'
export type { ErrorHandlerPluginOptions, ErrorResponse } from './error-handler'
