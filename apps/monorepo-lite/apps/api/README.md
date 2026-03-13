# @outscope/nova Example

A production-ready example demonstrating the `@outscope/nova` package - an OOP-based decorator pattern for building type-safe APIs with [Hono](https://hono.dev) and [oRPC](https://orpc.io).

## Features

- 🎯 **Type-safe APIs** with contract-first development
- 🏗️ **OOP Architecture** using decorators (`@Controller`, `@Implement`)
- 📦 **Auto-controller loading** with glob pattern support
- 🗃️ **Prisma ORM** with SQLite database
- 📝 **Auto-generated OpenAPI docs** with Swagger UI
- 🔍 **Request logging** with Pino logger
- 🚀 **Development ready** with hot-reload via tsx watch

## Prerequisites

- Node.js 18+ (22+ recommended)
- pnpm 9.0.0+

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Setup environment

```bash
cp .env.example .env
```

### 3. Initialize database

```bash
pnpm db:push
```

### 4. Start development server

```bash
pnpm dev
```

Server runs at [http://localhost:3000](http://localhost:3000)

- **Swagger UI**: [http://localhost:3000](http://localhost:3000)
- **OpenAPI Spec**: [http://localhost:3000/openapi](http://localhost:3000/openapi)
- **API Endpoints**: [http://localhost:3000/api](http://localhost:3000/api)

## Project Structure

```
src/
├── index.ts                    # Application entry point
├── contracts/                  # API contract definitions (oRPC contracts)
│   ├── planet.ts
│   └── index.ts
├── schemas/                    # Zod validation schemas
│   └── planet.ts
├── features/                   # Feature-based modules
│   └── planets/
│       ├── planet.controller.ts   # Controller with @Implement decorators
│       ├── planet.service.ts      # Business logic
│       └── planet.repository.ts   # Data access layer
└── libs/                       # Shared utilities
    ├── orpc/                   # oRPC configuration
    ├── prisma.ts               # Prisma client
    ├── logger.ts               # Pino logger setup
    └── controller-loader.ts    # Auto-load controllers
```

## Architecture Pattern

### 1. Define Schema (Zod)

```typescript
// schemas/planet.ts
import { z } from 'zod'

export const CreatePlanetInput = z.object({
  name: z.string(),
  type: z.string(),
  hasLife: z.boolean().optional(),
})
```

### 2. Define Contract (oRPC)

```typescript
// contracts/planet.ts
import { oc } from '@orpc/contract'

export const create = oc
  .route({
    method: 'POST',
    path: '/planets/create',
    summary: 'Create a new planet',
  })
  .input(CreatePlanetInput)
  .output(CreatePlanetOutput)
```

### 3. Implement Controller

```typescript
// features/planets/planet.controller.ts
import { Controller, Implement, Implementer } from '@outscope/nova'

@Controller()
@Implementer(pub)
export class PlanetController {
  @Implement(planet.create)
  async create(input: CreatePlanetInput, context: ORPCContext) {
    return planetService.create(input)
  }
}
```

### 4. Auto-registration

Controllers are automatically discovered and registered via glob patterns in `src/index.ts`.

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server with watch mode
pnpm build            # Build TypeScript to dist/
pnpm start            # Run production build

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Create and run migrations
pnpm db:studio        # Open Prisma Studio GUI
```

## Database Schema

The example uses Prisma with SQLite:

```prisma
model Planet {
  id           String   @id @default(uuid())
  name         String   @unique
  type         String
  hasLife      Boolean  @default(false)
  discoveredAt DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## API Examples

### List Planets

```bash
curl -X POST http://localhost:3000/api/planets \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "pageSize": 10}'
```

### Get Planet

```bash
curl http://localhost:3000/api/planets/{id}
```

### Create Planet

```bash
curl -X POST http://localhost:3000/api/planets/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Earth",
    "type": "Terrestrial",
    "hasLife": true
  }'
```

## Learn More

- [@outscope/nova Documentation](../../packages/orpc-hono/README.md)
- [Hono Framework](https://hono.dev)
- [oRPC](https://orpc.io)
- [Prisma](https://www.prisma.io)
