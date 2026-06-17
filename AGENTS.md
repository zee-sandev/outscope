# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Project Overview

This is a pnpm 10 monorepo for the `@outscope` Nova toolkit. Nova builds type-safe Hono + oRPC APIs with a clearer 2.0 DX vocabulary:

```txt
routes   = API route/schema definition
access   = global producer and policy registry
handlers = function implementations for @outscope/nova-fn
@Handle  = controller method binding for @outscope/nova
```

## Workspace

```txt
packages/
  nova/               Decorator-based framework
  nova-fn/            Functional framework
  cli/                Scaffolding and code generator
  eslint-config/      Shared ESLint config
  typescript-config/  Shared TypeScript config
examples/
  nova-basic/         Minimal decorator example
  nova-access/        Decorator access-policy example
  nova-fn-basic/      Minimal functional example
  nova-fn-access/     Functional access-policy example
templates/
  nova-api/           GitHub scaffold source for decorator API projects
  nova-fn-api/        GitHub scaffold source for functional API projects
  turbo-nova/         GitHub scaffold source for decorator turborepos
  turbo-nova-fn/      GitHub scaffold source for functional turborepos
```

The root workspace includes `examples/*` and `packages/*`. Templates are intentionally outside the workspace because the CLI downloads them as standalone projects from GitHub.

## Commands

Run from the repository root:

```bash
pnpm install
pnpm check-types
pnpm test
pnpm build
pnpm audit:architecture
```

Package-specific examples:

```bash
pnpm --filter @outscope/nova check-types
pnpm --filter @outscope/nova-fn test
pnpm --filter @outscope/cli build
pnpm --filter @outscope/example-nova-basic dev
```

The example API runs on `http://localhost:3000`.

## Nova 2.0 Patterns

Before generating app code, read `docs/ai/nova-patterns.md`. It is the canonical short guide for code agents.

Decorator apps use `routes`, `access`, and controllers:

```ts
const access = defineAccess({
  default: "public",
  policies: {
    public: { producer: pub },
    auth: { producer: authed },
    permission: { producer: permissioned },
  },
});

await createApp({
  routes,
  access,
  controllers: "src/features/**/*.controller.ts",
});
```

Controller methods use access decorators plus `@Handle`:

```ts
@Controller()
export class PlanetController {
  @Public()
  @Handle(routes.planet.list)
  list(input, ctx) {}

  @Permission("planet:create")
  @Handle(routes.planet.create)
  create(input, ctx) {}
}
```

Functional apps use `defineHandlers` and `handle`:

```ts
export const planetHandlers = defineHandlers(routes.planet, {
  list: handle.public(async (input, ctx) => {}),
  create: handle.permission("planet:create", async (input, ctx) => {}),
});
```

## Architecture Rules

- Do not use the old public names `contract`, `producer`, `operations`, or `@Implement` in new docs/examples.
- Keep `producer` only inside `access.policies.*.producer`.
- `@Middleware` is an advanced escape hatch, not the primary access API.
- Do not import app code from packages.
- Do not import CLI internals from runtime packages.
- Do not import from `dist`, `node_modules`, or generated output.
- Use `repomix` before deep analysis and never include `node_modules`, `dist`, or `.git` in context searches.

## Documentation

All public documentation must be English. Update `MIGRATION.md` whenever a breaking API change is introduced.
