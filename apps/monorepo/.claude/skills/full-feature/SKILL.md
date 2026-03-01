---
name: full-feature
description: Create a complete feature end-to-end (DB + API + Frontend)
user_invocable: true
---

# Full Feature

Create a complete feature from database to frontend.

## Input

User provides: feature name, description, fields, and CRUD operations needed.

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Feature name | kebab-case | `blog-posts` |
| DB table | snake_case (@@map) | `blog_post` |
| Prisma model | PascalCase | `BlogPost` |
| File names | kebab-case | `blog-post.controller.ts` |
| Contract key | camelCase | `blogPosts` |
| Route path | kebab-case | `/blog-posts` |
| Frontend route | kebab-case | `/blog-posts` |
| i18n key | camelCase | `blogPosts` |

## Steps

### Step 1: Database (Prisma Schema)

Edit `apps/api/prisma/schema.prisma`:

```prisma
model {Model} {
  id        String   @id
  // feature fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("{table_name}")
}
```

Then run:
```bash
pnpm db:migrate
pnpm db:generate
```

### Step 2: API Schema

Create `apps/api/src/schemas/{feature}/index.ts`:

Define all Zod schemas and export types:
- `List{Feature}InputSchema` / `List{Feature}OutputSchema`
- `Get{Feature}InputSchema` / `{Feature}OutputSchema`
- `Create{Feature}InputSchema`
- `Update{Feature}InputSchema`
- `Delete{Feature}InputSchema` / `Delete{Feature}OutputSchema`

### Step 3: API Contract

Create `apps/api/src/contracts/{feature}.ts`:

Define oRPC contracts with `oc.route()`:
- `list` - GET `/{feature}`
- `get` - GET `/{feature}/:id`
- `create` - POST `/{feature}`
- `update` - PUT `/{feature}/:id`
- `delete` - DELETE `/{feature}/:id`

Register in `apps/api/src/contracts/index.ts`.

### Step 4: API Repository

Create `apps/api/src/features/{feature}/{feature}.repository.ts`:

Prisma queries: `findMany`, `findById`, `create`, `update`, `delete`

### Step 5: API Service

Create `apps/api/src/features/{feature}/{feature}.service.ts`:

Business logic with error handling using `ORPCError`.

### Step 6: API Serializer

Create `apps/api/src/features/{feature}/{feature}.serializer.ts`:

Transform DB models to API output format.

### Step 7: API Controller

Create `apps/api/src/features/{feature}/{feature}.controller.ts`:

```typescript
@Controller()
export class {Feature}Controller {
  @CatchErrors()
  @Implement({feature}Contract.list)
  async list(input, context: ORPCContext) { ... }

  @CatchErrors()
  @Implement({feature}Contract.get)
  async get(input, context: ORPCContext) { ... }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement({feature}Contract.create)
  async create(input, context: AuthedORPCContext) { ... }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement({feature}Contract.update)
  async update(input, context: AuthedORPCContext) { ... }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement({feature}Contract.delete)
  async delete(input, context: AuthedORPCContext) { ... }
}
```

### Step 8: Frontend - List Page

Create `apps/web/app/{feature}/page.tsx`:

- `"use client"` directive
- `useTranslations("{feature}")`
- Dynamic import `orpcClient`
- List items with loading/error states

### Step 9: Frontend - i18n

Add keys to both:
- `apps/web/i18n/messages/en.json`
- `apps/web/i18n/messages/th.json`

### Step 10: Frontend - Sidebar Menu

Edit `apps/web/components/app-layout/constants/menu.ts`:

Add menu item with appropriate lucide-react icon.

### Step 11: Verification

Run all checks:

```bash
pnpm typecheck
pnpm lint
```

## Checklist

- [ ] Prisma model created with conventions
- [ ] Migration run successfully
- [ ] Prisma client regenerated
- [ ] Zod schemas with all CRUD operations
- [ ] oRPC contracts with routes and tags
- [ ] Contract registered in index.ts
- [ ] Repository with Prisma queries
- [ ] Service with business logic + error handling
- [ ] Serializer for DB-to-API transformation
- [ ] Controller with decorators (auto-loaded)
- [ ] Frontend list page
- [ ] i18n keys (en + th)
- [ ] Sidebar menu item
- [ ] typecheck passes
- [ ] lint passes
