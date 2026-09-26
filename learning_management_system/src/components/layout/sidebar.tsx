"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  BookOpenCheck,
  Compass,
  Award,
  FileCheck,
  ClipboardCheck,
  Users,
  FolderTree,
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
  courses: BookOpen,
  builder: BookOpenCheck,
  catalog: Compass,
  grades: Award,
  certificates: FileCheck,
  submissions: ClipboardCheck,
  users: Users,
  categories: FolderTree,
  "audit-logs": History,
  settings: Settings,
};

interface SidebarProps {
  items: NavItem[];
  roleLabel: string;
  roleBadgeColor?: string;
  onNavigate?: () => void;
}

export function Sidebar({
  items,
  roleLabel,
  roleBadgeColor = "bg-primary/10 text-primary border-primary/20",
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside className="flex h-full w-64 flex-col bg-card border-r border-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-6 border-b border-border/60">
        <BrandLogo />
        <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5", roleBadgeColor)}>
          {roleLabel}
        </Badge>
      </div>

      <div className="flex-1 py-4 space-y-6">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  onMouseEnter={() => setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.title && !isActive && "translate-x-1"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
