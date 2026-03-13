# Adding Features: Step-by-Step Guide

## Overview

A "feature" in this monorepo spans 3 layers: database → API → frontend.
Follow this order to add any new feature end-to-end.

---

## Step 1: Database Schema

Edit `apps/api/prisma/schema.prisma`:

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@map("posts")
}
```

Then run migrations:

```bash
pnpm db:migrate   # creates migration + updates DB
pnpm db:generate  # regenerates Prisma client
```

---

## Step 2: Schemas (in `packages/schemas/`)

Create `packages/schemas/src/posts/entity.ts`:

```typescript
import { z } from 'zod'

export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Post = z.infer<typeof PostSchema>
```

Create `packages/schemas/src/posts/operations/create-post.ts`:

```typescript
import { z } from 'zod'
import { PostSchema } from '../entity'

export const CreatePostInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

export type CreatePostInput = z.infer<typeof CreatePostInputSchema>

export const CreatePostOutputSchema = z.object({
  post: PostSchema,
})

export type CreatePostOutput = z.infer<typeof CreatePostOutputSchema>
```

Create `packages/schemas/src/posts/index.ts`:

```typescript
export * from './entity'
export * from './operations/create-post'
// ... other operations
```

Export from `packages/schemas/src/index.ts`:

```typescript
export * from './posts'
```

---

## Step 3: Contract (in `packages/contracts/`)

Create `packages/contracts/src/posts.ts`:

```typescript
import { oc } from '@orpc/contract'
import { CreatePostInputSchema, CreatePostOutputSchema } from '@workspace/schemas/posts'

export const createPost = oc
  .route({
    method: 'POST',
    path: '/posts',
    summary: 'Create a post',
    tags: ['Posts'],
  })
  .input(CreatePostInputSchema)
  .output(CreatePostOutputSchema)

export const posts = {
  create: createPost,
}
```

Register in `packages/contracts/src/index.ts`:

```typescript
import { auth } from './auth'
import { posts } from './posts'

export const contract = {
  auth,
  posts,
}
```

---

## Step 4: API Module (in `apps/api/src/modules/`)

### Repository (`posts.repository.ts`)

```typescript
import { prisma } from '@libs/prisma'
import type { Post } from '@generated/prisma'

export const postsRepository = {
  create: async (data: { title: string; content: string; userId: string }): Promise<Post> => {
    return prisma.post.create({ data: { id: crypto.randomUUID(), ...data } })
  },
}
```

### Service (`posts.service.ts`)

```typescript
import { postsRepository } from './posts.repository'
import type { CreatePostInput } from '@schemas/posts'

export const postsService = {
  create: async (input: CreatePostInput, userId: string) => {
    return postsRepository.create({ ...input, userId })
  },
}
```

### Serializer (`posts.serializer.ts`)

```typescript
import type { Post as PrismaPost } from '@generated/prisma'
import type { CreatePostOutput } from '@schemas/posts'

export const postsSerializer = {
  toCreateOutput: (post: PrismaPost): CreatePostOutput => ({
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      userId: post.userId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    },
  }),
}
```

### Controller (`posts.controller.ts`) — auto-loaded by glob

```typescript
import { Controller, Implement, Middleware, CatchErrors } from '@outscope/nova'
import { posts as postsContract } from '@contracts/posts'
import type { CreatePostInput, CreatePostOutput } from '@schemas/posts'
import type { AuthedORPCContext } from '@libs/orpc/context'
import { authMiddleware } from '@libs/orpc/orpc'
import { postsService } from './posts.service'
import { postsSerializer } from './posts.serializer'

@Controller()
export class PostsController {
  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement(postsContract.create)
  async create(input: CreatePostInput, context: AuthedORPCContext): Promise<CreatePostOutput> {
    const post = await postsService.create(input, context.auth.userId)
    return postsSerializer.toCreateOutput(post)
  }
}
```

---

## Step 5: Frontend

The API is immediately available via `orpcClient`:

```typescript
"use client";
import { useState } from "react";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");

  const handleSubmit = async () => {
    const { orpcClient } = await import("@/lib/orpc/orpc.client");
    const result = await orpcClient.posts.create({ title, content: "..." });
    // result.post is fully typed from PostSchema
    console.log(result.post.id);
  };

  return <button onClick={handleSubmit}>Create Post</button>;
}
```

Add sidebar menu item in `apps/web/components/app-layout/constants/menu.ts`:

```typescript
{ id: "posts", fallbackLabel: "Posts", i18nToken: "menu.posts", icon: "fileText", href: "/posts" }
```

Add i18n keys in `apps/web/i18n/messages/en.json` and `th.json`.

---

## Checklist

- [ ] `prisma/schema.prisma` — new model
- [ ] `pnpm db:migrate && pnpm db:generate`
- [ ] `packages/schemas/src/{feature}/` — entity + operations
- [ ] `packages/schemas/src/index.ts` — add export
- [ ] `packages/contracts/src/{feature}.ts` — routes
- [ ] `packages/contracts/src/index.ts` — register
- [ ] `apps/api/src/modules/{feature}/` — repository, service, serializer, controller
- [ ] `apps/web/app/{feature}/page.tsx` — page
- [ ] i18n messages (en + th)
- [ ] Sidebar menu item
- [ ] `pnpm typecheck` — verify types
