import {
  Menu,
  Home,
  BookOpen,
  Settings,
  User,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  FileText,
  Package,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  menu: Menu,
  home: Home,
  book: BookOpen,
  settings: Settings,
  user: User,
  search: Search,
  bell: Bell,
  moon: Moon,
  sun: Sun,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  plus: Plus,
  close: X,
  fileText: FileText,
  package: Package,
  logout: LogOut,
} as const;

export type IconName = keyof typeof Icons;
