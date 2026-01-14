# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
pnpm dev              # Start dev server with hot-reload (tsx watch)
pnpm build            # Build TypeScript to dist/
pnpm start            # Run production build
```

### Database (Prisma)

```bash
pnpm db:generate      # Generate Prisma client (required after schema changes)
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Create and run migrations
pnpm db:studio        # Open Prisma Studio GUI
```

Note: Prisma client is generated to `src/generated/prisma` (not default location).

## Architecture

This is a type-safe API built with **@outscope/orpc-hono** - an OOP decorator-based framework combining Hono, oRPC, and Prisma.

### Core Pattern: Contract-First Development

The architecture follows a strict contract-first approach with three layers:

1. **Contracts** (`src/contracts/`) - Define API endpoints using oRPC contracts
   - Each contract specifies HTTP method, path, input/output schemas
   - Exported as modules and aggregated in `src/contracts/index.ts`

2. **Schemas** (`src/schemas/`) - Zod validation schemas
   - Define input/output shapes for all operations
   - Export both schemas and TypeScript types

3. **Features** (`src/features/`) - Feature modules with 3-tier structure:
   - **Controller** - Decorated with `@Controller` and `@Implementer(pub)`, methods decorated with `@Implement(contract.operation)`
   - **Service** - Business logic layer
   - **Repository** - Data access layer (Prisma)

### Auto-Controller Loading

Controllers are automatically discovered via glob patterns in `src/index.ts`:

```typescript
loadControllers('src/features/**/*.controller.ts')
```

All classes exported from `*.controller.ts` files with `@Controller` decorator are auto-registered.

### Database Architecture

**Multi-tenant system** with PostgreSQL (not SQLite despite README):

- Core entities: `Tenants`, `Users`, `BusinessInfos`, `Agents`
- All business data scoped to `tenantId`
- UUID primary keys with `gen_random_uuid()`
- Snake_case database columns, camelCase in Prisma models

### Path Aliases (tsconfig.json)

```typescript
@contracts/*  → src/contracts/*
@schemas/*    → src/schemas/*
@libs/*       → src/libs/*
@generated/*  → src/generated/*
```

### API Structure

- **Swagger UI**: `http://localhost:3000`
- **OpenAPI Spec**: `http://localhost:3000/openapi.json`
- **API Base**: `http://localhost:3000/api`

All contracts automatically generate OpenAPI documentation.

### Context System

- Context defined in `src/libs/orpc/context.ts`
- Base implementation in `src/libs/orpc/orpc.ts` as `pub`
- Currently no authentication (commented out `authed` middleware exists as reference)

### Adding New Features

1. Create Zod schemas in `src/schemas/{feature}.ts`
2. Define oRPC contracts in `src/contracts/{feature}.ts`
3. Add contract to `src/contracts/index.ts`
4. Create feature directory: `src/features/{feature}/`
5. Implement controller with decorators (auto-loaded)
6. Implement service and repository layers

Controllers are discovered automatically - no manual registration needed.
