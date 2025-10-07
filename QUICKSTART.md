# Quick Start Guide

## @horn/orpc-hono

Get started with type-safe APIs using oRPC and Hono in minutes!

## Prerequisites

- Node.js 18+ (Node.js 22+ recommended)
- pnpm, npm, or yarn
- TypeScript 5.0+

## 1. Install Dependencies

```bash
# From the monorepo root
pnpm install

# Or install dependencies for specific package
cd packages/orpc-hono
pnpm install
```

## 2. Build the Package

```bash
cd packages/orpc-hono
pnpm build
```

## 3. Run the Example App

```bash
cd apps/example-orpc-hono
pnpm install
pnpm dev
```

The server will start on `http://localhost:3000`

## 4. Try the API

### List Users

```bash
curl http://localhost:3000/api/users
```

### Get User Stats

```bash
curl http://localhost:3000/api/users/stats
```

### List Products

```bash
curl http://localhost:3000/api/products
```

### Search Products

```bash
curl "http://localhost:3000/api/products?search=laptop"
```

### Create a New User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  }'
```

## Project Structure

```
@horn/
├── packages/
│   └── orpc-hono/           # The main package
│       ├── src/             # Source code
│       ├── README.md        # Documentation
│       └── package.json
│
├── apps/
│   └── example-orpc-hono/   # Example application
│       ├── src/
│       │   ├── contracts/   # API contracts
│       │   ├── controllers/ # Implementations
│       │   ├── db/          # Mock database
│       │   └── index.ts     # Entry point
│       └── README.md
│
└── QUICKSTART.md           # This file
```

## Basic Usage

### 1. Define Contract

```typescript
import { oc } from '@orpc/contract'
import * as z from 'zod'

const getUserContract = oc
  .route({
    method: 'GET',
    path: '/users/{id}',
  })
  .input(z.object({ id: z.string() }))
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  )
```

### 2. Create Module

```typescript
import { ORPCHono, onError } from '@horn/orpc-hono'

const orpcHono = new ORPCHono({
  interceptors: [onError(console.error)],
  prefix: '/api',
})
```

### 3. Implement Controller

```typescript
import { Controller, Implement, implement } from '@horn/orpc-hono'

@Controller()
class UserController {
  @Implement(getUserContract)
  getUser() {
    return implement(getUserContract).handler(({ input }) => {
      return { id: input.id, name: 'John Doe' }
    })
  }
}
```

### 4. Register with Hono

```typescript
import { Hono } from 'hono'
import { registerController } from '@horn/orpc-hono'

const app = new Hono()
orpcHono.applyMiddleware(app)
await registerController(app, new UserController(), orpcHono)
```

## Next Steps

1. 📖 Read the [full documentation](packages/orpc-hono/README.md)
2. 🏗️ Learn about [architecture](packages/orpc-hono/ARCHITECTURE.md)
3. 🔍 Explore the [example app](apps/example-orpc-hono)
4. 🚀 Build your own API!

## Common Commands

```bash
# Build the package
cd packages/orpc-hono && pnpm build

# Run example in dev mode
cd apps/example-orpc-hono && pnpm dev

# Build example for production
cd apps/example-orpc-hono && pnpm build && pnpm start

# Clean build artifacts
pnpm clean
```

## Troubleshooting

### Module not found errors

Install peer dependencies:

```bash
pnpm add hono @orpc/contract @orpc/server zod
```

### TypeScript errors

Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "experimentalDecorators": true
  }
}
```

### Decorator errors

Install and import `reflect-metadata`:

```bash
pnpm add reflect-metadata
```

```typescript
import 'reflect-metadata'
```

## Resources

- [oRPC Documentation](https://orpc.unnoq.com)
- [Hono Documentation](https://hono.dev)
- [Zod Documentation](https://zod.dev)

## Support

- 📝 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)
- 📧 Contact the maintainers

Happy coding! 🎉

