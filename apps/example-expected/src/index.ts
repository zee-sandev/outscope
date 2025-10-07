import 'reflect-metadata'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ORPCHono } from '@horn/orpc-hono'
import { PlanetController } from './features/planets/planet.controller'
import { contract } from './contracts'
import { pinoLogger } from 'hono-pino'
import { onError } from '@orpc/server'
import { CORSPlugin } from '@orpc/server/plugins'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { createContext } from 'libs/orpc/context'
import { swaggerUI } from '@hono/swagger-ui'

import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
const app = new Hono()

// Log all incoming requests
app.use('*', async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`)
  await next()
})

app.use(
  pinoLogger({
    pino: { level: 'debug' },
  })
)

// Create ORPCHono instance
const orpcHono = new ORPCHono({
  prefix: '/rpc',
  contract,
})

// Apply middleware and register controllers
// This returns an implemented router (pub.router()) that can be used for OpenAPI handlers
const router = await orpcHono.applyMiddleware(app, {
  controllers: [new PlanetController()],
})

// Use the router (with implemented handlers) for OpenAPI
const openAPIHandler = new OpenAPIHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [onError((error) => console.error(error))],
})

app.use('/api/*', async (c, next) => {
  const context = await createContext({ honoContext: c })
  const result = await openAPIHandler.handle(c.req.raw, {
    prefix: '/api',
    context: context,
  })

  const { matched, response } = result

  if (matched) {
    return c.newResponse(response.body, response)
  }
  await next()
})

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
})

const openApiDoc = await generator.generate(contract, {
  info: {
    title: 'FastUtil API',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/api',
      description: 'FastUtil API',
    },
  ],
})

// Serve the OpenAPI document
app.get('/doc', (c) => c.json(openApiDoc))

// Use the middleware to serve Swagger UI at /ui
app.get('/', swaggerUI({ url: '/doc', spec: openApiDoc }))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
