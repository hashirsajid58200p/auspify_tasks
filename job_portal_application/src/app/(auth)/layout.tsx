import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 bg-neutral-50 dark:bg-neutral-950">
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto pb-6">
        <BrandLogo showTagline />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-black/30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to site</span>
          </Link>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center py-6 w-full max-w-md mx-auto">
        {children}
      </main>

      <footer className="text-center py-6 text-xs font-semibold text-muted-foreground">
        © {new Date().getFullYear()} Job Portal Application. Auspify Internship Task 5.
      </footer>
    </div>
  );
}
