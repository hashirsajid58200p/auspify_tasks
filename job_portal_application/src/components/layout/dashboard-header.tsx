"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, User, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { NavItem } from "@/components/layout/nav-config";

interface DashboardHeaderProps {
  navItems: NavItem[];
  roleLabel: string;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
}

export function DashboardHeader({
  navItems,
  roleLabel,
  userName = "Active User",
  userEmail = "user@example.com",
  userInitials = "AU",
}: DashboardHeaderProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b-2 md:border-b-[3px] border-black dark:border-white/30 bg-white/95 dark:bg-[#121212]/95 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Sheet */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-xl border-2 border-black"
                aria-label="Open navigation sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <Sidebar
                items={navItems}
                roleLabel={roleLabel}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Welcome / Role indicator on desktop */}
        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-bold text-foreground">{roleLabel} Console</span>
          <span className="text-xs text-muted-foreground font-medium">
            Welcome back, {userName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <ThemeToggle />

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-2xl border-2 border-black dark:border-white/50 p-1.5 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-neo-sm outline-none cursor-pointer">
              <Avatar className="h-9 w-9 border-2 border-black">
                <AvatarFallback className="text-xs font-bold bg-[#FFC224] text-black">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-xs sm:block pr-2">
                <p className="font-bold text-foreground leading-tight">{userName}</p>
                <p className="text-[11px] text-muted-foreground font-semibold capitalize">
                  {roleLabel.toLowerCase()}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-bold leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground font-medium leading-none">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-[#E7000B]"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
