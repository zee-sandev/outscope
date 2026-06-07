# Scaffolding

`@outscope/cli` keeps the GitHub scaffold flow.

```bash
outscope create my-api --template nova-api
```

Template names resolve to these GitHub paths:

| Template | GitHub path |
| --- | --- |
| `nova-api` | `templates/nova-api` |
| `nova-fn-api` | `templates/nova-fn-api` |
| `turbo-nova` | `templates/turbo-nova` |
| `turbo-nova-fn` | `templates/turbo-nova-fn` |

Use `nova-api` or `nova-fn-api` for small services. Use `turbo-nova` or `turbo-nova-fn` when the project needs shared route and schema packages.
