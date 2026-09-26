import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <BrandLogo />
            <p className="max-w-sm text-xs md:text-sm text-muted-foreground leading-relaxed">
              EduFlow is a modern Learning Management System providing structured courses,
              interactive video lessons, server-graded quizzes, assignments, and verified certificates.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
              <li>
                <Link href="/courses" className="hover:text-foreground transition-colors">
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-foreground transition-colors">
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
              Legal & Policies
            </h4>
            <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EduFlow LMS. All rights reserved.</p>
          <p>Built for Auspify Internship Task 6.</p>
        </div>
      </div>
    </footer>
  );
}
