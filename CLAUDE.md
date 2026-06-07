# CLAUDE.md

This repository uses the Nova 2.0 API vocabulary:

```txt
routes   = API route/schema definition
access   = global producer and policy registry
handlers = function implementations for @outscope/nova-fn
@Handle  = controller method binding for @outscope/nova
```

## Commands

```bash
pnpm install
pnpm check-types
pnpm test
pnpm build
pnpm audit:architecture
```

## Packages

- `@outscope/nova`: decorator-based Hono + oRPC framework.
- `@outscope/nova-fn`: functional Hono + oRPC framework.
- `@outscope/cli`: project scaffolding and code generation.

## Preferred Patterns

Use `defineAccess` once at app startup:

```ts
const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: pub },
    auth: { producer: authed },
    permission: { producer: permissioned },
  },
})
```

Use `@Handle` with access decorators in `@outscope/nova`:

```ts
@Public()
@Handle(routes.user.get)
get(input, ctx) {}

@Permission('user:update')
@Handle(routes.user.update)
update(input, ctx) {}
```

Use `defineHandlers` and `handle` in `@outscope/nova-fn`:

```ts
export const userHandlers = defineHandlers(routes.user, {
  get: handle.public(async (input, ctx) => {}),
  update: handle.permission('user:update', async (input, ctx) => {}),
})
```

Do not introduce new public examples using `contract`, `producer`, `operations`, or `@Implement`. Those terms are only valid in migration notes or low-level implementation comments.
