# Migrating from Nova 1.x to 2.0

Nova 2.0 is a clean breaking release. It replaces internal oRPC wording with user-facing API names.

## Naming Changes

| Nova 1.x | Nova 2.0 | Meaning |
| --- | --- | --- |
| `contract` | `routes` | API route/schema definition |
| `producer` | `access.policies.*.producer` | Global access pipeline registry |
| `operations` | `handlers` | Functional route implementations |
| `@Implement` | `@Handle` | Controller method binding |
| `@Middleware(authMiddleware)` | `@Auth()` or `@Permission(...)` | Access policy selection |

## App Configuration

Before:

```ts
const app = await createApp({
  contract,
  producer: pub,
  controllers: 'src/features/**/*.controller.ts',
})
```

After:

```ts
const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: pub },
    auth: { producer: authed },
    permission: { producer: permissioned },
  },
})

const app = await createApp({
  routes,
  access,
  controllers: 'src/features/**/*.controller.ts',
})
```

## Controller Migration

Before:

```ts
@Controller()
export class PlanetController {
  @Middleware(authMiddleware)
  @Implement(planet.create)
  create(input: CreatePlanetInput, ctx: AppContext) {
    return planetService.create(input)
  }
}
```

After:

```ts
@Controller()
export class PlanetController {
  @Permission('planet:create')
  @Handle(routes.planet.create)
  create(input: CreatePlanetInput, ctx: AppContextWithUser) {
    return planetService.create(input, ctx.user)
  }
}
```

## Functional Migration

Before:

```ts
export const planetOperations = {
  create: operation(planet.create, async (input, ctx) => {
    return planetService.create(input)
  }).build(),
}

await createApp({
  contract,
  producer: pub,
  operations: {
    planet: planetOperations,
  },
})
```

After:

```ts
export const planetHandlers = defineHandlers(routes.planet, {
  create: handle.permission('planet:create')(async (input, ctx) => {
    return planetService.create(input, ctx.user)
  }),
})

await createApp({
  routes,
  access,
  handlers: {
    planet: planetHandlers,
  },
})
```

## Access Metadata

Access policy metadata is attached to context:

```ts
ctx.access = {
  policy: 'permission',
  permissions: ['planet:create'],
}
```

Permission middleware should read `ctx.access.permissions` instead of hardcoding permission names in feature modules.

## Checklist

- Rename exported route bundles from `contract` to `routes`.
- Replace `producer` with `defineAccess({ default, policies })`.
- Replace `@Implement` with `@Handle`.
- Replace auth middleware decorators with `@Auth()` or `@Permission(...)`.
- Rename functional `operations` maps to `handlers`.
- Run `pnpm check-types`, `pnpm test`, `pnpm build`, and `pnpm audit:architecture`.
