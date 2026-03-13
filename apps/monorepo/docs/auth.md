# Auth: Better Auth + oRPC Integration

## Overview

Authentication uses [Better Auth](https://better-auth.com) with the organization plugin. The API exposes auth via two surfaces:

1. **oRPC endpoints** (`/rpc/auth.*`) — type-safe, used by frontend via `orpcClient`
2. **Better Auth native endpoints** (`/api/auth/**`) — session management, org operations

## Auth Flow

```
Frontend                        API                          Better Auth
   │                             │                                │
   │  orpcClient.auth.login()    │                                │
   ├────────────────────────────►│                                │
   │   POST /rpc/auth.login      │  auth.api.signInEmail()        │
   │                             ├───────────────────────────────►│
   │                             │◄───────────────────────────────┤
   │                             │  { user, token, session }      │
   │◄────────────────────────────┤                                │
   │  { user, session }          │                                │
   │                             │                                │
   │  Store token in Zustand     │                                │
   │                             │                                │
   │  orpcClient.auth.me()       │                                │
   ├────────────────────────────►│                                │
   │  GET /rpc/auth.me           │  auth.api.getSession()         │
   │  Authorization: Bearer {t}  ├───────────────────────────────►│
   │                             │◄───────────────────────────────┤
   │◄────────────────────────────┤  { user, session }             │
   │  { user, session, orgs }    │                                │
```

## How `auth.api.getSession()` Works

The `authMiddleware` in `apps/api/src/libs/orpc/orpc.ts` uses the official Better Auth pattern:

```typescript
export const authMiddleware = pub.middleware(async ({ next, context }) => {
  // context.headers comes from the raw HTTP request (set in createContext)
  const session = await auth.api.getSession({ headers: context.headers })

  if (!session?.user || !session?.session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' })
  }

  return next({
    context: {
      ...context,
      auth: {
        userId: session.user.id,
        email: session.user.email,
        tenantId: session.session.activeOrganizationId ?? '',
      },
    },
  })
})
```

Better Auth reads the `Authorization: Bearer {token}` header (or cookie) internally and validates against the database. No manual DB queries needed.

## Context Setup

`createContext` in `apps/api/src/libs/orpc/context.ts` passes raw request headers to the context:

```typescript
export async function createContext({ honoContext }) {
  return {
    honoContext,
    headers: honoContext.req.raw.headers,  // Required for auth.api.getSession()
  }
}
```

## Protected vs Public Endpoints

```typescript
@Controller()
export class FeatureController {
  // Public — no auth
  @CatchErrors()
  @Implement(featureContract.list)
  async list(input, context: ORPCContext) { ... }

  // Protected — requires valid session
  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement(featureContract.create)
  async create(input, context: AuthedORPCContext) {
    // context.auth is guaranteed non-null here
    const { userId, tenantId, email } = context.auth
    ...
  }
}
```

## Better Auth Native Endpoints

Mounted in `apps/api/src/index.ts`:

```typescript
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))
```

Available endpoints (handled by Better Auth natively):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/session` | Get current session |
| `POST` | `/api/auth/sign-out` | Sign out |
| `GET` | `/api/auth/organization/list` | List user's organizations |
| `POST` | `/api/auth/organization/set-active` | Set active organization |

## Multi-Tenant (Organization) Support

- Users can belong to multiple organizations
- `session.activeOrganizationId` tracks the active tenant
- `context.auth.tenantId` is available in all protected endpoints
- Organization creation is handled in `auth.service.ts` during registration

## Frontend Auth Store

The web app uses Zustand (`apps/web/lib/stores/auth.store.ts`) to persist session:

- Token stored in localStorage under `auth-storage`
- `orpc.link.ts` automatically injects `Authorization: Bearer {token}` header
- Multi-tenant: `x-tenant-id: {activeOrganizationId}` header also injected

## Session Configuration

In `apps/api/src/libs/auth.ts`:

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,  // 7 days
  updateAge: 60 * 60 * 24,       // Refresh every 24 hours
}
```
