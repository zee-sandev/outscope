import type { Hono, Context } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import type { BaseORPCContext, ContextFactory } from '../domain/context'
import type { ControllerClass } from '../application/controller-loader'

/**
 * Plugin system types for @outscope/orpc-hono
 */

/**
 * Configuration passed to createApp
 */
export interface AppConfig<TContext extends BaseORPCContext = BaseORPCContext> {
  /**
   * Root contract router defining the API structure
   */
  contract: AnyContractRouter

  /**
   * Controllers to register.
   * Can be a glob pattern string (e.g., 'src/features/**\/*.controller.ts')
   * or an array of controller classes.
   */
  controllers: string | ControllerClass[]

  /**
   * oRPC producer/implementer instance.
   * If not provided, one will be created from the contract.
   */
  producer?: unknown

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
  /** The contract router */
  contract: AnyContractRouter
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
   * Called after all controllers are registered.
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
   * The contract used to create the application
   */
  contract: AnyContractRouter

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
   * Programmatically register a controller (useful for testing)
   * @param controller - Controller instance to register
   */
  registerController(controller: unknown): Promise<void>

  /**
   * Gracefully shutdown the application
   */
  shutdown(): Promise<void>
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: unknown, context: Context) => void | Response | Promise<void | Response>
