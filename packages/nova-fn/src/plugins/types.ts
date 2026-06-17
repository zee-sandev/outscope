import type { Hono, Context } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import type { BaseORPCContext, ContextFactory } from '../domain/context.js'
import type { HandlerMap } from '../functional/define-handlers.js'
import type { AccessConfig } from '../domain/access.js'

/**
 * Plugin system types for @outscope/nova-fn
 */

/**
 * Configuration passed to createApp
 */
export interface AppConfig<TContext extends BaseORPCContext = BaseORPCContext> {
  /**
   * Root route router defining the API structure
   */
  routes: AnyContractRouter

  /**
   * Handler map defining all API implementations.
   * Supports nested modules: { auth: { register, login }, projects: { list, create } }
   */
  handlers: HandlerMap

  /**
   * Global access policy registry.
   */
  access: AccessConfig

  /**
   * Factory function to create request context.
   * Called for each incoming request.
   * @default defaultContextFactory
   */
  createContext?: ContextFactory<TContext>

  /**
   * URL prefix for OpenAPI/REST endpoints
   * @default '/api'
   */
  apiPrefix?: string

  /**
   * URL prefix for RPC endpoints
   * @default '/rpc'
   */
  rpcPrefix?: string

  /**
   * Plugins to apply to the application
   */
  plugins?: Plugin<TContext>[]

  /**
   * Global error handler
   */
  onError?: (error: unknown, context: Context) => void

  /**
   * Global Hono middleware interceptors
   */
  interceptors?: ((c: Context, next: () => Promise<void>) => Promise<void>)[]
}

/**
 * Context passed to plugin lifecycle hooks
 */
export interface PluginContext<TContext extends BaseORPCContext = BaseORPCContext> {
  /** The Hono application instance */
  app: Hono
  /** The route router */
  routes: AnyContractRouter
  /** The registered router (available after controller registration) */
  router: AnyContractRouter
  /** The original app configuration */
  config: AppConfig<TContext>
}

/**
 * Plugin interface for extending framework functionality
 */
export interface Plugin<TContext extends BaseORPCContext = BaseORPCContext> {
  /**
   * Unique plugin identifier
   */
  name: string

  /**
   * Called during app initialization, before routes are registered.
   * Use this to add Hono middleware or configure the app.
   */
  onInit?: (ctx: Omit<PluginContext<TContext>, 'router'>) => void | Promise<void>

  /**
   * Hono middleware to apply globally.
   * Applied after onInit and before controller registration.
   */
  middleware?: (c: Context, next: () => Promise<void>) => Promise<void | Response>

  /**
   * Called after all handlers are registered.
   * Use this to add additional routes like documentation.
   */
  onReady?: (ctx: PluginContext<TContext>) => void | Promise<void>

  /**
   * Called when the server starts listening.
   */
  onStart?: (info: { port: number }) => void

  /**
   * Called on graceful shutdown.
   */
  onShutdown?: () => void | Promise<void>
}

/**
 * Plugin factory function type for creating plugins with options
 */
export type PluginFactory<TOptions, TContext extends BaseORPCContext = BaseORPCContext> = (
  options: TOptions
) => Plugin<TContext>

/**
 * Server information returned after starting
 */
export interface ServerInfo {
  /** The port the server is listening on */
  port: number
  /** The hostname/address */
  hostname?: string
}

/**
 * Application wrapper returned by createApp
 */
export interface OutscopeApp<TContext extends BaseORPCContext = BaseORPCContext> {
  /**
   * The underlying Hono application instance
   */
  hono: Hono

  /**
   * The registered router containing all procedures
   */
  router: AnyContractRouter

  /**
   * The routes used to create the application
   */
  routes: AnyContractRouter

  /**
   * The registered plugins
   */
  plugins: Plugin<TContext>[]

  /**
   * Start the server on the specified port (Node.js)
   * @param port - Port number to listen on
   * @param callback - Optional callback when server starts
   */
  listen(port: number, callback?: (info: ServerInfo) => void): void

  /**
   * Start the server using Bun's serve function
   * @param options - Server options
   */
  serve(options: { port: number; hostname?: string }): void

  /**
   * Fetch handler for edge runtimes (Cloudflare Workers, etc.)
   * @param request - Incoming request
   * @param env - Environment bindings (optional)
   * @param executionCtx - Execution context (optional)
   */
  fetch: (request: Request, env?: unknown, executionCtx?: unknown) => Response | Promise<Response>

  /**
   * Get the generated OpenAPI specification
   */
  getOpenAPISpec(): Promise<object>

  /**
   * Programmatically register additional handlers at runtime
   * @param handlers - Handler map to register
   */
  registerHandlers(handlers: HandlerMap): Promise<void>

  /**
   * Gracefully shutdown the application
   */
  shutdown(): Promise<void>
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: unknown, context: Context) => void | Response | Promise<void | Response>
