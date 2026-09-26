"use client";

import { Menu, Search, LogOut, User } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  userEmail = "user@eduflow.local",
  userInitials = "AU",
}: DashboardHeaderProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-4 md:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Sheet */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open sidebar menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
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

        {/* Global Search Box */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses, lessons..."
            className="pl-9 pr-12 h-9 text-xs bg-card border-border rounded-xl focus-visible:ring-1"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-block px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-full p-1 transition-all hover:bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-xs sm:block pr-1">
                <p className="font-semibold text-foreground leading-tight">{userName}</p>
                <p className="text-[10px] text-muted-foreground leading-tight capitalize">
                  {roleLabel.toLowerCase()}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{userName}</p>
                <p className="text-xs text-muted-foreground leading-none">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-destructive cursor-pointer"
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
