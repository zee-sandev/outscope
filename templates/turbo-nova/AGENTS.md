# AGENTS.md

Guidance for code agents working in this Nova turborepo.

## Nova Pattern

This project uses `@outscope/nova`, the decorator API.

```txt
routes = API route/schema definition
access = global producer and policy registry
@Handle = controller method binding
```

## Workspace Layout

- `packages/routes`: shared route definitions.
- `packages/schemas`: shared Zod schemas and inferred types.
- `apps/api`: Hono API app, access policies, and controllers.

## Do

- Add route definitions to `packages/routes`.
- Add shared input/output schemas to `packages/schemas`.
- Configure `defineAccess` once in `apps/api`.
- Use `@Controller()` classes with `@Handle(routes.some.route)`.
- Keep `producer` only inside `access.policies.*.producer`.

## Do Not

- Do not create `contracts` packages or folders.
- Do not use `@Implement` or `operations`.
- Do not import app code from packages.
- Do not import package internals from app code.
