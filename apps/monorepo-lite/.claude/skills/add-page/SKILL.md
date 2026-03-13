---
name: add-page
description: Create a new Next.js page with oRPC integration
user_invocable: true
---

# Add Page

Create a new Next.js page with oRPC client, i18n, and sidebar integration.

## Input

User provides: feature name, page type (list, detail, form), and description.

## Steps

### Step 1: Create Page Component

File: `apps/web/app/{feature}/page.tsx`

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
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      {/* Page content */}
    </div>
  );
}
```

### Step 2: Add i18n Keys (English)

File: `apps/web/i18n/messages/en.json`

Add to the JSON:

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
  },
  "menu": {
    "{feature}": "{Feature}s"
  }
}
```

### Step 3: Add i18n Keys (Thai)

File: `apps/web/i18n/messages/th.json`

Add to the JSON:

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
  },
  "menu": {
    "{feature}": "{Feature}"
  }
}
```

### Step 4: Add Sidebar Menu Item

File: `apps/web/components/app-layout/constants/menu.ts`

Add to `SIDEBAR_MENU_ITEMS` array:

```typescript
{
  id: "{feature}",
  fallbackLabel: "{Feature}s",
  i18nToken: "menu.{feature}",
  icon: "{iconName}",
  href: "/{feature}",
},
```

Choose an appropriate icon from lucide-react (e.g., fileText, users, settings, package, etc.)

### Step 5: Verify

Run `pnpm --filter web typecheck` to verify the page compiles.

## Additional Pages

For CRUD features, also create:

- `apps/web/app/{feature}/[id]/page.tsx` - Detail page
- `apps/web/app/{feature}/create/page.tsx` - Create form
- `apps/web/app/{feature}/[id]/edit/page.tsx` - Edit form

## Notes

- Always use `"use client"` directive
- Dynamic import orpcClient to avoid SSR issues
- All text must use `useTranslations()` - no hardcoded strings
- UI components from `@workspace/ui/components/*`
- Handle loading and error states in every page
