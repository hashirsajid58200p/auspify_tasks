import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy practices and data protection standards for Job Portal.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl border-3 border-black bg-[#2F81F7] text-white flex items-center justify-center mx-auto mb-4 shadow-neo-sm">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground font-medium mt-2">Last updated: September 2026</p>
      </div>

      <Card>
        <CardContent className="p-6 md:p-10 space-y-6 text-foreground leading-relaxed font-medium">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">1. Data Architecture & Integrity</h2>
            <p className="text-muted-foreground text-sm">
              Job Portal stores profile information, verified company records, and application
              status histories inside MongoDB Atlas. At the moment an application is submitted, a
              point-in-time snapshot of the candidate&apos;s profile is captured and preserved to
              guarantee candidate data integrity for the reviewing employer.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              2. External Links & Zero File Storage
            </h2>
            <p className="text-muted-foreground text-sm">
              We do not accept or store uploaded PDF, Word, or binary files. Candidate portfolio and
              resume references must be external HTTPS links provided by the job seeker. Company
              logos must originate from pre-approved secure host domains.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">3. Security & Cookie Usage</h2>
            <p className="text-muted-foreground text-sm">
              Authentication tokens (short-lived access tokens and rotated refresh tokens) are held
              exclusively in strict httpOnly, SameSite, secure cookies. Session replay detection
              terminates entire token families if reuse is identified.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">4. Account Deletion & Rights</h2>
            <p className="text-muted-foreground text-sm">
              Users can delete their account at any time via Account Settings. Employers with active
              published listings are required to archive listings before account termination.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
