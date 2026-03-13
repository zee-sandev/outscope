# Changing Ports for Web and API Apps

This document describes all the files that need to be modified when changing the ports for `apps/web` and `apps/api`.

## Default Ports

| App   | Default Port |
|-------|--------------|
| API   | 3000         |
| Web   | 3001         |

## Files to Modify

### 1. `apps/web/package.json`

Update the dev server port in the scripts section:

```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 3001"
  }
}
```

Change `3001` to your desired web port.

---

### 2. `apps/api/src/index.ts`

Two places need to be updated:

**Line 8** - API server port:
```typescript
const PORT = Number(process.env.PORT) || 3000
```

**Line 10** - CORS origins (must match the web app port):
```typescript
process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3000'
```

Update these values to match your new ports.

---

### 3. `apps/web/lib/orpc/orpc.url.ts`

Update the default API URL:

```typescript
export const RPC_URL = new URL(
  "/rpc",
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
);
```

Change `3000` to your new API port.

---

### 4. `apps/web/app/page.tsx`

Update the fallback API URL:

```typescript
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
```

Change `3000` to your new API port.

---

## Environment Variables (Recommended)

Instead of hardcoding ports, you can use environment variables. Create or update `.env` files:

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### `apps/api/.env`
```env
PORT=3000
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
```

---

## Example: Changing to API=4000, Web=4001

| File | Original Value | New Value |
|------|----------------|-----------|
| `apps/web/package.json` | `--port 3001` | `--port 4001` |
| `apps/api/src/index.ts:8` | `\|\| 3000` | `\|\| 4000` |
| `apps/api/src/index.ts:10` | `localhost:3001,localhost:3000` | `localhost:4001,localhost:4000` |
| `apps/web/lib/orpc/orpc.url.ts` | `localhost:3000` | `localhost:4000` |
| `apps/web/app/page.tsx` | `localhost:3000` | `localhost:4000` |

---

## Verification

After making changes:

1. Restart both dev servers
2. Verify the API is accessible at the new port
3. Verify the web app can connect to the API (check browser console for CORS errors)
4. Test API calls from the web app
