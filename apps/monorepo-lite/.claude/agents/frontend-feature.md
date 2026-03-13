---
name: frontend-feature
description: Create Next.js pages and components with oRPC client integration
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Frontend Feature Agent

You create Next.js pages and components for the hono-next-turbo monorepo.

## Working Directory

Always work within `apps/web/`.

## Steps

1. **Read existing patterns** - Read `apps/web/app/auth/login/page.tsx` for page pattern
2. **Create page** - `app/{feature}/page.tsx`
3. **Add i18n keys** - Both `i18n/messages/en.json` and `i18n/messages/th.json`
4. **Add sidebar menu** - `components/app-layout/constants/menu.ts`
5. **Create sub-components** if needed - `app/{feature}/components/`

## Page Template

```typescript
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";

export default function {Feature}Page() {
  const t = useTranslations("{feature}");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { orpcClient } = await import("@/lib/orpc/orpc.client");
      const result = await orpcClient.{feature}.list({ page: 1, limit: 10 });
      setData(result.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => router.push("/{feature}/create")}>
          {t("create")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {data.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name || item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Render item fields */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## i18n Keys Template

### English (`i18n/messages/en.json`)

```json
{
  "{feature}": {
    "title": "{Feature}s",
    "create": "Create {Feature}",
    "edit": "Edit {Feature}",
    "delete": "Delete {Feature}",
    "confirmDelete": "Are you sure you want to delete this {feature}?",
    "created": "{Feature} created successfully",
    "updated": "{Feature} updated successfully",
    "deleted": "{Feature} deleted successfully",
    "notFound": "{Feature} not found",
    "error": "An error occurred"
  }
}
```

### Thai (`i18n/messages/th.json`)

```json
{
  "{feature}": {
    "title": "{Feature}",
    "create": "สร้าง{Feature}",
    "edit": "แก้ไข{Feature}",
    "delete": "ลบ{Feature}",
    "confirmDelete": "คุณแน่ใจหรือไม่ว่าต้องการลบ{feature}นี้?",
    "created": "สร้าง{feature}สำเร็จ",
    "updated": "แก้ไข{feature}สำเร็จ",
    "deleted": "ลบ{feature}สำเร็จ",
    "notFound": "ไม่พบ{feature}",
    "error": "เกิดข้อผิดพลาด"
  }
}
```

## Sidebar Menu Item

Add to `components/app-layout/constants/menu.ts`:

```typescript
{
  id: "{feature}",
  fallbackLabel: "{Feature}s",
  i18nToken: "menu.{feature}",
  icon: "{iconName}",  // lucide-react icon name
  href: "/{feature}",
},
```

Also add menu i18n key:
- English: `"menu": { "{feature}": "{Feature}s" }`
- Thai: `"menu": { "{feature}": "{Feature}" }`

## Rules

- Always use `"use client"` directive
- Dynamic import orpcClient: `const { orpcClient } = await import("@/lib/orpc/orpc.client")`
- Never use fetch/axios - always use orpcClient
- UI components from `@workspace/ui/components/*`
- Use `useTranslations()` for all user-visible text
- Always add both en and th translations
- Follow existing page patterns in the codebase
- Handle loading and error states
