import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import { ORPCHono } from './orpc-hono'
import { defaultContextFactory } from '../domain/context'
import type { BaseORPCContext, ContextFactory } from '../domain/context'
import type { AppConfig, OutscopeApp, Plugin, PluginContext, ServerInfo } from '../plugins/types'
import {
  loadControllers,
  instantiateControllers,
  type ControllerClass,
} from '../application/controller-loader'

/**
 * Default configuration values
 */
const DEFAULTS = {
  apiPrefix: '/api',
  rpcPrefix: '/rpc',
} as const

/**
 * Create a new Outscope application with the given configuration.
 *
 * This is the main entry point for creating an @outscope/orpc-hono application.
 * It provides a high-level API that handles:
 * - Controller loading (from glob pattern or explicit array)
 * - Plugin initialization and lifecycle management
 * - OpenAPI and RPC handler setup
 * - Server adapters for Node.js, Bun, and edge runtimes
 *
 * @template TContext - The application context type
 * @param config - Application configuration
 * @returns A configured application ready to start
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
export async function createApp<TContext extends BaseORPCContext = BaseORPCContext>(
  config: AppConfig<TContext>
): Promise<OutscopeApp<TContext>> {
  const {
    contract,
    controllers: controllersConfig,
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
  const initContext: Omit<PluginContext<TContext>, 'router'> = {
    app,
    contract,
    config,
  }

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

  // 6. Load/instantiate controllers
  let controllerInstances: unknown[]

  if (typeof controllersConfig === 'string') {
    // Glob pattern - load controllers dynamically
    const controllerClasses = await loadControllers(controllersConfig)
    controllerInstances = instantiateControllers(controllerClasses)
  } else {
    // Array of classes or instances
    controllerInstances = controllersConfig.map((item) => {
      // Check if it's a class constructor
      if (typeof item === 'function' && item.prototype) {
        return new (item as ControllerClass)()
      }
      // Already an instance
      return item
    })
  }

  // 7. Setup ORPCHono and register controllers
  const orpcHono = new ORPCHono({
    contract,
    producer,
  })

  const router = await orpcHono.applyMiddleware(app, {
    controllers: controllerInstances,
  })

  // 8. Create handlers for API and RPC routes
  const setupHandlers = async () => {
    // Dynamic imports for optional dependencies
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

    // Setup OpenAPI handler
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

    // Setup RPC handler
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

  // 9. Call plugins (onReady phase)
  const readyContext: PluginContext<TContext> = {
    app,
    contract,
    router,
    config,
  }

  for (const plugin of plugins) {
    if (plugin.onReady) {
      await plugin.onReady(readyContext)
    }
  }

  // 10. Create OpenAPI spec generator
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

  // 11. Build OutscopeApp wrapper
  const outscopeApp: OutscopeApp<TContext> = {
    hono: app,
    router,
    contract,
    plugins,

    listen(port: number, callback?: (info: ServerInfo) => void) {
      // Dynamic import for Node.js server
      import('@hono/node-server')
        .then(({ serve }) => {
          serve(
            {
              fetch: app.fetch,
              port,
            },
            (info) => {
              // Notify plugins
              for (const plugin of plugins) {
                plugin.onStart?.({ port: info.port })
              }

              callback?.({ port: info.port })
            }
          )
        })
        .catch((error) => {
          console.error('Failed to start server. Install @hono/node-server:', error.message)
        })
    },

    serve(options: { port: number; hostname?: string }) {
      // For Bun runtime
      const bunServe = (globalThis as any).Bun?.serve
      if (bunServe) {
        bunServe({
          fetch: app.fetch,
          port: options.port,
          hostname: options.hostname,
        })

        // Notify plugins
        for (const plugin of plugins) {
          plugin.onStart?.({ port: options.port })
        }
      } else {
        console.error('Bun.serve is not available. Use listen() for Node.js.')
      }
    },

    fetch: app.fetch.bind(app) as OutscopeApp<TContext>['fetch'],

    getOpenAPISpec,

    async registerController(controller: unknown) {
      const additionalRouter = await orpcHono.applyMiddleware(app, {
        controllers: [controller],
      })
      // Merge into existing router
      Object.assign(router, additionalRouter)
    },

    async shutdown() {
      // Call plugin shutdown hooks
      for (const plugin of plugins) {
        if (plugin.onShutdown) {
          await plugin.onShutdown()
        }
      }
    },
  }

  return outscopeApp
}
