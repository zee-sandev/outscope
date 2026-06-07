# Project Layout

Nova keeps learning material and scaffold sources separate.

## Packages

`packages/*` contains published packages and shared workspace config.

## Examples

`examples/*` contains small runnable projects used as code documents. They are part of the root workspace, so `pnpm build` and `pnpm check-types` validate them.

Current examples:

- `examples/nova-basic`
- `examples/nova-access`
- `examples/nova-fn-basic`
- `examples/nova-fn-access`

## Templates

`templates/*` contains standalone scaffold sources used by `@outscope/cli`.

Templates are not part of the root workspace. The CLI downloads this repository from GitHub, extracts the selected `templates/*` path, and copies it into the user's target project.
