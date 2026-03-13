# Architecture: Modular Monolith

## Overview

This project is a **modular monolith** — a single deployable unit organized into well-defined modules with clear boundaries. Each module owns its domain logic but shares infrastructure (database, auth, framework).

```
monorepo/
├── packages/
│   ├── contracts/     # @workspace/contracts — oRPC API contracts (shared by api + web)
│   ├── schemas/       # @workspace/schemas   — Zod schemas + TypeScript types (shared)
│   ├── ui/            # @workspace/ui        — shadcn/ui components
│   ├── eslint-config/ # @workspace/eslint-config
│   └── typescript-config/ # @workspace/typescript-config
│
└── apps/
    ├── api/           # Hono monolith (port 3000)
    │   └── src/
    │       ├── modules/        # Domain modules (auth, users, etc.)
    │       ├── libs/           # Shared infrastructure (auth, prisma, orpc)
    │       └── generated/      # Prisma generated client
    └── web/           # Next.js 15 frontend (port 3001)
        └── lib/orpc/   # Type-safe oRPC client stack
```

## Layer Architecture

Each module follows a 4-layer pattern:

```
modules/{feature}/
├── {feature}.controller.ts   # HTTP layer — decorators, input/output
├── {feature}.service.ts      # Business logic
├── {feature}.repository.ts   # Data access — Prisma queries
└── {feature}.serializer.ts   # Transform DB models → API output shapes
```

Contracts and schemas live in **shared packages** (not inside the API), enabling frontend type safety without code duplication:

```
Frontend (web)                    Backend (api)
    │                                  │
    └── @workspace/contracts ──────────┤
    └── @workspace/schemas  ───────────┘
                                  │
                             modules/*.controller.ts
                                  │
                             modules/*.service.ts
                                  │
                             modules/*.repository.ts (Prisma)
```

## Package Dependency Graph

```
@workspace/schemas      (no local deps)
       ↓
@workspace/contracts    (depends on schemas)
       ↓
apps/api                (depends on contracts, schemas)
apps/web                (depends on contracts, schemas)
```

## Contract-First Flow

1. **Schema** (`packages/schemas/src/{feature}/`) — define Zod shapes
2. **Contract** (`packages/contracts/src/{feature}.ts`) — define HTTP routes + link schemas
3. **Register** (`packages/contracts/src/index.ts`) — add to contract object
4. **Implement** (`apps/api/src/modules/{feature}/`) — business logic
5. **Consume** (`apps/web/`) — `orpcClient.{feature}.{operation}()` — fully typed

## Scaling Path: Monolith → Microservices

When a module needs to scale independently:

1. Extract `modules/{feature}/` → new `apps/{feature}-service/`
2. `packages/contracts/{feature}.ts` stays shared — no frontend changes needed
3. Update `packages/contracts/src/index.ts` to separate the contract
4. Web app points to new service URL via environment variable

The `packages/contracts/` and `packages/schemas/` packages are the key enabler — they decouple the type contract from any specific service implementation.

## API Endpoints

| Prefix | Purpose |
|--------|---------|
| `/rpc/*` | oRPC endpoints (frontend uses these via `orpcClient`) |
| `/api/*` | REST endpoints (auto-generated from contracts via oRPC OpenAPI) |
| `/api/auth/**` | Better Auth native endpoints (session, sign-in, sign-out, org) |
| `/` | Swagger UI |
