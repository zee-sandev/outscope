# Naming Conventions

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| All source files | `kebab-case` | `auth.service.ts`, `create-post.ts` |
| Module files | `{feature}.{layer}.ts` | `auth.controller.ts`, `posts.service.ts` |
| Schema files | `{operation}.ts` or `entity.ts` | `login.ts`, `entity.ts` |
| Page files | `page.tsx`, `layout.tsx` | Next.js convention |
| Component files | `kebab-case.tsx` | `auth-form.tsx` |

## Class and Type Naming

| Type | Convention | Example |
|------|-----------|---------|
| Classes | `PascalCase` | `AuthController`, `PostsService` |
| Interfaces | `PascalCase` | `ORPCContext`, `AuthedORPCContext` |
| Types | `PascalCase` | `LoginInput`, `RegisterOutput` |
| Enums | `PascalCase` | `UserRole` |
| Constants | `SCREAMING_SNAKE_CASE` | `RPC_URL`, `CORS_ORIGINS` |

## Zod Schema Naming

| Type | Convention | Example |
|------|-----------|---------|
| Input schema | `{Operation}InputSchema` | `LoginInputSchema` |
| Output schema | `{Operation}OutputSchema` | `LoginOutputSchema` |
| Entity schema | `{Entity}Schema` | `UserSchema`, `SessionSchema` |
| Inferred types | `{Operation}Input/Output` | `LoginInput`, `RegisterOutput` |

## Contract Naming

| Type | Convention | Example |
|------|-----------|---------|
| Operation const | `camelCase` verb | `login`, `register`, `createPost` |
| Group export | `camelCase` noun | `auth`, `posts`, `users` |
| HTTP paths | `kebab-case` | `/auth/register`, `/posts/{id}` |

## Database Naming

| Type | Convention | Example |
|------|-----------|---------|
| Table names | `snake_case` (via `@@map`) | `@@map("posts")` |
| Column names | `camelCase` in Prisma, `snake_case` in DB | `userId` → `user_id` |
| Primary keys | `id String @id @default(uuid())` | UUID strings |
| Timestamps | `createdAt`, `updatedAt` | `@default(now())`, `@updatedAt` |
| Relations | singular for belongs-to, plural for has-many | `user User`, `posts Post[]` |

## Package Naming

| Type | Convention | Example |
|------|-----------|---------|
| Workspace packages | `@workspace/{name}` | `@workspace/contracts` |
| App packages | plain name | `api`, `web` |

## Module Directory Structure

```
modules/{feature}/
├── {feature}.controller.ts   # HTTP handler layer
├── {feature}.service.ts      # Business logic
├── {feature}.repository.ts   # Data access
├── {feature}.serializer.ts   # DB → API output transforms
└── index.ts                  # Barrel export (optional)
```

## Import Aliases (API)

| Alias | Resolves to |
|-------|------------|
| `@contracts/*` | `packages/contracts/src/*` |
| `@schemas/*` | `packages/schemas/src/*` |
| `@libs/*` | `apps/api/src/libs/*` |
| `@generated/*` | `apps/api/src/generated/*` |
| `@modules/*` | `apps/api/src/modules/*` |

## Import Aliases (Web)

| Alias | Resolves to |
|-------|------------|
| `@/*` | `apps/web/*` |
| `@workspace/ui/*` | `packages/ui/src/*` |
| `@workspace/contracts` | `packages/contracts/src/index.ts` |
| `@workspace/schemas/*` | `packages/schemas/src/*` |
| `@schemas/*` | `packages/schemas/src/*` |

## Error Handling

| Error type | Code | Usage |
|-----------|------|-------|
| Not authenticated | `UNAUTHORIZED` | Missing or invalid session |
| Forbidden action | `FORBIDDEN` | Valid session but insufficient permissions |
| Invalid input | `BAD_REQUEST` | Validation failure or business rule violation |
| Not found | `NOT_FOUND` | Resource does not exist |
| Server error | `INTERNAL_SERVER_ERROR` | Unexpected failures (via `@CatchErrors()`) |
