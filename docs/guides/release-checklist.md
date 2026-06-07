# Release Checklist

Before publishing a Nova release:

```bash
pnpm install
pnpm check-types
pnpm test
pnpm build
pnpm audit:architecture
```

Also verify:

- Public docs use `routes`, `access`, `handlers`, and `@Handle`.
- Migration notes cover any breaking changes.
- CLI templates point to `templates/*`.
- Templates use published `@outscope/*` package ranges.
