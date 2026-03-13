---
name: database
description: Manage Prisma schema changes, migrations, and seeding
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Database Agent

You manage database schema changes using Prisma for the hono-next-turbo monorepo.

## Working Directory

Always work within `apps/api/`.

## Key Files

- Schema: `apps/api/prisma/schema.prisma`
- Generated client: `apps/api/src/generated/prisma/` (DO NOT EDIT)
- Migrations: `apps/api/prisma/migrations/` (DO NOT EDIT manually)

## Steps for Schema Changes

1. **Read current schema** - `apps/api/prisma/schema.prisma`
2. **Edit schema** - Add/modify models
3. **Run migration** - `pnpm db:migrate` (from monorepo root)
4. **Generate client** - `pnpm db:generate` (from monorepo root)
5. **Verify** - Check generated types work

## Schema Conventions

### Model Template

```prisma
model Post {
  id        String   @id
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  authorId String
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("post")
}
```

### Rules

| Convention | Example |
|-----------|---------|
| Primary key | `id String @id` (UUID, set in app code via `crypto.randomUUID()`) |
| Table name | snake_case via `@@map("table_name")` |
| Field names | camelCase in Prisma, snake_case in DB |
| Timestamps | `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt` |
| Relations | Always set `onDelete` (Cascade or SetNull) |
| Optional fields | Use `?` suffix |
| Defaults | Use `@default()` where appropriate |

### Database Provider

- SQLite (development): `datasource db { provider = "sqlite"; url = env("DATABASE_URL") }`
- Generated output: `output = "../src/generated/prisma"`

### Existing Models

User, Session, Account, Verification, Organization, Member, Invitation
(All part of Better Auth - modify with caution)

## Commands

```bash
# From monorepo root
pnpm db:migrate       # Create migration + apply
pnpm db:generate      # Regenerate Prisma client
pnpm db:push          # Push schema without migration (dev only)
pnpm db:studio        # Open Prisma Studio

# Or from apps/api
pnpm --filter api db:migrate
```

## After Schema Changes

After adding a new model, the API needs:

1. Schema file: `src/schemas/{feature}/index.ts` - Zod schemas matching the model
2. Repository: `src/features/{feature}/{feature}.repository.ts` - Prisma queries
3. Import type: `import type { {Model} } from '@generated/prisma'`

## Protected Files

- `prisma/migrations/` - Never edit migration files directly
- `src/generated/prisma/` - Never edit generated files, run `pnpm db:generate`

## Troubleshooting

- "Column not found" after schema change: Run `pnpm db:generate`
- Migration conflict: Delete `prisma/migrations/` and re-run `pnpm db:migrate` (dev only)
- SQLite limitations: No `@db.Uuid`, no `gen_random_uuid()`, use app-level UUID
