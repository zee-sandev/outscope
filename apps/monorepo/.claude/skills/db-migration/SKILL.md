---
name: db-migration
description: Create and run Prisma database migrations
user_invocable: true
---

# Database Migration

Edit Prisma schema and run migrations.

## Input

User provides: model name, fields, relations, or schema changes.

## Steps

### Step 1: Read Current Schema

Read `apps/api/prisma/schema.prisma` to understand existing models and relations.

### Step 2: Edit Schema

Edit `apps/api/prisma/schema.prisma` to add/modify models.

Follow these conventions:

```prisma
model {Model} {
  id        String   @id
  // fields...
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  {relation}Id String
  {relation}   {RelatedModel} @relation(fields: [{relation}Id], references: [id], onDelete: Cascade)

  @@map("{table_name}")
}
```

**Rules:**
- Primary key: `id String @id` (UUID set in application code)
- Table name: snake_case via `@@map()`
- Field names: camelCase
- Timestamps: `createdAt` + `updatedAt`
- Relations: always set `onDelete` (Cascade or SetNull)
- SQLite: no `@db.Uuid`, no `gen_random_uuid()`, no `@db.Text`

### Step 3: Run Migration

```bash
pnpm db:migrate
```

When prompted for migration name, use descriptive kebab-case (e.g., `add-posts-table`).

### Step 4: Generate Client

```bash
pnpm db:generate
```

This regenerates the Prisma client at `apps/api/src/generated/prisma/`.

### Step 5: Verify Types

```bash
pnpm --filter api typecheck
```

Check that existing code still compiles with the schema changes.

## Common Operations

### Add a New Model

```prisma
model Post {
  id        String   @id
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId String
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("post")
}
```

Don't forget to add the reverse relation on the related model:
```prisma
model User {
  // existing fields...
  posts Post[]
}
```

### Add a Field to Existing Model

```prisma
model User {
  // existing fields...
  bio String?  // nullable for backwards compatibility
}
```

### Add an Index

```prisma
model Post {
  // fields...
  @@index([authorId])
  @@map("post")
}
```

## Troubleshooting

### Migration fails on existing data

For SQLite, you may need to:
1. Make new fields optional (`?`) or add `@default()`
2. Or reset the database: `npx prisma migrate reset` (WARNING: deletes all data)

### Type errors after migration

Always run `pnpm db:generate` after `pnpm db:migrate`.

### Prisma client not found

```bash
pnpm db:generate
```

The client is generated to `apps/api/src/generated/prisma/`, not the default location.

## Protected Files

- Never manually edit files in `prisma/migrations/`
- Never manually edit files in `src/generated/prisma/`
