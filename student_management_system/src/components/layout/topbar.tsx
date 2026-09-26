"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  userRole?: "ADMIN" | "STAFF";
  userName?: string;
  onLogout?: () => void;
}

export function Topbar({
  userRole = "ADMIN",
  userName = "Staff Administrator",
  onLogout,
}: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6">
      {/* Mobile Branding (hidden on md and above where sidebar shows) */}
      <div className="flex md:hidden items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-sm tracking-tight text-foreground block">
            EduManage SMS
          </span>
        </div>
      </div>

      {/* Desktop Context Title */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          School Administrative System
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge
          variant={userRole === "ADMIN" ? "default" : "secondary"}
          className="text-xs font-mono uppercase hidden sm:inline-flex"
        >
          {userRole}
        </Badge>

        <ThemeToggle />

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-xs gap-1.5 h-9"
          title="Sign out of system"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
