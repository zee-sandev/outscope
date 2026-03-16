import {
  AppLayout,
  AppLayoutMain,
  AppLayoutContent,
} from "@workspace/ui/components/layout";
import { AppSidebar } from "@/components/app-layout/app-sidebar";
import { AppHeader } from "@/components/app-layout/app-header";
import { ProtectedRoute } from "@/lib/auth/protected-route";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AppSidebar />
        <AppLayoutMain>
          <AppHeader />
          <AppLayoutContent>{children}</AppLayoutContent>
        </AppLayoutMain>
      </AppLayout>
    </ProtectedRoute>
  );
}
