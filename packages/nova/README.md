# @outscope/nova

Decorator-based Hono + oRPC framework for type-safe APIs.

Nova 2.0 uses:

```txt
routes = API route/schema definition
access = global producer and policy registry
@Handle = controller method binding
```

## Install

```bash
pnpm add @outscope/nova hono @orpc/contract @orpc/server zod reflect-metadata
```

Import `reflect-metadata` once in the application entrypoint.

## App Setup

```ts
import "reflect-metadata";
import {
  createApp,
  defineAccess,
  corsPlugin,
  loggerPlugin,
  openapiPlugin,
} from "@outscope/nova";
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
  plugins: [
    corsPlugin({ origins: ["http://localhost:3000"] }),
    loggerPlugin({ level: "debug", pretty: true }),
    openapiPlugin({ title: "API", version: "2.0.0" }),
  ],
});
```

## Controllers

```ts
import { Auth, Controller, Handle, Permission, Public } from "@outscope/nova";

@Controller()
export class PlanetController {
  @Public()
  @Handle(routes.planet.list)
  list(input: ListPlanetsInput, ctx: AppContext) {
    return planetService.list(input);
  }

  @Auth()
  @Handle(routes.planet.mine)
  mine(input: unknown, ctx: AppContextWithUser) {
    return planetService.mine(ctx.user);
  }

  @Permission("planet:create")
  @Handle(routes.planet.create)
  create(input: CreatePlanetInput, ctx: AppContextWithUser) {
    return planetService.create(input, ctx.user);
  }
}
```

## Access Policies

Access policies choose the oRPC producer used for a handler. The selected metadata is added to context:

```ts
ctx.access = {
  policy: "permission",
  permissions: ["planet:create"],
};
```

Permission middleware should read `ctx.access.permissions`.

## Public API

- `createApp`
- `defineAccess`
- `Controller`
- `Handle`
- `Public`
- `Auth`
- `Permission`
- `Middleware` for advanced middleware only
- `CatchErrors`
- `corsPlugin`, `loggerPlugin`, `openapiPlugin`, `errorHandlerPlugin`

## For Code Agents

When generating Nova decorator apps, create route definitions under `src/routes`, configure `defineAccess` once, and bind controller methods with access decorators plus `@Handle(routes.feature.action)`. Do not generate `src/contracts`, `operations`, or `@Implement`.

## Migration

Nova 2.0 is a breaking release. See the root `MIGRATION.md`.
