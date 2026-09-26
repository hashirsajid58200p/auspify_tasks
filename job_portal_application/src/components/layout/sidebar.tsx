"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileText,
  Bookmark,
  User,
  PlusCircle,
  Users,
  Shield,
  Tag,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem, NavIconName } from "@/components/layout/nav-config";

const ICON_MAP: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  jobs: Briefcase,
  companies: Building2,
  applications: FileText,
  "saved-jobs": Bookmark,
  profile: User,
  "post-job": PlusCircle,
  users: Users,
  moderation: Shield,
  categories: Tag,
  "audit-logs": History,
  settings: Settings,
};

interface SidebarProps {
  items: NavItem[];
  roleLabel: string;
  roleBadgeVariant?: "blue" | "yellow" | "coral" | "default";
  onNavigate?: () => void;
}

export function Sidebar({ items, roleLabel, roleBadgeVariant = "blue", onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-white dark:bg-[#121212] border-r-2 md:border-r-[3px] border-black dark:border-white/30 p-5 overflow-y-auto">
      {/* Brand & Role Tag */}
      <div className="flex flex-col gap-3 pb-6 border-b-2 border-black dark:border-white/20">
        <BrandLogo />
        <div>
          <Badge
            variant={roleBadgeVariant}
            className="uppercase tracking-wider text-[11px] px-2.5 py-0.5"
          >
            {roleLabel} Portal
          </Badge>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-6 space-y-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider px-2">
            Navigation
          </p>
          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
              const isActive =
                pathname === item.href ||
                (item.href !== "/employer" &&
                  item.href !== "/admin" &&
                  item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200",
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white shadow-neo-sm"
                      : "text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-transparent hover:border-black/20",
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto bg-[#FF6B7A] text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-black">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Quick Public Link */}
      <div className="pt-4 border-t-2 border-black/10 dark:border-white/10">
        <Link
          href="/jobs"
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-between px-2 py-1 transition-colors"
        >
          <span>View Public Job Board</span>
          <span>→</span>
        </Link>
      </div>
    </aside>
  );
}
