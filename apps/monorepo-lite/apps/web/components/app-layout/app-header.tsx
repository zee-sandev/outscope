"use client";

import {
  Header,
  HeaderLeft,
  HeaderRight,
} from "@workspace/ui/components/header";
import { Text } from "@workspace/ui/components/text";
import { ThemeToggle } from "@workspace/ui/components/theme-toggle";
import { usePathname } from "next/navigation";

import { SIDEBAR_MENU_ITEMS } from "@/components/app-layout/constants/menu";
import { useTranslateWithFallback } from "@/lib/i18n";
import { UserMenu } from "@/components/user-menu";

export function AppHeader() {
  const pathname = usePathname();
  const t = useTranslateWithFallback();
  const sidebarKey =
    SIDEBAR_MENU_ITEMS.find((m) => m.href === pathname)?.i18nToken ||
    "layout.sidebar.home";
  const titleKey = sidebarKey.replace(/^layout\.sidebar\./, "layout.header.");
  return (
    <Header>
      <HeaderLeft>
        <Text as="h1" size="H3" weight="bold">
          {t(titleKey, "Template Project")}
        </Text>
      </HeaderLeft>

      <HeaderRight>
        <ThemeToggle />
        <UserMenu />
      </HeaderRight>
    </Header>
  );
}
