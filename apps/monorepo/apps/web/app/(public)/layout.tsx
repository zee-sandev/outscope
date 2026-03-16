import {
  AppLayout,
  AppLayoutMain,
  AppLayoutContent,
} from "@workspace/ui/components/layout";
import { AppSidebar } from "@/components/app-layout/app-sidebar";
import { AppHeader } from "@/components/app-layout/app-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <AppSidebar />
      <AppLayoutMain>
        <AppHeader />
        <AppLayoutContent>{children}</AppLayoutContent>
      </AppLayoutMain>
    </AppLayout>
  );
}
