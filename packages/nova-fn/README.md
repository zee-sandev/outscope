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
import {
  createApp,
  defineAccess,
  defineHandle,
  defineHandlers,
  type AccessMetadata,
} from '@outscope/nova-fn'
import { implement } from '@orpc/server'
import { routes } from './routes'

const pub = implement(routes).$context<AppContext>()

const access = defineAccess({
  default: 'public',
  policies: {
    public: { kind: 'plain', producer: pub },
    auth: { kind: 'plain', uses: 'public', middleware: requireAuth() },
    permission: {
      kind: 'permission',
      uses: 'auth',
      middleware: (metadata: AccessMetadata) =>
        requirePermission(metadata.permissions ?? []),
    },
  },
})

const handle = defineHandle(access)

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

## Composable Access Policies

`defineAccess` is the source of truth for policy shape and composition.

- `kind: "plain"` creates handlers like `handle.auth(handler)`.
- `kind: "permission"` creates handlers like `handle.permission("task:create", handler)` and curried `handle.permission("task:create")(handler)`.
- `uses` composes parent policies before the child policy.
- `middleware` appends one access check to the composed chain.
- `middlewares` appends multiple checks.
- `producer` remains supported for compatibility and for root producers.

```ts
const access = defineAccess({
  default: 'public',
  policies: {
    public: { kind: 'plain', producer: pub },
    auth: { kind: 'plain', uses: 'public', middleware: requireAuth() },
    staff: { kind: 'plain', uses: 'auth', middleware: requireStaff() },
    adminPermission: {
      kind: 'permission',
      uses: 'staff',
      middleware: (metadata: AccessMetadata) =>
        requireAdminPermission(metadata.permissions ?? []),
    },
  },
})

const handle = defineHandle(access)

export const inspectTenant = handle.adminPermission(
  'tenant:inspect',
  async (input, ctx) => {
    return tenantService.inspect(input, ctx)
  },
)
```

This composes the runtime chain as:

```ts
pub
  .use(requireAuth())
  .use(requireStaff())
  .use(requireAdminPermission(['tenant:inspect']))
```

Policy names such as `staff` or `adminPermission` belong to your app. Nova only uses `kind` to choose the handler declaration shape.

## Access Metadata

Handlers and middleware receive access metadata through context:

```ts
ctx.access = {
  policy: 'permission',
  permissions: ['planet:create'],
}
```

Middleware factories also receive the same metadata:

```ts
permission: {
  kind: "permission",
  uses: "auth",
  middleware: (metadata: AccessMetadata) =>
    requirePermission(metadata.permissions ?? []),
}
```

Policies without `kind` remain backward compatible. In `defineHandle(access)`, omitted `kind` is treated as `"plain"`, except a policy literally named `permission`, which is treated as `"permission"` for compatibility.

## Public API

- `createApp`
- `defineAccess`
- `defineHandle`
- `defineHandlers`
- `handle.public`
- `handle.auth`
- `handle.permission`
- `handle.custom`
- `corsPlugin`, `loggerPlugin`, `openapiPlugin`, `errorHandlerPlugin`

## For Code Agents

When generating Nova functional apps, create route definitions under `src/routes`, configure `defineAccess` once, and implement endpoints with `defineHandlers(routes.feature, { action: handle.public(...) })`. Do not generate `src/contracts`, `operations`, controllers, or `@Implement`.

## Migration

Nova 2.0 is a breaking release. See the root `MIGRATION.md`.
