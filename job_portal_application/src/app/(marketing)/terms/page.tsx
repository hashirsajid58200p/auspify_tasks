import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing usage of Job Portal.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl border-3 border-black bg-[#FFC224] text-black flex items-center justify-center mx-auto mb-4 shadow-neo-sm">
          <FileText className="w-7 h-7" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground font-medium mt-2">Last updated: September 2026</p>
      </div>

      <Card>
        <CardContent className="p-6 md:p-10 space-y-6 text-foreground leading-relaxed font-medium">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">1. User Roles & Conduct</h2>
            <p className="text-muted-foreground text-sm">
              Users may register as either a Job Seeker or an Employer. Role privileges are strictly
              bounded: job seekers cannot post vacancies, and employers cannot apply to postings.
              Platform administration privileges are granted only through audited administrative
              delegation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              2. Application State Machine Integrity
            </h2>
            <p className="text-muted-foreground text-sm">
              Job applications are governed by an unalterable server-side finite state machine.
              Candidate withdrawals and employer status advancements must follow legal state paths.
              Duplicate applications for the same job posting are rejected by database uniqueness
              invariants.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">3. Employer Responsibilities</h2>
            <p className="text-muted-foreground text-sm">
              Employers must provide accurate company information and valid job descriptions. All
              job descriptions, bios, and communications must remain free of malicious scripts or
              unsafe HTML content.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
