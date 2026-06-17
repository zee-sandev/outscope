import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import { ORPCHono } from './orpc-hono.js'
import { defaultContextFactory } from '../domain/context.js'
import type { BaseORPCContext, ContextFactory } from '../domain/context.js'
import type { HandlerMap } from '../functional/define-handlers.js'
import type { Plugin, PluginContext, ServerInfo } from '../plugins/types.js'
import type { HonoMiddleware } from '../domain/types.js'
import type { AccessConfig } from '../domain/access.js'

/**
 * Application configuration for the lite/functional version
 */
export interface AppConfig<TContext extends BaseORPCContext = BaseORPCContext> {
  /** Root route router */
  routes: AnyContractRouter
  /** Global access policy registry */
  access: AccessConfig
  /** Handler map */
  handlers: HandlerMap
  /** Factory function to create request context */
  createContext?: ContextFactory<TContext>
  /** Prefix for OpenAPI/REST routes */
  apiPrefix?: string
  /** Prefix for oRPC binary routes */
  rpcPrefix?: string
  /** Plugins to apply */
  plugins?: Plugin[]
  /** Global error handler */
  onError?: (error: Error, c: Context) => void
  /** Global Hono middleware interceptors */
  interceptors?: HonoMiddleware[]
}

/**
 * Error handler type
 */
export type ErrorHandler = (error: Error, c: Context) => void

/**
 * Application wrapper returned by createApp
 */
export interface OutscopeApp<TContext extends BaseORPCContext = BaseORPCContext> {
  /** Underlying Hono instance */
  hono: Hono
  /** oRPC router structure */
  router: any
  /** Route router */
  routes: AnyContractRouter
  /** Active plugins */
  plugins: Plugin[]
  /** Start Node.js server */
  listen(port: number, callback?: (info: ServerInfo) => void): void
  /** Start Bun server */
  serve(options: { port: number; hostname?: string }): void
  /** Edge runtime fetch handler */
  fetch(request: Request, env?: unknown, executionCtx?: unknown): Promise<Response>
  /** Get cached OpenAPI spec */
  getOpenAPISpec(): Promise<object>
  /** Register additional handlers at runtime */
  registerHandlers(handlers: HandlerMap): Promise<void>
  /** Graceful shutdown */
  shutdown(): Promise<void>
}

const DEFAULTS = {
  apiPrefix: '/api',
  rpcPrefix: '/rpc',
} as const

/**
 * Create a new Outscope application with functional handlers.
 *
 * No decorators, no reflect-metadata, no glob loading.
 * Just pure functions and explicit registration.
 *
 * @example
 * ```typescript
 * import { createApp, corsPlugin } from '@outscope/nova-fn'
 *
 * const app = await createApp({
 *   routes,
 *   access,
 *   handlers: {
 *     auth: authHandlers,
 *     projects: projectHandlers,
 *   },
 *   plugins: [corsPlugin({ origins: ['http://localhost:3000'] })],
 * })
 *
 * app.listen(3000)
 * ```
 */
export async function createApp<TContext extends BaseORPCContext = BaseORPCContext>(
  config: AppConfig<TContext>,
): Promise<OutscopeApp<TContext>> {
  const {
    routes,
    handlers,
    access,
    createContext = defaultContextFactory as ContextFactory<TContext>,
    apiPrefix = DEFAULTS.apiPrefix,
    rpcPrefix = DEFAULTS.rpcPrefix,
    plugins = [],
    onError,
    interceptors = [],
  } = config

  // 1. Create Hono app
  const app = new Hono()

  // 2. Apply global error handler
  if (onError) {
    app.onError((error, c) => {
      onError(error, c)
      return c.json({ error: 'Internal Server Error' }, 500)
    })
  }

  // 3. Initialize plugins (onInit phase)
  const initContext = {
    app,
    routes,
    config,
  } as Omit<PluginContext, 'router'>

  for (const plugin of plugins) {
    if (plugin.onInit) {
      await plugin.onInit(initContext)
    }
  }

  // 4. Apply plugin middleware
  for (const plugin of plugins) {
    if (plugin.middleware) {
      app.use('*', plugin.middleware as (c: Context, next: Next) => Promise<void | Response>)
    }
  }

  // 5. Apply global interceptors
  for (const interceptor of interceptors) {
    app.use('*', interceptor)
  }

  // 6. Setup ORPCHono and register handlers
  const orpcHono = new ORPCHono({
    routes,
    access,
  })

  const router = await orpcHono.applyHandlers(app, { handlers })

  // 7. Create handlers for API and RPC routes
  const setupHandlers = async () => {
    let OpenAPIHandler: any
    let RPCHandler: any
    let CORSPlugin: any
    let onErrorInterceptor: any

    try {
      const openapiFetch = await import('@orpc/openapi/fetch')
      OpenAPIHandler = openapiFetch.OpenAPIHandler
    } catch {
      // OpenAPI handler not available
    }

    try {
      const serverFetch = await import('@orpc/server/fetch')
      RPCHandler = serverFetch.RPCHandler
    } catch {
      // RPC handler not available
    }

    try {
      const serverPlugins = await import('@orpc/server/plugins')
      CORSPlugin = serverPlugins.CORSPlugin
    } catch {
      // CORS plugin not available
    }

    try {
      const server = await import('@orpc/server')
      onErrorInterceptor = server.onError
    } catch {
      // onError not available
    }

    const handlerOptions = {
      plugins: CORSPlugin ? [new CORSPlugin()] : [],
      interceptors: onErrorInterceptor
        ? [onErrorInterceptor((error: unknown) => console.error('oRPC Error:', error))]
        : [],
    }

    if (OpenAPIHandler) {
      const openAPIHandler = new OpenAPIHandler(router, handlerOptions)

      app.use(`${apiPrefix}/*`, async (c: Context, next: Next) => {
        const context = await createContext({ honoContext: c })
        const { matched, response } = await openAPIHandler.handle(c.req.raw, {
          prefix: apiPrefix,
          context,
        })

        if (matched) {
          return c.newResponse(response.body, response)
        }

        await next()
      })
    }

    if (RPCHandler) {
      const rpcHandler = new RPCHandler(router, handlerOptions)

      app.use(`${rpcPrefix}/*`, async (c: Context, next: Next) => {
        const context = await createContext({ honoContext: c })
        const { matched, response } = await rpcHandler.handle(c.req.raw, {
          prefix: rpcPrefix,
          context,
        })

        if (matched) {
          return c.newResponse(response.body, response)
        }

        await next()
      })
    }
  }

  await setupHandlers()

  // 8. Call plugins (onReady phase)
  const readyContext = {
    app,
    routes,
    router,
    config,
  } as PluginContext

  for (const plugin of plugins) {
    if (plugin.onReady) {
      await plugin.onReady(readyContext)
    }
  }

  // 9. Create OpenAPI spec generator
  let cachedOpenAPISpec: object | null = null

  const getOpenAPISpec = async (): Promise<object> => {
    if (cachedOpenAPISpec) {
      return cachedOpenAPISpec
    }

    try {
      const { OpenAPIGenerator } = await import('@orpc/openapi')
      const { ZodToJsonSchemaConverter } = await import('@orpc/zod')

      const generator = new OpenAPIGenerator({
        schemaConverters: [new ZodToJsonSchemaConverter()],
      })

      cachedOpenAPISpec = await generator.generate(routes, {
        info: {
          title: 'API',
          version: '1.0.0',
        },
        servers: [
          {
            url: apiPrefix,
            description: 'API Server',
          },
        ],
      })

      return cachedOpenAPISpec
    } catch {
      return {
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        paths: {},
      }
    }
  }

  // 10. Build OutscopeApp wrapper
  const outscopeApp: OutscopeApp<TContext> = {
    hono: app,
    router,
    routes,
    plugins,

    listen(port: number, callback?: (info: ServerInfo) => void) {
      import('@hono/node-server')
        .then(({ serve }) => {
          serve(
            {
              fetch: app.fetch,
              port,
            },
            (info) => {
              for (const plugin of plugins) {
                plugin.onStart?.({ port: info.port })
              }
              callback?.({ port: info.port })
            },
          )
        })
        .catch((error) => {
          console.error('Failed to start server. Install @hono/node-server:', error.message)
        })
    },

    serve(options: { port: number; hostname?: string }) {
      const bunServe = (globalThis as any).Bun?.serve
      if (bunServe) {
        bunServe({
          fetch: app.fetch,
          port: options.port,
          hostname: options.hostname,
        })

        for (const plugin of plugins) {
          plugin.onStart?.({ port: options.port })
        }
      } else {
        console.error('Bun.serve is not available. Use listen() for Node.js.')
      }
    },

    fetch: app.fetch.bind(app) as OutscopeApp<TContext>['fetch'],

    getOpenAPISpec,

    async registerHandlers(additionalHandlers: HandlerMap) {
      const additionalRouter = await orpcHono.applyHandlers(app, {
        handlers: additionalHandlers,
      })
      Object.assign(router, additionalRouter)
    },

    async shutdown() {
      for (const plugin of plugins) {
        if (plugin.onShutdown) {
          await plugin.onShutdown()
        }
      }
    },
  }

  return outscopeApp
}
