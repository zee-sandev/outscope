# Nova Patterns for Code Agents

Use this file when generating or editing Nova applications. Prefer these patterns over older oRPC vocabulary.

## Vocabulary

```txt
routes   = API route/schema definition
access   = global producer and policy registry
handlers = function implementations for @outscope/nova-fn
@Handle  = controller method binding for @outscope/nova
```

## Rules

- Name route/schema bundles `routes`, `userRoutes`, or `projectRoutes`.
- Put route files under `src/routes/`, not `src/contracts/`.
- Configure access once near app startup with `defineAccess`.
- Use `producer` only inside `access.policies.*.producer`.
- Use `ctx.access.permissions` in permission middleware.
- Do not generate `operations`, `@Implement`, or `@Middleware` as the primary access API.
- Do not import app code from packages or package internals from app code.

## Decorator App

Use `@outscope/nova` for controller-style APIs.

```ts
import "reflect-metadata";
import {
  Controller,
  Handle,
  Permission,
  Public,
  createApp,
  defineAccess,
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

@Controller()
class ProjectController {
  @Public()
  @Handle(routes.projects.list)
  list(input: ListProjectsInput, ctx: AppContext) {
    return projectService.list(input);
  }

  @Permission("project:create")
  @Handle(routes.projects.create)
  create(input: CreateProjectInput, ctx: AppContext) {
    return projectService.create(input, ctx);
  }
}

await createApp({
  routes,
  access,
  controllers: [ProjectController],
});
```

## Functional App

Use `@outscope/nova-fn` for explicit function maps.

```ts
import {
  createApp,
  defineAccess,
  defineHandlers,
  handle,
} from "@outscope/nova-fn";
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

export const projectHandlers = defineHandlers(routes.projects, {
  list: handle.public(async (input, ctx) => {
    return projectService.list(input);
  }),
  create: handle.permission("project:create", async (input, ctx) => {
    return projectService.create(input, ctx);
  }),
});

await createApp({
  routes,
  access,
  handlers: {
    projects: projectHandlers,
  },
});
```

## Route Files

```ts
import { oc } from "@orpc/contract";
import { z } from "zod";

const projectOutput = z.object({
  id: z.string(),
  name: z.string(),
});

export const projectRoutes = {
  list: oc
    .route({ method: "GET", path: "/projects" })
    .output(projectOutput.array()),
  create: oc
    .route({ method: "POST", path: "/projects" })
    .input(z.object({ name: z.string().min(1) }))
    .output(projectOutput),
};
```

Then compose the app routes:

```ts
export const routes = {
  projects: projectRoutes,
};
```
