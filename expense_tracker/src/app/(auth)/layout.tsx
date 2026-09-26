import Link from "next/link";
import { Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-medium tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
          <span>ExpenseTracker</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        &copy; {new Date().getFullYear()} Expense Tracker. Multi-tenant Personal Finance.
      </footer>
    </div>
  );
}
