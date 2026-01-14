"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { useAuthStore } from "@/lib/stores/auth.store";

export default function HomePage() {
  const t = useTranslations("home");
  const { isAuthenticated, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight">
            {isHydrated && isAuthenticated && user ? `Welcome back, ${user.name}!` : t("welcome")}
          </h1>
          {isHydrated && isAuthenticated && (
            <Badge variant="default" className="h-6">
              Authenticated
            </Badge>
          )}
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Full-stack monorepo template with Next.js 15, Hono, oRPC, Prisma, and authentication.
          Production-ready with type-safe APIs and modern UI components.
        </p>
      </div>

      {/* Quick Actions */}
      {isHydrated && !isAuthenticated && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create an account or login to explore all features
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/auth/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Authentication Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Authentication
            </CardTitle>
            <CardDescription>
              JWT-based auth with Better Auth, session management, and organization support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isHydrated && isAuthenticated ? (
              <>
                <Button asChild className="w-full">
                  <Link href="/profile">View Profile</Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Manage your account and organizations
                </p>
              </>
            ) : (
              <>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* API Documentation Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              API Documentation
            </CardTitle>
            <CardDescription>
              Interactive Swagger UI for exploring and testing API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" variant="secondary">
              <a
                href={apiBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Swagger UI
              </a>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <a
                href={`${apiBaseUrl}/openapi.json`}
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAPI Spec
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Getting Started Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Quick Start
            </CardTitle>
            <CardDescription>
              Start building your application with this template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>1. Add your features in <code className="text-xs bg-muted px-1 rounded">apps/api/src/features/</code></li>
              <li>2. Define contracts in <code className="text-xs bg-muted px-1 rounded">apps/api/src/contracts/</code></li>
              <li>3. Create pages in <code className="text-xs bg-muted px-1 rounded">apps/web/app/</code></li>
              <li>4. Use shared UI from <code className="text-xs bg-muted px-1 rounded">@workspace/ui</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technology Stack */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Technology Stack</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Frontend Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frontend</CardTitle>
              <CardDescription>Modern React ecosystem</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Next.js 15</Badge>
                  <span className="text-muted-foreground">App Router + Turbopack</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">React 19</Badge>
                  <span className="text-muted-foreground">Latest features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">shadcn/ui</Badge>
                  <span className="text-muted-foreground">Beautiful components</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Tailwind v4</Badge>
                  <span className="text-muted-foreground">Utility-first CSS</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Zustand</Badge>
                  <span className="text-muted-foreground">State management</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Backend Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Backend</CardTitle>
              <CardDescription>Type-safe API development</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Hono</Badge>
                  <span className="text-muted-foreground">Ultrafast web framework</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">oRPC</Badge>
                  <span className="text-muted-foreground">End-to-end type safety</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Prisma</Badge>
                  <span className="text-muted-foreground">Type-safe ORM</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Better Auth</Badge>
                  <span className="text-muted-foreground">Authentication</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">SQLite</Badge>
                  <span className="text-muted-foreground">Database (swappable)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* DevEx Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Developer Experience</CardTitle>
              <CardDescription>Best-in-class tooling</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">pnpm</Badge>
                  <span className="text-muted-foreground">Fast package manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Turbo</Badge>
                  <span className="text-muted-foreground">Monorepo build system</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">TypeScript</Badge>
                  <span className="text-muted-foreground">Type safety everywhere</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">ESLint</Badge>
                  <span className="text-muted-foreground">Code quality</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary">Prettier</Badge>
                  <span className="text-muted-foreground">Code formatting</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Getting Started */}
      {isHydrated && !isAuthenticated && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Ready to Get Started?</CardTitle>
            <CardDescription>
              Create an account to explore all features of this template
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/auth/register">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
