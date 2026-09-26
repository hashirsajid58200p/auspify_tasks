"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { MAIN_NAV_ITEMS, NavItem } from "./nav-config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  userRole?: "ADMIN" | "STAFF";
  userName?: string;
  userEmail?: string;
}

export function Sidebar({
  userRole = "ADMIN",
  userName = "Staff Administrator",
  userEmail = "admin@school.internal",
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = MAIN_NAV_ITEMS.filter((item) => {
    if (item.adminOnly && userRole !== "ADMIN") return false;
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <span className="font-semibold text-sm tracking-tight text-foreground block">
            EduManage SMS
          </span>
          <span className="text-xs text-muted-foreground block -mt-0.5">Internal Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
              {item.adminOnly && (
                <Badge
                  variant="outline"
                  className="ml-auto text-[10px] py-0 px-1 font-mono uppercase"
                >
                  Admin
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent/50">
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-border flex items-center justify-center text-xs font-semibold text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
          </div>
          <Badge
            variant={userRole === "ADMIN" ? "default" : "secondary"}
            className="text-[10px] px-1.5 py-0 uppercase"
          >
            {userRole}
          </Badge>
        </div>
      </div>
    </aside>
  );
}
