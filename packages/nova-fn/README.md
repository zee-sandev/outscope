# @outscope/nova-fn

Functional Hono + oRPC framework for type-safe APIs.

Nova 2.0 uses:

```txt
routes   = API route/schema definition
access   = global producer and policy registry
handlers = function implementations
```

## Install

```bash
pnpm add @outscope/nova-fn hono @orpc/contract @orpc/server zod
```

## App Setup

```ts
import { createApp, defineAccess, defineHandlers, handle } from '@outscope/nova-fn'
import { implement } from '@orpc/server'
import { routes } from './contracts'

const pub = implement(routes).$context<AppContext>()
const authed = pub.use(authMiddleware)
const permissioned = authed.use(permissionMiddleware)

const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: pub },
    auth: { producer: authed },
    permission: { producer: permissioned },
  },
})

export const planetHandlers = defineHandlers(routes.planet, {
  list: handle.public(async (input, ctx) => {
    return planetService.list(input)
  }),

  create: handle.permission('planet:create', async (input, ctx) => {
    return planetService.create(input, ctx.user)
  }),
})

const app = await createApp({
  routes,
  access,
  handlers: {
    planet: planetHandlers,
  },
})
```

## Access Metadata

Handlers and middleware receive access metadata through context:

```ts
ctx.access = {
  policy: 'permission',
  permissions: ['planet:create'],
}
```

## Public API

- `createApp`
- `defineAccess`
- `defineHandlers`
- `handle.public`
- `handle.auth`
- `handle.permission`
- `handle.custom`
- `corsPlugin`, `loggerPlugin`, `openapiPlugin`, `errorHandlerPlugin`

## Migration

Nova 2.0 is a breaking release. See the root `MIGRATION.md`.
