import { Icons } from "@workspace/ui/components/icons";

export interface MenuItem {
  id: string;
  fallbackLabel: string;
  i18nToken: string;
  icon?: keyof typeof Icons;
  href: string;
}
