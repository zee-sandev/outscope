# Quick Start

This guide shows the Nova 2.0 API.

## Install

```bash
pnpm install
```

## Run the Example

```bash
pnpm --filter @outscope/example-nova-basic dev
```

The server runs on `http://localhost:3000`.

## Create Routes

```ts
import { oc } from '@orpc/contract'
import { z } from 'zod'

export const getUser = oc
  .route({ method: 'GET', path: '/users/:id' })
  .input(z.object({ id: z.string() }))
  .output(z.object({ id: z.string(), name: z.string() }))

export const routes = {
  user: {
    get: getUser,
  },
}
```

## Configure Access

```ts
import { defineAccess } from '@outscope/nova'
import { implement } from '@orpc/server'
import { routes } from './contracts'

const pub = implement(routes).$context<AppContext>()
const authed = pub.use(authMiddleware)
const permissioned = authed.use(permissionMiddleware)

export const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: pub },
    auth: { producer: authed },
    permission: { producer: permissioned },
  },
})
```

`ctx.access` is available inside handlers and access middleware:

```ts
ctx.access = {
  policy: 'permission',
  permissions: ['user:update'],
}
```

## Decorator Style

```ts
import { Controller, Handle, Permission, Public } from '@outscope/nova'

@Controller()
export class UserController {
  @Public()
  @Handle(routes.user.get)
  get(input: GetUserInput, ctx: AppContext) {
    return userService.get(input.id)
  }

  @Permission('user:update')
  @Handle(routes.user.update)
  update(input: UpdateUserInput, ctx: AppContextWithUser) {
    return userService.update(input, ctx.user)
  }
}
```

## Functional Style

```ts
import { defineHandlers, handle } from '@outscope/nova-fn'

export const userHandlers = defineHandlers(routes.user, {
  get: handle.public(async (input, ctx) => {
    return userService.get(input.id)
  }),

  update: handle.permission('user:update', async (input, ctx) => {
    return userService.update(input, ctx.user)
  }),
})
```

## Scaffold a Project

The CLI downloads templates from GitHub and reads the selected scaffold from `templates/*`.

```bash
outscope create my-api --template nova-api
outscope create my-fn-api --template nova-fn-api
outscope create my-workspace --template turbo-nova
outscope create my-fn-workspace --template turbo-nova-fn
```

## Verify

```bash
pnpm check-types
pnpm test
pnpm build
pnpm audit:architecture
```
