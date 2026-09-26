import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service | Auspify Expense Tracker",
  description: "Terms and conditions of use for Auspify Expense Tracker.",
};

export default function TermsPage() {
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
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-serif font-medium text-sm">Terms of Service</span>
        </div>
      </header>

      <main className="w-full max-w-3xl px-4 py-12 space-y-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#37322F]">
            Terms of Service
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: September 2026 • Effective immediately
          </p>
        </div>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            1. Acceptance of Terms
          </h2>
          <p>
            By creating an account or accessing the Auspify Expense Tracker, you agree
            to be bound by these Terms of Service. If you disagree with any part of
            these terms, you may not access or use the application.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            2. Permitted Use & Security Expectations
          </h2>
          <p>
            Auspify is designed for personal expense tracking and financial cash
            flow analysis. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              Attempt unauthorized access to other tenants&apos; data or reverse engineer
              authentication token signing keys.
            </li>
            <li>
              Launch automated NoSQL injection payloads or distributed denial of
              service attacks against our API gateways.
            </li>
            <li>
              Abuse the public demo account by transmitting defamatory, abusive, or
              illicit financial records.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            3. Disclaimer of Financial Advice
          </h2>
          <p>
            Auspify Expense Tracker is an informational tool for tracking personal
            cash flows and budgeting metrics. Auspify does not provide certified
            financial, investment, legal, or tax advisory services. All calculations,
            savings rate percentages, and automated insights are provided strictly
            for general personal planning purposes.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            4. Service Availability & Modifications
          </h2>
          <p>
            We strive for 99.9% uptime. However, we reserve the right to perform
            routine database indexing maintenance or updates without prior notice.
            Users may export their full database history in JSON format at any time
            to maintain independent off-site backups.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[rgba(55,50,47,0.85)] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#37322F]">
            5. Termination
          </h2>
          <p>
            You may terminate your agreement with Auspify at any time by executing
            account deletion in your Account Settings. Upon termination, all personal
            and financial data will be permanently purged from our systems.
          </p>
        </section>
      </main>

      <footer className="w-full border-t border-[rgba(55,50,47,0.08)] py-8 px-4 text-xs text-muted-foreground text-center mt-auto">
        © {new Date().getFullYear()} Auspify Expense Tracker. All rights reserved.
      </footer>
    </div>
  );
}
