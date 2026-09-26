import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldAlert,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Students",
    href: "/students",
    icon: Users,
  },
  {
    title: "Classes",
    href: "/classes",
    icon: GraduationCap,
  },
  {
    title: "Staff",
    href: "/admin/staff",
    icon: ShieldAlert,
    adminOnly: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
