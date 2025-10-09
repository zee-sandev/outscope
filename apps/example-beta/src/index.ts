import 'reflect-metadata'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { pinoLogger } from 'hono-pino'
import { swaggerUI } from '@hono/swagger-ui'
import { onError } from '@orpc/server'
import { CORSPlugin } from '@orpc/server/plugins'
import { OpenAPIGenerator } from '@orpc/openapi'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { RPCHandler } from '@orpc/server/fetch'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import type { Context, Next } from 'hono'
import { ORPCHono } from '@horn/orpc-hono'
import { createContext, type ORPCContext } from 'libs/orpc/context'
import { contract } from './contracts'
import { pub } from 'libs/orpc/orpc'
import { loadControllers } from '@libs/controller-loader'
import { initLogger } from '@libs/logger'

const PORT = 3005
const API_PREFIX = '/api'
const RPC_PREFIX = '/rpc'

function setupLogger(app: Hono) {
  // Use global logger for request logging
  const logger = initLogger({
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
    pretty: true,
  })
  app.use(
    pinoLogger({
      pino: logger,
    })
  )
}

async function setupORPC(app: Hono) {
  const orpcHono = new ORPCHono({
    contract,
    producer: pub, // Pass the producer with context
  })

  // Auto-load all controllers from features
  const controllerClasses = await loadControllers('src/features/**/*.controller.ts')
  const controllers = controllerClasses.map((Controller) => new Controller())

  const router = await orpcHono.applyMiddleware(app, {
    controllers,
  })

  return router
}

function createOpenAPIHandler(router: ReturnType<typeof setupORPC> extends Promise<infer R> ? R : never) {
  return new OpenAPIHandler(router, {
    plugins: [new CORSPlugin()],
    interceptors: [onError((error) => console.error(error))],
  })
}

function createRPCHandler(router: ReturnType<typeof setupORPC> extends Promise<infer R> ? R : never) {
  return new RPCHandler(router, {
    plugins: [new CORSPlugin()],
    interceptors: [onError((error) => console.error(error))],
  })
}

function setupAPIRoutes(app: Hono, openAPIHandler: OpenAPIHandler<ORPCContext>) {
  app.use(`${API_PREFIX}/*`, async (c: Context, next: Next) => {
    const context = await createContext({ honoContext: c })
    const { matched, response } = await openAPIHandler.handle(c.req.raw, {
      prefix: API_PREFIX,
      context,
    })

    if (matched) {
      return c.newResponse(response.body, response)
    }

    await next()
  })
}

function setupRPCRoutes(app: Hono, rpcHandler: RPCHandler<ORPCContext>) {
  app.use(`${RPC_PREFIX}/*`, async (c: Context, next: Next) => {
    const context = await createContext({ honoContext: c })
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: RPC_PREFIX,
      context,
    })

    if (matched) {
      return c.newResponse(response.body, response)
    }

    await next()
  })
}

async function generateOpenAPIDoc() {
  const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  })

  return generator.generate(contract, {
    info: {
      title: '@horn/orpc-hono Example API',
      version: '1.0.0',
      description: 'Example API demonstrating @horn/orpc-hono with OOP decorators',
    },
    servers: [
      {
        url: API_PREFIX,
        description: 'Development server',
      },
    ],
  })
}

function setupDocumentationRoutes(app: Hono, openApiDoc: Awaited<ReturnType<typeof generateOpenAPIDoc>>) {
  app.get('/openapi', (c) => c.json(openApiDoc))
  app.get('/', swaggerUI({ url: '/openapi', spec: openApiDoc }))
}

function startServer(app: Hono) {
  serve(
    {
      fetch: app.fetch,
      port: PORT,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`)
    }
  )
}

async function bootstrap() {
  const app = new Hono()

  setupLogger(app)
  const router = await setupORPC(app)
  const openAPIHandler = createOpenAPIHandler(router)
  const rpcHandler = createRPCHandler(router)
  setupAPIRoutes(app, openAPIHandler)
  setupRPCRoutes(app, rpcHandler)
  const openApiDoc = await generateOpenAPIDoc()
  setupDocumentationRoutes(app, openApiDoc)
  startServer(app)
}

bootstrap()
