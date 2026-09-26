"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Wallet,
  Settings,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: PieChart,
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: Wallet,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-sidebar/70 backdrop-blur-md z-30">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border/70">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-serif text-lg font-bold shadow-xs transition-transform group-hover:scale-105">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-medium tracking-tight text-foreground">
              Auspify
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans -mt-1 font-semibold">
              Expense Tracker
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col justify-between px-3 py-6 overflow-y-auto">
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Promo / Insight Widget in Sidebar */}
        <div className="mt-auto pt-6">
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Pro Tip</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Set category budgets to receive automated 80% and 100% warning
              alerts.
            </p>
            <Link
              href="/budgets"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
            >
              <span>Manage budgets</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
