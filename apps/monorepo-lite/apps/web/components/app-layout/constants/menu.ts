import { Icons } from "@workspace/ui/components/icons";

import { MenuItem } from "../type/menu";

export const SIDEBAR_MENU_ITEMS: MenuItem[] = [
  {
    id: "home",
    fallbackLabel: "Home",
    i18nToken: "layout.sidebar.home",
    icon: "home",
    href: "/",
  },
  {
    id: "posts",
    fallbackLabel: "Posts",
    i18nToken: "menu.posts",
    icon: "fileText",
    href: "/posts",
  },
];

export const SIDEBAR_FOOTER_ITEM: MenuItem = {
  id: "profile",
  fallbackLabel: "Profile",
  i18nToken: "menu.profile",
  icon: "user",
  href: "/profile",
};

export const HEADER_CONFIG = {
  searchPlaceholder: "Search...",
};

export const APP_CONFIG = {
  name: "Template Project",
  i18nKey: "app.name" as const,
  logo: "package" as keyof typeof Icons,
};
