# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **pnpm monorepo** for the `@horn` toolkit, focused on building type-safe development tools and frameworks. The primary package is `@horn/orpc-hono`, which provides oRPC integration for the Hono framework using an OOP pattern with decorators.

**Key Technologies:**
- **Build System:** Turborepo (via `turbo`)
- **Package Manager:** pnpm (required - version 9.0.0+)
- **Runtime:** Node.js 18+ (22+ recommended)
- **Framework:** Hono with oRPC contracts
- **Type System:** TypeScript 5.0+ with experimental decorators
- **Validation:** Zod schemas

## Development Commands

### Monorepo-wide Commands (run from root)

```bash
# Install all dependencies
pnpm install

# Build all packages (Turborepo handles dependency order)
pnpm build

# Run development mode for all apps
pnpm dev

# Type checking across all packages
pnpm check-types

# Lint all packages
pnpm lint

# Format all TypeScript, TSX, and Markdown files
pnpm format
```

### Package-specific Commands

```bash
# Run a command in a specific package using --filter
pnpm --filter @horn/example-orpc-hono dev

# Build a single package (dependencies built automatically)
pnpm --filter @horn/orpc-hono build
```

### Example App Commands

The example application uses `tsx` for development:

```bash
cd apps/example-expected

# Development with watch mode
pnpm dev

# Build TypeScript to dist/
pnpm build

# Run compiled output
pnpm start
```

Server runs on `http://localhost:3000` by default.

## Architecture

### Monorepo Structure

```
@horn/
├── packages/
│   ├── orpc-hono/           # Main package - oRPC/Hono integration (currently being developed)
│   ├── eslint-config/       # Shared ESLint configurations
│   └── typescript-config/   # Shared TypeScript configs (base, nextjs, react-library)
│
└── apps/
    └── example-expected/    # Example app demonstrating @horn/orpc-hono usage
```

**Note:** The git status shows deleted files from `apps/web`, `apps/docs`, and `packages/ui`, indicating these were removed from the original turborepo template.

### @horn/orpc-hono Package (In Development)

The main package provides a decorator-based OOP pattern for building type-safe APIs with oRPC and Hono.

**Core Pattern:**

1. **Contracts** (contract-first): Define API endpoints with routes, input/output schemas using `@orpc/contract`
2. **Controllers** (OOP implementation): Use `@Controller()` class decorator and `@Implement(contract)` method decorator
3. **Registration**: Apply to Hono app using `ORPCHono` instance and `registerController()`

**Required Dependencies:**
- `hono` - Web framework
- `@orpc/contract` - Contract definitions
- `@orpc/server` - Server implementation
- `zod` - Schema validation
- `reflect-metadata` - Required for decorators (must be imported at app entry point)

### Example App Architecture

Located in `apps/example-expected/src/`:

```
src/
├── index.ts              # Entry point - Hono server setup
├── orpc.ts              # oRPC context and middleware configuration
├── contracts/           # API contract definitions (e.g., planet.ts)
│   └── index.ts        # Exported contract bundle
├── schemas/            # Zod schemas for validation (e.g., planet.ts)
└── features/
    └── planets/
        └── planet.controller.ts  # Controller implementations
```

**Pattern:**
- Contracts use `oc.route()` to define HTTP method and path
- Contracts are grouped and exported from `contracts/index.ts`
- Controllers use `@Controller()` and `@Implement(contract)` decorators
- Context type defined in `orpc.ts` as `ORPCContext`

### TypeScript Configuration

Projects use **ESNext modules** with **bundler resolution**:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,  // Required for @horn/orpc-hono
    "strict": true
  }
}
```

Path aliases are configured per-app (e.g., `@contracts/*`, `@schemas/*`).

### Turborepo Pipeline

Tasks defined in `turbo.json`:
- **build**: Depends on upstream builds (`^build`), outputs to `.next/**`
- **dev**: No caching, persistent task
- **lint**: Depends on upstream lints
- **check-types**: Depends on upstream type checks

## Key Implementation Details

### Contract-First Development

All API endpoints start with a contract definition:

```typescript
// contracts/resource.ts
import { oc } from '@orpc/contract'
import { InputSchema, OutputSchema } from '../schemas/resource'

export const getResource = oc
  .route({ method: 'GET', path: '/resources/:id' })
  .input(InputSchema)
  .output(OutputSchema)
```

### Decorator Pattern

Controllers use TypeScript decorators (requires `experimentalDecorators: true`):

```typescript
import { Controller, Implement } from '@horn/orpc-hono'

@Controller()
export class ResourceController {
  @Implement(getResource)
  get(input: GetResourceInput) {
    // Implementation
    return { /* matches OutputSchema */ }
  }
}
```

**Important:** `reflect-metadata` must be imported at the application entry point before any decorator usage.

### Context & Middleware

Application context is defined in `orpc.ts` and can include user authentication, request metadata, etc.:

```typescript
export interface ORPCContext {
  user?: UserType
}

export const pub = implement(contract).$context<ORPCContext>()
```

## Common Patterns

### Adding a New API Endpoint

1. Define Zod schemas in `schemas/`
2. Create contract in `contracts/` using `oc.route()`
3. Export contract from `contracts/index.ts`
4. Implement in a controller class with `@Implement(contract)`
5. Register controller with `registerController(app, controller, orpcHono)`

### Working with Turborepo

- Changes to shared configs (`eslint-config`, `typescript-config`) trigger rebuilds of dependent packages
- Use `--filter` to work on specific packages
- Turborepo caches builds - use `pnpm clean` if needed (though command not defined in root package.json)

## Prerequisites for Development

1. Node.js 18+ (22+ recommended for latest features)
2. pnpm 8+ (package manager is locked to pnpm@9.0.0)
3. TypeScript 5.0+ (using 5.9.2 in root)
4. Understanding of Hono framework and oRPC patterns

## Edge Runtime Support

The `@horn/orpc-hono` package is designed for edge compatibility:
- Cloudflare Workers
- Vercel Edge Functions
- Deno Deploy
- Fastly Compute@Edge
