"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  userRole?: "ADMIN" | "STAFF";
}

export function BottomNav({ userRole = "ADMIN" }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = MAIN_NAV_ITEMS.filter((item) => {
    if (item.adminOnly && userRole !== "ADMIN") return false;
    return true;
  });

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm px-1 py-1 safe-bottom shadow-lg">
      <div className="flex items-center justify-around w-full">
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
                "flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[52px] rounded-md transition-colors",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-md transition-all",
                  isActive && "bg-secondary text-primary",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
