"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Icons } from "@workspace/ui/components/icons";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@workspace/ui/components/card";

export function UserMenu() {
  const router = useRouter();
  const { isAuthenticated, user, clearAuth, _hasHydrated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { orpcClient } = await import("@/lib/orpc/orpc.client");
      await orpcClient.auth.logout({});
      clearAuth();
      setIsOpen(false);
      router.push("/auth/login");
    } catch {
      clearAuth();
      router.push("/auth/login");
    }
  };

  // Wait for Zustand to rehydrate from localStorage before rendering auth-dependent UI
  if (!_hasHydrated) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Icons.user className="h-4 w-4" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button asChild variant="default" size="sm">
        <Link href="/auth/login">Login</Link>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Icons.user className="h-4 w-4" />
        {user && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-64 z-50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <CardDescription className="text-xs">{user?.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <Link href="/profile">
                  <Icons.user className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                size="sm"
                onClick={handleLogout}
              >
                <Icons.logout className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
