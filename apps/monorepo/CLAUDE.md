# CLAUDE.md

## Project Overview

hono-next-turbo: Full-stack type-safe pnpm monorepo template.
**oRPC is the core integration layer** between frontend and backend.
**Contracts and schemas are shared packages** — not buried inside the API.

- Package manager: pnpm@10.4.1
- Runtime: Node.js >=20
- Build system: Turborepo

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router, Turbopack) | 15.4 |
| UI | React, shadcn/ui (new-york), Tailwind CSS | 19 / v4 |
| State | Zustand (persisted localStorage) | 5.x |
| i18n | next-intl (en + th) | 4.x |
| Backend | Hono + @outscope/nova (OOP decorators) | 4.9 |
| **API Contract** | **@orpc/contract + @orpc/server + @orpc/client** | **1.9** |
| ORM | Prisma (SQLite default) | 6.17 |
| Auth | Better Auth (session-based, organization plugin) | 1.3 |
| Validation | Zod | 4.x |
| Logging | Pino + @outscope/nova createLogger | - |

## Monorepo Structure

```
hono-next-turbo/
├── apps/
│   ├── api/               # Hono + oRPC backend (port 3000)
│   └── web/               # Next.js frontend (port 3001)
├── packages/
│   ├── contracts/         # @workspace/contracts — oRPC route contracts
│   ├── schemas/           # @workspace/schemas   — Zod schemas + types
│   ├── ui/                # @workspace/ui        — shadcn/ui components
│   ├── eslint-config/     # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript configs
├── docs/                  # Architecture, auth, feature guide, conventions
└── CLAUDE.md              # This file
```

## Development Commands

```bash
# Monorepo-wide
pnpm install              # Install all dependencies
pnpm dev                  # Dev mode all apps (api:3000, web:3001)
pnpm build                # Build all packages
pnpm lint                 # Lint all packages
pnpm lint:fix             # Lint + fix all packages
pnpm typecheck            # Type check all packages
pnpm test                 # Run all tests
pnpm format               # Prettier format all files

# Database (runs in apps/api)
pnpm db:generate          # Generate Prisma client
pnpm db:push              # Push schema to database
pnpm db:migrate           # Create + run migrations
pnpm db:studio            # Open Prisma Studio

# Package-specific
pnpm --filter api dev     # Run only API
pnpm --filter web dev     # Run only web
```

## Contract-First Architecture

The shared contract packages are the foundation of type safety:

```
packages/schemas/     — Zod schemas (no framework deps)
       ↓
packages/contracts/   — oRPC contracts (routes + schemas)
       ↓
apps/api/             — implements contracts via @Controller + @Implement
apps/web/             — consumes contracts via orpcClient
```

### Adding a New API Endpoint

1. Schema in `packages/schemas/src/{feature}/`
2. Contract in `packages/contracts/src/{feature}.ts`
3. Register in `packages/contracts/src/index.ts`
4. Implement in `apps/api/src/modules/{feature}/`
5. Use in `apps/web/` via `orpcClient.{feature}.{operation}()`

See `docs/adding-features.md` for a complete walkthrough.

## Better Auth Integration

Auth uses Better Auth's `auth.api.getSession()` — no manual DB session queries.

### authMiddleware Pattern

```typescript
export const authMiddleware = pub.middleware(async ({ next, context }) => {
  // context.headers = raw request headers (set in createContext)
  const session = await auth.api.getSession({ headers: context.headers })

  if (!session?.user || !session?.session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' })
  }

  return next({
    context: {
      ...context,
      auth: {
        userId: session.user.id,
        email: session.user.email,
        tenantId: session.session.activeOrganizationId ?? '',
      },
    },
  })
})
```

### Context Types

```typescript
// Public endpoint
async operation(input: Input, context: ORPCContext) { ... }

// Protected endpoint
@Middleware(authMiddleware)
async operation(input: Input, context: AuthedORPCContext) {
  const { userId, tenantId, email } = context.auth  // guaranteed non-null
}
```

### Better Auth Native Endpoints

Mounted alongside oRPC in `apps/api/src/index.ts`:

```typescript
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))
```

- `GET /api/auth/session` — session check
- `POST /api/auth/sign-out` — sign out
- `GET /api/auth/organization/list` — list orgs

See `docs/auth.md` for full auth documentation.

## oRPC Client Integration (Frontend)

### Client Stack (`apps/web/lib/orpc/`)

```
orpc.url.ts    -> RPC_URL = new URL("/rpc", NEXT_PUBLIC_API_URL ?? "http://localhost:3000")
orpc.link.ts   -> RPCLink with auth headers (Bearer token + x-tenant-id from Zustand)
orpc.client.ts -> orpcClient = createORPCClient(link)
orpc.server.ts -> globalThis.$orpcClient (server-side, "server-only")
orpc.d.ts      -> global type: ContractRouterClient<typeof contract>
```

### Usage

```typescript
"use client";
const { orpcClient } = await import("@/lib/orpc/orpc.client");
const result = await orpcClient.{feature}.{operation}(input);
// result is fully typed from contract output schema
```

**Rule: Only use `orpcClient` to call the API. Never use fetch/axios directly.**

## API Architecture

### Bootstrap (`apps/api/src/index.ts`)

```typescript
import 'reflect-metadata'
import { createApp, corsPlugin, loggerPlugin, openapiPlugin } from '@outscope/nova'
import { contract } from '@workspace/contracts'

const app = await createApp<ORPCContext>({
  contract,
  producer: pub,
  controllers: 'src/modules/**/*.controller.ts',  // auto-loaded
  createContext,
  apiPrefix: '/api',
  rpcPrefix: '/rpc',
  plugins: [corsPlugin(...), loggerPlugin(...), openapiPlugin(...)],
})

// Better Auth native endpoints
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))
```

### Decorator Pattern

```typescript
import { Controller, Implement, Middleware, CatchErrors } from '@outscope/nova'

@Controller()
export class FeatureController {
  @CatchErrors()
  @Implement(featureContract.operation)
  async operation(input: InputType, context: ORPCContext): Promise<OutputType> { ... }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement(featureContract.protectedOp)
  async protectedOp(input: InputType, context: AuthedORPCContext): Promise<OutputType> { ... }
}
```

### Module Structure

```
apps/api/src/modules/{feature}/
├── {feature}.controller.ts   # @Controller + @Implement decorators
├── {feature}.service.ts      # Business logic
├── {feature}.repository.ts   # Prisma data access
└── {feature}.serializer.ts   # DB model → API output
```

## Frontend Architecture

### Key Rules

- **Use `orpcClient` as the only way to call the API**
- Auth: `useAuthStore` (Zustand persist), `ProtectedRoute`
- i18n: `useTranslations()`, locales en + th
- UI: `@workspace/ui/components/*` (shadcn/ui)

### Page Pattern

```typescript
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function FeaturePage() {
  const t = useTranslations("feature");
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const { orpcClient } = await import("@/lib/orpc/orpc.client");
      const result = await orpcClient.feature.action(input);
    } catch (err: any) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (/* JSX */);
}
```

### Sidebar Menu (`apps/web/components/app-layout/constants/menu.ts`)

```typescript
export const SIDEBAR_MENU_ITEMS: MenuItem[] = [
  { id: "feature", fallbackLabel: "Feature", i18nToken: "menu.feature", icon: "iconName", href: "/feature" },
];
```

## Path Aliases

### API (`apps/api/tsconfig.json`)

| Alias | Resolves to |
|-------|------------|
| `@contracts/*` | `packages/contracts/src/*` |
| `@schemas/*` | `packages/schemas/src/*` |
| `@libs/*` | `apps/api/src/libs/*` |
| `@generated/*` | `apps/api/src/generated/*` |
| `@modules/*` | `apps/api/src/modules/*` |

### Web (`apps/web/tsconfig.json`)

| Alias | Resolves to |
|-------|------------|
| `@/*` | `apps/web/*` |
| `@workspace/ui/*` | `packages/ui/src/*` |
| `@workspace/contracts` | `packages/contracts/src/index.ts` |
| `@workspace/schemas/*` | `packages/schemas/src/*` |
| `@schemas/*` | `packages/schemas/src/*` |

## Naming Conventions

- Files: `kebab-case`
- Classes: `PascalCase`
- DB tables: `snake_case` (via `@@map`), fields: `camelCase`
- Contract routes: `kebab-case` paths, `camelCase` TS names
- Module files: `{feature}.{layer}.ts`
- Packages: `@workspace/{name}`
- Primary keys: UUID (`crypto.randomUUID()`)
- Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt`

See `docs/naming-conventions.md` for the complete reference.

## Environment Variables

### API (`.env`)

- `DATABASE_URL` — SQLite connection string (default: `file:./dev.db`)
- `PORT` — Server port (default: 3000)
- `CORS_ORIGINS` — Allowed origins (default: `http://localhost:3001,http://localhost:3000`)
- `BETTER_AUTH_SECRET` — Auth secret key
- `BETTER_AUTH_URL` — Auth base URL (e.g. `http://localhost:3000`)

### Web (`.env`)

- `NEXT_PUBLIC_API_URL` — API URL (default: `http://localhost:3000`)

## Agent Teams (Recommended Compositions)

### Full Feature Team

1. `database` agent: Prisma schema + migration
2. `api-feature` agent: packages/schemas, packages/contracts, modules implementation
3. `frontend-feature` agent: Next.js pages + orpcClient calls
4. `test-runner` agent: verify compilation + lint

### Quality Assurance Team

1. `code-reviewer` agent: architecture + security review
2. `test-runner` agent: build verification

## Documentation

| File | Contents |
|------|---------|
| `docs/architecture.md` | Modular monolith overview, layer diagram, scaling path |
| `docs/auth.md` | Better Auth + oRPC integration, session flow, middleware |
| `docs/adding-features.md` | Step-by-step feature guide with code templates |
| `docs/naming-conventions.md` | Complete naming reference |
