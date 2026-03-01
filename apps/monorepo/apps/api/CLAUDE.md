# CLAUDE.md - API (apps/api)

## Overview

Hono + oRPC backend using @outscope/orpc-hono OOP decorator framework.
Contract-first development with auto-controller loading.

## Commands

```bash
pnpm dev              # Dev server with hot-reload (tsx watch, port 3000)
pnpm build            # Build TypeScript to dist/
pnpm start            # Run production build
pnpm db:generate      # Generate Prisma client (to src/generated/prisma)
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Create and run migrations
pnpm db:studio        # Open Prisma Studio GUI
```

## Architecture

### Contract-First with 4 Layers

```
src/
├── contracts/          # 1. oRPC contracts (oc.route + schemas)
│   ├── auth.ts
│   └── index.ts        # Contract aggregation
├── schemas/            # 2. Zod schemas (input/output types)
│   └── auth/
│       └── index.ts
├── features/           # 3. Feature modules
│   └── auth/
│       ├── auth.controller.ts   # @Controller + @Implement decorators
│       ├── auth.service.ts      # Business logic
│       ├── auth.repository.ts   # Prisma data access
│       └── auth.serializer.ts   # DB model -> API output
├── libs/
│   ├── orpc/
│   │   ├── context.ts   # ORPCContext, AuthedORPCContext, createContext
│   │   └── orpc.ts      # pub instance, authMiddleware
│   ├── auth.ts          # Better Auth config
│   └── prisma.ts        # Prisma client
├── generated/
│   └── prisma/          # Generated Prisma client (DO NOT EDIT)
└── index.ts             # Bootstrap: createApp()
```

### Auto-Controller Loading

Controllers are discovered automatically via glob pattern:

```typescript
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

No manual registration needed - just export a `@Controller()` class.

## Decorator Reference

All from `@outscope/orpc-hono`:

| Decorator | Usage |
|-----------|-------|
| `@Controller()` | Class decorator, marks as auto-loadable controller |
| `@Implement(contract.operation)` | Method decorator, binds to oRPC contract |
| `@Middleware(authMiddleware)` | Method decorator, runs middleware before handler |
| `@CatchErrors()` | Method decorator, wraps in error handler |
| `extractBearerToken(context)` | Utility, gets Bearer token from request |
| `createLogger(opts)` | Utility, creates Pino logger |

## Context System

```typescript
// libs/orpc/context.ts
interface ORPCContext extends BaseORPCContext {
  auth?: { userId: string; tenantId: string; email: string }
}

type AuthedORPCContext = ORPCContext & {
  auth: { userId: string; tenantId: string; email: string }
}

// libs/orpc/orpc.ts
export const pub = implement(contract).$context<ORPCContext>()
```

### authMiddleware

- Reads `Authorization: Bearer {token}` header
- Falls back to `better-auth.session_token` cookie
- Validates session against database
- Adds `auth` to context: `{ userId, tenantId, email }`
- Throws `ORPCError('UNAUTHORIZED')` on failure

## Better Auth Integration

Session-based auth with organization plugin:

- `auth.api.signUpEmail({ body: { email, password, name } })` - Register
- `auth.api.signInEmail({ body: { email, password } })` - Login
- Sessions stored in database, validated via token
- Organizations: users have members with roles (owner, admin, member)

## Database (Prisma + SQLite)

- Provider: SQLite (file:./dev.db)
- Generated client: `src/generated/prisma` (NOT default location)
- Tables: snake_case via `@@map()`, fields: camelCase
- Primary keys: UUID string
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`

### Models

User, Session, Account, Verification, Organization, Member, Invitation

## Path Aliases

```
@contracts/* -> src/contracts/*
@schemas/*   -> src/schemas/*
@libs/*      -> src/libs/*
@generated/* -> src/generated/*
```

## API Endpoints

- `/` - Swagger UI (auto-generated from contracts)
- `/api/*` - REST endpoints
- `/rpc/*` - oRPC endpoints (frontend uses this)

## Adding a New Feature

1. **Schema**: `src/schemas/{feature}/index.ts`
   - Define Zod schemas: `{Feature}InputSchema`, `{Feature}OutputSchema`
   - Export types: `type {Feature}Input = z.infer<typeof {Feature}InputSchema>`

2. **Contract**: `src/contracts/{feature}.ts`
   - Use `oc.route({ method, path, summary, tags })` + `.input()` + `.output()`
   - Group operations: `export const {feature} = { list, get, create, update, delete }`

3. **Register**: Add to `src/contracts/index.ts`
   - `export const contract = { auth, {feature} }`

4. **Repository**: `src/features/{feature}/{feature}.repository.ts`
   - Prisma queries, return raw DB types

5. **Service**: `src/features/{feature}/{feature}.service.ts`
   - Business logic, call repository, return typed results

6. **Serializer**: `src/features/{feature}/{feature}.serializer.ts`
   - Transform DB models to API output types

7. **Controller**: `src/features/{feature}/{feature}.controller.ts`
   - `@Controller()` class
   - `@CatchErrors()` + `@Implement(contract.op)` per method
   - `@Middleware(authMiddleware)` for protected endpoints
   - Auto-loaded by glob pattern

## Conventions

- Error handling: `@CatchErrors()` decorator wraps all controller methods
- Auth errors: throw `ORPCError('UNAUTHORIZED', { message: '...' })`
- Business errors: throw `ORPCError('BAD_REQUEST', { message: '...' })`
- Not found: throw `ORPCError('NOT_FOUND', { message: '...' })`
- Logger: `createLogger({ level: 'debug', pretty: true })` per service
- Protected files: `src/generated/`, `prisma/migrations/` (never edit directly)
