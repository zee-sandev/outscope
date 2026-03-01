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
- After that: Ruflo is ready (Hive Mind + Collective Memory + Token Optimization)

> Ruflo is initialized automatically during project creation via `ruflo init --start-all --force`.
> To re-initialize or update: `npx ruflo@latest init --start-all --force`

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

---

## Ruflo Hive Mind: Multi-Agent Orchestration

Ruflo Hive Mind enables queen-led hierarchical coordination where a strategic queen agent directs specialized workers through collective decision-making and shared memory. This is the recommended approach for complex, multi-file feature development.

### Architecture

```
                    ┌─────────────┐
                    │    Queen    │  Strategic orchestrator
                    │  (Claude)  │  Task planning & delegation
                    └──────┬──────┘
           ┌───────────┬───┴───┬───────────┐
      ┌────┴────┐ ┌────┴────┐ ┌┴─────────┐ ┌┴─────────┐
      │Architect│ │  Coder  │ │  Tester  │ │ Analyst  │
      │ design  │ │  impl   │ │  verify  │ │ optimize │
      └─────────┘ └─────────┘ └──────────┘ └──────────┘
           │           │            │            │
           └───────────┴─────┬──────┴────────────┘
                        Shared Memory
                    (SQLite + Neural Patterns)
```

### Worker Specializations

| Worker | Role | Capabilities |
|--------|------|-------------|
| **Architect** | Systems design | Component relationships, domain modeling, API design |
| **Coder** | Implementation | Code writing, bug fixes, refactoring |
| **Tester** | Quality assurance | Test creation, validation, coverage analysis |
| **Analyst** | Performance | Metrics analysis, pattern identification, optimization |
| **Researcher** | Information gathering | Library evaluation, best practices, solution exploration |
| **Reviewer** | Code quality | Security audit, convention compliance, code review |
| **Optimizer** | Efficiency | Performance tuning, bundle optimization, query optimization |
| **Documenter** | Documentation | API docs, inline comments, architecture docs |

### Initialization

Ruflo Hive Mind is initialized automatically during project creation. To manually initialize or reconfigure:

```bash
# Full initialization (recommended - runs automatically on project create)
npx ruflo@latest init --start-all --force

# Initialize with specific topology
npx ruflo@latest hive init --topology hierarchical --agents 8

# Initialize with mesh topology for collaborative tasks
npx ruflo@latest hive init --topology mesh --agents 5

# Verify setup
npx ruflo@latest doctor --fix
```

### Topology Selection Guide

| Topology | Agents | Best For | Coordination | Efficiency |
|----------|--------|----------|-------------|-----------|
| **hierarchical** | 6-8 | Structured development, feature teams | Queen-directed | High |
| **mesh** | 4-6 | Collaborative exploration, brainstorming | Peer-to-peer | Moderate |
| **hierarchical-mesh** | 10-15 | Large features, cross-cutting concerns | Hybrid | Very high |
| **ring** | 3-5 | Sequential pipelines (schema → API → frontend) | Sequential | High consistency |
| **star** | 3-6 | Simple tasks, centralized control | Hub-spoke | High control |

**Recommended defaults:**
- Simple feature (1-2 files): No hive needed, single agent
- Standard feature (3-6 files): `hierarchical` with 4-6 agents
- Complex feature (7+ files, cross-cutting): `hierarchical-mesh` with 8-12 agents

### Orchestration Modes

```bash
# Parallel - independent concurrent tasks (fastest)
npx ruflo@latest orchestrate "build user dashboard" --parallel

# Sequential - dependent ordered tasks (safest)
npx ruflo@latest orchestrate "deploy to production" --sequential

# Adaptive - auto-switches based on task dependencies (recommended)
npx ruflo@latest orchestrate "add CRUD feature" --adaptive

# Hybrid - mixed parallel/sequential for large projects
npx ruflo@latest orchestrate "full-stack refactor" --hybrid
```

### Using Hive Mind via MCP Tools

When inside Claude Code, use Ruflo MCP tools directly:

```
# Initialize swarm for a task
mcp__ruflo__swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})

# Spawn specialized agents
mcp__ruflo__agent_spawn({ type: "architect", name: "api-designer", capabilities: ["oRPC", "contract-first"] })
mcp__ruflo__agent_spawn({ type: "coder", name: "backend-dev", capabilities: ["hono", "prisma", "typescript"] })
mcp__ruflo__agent_spawn({ type: "coder", name: "frontend-dev", capabilities: ["nextjs", "react", "tailwind"] })
mcp__ruflo__agent_spawn({ type: "tester", name: "qa", capabilities: ["typecheck", "lint", "build"] })
```

### Recommended Team Compositions

#### Full Feature Team (hierarchical, 4 agents)

```
Queen → architect (schema + contract design)
     → coder-backend (controller/service/repository)
     → coder-frontend (Next.js pages + orpcClient)
     → tester (typecheck + lint + build verification)
```

#### Quality Assurance Team (mesh, 3 agents)

```
reviewer ↔ tester ↔ optimizer
(code review) (test coverage) (performance)
```

#### Database Migration Team (ring, 3 agents)

```
architect → coder → tester
(schema)   (migration) (verify)
```

---

## Ruflo: Maximum Efficiency Guide

### Token Optimization (~30-50% savings)

| Optimization | Savings | Mechanism |
|---|---|---|
| **ReasoningBank** | -32% | Cache successful reasoning patterns for reuse |
| **Agent Booster (WASM)** | -15% | Skip LLM calls for deterministic code transforms |
| **Pattern caching** | -10% | Reuse solutions from collective memory |
| **Optimal batching** | -20% | Group independent operations in single messages |

### Collective Memory

Ruflo persists patterns, solutions, and architectural decisions across sessions:

```bash
# Store a key insight
mcp__ruflo__memory_store({ key: "auth-pattern", value: "...", namespace: "architecture" })

# Search past solutions
mcp__ruflo__memory_search({ query: "prisma migration rollback", limit: 5 })

# Retrieve specific knowledge
mcp__ruflo__memory_retrieve({ key: "auth-pattern", namespace: "architecture" })
```

**What gets remembered automatically:**
- Successful code patterns and solutions
- Project-specific conventions and preferences
- Common error resolutions
- Architecture decisions and rationale

### Best Practices for Maximum Efficiency

1. **Match topology to task complexity**
   - Don't use 8 agents for a 2-file change
   - Use `hierarchical` for most development tasks
   - Reserve `hierarchical-mesh` for cross-cutting refactors

2. **Leverage pattern caching**
   - Use consistent naming conventions (Ruflo learns them)
   - Follow the contract-first pattern (Ruflo caches the workflow)
   - Repeated similar features get faster each time

3. **Batch operations**
   - Group related file reads in a single message
   - Combine independent tool calls (parallel execution)
   - Use slash commands (`/full-feature`) for structured multi-step workflows

4. **Use auto-scaling wisely**
   ```bash
   npx ruflo@latest hive config set auto-scale true
   npx ruflo@latest hive config set min-agents 2
   npx ruflo@latest hive config set max-agents 12
   ```

5. **Monitor and optimize**
   ```bash
   npx ruflo@latest hive monitor --live
   npx ruflo@latest hive stats --by-agent --metric success-rate
   npx ruflo@latest hive analyze --metric coordination-efficiency
   ```

### Ruflo Configuration Override

The project is pre-configured with optimal Ruflo settings. To override or reset:

```bash
# Force re-initialize (overwrites existing Ruflo config)
npx ruflo@latest init --start-all --force

# Selective re-init with enhanced features
npx ruflo@latest init --enhanced --force

# Re-init with verification mode
npx ruflo@latest init --verify --force

# Fix configuration issues
npx ruflo@latest doctor --fix
```

> The `--force` flag ensures existing Ruflo configuration is overwritten.
> This is safe - project-specific settings in `.mcp.json` and `.claude/` are preserved.

---

## Hooks (Automatic)

### Auto-Format

When Claude writes/edits files -> prettier formats automatically.

### File Protection

Claude is prevented from editing:

- `.env` files (use `.env.example` instead)
- `prisma/migrations/` (use `pnpm db:migrate`)
- `src/generated/` (use `pnpm db:generate`)

## Troubleshooting

### Ruflo MCP not working

```bash
npx ruflo@latest doctor --fix
```

### Ruflo config outdated or corrupted

```bash
npx ruflo@latest init --start-all --force
```

### Hive agents not coordinating

```bash
npx ruflo@latest hive health --comprehensive
npx ruflo@latest hive recovery --auto --strategy conservative
```

### TypeScript errors after schema change

```bash
pnpm db:generate && pnpm typecheck
```

### oRPC client types not updating

Restart TypeScript server in your IDE.
