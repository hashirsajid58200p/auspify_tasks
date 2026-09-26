import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy | Auspify Expense Tracker",
  description: "Privacy and data protection policy for Auspify Expense Tracker.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F3] text-[#37322F] flex flex-col items-center">
      <header className="w-full max-w-4xl px-4 py-8 flex items-center justify-between border-b border-[rgba(55,50,47,0.08)]">
        <Button variant="ghost" size="sm" asChild className="text-xs gap-1.5 rounded-full">
          <Link href="/">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-serif font-medium text-sm">Privacy & Security</span>
        </div>
      </header>

      <main className="w-full max-w-3xl px-4 py-12 space-y-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#37322F]">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: September 2026 • Effective immediately
          </p>
        </div>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            1. Overview & Commitment
          </h2>
          <p>
            Auspify (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the Auspify Expense Tracker web
            application. We are committed to safeguarding the privacy and financial
            records of our users. We do not sell, rent, monetize, or share your
            financial data with third-party advertisers or data brokers.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            2. Data We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Account Information:</strong> Your name and email address.
            </li>
            <li>
              <strong>Authentication Credentials:</strong> Password hashes derived
              via one-way argon2id cryptography. We never store plain text passwords.
            </li>
            <li>
              <strong>Financial Records:</strong> Transaction amounts (stored in
              integer minor units), dates, categories, and optional notes.
            </li>
            <li>
              <strong>Security & Session Metadata:</strong> Device User-Agent strings,
              truncated IP addresses, and JWT refresh token identifiers (JTI) for
              session management and replay attack prevention.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            3. Cookies & Session Storage
          </h2>
          <p>
            We use strictly functional, essential <code className="bg-muted px-1 py-0.5 rounded text-xs">httpOnly</code> cookies
            to authenticate API requests. These cookies are configured with
            <code className="bg-muted px-1 py-0.5 rounded text-xs ml-1">SameSite=Lax</code> (for access tokens) and
            <code className="bg-muted px-1 py-0.5 rounded text-xs ml-1">SameSite=Strict</code> (for refresh tokens). We do
            not deploy marketing, tracking, or third-party behavioral analytics cookies.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            4. Data Portability & The Right to Erasure
          </h2>
          <p>
            Under GDPR and consumer privacy frameworks, you have full ownership of your data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Export:</strong> You may download your entire database history
              at any time in structured JSON or sanitized CSV format via the Account Settings page.
            </li>
            <li>
              <strong>Deletion:</strong> You may permanently purge your account at
              any time with password confirmation. Account deletion initiates an immediate,
              irreversible cascade deletion that purges your user profile, active sessions,
              categories, transactions, and budgets from MongoDB Atlas.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            5. Contact
          </h2>
          <p>
            For inquiries regarding data protection and security audits, contact us
            at <code className="bg-muted px-1 py-0.5 rounded text-xs">privacy@auspify.com</code>.
          </p>
        </section>
      </main>

      <footer className="w-full border-t border-[rgba(55,50,47,0.08)] py-8 px-4 text-xs text-muted-foreground text-center mt-auto">
        © {new Date().getFullYear()} Auspify Expense Tracker. All rights reserved.
      </footer>
    </div>
  );
}
