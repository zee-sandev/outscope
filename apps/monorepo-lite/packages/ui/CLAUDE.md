# CLAUDE.md - UI Package (packages/ui)

## Overview

Shared UI component library using shadcn/ui (new-york style) with Tailwind CSS v4.
Published as `@workspace/ui` within the monorepo.

## Commands

```bash
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + fix
```

### Adding Components

```bash
# From monorepo root
pnpm dlx shadcn@latest add button --path packages/ui/src/components
```

## Structure

```
src/
├── components/        # shadcn/ui components (*.tsx)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── alert.tsx
│   ├── icons.tsx      # Lucide icon re-exports
│   └── ...
├── hooks/             # Shared React hooks (*.ts)
├── lib/               # Utilities (cn, etc.) (*.ts)
│   └── utils.ts
└── styles/
    └── globals.css    # Tailwind CSS globals
```

## Exports (package.json)

```json
{
  "./globals.css": "./src/styles/globals.css",
  "./postcss.config": "./postcss.config.mjs",
  "./lib/*": "./src/lib/*.ts",
  "./components/*": "./src/components/*.tsx",
  "./hooks/*": "./src/hooks/*.ts"
}
```

## Usage in Apps

```typescript
// Components
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Icons } from "@workspace/ui/components/icons";

// Utilities
import { cn } from "@workspace/ui/lib/utils";

// Styles (in layout/globals)
import "@workspace/ui/globals.css";
```

## Conventions

- Style: shadcn/ui new-york variant
- CSS: Tailwind CSS v4
- Icons: lucide-react (re-exported via icons.tsx)
- Each component is a single .tsx file
- Use `class-variance-authority` for variants
- Use `tailwind-merge` via `cn()` utility
