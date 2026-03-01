# AI-Powered Development Guide

## Prerequisites

- Claude Code CLI installed (`claude --version`)
- Node.js 20+, pnpm 10.4.1+

## Quick Start with Claude Code

### 1. Open Claude Code in project

```bash
cd hono-next-turbo
claude
```

### 2. Ruflo MCP (Automatic)

When you open Claude Code it will detect `.mcp.json` automatically:

- First time: Claude Code will ask you to approve the Ruflo MCP server
- After that: Ruflo is ready (Collective Memory + Token Optimization)

### 3. Available Skills (Slash Commands)

| Command | Description |
|---------|-------------|
| `/add-api-endpoint` | Create a new API endpoint (contract-first) |
| `/add-page` | Create a new Next.js page |
| `/db-migration` | Run a database migration |
| `/full-feature` | Create a full feature (DB + API + Frontend) |

### 4. Available Agents

Invoke via Claude Code Task tool:

| Agent | Purpose |
|-------|---------|
| `api-feature` | Create API features following contract-first pattern |
| `frontend-feature` | Create Next.js pages/components |
| `database` | Manage Prisma schema + migrations |
| `code-reviewer` | Review code quality + security |
| `test-runner` | Run tests, lint, typecheck |

## Workflow Examples

### Create a Full Feature

1. Type: "Create a posts feature with full CRUD"
2. Claude will use `/full-feature` skill automatically:
   - Create Prisma model -> migrate -> generate
   - Create contracts, schemas, controller/service/repository
   - Create Next.js pages + i18n
   - Verify with typecheck + lint

### Create a Single API Endpoint

1. Type: "Add endpoint GET /posts/:id"
2. Claude will use `/add-api-endpoint` skill:
   - Create Zod schema + contract
   - Implement in controller/service/repository
   - Frontend can call it immediately via `orpcClient.posts.getById()`

### Review Code

1. Type: "review code in features/auth"
2. Claude will invoke the `code-reviewer` agent to check:
   - Architecture compliance
   - Security (auth, input validation)
   - TypeScript best practices

## oRPC: Frontend-Backend Integration

This template uses oRPC as the bridge between frontend and backend.

### Call API from Frontend

```typescript
const { orpcClient } = await import("@/lib/orpc/orpc.client");
const posts = await orpcClient.posts.list({ page: 1 }); // fully typed!
```

### Type Safety

- Contracts define input/output schemas (Zod)
- Frontend imports types via path aliases automatically
- No need for fetch wrappers - orpcClient handles everything

### Auth Headers

- Auth token sent automatically (Bearer token from Zustand store)
- Multi-tenant: `x-tenant-id` header sent automatically

## Ruflo: Collective Memory & Token Savings

### Collective Memory

- Ruflo remembers patterns, solutions, and context across sessions
- Reduces re-explaining project structure each session

### Token Optimization (~30-50% savings)

| Optimization | Savings | How |
|---|---|---|
| ReasoningBank | -32% | Cache successful reasoning patterns |
| Agent Booster (WASM) | -15% | Skip LLM for simple code transforms |
| Pattern caching | -10% | Reuse from collective memory |
| Optimal batching | -20% | Group operations in single messages |

## Hooks (Automatic)

### Auto-Format

When Claude writes/edits files -> prettier formats automatically.

### File Protection

Claude is prevented from editing:

- `.env` files (use `.env.example` instead)
- `prisma/migrations/` (use `pnpm db:migrate`)
- `src/generated/` (use `pnpm db:generate`)

## Advanced: Ruflo Full Setup (Optional)

If you want the full Ruflo experience (daemon, presets, hooks), you can run the wizard:

```bash
npx ruflo@latest init --wizard    # Choose No if asked to overwrite CLAUDE.md
npx ruflo doctor --fix            # Verify and fix any setup issues
npx ruflo daemon start            # Start background workers (optional)
```

> **Note:** This is NOT required. The `.mcp.json` config gives you access to all 215 Ruflo MCP tools automatically.
> Only run `ruflo init` if you want Ruflo's own presets, skills, and hooks on top of the project's existing configuration.

## Troubleshooting

### Ruflo MCP not working

```bash
npx ruflo doctor --fix
```

### TypeScript errors after schema change

```bash
pnpm db:generate && pnpm typecheck
```

### oRPC client types not updating

Restart TypeScript server in your IDE.
