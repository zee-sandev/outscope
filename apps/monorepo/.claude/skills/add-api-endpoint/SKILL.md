---
name: add-api-endpoint
description: Create a new API endpoint following contract-first pattern
user_invocable: true
---

# Add API Endpoint

Create a new API endpoint with full contract-first implementation.

## Input

User provides: feature name, operation name, HTTP method, path, and field descriptions.

## Steps

### Step 1: Create/Update Zod Schema

File: `apps/api/src/schemas/{feature}/index.ts`

Read existing file if it exists. Add new input/output schemas:

```typescript
import { z } from 'zod'

export const {Operation}InputSchema = z.object({
  // fields based on user description
})

export const {Operation}OutputSchema = z.object({
  // fields based on user description
})

export type {Operation}Input = z.infer<typeof {Operation}InputSchema>
export type {Operation}Output = z.infer<typeof {Operation}OutputSchema>
```

### Step 2: Create/Update Contract

File: `apps/api/src/contracts/{feature}.ts`

```typescript
import { oc } from '@orpc/contract'
import { {Operation}InputSchema, {Operation}OutputSchema } from '@schemas/{feature}'

export const {operation} = oc
  .route({
    method: '{METHOD}',
    path: '/{feature}/{path}',
    summary: '{Summary}',
    description: '{Description}',
    tags: ['{Feature}'],
  })
  .input({Operation}InputSchema)
  .output({Operation}OutputSchema)
```

### Step 3: Register Contract

File: `apps/api/src/contracts/index.ts`

Add the new feature contract to the aggregation:

```typescript
import { {feature} } from './{feature}'

export const contract = {
  auth,
  {feature},  // Add new feature
}
```

### Step 4: Create/Update Repository

File: `apps/api/src/features/{feature}/{feature}.repository.ts`

Add Prisma query method:

```typescript
import { prisma } from '@libs/prisma'

export const {feature}Repository = {
  // Add method for the new operation
} as const
```

### Step 5: Create/Update Service

File: `apps/api/src/features/{feature}/{feature}.service.ts`

Add business logic method:

```typescript
import { ORPCError } from '@orpc/server'
import { createLogger } from '@outscope/orpc-hono'
import { {feature}Repository } from './{feature}.repository'

const logger = createLogger({ level: 'debug', pretty: true })

export const {feature}Service = {
  // Add method for the new operation
} as const
```

### Step 6: Create/Update Serializer

File: `apps/api/src/features/{feature}/{feature}.serializer.ts`

Add output transformer:

```typescript
export const {feature}Serializer = {
  // Add transformation method
} as const
```

### Step 7: Create/Update Controller

File: `apps/api/src/features/{feature}/{feature}.controller.ts`

Add controller method with decorators:

```typescript
import { Controller, Implement, Middleware, CatchErrors } from '@outscope/orpc-hono'
import { {feature} as {feature}Contract } from '@contracts/{feature}'
import type { ORPCContext, AuthedORPCContext } from '@libs/orpc/context'
import { authMiddleware } from '@libs/orpc/orpc'

@Controller()
export class {Feature}Controller {
  @CatchErrors()
  @Middleware(authMiddleware)  // Add if endpoint needs auth
  @Implement({feature}Contract.{operation})
  async {operation}(input: {Operation}Input, context: AuthedORPCContext): Promise<{Operation}Output> {
    const result = await {feature}Service.{operation}(input)
    return {feature}Serializer.{operation}ToOutput(result)
  }
}
```

### Step 8: Verify

Run `pnpm typecheck` to verify everything compiles.

## Notes

- Controller is auto-loaded by glob pattern - no manual registration
- Frontend can immediately call: `orpcClient.{feature}.{operation}(input)`
- Swagger UI auto-generated at `http://localhost:3000`
