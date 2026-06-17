# @outscope Monorepo

Type-safe API tooling for Hono and oRPC.

Nova 2.0 uses a clearer DX vocabulary:

```txt
routes   = API route/schema definition
access   = global producer and policy registry
handlers = function implementations for @outscope/nova-fn
@Handle  = controller method binding for @outscope/nova
```

## Packages

- `@outscope/nova` - decorator-based Hono + oRPC framework for controller-style APIs.
- `@outscope/nova-fn` - functional Hono + oRPC framework with explicit handlers.
- `@outscope/cli` - scaffolding and code generation for Nova projects.
- `@outscope/eslint-config` and `@outscope/typescript-config` - shared development config.

## Quick Start

```bash
pnpm install
pnpm build
pnpm --filter @outscope/example-nova-basic dev
```

The example API runs on `http://localhost:3000`.

## Repository Layout

```txt
packages/   Published packages and shared configs
examples/   Small runnable learning projects
templates/  GitHub scaffold sources used by @outscope/cli
docs/       Concepts, guides, and release checklists
```

CLI scaffolding still downloads from GitHub. The selected template maps to one of:

- `templates/nova-api`
- `templates/nova-fn-api`
- `templates/turbo-nova`
- `templates/turbo-nova-fn`

## Decorator API

```ts
import { createApp, defineAccess, corsPlugin } from "@outscope/nova";
import { implement } from "@orpc/server";
import { routes } from "./routes";

const pub = implement(routes).$context<AppContext>();
const authed = pub.use(authMiddleware);
const permissioned = authed.use(permissionMiddleware);

const access = defineAccess({
  default: "public",
  policies: {
    public: { producer: pub },
    auth: { producer: authed },
    permission: { producer: permissioned },
  },
});

const app = await createApp({
  routes,
  access,
  controllers: "src/features/**/*.controller.ts",
  plugins: [corsPlugin({ origins: ["http://localhost:3000"] })],
});
```

```ts
import { Controller, Handle, Permission, Public } from "@outscope/nova";
import { routes } from "../../routes";

@Controller()
export class PlanetController {
  @Public()
  @Handle(routes.planet.list)
  list(input: ListPlanetsInput, ctx: AppContext) {
    return planetService.list(input);
  }

  @Permission("planet:create")
  @Handle(routes.planet.create)
  create(input: CreatePlanetInput, ctx: AppContextWithUser) {
    return planetService.create(input, ctx.user);
  }
}
```

## Functional API

```ts
import {
  createApp,
  defineAccess,
  defineHandlers,
  handle,
} from "@outscope/nova-fn";

export const planetHandlers = defineHandlers(routes.planet, {
  list: handle.public(async (input, ctx) => {
    return planetService.list(input);
  }),

  create: handle.permission("planet:create", async (input, ctx) => {
    return planetService.create(input, ctx.user);
  }),
});

const app = await createApp({
  routes,
  access,
  handlers: {
    planet: planetHandlers,
  },
});
```

## Development

```bash
pnpm install
pnpm check-types
pnpm test
pnpm build
pnpm audit:architecture
```

`pnpm audit:architecture` uses `dependency-cruiser` to enforce package boundaries and detect circular dependencies.

## For Code Agents

Read [docs/ai/nova-patterns.md](./docs/ai/nova-patterns.md) before generating Nova app code. New code should use `routes`, `access`, `handlers`, and `@Handle`. Do not create `src/contracts`, `operations`, or `@Implement` in public examples or scaffold output.

## Migration

Nova 2.0 is a breaking release. Read [MIGRATION.md](./MIGRATION.md) before upgrading from 1.x.
