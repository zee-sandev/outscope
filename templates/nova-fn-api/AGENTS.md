# AGENTS.md

Guidance for code agents working in this Nova Fn API project.

## Nova Pattern

This project uses `@outscope/nova-fn`, the functional handlers API.

```txt
routes   = API route/schema definition
access   = global producer and policy registry
handlers = function implementations
```

## Do

- Define API routes in `src/routes`.
- Configure `defineAccess` once near app startup.
- Implement endpoints with `defineHandlers(routes.feature, { ... })`.
- Use `handle.public`, `handle.auth`, or `handle.permission('scope:name')`.
- Keep `producer` only inside `access.policies.*.producer`.

## Do Not

- Do not create `src/contracts`.
- Do not use `operations`, `@Implement`, or controllers.
- Do not make ad hoc middleware the primary access API.
- Do not import from `dist`, generated output, or package internals.

## Example

```ts
export const userHandlers = defineHandlers(routes.users, {
  list: handle.public(async (input, ctx) => {
    return userService.list(input);
  }),
});
```
