"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, LogOut, Settings as SettingsIcon } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Financial Overview",
    subtitle: "Real-time summary of your income, expenses, and savings.",
  },
  "/transactions": {
    title: "Transactions",
    subtitle: "Manage, filter, and track all your incoming and outgoing funds.",
  },
  "/reports": {
    title: "Reports & Analytics",
    subtitle: "Detailed breakdowns, category analysis, and exports.",
  },
  "/budgets": {
    title: "Monthly Budgets",
    subtitle: "Monitor category limits with proactive 80% and 100% warnings.",
  },
  "/settings": {
    title: "Account Settings",
    subtitle: "Profile, currency, security, devices, and data management.",
  },
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<{ name: string; email: string } | null>(null);

  React.useEffect(() => {
    fetchApi<{ name: string; email: string }>("/api/auth/me")
      .then((data) => setUser(data))
      .catch(() => {
        // Unauthenticated or redirecting
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetchApi("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const displayName = user?.name || "My Account";
  const displayEmail = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const current = titles[pathname] || {
    title: "Expense Tracker",
    subtitle: "Personal finance management.",
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur-md">
      {/* Mobile Branding (only visible when sidebar is hidden) */}
      <div className="flex lg:hidden items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-serif text-base font-bold shadow-xs">
            A
          </div>
          <span className="font-serif text-lg font-medium tracking-tight text-foreground">
            Auspify
          </span>
        </Link>
      </div>

      {/* Desktop Page Title */}
      <div className="hidden lg:flex flex-col">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          {current.title}
        </h1>
        <p className="text-xs text-muted-foreground">{current.subtitle}</p>
      </div>

      {/* Right Controls: Theme Toggle & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="lg:hidden">
          <ThemeToggle />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 rounded-full px-2 gap-2 border border-border/60 hover:bg-accent focus-visible:ring-1"
            >
              <Avatar className="size-7 border border-border">
                <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                  {initials || "US"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-block text-xs font-medium text-foreground max-w-[120px] truncate">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">
                  {displayName}
                </p>
                {displayEmail && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="cursor-pointer flex items-center gap-2"
              >
                <SettingsIcon className="size-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="cursor-pointer flex items-center gap-2"
              >
                <User className="size-4" />
                <span>Profile & Currency</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
