# @outscope/orpc-hono

Decorator-based OOP integration for [oRPC](https://orpc.dev) with [Hono](https://hono.dev) framework.

## Features

- 🎯 **Decorator-based** - Use TypeScript decorators for clean, object-oriented API definitions
- 🔒 **Type-safe** - Full TypeScript support with type inference
- 🚀 **Fast** - Built on Hono's ultra-fast HTTP server
- 🔄 **Compatible** - Supports both oRPC client and REST API calls via OpenAPI
- 📦 **Lightweight** - Minimal dependencies
- 🎨 **Flexible** - Works seamlessly with oRPC contracts and middleware
- 🛡️ **Middleware Support** - Apply middleware at class or method level

## Installation

```bash
npm install @outscope/orpc-hono hono @orpc/contract @orpc/server zod reflect-metadata
```

Or with pnpm:

```bash
pnpm add @outscope/orpc-hono hono @orpc/contract @orpc/server zod reflect-metadata
```

## Quick Start

### 1. Define your contracts

```typescript
// contracts/planet.ts
import { oc } from '@orpc/contract'
import { z } from 'zod'

export const list = oc
  .route({
    method: 'POST',
    path: '/planets',
    summary: 'List all planets',
    tags: ['Planets'],
  })
  .input(z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
  }))
  .output(z.object({
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
    })),
    total: z.number(),
  }))

export const get = oc
  .route({
    method: 'GET',
    path: '/planets/:id',
    summary: 'Get planet by ID',
    tags: ['Planets'],
  })
  .input(z.object({ id: z.string() }))
  .output(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }))

export const planet = {
  list,
  get,
}

// contracts/index.ts
export const contract = {
  planet,
}
```

### 2. Setup oRPC context and producer

```typescript
// libs/orpc.ts
import { implement } from '@orpc/server'
import { contract } from './contracts'
import type { Context } from 'hono'

export type ORPCContext = {
  user?: {
    id: string
    name: string
    email: string
  }
  honoContext: Context
}

// Create base producer with context type
export const pub = implement(contract).$context<ORPCContext>()
```

### 3. Create a controller

```typescript
// features/planets/planet.controller.ts
import { Controller, Implement } from '@outscope/orpc-hono'
import { planet } from './contracts/planet'
import type { ORPCContext } from './libs/orpc'

@Controller()
export class PlanetController {
  @Implement(planet.list)
  async list(input: { page: number; pageSize: number }, context: ORPCContext) {
    // Your implementation
    return {
      items: [
        { id: '1', name: 'Earth', type: 'Terrestrial' },
        { id: '2', name: 'Mars', type: 'Terrestrial' },
      ],
      total: 2,
    }
  }

  @Implement(planet.get)
  async get(input: { id: string }, context: ORPCContext) {
    return {
      id: input.id,
      name: 'Earth',
      type: 'Terrestrial',
    }
  }
}
```

### 4. Setup Hono server

```typescript
// index.ts
import 'reflect-metadata'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { ORPCHono } from '@outscope/orpc-hono'
import { RPCHandler } from '@orpc/server/fetch'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { PlanetController } from './features/planets/planet.controller'
import { contract } from './contracts'
import { pub } from './libs/orpc'

const app = new Hono()

// Initialize ORPCHono
const orpcHono = new ORPCHono({
  contract,
  producer: pub, // Pass the producer with context
})

// Register controllers and get router
const router = await orpcHono.applyMiddleware(app, {
  controllers: [new PlanetController()],
})

// Setup RPC routes at /rpc
const rpcHandler = new RPCHandler(router)
app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
  })
  if (matched) return c.newResponse(response.body, response)
  await next()
})

// Setup REST API routes at /api
const openAPIHandler = new OpenAPIHandler(router)
app.use('/api/*', async (c, next) => {
  const { matched, response } = await openAPIHandler.handle(c.req.raw, {
    prefix: '/api',
  })
  if (matched) return c.newResponse(response.body, response)
  await next()
})

serve({ fetch: app.fetch, port: 3000 })
```

### 5. Use with oRPC client

```typescript
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { contract } from './contracts'

const client = createORPCClient<typeof contract>(
  new RPCLink({ url: new URL('/rpc', 'http://localhost:3000') })
)

// Type-safe API calls
const planets = await client.planet.list({ page: 1, pageSize: 10 })
const planet = await client.planet.get({ id: '1' })
```

## API Reference

### Decorators

#### `@Controller()`

Marks a class as an oRPC controller. Required for all controller classes.

```typescript
@Controller()
export class PlanetController {
  // ...
}
```

#### `@Implement(contract)`

Marks a method as implementing an oRPC contract. The method becomes the handler for the specified contract.

```typescript
@Controller()
export class PlanetController {
  @Implement(planet.get)
  async get(input: { id: string }, context: ORPCContext) {
    return { id: input.id, name: 'Earth', type: 'Terrestrial' }
  }
}
```

#### `@Middleware(middleware)`

Applies middleware to a controller class or method. Can be used at both class and method level.

**Class-level middleware** applies to all methods in the controller:

```typescript
import { ORPCError } from '@orpc/server'

const authMiddleware = ({ next, context }) => {
  if (!context.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'User not authenticated' })
  }
  return next({ context })
}

@Controller()
@Middleware(authMiddleware)
export class UserController {
  // All methods require authentication
  @Implement(user.getCurrentUser)
  async getCurrentUser(input: any, context: ORPCContext & { user: User }) {
    return context.user
  }
}
```

**Method-level middleware** applies only to specific methods:

```typescript
@Controller()
export class PlanetController {
  // Public - no auth required
  @Implement(planet.list)
  async list(input: any, context: ORPCContext) {
    return { items: [], total: 0 }
  }

  // Protected - requires auth
  @Middleware(authMiddleware)
  @Implement(planet.create)
  async create(input: any, context: ORPCContext & { user: User }) {
    console.log('Created by:', context.user.name)
    return { id: '1', name: 'New Planet' }
  }
}
```

### ORPCHono

Main class for integrating oRPC with Hono.

#### Constructor Options

```typescript
interface ORPCHonoOptions {
  interceptors?: Array<(c: Context, next: () => Promise<void>) => Promise<void>> // Hono middleware
  contract?: ContractRouter<any> // Root contract for automatic path resolution
  producer?: unknown // oRPC producer/implementer with context (e.g., implement(contract).$context<MyContext>())
}
```

**Example:**

```typescript
const orpcHono = new ORPCHono({
  contract,
  producer: pub,
  interceptors: [
    // Global Hono middleware
    async (c, next) => {
      console.log('Request:', c.req.url)
      await next()
    },
  ],
})
```

#### Methods

##### `applyMiddleware(app, options)`

Applies middleware and registers controllers with the Hono app. Returns a router structure that can be used with oRPC handlers.

```typescript
const router = await orpcHono.applyMiddleware(app, {
  controllers: [
    new PlanetController(),
    new UserController(),
  ],
})
```

## Advanced Usage

### Custom Context with Middleware

Create sophisticated authentication and context handling:

```typescript
// libs/orpc.ts
import { implement, ORPCError } from '@orpc/server'
import { contract } from './contracts'

export type User = {
  id: string
  name: string
  email: string
  role: string
}

export type ORPCContext = {
  user?: User
  honoContext: Context
}

export const pub = implement(contract).$context<ORPCContext>()

// Auth middleware
export const authMiddleware = ({ next, context }: { next: any; context: ORPCContext }) => {
  // In production: extract token, validate, fetch user from DB
  const mockUser: User | undefined = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
  }

  if (!mockUser) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'User not authenticated',
    })
  }

  return next({
    context: {
      ...context,
      user: mockUser,
    },
  })
}

// Create authenticated implementer
export const authed = pub.use(authMiddleware)
```

### Multiple Controllers

Organize your API by feature using multiple controllers:

```typescript
// Auto-load controllers
import { loadControllers } from './libs/controller-loader'

const controllerClasses = await loadControllers('src/features/**/*.controller.ts')
const controllers = controllerClasses.map((Controller) => new Controller())

const router = await orpcHono.applyMiddleware(app, {
  controllers,
})
```

### REST API and RPC Compatibility

The package integrates with oRPC's handlers for flexible routing:
- **RPCHandler**: For oRPC-style paths (e.g., `POST /rpc/planet/list`)
- **OpenAPIHandler**: For REST-style paths (e.g., `POST /api/planets`)

You control the URL prefix by configuring the handler's prefix option:

```typescript
import { RPCHandler } from '@orpc/server/fetch'
import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { onError } from '@orpc/server'
import { CORSPlugin } from '@orpc/server/plugins'

const router = await orpcHono.applyMiddleware(app, {
  controllers: [new PlanetController()],
})

// Setup RPC routes at /rpc
const rpcHandler = new RPCHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [onError((error) => console.error(error))],
})
app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
  })
  if (matched) return c.newResponse(response.body, response)
  await next()
})

// Setup REST routes at /api
const openAPIHandler = new OpenAPIHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [onError((error) => console.error(error))],
})
app.use('/api/*', async (c, next) => {
  const { matched, response } = await openAPIHandler.handle(c.req.raw, {
    prefix: '/api',
  })
  if (matched) return c.newResponse(response.body, response)
  await next()
})
```

This allows your API to be consumed by both oRPC clients and traditional REST clients.

### OpenAPI Documentation

Generate OpenAPI documentation using `@orpc/openapi`:

```typescript
import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod'
import { swaggerUI } from '@hono/swagger-ui'

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
})

const openApiDoc = await generator.generate(contract, {
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API built with @outscope/orpc-hono',
  },
  servers: [
    {
      url: '/api',
      description: 'Development server',
    },
  ],
})

app.get('/openapi', (c) => c.json(openApiDoc))
app.get('/', swaggerUI({ url: '/openapi' }))
```

## Requirements

- Node.js >=18.0.0
- TypeScript 5.x with `experimentalDecorators` enabled

### TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Import reflect-metadata

Add at the top of your entry file:

```typescript
import 'reflect-metadata'
```

## Example Project

Check out the [example-beta](https://github.com/zee-sandev/horn/tree/main/apps/example-beta) application for a complete working example with:
- Multiple controllers
- Class and method-level middleware
- Authentication
- OpenAPI documentation
- Both RPC and REST endpoints

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

Built with:
- [oRPC](https://orpc.dev) - Type-safe RPC framework
- [Hono](https://hono.dev) - Ultrafast web framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
