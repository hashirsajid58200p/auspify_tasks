"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  PlusCircle,
  LogIn,
  UserPlus,
  ArrowRight,
  Building2,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { publicNavItems } from "./nav-config";
import { cn } from "@/lib/utils";

interface PublicNavbarProps {
  user?: {
    name: string;
    role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN";
    email: string;
  } | null;
}

export function PublicNavbar({ user }: PublicNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === "EMPLOYER") return "/employer";
    if (user.role === "ADMIN") return "/admin";
    return "/dashboard";
  };

  return (
    <header className="sticky top-4 z-40 w-full px-4 mb-6">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between bg-white dark:bg-[#191919] border-2 md:border-4 border-black dark:border-white/50 rounded-2xl md:rounded-full px-4 md:px-6 py-2.5 shadow-neo transition-all">
          <BrandLogo />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7">
            {publicNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-base font-bold transition-all hover:text-[#2F81F7]",
                    isActive
                      ? "text-[#2F81F7] underline underline-offset-4 decoration-2"
                      : "text-foreground",
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>

          {/* Actions & Theme */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <Button asChild size="default" className="rounded-full">
                <Link href={getDashboardHref()} className="flex items-center gap-2">
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/login" className="flex items-center gap-1.5">
                    <LogIn className="w-4 h-4" />
                    <span>Log in</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/register" className="flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign up</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation Drawer Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-xl border-2 border-black"
                  aria-label="Open Navigation Menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] flex flex-col justify-between">
                <div>
                  <SheetHeader>
                    <SheetTitle>
                      <BrandLogo />
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-3 py-6">
                    {publicNavItems.map((item) => {
                      const Icon = item.iconName === "companies" ? Building2 : Briefcase;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-black text-base font-bold transition-all",
                            isActive
                              ? "bg-black text-white dark:bg-white dark:text-black shadow-neo-sm"
                              : "bg-white dark:bg-[#191919] hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pb-6 border-t-2 border-black/10 pt-6">
                  {user ? (
                    <Button asChild className="w-full">
                      <Link
                        href={getDashboardHref()}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2"
                      >
                        <span>Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="w-full">
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Log in</span>
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link
                          href="/register"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Create Account</span>
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
