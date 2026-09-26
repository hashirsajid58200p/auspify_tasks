import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CheckCircle, ExternalLink, Printer, ShieldCheck } from "lucide-react";
import { getCertificateById } from "@/server/services/certificates";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Certificate of Completion | EduFlow LMS",
  robots: {
    index: false,
    follow: false,
  },
};

interface CertificatePageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { id } = await params;

  let cert;
  try {
    cert = await getCertificateById(id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4 sm:px-6 flex flex-col items-center justify-center font-sans print:bg-white print:p-0">
      {/* Top action toolbar (hidden on print) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/certificates"
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Certificates
        </Link>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs"
            asChild
          >
            <Link href={`/verify?code=${cert.code}`} target="_blank">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Verify Link
            </Link>
          </Button>

          <Button
            size="sm"
            className="rounded-xl text-xs shadow-xs"
            // Simple inline print handler
            asChild
          >
            <a href="javascript:window.print()">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save as PDF
            </a>
          </Button>
        </div>
      </div>

      {/* Certificate Frame */}
      <div className="w-full max-w-4xl bg-card border-8 border-double border-primary/20 rounded-3xl p-8 sm:p-14 shadow-xl text-center relative overflow-hidden print:border-4 print:shadow-none print:rounded-none print:w-full">
        {/* Subtle background seal */}
        <div className="absolute right-6 top-6 opacity-5 pointer-events-none">
          <Award className="w-64 h-64 text-primary" />
        </div>

        {/* Certificate Header */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-2">
            <Award className="w-8 h-8" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-semibold text-primary">
            EduFlow Learning Platform
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-foreground">
            Certificate of Completion
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground italic">
            This credential is officially conferred upon
          </p>
        </div>

        {/* Recipient Name */}
        <div className="my-8 py-4 border-b border-border/60 max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {cert.studentName}
          </h2>
        </div>

        {/* Course details */}
        <div className="space-y-4 max-w-xl mx-auto">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            for successfully mastering all lectures, demonstrating comprehension on assessed quizzes, and submitting required project coursework in:
          </p>

          <h3 className="text-xl sm:text-2xl font-bold text-primary">
            {cert.course.title}
          </h3>

          <p className="text-xs text-muted-foreground">
            Course curriculum verified under the direction of{" "}
            <span className="font-semibold text-foreground">
              {cert.course.instructorName}
            </span>
          </p>
        </div>

        {/* Signatures & Verification metadata */}
        <div className="mt-14 pt-8 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">
              Conferred Date
            </p>
            <p className="text-xs font-semibold text-foreground">
              {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 text-2xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Credential
            </div>
            <p className="font-mono text-xs font-bold text-foreground tracking-wider">
              {cert.code}
            </p>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">
              Issuing Organization
            </p>
            <p className="text-xs font-semibold text-foreground">
              EduFlow LMS Academic Board
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
