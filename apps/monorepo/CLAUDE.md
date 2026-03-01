# CLAUDE.md

## Project Overview

hono-next-turbo: Full-stack type-safe pnpm monorepo template.
**oRPC is the core integration layer** between frontend and backend.

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
| Backend | Hono + @outscope/orpc-hono (OOP decorators) | 4.9 |
| **API Contract** | **@orpc/contract + @orpc/server + @orpc/client** | **1.9** |
| ORM | Prisma (SQLite default) | 6.17 |
| Auth | Better Auth (session-based, organization plugin) | 1.3 |
| Validation | Zod | 4.x |
| Logging | Pino + @outscope/orpc-hono createLogger | - |

## Monorepo Structure

```
hono-next-turbo/
├── apps/
│   ├── api/               # Hono + oRPC backend (port 3000)
│   └── web/               # Next.js frontend (port 3001)
├── packages/
│   ├── ui/                # shadcn/ui components (@workspace/ui)
│   ├── eslint-config/     # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript configs
├── CLAUDE.md              # This file
├── AI-GUIDE.md            # Developer guide for AI tooling
└── .mcp.json              # Ruflo MCP config (project-level)
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
pnpm --filter @workspace/ui lint  # Lint UI package
```

## oRPC: Frontend-Backend Integration (Core Pattern)

oRPC provides end-to-end type safety. Frontend imports contracts/schemas from the API directly.

### Contract Sharing (Type-Safe Bridge)

Frontend accesses contracts via TypeScript path aliases (apps/web/tsconfig.json):

- `api/contracts` -> `../api/src/contracts/index.ts` (typed contract definitions)
- `api/schemas/*` -> `../api/src/schemas/*/index.ts` (Zod schemas + inferred types)
- `@schemas/*` -> `../api/src/schemas/*` (alternative alias)
- `@generated/*` -> `../api/src/generated/*` (Prisma types)

### oRPC Client Stack (apps/web/lib/orpc/)

```
orpc.url.ts    -> RPC_URL = new URL("/rpc", NEXT_PUBLIC_API_URL ?? "http://localhost:3000")
orpc.link.ts   -> RPCLink with auth headers (Bearer token + x-tenant-id from localStorage)
orpc.client.ts -> orpcClient = createORPCClient(link) (client-side)
orpc.server.ts -> globalThis.$orpcClient (server-side, "server-only")
orpc.d.ts      -> global type: ContractRouterClient<typeof contract>
```

### Usage Pattern in Pages

```typescript
// Dynamic import to avoid bundling issues
const { orpcClient } = await import("@/lib/orpc/orpc.client");
const result = await orpcClient.{feature}.{operation}(input);
// result is fully typed from contract output schema
```

### Auth Headers (Automatic)

orpc.link.ts reads token from Zustand auth store (localStorage):

- `Authorization: Bearer {session.token}`
- `x-tenant-id: {session.activeOrganizationId}`

### Adding New API Call to Frontend

1. No need for fetch/axios wrapper - use `orpcClient.{feature}.{operation}()` only
2. Types come automatically from contract (input/output schemas)
3. Error handling: try/catch, error has message from ORPCError

## Architecture - API (Contract-First OOP)

4 layers: contracts -> schemas -> features (controller/service/repository/serializer)

### Bootstrap (apps/api/src/index.ts)

```typescript
import 'reflect-metadata'
import { createApp, corsPlugin, loggerPlugin, openapiPlugin } from '@outscope/orpc-hono'

const app = await createApp<ORPCContext>({
  contract,
  producer: pub,
  controllers: 'src/features/**/*.controller.ts',
  createContext,
  apiPrefix: '/api',
  rpcPrefix: '/rpc',
  plugins: [corsPlugin(...), loggerPlugin(...), openapiPlugin(...)],
})
```

### Decorator Pattern

```typescript
import { Controller, Implement, Middleware, CatchErrors, extractBearerToken } from '@outscope/orpc-hono'

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

### Context System

```typescript
// libs/orpc/context.ts
interface ORPCContext extends BaseORPCContext {
  auth?: { userId: string; tenantId: string; email: string }
}
type AuthedORPCContext = ORPCContext & { auth: { userId: string; tenantId: string; email: string } }

// libs/orpc/orpc.ts
export const pub = implement(contract).$context<ORPCContext>()
export const authMiddleware = async ({ next, context }) => { ... }
```

### API Endpoints

- `/` - Swagger UI
- `/api/*` - REST endpoints
- `/rpc/*` - oRPC endpoints (frontend uses this)

## Architecture - Frontend (Next.js App Router)

### Page Pattern

```typescript
"use client";
import { useTranslations } from "next-intl";
// ... shadcn/ui imports from @workspace/ui/components/*

export default function FeaturePage() {
  const t = useTranslations("feature");
  // Dynamic import for orpcClient
  const { orpcClient } = await import("@/lib/orpc/orpc.client");
  // ...
}
```

### Key Rules

- **Use orpcClient as the only way to call API (never use fetch/axios directly)**
- Auth: useAuthStore (Zustand persist), ProtectedRoute
- i18n: useTranslations(), locales en + th
- UI: `@workspace/ui/components/*` (shadcn/ui)

### Sidebar Menu (apps/web/components/app-layout/constants/menu.ts)

```typescript
export const SIDEBAR_MENU_ITEMS: MenuItem[] = [
  { id: "home", fallbackLabel: "Home", i18nToken: "layout.sidebar.home", icon: "home", href: "/" },
  { id: "feature", fallbackLabel: "Feature", i18nToken: "menu.feature", icon: "iconName", href: "/feature" },
];
```

## How to Add Features (End-to-End)

### Step 1: Database

Edit `apps/api/prisma/schema.prisma`, then `pnpm db:migrate` + `pnpm db:generate`

### Step 2: API (contract-first)

1. Schema: `apps/api/src/schemas/{feature}/index.ts` (Zod schemas + types)
2. Contract: `apps/api/src/contracts/{feature}.ts` (oc.route + schemas)
3. Register: add to `apps/api/src/contracts/index.ts`
4. Feature dir: `apps/api/src/features/{feature}/`
   - `{feature}.repository.ts` (Prisma queries)
   - `{feature}.service.ts` (business logic)
   - `{feature}.serializer.ts` (DB model -> API output)
   - `{feature}.controller.ts` (decorators, auto-loaded)

### Step 3: Frontend

- orpcClient is available immediately: `orpcClient.{feature}.{operation}()`
- Create pages in `apps/web/app/{feature}/`
- Add i18n keys in `apps/web/i18n/messages/{en,th}.json`
- Add sidebar menu item in `apps/web/components/app-layout/constants/menu.ts`

## Path Aliases

### API (apps/api/tsconfig.json)

- `@contracts/*` -> `src/contracts/*`
- `@schemas/*` -> `src/schemas/*`
- `@libs/*` -> `src/libs/*`
- `@generated/*` -> `src/generated/*`

### Web (apps/web/tsconfig.json)

- `@/*` -> `./*`
- `@workspace/ui/*` -> `../../packages/ui/src/*`
- `api/contracts` -> `../api/src/contracts/index.ts`
- `api/schemas/*` -> `../api/src/schemas/*/index.ts`
- `@schemas/*` -> `../api/src/schemas/*`
- `@generated/*` -> `../api/src/generated/*`

## Environment Variables

### API (.env)

- `DATABASE_URL` - SQLite connection string (default: file:./dev.db)
- `PORT` - Server port (default: 3000)
- `CORS_ORIGINS` - Allowed origins (default: http://localhost:3001,http://localhost:3000)
- `BETTER_AUTH_SECRET` - Auth secret key
- `BETTER_AUTH_URL` - Auth base URL

### Web (.env)

- `NEXT_PUBLIC_API_URL` - API URL (default: http://localhost:3000)

## Conventions

- File naming: kebab-case
- DB tables: snake_case (@@map), fields: camelCase
- Exports: barrel pattern (index.ts)
- Error handling: @CatchErrors() decorator, ORPCError
- **Frontend API calls: orpcClient only (never fetch/axios)**
- Primary keys: UUID (crypto.randomUUID())
- Timestamps: createdAt (default now()), updatedAt (@updatedAt)

## Ruflo MCP Integration

### Auto-Available (via .mcp.json)

Ruflo MCP server starts automatically when Claude Code opens. 215 tools available.
No `ruflo init` needed - `.mcp.json` alone is sufficient.

### Memory (call via MCP when needed)

- Store: `mcp__ruflo__memory_store({ key, value, namespace })`
- Search: `mcp__ruflo__memory_search({ query, limit })`
- Retrieve: `mcp__ruflo__memory_retrieve({ key, namespace })`

### Swarm (call via MCP for multi-agent)

- Init: `mcp__ruflo__swarm_init({ topology: "hierarchical", maxAgents: 8, strategy: "specialized" })`
- Spawn: `mcp__ruflo__agent_spawn({ type, name, capabilities })`

### Configuration

| Topology | Max Agents | Use Case |
|----------|-----------|----------|
| hierarchical | 6-8 | Coding tasks, low drift risk |
| hierarchical-mesh | 10-15 | Complex features |
| mesh | variable | Peer collaboration |

Strategy: `"specialized"` for role-based, `"balanced"` for general.

### Token Optimization (~30-50% savings)

- ReasoningBank: cache successful reasoning patterns (-32%)
- Agent Booster (WASM): skip LLM for simple code transforms (-15%)
- Pattern caching: reuse from collective memory (-10%)
- Optimal batching: group operations in single messages (-20%)

## Agent Teams (Recommended Compositions)

### Full Feature Team

1. `database` agent: Prisma schema + migration
2. `api-feature` agent: contracts, schemas, controller/service/repository
3. `frontend-feature` agent: Next.js pages + orpcClient calls
4. `test-runner` agent: verify compilation + lint

### Quality Assurance Team

1. `code-reviewer` agent: full review
2. `test-runner` agent: build verification
