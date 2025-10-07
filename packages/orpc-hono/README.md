# @horn/orpc-hono

Decorator-based OOP integration for [oRPC](https://orpc.dev) with [Hono](https://hono.dev) framework.

## Features

- 🎯 **Decorator-based** - Use TypeScript decorators for clean, object-oriented API definitions
- 🔒 **Type-safe** - Full TypeScript support with type inference
- 🚀 **Fast** - Built on Hono's ultra-fast HTTP server
- 🔄 **Compatible** - Supports both oRPC client and REST API calls
- 📦 **Lightweight** - Minimal dependencies
- 🎨 **Flexible** - Works with existing oRPC contracts and procedures

## Installation

```bash
npm install @horn/orpc-hono hono @orpc/contract @orpc/server zod reflect-metadata
```

Or with pnpm:

```bash
pnpm add @horn/orpc-hono hono @orpc/contract @orpc/server zod reflect-metadata
```

## Quick Start

### 1. Define your contracts

```typescript
import { oc } from '@orpc/contract'
import { z } from 'zod'

export const getUserContract = oc
  .route({ method: 'GET', path: '/users/:id' })
  .input(z.object({ id: z.string() }))
  .output(z.object({ id: z.string(), name: z.string() }))

export const contract = {
  user: {
    get: getUserContract
  }
}
```

### 2. Create a controller

```typescript
import { Controller, Implement, Implementer, implement } from '@horn/orpc-hono'
import { contract } from './contracts'

// Create an implementer with context
const pub = implement(contract).$context<{ userId?: string }>()

@Controller()
@Implementer(pub)
export class UserController {
  @Implement(contract.user.get)
  getUser(input: { id: string }) {
    return {
      id: input.id,
      name: 'John Doe'
    }
  }
}
```

### 3. Setup Hono server

```typescript
import 'reflect-metadata'
import { Hono } from 'hono'
import { ORPCHono } from '@horn/orpc-hono'
import { UserController } from './controllers/user'
import { contract } from './contracts'

const app = new Hono()

const orpcHono = new ORPCHono({
  prefix: '/api',
  contract, // Pass root contract for automatic path resolution
})

await orpcHono.applyMiddleware(app, {
  controllers: [new UserController()],
})

export default app
```

### 4. Use with oRPC client

```typescript
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { contract } from './contracts'

const client = createORPCClient<typeof contract>(
  new RPCLink({ url: new URL('/api', 'http://localhost:3000') })
)

// Type-safe API calls
const user = await client.user.get({ id: '123' })
```

## API Reference

### Decorators

#### `@Controller()`

Marks a class as an oRPC controller. Required for all controller classes.

```typescript
@Controller()
export class UserController {
  // ...
}
```

#### `@Implementer(implementer)`

Provides a shared implementer instance for all methods in the controller. This allows sharing middleware and context across procedures.

```typescript
const pub = implement(contract).$context<MyContext>()

@Controller()
@Implementer(pub)
export class UserController {
  // All methods use the same implementer
}
```

#### `@Implement(contract)`

Marks a method as implementing an oRPC contract. The method becomes the handler for the specified contract.

```typescript
@Controller()
export class UserController {
  @Implement(getUserContract)
  getUser(input: { id: string }, context: MyContext) {
    return { id: input.id, name: 'John' }
  }
}
```

### ORPCHono

Main class for integrating oRPC with Hono.

#### Constructor Options

```typescript
interface ORPCHonoOptions {
  prefix?: string // URL prefix for all routes (e.g., '/api')
  interceptors?: Array<(c: Context, next: () => Promise<void>) => Promise<void>> // Hono middleware
  contract?: ContractRouter<any> // Root contract for automatic path resolution
}
```

#### Methods

##### `applyMiddleware(app, options)`

Applies middleware and registers controllers with the Hono app.

```typescript
await orpcHono.applyMiddleware(app, {
  controllers: [new UserController(), new PostController()],
})
```

##### `registerRoute(app, contract, procedure, contractPath?)`

Registers a single route with Hono. Usually called internally by `registerController`.

## Advanced Usage

### Custom Context

```typescript
interface MyContext {
  userId: string
  permissions: string[]
}

const authed = implement(contract)
  .$context<MyContext>()
  .use(({ context, next }) => {
    // Middleware logic
    if (!context.userId) {
      throw new ORPCError('UNAUTHORIZED')
    }
    return next({ context })
  })

@Controller()
@Implementer(authed)
export class ProtectedController {
  @Implement(contract.protected.action)
  action(input: any, context: MyContext) {
    // context.userId is guaranteed to exist
    return { userId: context.userId }
  }
}
```

### Multiple Controllers

```typescript
const orpcHono = new ORPCHono({ prefix: '/api', contract })

await orpcHono.applyMiddleware(app, {
  controllers: [
    new UserController(),
    new PostController(),
    new CommentController(),
  ],
})
```

### REST API Compatibility

The package automatically registers both:
- oRPC-style paths: `POST /api/user/get`
- REST-style paths: `GET /api/users/:id`

This allows your API to be consumed by both oRPC clients and traditional REST clients.

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

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

Built with:
- [oRPC](https://orpc.dev) - Type-safe RPC framework
- [Hono](https://hono.dev) - Ultrafast web framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
