# @outscope/cli

CLI for scaffolding and generating Nova 2.0 projects.

## Install

```bash
pnpm add -g @outscope/cli
```

You can also use:

```bash
npx @outscope/cli create my-app
```

## Commands

```bash
outscope create [project-name]
osp create [project-name]

outscope generate [type] [name]
osp generate [type] [name]
osp g [type] [name]
```

## Templates

- `nova-api` - decorator-based API using `@outscope/nova`
- `nova-fn-api` - functional API using `@outscope/nova-fn`
- `turbo-nova` - turborepo with a decorator API app and shared route/schema packages
- `turbo-nova-fn` - turborepo with a functional API app and shared route/schema packages

The CLI keeps the GitHub download flow. Template names resolve to `templates/*` paths in this repository.

```bash
outscope create my-api --template nova-api
outscope create my-workspace --template turbo-nova
```

For CI or scripted smoke tests:

```bash
outscope create my-api --template nova-api --yes --skip-outdated-check --skip-repomix
outscope create my-api --template nova-api --yes --install-dependencies --skip-repomix
```

## Code Generation

```bash
outscope g feature planet
```

Creates:

```txt
src/features/planets/
  planet.controller.ts
  planet.service.ts
  planet.repository.ts
  index.ts
src/contracts/planet.ts
src/schemas/planet.ts
```

Generated controllers use Nova 2.0 APIs:

```ts
import { Controller, Handle, Public } from '@outscope/nova'

@Controller()
export class PlanetController {
  @Public()
  @Handle(planet.list)
  list(input, ctx) {
    return planetService.list(input)
  }
}
```

## Development

```bash
pnpm install
pnpm --filter @outscope/cli check-types
pnpm --filter @outscope/cli test
pnpm --filter @outscope/cli build
```
