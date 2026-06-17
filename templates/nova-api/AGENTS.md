# AGENTS.md

Guidance for code agents working in this Nova API project.

## Nova Pattern

This project uses `@outscope/nova`, the decorator API.

```txt
routes = API route/schema definition
access = global producer and policy registry
@Handle = controller method binding
```

## Do

- Define API routes in `src/routes`.
- Configure `defineAccess` once near app startup.
- Use `@Controller()` classes with `@Handle(routes.some.route)`.
- Put access intent on controller methods with `@Public()`, `@Auth()`, or `@Permission('scope:name')`.
- Keep `producer` only inside `access.policies.*.producer`.

## Do Not

- Do not create `src/contracts`.
- Do not use `@Implement` or `operations`.
- Do not make `@Middleware` the primary access API.
- Do not import from `dist`, generated output, or package internals.

## Example

```ts
@Controller()
class UserController {
  @Public()
  @Handle(routes.users.list)
  list(input, ctx) {
    return userService.list(input);
  }
}
```
