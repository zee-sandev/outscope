# CLAUDE.md - API (apps/api)

## Overview

Hono + oRPC backend using @outscope/nova OOP decorator framework.
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

Contracts and schemas live in **shared packages** (`packages/contracts/`, `packages/schemas/`):

```
src/
├── modules/            # Domain modules (renamed from features/)
│   └── auth/
│       ├── auth.controller.ts   # @Controller + @Implement decorators
│       ├── auth.service.ts      # Business logic
│       ├── auth.repository.ts   # Prisma data access
│       └── auth.serializer.ts   # DB model -> API output
├── libs/
│   ├── orpc/
│   │   ├── context.ts   # ORPCContext (includes headers: Headers), AuthedORPCContext, createContext
│   │   └── orpc.ts      # pub instance, authMiddleware (uses auth.api.getSession)
│   ├── auth.ts          # Better Auth config
│   └── prisma.ts        # Prisma client
├── generated/
│   └── prisma/          # Generated Prisma client (DO NOT EDIT)
└── index.ts             # Bootstrap: createApp() + Better Auth handler
```

### Auto-Controller Loading

Controllers are discovered automatically via glob pattern:

```typescript
const app = await createApp<ORPCContext>({
  contract,
  producer: pub,
  controllers: 'src/modules/**/*.controller.ts',
  createContext,
  apiPrefix: '/api',
  rpcPrefix: '/rpc',
  plugins: [corsPlugin(...), loggerPlugin(...), openapiPlugin(...)],
})

// Better Auth native endpoints
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))
```

No manual registration needed - just export a `@Controller()` class.

## Decorator Reference

All from `@outscope/nova`:

| Decorator                        | Usage                                              |
| -------------------------------- | -------------------------------------------------- |
| `@Controller()`                  | Class decorator, marks as auto-loadable controller |
| `@Implement(contract.operation)` | Method decorator, binds to oRPC contract           |
| `@Middleware(authMiddleware)`    | Method decorator, runs middleware before handler   |
| `@CatchErrors()`                 | Method decorator, wraps in error handler           |
| `extractBearerToken(context)`    | Utility, gets Bearer token from request            |
| `createLogger(opts)`             | Utility, creates Pino logger                       |

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

- Uses `auth.api.getSession({ headers: context.headers })` — official Better Auth pattern
- `context.headers` is the raw request `Headers` object (set in `createContext`)
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
@contracts/* -> packages/contracts/src/*
@schemas/*   -> packages/schemas/src/*
@libs/*      -> src/libs/*
@generated/* -> src/generated/*
@modules/*   -> src/modules/*
```

## API Endpoints

- `/` - Swagger UI (auto-generated from contracts)
- `/api/*` - REST endpoints
- `/rpc/*` - oRPC endpoints (frontend uses this)

## Adding a New Feature

1. **Schema**: `packages/schemas/src/{feature}/index.ts` (shared package)
   - Define Zod schemas: `{Feature}InputSchema`, `{Feature}OutputSchema`
   - Export types: `type {Feature}Input = z.infer<typeof {Feature}InputSchema>`

2. **Contract**: `packages/contracts/src/{feature}.ts` (shared package)
   - Use `oc.route({ method, path, summary, tags })` + `.input()` + `.output()`
   - Group operations: `export const {feature} = { list, get, create, update, delete }`

3. **Register**: Add to `packages/contracts/src/index.ts`
   - `export const contract = { auth, {feature} }`

4. **Repository**: `src/modules/{feature}/{feature}.repository.ts`
   - Prisma queries, return raw DB types

5. **Service**: `src/modules/{feature}/{feature}.service.ts`
   - Business logic, call repository, return typed results

6. **Serializer**: `src/modules/{feature}/{feature}.serializer.ts`
   - Transform DB models to API output types

7. **Controller**: `src/modules/{feature}/{feature}.controller.ts`
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

# Claude Project Context & Memory Guide

## Interaction Strategy (10X Efficiency)

- **Context Management:** Before performing deep analysis, ALWAYS use `repomix` to get a compressed XML map of the codebase. Focus on function signatures and exports.
- **Memory Protocol:** After completing a significant task or architectural change, ALWAYS use `claude-mem` (or your active memory tool) to store the "Outcome" and "Lessons Learned".
- **Token Budgeting:** Avoid reading full implementation of large files unless a specific bug is identified within them.

## Memory Anchors (For claude-mem)

Before ending a session, summarize:

1. **State:** What was the last stable state?
2. **Decisions:** Why did we choose this specific implementation?
3. **Pending:** What is the exact next step for the user?

## Automation Workflows

- **On Startup:** Read this file to understand the project map.
- **On Error:** Check `repomix` output to see if related files changed their signatures.
- **On Finish:** Auto-update `CLAUDE.md` if the project structure or key conventions have evolved.

## Constraints

- Always use the `repomix` tool to understand the codebase structure before diving into deep file reads.
- Focus on function signatures and file exports to save tokens.
- Do not read implementation details of library files in `node_modules`.
- NEVER include `node_modules`, `dist`, or `.git` in context searches.
- NEVER rewrite entire files if only a few lines change (use line-based editing).
- DO NOT hallucinate APIs; if unsure, use `repomix` to verify the existing codebase first.
