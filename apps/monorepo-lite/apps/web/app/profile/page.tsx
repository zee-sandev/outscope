"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ProtectedRoute } from "@/lib/auth/protected-route";
import { formatDate } from "@/lib/utils/date";

interface UserProfile {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date | string;
    activeOrganizationId?: string | null;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

function ProfilePageContent() {
  const router = useRouter();
  const { session, clearAuth, updateSession, setAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { orpcClient } = await import("@/lib/orpc/orpc.client");

        const response = await orpcClient.auth.me({});

        setProfile(response);

        // Update auth store with latest data (preserve token from current session)
        const currentSession = useAuthStore.getState().session;
        setAuth(
          response.user,
          { ...response.session, token: currentSession?.token || '' },
          response.organizations
        );
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [setAuth]);

  const handleLogout = async () => {
    try {
      const { orpcClient } = await import("@/lib/orpc/orpc.client");
      await orpcClient.auth.logout({});
      clearAuth();
      router.push("/auth/login");
    } catch {
      // Even if logout fails, clear local auth
      clearAuth();
      router.push("/auth/login");
    }
  };

  const handleSwitchOrganization = (organizationId: string) => {
    if (session) {
      updateSession({
        ...session,
        activeOrganizationId: organizationId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile && (
            <>
              <div>
                <label className="text-sm font-medium">Name:</label>
                <p className="text-lg">{profile.user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email:</label>
                <p className="text-lg">{profile.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email Verified:</label>
                <p className="text-lg">{profile.user.emailVerified ? "Yes" : "No"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">User ID:</label>
                <p className="text-sm text-muted-foreground">{profile.user.id}</p>
              </div>
            </>
          )}

          <div className="pt-4">
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Your current session information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session && (
            <>
              <div>
                <label className="text-sm font-medium">Session ID:</label>
                <p className="text-sm text-muted-foreground">{session.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Expires At:</label>
                <p className="text-sm">{formatDate(session.expiresAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Active Organization:</label>
                <p className="text-sm">{session.activeOrganizationId || "None"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Organizations you belong to</CardDescription>
        </CardHeader>
        <CardContent>
          {profile && profile.organizations.length > 0 ? (
            <div className="space-y-2">
              {profile.organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {org.slug} • {org.role}
                    </p>
                  </div>
                  {session?.activeOrganizationId !== org.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSwitchOrganization(org.id)}
                    >
                      Switch
                    </Button>
                  )}
                  {session?.activeOrganizationId === org.id && (
                    <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No organizations yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
