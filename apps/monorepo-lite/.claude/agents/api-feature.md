---
name: api-feature
description: Create API features following contract-first OOP pattern with @outscope/nova
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# API Feature Agent

You create API features for the hono-next-turbo monorepo following the contract-first OOP pattern.

## Working Directory

Always work within `apps/api/src/`.

## Steps

1. **Read existing patterns** - Read `apps/api/src/features/auth/` files to understand the patterns
2. **Create schema** - `src/schemas/{feature}/index.ts`
3. **Create contract** - `src/contracts/{feature}.ts`
4. **Register contract** - Add to `src/contracts/index.ts`
5. **Create repository** - `src/features/{feature}/{feature}.repository.ts`
6. **Create service** - `src/features/{feature}/{feature}.service.ts`
7. **Create serializer** - `src/features/{feature}/{feature}.serializer.ts`
8. **Create controller** - `src/features/{feature}/{feature}.controller.ts`

## Template: Schema (`src/schemas/{feature}/index.ts`)

```typescript
import { z } from 'zod'

// === Input Schemas ===

export const List{Feature}InputSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
})

export const Get{Feature}InputSchema = z.object({
  id: z.string(),
})

export const Create{Feature}InputSchema = z.object({
  // fields
})

export const Update{Feature}InputSchema = z.object({
  id: z.string(),
  // fields
})

export const Delete{Feature}InputSchema = z.object({
  id: z.string(),
})

// === Output Schemas ===

export const {Feature}OutputSchema = z.object({
  id: z.string(),
  // fields
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const List{Feature}OutputSchema = z.object({
  items: z.array({Feature}OutputSchema),
  total: z.number(),
})

export const Delete{Feature}OutputSchema = z.object({
  success: z.boolean(),
})

// === Types ===

export type List{Feature}Input = z.infer<typeof List{Feature}InputSchema>
export type Get{Feature}Input = z.infer<typeof Get{Feature}InputSchema>
export type Create{Feature}Input = z.infer<typeof Create{Feature}InputSchema>
export type Update{Feature}Input = z.infer<typeof Update{Feature}InputSchema>
export type Delete{Feature}Input = z.infer<typeof Delete{Feature}InputSchema>
export type {Feature}Output = z.infer<typeof {Feature}OutputSchema>
export type List{Feature}Output = z.infer<typeof List{Feature}OutputSchema>
export type Delete{Feature}Output = z.infer<typeof Delete{Feature}OutputSchema>
```

## Template: Contract (`src/contracts/{feature}.ts`)

```typescript
import { oc } from '@orpc/contract'
import {
  List{Feature}InputSchema, List{Feature}OutputSchema,
  Get{Feature}InputSchema, {Feature}OutputSchema,
  Create{Feature}InputSchema,
  Update{Feature}InputSchema,
  Delete{Feature}InputSchema, Delete{Feature}OutputSchema,
} from '@schemas/{feature}'

export const list = oc
  .route({ method: 'GET', path: '/{feature}', summary: 'List {feature}s', tags: ['{Feature}'] })
  .input(List{Feature}InputSchema)
  .output(List{Feature}OutputSchema)

export const get = oc
  .route({ method: 'GET', path: '/{feature}/:id', summary: 'Get {feature}', tags: ['{Feature}'] })
  .input(Get{Feature}InputSchema)
  .output({Feature}OutputSchema)

export const create = oc
  .route({ method: 'POST', path: '/{feature}', summary: 'Create {feature}', tags: ['{Feature}'] })
  .input(Create{Feature}InputSchema)
  .output({Feature}OutputSchema)

export const update = oc
  .route({ method: 'PUT', path: '/{feature}/:id', summary: 'Update {feature}', tags: ['{Feature}'] })
  .input(Update{Feature}InputSchema)
  .output({Feature}OutputSchema)

export const del = oc
  .route({ method: 'DELETE', path: '/{feature}/:id', summary: 'Delete {feature}', tags: ['{Feature}'] })
  .input(Delete{Feature}InputSchema)
  .output(Delete{Feature}OutputSchema)

export const {feature} = { list, get, create, update, delete: del }
```

## Template: Controller (`src/features/{feature}/{feature}.controller.ts`)

```typescript
import { Controller, Implement, Middleware, CatchErrors } from '@outscope/nova'
import { {feature} as {feature}Contract } from '@contracts/{feature}'
import type { ORPCContext, AuthedORPCContext } from '@libs/orpc/context'
import { authMiddleware } from '@libs/orpc/orpc'
import { {feature}Service } from './{feature}.service'
import { {feature}Serializer } from './{feature}.serializer'

@Controller()
export class {Feature}Controller {
  @CatchErrors()
  @Implement({feature}Contract.list)
  async list(input, context: ORPCContext) {
    const result = await {feature}Service.list(input)
    return {feature}Serializer.listToOutput(result)
  }

  @CatchErrors()
  @Implement({feature}Contract.get)
  async get(input, context: ORPCContext) {
    const result = await {feature}Service.get(input.id)
    return {feature}Serializer.toOutput(result)
  }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement({feature}Contract.create)
  async create(input, context: AuthedORPCContext) {
    const result = await {feature}Service.create(input)
    return {feature}Serializer.toOutput(result)
  }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement({feature}Contract.update)
  async update(input, context: AuthedORPCContext) {
    const result = await {feature}Service.update(input.id, input)
    return {feature}Serializer.toOutput(result)
  }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement({feature}Contract.delete)
  async delete(input, context: AuthedORPCContext) {
    await {feature}Service.delete(input.id)
    return { success: true }
  }
}
```

## Template: Repository (`src/features/{feature}/{feature}.repository.ts`)

```typescript
import { prisma } from '@libs/prisma'
import type { {Feature} } from '@generated/prisma'

export const {feature}Repository = {
  findMany: async (page: number, limit: number): Promise<{ items: {Feature}[]; total: number }> => {
    const [items, total] = await Promise.all([
      prisma.{feature}.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.{feature}.count(),
    ])
    return { items, total }
  },

  findById: async (id: string): Promise<{Feature} | null> => {
    return prisma.{feature}.findUnique({ where: { id } })
  },

  create: async (data: Omit<{Feature}, 'id' | 'createdAt' | 'updatedAt'>): Promise<{Feature}> => {
    return prisma.{feature}.create({ data: { id: crypto.randomUUID(), ...data } })
  },

  update: async (id: string, data: Partial<{Feature}>): Promise<{Feature}> => {
    return prisma.{feature}.update({ where: { id }, data })
  },

  delete: async (id: string): Promise<void> => {
    await prisma.{feature}.delete({ where: { id } })
  },
} as const
```

## Template: Service (`src/features/{feature}/{feature}.service.ts`)

```typescript
import { ORPCError } from '@orpc/server'
import { createLogger } from '@outscope/nova'
import { {feature}Repository } from './{feature}.repository'

const logger = createLogger({ level: 'debug', pretty: true })

export const {feature}Service = {
  list: async (input: { page?: number; limit?: number }) => {
    return {feature}Repository.findMany(input.page ?? 1, input.limit ?? 10)
  },

  get: async (id: string) => {
    const item = await {feature}Repository.findById(id)
    if (!item) throw new ORPCError('NOT_FOUND', { message: '{Feature} not found' })
    return item
  },

  create: async (input: any) => {
    return {feature}Repository.create(input)
  },

  update: async (id: string, input: any) => {
    const existing = await {feature}Repository.findById(id)
    if (!existing) throw new ORPCError('NOT_FOUND', { message: '{Feature} not found' })
    return {feature}Repository.update(id, input)
  },

  delete: async (id: string) => {
    const existing = await {feature}Repository.findById(id)
    if (!existing) throw new ORPCError('NOT_FOUND', { message: '{Feature} not found' })
    await {feature}Repository.delete(id)
  },
} as const
```

## Template: Serializer (`src/features/{feature}/{feature}.serializer.ts`)

```typescript
import type { {Feature} } from '@generated/prisma'

const toOutput = (item: {Feature}) => ({
  id: item.id,
  // map fields
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

const listToOutput = (result: { items: {Feature}[]; total: number }) => ({
  items: result.items.map(toOutput),
  total: result.total,
})

export const {feature}Serializer = { toOutput, listToOutput } as const
```

## Rules

- Always use `@CatchErrors()` on every controller method
- Use `@Middleware(authMiddleware)` for write operations (create, update, delete)
- Public reads (list, get) don't need auth middleware
- Follow kebab-case file naming
- Export everything as `const ... = { ... } as const`
- Register contract in `src/contracts/index.ts`
- Controller is auto-loaded - no manual registration needed
