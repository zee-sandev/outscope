/**
 * @outscope/nova plugins
 *
 * This module exports all built-in plugins for extending framework functionality.
 */

// Plugin types
export type { Plugin, PluginFactory, PluginContext, AppConfig, OutscopeApp, ServerInfo, ErrorHandler } from './types.js'

// CORS plugin
export { corsPlugin } from './cors.js'
export type { CORSPluginOptions } from './cors.js'

// Logger plugin
export { loggerPlugin } from './logger.js'
export type { LoggerPluginOptions, RequestLogInfo } from './logger.js'

// OpenAPI plugin
export { openapiPlugin } from './openapi.js'
export type { OpenAPIPluginOptions } from './openapi.js'

// Error handler plugin
export { errorHandlerPlugin } from './error-handler.js'
export type { ErrorHandlerPluginOptions, ErrorResponse } from './error-handler.js'
