import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border/60">
        <BrandLogo />
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        &copy; {new Date().getFullYear()} EduFlow LMS. Secure role-based learning platform.
      </footer>
    </div>
  );
}
