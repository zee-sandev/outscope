"use client";

import { Icons } from "@workspace/ui/components/icons";
import { AppLayoutSidebar } from "@workspace/ui/components/layout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Text } from "@workspace/ui/components/text";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SIDEBAR_MENU_ITEMS,
  SIDEBAR_FOOTER_ITEM,
  APP_CONFIG,
} from "@/components/app-layout/constants/menu";
import { useTranslateWithFallback } from "@/lib/i18n";

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslateWithFallback();
  return (
    <AppLayoutSidebar>
      <Sidebar>
        <SidebarHeader>
          {(() => {
            const IconComponent = Icons[APP_CONFIG.logo];
            return <IconComponent className="h-6 w-6" />;
          })()}
          <Text as="h2" size="H4" weight="bold">
            {t(APP_CONFIG.i18nKey)}
          </Text>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {SIDEBAR_MENU_ITEMS.map((item) => {
              const IconComponent = item.icon ? Icons[item.icon] : undefined;
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.id} isActive={isActive}>
                  <Link href={item.href ?? "#"}>
                    <SidebarMenuButton isActive={isActive}>
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <Text
                        as="span"
                        size="B2"
                        weight={isActive ? "bold" : "regular"}
                      >
                        {t(item.i18nToken, item.fallbackLabel)}
                      </Text>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenuButton>
            {(() => {
              const iconName = SIDEBAR_FOOTER_ITEM.icon;
              if (!iconName) return null;

              const IconComponent = Icons[iconName];
              return <IconComponent className="h-4 w-4" />;
            })()}

            <Text as="span" size="B2">
              {t(
                SIDEBAR_FOOTER_ITEM.i18nToken,
                SIDEBAR_FOOTER_ITEM.fallbackLabel,
              )}
            </Text>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
    </AppLayoutSidebar>
  );
}
