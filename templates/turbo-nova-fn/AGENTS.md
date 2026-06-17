# AGENTS.md

Guidance for code agents working in this Nova Fn turborepo.

## Nova Pattern

This project uses `@outscope/nova-fn`, the functional handlers API.

```txt
routes   = API route/schema definition
access   = global producer and policy registry
handlers = function implementations
```

## Workspace Layout

- `packages/routes`: shared route definitions.
- `packages/schemas`: shared Zod schemas and inferred types.
- `apps/api`: Hono API app, access policies, and handlers.

## Do

- Add route definitions to `packages/routes`.
- Add shared input/output schemas to `packages/schemas`.
- Configure `defineAccess` once in `apps/api`.
- Derive handlers with `const handle = defineHandle(access)`.
- Implement endpoints with `defineHandlers(routes.feature, { ... })`.
- Use `handle.public`, `handle.auth`, or `handle.permission('scope:name')`.
- Keep `producer` only inside `access.policies.*.producer`.

## Do Not

- Do not create `contracts` packages or folders.
- Do not use `operations`, `@Implement`, or controllers.
- Do not import app code from packages.
- Do not import package internals from app code.
