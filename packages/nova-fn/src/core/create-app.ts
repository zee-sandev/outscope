import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import { ORPCHono } from './orpc-hono'
import { defaultContextFactory } from '../domain/context'
import type { BaseORPCContext, ContextFactory } from '../domain/context'
import type { OperationMap } from '../functional/define-operations'
import type { Plugin, PluginContext, ServerInfo } from '../plugins/types'
import type { HonoMiddleware } from '../domain/types'

/**
 * Application configuration for the lite/functional version
 */
export interface AppConfig<TContext extends BaseORPCContext = BaseORPCContext> {
  /** Root contract router */
  contract: AnyContractRouter
  /** oRPC producer (e.g., implement(contract).$context<ORPCContext>()) */
  producer?: unknown
  /** Operation map — replaces controllers */
  operations: OperationMap
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
  /** Contract router */
  contract: AnyContractRouter
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
  /** Register additional operations at runtime */
  registerOperations(operations: OperationMap): Promise<void>
  /** Graceful shutdown */
  shutdown(): Promise<void>
}

const DEFAULTS = {
  apiPrefix: '/api',
  rpcPrefix: '/rpc',
} as const

/**
 * Create a new Outscope application with functional operations (lite version).
 *
 * No decorators, no reflect-metadata, no glob loading.
 * Just pure functions and explicit registration.
 *
 * @example
 * ```typescript
 * import { createApp, corsPlugin } from '@outscope/nova-fn'
 *
 * const app = await createApp({
 *   contract,
 *   producer: pub,
 *   operations: {
 *     auth: authOperations,
 *     projects: projectOperations,
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
    contract,
    operations,
    producer,
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
    contract,
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

  // 6. Setup ORPCHono and register operations (replaces controller loading)
  const orpcHono = new ORPCHono({
    contract,
    producer,
  })

  const router = await orpcHono.applyOperations(app, { operations })

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
    contract,
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

      cachedOpenAPISpec = await generator.generate(contract, {
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
    contract,
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

    async registerOperations(additionalOperations: OperationMap) {
      const additionalRouter = await orpcHono.applyOperations(app, {
        operations: additionalOperations,
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
