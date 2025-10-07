# @horn Monorepo

Modern, type-safe development tools and frameworks.

## 📦 Packages

### @horn/orpc-hono

oRPC integration for Hono framework with OOP configuration. Build type-safe APIs with contract-first development.

**Features:**

- ✨ Instance-based OOP pattern
- 🎯 Full type safety end-to-end
- 🔥 Hono framework integration
- 📝 Contract-first development
- 🛡️ Built-in error handling
- 🌐 Edge runtime compatible

[Documentation](./packages/orpc-hono/README.md) | [Quick Start](./QUICKSTART.md)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Run example app
cd apps/example-orpc-hono
pnpm dev
```

Visit: `http://localhost:3000`

## 📁 Structure

```
@horn/
├── packages/
│   ├── orpc-hono/              # Main package
│   ├── eslint-config/          # ESLint configs
│   └── typescript-config/      # TypeScript configs
│
├── apps/
│   ├── example-orpc-hono/      # Example Hono app
│   └── docs/                   # Documentation site
│
├── QUICKSTART.md               # Quick start guide
└── README.md                   # This file
```

## 🎯 Example Usage

### 1. Define Contract

```typescript
import { oc } from '@orpc/contract'
import * as z from 'zod'

const getUserContract = oc
  .route({ method: 'GET', path: '/users/{id}' })
  .input(z.object({ id: z.string() }))
  .output(z.object({ id: z.string(), name: z.string() }))
```

### 2. Implement Controller

```typescript
import { ORPCHono, Controller, Implement, implement } from '@horn/orpc-hono'

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

### 3. Setup Server

```typescript
import { Hono } from 'hono'
import { registerController } from '@horn/orpc-hono'

const app = new Hono()
const orpcHono = new ORPCHono({ prefix: '/api' })

orpcHono.applyMiddleware(app)
await registerController(app, new UserController(), orpcHono)
```

## 📚 Documentation

- [Quick Start](./QUICKSTART.md) - Get started in 5 minutes
- [Package Documentation](./packages/orpc-hono/README.md) - Full API docs
- [Architecture](./packages/orpc-hono/ARCHITECTURE.md) - Design decisions
- [Migration Guide](./packages/orpc-hono/MIGRATION.md) - Upgrade guide
- [Example App](./apps/example-orpc-hono/README.md) - Working example

## 🛠️ Development

### Prerequisites

- Node.js 18+ (22+ recommended)
- pnpm 8+
- TypeScript 5.0+

### Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Clean build artifacts
pnpm clean

# Run example
pnpm --filter @horn/example-orpc-hono dev
```

## 🎨 Features

### Type Safety

Full end-to-end type safety from contract to client:

```typescript
// Contract defines the types
const contract = oc.route(...)
  .input(z.object({ id: z.string() }))
  .output(UserSchema)

// Implementation is type-checked
implement(contract).handler(({ input }) => {
  input.id // ✅ TypeScript knows this is string
  return user // ✅ Must match UserSchema
})

// Client is fully typed
const user = await client.user.get({ id: '123' })
user.name // ✅ TypeScript knows all properties
```

### Edge Runtime

Works seamlessly in edge environments:

- ✅ Cloudflare Workers
- ✅ Vercel Edge Functions
- ✅ Deno Deploy
- ✅ Fastly Compute@Edge

### Performance

Lightweight and fast:

- 📦 Small bundle size (~100KB)
- ⚡ No heavy frameworks
- 🚀 Native Hono performance
- 🔧 Zero config needed

## 🤝 Contributing

Contributions are welcome! Please read our contributing guide.

## 📄 License

MIT License - see LICENSE for details

## 🙏 Credits

- Built with [Hono](https://hono.dev)
- Inspired by [@orpc/nest](https://github.com/unnoq/orpc)
- Powered by [oRPC](https://orpc.unnoq.com)

## 📞 Support

- 📖 [Documentation](./packages/orpc-hono/README.md)
- 💬 [Discussions](https://github.com/your-repo/discussions)
- 🐛 [Issues](https://github.com/your-repo/issues)

---

Made with ❤️ by the @horn team
