# Full-Stack Monorepo Template

A production-ready full-stack monorepo template featuring **Next.js 15**, **Hono**, **oRPC**, **Prisma**, and **shadcn/ui**.

## Features

- **Next.js 15** - React 19, App Router, Turbopack
- **shadcn/ui** - Beautiful, accessible components (Tailwind v4)
- **Better Auth** - Authentication with session management
- **Type-Safe API** - End-to-end type safety with oRPC
- **Prisma ORM** - SQLite (default) or PostgreSQL
- **Auto-Generated Docs** - Swagger UI from contracts
- **Internationalization** - English + Thai with next-intl
- **Monorepo** - pnpm workspaces + Turbo

## Project Structure

```
monorepo/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # Hono + oRPC backend
├── packages/
│   ├── ui/           # Shared shadcn/ui components
│   ├── eslint-config/
│   └── typescript-config/
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10.4.1+

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd hono-next-turbo
pnpm install
```

### 2. Setup Environment

```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma client
pnpm db:generate

# Push schema to database (creates SQLite file)
pnpm db:push
```

### 3. Start Development

```bash
pnpm dev
```

This starts:
- Frontend: http://localhost:3001
- API: http://localhost:3000
- Swagger UI: http://localhost:3000

## Available Scripts

### Root Commands

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages and apps
pnpm lint             # Lint all packages
pnpm typecheck        # Type-check all packages
pnpm format           # Format all code with Prettier
```

### Database Commands

```bash
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Create and run migrations
pnpm db:studio        # Open Prisma Studio GUI
```

## Adding Features

### 1. Add a New API Feature

```bash
# Create feature directory
mkdir -p apps/api/src/features/your-feature

# Create files:
# - your-feature.controller.ts
# - your-feature.service.ts
# - your-feature.repository.ts
```

### 2. Create a Contract

```typescript
// apps/api/src/contracts/your-feature.ts
import { oc } from "@orpc/contract";
import { z } from "zod";

export const yourFeature = oc.router({
  list: oc.route({ method: "GET", path: "/your-feature" })
    .output(z.array(YourSchema)),
  // ... more routes
});
```

### 3. Add shadcn/ui Components

```bash
pnpm dlx shadcn@latest add <component-name> -c apps/web
```

## Environment Variables

### Root (.env)

```bash
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-secret-key
```

### API (apps/api/.env)

```bash
DATABASE_URL="file:./dev.db"
PORT=3000
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

### Web (apps/web/.env)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind v4 |
| UI Components | shadcn/ui, Radix UI |
| State | Zustand |
| i18n | next-intl |
| Backend | Hono, oRPC |
| ORM | Prisma |
| Database | SQLite (default), PostgreSQL |
| Auth | Better Auth |
| Validation | Zod |
| Build System | Turbo, pnpm workspaces |

## Switching to PostgreSQL

1. Update `apps/api/.env`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"
```

2. Update `apps/api/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Update `apps/api/src/libs/auth.ts`:
```typescript
database: prismaAdapter(prisma, {
  provider: "postgresql",
}),
```

4. Run migrations:
```bash
pnpm db:push
```

## License

MIT
