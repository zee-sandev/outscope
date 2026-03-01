# CLAUDE.md - Web (apps/web)

## Overview

Next.js 15 frontend with App Router, Turbopack, shadcn/ui, and oRPC client.

## Commands

```bash
pnpm dev              # Dev server with Turbopack (port 3001)
pnpm build            # Production build
pnpm start            # Run production server
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + fix
pnpm typecheck        # TypeScript type checking
```

## Architecture

```
app/
├── auth/
│   ├── login/page.tsx       # Login page
│   └── register/page.tsx    # Register page
├── [locale]/                # i18n routes (en, th)
│   └── layout.tsx
├── layout.tsx               # Root layout
└── page.tsx                 # Home page

components/
├── app-layout/
│   ├── constants/menu.ts    # Sidebar menu items
│   └── type/menu.ts         # MenuItem type
└── ...                      # Page-specific components

lib/
├── orpc/                    # oRPC client stack
│   ├── orpc.url.ts          # RPC_URL config
│   ├── orpc.link.ts         # RPCLink with auth headers
│   ├── orpc.client.ts       # Client-side orpcClient
│   ├── orpc.server.ts       # Server-side orpcClient
│   └── orpc.d.ts            # Global type declaration
└── stores/
    └── auth.store.ts        # Zustand auth store (persisted)

i18n/
├── messages/
│   ├── en.json              # English translations
│   └── th.json              # Thai translations
└── ...
```

## oRPC Client (API Integration)

**Always use orpcClient to call the API. Never use fetch/axios directly.**

### Client-Side Usage

```typescript
"use client";

export default function MyPage() {
  const handleAction = async () => {
    const { orpcClient } = await import("@/lib/orpc/orpc.client");
    const result = await orpcClient.{feature}.{operation}(input);
    // result is fully typed from contract output schema
  };
}
```

### Auth Headers (Automatic)

orpc.link.ts reads from Zustand auth store (localStorage):

- `Authorization: Bearer {session.token}`
- `x-tenant-id: {session.activeOrganizationId}`

### Contract Types

Types come from API via path aliases:

- `api/contracts` -> `../api/src/contracts/index.ts`
- `api/schemas/*` -> `../api/src/schemas/*/index.ts`
- `@schemas/*` -> `../api/src/schemas/*`
- `@generated/*` -> `../api/src/generated/*`

## UI Components

Import from `@workspace/ui`:

```typescript
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Icons } from "@workspace/ui/components/icons";
```

shadcn/ui style: new-york, Tailwind CSS v4.

## Auth Store (Zustand)

```typescript
import { useAuthStore } from "@/lib/stores/auth.store";

// Set auth after login
useAuthStore.getState().setAuth(user, session, organizations);

// Clear auth on logout
useAuthStore.getState().clearAuth();

// Read state in components
const { user, session, isAuthenticated, organizations } = useAuthStore();

// Switch organization
useAuthStore.getState().switchOrganization(orgId);
```

Persisted to `localStorage` key `auth-storage`.

## i18n (next-intl)

Locales: `en`, `th`

```typescript
import { useTranslations } from "next-intl";

export default function MyPage() {
  const t = useTranslations("feature");
  return <h1>{t("title")}</h1>;
}
```

Add keys to both `i18n/messages/en.json` and `i18n/messages/th.json`.

## Sidebar Menu

Edit `components/app-layout/constants/menu.ts`:

```typescript
export const SIDEBAR_MENU_ITEMS: MenuItem[] = [
  {
    id: "feature",
    fallbackLabel: "Feature",
    i18nToken: "menu.feature",
    icon: "iconName",  // from lucide-react via Icons
    href: "/feature",
  },
];
```

## Page Pattern

Standard pattern for new pages:

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
// ... more UI imports

export default function FeaturePage() {
  const t = useTranslations("feature");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      const { orpcClient } = await import("@/lib/orpc/orpc.client");
      const result = await orpcClient.feature.action(input);
      // handle result
    } catch (err: any) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (/* JSX */);
}
```

## Adding a New Page

1. Create page: `app/{feature}/page.tsx` (follow page pattern above)
2. Add i18n keys: `i18n/messages/en.json` + `i18n/messages/th.json`
3. Add sidebar menu item: `components/app-layout/constants/menu.ts`
4. API calls available immediately via `orpcClient.{feature}.{operation}()`

## Path Aliases

```
@/*              -> ./*
@workspace/ui/*  -> ../../packages/ui/src/*
api/contracts    -> ../api/src/contracts/index.ts
api/schemas/*    -> ../api/src/schemas/*/index.ts
@schemas/*       -> ../api/src/schemas/*
@generated/*     -> ../api/src/generated/*
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - API URL (default: http://localhost:3000)
